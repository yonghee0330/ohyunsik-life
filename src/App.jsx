import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import StoryBook from './pages/StoryBook.jsx';
import Album from './pages/Album.jsx';
import GuestbookWrite from './pages/GuestbookWrite.jsx';
import { currentRoute } from './router.js';

const ROUTES = {
  '': Home,
  story: StoryBook,
  album: Album,
  write: GuestbookWrite,
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
