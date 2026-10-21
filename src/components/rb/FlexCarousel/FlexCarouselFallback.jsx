import './FlexCarouselFallback.css';

// WebGL gerektirmeyen yedek görünüm: aynı fotoğraflar, CSS ile yatay kaydırılabilir şerit.
// İki yerde kullanılır:
//  - FlexCarousel içinde: WebGL2 context alınamazsa (GPU kapalı, eski/kısıtlı tarayıcı).
//  - App.jsx'teki error boundary'de: karusel başka bir nedenle çökerse ya da chunk yüklenemezse.
// Bu yüzden ogl'e bağımlı değildir ve ana pakete küçük bir maliyetle girer.
const pickSrc = item => {
  // En küçük optimize varyant (webp) varsa onu kullan; yoksa orijinal kaynak.
  const variants = Array.isArray(item.variants) ? [...item.variants].sort((a, b) => a.height - b.height) : [];
  return variants[0]?.src || item.src;
};

const FlexCarouselFallback = ({ items = [], gap = 12, radius = 0, className = '', style, reason = 'no-webgl' }) => (
  <div
    className={`flex-carousel-fallback ${className}`.trim()}
    style={{ ...style, '--fcf-gap': `${gap}px`, '--fcf-radius': `${radius}px` }}
    role="region"
    aria-label="Fotoğraf galerisi"
    tabIndex={0}
    data-fallback={reason}
  >
    <ul className="flex-carousel-fallback__track">
      {items.map((item, index) => (
        <li key={item.src || index} className="flex-carousel-fallback__item">
          <figure className="flex-carousel-fallback__figure">
            <img
              className="flex-carousel-fallback__img"
              src={pickSrc(item)}
              alt={item.alt || item.title || ''}
              loading="lazy"
              decoding="async"
              draggable="false"
            />
            {(item.title || item.alt) && (
              <figcaption className="flex-carousel-fallback__caption">{item.title || item.alt}</figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  </div>
);

export default FlexCarouselFallback;
