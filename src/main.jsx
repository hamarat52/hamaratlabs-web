import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode kapalı: geliştirme modunda efektleri iki kez kurup söküyor ve
// Gradient ASCII / Pixel Snow gibi bileşenler söküşte WebGL bağlamını kalıcı öldürüyor.
createRoot(document.getElementById('root')).render(<App />)
