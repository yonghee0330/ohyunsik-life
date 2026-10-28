# DB 연결 가이드 (별도 프로젝트에서 세팅)

이 사이트는 데이터를 모두 `src/services/store.js` 한 파일에서 다룹니다.
Firebase 프로젝트를 만든 뒤 **`store.firebase.js`를 `store.js`로 바꿔 끼우면** 화면 코드는 그대로 동작합니다.

---

## 1. 무엇을 저장하나

| 메뉴 | 데이터 | 누가 쓰나 | 누가 보나 | 저장 위치 |
|---|---|---|---|---|
| 편지 | 긴 편지 | 누구나 | 누구나 | Firestore `letters` |
| 감사 100가지 | 한 줄 감사 | 누구나 | 누구나 | Firestore `gratitude` |
| 목소리 | 질문 | 누구나 | 누구나 | Firestore `voices` |
| 목소리 | 아버님의 답(녹음·글) | **가족만** | 누구나 | Firestore `voices` + Storage `voices/` |
| 사진첩 | 가족이 올린 사진 | **가족만** | 누구나 | Firestore `photos` + Storage `photos/` |
| (설정) | 가족 비밀번호 | 관리자(콘솔) | 아무도 못 읽음 | Firestore `settings/access` |
| (인증) | 가족 인증 기록 | 비밀번호 맞힌 기기 | 아무도 못 읽음 | Firestore `familyMembers/{uid}` |

코드에 들어 있어서 DB가 필요 없는 것: 인생 연표 글, 함께 걸어온 곳(지도), 기본 사진 20장, 영상 주소(`src/config.js`).

## 2. 컬렉션 구조

```
letters/{autoId}
  from: string            // 최대 20자
  title: string           // 선택, 최대 40자
  body: string            // 최대 3000자
  createdAt: timestamp

gratitude/{autoId}
  name: string            // 최대 20자
  text: string            // 최대 120자
  createdAt: timestamp

voices/{autoId}
  question: string        // 최대 200자
  askedBy: string         // 최대 20자
  audio: string           // 답변 녹음 Storage URL (없으면 '')
  audioPath: string       // 삭제할 때 필요 (voices/{uid}/{파일명})
  text: string            // 답변 글 (선택)
  createdAt: timestamp
  answeredAt: timestamp | null   // 답하기 전에는 null

photos/{autoId}
  src: string             // Storage 다운로드 URL
  storagePath: string
  title, era, story: string
  createdAt: timestamp
  createdBy: string       // uid

settings/access
  pin: string             // 가족 비밀번호. 콘솔에서 직접 만듭니다.

familyMembers/{uid}
  pin: string
  createdAt: timestamp
```

> 화면 코드는 `createdAt`을 숫자(ms)로 씁니다. `store.firebase.js`가 timestamp를 숫자로 바꿔서 돌려줍니다.

## 3. 가족 확인 방식 (서버 없이)

1. 사이트에 들어오면 **익명 로그인**으로 각 기기에 uid가 생깁니다.
2. 가족이 비밀번호를 넣으면 `familyMembers/{내 uid}`에 `{ pin }`을 쓰려고 시도합니다.
3. 보안 규칙이 `settings/access.pin`과 같을 때만 쓰기를 허락합니다. 비밀번호 문서는 아무도 읽을 수 없지만 규칙 안의 `get()`으로는 비교할 수 있습니다.
4. 쓰기가 성공하면 그 기기는 가족입니다. 사진 올리기, 아버님 답변 녹음·삭제는 `familyMembers/{uid}`가 있어야만 됩니다.

비밀번호를 바꾸면 새로 들어오는 기기만 새 비밀번호를 써야 합니다. 이미 인증된 기기까지 끊으려면 `familyMembers` 컬렉션을 비우세요.

## 4. Firestore 보안 규칙

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function signedIn() { return request.auth != null; }
    function isFamily() {
      return signedIn() && exists(/databases/$(db)/documents/familyMembers/$(request.auth.uid));
    }
    function str(v, min, max) { return v is string && v.size() >= min && v.size() <= max; }

    match /settings/{doc} { allow read, write: if false; }

    match /familyMembers/{uid} {
      allow read: if false;
      allow create, update: if signedIn() && request.auth.uid == uid
        && request.resource.data.pin == get(/databases/$(db)/documents/settings/access).data.pin;
      allow delete: if false;
    }

    match /letters/{id} {
      allow read: if true;
      allow create: if signedIn()
        && request.resource.data.keys().hasOnly(['from', 'title', 'body', 'createdAt'])
        && str(request.resource.data.from, 1, 20)
        && str(request.resource.data.title, 0, 40)
        && str(request.resource.data.body, 1, 3000);
      allow update, delete: if false;          // 지울 일은 콘솔에서
    }

    match /gratitude/{id} {
      allow read: if true;
      allow create: if signedIn()
        && request.resource.data.keys().hasOnly(['name', 'text', 'createdAt'])
        && str(request.resource.data.name, 1, 20)
        && str(request.resource.data.text, 1, 120);
      allow update, delete: if false;
    }

    match /voices/{id} {
      allow read: if true;
      // 질문은 누구나 남기고, 답변(수정)과 삭제는 가족만
      allow create: if signedIn()
        && request.resource.data.keys().hasOnly(['question', 'askedBy', 'audio', 'audioPath', 'text', 'answeredAt', 'createdAt'])
        && str(request.resource.data.question, 1, 200)
        && str(request.resource.data.askedBy, 1, 20)
        && request.resource.data.audio == '' && request.resource.data.text == ''
        && request.resource.data.answeredAt == null;
      allow update, delete: if isFamily();
    }

    match /photos/{id} {
      allow read: if true;
      allow create, update, delete: if isFamily();
    }
  }
}
```

## 5. Storage 보안 규칙

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{uid}/{file} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
        && firestore.exists(/databases/(default)/documents/familyMembers/$(request.auth.uid))
        && (request.resource == null
            || (request.resource.size < 20 * 1024 * 1024 && request.resource.contentType.matches('image/.*')));
    }
    match /voices/{uid}/{file} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
        && firestore.exists(/databases/(default)/documents/familyMembers/$(request.auth.uid))
        && (request.resource == null
            || (request.resource.size < 15 * 1024 * 1024 && request.resource.contentType.matches('audio/.*')));
    }
  }
}
```

