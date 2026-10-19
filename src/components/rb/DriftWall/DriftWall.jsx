'use client';

import { Children, useEffect, useMemo, useRef, useState } from 'react';

import './DriftWall.css';

/* Eğik bir düzlemde, sütunları ters yönlerde süzülen öğe duvarı.
   Hareket tamamen CSS animasyonudur (her sütun içeriği iki kez yazılır, -50%'ye kayar);
   JS yalnızca sütun sayısını genişliğe göre seçer ve ekran dışındayken animasyonu durdurur. */
export default function DriftWall({
  items = [],
  children,
  columns = 5,
  minColumnWidth = 150,
  duration = 38,
  gap = 16,
  tiltX = 22,
  tiltZ = -12,
  height = 460,
  pauseOnHover = true,
  fade = true,
  className = '',
  style
}) {
  const ref = useRef(null);
  const [cols, setCols] = useState(columns);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setCols(Math.max(2, Math.min(columns, Math.floor(w / minColumnWidth))));
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting));
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [columns, minColumnWidth]);

  const list = useMemo(() => {
    const fromChildren = Children.toArray(children);
    return fromChildren.length ? fromChildren : items;
  }, [children, items]);

  const lanes = useMemo(() => {
    if (!list.length) return [];
    // Her sütun listeyi farklı bir noktadan başlatır; komşu sütunlarda aynı öğe yan yana gelmez.
    const per = Math.max(10, Math.ceil((list.length * 1.4) / cols) + 2);
    return Array.from({ length: cols }, (_, c) =>
      Array.from({ length: per }, (_, i) => list[(c * 3 + i * cols + c) % list.length])
    );
  }, [list, cols]);

  return (
    <div
      ref={ref}
      className={`drift-wall${fade ? ' drift-wall--fade' : ''}${pauseOnHover ? ' drift-wall--hover' : ''}${running ? '' : ' drift-wall--paused'}${className ? ` ${className}` : ''}`}
      style={{
        '--dw-gap': `${gap}px`,
        '--dw-height': typeof height === 'number' ? `${height}px` : height,
        '--dw-tilt-x': `${tiltX}deg`,
        '--dw-tilt-z': `${tiltZ}deg`,
        ...style
      }}
    >
      <div className="drift-wall__plane" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {lanes.map((lane, c) => (
          <div
            key={c}
            className={`drift-wall__col${c % 2 ? ' drift-wall__col--up' : ''}`}
            style={{ '--dw-duration': `${duration * (0.85 + ((c * 37) % 30) / 100)}s` }}
          >
            {[0, 1].map(copy => (
              <div key={copy} className="drift-wall__track" aria-hidden={copy === 1 || undefined}>
                {lane.map((item, i) => (
                  <div key={i} className="drift-wall__item">
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
