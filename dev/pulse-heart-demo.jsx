import { createRoot } from 'react-dom/client';

import '../src/index.css';
import PulseHeart from '../src/components/rb/PulseHeart/PulseHeart.jsx';

const rows = [
  { title: 'Sesver (repo var)', owner: 'hamarat52', repo: 'sesver', id: 'sesver' },
  { title: 'Sesver — aynı sayfada 2. kalp (önbellek: ek API çağrısı yok)', owner: 'hamarat52', repo: 'sesver', id: 'sesver-2' },
  { title: 'Pomodoro Restoran (repo yok)', id: 'pomodoro' },
  { title: 'Hatalı repo (404 → sayı sessizce gizli)', owner: 'hamarat52', repo: 'boyle-bir-repo-yok-xyz', id: 'missing' }
];

export default function Demo() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 28, maxWidth: 390 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>PulseHeart test</h1>
      {rows.map(r => (
        <section key={r.id} data-row={r.id} style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{r.title}</div>
          <div>
            <PulseHeart repoOwner={r.owner} repoName={r.repo} />
          </div>
        </section>
      ))}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
