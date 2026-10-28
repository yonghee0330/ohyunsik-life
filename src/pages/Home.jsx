import { useEffect, useState } from 'react';
import { SITE, VIDEO, GRATITUDE_GOAL } from '../config.js';
import { TIMELINE, LETTER_STYLES, photoById, paperOf } from '../data/content.js';
import { listLetters, listGratitude, listVoices } from '../services/store.js';
import { go } from '../router.js';
import { formatDate } from '../components/Common.jsx';
import { Player } from './Video.jsx';

const NAV = [
  { id: 'timeline', label: '인생 연표' },
  { id: 'letters', label: '편지' },
  { id: 'voice', label: '목소리' },
  { id: 'gratitude', label: '감사 100가지' },
  { id: 'video', label: '영상관' },
  { id: 'places', label: '걸어온 곳' },
];

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function Head({ eyebrow, title, desc }) {
  return (
    <div className="section-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="muted">{desc}</p>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [letters, setLetters] = useState([]);
  const [gratitude, setGratitude] = useState([]);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    listLetters().then(setLetters);
    listGratitude().then(setGratitude);
    listVoices().then(setVoices);
  }, []);

  const answered = voices.filter((v) => v.answeredAt);
  const latestVoice = answered[0];
  const pct = Math.min(100, Math.round((gratitude.length / GRATITUDE_GOAL) * 100));

  return (
    <>
      <header className="nav">
        <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <strong>{SITE.name}</strong>
          <span className="bar">|</span>
          <span className="brand-sub">{SITE.title}</span>
        </button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => { setMenuOpen(false); scrollToId(n.id); }}>{n.label}</button>
          ))}
        </nav>
        <button className="menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="메뉴">메뉴</button>
      </header>

      <main>
        {/* HERO */}
        <section id="top" className="hero">
          <div className="hero-text">
            <p className="eyebrow">{SITE.tagline}</p>
            <h1>
              {SITE.heroLine1}
              <br />
              {SITE.name}의 <em>‘{SITE.title}’</em>
            </h1>
            <p className="lead">{SITE.heroSub}</p>
            <p className="profile">{SITE.profile}</p>
            <div className="row" style={{ marginTop: 0 }}>
              {VIDEO.birthday && <button className="btn btn-primary" onClick={() => scrollToId('birthday')}>▶ 생신 축하 영상 보기</button>}
              <button className={VIDEO.birthday ? 'btn btn-ghost' : 'btn btn-primary'} onClick={() => go('timeline')}>인생 연표 보기</button>
            </div>
          </div>
          <figure className="hero-photo">
            <img src={SITE.heroPhoto} alt={`${SITE.name}님`} />
            <figcaption>{SITE.heroCaption}</figcaption>
          </figure>
        </section>

        {/* 생신 축하 영상 */}
        {VIDEO.birthday && (
          <section id="birthday" className="section bday-section">
            <div className="bday-wrap">
              <div className="bday-player"><Player {...VIDEO.birthday} title="생신 축하 영상" /></div>
              <div className="bday-text">
                <p className="eyebrow">HAPPY BIRTHDAY</p>
                <h2>{SITE.honorific}, 생신 축하드립니다</h2>
                <p>가족들이 마음을 모아 준비한 영상이에요.<br />재생 버튼을 눌러 함께 보세요.</p>
                <p className="muted">영상을 보시고 떠오른 마음이 있다면, 편지 한 통이나 감사 한 줄로 보태 주세요.</p>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => go('write-letter')}>축하 편지 쓰기</button>
                  <button className="btn btn-ghost" onClick={() => go('gratitude')}>감사 한 줄 보태기</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 인생 연표 */}
        <section id="timeline" className="section section-alt">
          <Head eyebrow="LIFE TIMELINE" title="인생 연표" desc="청년의 꿈에서 오늘의 감사까지, 시간 순서대로 따라가 보세요" />
          <div className="tl-strip">
            {TIMELINE.map((t, i) => (
              <button key={i} className="tl-chip" onClick={() => go('timeline')}>
                {t.photos[0] ? <img src={photoById(t.photos[0]).src} alt={t.title} loading="lazy" /> : <span className="tl-noimg">{t.when}</span>}
                <span className="tl-chip-when">{t.when}</span>
                <strong>{t.title}</strong>
              </button>
            ))}
          </div>
          <div className="row center"><button className="btn btn-primary" onClick={() => go('timeline')}>연표 전체 보기</button></div>
        </section>

        {/* 편지 */}
        <section id="letters" className="section">
          <Head eyebrow="LETTERS" title="아버님께 드리는 편지" desc="짧은 인사보다, 마음을 꾹꾹 눌러 쓴 긴 편지를 모았어요" />
          {letters.length === 0 ? (
            <div className="empty"><p>아직 도착한 편지가 없어요.</p><p className="muted">첫 번째 편지의 주인공이 되어 주세요.</p></div>
          ) : (
            <div className="notes">
              {letters.slice(0, 3).map((l, i) => {
                const s = LETTER_STYLES[i % LETTER_STYLES.length];
                const p = paperOf(l.paper);
                return (
                  <button key={l.id} className="letter-card" style={{ background: p.bg, color: p.ink }} onClick={() => go('letters')}>
                    <span className="letter-icon">{s.icon}</span>
                    <strong>From. {l.from}</strong>
                    <span className="letter-preview">{l.body}</span>
                    <time>{formatDate(l.createdAt)}</time>
                  </button>
                );
              })}
            </div>
          )}
          <div className="row center">
            {letters.length > 0 && <button className="btn btn-ghost" onClick={() => go('letters')}>편지 모두 읽기 ({letters.length})</button>}
            <button className="btn btn-primary" onClick={() => go('write-letter')}>편지 쓰기</button>
          </div>
        </section>

        {/* 목소리 */}
        <section id="voice" className="section section-alt">
          <Head eyebrow="VOICE" title={`${SITE.honorific}의 목소리`} desc="궁금했던 것을 물어보면, 아버님이 목소리로 들려주세요" />
          <div className="card voice-teaser">
            {latestVoice ? (
              <>
                <p className="q">Q. {latestVoice.question}</p>
                {latestVoice.audio ? <audio controls preload="none" src={latestVoice.audio} /> : <p className="voice-text">{latestVoice.text}</p>}
              </>
            ) : (
              <p className="muted center">아직 녹음된 이야기가 없어요. 질문을 남겨 두면 아버님이 시간 날 때 들려주실 거예요.</p>
            )}
          </div>
          <div className="row center"><button className="btn btn-primary" onClick={() => go('voice')}>질문 남기기 · 이야기 듣기{answered.length ? ` (${answered.length})` : ''}</button></div>
        </section>

        {/* 감사 100가지 */}
        <section id="gratitude" className="section">
          <Head eyebrow="100 THANKS" title="감사 100가지" desc="가족이 한 줄씩 보태서, 고마운 이유 100가지를 채워 가요" />
          <div className="card progress-card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <p className="count"><strong>{gratitude.length}</strong> / {GRATITUDE_GOAL}</p>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            {gratitude.length > 0 && (
              <p className="muted small" style={{ marginTop: 10 }}>최근: “{gratitude[gratitude.length - 1].text}” — {gratitude[gratitude.length - 1].name}</p>
            )}
          </div>
          <div className="row center"><button className="btn btn-primary" onClick={() => go('gratitude')}>감사 한 줄 보태기</button></div>
        </section>

        {/* 영상관 */}
        <section id="video" className="section section-alt">
          <Head eyebrow="FAMILY FILM" title="가족 영상관" desc={VIDEO.desc} />
          <div className="row center" style={{ marginTop: 0 }}>
            <button className="btn btn-primary" onClick={() => go('video')}>영상 보러 가기</button>
          </div>
        </section>

        {/* 걸어온 곳 */}
        <section id="places" className="section">
          <Head eyebrow="PLACES" title="함께 걸어온 곳" desc="제주, 남산, 바닷가…… 지도 위에 사진을 꽂아 두었어요" />
          <div className="row center" style={{ marginTop: 0 }}>
            <button className="btn btn-primary" onClick={() => go('places')}>지도 보러 가기</button>
          </div>
        </section>
      </main>

      <footer className="footer">© {SITE.name} | {SITE.title}. All rights reserved.</footer>
    </>
  );
}
