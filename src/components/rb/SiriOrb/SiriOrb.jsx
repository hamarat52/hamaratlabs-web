import { useEffect, useRef, useState } from 'react';
import './SiriOrb.css';

/*
 * SiriOrb — Apple Siri "dinliyor" küresine benzeyen, saf CSS ile hareket eden
 * çok renkli ışık dairesi. Tıklanınca `src` ile verilen sesi çalar.
 * Ses dosyası yoksa / çalınamazsa hata sessizce yutulur (yalnız console.error).
 */
export default function SiriOrb({
  src,
  label = 'Sesi oynat',
  size,
  className = '',
  style
}) {
  const audioRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  const play = () => {
    setPulse(n => n + 1);
    if (!src) return;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      audio.addEventListener('playing', () => setSpeaking(true));
      audio.addEventListener('ended', () => setSpeaking(false));
      audio.addEventListener('pause', () => setSpeaking(false));
      audio.addEventListener('error', () => setSpeaking(false));
      audioRef.current = audio;
    }
    // Çalıyorsa baştan başlat (tekrar basınca yeniden söylesin)
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(err => {
        setSpeaking(false);
        console.error('[SiriOrb] Ses çalınamadı:', src, err?.name || err);
      });
    }
  };

  const onKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      play();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={speaking}
      className={`siri-orb${speaking ? ' is-speaking' : ''} ${className}`.trim()}
      style={size ? { ...style, '--so-size': typeof size === 'number' ? `${size}px` : size } : style}
      onClick={play}
      onKeyDown={onKeyDown}
    >
      <span className="siri-orb__glow" aria-hidden="true" />
      <span className="siri-orb__body" aria-hidden="true">
        <span className="siri-orb__blob siri-orb__blob--a" />
        <span className="siri-orb__blob siri-orb__blob--b" />
        <span className="siri-orb__blob siri-orb__blob--c" />
        <span className="siri-orb__blob siri-orb__blob--d" />
        <span className="siri-orb__shine" />
      </span>
      {pulse > 0 && <span key={pulse} className="siri-orb__ring" aria-hidden="true" />}
    </div>
  );
}
