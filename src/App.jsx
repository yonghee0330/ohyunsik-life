import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Timeline from './pages/Timeline.jsx';
import Letters from './pages/Letters.jsx';
import LetterWrite from './pages/LetterWrite.jsx';
import Voice from './pages/Voice.jsx';
import Gratitude from './pages/Gratitude.jsx';
import Video from './pages/Video.jsx';
import Places from './pages/Places.jsx';
import Album from './pages/Album.jsx';
import { currentRoute } from './router.js';

// 첫 화면('')은 인생 연표 슬라이드쇼, 메인 화면은 #/home
const ROUTES = {
  '': Timeline,
  home: Home,
  timeline: Timeline,
  letters: Letters,
  'write-letter': LetterWrite,
  voice: Voice,
  gratitude: Gratitude,
  video: Video,
  places: Places,
  album: Album,
};

export default function App() {
  const [route, setRoute] = useState(currentRoute());

  useEffect(() => {
    const onHash = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const Page = ROUTES[route] || Home;
  // 같은 연표 화면이라도 주소가 바뀌면 처음부터 다시 시작하도록 key를 줍니다.
  return <Page key={route} />;
}
