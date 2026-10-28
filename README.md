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
| `#/` | 홈: 히어로 → 인생 연표 → 편지 → 목소리 → 감사 100가지 → 영상관 → 걸어온 곳 | `src/pages/Home.jsx` |
| `#/timeline` | 인생 연표: 시기별 이야기와 사진 (사진을 누르면 크게 보기) | `src/pages/Timeline.jsx` |
| `#/letters`, `#/write-letter` | 아버님께 드리는 편지: 긴 편지 모아보기·쓰기 | `Letters.jsx`, `LetterWrite.jsx` |
| `#/voice` | 아버님의 목소리: 질문 남기기 → 아버님이 녹음으로 답하기(가족 비밀번호) | `src/pages/Voice.jsx` |
| `#/gratitude` | 감사 100가지: 한 줄씩 보태서 100개 채우기 | `src/pages/Gratitude.jsx` |
| `#/video` | 가족 영상관: YouTube 일부 공개 영상 | `src/pages/Video.jsx` |
| `#/places` | 함께 걸어온 곳: 지도 위 사진 핀 | `src/pages/Places.jsx` |
| `#/album` | 사진첩: 시기별 보기, 사진 올리기·수정·삭제(가족만) | `src/pages/Album.jsx` |

## 내용 고치기

- 이름, 히어로 문구, 가족 비밀번호, **영상 주소**, 감사 목표 개수: `src/config.js`
- 연표 글, 사진 설명·시기, 지도 장소(좌표), 편지·질문 예시: `src/data/content.js`
- 사진 파일: `public/photos/p01.jpg` ~ `p20.jpg`

연표 글과 사진 설명·시기는 사진에 찍힌 날짜와 분위기로 임시로 적은 것이니 가족분들이 확인해 주세요.
지도의 장소 중 좌표가 없는 곳은 '어디였을까요?' 목록에 나옵니다. `PLACES`에 `lat`, `lng`를 넣으면 핀이 꽂힙니다.

## DB 연결 (별도 프로젝트에서 세팅)

> 자세한 절차·보안 규칙·체크리스트는 **[DB_SETUP.md](DB_SETUP.md)**, 바로 바꿔 끼울 Firebase 코드는 `src/services/store.firebase.js`에 있습니다.

지금은 모든 데이터를 **브라우저 localStorage**에 저장합니다. 그래서 글을 쓴 기기에서만 보입니다.
DB를 붙일 때는 `src/services/store.js`의 함수 **안쪽만** 바꾸면 됩니다. 화면 코드는 고칠 필요가 없습니다.
모든 함수는 Promise를 돌려주므로 그대로 `await` 호출로 바꾸면 됩니다.

컬렉션: `letters`, `gratitude`, `voices`, `photos` (구조는 DB_SETUP.md 2번).
녹음은 지금 dataURL로 저장하고, DB 연결 시 Storage에 올립니다.
가족 비밀번호 `0000`은 임시값입니다. 배포 전에 꼭 바꾸세요.
