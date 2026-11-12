import L from './hermesLogoVerisi';

// Hermes Agent'ın bağlantıları (Yusuf, 2026-11-12): modeller (Claude, GPT, Gemini), MCP ve CLI'lar (Claude Code, agy).
// Tek renk currentColor, platform logolarıyla aynı dil. Kaynaklar ve lisanslar: docs/wingwire-uygulama/RAPOR.md "Hermes bağlantıları".
// Gemini CLI çıkarıldı (pm-hamaratlabs, 2026-11-12: sitesi "Antigravity ile değiştirildi" diyor, iş akışı agy). Maskesi
// (img/gemini-cli-maske.png) ve üretim betiği (araclar/gemini_cli_maske.py) duruyor, kullanılmıyor (import yok, derlemeye girmez).

const Svg = ({ id, ad }) => (
  <svg className="pl-logo__i" viewBox={L[id][0]} role="img" aria-label={ad}>
    <title>{ad}</title>
    <path d={L[id][1]} />
  </svg>
);

export const Modeller = () => (
  <span className="pl-logo hb-logo" role="group" aria-label="Hermes'in bağlanabildiği modeller">
    <Svg id="claude" ad="Claude" />
    <Svg id="gpt" ad="GPT (OpenAI)" />
    <Svg id="gemini" ad="Gemini" />
  </span>
);

// CLI logoları adsız tanınmıyor: her logonun altında terminal komutu, mono
const Cli = ({ id, ad, komut }) => (
  <span className="hb-cli">
    <Svg id={id} ad={ad} />
    <code>{komut}</code>
  </span>
);

export const Clilar = () => (
  <span className="pl-logo hb-logo hb-logo--cli" role="group" aria-label="Bu makinede kurulu CLI'lar">
    <Cli id="claudecode" ad="Claude Code" komut="claude" />
    <Cli id="agy" ad="Antigravity CLI" komut="agy" />
  </span>
);

// MCP düğümünde yazı ("MCP sunucuları") zaten var: logo süs, ekran okuyucudan gizli. Öbür düğümlerin simge kutusuyla (.ik) aynı yerde.
export const McpLogo = () => (
  <svg className="ik ik--dolu" viewBox={L.mcp[0]} aria-hidden="true">
    <path d={L.mcp[1]} />
  </svg>
);
