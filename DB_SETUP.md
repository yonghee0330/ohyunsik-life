# DB 연결 가이드 (별도 프로젝트에서 세팅)

이 사이트는 데이터를 모두 `src/services/store.js` 한 파일에서 다룹니다.
DB 프로젝트를 만든 뒤 **`store.js`를 `store.firebase.js`로 바꿔 끼우면** 화면 코드는 그대로 동작합니다.
원본 사이트(유정임.kr)와 같은 **Firebase**를 기준으로 정리했습니다.

---

## 1. 무엇을 저장하나

| 데이터 | 누가 쓰나 | 누가 보나 | 저장 위치 |
|---|---|---|---|
| 방명록 한마디 | 누구나 | 누구나 | Firestore `guestbook` |
| 가족이 올린 사진 | 가족만 | 누구나 | Firestore `photos` + Storage `photos/` |
| 인생 기록장 글 | 가족만 | 누구나 | Firestore `stories` |
| 이어서 쓰기 임시본 | 쓰는 사람 | 그 기기만 | 브라우저 localStorage (DB에 안 올림) |
| 가족 비밀번호 | 관리자(콘솔) | 아무도 못 읽음 | Firestore `settings/access` |
| 가족 인증 기록 | 비밀번호 맞힌 기기 | 아무도 못 읽음 | Firestore `familyMembers/{uid}` |

기본 사진 20장(`public/photos/`)과 챕터·구절 글은 코드에 들어 있으므로 DB에 넣지 않습니다.

## 2. 컬렉션 구조

```
guestbook/{autoId}
  name: string            // 최대 20자
  message: string         // 최대 500자
  createdAt: timestamp

photos/{autoId}
  src: string             // Storage 다운로드 URL
  storagePath: string     // 삭제할 때 필요 (photos/{uid}/{파일명})
  title: string
  era: string             // "1980년대" 등 자유 입력 → 사진첩 '시기별' 묶음
  story: string
  createdAt: timestamp
  createdBy: string       // uid

stories/{autoId}
  topic: string           // childhood | youth | marriage | father | now | legacy
  title: string
  body: string            // 줄바꿈 포함
  answers: [{ question: string, answer: string }]
  photoIds: string[]      // 기본 사진 id(p01…) 또는 photos 문서 id
  createdAt: timestamp
  updatedAt: timestamp

settings/access
  pin: string             // 가족 비밀번호. 콘솔에서 직접 만듭니다.

familyMembers/{uid}
  pin: string             // 맞힌 비밀번호 (규칙에서 settings/access와 비교)
  createdAt: timestamp
```

> 화면 코드는 `createdAt`을 숫자(ms)로 씁니다. `store.firebase.js`가 timestamp를 숫자로 바꿔서 돌려줍니다.

## 3. 가족 확인 방식 (서버 없이)

1. 사이트에 들어오면 **익명 로그인**으로 각 기기에 uid가 생깁니다.
2. 가족이 비밀번호를 넣으면 `familyMembers/{내 uid}` 문서에 `{ pin }`을 쓰려고 시도합니다.
3. 보안 규칙이 `settings/access.pin`과 같을 때만 쓰기를 허락합니다. 비밀번호 문서는 아무도 읽을 수 없지만, 규칙 안의 `get()`으로는 비교할 수 있습니다.
4. 쓰기가 성공하면 그 기기는 가족이 됩니다. 사진·기록장 쓰기는 `familyMembers/{uid}`가 있어야만 됩니다.

비밀번호를 바꾸면 새로 들어오는 기기만 새 비밀번호를 써야 합니다. 이미 인증된 기기까지 끊으려면 `familyMembers` 컬렉션을 비우면 됩니다.

