import { useEffect, useState } from 'react';
import { GRATITUDE_GOAL } from '../config.js';
import { GRATITUDE_STARTERS } from '../data/content.js';
import { listGratitude, addGratitude } from '../services/store.js';
import { SubHeader, Toast } from '../components/Common.jsx';

export default function Gratitude() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const reload = () => listGratitude().then(setItems);
  useEffect(() => { reload(); }, []);

  const count = items.length;
  const pct = Math.min(100, Math.round((count / GRATITUDE_GOAL) * 100));

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return setError('이름과 감사한 마음을 적어 주세요.');
    try {
      await addGratitude({ name: name.trim(), text: text.trim() });
      setText('');
      setError('');
      await reload();
      setToast(count + 1 >= GRATITUDE_GOAL ? '100가지를 모두 채웠어요! 🎉' : `${count + 1}번째 감사가 쌓였어요.`);
    } catch {
      setError('저장에 실패했어요. 잠시 뒤 다시 해 주세요.');
    }
  };

  return (
    <div className="page">
      <SubHeader title="감사 100가지" subtitle="가족이 한 줄씩 보태서 아버님께 고마운 이유 100가지를 채워요" />

      <div className="card progress-card">
        <p className="count"><strong>{count}</strong> / {GRATITUDE_GOAL}</p>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        <p className="muted small">{count >= GRATITUDE_GOAL ? '100가지를 모두 채웠어요 🎉' : `${GRATITUDE_GOAL - count}가지가 더 필요해요`}</p>
      </div>

      <form className="card form" onSubmit={submit} style={{ marginTop: 16 }}>
        <label>이름
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 딸 OO" maxLength={20} />
        </label>
        <div>
          <p className="label">예시 (누르면 입력돼요)</p>
          <div className="chips">
            {GRATITUDE_STARTERS.map((s) => (
              <button type="button" key={s} className="chip" onClick={() => setText(s)}>{s.slice(0, 14)}…</button>
            ))}
          </div>
        </div>
        <label>아버님, 이래서 감사해요
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={120} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary wide">감사 한 줄 보태기</button>
      </form>

      <ol className="gr-list" reversed>
        {[...items].reverse().map((g, i) => (
          <li key={g.id} value={count - i}>
            <span className="gr-no">{count - i}</span>
            <div><p>{g.text}</p><span className="muted small">— {g.name}</span></div>
          </li>
        ))}
      </ol>
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
