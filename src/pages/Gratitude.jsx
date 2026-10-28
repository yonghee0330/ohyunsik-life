import { useEffect, useState } from 'react';
import { listGratitude, addGratitude } from '../services/store.js';
import { SubHeader, Toast } from '../components/Common.jsx';
import { PostIt } from '../components/PostIt.jsx';

export default function Gratitude() {
  const [items, setItems] = useState(null); // null = 불러오는 중
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [fresh, setFresh] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { listGratitude().then(setItems); }, []);

  const loaded = items !== null;
  const count = loaded ? items.length : 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return setError('이름과 전하고 싶은 마음을 적어 주세요.');
    setBusy(true);
    try {
      await addGratitude({ name: name.trim(), text: text.trim() });
      const before = new Set((items || []).map((g) => g.id));
      const list = await listGratitude();
      setItems(list);
      setFresh(list.find((g) => !before.has(g.id))?.id || '');
      setText('');
      setError('');
      setToast('마음을 붙였어요. 고맙습니다 💛');
    } catch {
      setError('저장에 실패했어요. 잠시 뒤 다시 해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page wide-page">
      <SubHeader title="감사의 마음 전하기" subtitle="그동안 쑥스러워 표현하지 못했던 감사의 마음을, 포스트잇에 적어 붙여 주세요" />

      <div className="thanks-total">
        <p className="eyebrow">THANK YOU EVENT</p>
        <p className="thanks-count">{loaded && <><strong>{count}</strong>장의 감사가 붙었어요</>}</p>
      </div>

      <form className="postit postit-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="th-text">전하고 싶은 감사</label>
        <textarea
          id="th-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder="아버님께, 그동안 말로 다 못 한 마음을 적어 주세요"
        />
        <div className="postit-from">
          <label htmlFor="th-name">From.</label>
          <input id="th-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" maxLength={20} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary wide" disabled={busy}>{busy ? '붙이는 중…' : '📌 포스트잇 붙이기'}</button>
      </form>

      {!loaded ? null : count === 0 ? (
        <p className="muted center" style={{ marginTop: 32 }}>아직 붙은 감사가 없어요. 첫 번째 마음을 붙여 주세요.</p>
      ) : (
        <div className="postit-wall">
          {[...items].reverse().map((g) => <PostIt key={g.id} g={g} fresh={g.id === fresh} />)}
        </div>
      )}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
