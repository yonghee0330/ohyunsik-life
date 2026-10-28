import { useEffect, useRef, useState } from 'react';
import { SITE } from '../config.js';
import { VOICE_SUGGESTIONS } from '../data/content.js';
import { listVoices, addQuestion, answerVoice, deleteVoice, blobToDataUrl } from '../services/store.js';
import { SubHeader, Toast, Modal, formatDate, useFamilyGate } from '../components/Common.jsx';

const MAX_SECONDS = 180;

export default function Voice() {
  const [voices, setVoices] = useState([]);
  const [askedBy, setAskedBy] = useState('');
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [answering, setAnswering] = useState(null);
  const [toast, setToast] = useState('');
  const { require, gate } = useFamilyGate();

  const reload = () => listVoices().then(setVoices);
  useEffect(() => { reload(); }, []);

  const ask = async (e) => {
    e.preventDefault();
    if (!askedBy.trim() || !question.trim()) return setError('이름과 질문을 적어 주세요.');
    await addQuestion({ askedBy: askedBy.trim(), question: question.trim() });
    setQuestion('');
    setError('');
    reload();
    setToast('질문을 남겼어요. 아버님이 답해 주실 거예요.');
  };

  const answered = voices.filter((v) => v.answeredAt);
  const waiting = voices.filter((v) => !v.answeredAt);

  return (
    <div className="page">
      <SubHeader title={`${SITE.honorific}의 목소리`} subtitle="궁금했던 것을 물어보면, 아버님이 목소리로 들려주세요" />

      <form className="card form" onSubmit={ask}>
        <label>묻는 사람
          <input value={askedBy} onChange={(e) => setAskedBy(e.target.value)} placeholder="예) 딸 OO, 손주 OO" maxLength={20} />
        </label>
        <div>
          <p className="label">이런 질문은 어때요? (누르면 입력돼요)</p>
          <div className="chips">
            {VOICE_SUGGESTIONS.map((q) => (
              <button type="button" key={q} className="chip" onClick={() => setQuestion(q)}>{q.length > 18 ? q.slice(0, 18) + '…' : q}</button>
            ))}
          </div>
        </div>
        <label>질문
          <textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary wide">질문 남기기</button>
      </form>

      <h3 className="list-h">들려주신 이야기 {answered.length > 0 && <span className="muted small">({answered.length})</span>}</h3>
      {answered.length === 0 && <p className="muted center">아직 녹음된 답변이 없어요. 첫 번째 이야기를 기다리고 있어요.</p>}
      <div className="voice-list">
        {answered.map((v) => (
          <article key={v.id} className="card voice-item">
            <p className="q">Q. {v.question} <span className="muted small">— {v.askedBy}</span></p>
            {v.audio && <audio controls preload="none" src={v.audio} />}
            {v.text && <p className="voice-text">{v.text}</p>}
            <div className="voice-meta">
              <time>{formatDate(v.answeredAt)}</time>
              <button className="link-btn" onClick={() => require(async () => { await deleteVoice(v.id); reload(); })}>삭제</button>
            </div>
          </article>
        ))}
      </div>

      {waiting.length > 0 && (
        <>
          <h3 className="list-h">답을 기다리는 질문 <span className="muted small">({waiting.length})</span></h3>
          <div className="voice-list">
            {waiting.map((v) => (
              <article key={v.id} className="card voice-item">
                <p className="q">Q. {v.question} <span className="muted small">— {v.askedBy}</span></p>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn btn-soft" onClick={() => require(() => setAnswering(v))}>🎤 아버님이 답하기</button>
                  <button className="link-btn" onClick={() => require(async () => { await deleteVoice(v.id); reload(); })}>삭제</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {answering && (
        <Recorder
          voice={answering}
          onClose={() => setAnswering(null)}
          onSaved={() => { setAnswering(null); reload(); setToast('소중한 목소리가 저장되었어요.'); }}
        />
      )}
      {gate}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

// 마이크로 녹음(MediaRecorder). 마이크를 못 쓰면 글로만 답할 수 있어요.
function Recorder({ voice, onClose, onSaved }) {
  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | recording | recorded
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [msg, setMsg] = useState(supported ? '' : '이 기기에서는 녹음이 어려워요. 글로 답해 주세요.');
  const [busy, setBusy] = useState(false);

  const stopAll = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };
  useEffect(() => stopAll, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const b = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        setState('recorded');
        stopAll();
      };
      rec.start();
      recRef.current = rec;
      setSeconds(0);
      setState('recording');
      setMsg('');
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) rec.state === 'recording' && rec.stop();
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      setMsg(e.name === 'NotAllowedError'
        ? '마이크 사용을 허용해 주셔야 해요. 주소창 옆 설정에서 마이크를 켜 주세요.'
        : '녹음을 시작할 수 없어요. 글로 답해 주셔도 돼요.');
    }
  };

  const stop = () => recRef.current?.state === 'recording' && recRef.current.stop();
  const again = () => { setBlob(null); setUrl(''); setState('idle'); setSeconds(0); };

  const save = async () => {
    if (!blob && !text.trim()) return setMsg('녹음하거나 글을 적어 주세요.');
    setBusy(true);
    try {
      const audio = blob ? await blobToDataUrl(blob) : '';
      await answerVoice(voice.id, { audio, text: text.trim() });
      onSaved();
    } catch {
      setMsg('저장에 실패했어요. 녹음이 너무 길면 줄여서 다시 해 주세요.');
      setBusy(false);
    }
  };

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <Modal onClose={onClose}>
      <p className="label">질문</p>
      <p className="question">{voice.question}</p>
      <div className="recorder">
        {state === 'idle' && supported && <button className="btn btn-primary wide" onClick={start}>🎤 말씀 시작하기</button>}
        {state === 'recording' && (
          <>
            <p className="rec-time">● 녹음 중 {mmss}</p>
            <button className="btn btn-danger wide" onClick={stop}>⏹ 녹음 끝내기</button>
          </>
        )}
        {state === 'recorded' && (
          <>
            <audio controls src={url} />
            <button className="btn btn-ghost wide" onClick={again}>다시 녹음하기</button>
          </>
        )}
      </div>
      <label className="form" style={{ display: 'grid', gap: 6, marginTop: 14, fontSize: 14 }}>
        글로도 남기기 (선택)
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="녹음 내용을 간단히 적어 두면 읽기 편해요" />
      </label>
      {msg && <p className="error">{msg}</p>}
      <p className="muted small">녹음은 최대 {MAX_SECONDS / 60}분까지 돼요.</p>
      <div className="row">
        <button className="btn btn-ghost" onClick={onClose}>닫기</button>
        <button className="btn btn-primary" onClick={save} disabled={busy || state === 'recording'}>{busy ? '저장 중…' : '저장하기'}</button>
      </div>
    </Modal>
  );
}
