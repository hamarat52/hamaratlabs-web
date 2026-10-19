// GEÇİCİ doğrulama girişi: doğrulamadan sonra silinir. App.jsx'e dokunmadan panoyu render eder.
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css';
import { NavContext } from './nav';
import { APPS, slugOf } from './data';
import IdeaBoardPage, { IdeaNoteCard } from './IdeaBoardPage';

const q = new URLSearchParams(location.search);
const slug = q.get('app') || 'pomodoro-restoran';
window.__navs = [];
window.__errs = [];
const origErr = console.error;
console.error = (...a) => (window.__errs.push(a.map(String).join(' ')), origErr(...a));
window.addEventListener('error', e => window.__errs.push(String(e.message)));
const nav = to => window.__navs.push(to);

function Root() {
  if (slug === 'list') {
    const ideas = APPS.filter(a => a.stage === 'idea');
    return (
      <div className="wrap" style={{ padding: 40 }}>
        <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {ideas.map((a, i) => (
            <IdeaNoteCard key={a.name} app={a} index={i} />
          ))}
        </div>
      </div>
    );
  }
  const app = APPS.find(a => slugOf(a.name) === slug);
  return <IdeaBoardPage app={app} />;
}

createRoot(document.getElementById('root')).render(
  <NavContext.Provider value={nav}>
    <Root />
  </NavContext.Provider>
);
