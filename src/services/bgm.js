// 인생 연표 배경음악.
// public/audio/bgm.mp3 파일이 있으면 그 곡을 틀고, 없으면 브라우저에서 직접 잔잔한 피아노 곡을 연주합니다.
// (직접 연주하는 곡은 저작권 걱정이 없습니다. 원하는 곡이 있으면 mp3만 넣으세요.)

const MP3_SRC = '/audio/bgm.mp3';

// ---------- mp3 ----------
let audioEl = null;

async function hasMp3() {
  try {
    const r = await fetch(MP3_SRC, { method: 'HEAD' });
    return r.ok && (r.headers.get('content-type') || '').includes('audio');
  } catch {
    return false;
  }
}

// ---------- 직접 연주하는 피아노 ----------
// F장조 Fmaj7 – C/E – Dm7 – B♭maj7 반복, 느린 아르페지오 + 멜로디 + 부드러운 패드
const BPM = 64;
const BEAT = 60 / BPM;
const CHORDS = [
  { bass: 41, notes: [53, 57, 60, 64] }, // Fmaj7
  { bass: 40, notes: [52, 55, 60, 64] }, // C/E
  { bass: 38, notes: [50, 53, 57, 60] }, // Dm7
  { bass: 34, notes: [46, 53, 57, 62] }, // B♭maj(add9)
];
// 마디마다 멜로디 (박, MIDI, 길이)
const MELODY = [
  [[0, 72, 1.5], [1.5, 69, 0.5], [2, 67, 2]],
  [[0, 67, 1], [1, 69, 1], [2, 64, 2]],
  [[0, 65, 1.5], [1.5, 64, 0.5], [2, 62, 2]],
  [[0, 62, 1], [1, 65, 1], [2, 69, 2]],
  [[0, 72, 1], [1, 74, 1], [2, 72, 2]],
  [[0, 71, 1], [1, 67, 1], [2, 64, 2]],
  [[0, 69, 1.5], [1.5, 65, 0.5], [2, 62, 2]],
  [[0, 65, 2], [2, 67, 1], [3, 69, 1]],
];

const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

let ctx = null;
let master = null;
let timer = null;
let nextBar = 0;
let barIndex = 0;

function makeReverb(c) {
  const len = c.sampleRate * 3.2;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

function piano(time, midi, dur, vel, out) {
  const f = freq(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vel, time + 0.012);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, time + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 1.6);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(5200, f * 6), time);
  lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 1.5), time + dur + 1);
  [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([mul, type, amp]) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f * mul;
    o.detune.value = (Math.random() - 0.5) * 4;
    const og = ctx.createGain();
    og.gain.value = amp;
    o.connect(og).connect(lp);
    o.start(time);
    o.stop(time + dur + 1.8);
  });
  lp.connect(g).connect(out);
}

function pad(time, notes, dur, out) {
  notes.forEach((m) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.025, time + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, time + dur + 0.3);
    o.connect(g).connect(out);
    o.start(time);
    o.stop(time + dur + 0.4);
  });
}

function scheduleBar(t, i) {
  const chord = CHORDS[i % CHORDS.length];
  const bar = BEAT * 4;
  piano(t, chord.bass, bar, 0.16, master);
  pad(t, chord.notes, bar, master);
  // 8분음표 아르페지오: 1-2-3-4-3-2-3-4
  [0, 1, 2, 3, 2, 1, 2, 3].forEach((n, k) => {
    piano(t + k * (BEAT / 2), chord.notes[n], BEAT * 0.9, 0.055 + (k === 0 ? 0.02 : 0), master);
  });
  // 처음 4마디는 반주만, 그다음부터 멜로디
  if (i >= 4) {
    MELODY[(i - 4) % MELODY.length].forEach(([b, m, d]) => piano(t + b * BEAT, m, d * BEAT, 0.12, master));
  }
}

function tick() {
  while (nextBar < ctx.currentTime + 1.5) {
    scheduleBar(nextBar, barIndex++);
    nextBar += BEAT * 4;
  }
}

function startSynth() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  ctx.resume();
  master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 3);
  const dry = ctx.createGain();
  dry.gain.value = 0.7;
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  const rev = makeReverb(ctx);
  const comp = ctx.createDynamicsCompressor();
  master.connect(dry).connect(comp);
  master.connect(rev).connect(wet).connect(comp);
  comp.connect(ctx.destination);
  nextBar = ctx.currentTime + 0.1;
  barIndex = 0;
  tick();
  timer = setInterval(tick, 300);
}

function stopSynth() {
  clearInterval(timer);
  timer = null;
  if (master && ctx) {
    const m = master;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
    m.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    setTimeout(() => m.disconnect(), 1500);
  }
  master = null;
}

// ---------- 공개 함수 ----------
let playing = false;

// 반드시 버튼 클릭 같은 사용자 동작 안에서 불러야 합니다(브라우저 자동재생 정책).
export async function playBgm() {
  if (playing) return;
  playing = true;
  // 클릭 직후에 오디오를 깨워 둬야 아이폰 사파리에서도 소리가 납니다.
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  ctx.resume();
  if (await hasMp3()) {
    audioEl = audioEl || Object.assign(new Audio(MP3_SRC), { loop: true, volume: 0.6 });
    try {
      await audioEl.play();
      return;
    } catch {
      /* 실패하면 직접 연주로 */
    }
  }
  startSynth();
}

export function stopBgm() {
  playing = false;
  if (audioEl) audioEl.pause();
  stopSynth();
}
