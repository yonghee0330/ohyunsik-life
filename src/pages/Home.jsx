import { useEffect, useState } from 'react';
import { SITE } from '../config.js';
import { QUOTES, CHAPTERS, PHOTOS, HOME_GALLERY, NOTE_STYLES } from '../data/content.js';
import { listGuestbook, listStories } from '../services/store.js';
import { go } from '../router.js';
import { Toast, Modal, formatDate } from '../components/Common.jsx';

const NAV = [
  { id: 'quote', label: '오늘의 감사' },
  { id: 'story', label: '인생 이야기' },
  { id: 'gallery', label: '갤러리' },
  { id: 'guestbook', label: '방명록/소통' },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(() => new Date().getDate() % QUOTES.length);
  const [toast, setToast] = useState('');
  const [notes, setNotes] = useState([]);
  const [storyCount, setStoryCount] = useState(0);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    listGuestbook().then(setNotes);
    listStories().then((s) => setStoryCount(s.length));
  }, []);

  const quote = QUOTES[quoteIdx];
  const gallery = HOME_GALLERY.map((id) => PHOTOS.find((p) => p.id === id)).filter(Boolean);

  const nextQuote = () => {
    let n = quoteIdx;
    while (n === quoteIdx && QUOTES.length > 1) n = Math.floor(Math.random() * QUOTES.length);
    setQuoteIdx(n);
  };

  const share = async () => {
    const text = `“${quote.text}”\n— ${SITE.name}의 ${SITE.title} —\n${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${SITE.name} | ${SITE.title}`, text });
        setToast('공유 창을 열었어요.');
      } else {
        await navigator.clipboard.writeText(text);
        setToast('문구를 복사했어요. 카카오톡에 붙여넣기 하세요.');
      }
    } catch {
      setToast('공유가 취소되었거나 지원되지 않아요.');
    }
  };

  const navClick = (id) => {
    setMenuOpen(false);
    scrollToId(id);
  };

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
            <button key={n.id} onClick={() => navClick(n.id)}>{n.label}</button>
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
            <button className="btn btn-primary" onClick={() => scrollToId('quote')}>오늘의 감사 한 줄 읽기</button>
          </div>
          <figure className="hero-photo">
            <img src={SITE.heroPhoto} alt={`${SITE.name}님`} />
            <figcaption>{SITE.heroCaption}</figcaption>
          </figure>
        </section>

        {/* QUOTE */}
        <section id="quote" className="section">
          <div className="section-head">
            <p className="eyebrow">DAILY GRATITUDE</p>
            <h2>오늘의 감사 구절</h2>
            <p className="muted">지나온 날을 긍정하는 한 줄로, 오늘을 조금 더 따뜻하게</p>
          </div>
          <div className="quote-card" style={{ backgroundImage: `url(${quote.bg})` }}>
            <div className="quote-inner">
              <span className="quote-mark">“</span>
              <p className="quote-text">{quote.text}</p>
              <p className="quote-by">— {SITE.name}의 인생 메세지 —</p>
            </div>
          </div>
          <div className="row center">
            <button className="btn btn-ghost" onClick={nextQuote}>오늘의 구절 바꾸기</button>
            <button className="btn btn-soft" onClick={share}>카카오톡으로 공유하기</button>
          </div>
        </section>

        {/* LIFE STORY */}
        <section id="story" className="section section-alt">
          <div className="section-head">
            <p className="eyebrow">LIFE STORY</p>
            <h2>{SITE.name}의 인생 이야기</h2>
            <p className="muted">청년의 꿈에서 오늘의 감사까지, 이어지는 이야기</p>
          </div>
          <div className="chapters">
            {CHAPTERS.map((c, i) => (
              <article key={c.title} className={i % 2 ? 'chapter reverse' : 'chapter'}>
                <div className="chapter-text">
                  <p className="chapter-label">{c.label}</p>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
                <img src={c.photo} alt={c.title} loading="lazy" />
              </article>
            ))}
          </div>
          <div className="row center">
            <button className="btn btn-primary" onClick={() => go('story')}>
              나의 인생 기록장 열기{storyCount ? ` · 남겨진 기록 ${storyCount}편` : ''}
            </button>
          </div>
        </section>

        {/* GALLERY */}
        <section id="gallery" className="section">
          <div className="section-head">
            <p className="eyebrow">GALLERY</p>
            <h2>아름다운 순간들</h2>
            <p className="muted">흑백 사진부터 졸업식까지, 세월이 담긴 사진들</p>
          </div>
          <div className="gallery">
            {gallery.map((p) => (
              <button key={p.id} className="g-item" onClick={() => setViewer(p)}>
                <img src={p.src} alt={p.caption} loading="lazy" />
                <span>{p.caption}</span>
              </button>
            ))}
          </div>
          <div className="row center">
            <button className="btn btn-primary" onClick={() => go('album')}>추억의 사진첩 열기</button>
          </div>
        </section>

        {/* GUESTBOOK */}
        <section id="guestbook" className="section section-alt">
          <div className="section-head">
            <p className="eyebrow">COMMUNITY</p>
            <h2>따뜻한 한마디</h2>
            <p className="muted">가족과 친구가 전하는 생신 축하와 감사의 마음을 남겨 주세요</p>
          </div>
          <div className="row center" style={{ marginBottom: 24 }}>
            <button className="btn btn-primary" onClick={() => go('write')}>한마디 남기기</button>
          </div>
          {notes.length === 0 ? (
            <div className="empty">
              <p>아직 남겨진 말이 없어요.</p>
              <p className="muted">첫 번째 따뜻한 한마디를 남겨 주세요.</p>
            </div>
          ) : (
            <div className="notes">
              {notes.map((n, i) => {
                const s = NOTE_STYLES[i % NOTE_STYLES.length];
                return (
                  <article key={n.id} className="note" style={{ background: s.bg }}>
                    <div className="note-head">
                      <strong>From. {n.name}</strong>
                      <span>{s.icon}</span>
                    </div>
                    <p>{n.message}</p>
                    <time>{formatDate(n.createdAt)}</time>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">© {SITE.name} | {SITE.title}. All rights reserved.</footer>

      {viewer && (
        <Modal onClose={() => setViewer(null)}>
          <img className="viewer-img" src={viewer.src} alt={viewer.caption} />
          <p className="viewer-cap">{viewer.caption}</p>
          <div className="row center">
            <button className="btn btn-ghost" onClick={() => setViewer(null)}>닫기</button>
          </div>
        </Modal>
      )}
      <Toast message={toast} onDone={() => setToast('')} />
    </>
  );
}
