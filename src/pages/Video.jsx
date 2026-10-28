import { VIDEO } from '../config.js';
import { SubHeader } from '../components/Common.jsx';

export default function Video() {
  return (
    <div className="page wide-page">
      <SubHeader title="가족 영상관" subtitle={VIDEO.desc} />
      {VIDEO.youtubeId ? (
        <div className="video-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${VIDEO.youtubeId}?rel=0`}
            title={VIDEO.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="empty">
          <p className="big-icon">🎞️</p>
          <p>영상을 준비하고 있어요.</p>
          <p className="muted">곧 이곳에서 가족 영상을 함께 볼 수 있어요.</p>
        </div>
      )}
    </div>
  );
}
