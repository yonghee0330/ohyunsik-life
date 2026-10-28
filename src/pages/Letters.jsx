import { useEffect, useMemo, useState } from 'react';
import { LETTER_STYLES, paperOf, moodOf } from '../data/content.js';
import { listLetters } from '../services/store.js';
import { prepareBgm } from '../services/bgm.js';
import { go } from '../router.js';
import { SubHeader, formatDate } from '../components/Common.jsx';
import LetterShow from './LetterShow.jsx';

export default function Letters() {
  const [letters, setLetters] = useState(null);
  const [show, setShow] = useState(null); // 읽을 편지 목록

  useEffect(() => {
    // 읽기 화면의 음악을 편지 분위기별로 미리 만들어 둡니다.
    listLetters().then((list) => {
      setLetters(list);
      [...new Set(list.map(moodOf))].forEach((m) => prepareBgm(m));
    });
  }, []);

  // 이어 읽기는 먼저 도착한 편지부터 차례로
  const inOrder = useMemo(() => [...(letters || [])].reverse(), [letters]);
  const playAll = () => setShow(inOrder);

  return (
    <div className="page">
      <SubHeader title="아버님께 드리는 편지" subtitle="마음을 꾹꾹 눌러 쓴 편지를, 음악과 함께 한 줄씩 천천히 읽어요" />
      <div className="row center" style={{ marginTop: 0 }}>
        {letters && letters.length > 0 && (
          <button className="btn btn-primary" onClick={playAll}>▶ 편지 이어 읽기 · 음악과 함께</button>
        )}
        <button className={letters && letters.length ? 'btn btn-ghost' : 'btn btn-primary'} onClick={() => go('write-letter')}>편지 쓰기</button>
      </div>

      {letters && letters.length === 0 && (
        <div className="empty" style={{ marginTop: 24 }}>
          <p>아직 도착한 편지가 없어요.</p>
          <p className="muted">첫 번째 편지의 주인공이 되어 주세요.</p>
        </div>
      )}

      <div className="letter-list">
        {(letters || []).map((l, i) => {
          const p = paperOf(l.paper);
          const icon = LETTER_STYLES[i % LETTER_STYLES.length].icon;
          return (
            <button key={l.id} className="letter-card" style={{ background: p.bg, color: p.ink }} onClick={() => setShow([l])}>
              <span className="letter-icon">{icon}</span>
              <strong>From. {l.from}</strong>
              {l.title && <span className="letter-title">{l.title}</span>}
              <span className="letter-preview">{l.body}</span>
              <time style={{ color: p.sub }}>{formatDate(l.createdAt)} · 눌러서 읽기</time>
            </button>
          );
        })}
      </div>

      {show && (
        <LetterShow
          letters={show}
          onClose={() => setShow(null)}
          onPlayAll={show.length === 1 && inOrder.length > 1 ? () => setShow(inOrder) : undefined}
        />
      )}
    </div>
  );
}
