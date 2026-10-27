import { useEffect, useState } from 'react';
import { go } from '../router.js';
import { SITE } from '../config.js';
import { checkFamilyPin, isFamily } from '../services/store.js';

export function SubHeader({ title, subtitle }) {
  return (
    <div className="sub-head">
      <button className="btn-back" onClick={() => go('')}>← 홈으로</button>
      <h1 className="sub-title">{title}</h1>
      {subtitle && <p className="sub-desc">{subtitle}</p>}
    </div>
  );
}

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}

export function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

// 가족만 할 수 있는 동작 앞에 씁니다. 한 번 열면 이 기기에서는 계속 열려 있습니다.
export function useFamilyGate() {
  const [family, setFamily] = useState(isFamily());
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const require = (action) => {
    if (family) return action();
    setPending(() => action);
    setOpen(true);
  };

  const gate = open && (
    <FamilyGate
      onClose={() => setOpen(false)}
      onPass={() => {
        setFamily(true);
        setOpen(false);
        pending && pending();
      }}
    />
  );
  return { family, require, gate };
}

function FamilyGate({ onClose, onPass }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pin) return setError('가족 비밀번호를 입력해 주세요.');
    setBusy(true);
    const ok = await checkFamilyPin(pin, SITE.familyPin);
    setBusy(false);
    ok ? onPass() : setError('비밀번호가 맞지 않아요. 다시 입력해 주세요.');
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="gate">
        <h3>가족만 할 수 있어요</h3>
        <p className="muted">한 번 열면 이 기기에서는 계속 쓸 수 있어요.</p>
        <input
          type="password"
          inputMode="numeric"
          placeholder="비밀번호"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(''); }}
          autoFocus
        />
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onClose}>닫기</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? '확인 중...' : '열기'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}
