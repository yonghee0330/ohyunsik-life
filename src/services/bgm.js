// 배경음악.
// 곡마다 public/audio/<곡>.mp3 파일이 있으면 그 곡을 틀고(연표는 bgm.mp3), 없으면 브라우저에서 잔잔한 피아노 곡을 직접 만들어(합성) 틀어요.
// 합성한 곡은 미리 한 번 파일(WAV)로 만들어 두고 일반 <audio>로 재생합니다.
//   - 아이폰 무음 스위치에 막히지 않고 (웹오디오 연주는 막힘)
//   - 화면을 누르는 순간 바로 play()를 불러 모바일 자동재생 규칙을 통과합니다.

// ---------- 곡 ----------
// 곡마다 8마디: 화음 4개를 두 번 돌고, 마디마다 멜로디 (박, MIDI, 길이).
// arp: 아르페지오 순서(화음 음 번호), arpDiv: 한 박에 몇 음(2=8분음표, 1=4분음표)
export const SONGS = {
  // 인생 연표: F장조 Fmaj7 – C/E – Dm7 – B♭maj(add9)
  timeline: {
    mp3: '/audio/bgm.mp3',
    bpm: 64,
    chords: [
      { bass: 41, notes: [53, 57, 60, 64] }, // Fmaj7
      { bass: 40, notes: [52, 55, 60, 64] }, // C/E
      { bass: 38, notes: [50, 53, 57, 60] }, // Dm7
      { bass: 34, notes: [46, 53, 57, 62] }, // B♭maj(add9)
    ],
    melody: [
      [[0, 72, 1.5], [1.5, 69, 0.5], [2, 67, 2]],
      [[0, 67, 1], [1, 69, 1], [2, 64, 2]],
      [[0, 65, 1.5], [1.5, 64, 0.5], [2, 62, 2]],
      [[0, 62, 1], [1, 65, 1], [2, 69, 2]],
      [[0, 72, 1], [1, 74, 1], [2, 72, 2]],
      [[0, 71, 1], [1, 67, 1], [2, 64, 2]],
      [[0, 69, 1.5], [1.5, 65, 0.5], [2, 62, 2]],
      [[0, 65, 2], [2, 67, 1], [3, 69, 1]],
    ],
    arp: [0, 1, 2, 3, 2, 1, 2, 3],
    arpDiv: 2,
    arpVel: 0.055,
    melVel: 0.12,
  },
  // 편지 · 밝은 축하: C장조 C – G/B – Am – F, 조금 빠르고 경쾌하게
  bright: {
    mp3: '/audio/letter-bright.mp3',
    bpm: 80,
    chords: [
      { bass: 36, notes: [60, 64, 67, 72] }, // C
      { bass: 35, notes: [59, 62, 67, 71] }, // G/B
      { bass: 33, notes: [57, 60, 64, 69] }, // Am
      { bass: 29, notes: [53, 57, 60, 65] }, // F
    ],
    melody: [
      [[0, 76, 1], [1, 79, 1], [2, 76, 1], [3, 72, 1]],
      [[0, 74, 1.5], [1.5, 71, 0.5], [2, 74, 2]],
      [[0, 72, 1], [1, 76, 1], [2, 81, 2]],
      [[0, 77, 1], [1, 76, 1], [2, 72, 2]],
      [[0, 79, 1], [1, 76, 0.5], [1.5, 77, 0.5], [2, 79, 2]],
      [[0, 74, 1], [1, 79, 1], [2, 71, 2]],
      [[0, 72, 1], [1, 74, 1], [2, 76, 1], [3, 77, 1]],
      [[0, 76, 2], [2, 74, 1], [3, 72, 1]],
    ],
    arp: [0, 1, 2, 3, 2, 3, 1, 2],
    arpDiv: 2,
    arpVel: 0.06,
    melVel: 0.13,
  },
  // 편지 · 따뜻한 감사: G장조 Gmaj7 – Em7 – C(add9) – D
  grateful: {
    mp3: '/audio/letter-grateful.mp3',
    bpm: 68,
    chords: [
      { bass: 43, notes: [55, 59, 62, 66] }, // Gmaj7
      { bass: 40, notes: [52, 55, 59, 62] }, // Em7
      { bass: 36, notes: [55, 60, 62, 64] }, // C(add9)
      { bass: 38, notes: [54, 57, 62, 64] }, // D(add9)
    ],
    melody: [
      [[0, 71, 1.5], [1.5, 74, 0.5], [2, 79, 2]],
      [[0, 78, 1], [1, 76, 1], [2, 71, 2]],
      [[0, 72, 1], [1, 74, 1], [2, 76, 2]],
      [[0, 74, 1.5], [1.5, 72, 0.5], [2, 69, 2]],
      [[0, 71, 1], [1, 74, 1], [2, 79, 1], [3, 81, 1]],
      [[0, 79, 1.5], [1.5, 76, 0.5], [2, 74, 2]],
      [[0, 72, 1], [1, 76, 1], [2, 74, 1], [3, 72, 1]],
      [[0, 71, 2], [2, 69, 1], [3, 74, 1]],
    ],
    arp: [0, 1, 2, 3, 2, 1, 2, 3],
    arpDiv: 2,
    arpVel: 0.05,
    melVel: 0.12,
  },
  // 편지 · 그리움·뭉클: A단조 Am – F – C – E, 느리고 성기게
  tender: {
    mp3: '/audio/letter-tender.mp3',
    bpm: 56,
    chords: [
      { bass: 33, notes: [52, 57, 60, 64] }, // Am
      { bass: 29, notes: [53, 57, 60, 65] }, // F
      { bass: 36, notes: [52, 55, 60, 64] }, // C
      { bass: 40, notes: [52, 56, 59, 62] }, // E7
    ],
    melody: [
      [[0, 76, 2], [2, 72, 1], [3, 71, 1]],
      [[0, 72, 2], [2, 69, 2]],
      [[0, 67, 1], [1, 72, 1], [2, 76, 2]],
      [[0, 74, 2], [2, 71, 1], [3, 68, 1]],
      [[0, 69, 1], [1, 72, 1], [2, 76, 1.5], [3.5, 77, 0.5]],
      [[0, 76, 1], [1, 74, 1], [2, 72, 2]],
      [[0, 71, 1], [1, 72, 1], [2, 74, 2]],
      [[0, 71, 3], [3, 68, 1]],
    ],
    arp: [0, 1, 2, 1, 3, 2, 1, 2],
    arpDiv: 2,
    arpVel: 0.045,
    melVel: 0.11,
  },
  // 편지 · 편안한: D장조 Dmaj7 – Bm7 – Gmaj7 – A, 아주 느리게
  calm: {
    mp3: '/audio/letter-calm.mp3',
    bpm: 60,
    chords: [
      { bass: 38, notes: [50, 54, 57, 61] }, // Dmaj7
      { bass: 35, notes: [50, 54, 57, 59] }, // Bm7
      { bass: 31, notes: [54, 55, 59, 62] }, // Gmaj7
      { bass: 33, notes: [52, 57, 62, 64] }, // A(sus4)
    ],
    melody: [
      [[0, 73, 2], [2, 69, 2]],
      [[0, 71, 1], [1, 74, 1], [2, 73, 2]],
      [[0, 71, 2], [2, 67, 1], [3, 69, 1]],
      [[0, 69, 4]],
      [[0, 74, 1], [1, 76, 1], [2, 78, 2]],
      [[0, 76, 1.5], [1.5, 74, 0.5], [2, 71, 2]],
      [[0, 74, 1], [1, 71, 1], [2, 67, 2]],
      [[0, 69, 2], [2, 73, 2]],
    ],
    arp: [0, 1, 2, 3],
    arpDiv: 1,
    arpVel: 0.06,
    melVel: 0.11,
  },
};
const LOOP_BARS = 8;

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

