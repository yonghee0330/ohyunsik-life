// 주소 뒤 #/story 같은 해시로 화면을 나눕니다 (새로고침해도 같은 화면 유지).
export function currentRoute() {
  return window.location.hash.replace(/^#\/?/, '').split('/')[0];
}

export function go(route) {
  window.location.hash = route ? `/${route}` : '/';
}
