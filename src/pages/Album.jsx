import { useEffect, useMemo, useState } from 'react';
import { PHOTOS } from '../data/content.js';
import { listPhotos, addPhoto, updatePhoto, deletePhoto } from '../services/store.js';
import { SubHeader, Toast, Modal, useFamilyGate } from '../components/Common.jsx';

// 기본 사진(content.js) + 가족이 올린 사진(store)을 함께 보여 줍니다.
export default function Album() {
  const [uploaded, setUploaded] = useState([]);
  const [sort, setSort] = useState('era'); // 'era' | 'recent'
  const [mode, setMode] = useState('list'); // 'list' | 'upload'
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');
  const { require, gate } = useFamilyGate();

  const reload = () => listPhotos().then(setUploaded);
  useEffect(() => { reload(); }, []);

  const all = useMemo(
    () => [
      ...PHOTOS.map((p) => ({ ...p, title: p.caption, builtin: true })),
      ...uploaded.map((p) => ({ ...p, caption: p.title || '제목 없는 사진', era: p.era || '시기 미정' })),
    ],
    [uploaded]
  );

  const groups = useMemo(() => {
    if (sort === 'recent') return [{ era: '올린 순서', items: [...all].reverse() }];
    const map = new Map();
    all.forEach((p) => {
      if (!map.has(p.era)) map.set(p.era, []);
      map.get(p.era).push(p);
    });
    return [...map.entries()].map(([era, items]) => ({ era, items }));
  }, [all, sort]);

  if (mode === 'upload') {
    return (
      <div className="page">
        <SubHeader title="📷 사진 올리기" subtitle="사진을 올리고, 그때 이야기를 남겨 보세요" />
        <UploadForm
          onCancel={() => setMode('list')}
          onDone={(n) => {
            reload();
            setMode('list');
            setToast(`${n}장 다 올렸어요! 참 잘하셨어요.`);
          }}
        />
        <Toast message={toast} onDone={() => setToast('')} />
      </div>
    );
  }

  return (
    <div className="page">
      <SubHeader title="📸 추억의 사진첩" subtitle="사진을 올리고, 그때 이야기를 남겨 보세요" />

      <div className="row center">
        <button className="btn btn-primary" onClick={() => require(() => setMode('upload'))}>📷 사진 올리기</button>
      </div>
      <p className="muted center small">사진 올리기·수정은 가족만</p>

      <div className="tabs">
        <button className={sort === 'era' ? 'on' : ''} onClick={() => setSort('era')}>시기별</button>
        <button className={sort === 'recent' ? 'on' : ''} onClick={() => setSort('recent')}>올린 순서</button>
      </div>

      {groups.map((g) => (
        <section key={g.era} className="album-group">
          <h3>{g.era}</h3>
          <div className="album-grid">
            {g.items.map((p) => (
              <button key={p.id} className="g-item" onClick={() => setDetail(p)}>
                <img src={p.src} alt={p.caption} loading="lazy" />
                <span>{p.caption}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {detail && (
        <PhotoDetail
          photo={detail}
          onClose={() => setDetail(null)}
          requireFamily={require}
          onChanged={(msg) => { reload(); setDetail(null); setToast(msg); }}
        />
      )}
      {gate}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

function UploadForm({ onCancel, onDone }) {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [era, setEra] = useState('');
  const [story, setStory] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const pick = (e) => {
    const list = [...e.target.files].filter((f) => f.type.startsWith('image/'));
    if (list.length !== e.target.files.length) setError('사진 파일만 올릴 수 있어요.');
    else setError('');
    setFiles(list.filter((f) => f.size <= 20 * 1024 * 1024));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) return setError('사진을 먼저 골라 주세요.');
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`사진 ${i + 1}장 / 모두 ${files.length}장 올리는 중…`);
        await addPhoto(files[i], { title, era, story });
      }
      onDone(files.length);
    } catch {
      setProgress('');
      setError('올리기에 실패했어요. 잠시 뒤 다시 해 주세요.');
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <label className="file-pick">
        <input type="file" accept="image/*" multiple onChange={pick} />
        {files.length ? `${files.length}장의 사진을 골랐어요` : '사진 고르기 / 카메라로 찍기'}
      </label>
      <label>사진 제목 (선택)
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 가족들과 함께한 봄날" />
      </label>
      <label>촬영 시기 (선택)
        <input value={era} onChange={(e) => setEra(e.target.value)} placeholder="예) 결혼하고 얼마 뒤" />
      </label>
      <label>사진에 담긴 이야기 (선택)
        <textarea rows={4} value={story} onChange={(e) => setStory(e.target.value)} placeholder="그날의 이야기를 적어 보세요" />
      </label>
      {error && <p className="error">{error}</p>}
      {progress && <p className="muted">{progress}</p>}
      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>뒤로 가기</button>
        <button className="btn btn-primary" disabled={!!progress}>{progress ? '올리는 중…' : '사진 저장하기'}</button>
      </div>
    </form>
  );
}

function PhotoDetail({ photo, onClose, requireFamily, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState({ title: photo.title || '', era: photo.era || '', story: photo.story || '' });

  const save = async () => {
    await updatePhoto(photo.id, form);
    onChanged('수정해서 저장했어요.');
  };

  const remove = async () => {
    await deletePhoto(photo.id);
    onChanged('사진을 지웠어요.');
  };

  return (
    <Modal onClose={onClose}>
      <img className="viewer-img" src={photo.src} alt={photo.caption} />
      {editing ? (
        <div className="form">
          <label>사진 제목<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>촬영 시기<input value={form.era} onChange={(e) => setForm({ ...form, era: e.target.value })} /></label>
          <label>이야기<textarea rows={4} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} /></label>
          <div className="row">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>취소</button>
            <button className="btn btn-primary" onClick={save}>저장하기</button>
          </div>
        </div>
      ) : confirmDel ? (
        <div className="center">
          <p><strong>정말 이 사진을 지울까요?</strong></p>
          <p className="muted">지우면 다시 되돌리기 어려워요</p>
          <div className="row center">
            <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>아니요, 남겨둘게요</button>
            <button className="btn btn-danger" onClick={remove}>네, 지울게요</button>
          </div>
        </div>
      ) : (
        <>
          <p className="viewer-cap">{photo.caption}</p>
          <p className="muted center small">{photo.era}</p>
          <p className="viewer-story">{photo.story || (photo.builtin ? '' : '아직 이야기가 없어요. 수정에서 적을 수 있어요.')}</p>
          <div className="row center">
            {!photo.builtin && (
              <>
                <button className="btn btn-soft" onClick={() => requireFamily(() => setEditing(true))}>✏️ 제목·이야기 수정</button>
                <button className="btn btn-ghost" onClick={() => requireFamily(() => setConfirmDel(true))}>사진 삭제하기</button>
              </>
            )}
            <button className="btn btn-ghost" onClick={onClose}>목록으로</button>
          </div>
        </>
      )}
    </Modal>
  );
}
