// 감사 한 줄을 붙여 둔 포스트잇. 색과 기울기는 글마다 달라요(같은 글은 늘 같은 모양).
export const POSTIT_COLORS = [
  { id: 'yellow', name: '노랑', hex: '#fff3a8' },
  { id: 'pink', name: '분홍', hex: '#ffd9e2' },
  { id: 'blue', name: '하늘', hex: '#cdeefb' },
  { id: 'green', name: '연두', hex: '#d9f3c8' },
  { id: 'orange', name: '주황', hex: '#ffe1bd' },
  { id: 'purple', name: '보라', hex: '#e6dcff' },
];

export const colorHex = (id) => POSTIT_COLORS.find((c) => c.id === id)?.hex;

const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function PostIt({ g, fresh }) {
  const h = hash(g.id);
  const style = {
    // 고른 색이 있으면 그 색, 예전에 붙인 글은 글마다 정해진 색
    '--c': colorHex(g.color) || POSTIT_COLORS[h % POSTIT_COLORS.length].hex,
    '--r': `${((h >> 3) % 50) / 10 - 2.5}deg`,
  };
  return (
    <figure className={fresh ? 'postit fresh' : 'postit'} style={style}>
      <p>{g.text}</p>
      <figcaption>— {g.name}</figcaption>
    </figure>
  );
}
