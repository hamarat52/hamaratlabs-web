// Yalnız geliştirme test sayfası: `npm run dev` → /dev/puan-test.html
// Üretim derlemesine girmez (vite build yalnız kökteki index.html'i alır).
import { createRoot } from 'react-dom/client';

import '../src/index.css';
import ProductRating from '../src/components/rb/ProductRating/ProductRating';

const grounds = [
  { tone: 'ivory', bg: 'var(--ivory)', slug: 'sesver' },
  { tone: 'ink', bg: 'var(--ink)', slug: 'test-ink' },
  { tone: 'lime', bg: 'var(--lime)', slug: 'test-lime' }
];

createRoot(document.getElementById('root')).render(
  <main>
    {grounds.map(g => (
      <section key={g.tone} data-tone={g.tone} style={{ background: g.bg, padding: '32px var(--gutter)' }}>
        <ProductRating productSlug={g.slug} tone={g.tone} />
      </section>
    ))}
  </main>
);
