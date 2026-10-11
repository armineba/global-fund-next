import { useId } from "react";
import { ArrowRight, BookOpen, Play, Plus, Settings2, UsersRound } from "lucide-react";
import "./main-menu.css";

export interface MainMenuProps {
  onNew: () => void;
  onJoin: () => void;
  onResume?: () => void;
  /** Room code of the saved session, shown on REPRENDRE. */
  resumeCode?: string;
  onSettings: () => void;
  onRules?: () => void;
}

/** Watch-bezel ticks every 30° (cardinal points carry the longer marks). */
const BEZEL_TICKS = Array.from({ length: 12 }, (_, i) => i)
  .filter((i) => i % 3 !== 0)
  .map((i) => {
    const a = (i * Math.PI) / 6;
    const p = (r: number) => `${(24 + r * Math.sin(a)).toFixed(2)} ${(24 - r * Math.cos(a)).toFixed(2)}`;
    return `M${p(19.9)}L${p(21.7)}`;
  })
  .join("");

/** Engraved armillary seal: the Global Fund mark (decorative). */
export function Emblem({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const stroke = `url(#${id}-brass)`;
  return (
    <svg className={`gf-emblem ${className}`} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-brass`} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8ecce" />
          <stop offset="0.45" stopColor="#dcb770" />
          <stop offset="1" stopColor="#8a6a33" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22.6" stroke={stroke} strokeWidth="1.3" />
      <circle cx="24" cy="24" r="19.2" stroke={stroke} strokeWidth="0.7" opacity="0.6" />
      <path d={BEZEL_TICKS} stroke={stroke} strokeWidth="0.7" opacity="0.7" strokeLinecap="round" />
      <path d="M24 1.4v3.4M24 43.2v3.4M1.4 24h3.4M43.2 24h3.4" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="24" cy="24" rx="7.4" ry="15.6" stroke={stroke} strokeWidth="1.15" />
      <ellipse cx="24" cy="24" rx="15.6" ry="5.2" stroke={stroke} strokeWidth="1.15" transform="rotate(-23 24 24)" />
      <path d="M8.6 24h30.8" stroke={stroke} strokeWidth="0.8" opacity="0.65" />
      <circle cx="24" cy="24" r="2.8" fill={stroke} />
    </svg>
  );
}

/** Title screen. The 3D hero (MenuHero) lives behind it, on the right half. */
export default function MainMenu({ onNew, onJoin, onResume, resumeCode, onSettings, onRules }: MainMenuProps) {
  return (
    <main id="main-menu" className="main-menu" aria-labelledby="main-menu-title">
      <section className="mm-stage">
        <div className="mm-title">
          <Emblem className="mm-emblem" />
          <h1 id="main-menu-title" className="mm-wordmark">
            <span>Global</span> <span>Fund</span>
          </h1>
          <p className="mm-tagline">Le monde est votre marché.</p>
        </div>

        <nav className="mm-actions" aria-label="Menu principal">
          <button className="mm-action mm-action--primary" onClick={onNew}>
            <span className="mm-action__icon" aria-hidden="true"><Plus size={18} strokeWidth={1.8} /></span>
            <span className="mm-action__label">NOUVELLE PARTIE<small>2 à 6 fonds, humains ou IA</small></span>
            <ArrowRight className="mm-action__arrow" size={18} aria-hidden="true" />
          </button>
          <button className="mm-action" onClick={onJoin}>
            <span className="mm-action__icon" aria-hidden="true"><UsersRound size={17} strokeWidth={1.6} /></span>
            <span className="mm-action__label">REJOINDRE<small>Avec un code d’invitation</small></span>
            <ArrowRight className="mm-action__arrow" size={17} aria-hidden="true" />
          </button>
          {onResume && (
            <button className="mm-action" onClick={onResume}>
              <span className="mm-action__icon" aria-hidden="true"><Play size={16} strokeWidth={1.6} /></span>
              <span className="mm-action__label">REPRENDRE<small>{resumeCode ? <>Salon <span className="gf-mono">{resumeCode}</span></> : "Dernière séance"}</small></span>
              <ArrowRight className="mm-action__arrow" size={17} aria-hidden="true" />
            </button>
          )}
          <div className="mm-utility">
            {onRules && <button onClick={onRules}><BookOpen size={15} strokeWidth={1.6} aria-hidden="true" /> RÈGLES</button>}
            <button onClick={onSettings}><Settings2 size={15} strokeWidth={1.6} aria-hidden="true" /> PARAMÈTRES</button>
          </div>
        </nav>
      </section>
    </main>
  );
}
