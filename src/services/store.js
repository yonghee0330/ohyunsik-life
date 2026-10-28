// 데이터 저장소 (Firebase). 설정값은 .env.local(로컬)과 GitHub 저장소 Variables(배포)에서 읽습니다.
// 브라우저에만 저장하던 예전 버전은 store.local.js에 남아 있습니다.

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
  return {
    ...d,
    id: snap.id,
    createdAt: ms(d.createdAt),
    ...(d.answeredAt !== undefined && { answeredAt: d.answeredAt ? ms(d.answeredAt) : 0 }),
  };
};

const list = async (name, dir) => {
  await ready;
  const snap = await getDocs(query(collection(db, name), orderBy('createdAt', dir)));
  return snap.docs.map(toItem);
};

// ---------- 편지 ----------
export const listLetters = () => list('letters', 'desc');

export async function addLetter({ from, title, body }) {
  await ready;
  const r = await addDoc(collection(db, 'letters'), { from, title, body, createdAt: serverTimestamp() });
  return { id: r.id, from, title, body, createdAt: Date.now() };
}

// ---------- 감사 100가지 ----------
export const listGratitude = () => list('gratitude', 'asc');

export async function addGratitude({ name, text }) {
  await ready;
  const r = await addDoc(collection(db, 'gratitude'), { name, text, createdAt: serverTimestamp() });
  return { id: r.id, name, text, createdAt: Date.now() };
}

// ---------- 아버님의 목소리 ----------
export async function listVoices() {
  const items = await list('voices', 'desc');
  return items.map((v) => ({ ...v, answeredAt: v.answeredAt || 0, audio: v.audio || '', text: v.text || '' }));
}

export async function addQuestion({ question, askedBy }) {
  await ready;
  const r = await addDoc(collection(db, 'voices'), {
    question, askedBy, audio: '', audioPath: '', text: '', answeredAt: null, createdAt: serverTimestamp(),
  });
  return { id: r.id, question, askedBy, audio: '', text: '', createdAt: Date.now(), answeredAt: 0 };
}

// audio는 화면에서 dataURL로 넘어옵니다. Storage에 올리고 URL을 저장합니다.
export async function answerVoice(id, { audio, text }) {
  const me = await uid();
  let url = '';
  let audioPath = '';
  if (audio) {
    const blob = await (await fetch(audio)).blob();
    const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
    audioPath = `voices/${me}/${Date.now()}.${ext}`;
    const fileRef = ref(storage, audioPath);
    await uploadBytes(fileRef, blob, { contentType: blob.type });
    url = await getDownloadURL(fileRef);
  }
  await updateDoc(doc(db, 'voices', id), { audio: url, audioPath, text, answeredAt: serverTimestamp() });
}

export async function deleteVoice(id) {
  await ready;
  const d = await getDoc(doc(db, 'voices', id));
  const path = d.exists() ? d.data().audioPath : '';
  if (path) {
    try { await deleteObject(ref(storage, path)); } catch (e) { console.warn('Storage 삭제 실패(문서는 지웁니다):', e); }
  }
  await deleteDoc(doc(db, 'voices', id));
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('녹음을 저장할 수 없어요.'));
    r.readAsDataURL(blob);
  });
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
