import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PLACES, photoById } from '../data/content.js';
import { SubHeader, Lightbox } from '../components/Common.jsx';

export default function Places() {
  const mapEl = useRef(null);
  const [viewer, setViewer] = useState(null);
  const pinned = PLACES.filter((p) => p.lat != null);
  const unpinned = PLACES.filter((p) => p.lat == null);

  const open = (place) => {
    const photos = place.photos.map(photoById).filter(Boolean);
    if (photos.length) setViewer({ photos, index: 0, place });
  };

  useEffect(() => {
    if (!mapEl.current || !pinned.length) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap',
    }).addTo(map);
    const bounds = [];
    pinned.forEach((p) => {
      const icon = L.divIcon({ className: 'pin', html: `<span>${p.photos.length || '★'}</span>`, iconSize: [34, 34], iconAnchor: [17, 34] });
      const m = L.marker([p.lat, p.lng], { icon, title: p.name }).addTo(map);
      if (p.photos.length) m.on('click', () => open(p));
      else m.bindPopup(`<strong>${p.name}</strong><br/>${p.note}`);
      bounds.push([p.lat, p.lng]);
    });
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page wide-page">
      <SubHeader title="함께 걸어온 곳" subtitle="핀을 누르면 그곳에서 찍은 사진이 열려요" />
      {pinned.length > 0 && <div ref={mapEl} className="map" />}
      <div className="place-list">
        {pinned.map((p) => (
          <button key={p.id} className="card place" onClick={() => open(p)}>
            {p.photos.length ? <img src={photoById(p.photos[0]).src} alt={p.name} loading="lazy" /> : <span className="place-noimg">🏝️</span>}
            <div><strong>📍 {p.name}</strong><p className="muted small">{p.note}</p></div>
          </button>
        ))}
      </div>

      {unpinned.length > 0 && (
        <>
          <h3 className="list-h">어디였을까요?</h3>
          <p className="muted small" style={{ marginBottom: 12 }}>장소를 아시는 가족분은 알려 주세요. 알려 주시면 지도에 핀을 꽂을게요.</p>
          <div className="place-list">
            {unpinned.map((p) => (
              <button key={p.id} className="card place" onClick={() => open(p)}>
                <img src={photoById(p.photos[0])?.src} alt={p.name} loading="lazy" />
                <div><strong>{p.name}</strong><p className="muted small">{p.note}</p></div>
              </button>
            ))}
          </div>
        </>
      )}
      {viewer && <Lightbox photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} />}
    </div>
  );
}
