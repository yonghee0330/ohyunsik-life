// 사이트 전체에서 쓰는 기본 정보. 이름·문구를 바꿀 때는 여기만 고치면 됩니다.
export const SITE = {
  name: '오현식',
  honorific: '아버님',
  title: '인생은 아름다워',
  tagline: 'BIRTHDAY · LIFE IS BEAUTIFUL',
  heroLine1: '지나온 모든 날이 선물이었습니다,',
  heroSub: '아버님의 삶을 돌아보며, 가족이 고마운 마음을 전하는 헌정의 공간입니다.',
  heroPhoto: '/photos/p01.jpg',
  heroCaption: '반듯했던 청년 오현식, 그리고 지금까지의 모든 날',
  // 가족 전용 기능(사진 올리기, 아버님 답변 녹음)용 임시 비밀번호. DB 연결 시 서버 설정값으로 교체하세요.
  familyPin: '0000',
};

// 가족 영상관. 영상이 약 470MB라 사이트에는 올리지 않고 YouTube '일부 공개'로 올린 뒤
// 주소 끝의 영상 ID만 넣습니다. (예: https://youtu.be/AbCdEfGhIjK → 'AbCdEfGhIjK')
export const VIDEO = {
  youtubeId: '',
  title: '우리 가족의 시간',
  desc: '사진으로는 다 담지 못한 웃음소리와 목소리가 담긴 영상입니다.',
};

// 감사 100가지 목표 개수
export const GRATITUDE_GOAL = 100;
