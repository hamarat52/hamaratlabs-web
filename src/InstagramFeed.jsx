import { useEffect, useRef } from 'react';
import { INSTAGRAM_POSTS } from './data';

// Instagram'ın resmi gömme kodu. Gömme kendi kutusunda çalışır, içini değiştiremeyiz;
// çerçeveyi kırpıp yalnız videoyu gösteriyor, altına kendi satırımızı koyuyoruz.
let scriptPromise = null;
const loadEmbedScript = () => {
  if (window.instgrm) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://www.instagram.com/embed.js';
      s.async = true;
      s.onload = resolve;
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
};

// Gömmenin üst şeridi ve alt satırları sabit yükseklikte; aradaki medya gönderiye göre değişiyor.
const TOP = 55;
const BOTTOM = 157;

export default function InstagramFeed() {
  const listRef = useRef(null);

  useEffect(() => {
    loadEmbedScript().then(() => window.instgrm?.Embeds.process());
    // Her gönderinin medya yüksekliğini ölçüp kırpmayı ona göre ayarla.
    const fit = () => {
      listRef.current?.querySelectorAll('.insta__crop').forEach(crop => {
        const frame = crop.querySelector('iframe');
        const h = frame?.offsetHeight || 0;
        if (h > TOP + BOTTOM + 60) crop.style.height = `${Math.min(404, h - TOP - BOTTOM)}px`;
      });
    };
    const t = setInterval(fit, 500);
    const stop = setTimeout(() => clearInterval(t), 120000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, []);

  return (
    <ul className="insta" ref={listRef}>
      {INSTAGRAM_POSTS.map(url => (
        <li key={url} className="insta__item">
          <div className="insta__frame">
            <div className="insta__crop">
              <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Instagram'da gör
                </a>
              </blockquote>
            </div>
          </div>
          <a className="insta__link" href={url} target="_blank" rel="noopener noreferrer">
            <span>Reels</span>
            <span>Instagram'da izle ↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
