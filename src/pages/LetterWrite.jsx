import { useState } from 'react';
import { SITE } from '../config.js';
import { LETTER_STARTERS } from '../data/content.js';
import { addLetter } from '../services/store.js';
import { go } from '../router.js';
import { SubHeader } from '../components/Common.jsx';

export default function LetterWrite() {
  const [from, setFrom] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!from.trim() || !body.trim()) return setError('보내는 사람과 편지 내용을 적어 주세요.');
    setBusy(true);
    try {
      await addLetter({ from: from.trim(), title: title.trim(), body: body.trim() });
      setDone(true);
    } catch {
      setError('저장에 실패했어요. 잠시 뒤 다시 해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="page">
        <div className="card center done">
          <p className="big-icon">💌</p>
          <h2>편지가 도착했어요</h2>
          <p className="muted">{SITE.honorific}께 마음이 전해질 거예요</p>
          <div className="row center">
            <button className="btn btn-ghost" onClick={() => go('')}>← 홈으로</button>
            <button className="btn btn-primary" onClick={() => go('letters')}>편지 모아보기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <SubHeader title={`${SITE.honorific}께 편지 쓰기`} subtitle="천천히, 하고 싶은 말을 편하게 적어 주세요" />
      <form className="card form" onSubmit={submit}>
        <label>보내는 사람
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="예) 딸 OO, 사위 OO, 손녀 OO" maxLength={20} />
        </label>
        <label>제목 (선택)
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 아버지께" maxLength={40} />
        </label>
        <div>
          <p className="label">무슨 말을 쓸지 막막하면 (누르면 시작 문장이 들어가요)</p>
          <div className="chips">
            {LETTER_STARTERS.map((s) => (
              <button type="button" key={s.label} className="chip" onClick={() => setBody((b) => (b ? b + '\n\n' : '') + s.text)}>{s.label}</button>
            ))}
          </div>
        </div>
        <label>편지
          <textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary wide" disabled={busy}>{busy ? '보내는 중…' : '편지 보내기'}</button>
      </form>
    </div>
  );
}
