import { useEffect, useState } from 'react';
import { LETTER_STYLES } from '../data/content.js';
import { listLetters } from '../services/store.js';
import { go } from '../router.js';
import { SubHeader, Modal, formatDate } from '../components/Common.jsx';

export default function Letters() {
  const [letters, setLetters] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { listLetters().then(setLetters); }, []);

  return (
    <div className="page">
      <SubHeader title="아버님께 드리는 편지" subtitle="짧은 인사보다, 마음을 꾹꾹 눌러 쓴 긴 편지를 한 통씩 모았습니다" />
      <div className="row center" style={{ marginTop: 0 }}>
        <button className="btn btn-primary" onClick={() => go('write-letter')}>편지 쓰기</button>
      </div>

      {letters && letters.length === 0 && (
        <div className="empty" style={{ marginTop: 24 }}>
          <p>아직 도착한 편지가 없어요.</p>
          <p className="muted">첫 번째 편지의 주인공이 되어 주세요.</p>
        </div>
      )}

      <div className="letter-list">
        {(letters || []).map((l, i) => {
          const s = LETTER_STYLES[i % LETTER_STYLES.length];
          return (
            <button key={l.id} className="letter-card" style={{ background: s.bg }} onClick={() => setOpen({ ...l, style: s })}>
              <span className="letter-icon">{s.icon}</span>
              <strong>From. {l.from}</strong>
              {l.title && <span className="letter-title">{l.title}</span>}
              <span className="letter-preview">{l.body}</span>
              <time>{formatDate(l.createdAt)}</time>
            </button>
          );
        })}
      </div>

      {open && (
        <Modal onClose={() => setOpen(null)}>
          <article className="letter-paper">
            {open.title && <h3>{open.title}</h3>}
            <p className="letter-body">{open.body}</p>
            <p className="letter-sign">— {open.from} 드림</p>
            <time>{formatDate(open.createdAt)}</time>
          </article>
          <div className="row center"><button className="btn btn-ghost" onClick={() => setOpen(null)}>닫기</button></div>
        </Modal>
      )}
    </div>
  );
}
