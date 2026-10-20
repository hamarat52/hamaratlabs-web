import { useEffect, useRef, useState } from 'react';
import CrystalizedBall from './CrystalizedBall';
import './CrystalizedBallButton.css';

/*
 * CrystalizedBallButton — CrystalizedBall'u SiriOrb ile aynı "tıkla, sesi
 * çal" davranışına sarar. Kullanıcının isteği: SiriOrb'un yerini bu kristal
 * küre animasyonu alsın, renk kırmızı (#f43f3f) olsun.
 */
export default function CrystalizedBallButton({
  src,
  label = 'Sesi oynat',
  color = '#f43f3f',
  className = '',
  style
}) {
  const audioRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);

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
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(err => {
        setSpeaking(false);
        console.error('[CrystalizedBallButton] Ses çalınamadı:', src, err?.name || err);
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
      className={`crystal-ball-btn${speaking ? ' is-speaking' : ''} ${className}`.trim()}
      style={style}
      onClick={play}
      onKeyDown={onKeyDown}
    >
      <CrystalizedBall
        color={color}
        secondaryColor="#fff4f0"
        inkColor="#160506"
        facets={42}
        speed={speaking ? 2.4 : 1}
        light={speaking ? 1.5 : 1}
      />
    </div>
  );
}
