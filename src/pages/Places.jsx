import { useEffect, useMemo, useRef, useState } from 'react';
import { PLACES, photoById } from '../data/content.js';
import { MAP, PROVINCES } from '../data/korea.js';
import { listPlaces, addPlace, deletePlace } from '../services/store.js';
import { SubHeader, Lightbox, Toast, useFamilyGate } from '../components/Common.jsx';

// 위도·경도 ↔ 지도(SVG) 좌표
const toXY = (lat, lng) => ({
  x: (lng - MAP.lng0) * MAP.cos * MAP.k + MAP.pad,
  y: (MAP.lat1 - lat) * MAP.k + MAP.pad,
});
const toLatLng = (x, y) => ({
  lng: (x - MAP.pad) / (MAP.cos * MAP.k) + MAP.lng0,
  lat: MAP.lat1 - (y - MAP.pad) / MAP.k,
});

const builtinPhotos = (place) => place.photos.map(photoById).filter(Boolean).map((p) => ({ src: p.src, caption: p.caption }));

// content.js에 좌표가 있는 장소는 처음부터 핀으로 보여요.
const BUILTIN_PINS = PLACES.filter((p) => p.lat != null).map((p) => ({
  id: `b-${p.id}`, name: p.name, note: p.note, lat: p.lat, lng: p.lng, photos: builtinPhotos(p),
}));

// 가족이 올린 핀(Firestore)을 화면용으로 바꿉니다. 'builtinId'가 있으면 content.js의 사진을 함께 보여 줘요.
const fromDoc = (d) => {
  const b = d.builtinId && PLACES.find((p) => p.id === d.builtinId);
  return {
    id: d.id, name: d.name, note: d.note || '', lat: d.lat, lng: d.lng, uploaded: true,
    photos: [...(b ? builtinPhotos(b) : []), ...(d.photos || []).map((p) => ({ src: p.src, caption: d.name }))],
  };
};

const EMPTY_FORM = { name: '', note: '', files: [], point: null, builtinId: null };

function Pin({ pin, index, active, disabled, onSelect }) {
  const { x, y } = toXY(pin.lat, pin.lng);
  const first = pin.photos[0];
  const cid = `pin-clip-${index}`;
  return (
    <g
      className={active ? 'map-pin active' : 'map-pin'}
      transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`}
      onClick={(e) => { if (disabled) return; e.stopPropagation(); onSelect(); }}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(); } }}
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={pin.name}
    >
      <path d="M0,0 L-7,-17 L7,-17 Z" fill="#fff" />
      <circle cy="-33" r="19" fill="#fff" className="map-pin-ring" />
      {first ? (
        <>
          <clipPath id={cid}><circle cy="-33" r="16" /></clipPath>
          <image href={first.src} x="-16" y="-49" width="32" height="32" clipPath={`url(#${cid})`} preserveAspectRatio="xMidYMid slice" />
        </>
      ) : (
        <text y="-27" textAnchor="middle" fontSize="18">📍</text>
      )}
      {pin.photos.length > 1 && (
        <g transform="translate(14,-48)">
          <circle r="8" fill="var(--accent)" />
          <text y="3.5" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{pin.photos.length}</text>
        </g>
      )}
      <text className="map-pin-label" y="15" textAnchor="middle">{pin.name}</text>
    </g>
  );
}

