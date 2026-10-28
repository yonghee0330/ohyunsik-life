// 데이터 저장소 (DB 연결 지점)
// 지금은 브라우저 localStorage에 저장합니다 = 이 기기에서만 보입니다.
// DB(Firebase/Supabase 등)를 연결할 때는 아래 함수들의 "안쪽"만 바꾸면
// 화면 코드는 그대로 동작합니다. 모든 함수는 Promise를 돌려줍니다.
//
// 컬렉션 구조 (DB_SETUP.md 참고)
//   letters   : { id, from, title, body, createdAt }
//   gratitude : { id, name, text, createdAt }
//   voices    : { id, question, askedBy, audio, text, createdAt, answeredAt }
//   photos    : { id, src, title, era, story, createdAt }   <- 사진첩에 가족이 올린 사진

const KEY = 'ohs-life:';

function read(name, fallback) {
  try {
    const raw = localStorage.getItem(KEY + name);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(name, value) {
  try {
    localStorage.setItem(KEY + name, JSON.stringify(value));
  } catch (e) {
    console.warn('저장 실패(용량 초과 등):', e);
    throw e;
  }
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- 편지 (아버님께 드리는 편지) ----------
export async function listLetters() {
  return read('letters', []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addLetter({ from, title, body, paper = 'cream' }) {
  const item = { id: uid(), from, title, body, paper, createdAt: Date.now() };
  write('letters', [item, ...read('letters', [])]);
  return item;
}

// ---------- 감사 100가지 ----------
export async function listGratitude() {
  return read('gratitude', []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function addGratitude({ name, text, color }) {
  const item = { id: uid(), name, text, color, createdAt: Date.now() };
  write('gratitude', [...read('gratitude', []), item]);
  return item;
}

// ---------- 아버님의 목소리 (질문 → 음성 답변) ----------
export async function listVoices() {
  return read('voices', []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addQuestion({ question, askedBy }) {
  const item = { id: uid(), question, askedBy, audio: '', text: '', createdAt: Date.now(), answeredAt: 0 };
  write('voices', [item, ...read('voices', [])]);
  return item;
}

// audio: dataURL(녹음). DB 연결 시 Storage에 올리고 URL을 audio에 저장하세요.
export async function answerVoice(id, { audio, text }) {
  write('voices', read('voices', []).map((v) => (v.id === id ? { ...v, audio, text, answeredAt: Date.now() } : v)));
}

export async function deleteVoice(id) {
  write('voices', read('voices', []).filter((v) => v.id !== id));
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('녹음을 저장할 수 없어요.'));
    r.readAsDataURL(blob);
  });
}

// ---------- 사진첩 (가족이 올린 사진) ----------
export async function listPhotos() {
  return read('photos', []);
}

// file: File 객체. DB 연결 시 Storage에 업로드하고 URL을 src로 저장하세요.
export async function addPhoto(file, { title, era, story }) {
  const src = await resizeToDataUrl(file, 1280);
  const item = { id: uid(), src, title, era, story, createdAt: Date.now() };
  write('photos', [...read('photos', []), item]);
  return item;
}

export async function updatePhoto(id, patch) {
  write('photos', read('photos', []).map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

export async function deletePhoto(id) {
  write('photos', read('photos', []).filter((p) => p.id !== id));
}

// ---------- 가족 확인 ----------
// DB 연결 시 서버에서 비밀번호를 확인하도록 바꾸세요.
export async function checkFamilyPin(pin, expected = '0000') {
  const ok = pin === expected;
  if (ok) write('family', true);
  return ok;
}

export function isFamily() {
  return read('family', false) === true;
}

// ---------- helpers ----------
function resizeToDataUrl(file, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('사진을 읽을 수 없어요.'));
    img.src = URL.createObjectURL(file);
  });
}
