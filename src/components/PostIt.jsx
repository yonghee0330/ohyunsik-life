// 감사 한 줄을 붙여 둔 포스트잇. 색과 기울기는 글마다 달라요(같은 글은 늘 같은 모양).
const COLORS = ['#fff3a8', '#ffd9e2', '#cdeefb', '#d9f3c8', '#ffe1bd', '#e6dcff'];

const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function PostIt({ g, fresh }) {
  const h = hash(g.id);
  const style = {
    '--c': COLORS[h % COLORS.length],
    '--r': `${((h >> 3) % 50) / 10 - 2.5}deg`,
  };
  return (
    <figure className={fresh ? 'postit fresh' : 'postit'} style={style}>
      <p>{g.text}</p>
      <figcaption>— {g.name}</figcaption>
    </figure>
  );
}
