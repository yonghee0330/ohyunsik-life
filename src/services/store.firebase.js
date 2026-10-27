// Firebase 버전 저장소. store.js와 함수 이름·모양이 같습니다.
// 사용법은 DB_SETUP.md 7번: `npm install firebase` → .env.local 작성 → 이 파일을 store.js로 바꿔 끼우기.

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const AI_MODEL = 'gemini-2.5-flash';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 모든 요청 전에 익명 로그인이 끝나 있어야 규칙(request.auth)을 통과합니다.
const ready = signInAnonymously(auth).catch((e) => {
  console.error('익명 로그인 실패(콘솔에서 익명 로그인 사용 설정 확인):', e);
  throw e;
});
const uid = async () => (await ready).user.uid;

// Firestore timestamp → 화면에서 쓰는 숫자(ms)
const toItem = (snap) => {
  const d = snap.data();
  const ms = (t) => (t?.toMillis ? t.toMillis() : t ?? Date.now());
  return { ...d, id: snap.id, createdAt: ms(d.createdAt), updatedAt: d.updatedAt ? ms(d.updatedAt) : undefined };
};

const list = async (name, dir) => {
  await ready;
  const snap = await getDocs(query(collection(db, name), orderBy('createdAt', dir)));
  return snap.docs.map(toItem);
};

// ---------- 방명록 ----------
export const listGuestbook = () => list('guestbook', 'desc');

export async function addGuestbook({ name, message }) {
  await ready;
  const r = await addDoc(collection(db, 'guestbook'), { name, message, createdAt: serverTimestamp() });
  return { id: r.id, name, message, createdAt: Date.now() };
}

// ---------- 사진첩 ----------
export const listPhotos = () => list('photos', 'asc');

export async function addPhoto(file, { title, era, story }) {
  const me = await uid();
  const blob = await resizeToBlob(file, 1280);
  const storagePath = `photos/${me}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
  const src = await getDownloadURL(fileRef);
  const data = { src, storagePath, title, era, story, createdBy: me, createdAt: serverTimestamp() };
  const r = await addDoc(collection(db, 'photos'), data);
  return { ...data, id: r.id, createdAt: Date.now() };
}

export async function updatePhoto(id, patch) {
  await ready;
  const { title, era, story } = patch;
  await updateDoc(doc(db, 'photos', id), { title, era, story });
}

export async function deletePhoto(id) {
  await ready;
  const d = await getDoc(doc(db, 'photos', id));
  const path = d.exists() ? d.data().storagePath : null;
  if (path) {
    try {
      await deleteObject(ref(storage, path));
    } catch (e) {
      console.warn('Storage 삭제 실패(문서는 지웁니다):', e);
    }
  }
  await deleteDoc(doc(db, 'photos', id));
}

// ---------- 인생 기록장 ----------
export const listStories = () => list('stories', 'desc');

export async function saveStory(story) {
  await ready;
  const { id, topic, title, body, answers = [], photoIds = [] } = story;
  const data = { topic, title, body, answers, photoIds, updatedAt: serverTimestamp() };
  if (id) {
    await updateDoc(doc(db, 'stories', id), data);
    return story;
  }
  const r = await addDoc(collection(db, 'stories'), { ...data, createdAt: serverTimestamp() });
  return { ...story, id: r.id, createdAt: Date.now(), updatedAt: Date.now() };
}

export async function deleteStory(id) {
  await ready;
  await deleteDoc(doc(db, 'stories', id));
}

// 이어서 쓰기 임시본은 기기에만 둡니다.
const DRAFT_KEY = 'ohs-life:draft';
export async function getDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { return null; }
}
export async function saveDraft(draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* 무시 */ }
}
export async function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* 무시 */ }
}

// 답변 → 한 편의 글. VITE_USE_AI=true면 Gemini로 다듬고, 실패하면 단순 정리.
export async function composeStory(topicTitle, answers) {
  const filled = answers.filter((a) => a.answer.trim());
  if (!filled.length) return { title: `${topicTitle} 이야기`, body: '' };
  if (import.meta.env.VITE_USE_AI === 'true') {
    try {
      return await composeWithAI(topicTitle, filled);
    } catch (e) {
      console.warn('AI 정리 실패, 단순 정리로 전환:', e);
    }
  }
  const lines = filled.map((a) => a.answer.trim()).map((t) => (/[.!?다요음]$/.test(t) ? t : t + '.'));
  return {
    title: `${topicTitle}의 추억`,
    body: [`나는 ${topicTitle}에 대해 이렇게 기억한다.`, ...lines, '지금도 그 시절을 떠올리면 마음이 따뜻해진다.'].join('\n\n'),
  };
}

async function composeWithAI(topicTitle, answers) {
  const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai');
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, { model: AI_MODEL });
  const qa = answers.map((a) => `Q. ${a.question}\nA. ${a.answer}`).join('\n\n');
  const prompt = [
    `아래는 아버지가 "${topicTitle}"에 대해 답한 내용입니다.`,
    '이것을 본인이 쓴 것처럼 1인칭 회고체의 짧은 글(3~6문단)로 다듬어 주세요.',
    '규칙: 답변에 없는 사실·이름·날짜를 지어내지 말 것. 말투는 따뜻하고 담백하게. 마지막은 감사와 긍정으로.',
    '출력 형식: 첫 줄은 제목만, 빈 줄 하나, 그 다음 본문.',
    '',
    qa,
  ].join('\n');
  const res = await model.generateContent(prompt);
  const text = res.response.text().trim();
  const [first, ...rest] = text.split('\n');
  return { title: first.replace(/^[#\s"“]+|["”]+$/g, '').trim(), body: rest.join('\n').trim() };
}

// ---------- 가족 확인 ----------
// familyMembers/{uid}에 pin을 쓰는 데 성공하면 가족. 비교는 보안 규칙이 합니다.
const FAMILY_KEY = 'ohs-life:family';
export async function checkFamilyPin(pin) {
  try {
    await setDoc(doc(db, 'familyMembers', await uid()), { pin, createdAt: serverTimestamp() });
    localStorage.setItem(FAMILY_KEY, 'true');
    return true;
  } catch {
    return false;
  }
}

// 화면 표시용. 실제 쓰기 권한은 보안 규칙이 판단합니다.
export function isFamily() {
  try { return localStorage.getItem(FAMILY_KEY) === 'true'; } catch { return false; }
}

// ---------- helpers ----------
function resizeToBlob(file, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('사진 준비에 실패했어요.'))), 'image/jpeg', 0.82);
    };
    img.onerror = () => reject(new Error('사진을 읽을 수 없어요.'));
    img.src = URL.createObjectURL(file);
  });
}
