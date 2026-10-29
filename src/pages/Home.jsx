import { useEffect, useState } from 'react';
import { SITE, VIDEO } from '../config.js';
import { LETTER_STYLES, GALLERY, photoById, paperOf } from '../data/content.js';
import { listLetters, listGratitude } from '../services/store.js';
import { go } from '../router.js';
import { formatDate } from '../components/Common.jsx';
import { Player } from '../components/Player.jsx';
import { PostIt } from '../components/PostIt.jsx';
import SecretDoor from '../components/SecretDoor.jsx';

const NAV = [
  { id: 'letters', label: '편지' },
  { id: 'gratitude', label: '감사' },
  { id: 'gallery', label: '갤러리' },
  { id: 'places', label: '추억지도' },
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

  useEffect(() => {
    listLetters().then(setLetters);
    listGratitude().then(setGratitude);
  }, []);

  // 갤러리 맛보기: 슬라이드 앞쪽 사진 4장
  const galleryPeek = GALLERY.filter((g) => g.photo).slice(0, 4).map((g) => photoById(g.photo));

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
              <button className={VIDEO.birthday ? 'btn btn-ghost' : 'btn btn-primary'} onClick={() => go('gallery')}>가족 갤러리 보기</button>
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
                <p className="muted">영상을 보시고 떠오른 마음이 있다면, 편지 한 통이나 포스트잇 한 장으로 보태 주세요.</p>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => go('write-letter')}>축하 편지 쓰기</button>
                  <button className="btn btn-ghost" onClick={() => go('gratitude')}>감사의 마음 전하기</button>
                </div>
              </div>
            </div>
          </section>
        )}

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

        {/* 감사 전하기 */}
        <section id="gratitude" className="section section-alt">
          <Head eyebrow="THANK YOU EVENT" title="감사의 마음 전하기" desc="그동안 표현하지 못했던 고마운 마음을, 포스트잇 한 장에 적어 붙여 주세요" />
          <p className="thanks-count center"><strong>{gratitude.length}</strong>장의 감사가 붙었어요</p>
          {gratitude.length > 0 && (
            <div className="postit-wall peek">
              {[...gratitude].reverse().slice(0, 3).map((g) => <PostIt key={g.id} g={g} />)}
            </div>
          )}
          <div className="row center">
            <button className="btn btn-primary" onClick={() => go('gratitude')}>{gratitude.length ? '전체 보고 마음 붙이기' : '첫 마음 붙이기'}</button>
          </div>
        </section>

        {/* 가족 갤러리 */}
        <section id="gallery" className="section">
          <Head eyebrow="FAMILY GALLERY" title="가족 갤러리" desc="사진과 영상을 슬라이드로 넘겨 보세요. 사이사이에 가족의 영상도 들어 있어요" />
          <div className="gal-peek">
            {galleryPeek.map((p) => (
              <button key={p.id} onClick={() => go('gallery')} aria-label="가족 갤러리 열기">
                <img src={p.src} alt={p.caption} loading="lazy" />
              </button>
            ))}
          </div>
          <div className="row center">
            <button className="btn btn-primary" onClick={() => go('gallery')}>슬라이드로 보기</button>
            <button className="btn btn-ghost" onClick={() => go('album')}>📸 사진첩</button>
          </div>
        </section>

        {/* 걸어온 곳 */}
        <section id="places" className="section section-alt">
          <Head eyebrow="PLACES" title="함께 걸어온 곳" desc="한국 지도 위에 함께한 곳을 핀으로 꽂아 두었어요. 사진을 올려 직접 핀을 더해 보세요" />
          <div className="row center" style={{ marginTop: 0 }}>
            <button className="btn btn-primary" onClick={() => go('places')}>지도 보러 가기</button>
          </div>
        </section>
      </main>

      <footer className="footer">© {SITE.name} | {SITE.title}. All rights reserved. <SecretDoor /></footer>
    </>
  );
}
