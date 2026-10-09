import {
  ArrowRight,
  BookOpen,
  Globe2,
  Play,
  Plus,
  Settings2,
  UsersRound,
} from "lucide-react";
import "./main-menu.css";

export interface MainMenuProps {
  onNew: () => void;
  onJoin: () => void;
  onResume?: () => void;
  onSettings: () => void;
  onRules?: () => void;
}

/** Full-screen title menu. Game setup and resume state are owned by the caller. */
export default function MainMenu({
  onNew,
  onJoin,
  onResume,
  onSettings,
  onRules,
}: MainMenuProps) {
  return (
    <main id="main-menu" className="main-menu" aria-labelledby="main-menu-title">
      <div className="main-menu__backdrop" aria-hidden="true" />
      <header className="main-menu__header">
        <a className="main-menu__brand" href="#main-menu" aria-label="Global Fund, accueil">
          <span className="main-menu__brand-mark"><Globe2 /></span>
          <span className="main-menu__brand-copy">
            <strong id="main-menu-title">GLOBAL <em>FUND</em></strong>
            <small>INVESTIR · NÉGOCIER · ANTICIPER · DOMINER</small>
          </span>
        </a>
        <div className="main-menu__edition"><i /> MARCHÉS MONDIAUX <span>·</span> ÉDITION 2026</div>
      </header>

      <div className="main-menu__body">
        <section className="main-menu__welcome" aria-label="Présentation du jeu">
          <div className="main-menu__kicker"><span /> STRATÉGIE · CAPITAL · INFLUENCE</div>
          <h1>Le monde est<br />votre <em>marché.</em></h1>
          <p>Chaque décision dessine votre empire.<br />Prenez place à la table des marchés mondiaux.</p>

          <nav className="main-menu__actions" aria-label="Menu principal">
            <button className="main-menu__action main-menu__action--primary" onClick={onNew}>
              <span className="main-menu__action-icon"><Plus aria-hidden="true" /></span>
              <span>NOUVELLE PARTIE<small>Créer une partie</small></span>
              <ArrowRight aria-hidden="true" className="main-menu__action-arrow" />
            </button>
            <button className="main-menu__action" onClick={onJoin}>
              <span className="main-menu__action-icon"><UsersRound aria-hidden="true" /></span>
              <span>REJOINDRE<small>Entrer dans un salon</small></span>
              <ArrowRight aria-hidden="true" className="main-menu__action-arrow" />
            </button>
            {onResume && (
              <button className="main-menu__action" onClick={onResume}>
                <span className="main-menu__action-icon"><Play aria-hidden="true" /></span>
                <span>REPRENDRE<small>Continuer la partie sauvegardée</small></span>
                <ArrowRight aria-hidden="true" className="main-menu__action-arrow" />
              </button>
            )}
            <div className="main-menu__utility-actions">
              {onRules && <button onClick={onRules}><BookOpen aria-hidden="true" /> RÈGLES</button>}
              <button onClick={onSettings}><Settings2 aria-hidden="true" /> PARAMÈTRES</button>
            </div>
          </nav>

          <div className="main-menu__footnote">
            <span className="main-menu__footnote-rule" />
            <span>5 ZONES ÉCONOMIQUES <b>·</b> 9 SECTEURS</span>
            <small>Une partie. Des marchés en mouvement.</small>
          </div>
        </section>

        <aside className="main-menu__showcase" aria-label="Aperçu du plateau">
          <div className="main-menu__showcase-heading">
            <span>LE PLATEAU MONDIAL</span>
            <span className="main-menu__live"><i /> APERÇU</span>
          </div>
          <div className="main-menu__table" aria-hidden="true">
            <div className="main-menu__table-rim">
              <div className="main-menu__map">
                <div className="main-menu__map-glow" />
                <div className="main-menu__route main-menu__route--one" />
                <div className="main-menu__route main-menu__route--two" />
                <span className="main-menu__route-node main-menu__route-node--one" />
                <span className="main-menu__route-node main-menu__route-node--two" />
                <span className="main-menu__route-node main-menu__route-node--three" />
                <div className="main-menu__table-label"><Globe2 /><b>GLOBAL FUND</b><small>LE CIRCUIT DES MARCHÉS</small></div>
                <div className="main-menu__table-pawn"><img src="/assets/pawns/premium/globe.webp" alt="" /></div>
              </div>
            </div>
          </div>
          <div className="main-menu__showcase-footer">
            <span>PARCOURS MONDIAL</span><span>52 CASES <b>·</b> 5 ZONES</span>
          </div>
          <div className="main-menu__side-object" aria-hidden="true">
            <span className="main-menu__side-orbit main-menu__side-orbit--a" />
            <span className="main-menu__side-orbit main-menu__side-orbit--b" />
            <img src="/assets/pawns/premium/globe.webp" alt="" />
            <span className="main-menu__side-base" />
          </div>
          <div className="main-menu__aside-caption"><span>01</span> INVESTISSEZ À L’ÉCHELLE DU MONDE</div>
        </aside>
      </div>

      <footer className="main-menu__footer">
        <span>GLOBAL FUND <b>·</b> STRATÉGIE FINANCIÈRE</span>
        <span>ANTICIPER. NÉGOCIER. DOMINER.</span>
        <span>ÉDITION NEXT <b>·</b> 2026</span>
      </footer>
    </main>
  );
}
