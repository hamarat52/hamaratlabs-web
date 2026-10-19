import { createRoot } from 'react-dom/client';
import LetterGlitch from '../src/components/rb/LetterGlitch/LetterGlitch.jsx';

// İzole doğrulama sahnesi: ?smooth=0, ?vignette=0 ile varyant denenebilir.
const q = new URLSearchParams(location.search);

createRoot(document.getElementById('root')).render(
  <div className="stage">
    <LetterGlitch smooth={q.get('smooth') !== '0'} centerVignette={q.get('vignette') !== '0'} />
    <div className="copy">
      <h1>HamaratLabs</h1>
      <p>
        Küçük, işini yapan <b>uygulamalar</b>.
      </p>
    </div>
  </div>,
);
