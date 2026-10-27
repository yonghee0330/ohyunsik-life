import { useEffect, useRef, useState } from 'react';
import { SITE } from '../config.js';
import { STORY_TOPICS, PHOTOS } from '../data/content.js';
import {
  listStories, saveStory, deleteStory, getDraft, saveDraft, clearDraft, composeStory, listPhotos,
} from '../services/store.js';
import { SubHeader, Toast, Modal, formatDate, useFamilyGate } from '../components/Common.jsx';

// 화면 흐름: 첫 화면 → 시절 고르기 → 질문에 하나씩 답하기 → 글로 정리 → 저장 → 내가 남긴 이야기
export default function StoryBook() {
  const [view, setView] = useState('home'); // home | topics | interview | review | list | read
  const [draft, setDraft] = useState(null); // { topic, answers: [{question, answer}] }
  const [composed, setComposed] = useState(null);
  const [stories, setStories] = useState([]);
  const [reading, setReading] = useState(null);
  const [toast, setToast] = useState('');
  // 기록을 남기고 고치는 일은 가족만 (DB 규칙과 같음)
  const { require, gate } = useFamilyGate();

  const reload = () => listStories().then(setStories);
  useEffect(() => {
    reload();
    getDraft().then(setDraft);
  }, []);

  const topicOf = (key) => STORY_TOPICS.find((t) => t.key === key);

  const startTopic = (key) => {
    const d = { topic: key, answers: [] };
    setDraft(d);
    saveDraft(d);
    setView('interview');
  };

  const finish = async (d) => {
    const c = await composeStory(topicOf(d.topic).title, d.answers);
    setComposed(c);
    setView('review');
  };

  if (view === 'topics') {
    return (
      <div className="page">
        <SubHeader title="어느 시절 이야기일까요?" subtitle="하나를 골라 주세요. 질문은 하나씩만 나와요." />
        <div className="topic-grid">
          {STORY_TOPICS.map((t) => (
            <button key={t.key} className="card topic" onClick={() => startTopic(t.key)}>{t.title}</button>
          ))}
        </div>
        <div className="row center"><button className="btn btn-ghost" onClick={() => setView('home')}>기록장 첫 화면</button></div>
      </div>
    );
  }

  if (view === 'interview' && draft) {
    return (
      <Interview
        topic={topicOf(draft.topic)}
        draft={draft}
        onChange={(d) => { setDraft(d); saveDraft(d); }}
        onFinish={finish}
        onLater={() => { setView('home'); setToast('나중에 이어서 하셔도 괜찮아요.'); }}
      />
    );
  }

  if (view === 'review' && composed) {
    return (
      <div className="page">
        <SubHeader title="이야기를 글로 정리했어요" subtitle="글을 보기 좋게 정리했어요. 고칠 곳은 바로 고치셔도 돼요." />
        <div className="card form">
          <label>제목<input value={composed.title} onChange={(e) => setComposed({ ...composed, title: e.target.value })} /></label>
          <label>본문<textarea rows={12} value={composed.body} onChange={(e) => setComposed({ ...composed, body: e.target.value })} /></label>
          <div className="row">
            <button className="btn btn-ghost" onClick={() => setView('interview')}>이야기 더하기</button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                await saveStory({ topic: draft.topic, ...composed, answers: draft.answers, photoIds: [] });
                await clearDraft();
                setDraft(null);
                reload();
                setView('list');
                setToast('참 소중한 이야기가 저장되었어요.');
              }}
            >이대로 저장하기</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'read' && reading) {
    return (
      <>
      <StoryReader
        story={reading}
        requireFamily={require}
        onBack={() => setView('list')}
        onChanged={async (msg, next) => {
          await reload();
          if (next) setReading(next); else setView('list');
          setToast(msg);
        }}
      />
      {gate}
      </>
    );
  }

  if (view === 'list') {
    return (
      <div className="page">
        <SubHeader title="내가 남긴 이야기" subtitle="눌러서 천천히 읽어 보세요" />
        {stories.length === 0 ? (
          <div className="empty"><p>아직 저장된 이야기가 없어요</p><p className="muted">'이야기 시작하기'를 눌러 보세요</p></div>
        ) : (
          <div className="story-list">
            {stories.map((s) => (
              <button key={s.id} className="card story-item" onClick={() => { setReading(s); setView('read'); }}>
                <span className="chapter-label">{topicOf(s.topic)?.title}</span>
                <strong>{s.title}</strong>
                <span className="muted small">{formatDate(s.createdAt)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="row center">
          <button className="btn btn-ghost" onClick={() => setView('home')}>기록장 첫 화면</button>
          <button className="btn btn-primary" onClick={() => require(() => setView('topics'))}>새 이야기 시작하기</button>
        </div>
        {gate}
        <Toast message={toast} onDone={() => setToast('')} />
      </div>
    );
  }

  // home
  return (
    <div className="page">
      <SubHeader title="📖 나의 인생 기록장" />
      <div className="card intro">
        <p>{SITE.honorific}의 소중한 인생 이야기를 남겨보세요.</p>
        <p>어린 시절의 추억부터 가족과 함께한 행복한 순간까지, 기억나는 이야기를 하나씩 들려주세요.</p>
        <p>글로 적으셔도 좋고, 편하게 말씀하셔도 됩니다.<br />제가 예쁜 글로 정리해 드릴게요.</p>
      </div>
      <button className="btn btn-primary wide" onClick={() => require(() => setView('topics'))}>이야기 시작하기</button>
      <button className="btn btn-ghost wide" onClick={() => setView('list')}>내가 남긴 이야기 보기{stories.length ? ` (${stories.length})` : ''}</button>
      {draft && (
        <div className="resume">
          <p className="label">이어서 쓰기</p>
          <button className="card resume-item" onClick={() => require(() => setView('interview'))}>
            <strong>{topicOf(draft.topic)?.title}</strong>
            <span className="muted small">나중에 이어서 하셔도 괜찮아요 · {draft.answers.length}개 답변</span>
          </button>
        </div>
      )}
      {gate}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

function Interview({ topic, draft, onChange, onFinish, onLater }) {
  const idx = draft.answers.length;
  const question = topic.questions[idx];
  const [mode, setMode] = useState('text'); // 'text' | 'voice'
  const [text, setText] = useState('');
  const done = !question;

  const submit = () => {
    if (!text.trim()) return;
    onChange({ ...draft, answers: [...draft.answers, { question, answer: text.trim() }] });
    setText('');
  };

  return (
    <div className="page">
      <SubHeader title={topic.title} subtitle={done ? '준비한 질문을 모두 답하셨어요.' : `${idx + 1}번째 이야기`} />

      {draft.answers.length > 0 && (
        <div className="qa-history">
          {draft.answers.map((a, i) => (
            <div key={i} className="qa">
              <p className="q">Q. {a.question}</p>
              <p className="a">{a.answer}</p>
            </div>
          ))}
        </div>
      )}

      {!done && (
        <div className="card">
          <p className="label">질문</p>
          <p className="question">{question}</p>
          <div className="tabs">
            <button className={mode === 'voice' ? 'on' : ''} onClick={() => setMode('voice')}>🎤 말로 이야기하기</button>
            <button className={mode === 'text' ? 'on' : ''} onClick={() => setMode('text')}>✏️ 글로 적기</button>
          </div>
          {mode === 'voice' && <VoiceInput onText={(t) => setText((prev) => (prev ? prev + ' ' : '') + t)} />}
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === 'voice' ? '여기에 말씀하신 내용이 나타나요 (고치셔도 돼요)' : '편안하게 적어 주세요'}
          />
          <button className="btn btn-primary wide" onClick={submit} disabled={!text.trim()}>이대로 답변하기</button>
        </div>
      )}

      <div className="row center">
        <button className="btn btn-soft" onClick={() => onFinish(draft)} disabled={!draft.answers.length}>여기까지 · 글로 정리하기</button>
        <button className="btn btn-ghost" onClick={onLater}>나중에 이어서 하기</button>
      </div>
    </div>
  );
}

// 브라우저 음성 인식(Web Speech API). 지원하지 않는 휴대폰에서는 안내만 보여 줍니다.
function VoiceInput({ onText }) {
  const Rec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState(Rec ? '마이크 버튼을 누르면 말씀하실 수 있어요.' : '이 휴대폰에서는 음성 인식이 어려워요. 글로 적어 주세요.');

  useEffect(() => () => recRef.current?.stop(), []);
  if (!Rec) return <p className="muted small">{msg}</p>;

  const start = () => {
    const rec = new Rec();
    rec.lang = 'ko-KR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = [...e.results].slice(e.resultIndex).map((r) => r[0].transcript).join(' ');
      if (t.trim()) onText(t.trim());
    };
    rec.onerror = (e) => {
      setMsg(e.error === 'not-allowed'
        ? '마이크 사용을 허용해 주셔야 해요. 설정에서 마이크를 켜 주세요.'
        : '음성 인식에 문제가 생겼어요. 다시 시도하거나 글로 적어 주세요.');
    };
    rec.onend = () => { setListening(false); setMsg('녹음이 끝났어요. 다시 말씀하시거나 글로 적어 주세요.'); };
    rec.start();
    recRef.current = rec;
    setListening(true);
    setMsg('말씀하고 계세요. 편하게 이야기해 주세요.');
  };

  return (
    <div className="voice">
      <button className={listening ? 'btn btn-danger wide' : 'btn btn-soft wide'} onClick={listening ? () => recRef.current?.stop() : start}>
        {listening ? '⏹ 녹음 끝내기' : '🎤 말씀 시작하기'}
      </button>
      <p className="muted small">{msg}</p>
    </div>
  );
}

function StoryReader({ story, requireFamily, onBack, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState({ title: story.title, body: story.body });
  const [uploaded, setUploaded] = useState([]);
  useEffect(() => { listPhotos().then(setUploaded); }, []);

  const allPhotos = [...PHOTOS, ...uploaded.map((p) => ({ ...p, caption: p.title }))];
  const attached = allPhotos.filter((p) => story.photoIds?.includes(p.id));

  return (
    <div className="page">
      <SubHeader title={story.title} subtitle={formatDate(story.createdAt)} />
      {editing ? (
        <div className="card form">
          <label>제목<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>본문<textarea rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
          <div className="row">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>취소</button>
            <button className="btn btn-primary" onClick={async () => {
              const next = { ...story, ...form };
              await saveStory(next);
              setEditing(false);
              onChanged('수정해서 저장했어요.', next);
            }}>저장하기</button>
          </div>
        </div>
      ) : (
        <article className="card story-body">
          {story.body.split('\n').map((line, i) => (line ? <p key={i}>{line}</p> : null))}
        </article>
      )}

      {attached.length > 0 && (
        <>
          <p className="label">함께 보는 사진</p>
          <div className="album-grid">{attached.map((p) => <div key={p.id} className="g-item"><img src={p.src} alt={p.caption} /><span>{p.caption}</span></div>)}</div>
        </>
      )}

      <div className="row center">
        <button className="btn btn-soft" onClick={() => requireFamily(() => setEditing(true))}>✏️ 글 수정하기</button>
        <button className="btn btn-soft" onClick={() => requireFamily(() => setPicking(true))}>🖼️ 사진 붙이기</button>
        <button className="btn btn-ghost" onClick={() => requireFamily(() => setConfirmDel(true))}>이야기 삭제하기</button>
      </div>
      <div className="row center"><button className="btn btn-ghost" onClick={onBack}>목록으로</button></div>

      {picking && (
        <PhotoPicker
          photos={allPhotos}
          selected={story.photoIds || []}
          onClose={() => setPicking(false)}
          onSave={async (ids) => {
            const next = { ...story, photoIds: ids };
            await saveStory(next);
            setPicking(false);
            onChanged('사진을 연결했어요.', next);
          }}
        />
      )}
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(false)}>
          <div className="center">
            <p><strong>이 이야기를 정말 지울까요?</strong></p>
            <p className="muted">지우면 다시 되돌리기 어려워요</p>
            <div className="row center">
              <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>아니요</button>
              <button className="btn btn-danger" onClick={async () => { await deleteStory(story.id); onChanged('이야기를 지웠어요.'); }}>네, 지울게요</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PhotoPicker({ photos, selected, onClose, onSave }) {
  const [ids, setIds] = useState(selected);
  const toggle = (id) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  return (
    <Modal onClose={onClose}>
      <h3>사진첩에서 고르기</h3>
      <div className="picker-grid">
        {photos.map((p) => (
          <button key={p.id} className={ids.includes(p.id) ? 'pick on' : 'pick'} onClick={() => toggle(p.id)}>
            <img src={p.src} alt={p.caption} loading="lazy" />
          </button>
        ))}
      </div>
      <div className="row">
        <button className="btn btn-ghost" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(ids)}>사진 연결 저장</button>
      </div>
    </Modal>
  );
}
