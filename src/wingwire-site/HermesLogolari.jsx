import L from './hermesLogoVerisi';
import geminiCliMaske from './img/gemini-cli-maske.png';

// Hermes Agent'ın bağlantıları (Yusuf, 2026-11-12): modeller (Claude, GPT, Gemini), MCP ve CLI'lar (Claude Code, agy, Gemini CLI).
// Tek renk currentColor, platform logolarıyla aynı dil. Kaynaklar ve lisanslar: docs/wingwire-uygulama/RAPOR.md "Hermes bağlantıları".
// Gemini CLI'ın resmi simgesi yalnız renkli PNG: renk atılmış maske (araclar/gemini_cli_maske.py), CSS mask, rengi currentColor.

const Svg = ({ id, ad }) => (
  <svg className="pl-logo__i" viewBox={L[id][0]} role="img" aria-label={ad}>
    <title>{ad}</title>
    <path d={L[id][1]} />
  </svg>
);

const Maske = ({ src, ad }) => <i className="pl-logo__i pl-logo__m" role="img" aria-label={ad} title={ad} style={{ '--maske': `url(${src})` }} />;

export const Modeller = () => (
  <span className="pl-logo hb-logo" role="group" aria-label="Hermes'in bağlanabildiği modeller">
    <Svg id="claude" ad="Claude" />
    <Svg id="gpt" ad="GPT (OpenAI)" />
    <Svg id="gemini" ad="Gemini" />
  </span>
);

export const Clilar = () => (
  <span className="pl-logo hb-logo" role="group" aria-label="Bu makinede kurulu CLI'lar">
    <Svg id="claudecode" ad="Claude Code" />
    <Svg id="agy" ad="agy (Antigravity CLI)" />
    <Maske src={geminiCliMaske} ad="Gemini CLI" />
  </span>
);

// MCP düğümünde yazı ("MCP sunucuları") zaten var: logo süs, ekran okuyucudan gizli. Öbür düğümlerin simge kutusuyla (.ik) aynı yerde.
export const McpLogo = () => (
  <svg className="ik ik--dolu" viewBox={L.mcp[0]} aria-hidden="true">
    <path d={L.mcp[1]} />
  </svg>
);
