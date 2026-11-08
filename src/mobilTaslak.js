// TASLAK (design/mobil-taslak): telefon düzeni için yön seçici. Yusuf bir yön seçince bu dosya ve
// mobil-taslak.css içindeki seçilmeyen yön silinir, seçilen yönün kuralları kalıcı CSS'e taşınır.
// Kullanım: ?yon=a (sıkı liste) | ?yon=b (tek sütun büyük kart) | ?yon=0 (canlı düzen). Seçim sekme boyunca kalır.
import { useEffect, useState } from 'react';

const read = () => {
  try {
    const q = new URLSearchParams(window.location.search).get('yon');
    if (q !== null) {
      sessionStorage.setItem('hl-yon', q);
      return q;
    }
    return sessionStorage.getItem('hl-yon') || '';
  } catch {
    return '';
  }
};

const raw = typeof window === 'undefined' ? '' : read();
export const YON = raw === 'a' || raw === 'b' ? raw : '';
if (YON && typeof document !== 'undefined') document.documentElement.dataset.yon = YON;

// Telefon kırılımı: mobil-taslak.css ile aynı eşik.
const PHONE = '(max-width: 620px)';
export function usePhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE).matches);
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}
