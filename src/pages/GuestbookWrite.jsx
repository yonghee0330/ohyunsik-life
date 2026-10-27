import { useState } from 'react';
import { SITE } from '../config.js';
import { GUESTBOOK_PRESETS } from '../data/content.js';
import { addGuestbook } from '../services/store.js';
import { go } from '../router.js';
import { SubHeader } from '../components/Common.jsx';

export default function GuestbookWrite() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return setError('이름과 마음을 모두 적어 주세요.');
    setBusy(true);
    try {
      await addGuestbook({ name: name.trim(), message: message.trim() });
      setDone(true);
    } catch {
      setError('저장에 실패했어요. 네트워크를 확인해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="page">
        <div className="card center done">
          <p className="big-icon">💌</p>
          <h2>따뜻한 마음이 전달됐어요</h2>
          <p className="muted">{SITE.honorific}께 전해질 거예요</p>
          <button className="btn btn-primary" onClick={() => go('')}>← 홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <SubHeader title="따뜻한 한마디 남기기" subtitle={`${SITE.honorific}께 축하와 감사의 마음을 전해 주세요`} />
      <form className="card form" onSubmit={submit}>
        <label>이름 (또는 별명)
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 사위 OO, 손녀 OO" maxLength={20} />
        </label>
        <div>
          <p className="label">예시 문구 (누르면 입력돼요)</p>
          <div className="chips">
            {GUESTBOOK_PRESETS.map((p) => (
              <button type="button" key={p.label} className="chip" onClick={() => setMessage(p.text)}>{p.label}</button>
            ))}
            <button type="button" className="chip" onClick={() => setMessage('')}>직접 쓰기</button>
          </div>
        </div>
        <label>마음을 담아 적어 주세요
          <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary wide" disabled={busy}>{busy ? '보내는 중…' : '마음 전하기'}</button>
      </form>
    </div>
  );
}