export default function Places() {
  const [docs, setDocs] = useState([]);
  const [sel, setSel] = useState('');
  const [mode, setMode] = useState('view'); // 'view' | 'add'
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [viewer, setViewer] = useState(null);
  const svgRef = useRef(null);
  const mapBox = useRef(null);
  const { require, gate } = useFamilyGate();

  const reload = () => listPlaces().then(setDocs);
  useEffect(() => { reload(); }, []);

  const pins = useMemo(
    () => [...BUILTIN_PINS, ...docs.map(fromDoc)].sort((a, b) => b.lat - a.lat), // 북쪽부터 그려서 남쪽 핀이 위에 오게
    [docs]
  );
  const selPin = pins.find((p) => p.id === sel);
  const unpinned = PLACES.filter((p) => p.lat == null && !docs.some((d) => d.builtinId === p.id));
  const adding = mode === 'add';

  const select = (id, scroll) => {
    setSel(id);
    if (scroll) setTimeout(() => mapBox.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  const startAdd = (place) => {
    setForm(place ? { ...EMPTY_FORM, name: place.name, note: place.note, builtinId: place.id } : EMPTY_FORM);
    setError('');
    setSel('');
    setMode('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelAdd = () => { setMode('view'); setForm(EMPTY_FORM); setError(''); };

  const onMapClick = (e) => {
    if (!adding || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    setForm((f) => ({ ...f, point: toLatLng(p.x, p.y) }));
  };

  const pick = (e) => {
    const list = [...e.target.files].filter((f) => f.type.startsWith('image/') && f.size <= 20 * 1024 * 1024);
    setForm((f) => ({ ...f, files: list }));
    setError(list.length !== e.target.files.length ? '사진 파일만, 20MB 이하로 올릴 수 있어요.' : '');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('장소 이름을 적어 주세요.');
    if (!form.files.length && !form.builtinId) return setError('사진을 한 장 이상 골라 주세요.');
    if (!form.point) return setError('아래 지도에서 그곳을 눌러 위치를 정해 주세요.');
    setBusy(true);
    try {
      await addPlace(form.files, {
        name: form.name.trim(), note: form.note.trim(), lat: form.point.lat, lng: form.point.lng, builtinId: form.builtinId,
      });
      await reload();
      cancelAdd();
      setToast('지도에 핀을 꽂았어요 📍');
    } catch {
      setError('저장에 실패했어요. 잠시 뒤 다시 해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (pin) => require(async () => {
    if (!window.confirm(`“${pin.name}” 핀을 지울까요? 올린 사진도 함께 지워져요.`)) return;
    try {
      await deletePlace(pin.id);
      setSel('');
      await reload();
      setToast('핀을 지웠어요.');
    } catch {
      setToast('지우지 못했어요. 잠시 뒤 다시 해 주세요.');
    }
  });

  const draft = form.point ? toXY(form.point.lat, form.point.lng) : null;

  return (
    <div className="page wide-page">
      <SubHeader title="함께 걸어온 곳" subtitle="핀을 누르면 그곳에서 찍은 사진이 열려요" />

      {!adding && (
        <>
          <div className="row center" style={{ marginTop: 0 }}>
            <button className="btn btn-primary" onClick={() => require(() => startAdd(null))}>📍 장소 더하기</button>
          </div>
          <p className="muted center small">사진을 올려 핀을 꽂는 건 가족만 할 수 있어요</p>
        </>
      )}

      {adding && (
        <form className="card form" onSubmit={submit}>
          <h3>{form.builtinId ? '이 사진은 어디였을까요?' : '새 장소에 핀 꽂기'}</h3>
          {!form.builtinId && (
            <label>사진 (여러 장 가능)
              <input type="file" accept="image/*" multiple onChange={pick} />
            </label>
          )}
          {form.files.length > 0 && <p className="muted small" style={{ margin: 0 }}>사진 {form.files.length}장을 골랐어요</p>}
          <label>장소 이름
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={20} placeholder="예) 제주 협재 해변" />
          </label>
          <label>한마디 (선택)
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={60} placeholder="예) 바람이 시원했던 가을 나들이" />
          </label>
          <p className={form.point ? 'pin-status ok' : 'pin-status'}>
            {form.point ? '✓ 위치를 골랐어요. 다시 누르면 옮길 수 있어요.' : '👇 아래 지도에서 그곳을 눌러 위치를 정해 주세요.'}
          </p>
          {error && <p className="error">{error}</p>}
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={cancelAdd} disabled={busy}>취소</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? '올리는 중…' : '📍 핀 꽂기'}</button>
          </div>
        </form>
      )}

      <div ref={mapBox} className={adding ? 'korea-map adding' : 'korea-map'}>
        <svg ref={svgRef} viewBox={`0 0 ${MAP.w} ${MAP.h}`} onClick={onMapClick} role="img" aria-label="한국 지도">
          <g className="map-land">
            {PROVINCES.map((p) => <path key={p.name} d={p.d} />)}
          </g>
          {pins.map((p, i) => (
            <Pin key={p.id} pin={p} index={i} active={p.id === sel} disabled={adding} onSelect={() => select(p.id, false)} />
          ))}
          {draft && (
            <g transform={`translate(${draft.x.toFixed(1)},${draft.y.toFixed(1)})`} className="draft-pin" pointerEvents="none">
              <circle r="9" className="draft-pulse" />
              <path d="M0,0 L-8,-20 L8,-20 Z" fill="var(--accent)" />
              <circle cy="-30" r="12" fill="var(--accent)" />
              <circle cy="-30" r="4.5" fill="#fff" />
            </g>
          )}
        </svg>
        {adding && !form.point && <span className="map-hint">👆 눌러서 위치를 정해요</span>}
      </div>
      <p className="map-credit">지도: 통계청 행정구역 · southkorea-maps (CC BY 4.0)</p>

      {selPin && (
        <div className="card place-detail">
          <h3>📍 {selPin.name}</h3>
          {selPin.note && <p className="muted" style={{ margin: '4px 0 0' }}>{selPin.note}</p>}
          {selPin.photos.length > 0 ? (
            <div className="place-photos">
              {selPin.photos.map((p, i) => (
                <button key={p.src} onClick={() => setViewer({ photos: selPin.photos, index: i })}>
                  <img src={p.src} alt={p.caption} loading="lazy" />
                </button>
              ))}
            </div>
          ) : (
            <p className="muted small">아직 올린 사진이 없어요.</p>
          )}
          <div className="row">
            {selPin.uploaded && <button className="btn btn-ghost" onClick={() => remove(selPin)}>🗑 핀 지우기</button>}
            <button className="btn btn-ghost" onClick={() => setSel('')}>닫기</button>
          </div>
        </div>
      )}

      <h3 className="list-h">핀을 꽂은 곳 ({pins.length})</h3>
      <div className="place-list">
        {[...pins].reverse().map((p) => (
          <button key={p.id} className="card place" onClick={() => select(p.id, true)}>
            {p.photos[0] ? <img src={p.photos[0].src} alt={p.name} loading="lazy" /> : <span className="place-noimg">🏝️</span>}
            <div><strong>📍 {p.name}</strong><p className="muted small">{p.note}</p></div>
          </button>
        ))}
      </div>

      {unpinned.length > 0 && (
        <>
          <h3 className="list-h">어디였을까요?</h3>
          <p className="muted small" style={{ marginBottom: 12 }}>장소를 아시는 가족분은 “위치 정하기”를 눌러 지도에 핀을 꽂아 주세요.</p>
          <div className="place-list">
            {unpinned.map((p) => (
              <div key={p.id} className="card place unpinned">
                <img src={photoById(p.photos[0])?.src} alt={p.name} loading="lazy" />
                <div>
                  <strong>{p.name}</strong>
                  <p className="muted small">{p.note}</p>
                  <button className="btn btn-ghost small-btn" onClick={() => require(() => startAdd(p))}>📍 위치 정하기</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {viewer && <Lightbox photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} />}
      {gate}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
