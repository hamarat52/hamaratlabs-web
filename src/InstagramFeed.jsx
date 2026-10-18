import { useEffect } from 'react';
import { INSTAGRAM_POSTS } from './data';

// Instagram'ın resmi gömme kodu: gönderiler kendi hâliyle (video dahil) görünür.
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

export default function InstagramFeed() {
  useEffect(() => {
    loadEmbedScript().then(() => window.instgrm?.Embeds.process());
  }, []);

  return (
    <div className="insta" role="list">
      {INSTAGRAM_POSTS.map(url => (
        <div key={url} className="insta__item" role="listitem">
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            data-instgrm-captioned=""
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Instagram'da gör
            </a>
          </blockquote>
        </div>
      ))}
    </div>
  );
}
