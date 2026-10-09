import { useEffect, useRef } from "react";
import { Shield, Plane, Dice5, ArrowUpRight, Search, MapPin, X } from "lucide-react";
import type { GameView, GameCommand } from "@global-fund/shared";
import { formatMoney } from "@global-fund/ui";

type Props = {
  game: GameView;
  destination: string;
  onDestination: (id: string) => void;
  onAnalyse: (id: string) => void;
  onCommand: (c: GameCommand) => void;
  onClose: () => void;
  disabled?: boolean;
};

/** Consultations never submit a domain action. Only Stay/Move does. */
export default function Geography({ game, destination, onDestination, onAnalyse, onCommand, onClose, disabled = false }: Props) {
  const focus = useRef<HTMLElement>(null);
  const player = game.players.find(p => p.id === game.activePlayerId)!;
  const current = game.zones.find(z => z.id === player.zone)?.name ?? "Justice";
  const target = game.zones.find(z => z.id === destination)?.name ?? "";
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focus.current?.focus();
    return () => {
      // A phase may open automatically: return to its persistent action control.
      const action = document.querySelector<HTMLButtonElement>(".action-travel");
      if (action && !action.disabled) action.focus();
      else if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div className="decision-backdrop central-decision" role="dialog" aria-modal="false" aria-labelledby="destination-title">
    <section ref={focus} tabIndex={-1} className={`geography-scene ${player.jailed ? "justice-scene" : ""}`}>
      <button className="geography-close hud-icon" aria-label="Consulter le plateau avant de décider" onClick={onClose}><X size={18} /></button>
      <div className="geography-art">
        <div className="boarding-sign"><span>GLOBAL FUND · {player.name}</span><b>{player.jailed ? "AUDIENCE FINANCIÈRE" : "PLACES DE MARCHÉ"}</b><small>CYCLE {game.cycle} · IMPLANTATION</small></div>
        {player.jailed ? <Shield size={64} /> : <Plane size={64} />}
        <div className="travel-available"><small>LIQUIDITÉS DISPONIBLES</small><strong>{formatMoney(player.cash)}</strong><span><MapPin size={14} /> {current}</span></div>
      </div>
      <div className="geography-controls">
        <span className="eyebrow">{player.jailed ? "JUSTICE & CONFORMITÉ" : "DÉCISION · AVANT LE DÉ"}</span>
        <h2 id="destination-title">{player.jailed ? "Votre procès vous attend." : "Votre prochain marché."}</h2>
        <p>{player.jailed ? "Vos participations restent valorisées. Trading et revenus sont suspendus. Le dé du procès décide de votre libération." : "Comparez les marchés et votre portefeuille avant de décider. Consulter une zone ne change ni votre implantation ni votre tour."}</p>
        {player.jailed ? <button className="gold-button" disabled={disabled} onClick={() => onCommand({ type: "PRISON_ROLL" })}>Lancer le dé du procès <Dice5 size={20} /></button> : <>
          <div className="travel-markets" role="radiogroup" aria-label="Destination du fonds">
            {game.zones.map(z => <div className={`travel-market ${destination === z.id ? "selected" : ""} ${player.zone === z.id ? "current-market" : ""}`} key={z.id}>
              <button className="travel-zone-select" role="radio" aria-checked={destination === z.id} onClick={() => onDestination(z.id)} aria-label={`Choisir ${z.name}`}>
                <img src={`/assets/world/cities/${z.id}.webp`} alt="" /><span><b>{z.name}</b><small>{game.companies.filter(c => c.zone === z.id).length} entreprises · {player.zone === z.id ? "Position actuelle" : "Vol · 1,00 M€"}</small></span><strong className={`grade-${game.zoneGrades[z.id]}`}>{game.zoneGrades[z.id]}</strong>
              </button>
              <button className="travel-analyse" onClick={() => onAnalyse(z.id)} aria-label={`Analyser le marché ${z.name}`}><Search size={13} /> Analyser</button>
            </div>)}
          </div>
          <div className="travel-choice-summary" aria-live="polite"><span>Destination choisie <b>{target}</b></span><span>Coût <b>{destination === player.zone ? "0,00 M€" : "1,00 M€"}</b></span></div>
          <div className="travel-confirm-actions">
            <button className="stay-button" disabled={disabled} onClick={() => onCommand({ type: "STAY" })}><span>Rester en {current}<small>Conserver votre marché</small></span><b>0,00 M€</b></button>
            <button className="gold-button" disabled={disabled || !destination || destination === player.zone} onClick={() => onCommand({ type: "MOVE", zoneId: destination })}>Voyager vers {target} <ArrowUpRight size={18} /></button>
          </div>
        </>}
      </div>
    </section>
  </div>;
}
