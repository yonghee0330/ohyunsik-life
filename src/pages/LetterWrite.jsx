import { useState } from 'react';
import { SITE } from '../config.js';
import { LETTER_PAPERS, paperOf } from '../data/content.js';
import { addLetter } from '../services/store.js';
import { go } from '../router.js';
import { SubHeader } from '../components/Common.jsx';

export default function LetterWrite() {
  const [from, setFrom] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [paperId, setPaperId] = useState('cream');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const paper = paperOf(paperId);

  const submit = async (e) => {
    e.preventDefault();
    if (!from.trim() || !body.trim()) return setError('보내는 사람과 편지 내용을 적어 주세요.');
    setBusy(true);
    try {
      await addLetter({ from: from.trim(), title: title.trim(), body: body.trim(), paper: paperId });
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
            <button className="btn btn-ghost" onClick={() => go('home')}>← 홈으로</button>
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
          <input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={20} />
        </label>
        <label>제목 (선택)
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
        </label>

        <div>
          <p className="label">편지지 고르기</p>
          <div className="paper-picks">
            {LETTER_PAPERS.map((p) => (
              <button
                type="button"
                key={p.id}
                className={p.id === paperId ? 'paper-pick on' : 'paper-pick'}
                style={{ background: p.bg, color: p.ink }}
                onClick={() => setPaperId(p.id)}
                aria-pressed={p.id === paperId}
              >
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <label>편지
          <div className="paper-pad" style={{ background: paper.bg }}>
            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={3000}
              style={{ color: paper.ink, '--ph': paper.sub }}
            />
          </div>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary wide" disabled={busy}>{busy ? '보내는 중…' : '편지 보내기'}</button>
      </form>
    </div>
  );
}