function scheduleBar(c, song, t, i, out) {
  const beat = 60 / song.bpm;
  const bar = beat * 4;
  const chord = song.chords[i % song.chords.length];
  piano(c, t, chord.bass, bar, 0.16, out);
  pad(c, t, chord.notes, bar, out);
  const step = beat / song.arpDiv;
  for (let k = 0; k < 4 * song.arpDiv; k++) {
    const n = song.arp[k % song.arp.length];
    piano(c, t + k * step, chord.notes[n], step * 1.8, song.arpVel + (k === 0 ? 0.02 : 0), out);
  }
  song.melody[i % song.melody.length].forEach(([b, m, d]) => piano(c, t + b * beat, m, d * beat, song.melVel, out));
}

// 8마디를 미리 연주해 WAV 파일로 만듭니다. 끝의 여운은 처음에 겹쳐서 이음새 없이 반복됩니다.
async function renderWav(song) {
  const rate = 32000;
  const bar = (60 / song.bpm) * 4;
  const loopSec = bar * LOOP_BARS;
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

  for (let i = 0; i < LOOP_BARS; i++) scheduleBar(c, song, 0.05 + i * bar, i, master);

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
const urls = {}; // 곡 이름 → 준비된 주소
const preparing = {}; // 곡 이름 → 준비 중인 Promise
let current = 'timeline'; // 지금 틀려는 곡
let want = false; // 음악을 켜 두려는 상태
let fadeTimer = null;

async function hasMp3(src) {
  try {
    const r = await fetch(src, { method: 'HEAD' });
    return r.ok && (r.headers.get('content-type') || '').includes('audio');
  } catch {
    return false;
  }
}

// 곡을 미리 준비해 둡니다. 페이지가 열리자마자 불러 두면, 화면을 누르는 순간 바로 재생돼요.
export function prepareBgm(name = 'timeline') {
  const song = SONGS[name] || SONGS.timeline;
  if (!preparing[name]) {
    preparing[name] = (async () => {
      if (await hasMp3(song.mp3)) return (urls[name] = song.mp3);
      return (urls[name] = URL.createObjectURL(await renderWav(song)));
    })().catch((e) => {
      console.warn('배경음악 준비 실패:', e);
      delete preparing[name];
      return '';
    });
  }
  return preparing[name];
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

function fadeOut(ms = 900) {
  clearInterval(fadeTimer);
  const a = audio();
  const from = a.volume;
  if (a.paused || from === 0) return Promise.resolve();
  return new Promise((done) => {
    fadeTimer = setInterval(() => {
      a.volume = Math.max(0, a.volume - from / (ms / 60));
      if (a.volume <= 0) {
        clearInterval(fadeTimer);
        done();
      }
    }, 60);
  });
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
// name: 틀 곡(SONGS의 이름). 다른 곡이 나오던 중이면 살짝 줄였다가 바꿔 틉니다.
export async function playBgm(name = current) {
  want = true;
  current = name;
  mediaSession();
  const a = audio();
  const ready = urls[name] || '';
  try {
    if (ready) {
      // 곡이 이미 준비됨: 누른 순간 바로 재생(모바일 규칙 통과)
      const href = new URL(ready, location.href).href;
      if (a.src !== href) {
        if (!a.paused && a.src !== SILENT) await fadeOut();
        if (!want || current !== name) return false;
        a.src = ready;
      }
      await a.play();
    } else {
      // 아직 만드는 중: 무음으로 먼저 오디오를 깨워 두고, 곡이 완성되면 바꿔 재생
      if (!a.paused && a.src !== SILENT) await fadeOut();
      a.src = SILENT;
      await a.play();
      const url = await prepareBgm(name);
      if (!want || !url || current !== name) return false;
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
  return playBgm(current);
}

export function stopBgm() {
  want = false;
  clearInterval(fadeTimer);
  if (el) {
    el.pause();
    el.volume = 0;
  }
}

export const getBgmUrl = (name = current) => urls[name] || '';
