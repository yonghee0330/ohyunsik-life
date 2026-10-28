import { useCallback, useEffect, useRef, useState } from 'react';
import { GALLERY, photoById } from '../data/content.js';
import { SubHeader } from '../components/Common.jsx';
import { Player } from '../components/Player.jsx';
import { go } from '../router.js';

// 사진과 영상을 한 줄로 이어 붙인 슬라이드 목록
const SLIDES = GALLERY.map((g) => {
  if (g.video) return { kind: 'video', ...g.video, caption: g.caption };
  const p = photoById(g.photo);
  return p ? { kind: 'photo', src: p.src, caption: p.caption } : null;
}).filter(Boolean);

const AUTO_MS = 5000;

export default function Gallery() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(false);
  const touchX = useRef(null);
  const thumbs = useRef(null);
  const n = SLIDES.length;
  const slide = SLIDES[i];

  const go1 = useCallback((d) => setI((x) => (x + d + n) % n), [n]);

  // 키보드 좌우 화살표
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go1(1);
      if (e.key === 'ArrowLeft') go1(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go1]);

  // 자동 넘기기: 사진은 몇 초 뒤 다음으로, 영상에서는 멈춰서 끝까지 볼 수 있게 해요.
  useEffect(() => {
    if (!auto || slide.kind === 'video') return;
    const t = setTimeout(() => go1(1), AUTO_MS);
    return () => clearTimeout(t);
  }, [auto, i, slide, go1]);

  // 다음 사진을 미리 불러 둡니다.
  useEffect(() => {
    const next = SLIDES[(i + 1) % n];
    if (next.kind === 'photo') new Image().src = next.src;
  }, [i, n]);

  // 아래 작은 사진 줄이 지금 슬라이드를 따라가게 합니다.
  useEffect(() => {
    const el = thumbs.current?.children[i];
    if (el && thumbs.current) {
      thumbs.current.scrollTo({ left: el.offsetLeft - thumbs.current.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    }
  }, [i]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go1(dx < 0 ? 1 : -1);
  };

  return (
    <div className="page wide-page">
      <SubHeader title="가족 갤러리" subtitle="사진과 영상을 옆으로 넘기며 함께 보세요" />

      <div className="gal">
        <div className="gal-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {slide.kind === 'photo' ? (
            <>
              <div className="gal-bg" style={{ backgroundImage: `url(${slide.src})` }} />
              <img key={i} className="gal-img" src={slide.src} alt={slide.caption} />
            </>
          ) : (
            <div key={i} className={slide.vertical ? 'gal-video vertical' : 'gal-video'}>
              <Player id={slide.id} vertical={slide.vertical} title={slide.caption} />
            </div>
          )}
          <button className="gal-nav prev" onClick={() => go1(-1)} aria-label="이전">‹</button>
          <button className="gal-nav next" onClick={() => go1(1)} aria-label="다음">›</button>
        </div>

        <p className="gal-cap">{slide.kind === 'video' && <span className="gal-tag">▶ 영상</span>}{slide.caption}</p>

        <div className="gal-bar">
          <span className="gal-count">{i + 1} / {n}</span>
          <button className={auto ? 'btn btn-ghost on' : 'btn btn-ghost'} onClick={() => setAuto((a) => !a)}>
            {auto ? '❚❚ 자동 넘기기 멈춤' : '▶ 자동으로 넘기기'}
          </button>
        </div>

        <div className="gal-thumbs" ref={thumbs}>
          {SLIDES.map((s, k) => (
            <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${k + 1}번째 보기`}>
              {s.kind === 'photo' ? <img src={s.src} alt="" loading="lazy" /> : <span className="gal-thumb-video">▶</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="row center">
        <button className="btn btn-ghost" onClick={() => go('album')}>📸 사진첩에서 더 보기</button>
      </div>
    </div>
  );
}
