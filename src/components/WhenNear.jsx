import { useEffect, useRef, useState } from 'react';

// Çocuklarını ancak kutu görünür alana `rootMargin` kadar yaklaşınca bağlar (mount eder).
// O ana kadar aynı sınıf/stil ile boş kutu durur; boyutu CSS'ten geldiği için yerleşim kaymaz.
// Ekranın çok altındaki ağır bileşenlerin (WebGL, büyük görseller) ilk yüklemeyi
// meşgul etmemesi için. IntersectionObserver yoksa hemen bağlar.
export default function WhenNear({ as: Tag = 'div', rootMargin = '1000px 0px', children, ...rest }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);

  return (
    <Tag ref={ref} {...rest}>
      {near ? children : null}
    </Tag>
  );
}
