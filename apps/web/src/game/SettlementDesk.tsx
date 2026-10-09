import { useMemo, useState } from "react";
import { ArrowLeftRight, ArrowRight, BadgeEuro, Building2, Check, Clock3, HandCoins, Landmark, ShieldCheck, X } from "lucide-react";
import type { GameCommand, GameView, PendingSettlement, Player, SettlementAsset } from "@global-fund/shared";
import "./settlement-desk.css";

type Props = {
  game: GameView;
  settlement: PendingSettlement;
  viewerId: string;
  canAct: boolean;
  onCommand: (command: GameCommand) => void;
};

const money = (value: number) => `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)} M€`;
const quantity = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
const roundCent = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
const nameOf = (players: Player[], id: string | null) => id ? players.find(player => player.id === id)?.name ?? "Fonds" : "Banque / marché";

export default function SettlementDesk({ game, settlement, viewerId, canAct, onCommand }: Props) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const debtor = game.players.find(player => player.id === settlement.debtorId);
  const creditor = game.players.find(player => player.id === settlement.creditorId);
  const actor = game.players.find(player => player.id === settlement.decisionActorId);
  const isActor = viewerId === settlement.decisionActorId;
  const editable = canAct && isActor;
  const offer = settlement.offer;
  const selectedAssets = useMemo(() => game.companies.flatMap(company => {
    const held = company.holdings[settlement.debtorId] ?? 0;
    const count = Math.min(selected[company.id] ?? 0, held);
    const perShare = roundCent(company.price);
    if (count <= 0 || !company.available || perShare <= 0) return [];
    return [{ companyId: company.id, companyName: company.name, quantity: count, perShare, value: roundCent(count * perShare) }];
  }), [game.companies, selected, settlement.debtorId]);
  const selectedValue = selectedAssets.reduce((sum, item) => sum + item.value, 0);
  const isCreditorDecision = settlement.status === "awaitingCreditor";
  const currentDebt = roundCent(settlement.remainingAmount);
  const debtorCash = debtor?.cash ?? 0;
  const cashGap = roundCent(Math.max(0, currentDebt - debtorCash));
  const proposedCashDelta = roundCent(currentDebt - selectedValue);
  const cashAvailableForCreditor = creditor?.cash ?? 0;
  const offerAssets = offer?.assets ?? [];
  const creditorPays = (offer?.cashDelta ?? 0) < 0;
  const creditorCanPay = !creditorPays || roundCent(cashAvailableForCreditor) >= roundCent(Math.abs(offer?.cashDelta ?? 0));
  const hasSelection = selectedAssets.length > 0;
  const selectionCovers = hasSelection && roundCent(selectedValue + debtorCash) >= currentDebt;

  const toggleQuantity = (companyId: string, held: number, next: number) => {
    setSelected(current => {
      const updated = { ...current };
      if (next <= 0) delete updated[companyId];
      else updated[companyId] = Math.min(held, next);
      return updated;
    });
  };
  const submit = (type: "LIQUIDATE_ASSETS" | "PROPOSE_SETTLEMENT") => {
    if (!editable || (type === "PROPOSE_SETTLEMENT" && !selectionCovers) || (type === "LIQUIDATE_ASSETS" && !hasSelection)) return;
    onCommand({ type, assets: selectedAssets.map(({ companyId, quantity: count }) => ({ companyId, quantity: count })) });
  };

  const assets = game.companies
    .filter(company => (company.holdings[settlement.debtorId] ?? 0) > 0 && company.available && company.price > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const cause = settlement.sectorLabel ?? (settlement.sectorId ? game.sectors.find(sector => sector.id === settlement.sectorId)?.name : undefined);
  const order = settlement.creditorOrder.map(id => game.players.find(player => player.id === id)).filter((player): player is Player => Boolean(player));
  const frozenPriorities = new Map((settlement.creditorPriorities ?? []).map(priority => [priority.playerId, priority.value]));
  const priorityLabel = settlement.priorityMetric === "cash" ? "Liquidités au début du règlement" : "Valorisation au début du règlement";

  return <main className="settlement-desk" aria-label="Desk de règlement">
    <header className="sd-topbar">
      <span className="sd-brand"><i><Landmark size={17} /></i><span>GLOBAL FUND <b>· CLEARING</b></span></span>
      <span className="sd-status"><i className={isActor ? "live" : "waiting"} />{isCreditorDecision ? "DÉCISION DU CRÉANCIER" : "RÈGLEMENT PRIORITAIRE"}</span>
      <span className="sd-cycle">CYCLE {String(game.cycle).padStart(2, "0")} <b>·</b> DOSSIER {String(settlement.id).padStart(4, "0")}</span>
    </header>

    <section className="sd-cause" aria-label="Cause du règlement">
      <div className="sd-cause-mark"><ArrowRight size={16} /></div>
      <div><small>{cause ? "ORIGINE SUR LE PLATEAU" : "ORIGINE DU RÈGLEMENT"}</small><strong>{cause ? `CASE ${cause.toLocaleUpperCase("fr-FR")}` : "RÈGLEMENT FINANCIER"}</strong></div>
      {cause && <span className="sd-cause-flow">ARRIVÉE SUR LA CASE <ArrowRight size={12} /> REVENUS DES DÉTENTEURS <ArrowRight size={12} /> RÈGLEMENT</span>}
      <p>{settlement.reason}</p>
    </section>

    <section className="sd-ledger" aria-label="Synthèse de l'obligation">
      <div className="sd-party"><small>DÉBITEUR</small><strong>{nameOf(game.players, settlement.debtorId)}</strong><span>{money(debtorCash)} disponibles</span></div>
      <div className="sd-ledger-arrow"><ArrowLeftRight size={18} /></div>
      <div className="sd-obligation"><small>{isCreditorDecision ? "OFFRE SOUMISE · DETTE" : "MONTANT À RÉGLER"}</small><strong>{money(currentDebt)}</strong><span>{cashGap > 0 ? `Manque ${money(cashGap)} en liquidités` : "Liquidités disponibles suffisantes"}</span></div>
      <div className="sd-ledger-arrow"><ArrowRight size={18} /></div>
      <div className="sd-party sd-party-creditor"><small>CRÉANCIER</small><strong>{nameOf(game.players, settlement.creditorId)}</strong><span>{creditor ? `${money(creditor.cash)} de liquidités` : "Règlement au marché"}</span></div>
    </section>

    {order.length > 1 && <section className="sd-priority" aria-label="Ordre des créanciers">
      <span>ORDRE DE RÈGLEMENT <small>{priorityLabel}</small></span>
      <div>{order.map((player, index) => <span key={player.id} className={player.id === settlement.creditorId ? "current" : ""}><b>{String(index + 1).padStart(2, "0")}</b>{player.name}<small title={priorityLabel}>{money(frozenPriorities.get(player.id) ?? player.fundValue)}</small></span>)}</div>
    </section>}

    {settlement.status === "selectAssets" && <section className="sd-main">
      <div className="sd-section-heading"><div><small>{isActor ? "SÉLECTION SOUS CONTRAINTE" : "SÉLECTION EN COURS"}</small><h1>{isActor ? "Choisissez les actifs à céder" : `${nameOf(game.players, settlement.decisionActorId)} prépare le règlement`}</h1></div><span><Building2 size={15} /> PORTEFEUILLE · TOUS LES MARCHÉS</span></div>
      {isActor ? <>
        <div className="sd-table-wrap">
          <table className="sd-assets-table">
            <thead><tr><th>ACTIF</th><th>MARCHÉ · SECTEUR</th><th>PARTS</th><th>COURS</th><th>À CÉDER</th><th>VALEUR ESTIMÉE</th></tr></thead>
            <tbody>{assets.map(company => {
              const held = company.holdings[settlement.debtorId] ?? 0;
              const count = Math.min(selected[company.id] ?? 0, held);
              return <tr key={company.id} className={count > 0 ? "selected" : ""}>
                <td><strong>{company.name}</strong><small>{company.ticker ?? company.id}</small></td>
                <td>{game.zones.find(zone => zone.id === company.zone)?.name ?? company.zone}<small>{game.sectors.find(sector => sector.id === company.sector)?.name ?? company.sector}</small></td>
                <td>{quantity(held)}</td><td>{money(company.price)}</td>
                <td><div className="sd-quantity"><button type="button" aria-label={`Retirer une part de ${company.name}`} disabled={!editable || count === 0} onClick={() => toggleQuantity(company.id, held, count - 1)}>−</button><b>{quantity(count)}</b><button type="button" aria-label={`Ajouter une part de ${company.name}`} disabled={!editable || count >= held} onClick={() => toggleQuantity(company.id, held, count + 1)}>+</button></div></td>
                <td className={count > 0 ? "sd-value-selected" : ""}>{money(count * company.price)}</td>
              </tr>;
            })}{assets.length === 0 && <tr><td colSpan={6} className="sd-empty">Aucune participation liquidable dans le portefeuille.</td></tr>}</tbody>
          </table>
        </div>
        <footer className="sd-selection-footer">
          <div className="sd-estimate"><span>VALEUR INDICATIVE DES ACTIFS <b>{money(selectedValue)}</b></span><span>{proposedCashDelta >= 0 ? "Complément débiteur estimé" : "Complément créancier estimé"}<b>{money(Math.abs(proposedCashDelta))}</b></span><small>Estimation au cours affiché. Le serveur fixe les cours à l’envoi de la proposition.</small></div>
          <div className="sd-actions"><button className="sd-secondary" type="button" disabled={!editable || !hasSelection} onClick={() => submit("LIQUIDATE_ASSETS")}><BadgeEuro size={15} /> Vendre au marché</button><button className="sd-primary" type="button" disabled={!editable || !selectionCovers || !settlement.creditorId} onClick={() => submit("PROPOSE_SETTLEMENT")}><HandCoins size={15} /> Proposer au créancier <ArrowRight size={14} /></button></div>
        </footer>
        {!selectionCovers && <p className="sd-hint">Sélectionnez assez d’actifs et de liquidités pour couvrir le montant à régler. Une vente partielle au marché reste possible.</p>}
        {!settlement.creditorId && <p className="sd-hint">Cette dette est due au marché : les actifs sélectionnés seront vendus et le produit servira au paiement.</p>}
      </> : <div className="sd-waiting"><Clock3 size={20} /><span>En attente de la sélection des actifs par <b>{nameOf(game.players, settlement.decisionActorId)}</b>.</span></div>}
    </section>}

    {isCreditorDecision && <section className="sd-main sd-offer-main">
      <div className="sd-section-heading"><div><small>{isActor ? "PROPOSITION À EXAMINER" : "OFFRE EN ATTENTE"}</small><h1>{isActor ? `${nameOf(game.players, settlement.debtorId)} vous propose un règlement` : `Décision attendue de ${nameOf(game.players, settlement.decisionActorId)}`}</h1></div><span className="sd-frozen"><ShieldCheck size={14} /> COURS FIGÉS À LA PROPOSITION</span></div>
      {isActor ? <>
        <div className="sd-offer-card">
          <div className="sd-offer-assets"><small>PARTICIPATIONS TRANSFÉRÉES</small>{offerAssets.length ? offerAssets.map((asset: SettlementAsset) => <div key={asset.companyId}><span><Building2 size={15} /><b>{asset.companyName ?? game.companies.find(company => company.id === asset.companyId)?.name ?? asset.companyId}</b><small>{quantity(asset.quantity)} {asset.quantity > 1 ? "parts" : "part"} × {money(asset.perShare)}</small></span><strong>{money(asset.value)}</strong></div>) : <p>Aucune participation proposée.</p>}</div>
          <div className="sd-offer-math"><span>Dette à régler<b>{money(currentDebt)}</b></span><span>Valeur des participations<b>{money(offer?.value ?? 0)}</b></span><span className="sd-net">{Math.abs(offer?.cashDelta ?? 0) < 1e-9 ? "Aucun complément en cash" : creditorPays ? "Vous versez au débiteur" : "Le débiteur vous verse"}<b>{money(Math.abs(offer?.cashDelta ?? 0))}</b></span><small>{Math.abs(offer?.cashDelta ?? 0) < 1e-9 ? "Les parts couvrent exactement le montant à régler." : creditorPays ? "Vous recevez les parts et payez la différence." : "Vous recevez les parts et le complément en cash."}</small></div>
        </div>
        {creditorPays && !creditorCanPay && <p className="sd-cash-warning"><X size={15} /> Liquidités insuffisantes pour accepter cette proposition. Disponible : {money(cashAvailableForCreditor)} · requis : {money(Math.abs(offer?.cashDelta ?? 0))}.</p>}
        <footer className="sd-decision-footer"><div><small>SOLDE DE VOTRE TRÉSORERIE APRÈS ACCEPTATION</small><strong>{money(cashAvailableForCreditor + (offer?.cashDelta ?? 0))}</strong></div><div className="sd-actions"><button className="sd-secondary" type="button" disabled={!editable} onClick={() => onCommand({ type: "REJECT_SETTLEMENT" })}><X size={15} /> Refuser</button><button className="sd-secondary" type="button" disabled={!editable} onClick={() => onCommand({ type: "REQUIRE_CASH" })}><BadgeEuro size={15} /> Exiger du cash</button><button className="sd-primary" type="button" disabled={!editable || !creditorCanPay} onClick={() => onCommand({ type: "ACCEPT_SETTLEMENT" })}><Check size={15} /> {creditorPays ? `Accepter et payer ${money(Math.abs(offer?.cashDelta ?? 0))}` : "Accepter le règlement"}</button></div></footer>
      </> : <div className="sd-waiting"><Clock3 size={20} /><span>L’offre reste en attente jusqu’à la décision de <b>{nameOf(game.players, settlement.decisionActorId)}</b>.</span></div>}
    </section>}

    {!editable && <aside className="sd-handoff"><Clock3 size={14} />{actor ? <>Décision en cours chez <b>{actor.name}</b>. Le desk attend son action.</> : "En attente de la décision du fonds concerné."}</aside>}
  </main>;
}
