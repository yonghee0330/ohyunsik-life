import { useState } from 'react';
import { TIMELINE, photoById } from '../data/content.js';
import { go } from '../router.js';
import { SubHeader, Lightbox } from '../components/Common.jsx';

export default function Timeline() {
  const [viewer, setViewer] = useState(null); // { photos, index }

  return (
    <div className="page wide-page">
      <SubHeader title="인생 연표" subtitle="한 사람이 걸어온 길을 시간 순서대로 따라가 봅니다" />
      <ol className="tl">
        {TIMELINE.map((t, idx) => {
          const photos = t.photos.map(photoById).filter(Boolean);
          return (
            <li key={idx} className="tl-item">
              <span className="tl-dot" />
              <p className="tl-when">{t.when}</p>
              <h3>{t.title}</h3>
              <p className="tl-text">{t.text}</p>
              <div className="tl-photos">
                {photos.map((p, i) => (
                  <button key={p.id} className="tl-photo" onClick={() => setViewer({ photos, index: i })}>
                    <img src={p.src} alt={p.caption} loading="lazy" />
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="row center">
        <button className="btn btn-soft" onClick={() => go('album')}>사진 모두 보기 · 사진 올리기</button>
        <button className="btn btn-primary" onClick={() => go('write-letter')}>아버님께 편지 쓰기</button>
      </div>
      {viewer && <Lightbox photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} />}
    </div>
  );
}
