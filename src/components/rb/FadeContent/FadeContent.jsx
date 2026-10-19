'use client';

import { useEffect, useRef, useState } from 'react';

import './FadeContent.css';

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* Görünüme girince içeriği yumuşakça belirten genel sarmalayıcı.
   Saydamlık + bulanıklık + küçük bir kayma; hepsi CSS geçişiyle, tek IntersectionObserver ile. */
export default function FadeContent({
  children,
  as: Tag = 'div',
  blur = true,
  blurAmount = 10,
  duration = 900,
  delay = 0,
  easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
  threshold = 0.15,
  rootMargin = '0px 0px -8% 0px',
  initialOpacity = 0,
  offsetY = 18,
  scale = 1,
  once = true,
  onVisible,
  className = '',
  style,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            onVisible?.();
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, rootMargin, once]);

  return (
    <Tag
      ref={ref}
      className={`fade-content${shown ? ' fade-content--in' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--fc-blur': blur ? `${blurAmount}px` : '0px',
        '--fc-duration': `${duration}ms`,
        '--fc-delay': `${delay}ms`,
        '--fc-ease': easing,
        '--fc-opacity': initialOpacity,
        '--fc-y': `${offsetY}px`,
        '--fc-scale': scale,
        ...style
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
