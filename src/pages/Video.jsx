import { VIDEO } from '../config.js';
import { SubHeader } from '../components/Common.jsx';

export function Player({ id, vertical, title }) {
  return (
    <div className={vertical ? 'video-frame vertical' : 'video-frame'}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

export default function Video() {
  const wide = VIDEO.items.filter((v) => !v.vertical);
  const shorts = VIDEO.items.filter((v) => v.vertical);

  return (
    <div className="page wide-page">
      <SubHeader title="가족 영상관" subtitle={VIDEO.desc} />
      {VIDEO.birthday && (
        <section className="bday-feature">
          <p className="eyebrow">HAPPY BIRTHDAY</p>
          <h2>생신 축하 영상</h2>
          <div className="bday-player"><Player {...VIDEO.birthday} title="생신 축하 영상" /></div>
        </section>
      )}
      {VIDEO.items.length > 0 && <h3 className="list-h">가족의 시간</h3>}
      {!VIDEO.birthday && VIDEO.items.length === 0 && (
        <div className="empty">
          <p className="big-icon">🎞️</p>
          <p>영상을 준비하고 있어요.</p>
          <p className="muted">곧 이곳에서 가족 영상을 함께 볼 수 있어요.</p>
        </div>
      )}
      <div className="video-list">
        {wide.map((v) => <Player key={v.id} {...v} title={VIDEO.title} />)}
      </div>
      {shorts.length > 0 && (
        <div className="shorts-grid">
          {shorts.map((v) => <Player key={v.id} {...v} title={VIDEO.title} />)}
        </div>
      )}
    </div>
  );
}