(Storage 규칙에서 `firestore.exists()`를 처음 쓰면 콘솔이 권한 연결을 물어봅니다. 허용하세요.)

## 6. Firebase 콘솔에서 할 일 (체크리스트)

- [ ] 새 Firebase 프로젝트 만들기 → 웹 앱 추가 → 설정값(apiKey 등 6개) 복사
- [ ] **Authentication** → 로그인 방법 → **익명** 사용 설정
- [ ] **Firestore Database** 만들기 (위치: `asia-northeast3` 서울)
- [ ] 문서 직접 추가: 컬렉션 `settings` / 문서 ID `access` / 필드 `pin`(string) = 가족 비밀번호
- [ ] Firestore 규칙에 4번 붙여넣기 → 게시
- [ ] **Storage** 시작 (같은 위치) → 규칙에 5번 붙여넣기 → 게시
- [ ] **Authentication → 설정 → 승인된 도메인**에 배포 도메인 추가 (`오현식.kr`의 퓨니코드: `xn--wv4bz3dmzt.kr`)
- [ ] (선택) **App Check** 켜기 — 아무나 API를 두드리는 것 방지

## 7. 사이트 쪽에서 할 일

1. 패키지 설치
   ```bash
   cd site
   npm install firebase
   ```
2. `site/.env.local` 만들기 (git에 올라가지 않음)
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. 저장소 교체
   ```bash
   mv src/services/store.js src/services/store.local.js
   mv src/services/store.firebase.js src/services/store.js
   ```
4. `src/config.js`의 `familyPin`은 더 이상 쓰이지 않습니다(비밀번호는 Firestore에서 확인).
5. `npm run dev`로 확인: 편지 쓰기 → 다른 기기에서도 보이는지, 질문 남기기 → 답하기(비밀번호) → 녹음 재생.

## 8. 함수별 교체 내역

| 함수 | 지금(localStorage) | Firebase |
|---|---|---|
| `listLetters()` / `addLetter()` | 배열 읽기·추가 | `letters` createdAt 내림차순 / `addDoc` |
| `listGratitude()` / `addGratitude()` | 배열 읽기·추가 | `gratitude` createdAt 오름차순 / `addDoc` |
| `listVoices()` / `addQuestion()` | 배열 읽기·추가 | `voices` 읽기 / `addDoc`(답 비어 있는 상태) |
| `answerVoice(id, {audio, text})` | dataURL을 그대로 저장 | dataURL → Storage 업로드 → URL을 `audio`에 |
| `deleteVoice(id)` | 배열에서 제거 | Storage 파일 삭제 → 문서 삭제 |
| `listPhotos/addPhoto/updatePhoto/deletePhoto` | 줄여서 dataURL 저장 | 1280px로 줄여 Storage 업로드, 삭제 시 파일도 삭제 |
| `checkFamilyPin(pin)` | config 값과 비교 | `familyMembers/{uid}` 쓰기 성공 여부 |
| `isFamily()` | localStorage 표시 | 그대로 (화면 표시용, 실제 권한은 규칙이 판단) |

## 9. 영상 올리기 (DB와 별개)

영상 파일이 약 470MB라 GitHub(파일당 100MB 제한)와 사이트에는 올릴 수 없습니다.

1. YouTube에 **일부 공개**로 업로드
2. 주소 끝의 영상 ID를 복사 (`https://youtu.be/AbCdEfGhIjK` → `AbCdEfGhIjK`)
3. `src/config.js`의 `VIDEO.youtubeId`에 붙여넣기 → 푸시하면 영상관에 나타납니다.

## 10. 배포

- **Firebase Hosting**(같은 프로젝트) 또는 Vercel/Netlify 모두 됩니다.
  - 빌드 명령 `npm run build`, 결과 폴더 `dist`
  - 화면 이동이 `#/timeline` 같은 해시 방식이라 별도 리라이트 설정이 필요 없습니다.
- 한글 도메인 `오현식.kr`은 퓨니코드 `xn--wv4bz3dmzt.kr`로 DNS·승인 도메인에 넣습니다.

## 11. 비용

가족 단위 사용량이면 Firebase 무료(Spark) 한도 안에 들어갑니다.
단, Storage는 정책상 Blaze(종량제) 요금제 연결이 필요할 수 있으니 프로젝트 생성 시 콘솔 안내를 확인하세요.
사진 1장 ≈ 200~400KB, 녹음 1분 ≈ 0.3MB 수준이라 수백 장·수십 개여도 부담이 크지 않습니다.
