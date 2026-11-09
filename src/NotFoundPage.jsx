import { useContext } from 'react';
import { NavContext } from './nav';

export default function NotFoundPage() {
  const navigate = useContext(NavContext);
  return (
    <section className="section" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
      <h1 style={{ fontSize: '100px', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>404</h1>
      <p style={{ fontSize: '20px', color: 'var(--muted)', margin: 0 }}>Aradığın sayfa bulunamadı.</p>
      <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} className="more" style={{ marginTop: '32px' }}>
        Ana sayfaya dön <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
