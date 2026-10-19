import { useEffect, useRef, useState } from 'react';

import PeekRating from '../PeekRating/PeekRating';
import './ProductRating.css';

// Dürüstlük notu: sitenin backend'i yok. Burada gösterilen puan yalnız
// ziyaretçinin KENDİ verdiği puandır ve yalnız onun tarayıcısında (localStorage)
// saklanır. Topluluk ortalaması / oy sayısı gösterilmez, uydurulmaz.

const COUNT = 5;
const FEEDBACK_MS = 2000;
const LABELS = ['Kötü', 'İdare eder', 'İyi', 'Çok iyi', 'Harika'];

// Zemine göre renkler (WCAG 1.4.11: dolu ve boş yıldız zemine ≥3:1).
// Amber: Ivory 3.9:1, Ink 6.86:1. Lime zeminde amber kaybolduğu için dolu yıldız Ink (16:1).
// Boş yıldızlar: Ivory #8f887a 3.46:1, Ink #666b74 3.48:1, Lime #6f8a35 3.39:1.
const TONES = {
  ivory: { active: '#c8641a', idle: '#8f887a', tip: '#101317', tipText: '#fffdf8' },
  ink: { active: '#e8833a', idle: '#666b74', tip: '#fffdf8', tipText: '#101317' },
  lime: { active: '#101317', idle: '#6f8a35', tip: '#101317', tipText: '#d0ff63' }
};

const ratingKey = slug => `hamaratlabs:puan:${slug}`;

const readRating = key => {
  try {
    const n = Number.parseInt(localStorage.getItem(key) ?? '', 10);
    return Number.isInteger(n) && n >= 1 && n <= COUNT ? n : 0;
  } catch {
    return 0;
  }
};

const writeRating = (key, value) => {
  try {
    if (value > 0) localStorage.setItem(key, String(value));
    else localStorage.removeItem(key);
    return true;
  } catch {
    // depolama kapalıysa (gizli mod vb.) puan yalnız bu ziyarette kalır
    return false;
  }
};

export default function ProductRating({ productSlug, tone = 'ivory', size = 28, className = '' }) {
  const key = ratingKey(productSlug);
  const [state, setState] = useState(() => ({ key, value: readRating(key) }));
  const [feedback, setFeedback] = useState('');
  const timer = useRef(null);

  // Slug değişirse o ürünün kayıtlı puanını oku
  if (state.key !== key) setState({ key, value: readRating(key) });
  const value = state.key === key ? state.value : 0;

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = next => {
    const saved = writeRating(key, next);
    setState({ key, value: next });
    let message = next > 0 ? 'Teşekkürler!' : 'Puanın kaldırıldı';
    if (!saved && next > 0) message = 'Teşekkürler! (bu tarayıcıda saklanamadı)';
    setFeedback(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback(''), FEEDBACK_MS);
  };

  const colors = TONES[tone] || TONES.ivory;

  return (
    <div className={`product-rating product-rating--${TONES[tone] ? tone : 'ivory'}${className ? ` ${className}` : ''}`}>
      <div className="product-rating__head">
        <span className="product-rating__label">Senin puanın</span>
        <span className="product-rating__value" data-empty={value === 0}>
          {value > 0 ? `${value}/${COUNT} · ${LABELS[value - 1]}` : 'Henüz puan vermedin'}
        </span>
      </div>
      <div className="product-rating__body">
        <PeekRating
          value={value}
          onChange={handleChange}
          count={COUNT}
          labels={LABELS}
          size={size}
          activeColor={colors.active}
          idleColor={colors.idle}
          tipColor={colors.tip}
          tipTextColor={colors.tipText}
          ariaLabel="Senin puanın"
        />
        <span className="product-rating__thanks" role="status" aria-live="polite" data-show={feedback !== ''}>
          {feedback}
        </span>
      </div>
      <p className="product-rating__note">Puanın yalnız bu tarayıcıda saklanır, kimseyle paylaşılmaz.</p>
    </div>
  );
}
