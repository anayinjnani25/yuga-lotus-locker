import { useEffect, lazy, Suspense } from 'react';
import { useStore, type Route, type Theme } from './store';
import { Stage } from './three/Stage';
import { ExplorePage } from './pages/ExplorePage';
import { HowPage } from './pages/HowPage';

const CircuitPage = lazy(() => import('./pages/CircuitPage'));
const CodePage = lazy(() => import('./pages/CodePage'));
const YugasPage = lazy(() => import('./pages/YugasPage'));
const BuildPage = lazy(() => import('./pages/BuildPage'));

export const NAV: { id: Route; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'how', label: 'How it works' },
  { id: 'circuit', label: 'Circuit' },
  { id: 'code', label: 'Code' },
  { id: 'yugas', label: 'The four yugas' },
  { id: 'build', label: 'Build guide' },
];

/** #/explore?part=bolt → { route, params } */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, q] = h.split('?');
  const route = (NAV.some((n) => n.id === path) ? path : 'explore') as Route;
  return { route, params: new URLSearchParams(q ?? '') };
}

/** Link to a part in the 3D Explore view. */
export const partHref = (id: string) => `#/explore?part=${id}`;

export function App() {
  const route = useStore((s) => s.route);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const sync = () => {
      const { route, params } = parseHash();
      const part = params.get('part');
      useStore.setState({ route, ...(part ? { selected: part, glow: null } : {}) });
      if (route !== 'explore' && route !== 'how') window.scrollTo(0, 0);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme);
    try { localStorage.setItem('yuga-theme', theme); } catch { /* private mode */ }
  }, [theme]);

  useEffect(() => {
    document.title = `${NAV.find((n) => n.id === route)?.label} · Yuga Lotus Locker`;
  }, [route]);

  const staged = route === 'explore' || route === 'how';
  return (
    <div className={`app route-${route}`}>
      <Header route={route} theme={theme} />
      <div className="stage-wrap" hidden={!staged}>
        <Stage />
        {route === 'explore' && <ExplorePage />}
        {route === 'how' && <HowPage />}
      </div>
      {!staged && (
        <main className="doc">
          <Suspense fallback={<p className="loading-doc">Loading…</p>}>
            {route === 'circuit' && <CircuitPage />}
            {route === 'code' && <CodePage />}
            {route === 'yugas' && <YugasPage />}
            {route === 'build' && <BuildPage />}
          </Suspense>
        </main>
      )}
    </div>
  );
}

const THEMES: Theme[] = ['system', 'light', 'dark'];
function Header({ route, theme }: { route: Route; theme: Theme }) {
  const next = THEMES[(THEMES.indexOf(theme) + 1) % 3];
  return (
    <header className="topbar">
      <a className="brand" href="#/explore" aria-label="Yuga Lotus Locker, home">
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <path d="M16 3c3.4 5.2 3.4 11.6 0 17-3.4-5.4-3.4-11.8 0-17z" fill="#D9825A" />
          <path d="M4.5 11c5.6.2 10 4.4 11.5 10-5.6-.2-10-4.4-11.5-10zM27.5 11c-1.5 5.6-5.9 9.8-11.5 10 1.5-5.6 5.9-9.8 11.5-10z" fill="#C9A04A" />
          <path d="M6 24h20" stroke="#C9A04A" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>Yuga Lotus Locker</span>
      </a>
      <nav aria-label="Sections">
        {NAV.map((n) => (
          <a key={n.id} href={`#/${n.id}`} aria-current={route === n.id ? 'page' : undefined}>{n.label}</a>
        ))}
      </nav>
      <button className="theme-btn" onClick={() => useStore.setState({ theme: next })}
        aria-label={`Colour theme: ${theme}. Switch to ${next}`} title={`Theme: ${theme}`}>
        {theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◐'}
      </button>
    </header>
  );
}
