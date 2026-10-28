import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { paperOf, moodOf, LETTER_MOODS } from '../data/content.js';
import { formatDate } from '../components/Common.jsx';
import { prepareBgm, playBgm, stopBgm, resumeBgm } from '../services/bgm.js';

// 편지를 문장 단위로 쪼갭니다. 한 화면에 한 줄(문장)씩 나와요.
export function splitLines(body) {
  const out = [];
  body.split(/\n+/).forEach((par) => {
    const parts = (par.trim().match(/[^.!?…~。]+[.!?…~。]*\s*/g) || []).map((x) => x.trim()).filter(Boolean);
    let startOfPar = out.length;
    parts.forEach((t) => {
      // 같은 문단 안에서 너무 짧은 조각(예: "네.")은 앞 문장에 붙입니다.
      if (t.length < 8 && out.length > startOfPar) out[out.length - 1] += ' ' + t;
      else out.push(t);
    });
  });
  return out;
}

const lineMs = (t) => Math.min(9500, Math.max(3400, 1700 + t.length * 140));

function buildSteps(letters) {
  const steps = [];
  letters.forEach((l) => {
    steps.push({ kind: 'head', l, ms: 4800 });
    splitLines(l.body).forEach((text) => steps.push({ kind: 'line', l, text, ms: lineMs(text) }));
    steps.push({ kind: 'sign', l, ms: 5000 });
  });
  return steps;
}

// 편지를 배경음악과 함께 한 줄씩 잔잔하게 보여 주는 전체 화면.
// letters: 읽을 편지들(순서대로). onPlayAll: 있으면 끝 화면에 '모든 편지 이어 읽기' 버튼을 보여 줍니다.
export default function LetterShow({ letters, onClose, onPlayAll }) {
  const steps = useMemo(() => buildSteps(letters), [letters]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [music, setMusic] = useState(true);
  const [needTap, setNeedTap] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef(null);

  const step = steps[idx];
  const paper = paperOf(step.l.paper);
  const mood = moodOf(step.l);
  const waitingStart = needTap && music && idx === 0 && !done;

  const next = useCallback(() => {
    setIdx((i) => {
      if (i + 1 >= steps.length) {
        setDone(true);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  // 편지마다 분위기에 맞는 곡을 미리 만들어 둡니다.
  useEffect(() => {
    [...new Set(letters.map(moodOf))].forEach((m) => prepareBgm(m));
  }, [letters]);

  useEffect(() => () => stopBgm(), []);

  // 편지가 바뀌면 그 편지의 곡으로 바꿔 틉니다(처음 편지 포함).
  const musicRef = useRef(music);
  musicRef.current = music;
  useEffect(() => {
    if (!musicRef.current) return;
    playBgm(mood).then((ok) => setNeedTap(!ok));
  }, [mood]);

  // 소리가 막혔으면 화면을 누를 때 켭니다(click/touchend만 휴대폰에서 허용).
  useEffect(() => {
    if (!needTap) return;
    const onFirst = () => resumeBgm().then((ok) => ok && setNeedTap(false));
    window.addEventListener('click', onFirst);
    window.addEventListener('touchend', onFirst);
    return () => {
      window.removeEventListener('click', onFirst);
      window.removeEventListener('touchend', onFirst);
    };
  }, [needTap]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!playing || done || waitingStart) return;
    timer.current = setTimeout(next, step.ms);
    return () => clearTimeout(timer.current);
  }, [playing, done, waitingStart, idx, next, step]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (done) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, next, onClose]);

  const toggleMusic = (e) => {
    e.stopPropagation();
    if (music) {
      stopBgm();
      setNeedTap(false);
    } else {
      playBgm(mood).then((ok) => setNeedTap(!ok));
    }
    setMusic(!music);
  };

  const noMusic = () => { stopBgm(); setMusic(false); setNeedTap(false); };
  const startMusic = () => resumeBgm().then((ok) => ok && setNeedTap(false));

  const animated = playing && !done;
  const fade = animated ? 'ls-fade' : '';
  const style = { '--ms': `${step.ms}ms`, color: paper.ink };
  const l = step.l;

  return (
    <div className={paper.dark ? 'show ls' : 'show ls ls-light'} style={{ background: paper.dark ? '#14110e' : '#f4efe6' }}>
      <div className="ls-bg" key={l.id} style={{ background: paper.bg }} />

      {!done && (
        <div className="show-top">
          <button className="show-icon" onClick={toggleMusic} aria-label={music ? '음악 끄기' : '음악 켜기'} title={music ? '음악 끄기' : '음악 켜기'}>
            {music ? '♪' : <span className="muted-note">♪</span>}
          </button>
          <button className="show-skip" onClick={onClose}>닫기 ✕</button>
        </div>
      )}

      {needTap && music && !done && !waitingStart && <div className="show-hint">화면을 한 번 눌러 주세요 ♪</div>}

      {!done && (
        <div className="ls-stage">
          {step.kind === 'head' && (
            <div className={`ls-head ${fade}`} style={style} key={idx}>
              <p className="ls-small" style={{ color: paper.sub }}>아버님께 드리는 편지</p>
              <h2>From. {l.from}</h2>
              {l.title && <p className="ls-title">{l.title}</p>}
              {music && <p className="ls-small ls-mood" style={{ color: paper.sub }}>♪ {LETTER_MOODS[mood].name}</p>}
            </div>
          )}
          {step.kind === 'line' && (
            <p className={`ls-line ${fade}`} style={style} key={idx}>{step.text}</p>
          )}
          {step.kind === 'sign' && (
            <div className={`ls-sign ${fade}`} style={style} key={idx}>
              <p className="ls-signline">— {l.from} 드림</p>
              <p className="ls-small" style={{ color: paper.sub }}>{formatDate(l.createdAt)}</p>
            </div>
          )}
        </div>
      )}

      {!done && (
        <div className="show-ctrl">
          <div className="show-bar"><div style={{ width: `${((idx + 1) / steps.length) * 100}%` }} /></div>
          <div className="show-btns">
            <button onClick={prev} aria-label="이전">‹</button>
            <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? '일시정지' : '재생'}>{playing ? '❚❚' : '▶'}</button>
            <button onClick={next} aria-label="다음">›</button>
          </div>
        </div>
      )}

      {waitingStart && (
        <div className="show-start">
          <p className="eyebrow light">LETTERS</p>
          <h1>편지를 읽어 드릴게요</h1>
          <p>한 줄씩 천천히 흘러요.</p>
          <button className="btn btn-primary show-play" onClick={startMusic}>♪ 음악과 함께 읽기</button>
          <button className="link-btn light" onClick={noMusic}>음악 없이 읽기</button>
        </div>
      )}

      {done && (
        <div className="show-start">
          <h1>편지를 모두 읽었어요</h1>
          <p>마음이 아버님께 닿기를 바라요.</p>
          <div className="row center">
            <button className="btn btn-primary" onClick={onClose}>닫기</button>
            <button className="btn btn-ghost light-ghost" onClick={() => { setIdx(0); setDone(false); setPlaying(true); }}>다시 읽기</button>
          </div>
          {onPlayAll && <button className="link-btn light" onClick={onPlayAll}>모든 편지 이어 읽기</button>}
        </div>
      )}
    </div>
  );
}