## 4. Firestore 보안 규칙

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function signedIn() { return request.auth != null; }
    function isFamily() {
      return signedIn() && exists(/databases/$(db)/documents/familyMembers/$(request.auth.uid));
    }

    match /settings/{doc} {
      allow read, write: if false;            // 콘솔에서만 관리
    }

    match /familyMembers/{uid} {
      allow read: if false;
      // 같은 기기가 다시 인증해도 되도록 update도 같은 조건으로 허용
      allow create, update: if signedIn() && request.auth.uid == uid
        && request.resource.data.pin == get(/databases/$(db)/documents/settings/access).data.pin;
      allow delete: if false;
    }

    match /guestbook/{id} {
      allow read: if true;
      allow create: if signedIn()
        && request.resource.data.keys().hasOnly(['name', 'message', 'createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() >= 1 && request.resource.data.name.size() <= 20
        && request.resource.data.message is string
        && request.resource.data.message.size() >= 1 && request.resource.data.message.size() <= 500;
      allow update, delete: if false;          // 지울 일은 콘솔에서
    }

    match /photos/{id} {
      allow read: if true;
      allow create, update, delete: if isFamily();
    }

    match /stories/{id} {
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
  }
}
```

(Storage 규칙에서 `firestore.exists()`를 처음 쓰면 콘솔이 권한 연결을 물어봅니다. 허용하세요.)

## 6. Firebase 콘솔에서 할 일 (체크리스트)

- [ ] 새 Firebase 프로젝트 만들기 → 웹 앱 추가 → 설정값(apiKey 등) 복사
- [ ] **Authentication** → 로그인 방법 → **익명** 사용 설정
- [ ] **Firestore Database** 만들기 (위치: `asia-northeast3` 서울)
- [ ] Firestore에 문서 직접 추가: 컬렉션 `settings` / 문서 ID `access` / 필드 `pin`(string) = 가족 비밀번호
- [ ] Firestore 규칙에 4번 붙여넣기 → 게시
- [ ] **Storage** 시작 (같은 위치) → 규칙에 5번 붙여넣기 → 게시
- [ ] (선택) **App Check** 켜기 — 아무나 API를 두드리는 것 방지. AI 정리 기능을 쓰면 권장
- [ ] (선택) **AI Logic** 사용 설정 — 기록장 "글로 정리하기"를 AI로 할 때 (7번)
- [ ] **Authentication → 설정 → 승인된 도메인**에 배포 도메인 추가

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
   VITE_USE_AI=false        # AI 정리를 쓰면 true
   ```
3. 저장소 교체
   ```bash
   mv src/services/store.js src/services/store.local.js
   mv src/services/store.firebase.js src/services/store.js
   ```
4. `src/config.js`의 `familyPin`은 더 이상 쓰이지 않습니다(비밀번호는 Firestore에서 확인). 지워도 됩니다.
5. `npm run dev`로 확인: 방명록 쓰기 → 다른 기기에서도 보이는지, 사진 올리기 → 비밀번호 창 → 업로드.

### 기록장 "글로 정리하기" AI 연결 (선택)

`store.firebase.js`의 `composeStory`는 `VITE_USE_AI=true`이면 Firebase AI Logic(Gemini)으로 다듬고,
실패하면 지금처럼 단순 정리로 돌아갑니다. 프롬프트 원칙: **들은 사실만, 1인칭 회고체, 꾸며내지 않기.**
모델 이름은 파일 맨 위 `AI_MODEL`에서 바꿀 수 있습니다.

## 8. 함수별 교체 내역 (store.js ↔ Firebase)

| 함수 | 지금(localStorage) | Firebase |
|---|---|---|
| `listGuestbook()` | 배열 읽기 | `guestbook` createdAt 내림차순 |
| `addGuestbook({name,message})` | 배열 앞에 추가 | `addDoc` + `serverTimestamp()` |
| `listPhotos()` | 배열 읽기 | `photos` createdAt 오름차순 |
| `addPhoto(file, meta)` | 줄여서 dataURL 저장 | 1280px로 줄여 Storage 업로드 → URL을 `src`에 |
| `updatePhoto(id, patch)` | 배열 수정 | `updateDoc` |
| `deletePhoto(id)` | 배열에서 제거 | Storage 파일 삭제 → 문서 삭제 |
| `listStories()` | 배열 읽기 | `stories` createdAt 내림차순 |
| `saveStory(story)` | id 있으면 수정, 없으면 추가 | `updateDoc` / `addDoc` |
| `deleteStory(id)` | 배열에서 제거 | `deleteDoc` |
| `getDraft/saveDraft/clearDraft` | localStorage | **그대로 localStorage** |
| `composeStory(topic, answers)` | 단순 이어붙이기 | AI(선택) → 실패 시 단순 정리 |
| `checkFamilyPin(pin)` | config 값과 비교 | `familyMembers/{uid}` 쓰기 성공 여부 |
| `isFamily()` | localStorage 표시 | 그대로 (화면 표시용, 실제 권한은 규칙이 판단) |

## 9. 배포

- **Firebase Hosting**(같은 프로젝트에서 관리) 또는 **Vercel/Netlify** 모두 됩니다.
  - 빌드 명령 `npm run build`, 결과 폴더 `dist`
  - 화면 이동이 `#/album` 같은 해시 방식이라 별도 리라이트 설정이 필요 없습니다.
- 한글 도메인(예: `오현식.kr`)을 쓰면 퓨니코드 주소(`xn--...`)를 DNS·Firebase 승인 도메인에 넣습니다.
- 배포 후 카카오톡 미리보기용 `og:image`(`index.html`)가 절대주소여야 잘 나옵니다:
  `https://도메인/photos/p13.jpg` 로 바꿔 주세요.

## 10. 비용

가족 단위 사용량이면 Firebase 무료(Spark) 한도 안에 들어갑니다.
단, **Storage는 최근 정책상 Blaze(종량제) 요금제 연결이 필요할 수 있습니다** — 프로젝트 생성 시 콘솔 안내를 확인하세요.
사진 1장 ≈ 200~400KB(1280px로 줄여 올림) 기준, 수백 장이어도 몇백 MB 수준입니다.
