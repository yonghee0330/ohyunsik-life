# 오현식 | 인생은 아름다워

장인어른 생신 축하 페이지. 구조는 `유정임 | 오늘 더 행복해`(https://xn--2r5b6gop.kr/)와 같습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 폴더에 배포용 파일 생성
```

## 화면 구성

| 주소 | 화면 | 파일 |
|---|---|---|
| `#/` | 홈: 히어로 → 오늘의 감사 구절 → 인생 이야기(4챕터) → 갤러리 → 방명록 | `src/pages/Home.jsx` |
| `#/story` | 나의 인생 기록장: 시절 고르기 → 질문 하나씩(말/글) → 글로 정리 → 저장·수정·사진 붙이기 | `src/pages/StoryBook.jsx` |
| `#/album` | 추억의 사진첩: 시기별/올린 순서, 사진 올리기·수정·삭제(가족만) | `src/pages/Album.jsx` |
| `#/write` | 한마디 남기기: 이름 + 예시 문구 + 직접 쓰기 | `src/pages/GuestbookWrite.jsx` |

## 내용 고치기

- 이름·제목·히어로 문구·가족 비밀번호: `src/config.js`
- 감사 구절, 챕터 글, 사진 설명·시기, 기록장 질문, 방명록 예시 문구: `src/data/content.js`
- 사진 파일: `public/photos/p01.jpg` ~ `p20.jpg` (원본 001~020번을 웹용 1600px로 줄인 것, 4번은 똑바로 돌림)

사진 설명과 시기(1980년대 등)는 사진에 찍힌 날짜와 분위기로 임시로 적은 것이니, 가족분들이 확인해 주세요.

## DB 연결 (별도 프로젝트에서 세팅)

> 자세한 절차·보안 규칙·체크리스트는 **[DB_SETUP.md](DB_SETUP.md)**, 바로 바꿔 끼울 Firebase 코드는 `src/services/store.firebase.js`에 있습니다.

지금은 모든 데이터를 **브라우저 localStorage**에 저장합니다. 그래서 글을 쓴 기기에서만 보입니다.
DB를 붙일 때는 `src/services/store.js`의 함수 **안쪽만** 바꾸면 됩니다. 화면 코드는 고칠 필요가 없습니다.
모든 함수는 Promise를 돌려주므로 그대로 `await` 호출로 바꾸면 됩니다.

| 함수 | 컬렉션 | 필드 |
|---|---|---|
| `listGuestbook` / `addGuestbook` | `guestbook` | `name, message, createdAt` |
| `listPhotos` / `addPhoto` / `updatePhoto` / `deletePhoto` | `photos` | `src(Storage URL), title, era, story, createdAt` |
| `listStories` / `saveStory` / `deleteStory` | `stories` | `topic, title, body, answers[{question,answer}], photoIds[], createdAt, updatedAt` |
| `getDraft` / `saveDraft` / `clearDraft` | `drafts` (또는 기기 로컬 유지) | `topic, answers[]` |
| `checkFamilyPin` | `settings/access` | `pin` (서버에서 확인 권장) |
| `composeStory` | — | 답변 → 글 정리. AI(Gemini/Claude 등) 연결 지점 |

- `addPhoto`는 지금 사진을 줄여 dataURL로 저장합니다. DB 연결 시 Storage에 올리고 URL을 `src`에 넣으세요.
- 원본 사이트는 Firebase(Firestore + Storage + 익명 로그인)를 썼습니다.
- 가족 비밀번호 `0000`은 임시값입니다. 배포 전에 꼭 바꾸세요.
