import { useEffect, useRef } from 'react';
import { GISCUS } from './data';

// Uygulama sayfalarının altındaki yorum ve emoji alanı (Giscus, GitHub Discussions üzerinde çalışır).
// Kimlikler data.js'te boşken hiçbir şey göstermez.
export default function Comments({ term }) {
  const ref = useRef(null);
  const ready = GISCUS.repoId && GISCUS.categoryId;

  useEffect(() => {
    const box = ref.current;
    if (!ready || !box) return;
    box.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    const attrs = {
      'data-repo': GISCUS.repo,
      'data-repo-id': GISCUS.repoId,
      'data-category': GISCUS.category,
      'data-category-id': GISCUS.categoryId,
      'data-mapping': 'specific',
      'data-term': term,
      'data-strict': '1',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': 'light',
      'data-lang': 'tr',
      'data-loading': 'lazy'
    };
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    box.appendChild(s);
  }, [ready, term]);

  if (!ready) return null;
  return (
    <section className="wrap comments" aria-label="Yorumlar">
      <h2>Yorumlar</h2>
      <div ref={ref} />
    </section>
  );
}
