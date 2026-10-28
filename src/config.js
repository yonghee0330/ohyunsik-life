// 사이트 전체에서 쓰는 기본 정보. 이름·문구를 바꿀 때는 여기만 고치면 됩니다.
export const SITE = {
  name: '오현식',
  honorific: '아버님',
  title: '인생은 아름다워',
  tagline: 'BIRTHDAY · LIFE IS BEAUTIFUL',
  heroLine1: '지나온 모든 날이 선물이었습니다,',
  heroSub: '아버님의 삶을 돌아보며, 가족이 고마운 마음을 전하는 헌정의 공간입니다.',
  heroPhoto: '/photos/p01.jpg',
  profile: '1953년 전남 신안군 비금면 출생 · 요리사 외길',
  heroCaption: '반듯했던 청년 오현식, 그리고 지금까지의 모든 날',
};

// 가족 영상관. 영상 파일은 크기가 커서 YouTube에 올리고 영상 ID만 넣습니다.
// 일반 영상은 vertical: false, 쇼츠(세로 영상)는 vertical: true
export const VIDEO = {
  title: '우리 가족의 시간',
  desc: '사진으로는 다 담지 못한 웃음소리와 목소리가 담긴 영상입니다.',
  // 생신 축하 영상: 홈 화면 맨 앞과 영상관 맨 위에 크게 보입니다.
  birthday: { id: 'BrHw3aj7dss', vertical: true },
  items: [
    { id: 't34aEjJb8uE', vertical: false },
    { id: 'MaisnxbzEZw', vertical: true },
  ],
};

// 감사 100가지 목표 개수
export const GRATITUDE_GOAL = 100;
