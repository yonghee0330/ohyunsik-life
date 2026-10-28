import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SITE, VIDEO } from '../config.js';
import { TIMELINE, photoById } from '../data/content.js';
import { go } from '../router.js';
import { prepareBgm, playBgm, stopBgm, resumeBgm } from '../services/bgm.js';
import { Player } from '../components/Player.jsx';

// 전체 길이가 약 1분이 되도록 맞춘 시간(밀리초)
const OPENING_MS = 2800; // 여는 화면
const TITLE_MS = 2400; // 사진 없는 장면(글자 화면)
const FIRST_MS = 3400; // 장면의 첫 사진(장면 제목이 함께 나옴)
const PHOTO_MS = 2700; // 그다음 사진

// 연표를 슬라이드 목록으로 펼칩니다. 맨 앞에 여는 화면을 두고,
// 장면마다 사진 수만큼 슬라이드를 만들며, 사진이 없는 장면은 글자 화면이 됩니다.
function buildSlides() {
  const slides = [{ opening: true, photo: null }];
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

const slideMs = (sl) => (sl.opening ? OPENING_MS : !sl.photo ? TITLE_MS : sl.first ? FIRST_MS : PHOTO_MS);

// 접속하면 바로 시작하는 인생 연표 슬라이드쇼. 마지막은 생신 축하 영상으로 이어집니다.
export default function Timeline() {
  const slides = useMemo(buildSlides, []);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [music, setMusic] = useState(false); // 기본은 음악 꺼짐. 오른쪽 위 버튼을 눌러야 켜져요.
  const [needTap, setNeedTap] = useState(false); // 브라우저가 소리를 막았을 때
  const [ended, setEnded] = useState(false);
  const timer = useRef(null);

  const s = slides[idx];
  const waitingStart = needTap && music && idx === 0 && !ended;

  const finish = useCallback(() => {
    setEnded(true);
    stopBgm(); // 축하 영상 소리가 잘 들리도록 배경음악은 조용히 끕니다.
    setMusic(false);
    setNeedTap(false);
  }, []);

  const next = useCallback(() => {
    setIdx((i) => {
      if (i + 1 >= slides.length) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [slides.length, finish]);
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  // 음악은 기본으로 꺼져 있어요. 곡만 미리 만들어 두면, 버튼을 누르는 순간 바로 재생돼요.
  useEffect(() => {
    prepareBgm('timeline');
    return () => stopBgm();
  }, []);

  // 소리가 막혔으면, 화면 어디든 처음 누를 때 음악을 켭니다.
  useEffect(() => {
    if (!needTap) return;
    const onFirst = () => resumeBgm().then((ok) => ok && setNeedTap(false));
    // 휴대폰은 '눌러서 뗀 순간'(click, touchend)만 소리 켜기를 허락합니다.
    window.addEventListener('click', onFirst);
    window.addEventListener('touchend', onFirst);
    window.addEventListener('keydown', onFirst);
    return () => {
      window.removeEventListener('click', onFirst);
      window.removeEventListener('touchend', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
  }, [needTap]);

  // 자동 넘김
  useEffect(() => {
    clearTimeout(timer.current);
    if (!playing || ended) return;
    // 소리가 막힌 기기(주로 휴대폰)에서는 여는 화면에서 '시작하기'를 누를 때까지 기다립니다.
    if (waitingStart) return;
    timer.current = setTimeout(next, slideMs(s));
    return () => clearTimeout(timer.current);
  }, [playing, ended, idx, next, s, waitingStart]);

  // 다음 사진 미리 불러오기
  useEffect(() => {
    const n = slides[idx + 1];
    if (n?.photo) new Image().src = n.photo.src;
  }, [idx, slides]);

  // 키보드: ← → 넘기기, 스페이스 일시정지
  useEffect(() => {
    const onKey = (e) => {
      if (ended) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ended, next]);

  const toggleMusic = (e) => {
    e.stopPropagation();
    if (music) {
      stopBgm();
      setNeedTap(false);
    } else {
      playBgm('timeline').then((ok) => setNeedTap(!ok));
    }
    setMusic(!music);
  };

  const skip = () => { stopBgm(); go('home'); };

  const startWithMusic = () => resumeBgm().then((ok) => ok && setNeedTap(false));
  const startWithoutMusic = () => {
    stopBgm();
    setMusic(false);
    setNeedTap(false);
  };

  const replay = () => {
    setEnded(false);
    setIdx(0);
    setPlaying(true);
  };

  const progress = ((idx + 1) / slides.length) * 100;

  return (
    <div className="show">
      {/* 오른쪽 위: 작은 음악 버튼, 연표 끄기 */}
      {!ended && (
        <div className="show-top">
          <button className={music ? 'show-icon' : 'show-icon off'} onClick={toggleMusic} aria-label={music ? '음악 끄기' : '음악 켜기'} title={music ? '음악 끄기' : '음악 켜기'}>
            {music ? '♪' : <><span className="muted-note">♪</span> 음악 켜기</>}
          </button>
          <button className="show-skip" onClick={skip}>연표 끄기 ✕</button>
        </div>
      )}

      {needTap && music && !ended && !waitingStart && <div className="show-hint">화면을 한 번 눌러 주세요 ♪</div>}

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
      {!ended && s.opening && (
        <div className="show-opening" key="opening">
          <p className="eyebrow light">{SITE.tagline}</p>
          <h1>{SITE.name}</h1>
          <p className="show-opening-sub">인생은 아름다워</p>
          <p className="show-opening-line">1953년 비금도에서 오늘까지, 한 사람이 걸어온 길</p>
          {waitingStart && (
            <div className="show-start-btns">
              <button className="btn btn-primary show-play" onClick={startWithMusic}>♪ 음악과 함께 시작하기</button>
              <button className="link-btn light" onClick={(e) => { e.stopPropagation(); startWithoutMusic(); }}>음악 없이 보기</button>
            </div>
          )}
        </div>
      )}
      {!ended && !s.opening && (
        // 사진이 잘 보이도록 글은 잠시 보였다가 사라집니다. 일시정지하면 계속 보여요.
        <div
          className={s.photo && playing ? 'show-text fades' : 'show-text'}
          style={{ '--slide-ms': `${slideMs(s)}ms` }}
          key={idx}
        >
          <p className="show-when">{s.t.when}</p>
          <h2>{s.t.title}</h2>
          {s.photo && !s.first && <p className="show-cap">{s.photo.caption}</p>}
        </div>
      )}

      {/* 아래 조작 막대 */}
      {!ended && (
        <div className="show-ctrl">
          <div className="show-bar"><div style={{ width: `${progress}%` }} /></div>
          <div className="show-btns">
            <button onClick={prev} aria-label="이전">‹</button>
            <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? '일시정지' : '재생'}>{playing ? '❚❚' : '▶'}</button>
            <button onClick={next} aria-label="다음">›</button>
          </div>
        </div>
      )}

      {/* 마지막: 생신 축하 */}
      {ended && (
        <div className="show-finale">
          <p className="eyebrow light">HAPPY BIRTHDAY</p>
          <h1>{SITE.honorific}, 생신 축하드립니다</h1>
          <p className="show-finale-line">지나온 모든 날에 감사합니다. 인생은 정말 아름답습니다.</p>
          {VIDEO.birthday && (
            <div className="show-finale-video"><Player {...VIDEO.birthday} title="생신 축하 영상" /></div>
          )}
          <div className="row center">
            <button className="btn btn-primary" onClick={() => go('home')}>들어가기</button>
            <button className="btn btn-ghost" onClick={() => go('write-letter')}>축하 편지 쓰기</button>
          </div>
          <button className="link-btn light" onClick={replay}>연표 처음부터 다시 보기</button>
        </div>
      )}
    </div>
  );
}
