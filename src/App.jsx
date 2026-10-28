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

const ROUTES = {
  '': Home,
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
  return <Page />;
}
