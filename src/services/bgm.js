// 인생 연표 배경음악.
// public/audio/bgm.mp3 파일이 있으면 그 곡을 틀고, 없으면 브라우저에서 잔잔한 피아노 곡을 직접 만들어(합성) 틀어요.
// 합성한 곡은 미리 한 번 파일(WAV)로 만들어 두고 일반 <audio>로 재생합니다.
//   - 아이폰 무음 스위치에 막히지 않고 (웹오디오 연주는 막힘)
//   - 화면을 누르는 순간 바로 play()를 불러 모바일 자동재생 규칙을 통과합니다.

const MP3_SRC = '/audio/bgm.mp3';

// ---------- 피아노 합성 ----------
// F장조 Fmaj7 – C/E – Dm7 – B♭maj(add9) 반복, 느린 아르페지오 + 멜로디 + 부드러운 패드
const BPM = 64;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const LOOP_BARS = 8;
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

function makeReverb(c) {
  const len = Math.floor(c.sampleRate * 3);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

function piano(c, time, midi, dur, vel, out) {
  const f = freq(midi);
  const g = c.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vel, time + 0.012);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, time + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 1.6);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(5200, f * 6), time);
  lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 1.5), time + dur + 1);
  [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([mul, type, amp]) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = f * mul;
    o.detune.value = (Math.random() - 0.5) * 4;
    const og = c.createGain();
    og.gain.value = amp;
    o.connect(og).connect(lp);
    o.start(time);
    o.stop(time + dur + 1.8);
  });
  lp.connect(g).connect(out);
}

function pad(c, time, notes, dur, out) {
  notes.forEach((m) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq(m);
    const g = c.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.025, time + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, time + dur + 0.3);
    o.connect(g).connect(out);
    o.start(time);
    o.stop(time + dur + 0.4);
  });
}

function scheduleBar(c, t, i, out) {
  const chord = CHORDS[i % CHORDS.length];
  piano(c, t, chord.bass, BAR, 0.16, out);
  pad(c, t, chord.notes, BAR, out);
  // 8분음표 아르페지오: 1-2-3-4-3-2-3-4
  [0, 1, 2, 3, 2, 1, 2, 3].forEach((n, k) => {
    piano(c, t + k * (BEAT / 2), chord.notes[n], BEAT * 0.9, 0.055 + (k === 0 ? 0.02 : 0), out);
  });
  MELODY[i % MELODY.length].forEach(([b, m, d]) => piano(c, t + b * BEAT, m, d * BEAT, 0.12, out));
}

// 8마디(약 30초)를 미리 연주해 WAV 파일로 만듭니다. 끝의 여운은 처음에 겹쳐서 이음새 없이 반복됩니다.
async function renderWav() {
  const rate = 32000;
  const loopSec = BAR * LOOP_BARS;
  const tailSec = 3.5;
  const total = Math.ceil((loopSec + tailSec) * rate);
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const c = new Offline(1, total, rate);

  const master = c.createGain();
  master.gain.value = 0.9;
  const dry = c.createGain();
  dry.gain.value = 0.7;
  const wet = c.createGain();
  wet.gain.value = 0.55;
  const comp = c.createDynamicsCompressor();
  master.connect(dry).connect(comp);
  master.connect(makeReverb(c)).connect(wet).connect(comp);
  comp.connect(c.destination);

  for (let i = 0; i < LOOP_BARS; i++) scheduleBar(c, 0.05 + i * BAR, i, master);

  const rendered = await c.startRendering();
  const data = rendered.getChannelData(0);
  const loopLen = Math.floor(loopSec * rate);
  const out = new Float32Array(loopLen);
  out.set(data.subarray(0, loopLen));
  for (let i = 0; i < total - loopLen && i < loopLen; i++) out[i] += data[loopLen + i]; // 여운을 처음에 겹침
  return encodeWav(out, rate);
}

function encodeWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((ch, k) => v.setUint8(o + k, ch.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  let peak = 0;
  samples.forEach((x) => { peak = Math.max(peak, Math.abs(x)); });
  const gain = peak > 0 ? 0.85 / peak : 1; // 소리 크기 맞추기
  samples.forEach((x, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x * gain)) * 32767, true));
  return new Blob([buf], { type: 'audio/wav' });
}

// ---------- 재생 ----------
// 아주 짧은 무음 WAV. 화면을 누른 순간 이걸로 오디오를 먼저 깨워 둡니다.
const SILENT = (() => {
  const s = new Uint8Array(44 + 2000);
  const v = new DataView(s.buffer);
  const str = (o, t) => [...t].forEach((ch, k) => v.setUint8(o + k, ch.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + 2000, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, 2000, true);
  let bin = '';
  s.forEach((b) => { bin += String.fromCharCode(b); });
  return 'data:audio/wav;base64,' + btoa(bin);
})();

const TARGET_VOLUME = 0.7;
let el = null;
let srcUrl = '';
let preparing = null;
let want = false; // 음악을 켜 두려는 상태
let fadeTimer = null;

async function hasMp3() {
  try {
    const r = await fetch(MP3_SRC, { method: 'HEAD' });
    return r.ok && (r.headers.get('content-type') || '').includes('audio');
  } catch {
    return false;
  }
}

// 곡을 미리 준비해 둡니다. 페이지가 열리자마자 불러 두면, 화면을 누르는 순간 바로 재생돼요.
export function prepareBgm() {
  if (!preparing) {
    preparing = (async () => {
      if (await hasMp3()) return (srcUrl = MP3_SRC);
      return (srcUrl = URL.createObjectURL(await renderWav()));
    })().catch((e) => {
      console.warn('배경음악 준비 실패:', e);
      preparing = null;
      return '';
    });
  }
  return preparing;
}

function audio() {
  if (!el) {
    el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    el.volume = 0;
  }
  return el;
}

function fadeIn() {
  clearInterval(fadeTimer);
  const a = audio();
  a.volume = 0;
  fadeTimer = setInterval(() => {
    a.volume = Math.min(TARGET_VOLUME, a.volume + TARGET_VOLUME / 30);
    if (a.volume >= TARGET_VOLUME) clearInterval(fadeTimer);
  }, 100);
}

// 아이폰: 무음 스위치가 켜져 있어도 미디어 소리가 나오게 합니다(지원하는 기기에서).
function mediaSession() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {
    /* 무시 */
  }
}

// 음악을 켭니다. 소리가 실제로 나면 true, 브라우저가 막았으면 false를 돌려줍니다.
// 막힌 경우에도 want는 유지되므로, 사용자가 화면을 누를 때 다시 부르면 됩니다.
export async function playBgm() {
  want = true;
  mediaSession();
  const a = audio();
  const ready = srcUrl || '';
  try {
    if (ready) {
      // 곡이 이미 준비됨: 누른 순간 바로 재생(모바일 규칙 통과)
      if (a.src !== new URL(ready, location.href).href) a.src = ready;
      await a.play();
    } else {
      // 아직 만드는 중: 무음으로 먼저 오디오를 깨워 두고, 곡이 완성되면 바꿔 재생
      a.src = SILENT;
      await a.play();
      const url = await prepareBgm();
      if (!want || !url) return false;
      a.src = url;
      await a.play();
    }
    fadeIn();
    return true;
  } catch {
    return false;
  }
}

export function isBgmAudible() {
  return want && !!el && !el.paused && el.src !== SILENT && el.volume >= 0;
}

// 사용자가 화면을 누른 순간에 부릅니다(자동재생이 막혔을 때).
export function resumeBgm() {
  return playBgm();
}

export function stopBgm() {
  want = false;
  clearInterval(fadeTimer);
  if (el) {
    el.pause();
    el.volume = 0;
  }
}

export const getBgmUrl = () => srcUrl;
