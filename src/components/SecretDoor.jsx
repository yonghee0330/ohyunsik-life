import { useEffect, useRef, useState } from 'react';
import { PARTNER } from '../config.js';
import { Modal } from './Common.jsx';

// 푸터에 숨겨 둔 작은 하트. 누르면 상대 페이지(장모님)로 건너가는 비밀 통로가 열려요.
export default function SecretDoor() {
  const [open, setOpen] = useState(false);
  const [going, setGoing] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const cross = () => {
    setOpen(false);
    setGoing(true);
    timer.current = setTimeout(() => { window.location.href = PARTNER.url; }, 1700);
  };

  return (
    <>
      <button className="secret-heart" onClick={() => setOpen(true)} aria-label="비밀 통로">♡</button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="secret-box">
            <p className="secret-emoji">🤫🚪</p>
            <h3>쉿, 비밀 통로를 찾으셨네요!</h3>
            <p>
              이 문을 열면 {PARTNER.name} 님의 ‘{PARTNER.title}’ 페이지로 건너가요.
              <br />
              그쪽에도 이쪽으로 오는 문이 숨겨져 있대요.
              <br />
              두 분은 어딜 가나 서로를 찾으시네요 💕
            </p>
            <div className="row center">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>다음에요</button>
              <button className="btn btn-primary" onClick={cross}>💕 건너가 볼게요</button>
            </div>
          </div>
        </Modal>
      )}

      {going && (
        <div className="secret-go" role="status">
          <p className="secret-go-emoji">🚪💨</p>
          <p>{PARTNER.name} 님 곁으로 건너가는 중…</p>
          <span className="secret-hearts" aria-hidden="true">💕 💕 💕</span>
        </div>
      )}
    </>
  );
}
