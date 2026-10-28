import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SITE } from '../config.js';
import { TIMELINE, photoById } from '../data/content.js';
import { go } from '../router.js';
import { playBgm, stopBgm } from '../services/bgm.js';

const SLIDE_MS = 6500; // 사진 한 장이 머무는 시간
const TITLE_MS = 7000; // 사진 없는 장면(제목 카드)이 머무는 시간

// 연표를 슬라이드 목록으로 펼칩니다. 장면마다 사진 수만큼 슬라이드가 생기고,
// 사진이 없는 장면은 글자만 있는 제목 카드가 됩니다.
function buildSlides() {
  const slides = [];
  TIMELINE.forEach((t, chapter) => {
    const photos = t.photos.map(photoById).filter(Boolean);
    if (!photos.length) {
      slides.push({ chapter, t, photo: null, first: true });
      return;
    }
    photos.forEach((p, i) => slides.push({ chapter, t, photo: p, first: i === 0 }));
  });
  return slides;
}

export default function Timeline() {
  const slides = useMemo(buildSlides, []);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [music, setMusic] = useState(true);
  const [ended, setEnded] = useState(false);
  const timer = useRef(null);

  const s = slides[idx];

  const next = useCallback(() => {
    setIdx((i) => {
      if (i + 1 >= slides.length) {
        setEnded(true);
        return i;
      }
      return i + 1;
    });
  }, [slides.length]);
  const prev = () => { setEnded(false); setIdx((i) => Math.max(0, i - 1)); };

  // 자동 넘김
  useEffect(() => {
    clearTimeout(timer.current);
    if (!started || !playing || ended) return;
    timer.current = setTimeout(next, s.photo ? SLIDE_MS : TITLE_MS);
    return () => clearTimeout(timer.current);
  }, [started, playing, ended, idx, next, s.photo]);

  // 다음 사진 미리 불러오기
  useEffect(() => {
    const n = slides[idx + 1];
    if (n?.photo) new Image().src = n.photo.src;
  }, [idx, slides]);

  // 페이지를 떠나면 음악 끄기
  useEffect(() => () => stopBgm(), []);

  // 키보드: ← → 넘기기, 스페이스 일시정지
  useEffect(() => {
    const onKey = (e) => {
      if (!started) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, next]);

  const start = (withMusic) => {
    setStarted(true);
    setMusic(withMusic);
    if (withMusic) playBgm();
  };

  const toggleMusic = () => {
    if (music) stopBgm(); else playBgm();
    setMusic(!music);
  };

  const restart = () => { setEnded(false); setIdx(0); setPlaying(true); };

  const progress = ((idx + 1) / slides.length) * 100;

  return (
    <div className="show">
      <button className="show-back" onClick={() => { stopBgm(); go(''); }}>← 홈으로</button>

      {/* 슬라이드 */}
      {slides.map((sl, i) => (
        <div key={i} className={i === idx ? 'show-slide on' : 'show-slide'} aria-hidden={i !== idx}>
          {sl.photo ? (
            <>
              <div className="show-blur" style={{ backgroundImage: `url(${sl.photo.src})` }} />
              {Math.abs(i - idx) <= 1 && (
                <img className={i === idx ? 'show-img kb' + (i % 2) : 'show-img'} src={sl.photo.src} alt={sl.photo.caption} />
              )}
            </>
          ) : (
            <div className="show-titlecard" />
          )}
        </div>
      ))}

      {/* 글자 */}
      {started && (
        <div className="show-text" key={idx}>
          <p className="show-when">{s.t.when}</p>
          <h2>{s.t.title}</h2>
          {s.first && <p className="show-body">{s.t.text}</p>}
          {s.photo && !s.first && <p className="show-cap">{s.photo.caption}</p>}
        </div>
      )}

      {/* 조작 */}
      {started && (
        <div className="show-ctrl">
          <div className="show-bar"><div style={{ width: `${progress}%` }} /></div>
          <div className="show-btns">
            <button onClick={prev} aria-label="이전">‹</button>
            <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? '일시정지' : '재생'}>{playing ? '❚❚' : '▶'}</button>
            <button onClick={next} aria-label="다음">›</button>
            <button onClick={toggleMusic} className="show-music">{music ? '♪ 음악 끄기' : '♪ 음악 켜기'}</button>
          </div>
        </div>
      )}

      {/* 시작 화면 */}
      {!started && (
        <div className="show-start">
          <p className="eyebrow light">LIFE TIMELINE</p>
          <h1>{SITE.name}의 인생 연표</h1>
          <p>1953년 비금도에서 오늘까지,<br />천천히 함께 돌아봐요.</p>
          <button className="btn btn-primary show-play" onClick={() => start(true)}>▶ 음악과 함께 보기</button>
          <button className="link-btn light" onClick={() => start(false)}>음악 없이 보기</button>
        </div>
      )}

      {/* 끝 화면 */}
      {ended && (
        <div className="show-start">
          <h1>인생은 아름다워</h1>
          <p>{SITE.honorific}, 생신 축하드립니다.<br />지나온 모든 날에 감사합니다.</p>
          <div className="row center">
            <button className="btn btn-primary" onClick={() => { stopBgm(); go('write-letter'); }}>편지 쓰기</button>
            <button className="btn btn-ghost" onClick={restart}>처음부터 다시 보기</button>
          </div>
          <button className="link-btn light" onClick={() => { stopBgm(); go('album'); }}>사진 모두 보기 · 사진 올리기</button>
        </div>
      )}
    </div>
  );
}
