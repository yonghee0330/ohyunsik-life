// 데이터 저장소 (DB 연결 지점)
// 지금은 브라우저 localStorage에 저장합니다 = 이 기기에서만 보입니다.
// DB(Firebase/Supabase 등)를 연결할 때는 아래 함수들의 "안쪽"만 바꾸면
// 화면 코드는 그대로 동작합니다. 모든 함수는 Promise를 돌려줍니다.
//
// 컬렉션 구조 (README.md 참고)
//   guestbook : { id, name, message, createdAt }
//   photos    : { id, src, title, era, story, createdAt }   ← 사진첩에 가족이 올린 사진
//   stories   : { id, topic, title, body, answers[], photoIds[], createdAt, updatedAt }
//   drafts    : { topic, answers[] }                         ← 이어서 쓰기용

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

// ---------- 방명록 ----------
export async function listGuestbook() {
  return read('guestbook', []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addGuestbook({ name, message }) {
  const item = { id: uid(), name, message, createdAt: Date.now() };
  write('guestbook', [item, ...read('guestbook', [])]);
  return item;
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

// ---------- 인생 기록장 ----------
export async function listStories() {
  return read('stories', []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveStory(story) {
  const all = read('stories', []);
  const now = Date.now();
  if (story.id) {
    write('stories', all.map((s) => (s.id === story.id ? { ...s, ...story, updatedAt: now } : s)));
    return story;
  }
  const item = { ...story, id: uid(), createdAt: now, updatedAt: now };
  write('stories', [item, ...all]);
  return item;
}

export async function deleteStory(id) {
  write('stories', read('stories', []).filter((s) => s.id !== id));
}

export async function getDraft() {
  return read('draft', null);
}

export async function saveDraft(draft) {
  write('draft', draft);
}

export async function clearDraft() {
  localStorage.removeItem(KEY + 'draft');
}

// 답변들을 한 편의 글로 정리합니다.
// 지금은 단순 이어붙이기입니다. AI(Gemini/Claude 등) 연결 시 이 함수만 교체하세요.
export async function composeStory(topicTitle, answers) {
  const lines = answers
    .map((a) => a.answer.trim())
    .filter(Boolean)
    .map((t) => (/[.!?다요음]$/.test(t) ? t : t + '.'));
  if (!lines.length) return { title: `${topicTitle} 이야기`, body: '' };
  return {
    title: `${topicTitle}의 추억`,
    body: [`나는 ${topicTitle}에 대해 이렇게 기억한다.`, ...lines, '지금도 그 시절을 떠올리면 마음이 따뜻해진다.'].join('\n\n'),
  };
}

// ---------- 가족 확인 ----------
// DB 연결 시 서버에서 비밀번호를 확인하도록 바꾸세요.
export async function checkFamilyPin(pin, expected) {
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
