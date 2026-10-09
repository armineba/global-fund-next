import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Dice5, Globe2, Cpu, Landmark, Factory, HeartPulse, Flame, Building2, Leaf, Radio, Plane, X, BriefcaseBusiness, ChartNoAxesCombined, MessageSquare, Maximize2, Shield, Crown, BarChart3, Network } from "lucide-react";
import type { GameCommand, GameNotice, GameView, Grade, RoomView } from "@global-fund/shared";
import { formatMoney } from "@global-fund/ui";
import { command, useGameStore } from "../store";
import { playCue, unlockAudio } from "../presentation/audio";
import { usePresentationSettings } from "../presentation/settings";
import AnimatedMoney from "../presentation/AnimatedMoney";
import { useDialogFocus } from "../presentation/useDialogFocus";
import CardScene from "../presentation/CardScene";
import { useGamePresentation } from "../presentation/useGamePresentation";
import type { PresentationStage } from "../presentation/sequence";
import Pawn from "./Pawn";
import Chat from "./Chat";
import Geography from "./Geography";
import OfficeEnvironment from "./OfficeEnvironment";
import SettlementDesk from "./SettlementDesk";
import { FinancialTicker } from "./FinancialTicker";
import { playerOfficeMarket, marketPlaceVisuals } from "./marketPlaceVisuals";
import "./impact-ribbon.css";
const BoardScene = lazy(() => import("../board/BoardScene"));
const TradingDesk = lazy(() => import("../trading/TradingDesk"));
type Terminal = "market" | "portfolio" | "analysis" | "statistics";
const sectorIcons: Record<string, typeof Globe2> = { technology: Cpu, finance: Landmark, industry: Factory, health: HeartPulse, energy: Flame, realestate: Building2, agrifood: Leaf, media: Radio, transport: Plane };
const gradeLabels: Record<Grade, string> = { A: "Très favorable", B: "Favorable", C: "Neutre", D: "Dégradé", E: "Critique" };

function stageLabel(stage: PresentationStage) {
  const labels: Partial<Record<PresentationStage, string>> = { BOARD_FOCUS: "Au centre des marchés", DICE_ROLLING: "Le dé est lancé", DICE_RESULT: "Résultat du dé", PAWN_MOVING: "Sur le circuit des marchés", PAWN_ARRIVAL: "Arrivée sur la case", SPACE_REVEAL: "La case se révèle", CARD_READING: "Prenez le temps de lire", CARD_DISMISS: "La séance reprend", MARKET_IMPACT: "Les cours s’ajustent", TRAVEL_RESOLUTION: "Vol international en cours" };
  return labels[stage] ?? "Résolution de la séance";
}

function ConsequenceRibbon({ game, notice, gradeImpact, awaitingMarketConfirmation, onContinue }: { game: GameView; notice: GameNotice; gradeImpact: import("@global-fund/shared").GradeChange | null; awaitingMarketConfirmation: boolean; onContinue: () => void }) {
  const company = notice.companyImpacts?.find(c => c.beforePrice !== c.afterPrice);
  return <div className={`consequence-ribbon ${awaitingMarketConfirmation ? "major-consequence" : ""}`} role="status" data-impact-notice={notice.id} data-awaiting-market-confirmation={awaitingMarketConfirmation}>
    <span className="eyebrow">Les cours s’ajustent · {notice.title ?? notice.cell?.label}</span>
    {gradeImpact ? <strong key={`${gradeImpact.scope}-${gradeImpact.id}`}>{(gradeImpact.scope === "zone" ? game.zones : game.sectors).find(x => x.id === gradeImpact.id)?.name} <span>{gradeImpact.before} → {gradeImpact.after}</span></strong>
      : <strong>{company ? <>{company.companyName} <span>{formatMoney(company.beforePrice)} → {formatMoney(company.afterPrice)}</span></> : "Nouvelles conditions de marché"}</strong>}
    {awaitingMarketConfirmation && <button type="button" className="gold-button impact-continue" onClick={onContinue}>Valider les cours <ArrowRight size={15} /></button>}
  </div>;
}

function Rating({ value, name }: { value: Grade; name: string }) {
  const level = 5 - "ABCDE".indexOf(value);
  return <span className={`rating-instrument rating-${value}`} key={value} title={`${name} : ${value} — ${gradeLabels[value]}`} aria-label={`${name} : ${value}, ${gradeLabels[value]}`}>
    <b>{value}</b><span className="rating-ladder" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < level ? "lit" : ""} />)}</span>
  </span>;
}
function TerminalWindow({ game, viewerId, canAct, tab, browseZone, onBrowseZone, onCommand, onClose }: {
  game: GameView; viewerId: string; canAct: boolean; tab: Terminal; browseZone: string; onBrowseZone: (id: string) => void; onCommand: (c: GameCommand) => void; onClose: () => void;
}) {
  const focus = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    focus.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector('[aria-modal="true"]')) { event.preventDefault(); close.current(); }
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="terminal-backdrop" role="dialog" aria-modal="false" aria-label="Terminal de trading">
    <section className="floating-terminal" ref={focus} tabIndex={-1}>
      <Suspense fallback={<div className="world-loading">Connexion aux places de marché…</div>}><TradingDesk game={game} viewerId={viewerId} canAct={canAct} onCommand={onCommand} initialTab={tab} browseZone={browseZone} onBrowseZoneChange={onBrowseZone} onClose={onClose} onReturnTravel={onClose} onEndTurn={() => { onCommand({ type: "END_TURN" }); onClose(); }} /></Suspense>
    </section>
  </div>;
}

type Receipt = { id: number; title: string; name: string; detail: string; amount: number; kind: "buy" | "sell" | "control" | "monopoly" | "cash" };
/** Feed-back construit à partir de deux snapshots confirmés, jamais à partir du clic. */
function useFinancialFeedback(game: GameView, revision: number) {
  const before = useRef(game);
  const sequence = useRef(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  useEffect(() => {
    const previous = before.current;
    before.current = game;
    if (previous === game) return;
    let next: Receipt | null = null;
    for (const player of game.players) {
      const old = previous.players.find(p => p.id === player.id);
      if (!old) continue;
      for (const company of game.companies) {
        const prior = previous.companies.find(c => c.id === company.id);
        if (!prior || !prior.available || !company.available) continue;
        const held = company.holdings[player.id] ?? 0;
        const delta = held - (prior.holdings[player.id] ?? 0);
        if (!delta) continue;
        // Une carte montre elle-même ses ventes forcées et liquidations.
        if (game.notices.some(n => n.id > previous.noticeSeq)) continue;
        const group = game.companies.filter(c => c.zone === company.zone && c.sector === company.sector);
        const monopoly = held === 5 && group.every(c => c.holdings[player.id] === 5);
        next = { id: ++sequence.current, title: monopoly ? "MONOPOLE CONSTITUÉ" : held === 5 && delta > 0 ? "CONTRÔLE TOTAL" : delta > 0 ? "ACHAT VALIDÉ" : "VENTE VALIDÉE", name: company.name,
          detail: monopoly ? `${game.zones.find(z => z.id === company.zone)?.name} · ${game.sectors.find(s => s.id === company.sector)?.name} · revenu A/A` : held === 5 && delta > 0 ? "100 % du capital · revenu minimum C/C" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${Math.abs(delta) > 1 ? "parts" : "part"} · ${Math.abs(delta) * 20} % du capital · ${player.name}`,
          amount: player.cash - old.cash, kind: monopoly ? "monopoly" : held === 5 && delta > 0 ? "control" : delta > 0 ? "buy" : "sell" };
      }
    }
    if (next) { setReceipt(next); playCue(next.kind === "sell" ? "sell" : "buy"); }
  }, [game, revision]);
  useEffect(() => { if (!receipt) return; const timer = setTimeout(() => setReceipt(null), 3200); return () => clearTimeout(timer); }, [receipt?.id]);
  return receipt;
}

function wealthStage(value: number) {
  if (value < 50) return { id: "distressed", label: "Bureau en difficulté" };
  if (value < 500) return { id: "office", label: "Bureau d’investissement" };
  if (value < 1000) return { id: "desk", label: "Desk de trading" };
  if (value < 5000) return { id: "tower", label: "Bureau dans les hauteurs" };
  if (value < 10000) return { id: "floor", label: "Salle de marché mondiale" };
  if (value < 100000) return { id: "gold", label: "Empire financier" };
  return { id: "world", label: "Influence mondiale" };
}

function Victory({ game }: { game: GameView }) {
  const focus = useDialogFocus();
  useEffect(() => { playCue("victory"); }, []);
  return <div className="victory-stage" role="dialog" aria-modal="true" aria-labelledby="victory-title" ref={focus as React.RefObject<HTMLDivElement>} tabIndex={-1}><Crown size={56} /><span className="eyebrow">CLÔTURE DU PARQUET MONDIAL</span><h2 id="victory-title">{game.players.filter(p => game.winnerIds.includes(p.id)).map(p => p.name).join(" & ")}</h2><p>La première puissance financière de cette séance.</p><div>{[...game.players].sort((a, b) => b.fundValue - a.fundValue).map((p, i) => <p key={p.id}><span>0{i + 1}</span><Pawn id={p.pawn} /><b>{p.name}</b><strong>{formatMoney(p.fundValue)}</strong></p>)}</div><button className="gold-button" onClick={() => useGameStore.getState().reset()}>Nouvelle partie <ArrowRight size={18} /></button></div>;
}

function marketPresentation(notice: GameNotice | null): "context" | "event" | "bull" | "bear" | "crash" | null {
  if (!notice) return null;
  const title = `${notice.title ?? ""} ${notice.cell?.label ?? ""}`.toLowerCase();
  if (title.includes("crash")) return "crash";
  if (title.includes("bull")) return "bull";
  if (title.includes("bear")) return "bear";
  return notice.cardType === "context" ? "context" : notice.cardType === "event" ? "event" : null;
}

export default function GameWorld({ room }: { room: RoomView }) {
  const authoritativeGame = room.game!;
  const { session, connected, pending, queue, acknowledged, acknowledge } = useGameStore();
  const { reducedMotion, quality } = usePresentationSettings();
  const visual = useGamePresentation(room, acknowledged, acknowledge, reducedMotion);
  const game = visual.viewGame!;
  const active = game.players.find(p => p.id === game.activePlayerId)!;
  const slot = room.players.find(p => p.id === active.id)!;
  const { notice, currentCard: current, stage: presentationStage } = visual;
  const controls = !active.bot && (active.id === session?.playerId || (session?.playerId === room.hostId && slot.kind === "local"));
  const canAct = controls && connected && !pending && !visual.busy && !queue.length && authoritativeGame.phase !== "settlement";
  const settlement = authoritativeGame.pendingSettlement;
  const decisionId = settlement?.decisionActorId ?? active.id;
  const decisionSlot = room.players.find(p => p.id === decisionId);
  const decisionControls = !!decisionSlot && !decisionSlot.bot && (decisionId === session?.playerId || (session?.playerId === room.hostId && decisionSlot.kind === "local"));
  const canSettle = decisionControls && connected && !pending && !visual.busy && !queue.length;
  const [viewerId, setViewerId] = useState(session?.playerId ?? active.id);
  const [officeViewerId, setOfficeViewerId] = useState(session?.playerId ?? active.id);
  useEffect(() => {
    if (controls) setOfficeViewerId(active.id);
    else if (session?.playerId !== room.hostId && session?.playerId) setOfficeViewerId(session.playerId);
  }, [controls, active.id, session?.playerId, room.hostId]);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [lastReadMessage, setLastReadMessage] = useState<string | null>(room.messages.at(-1)?.id ?? null);
  const [geographyOpen, setGeographyOpen] = useState(true);
  const [destination, setDestination] = useState(active.zone ?? game.zones[0].id);
  const [browseZone, setBrowseZone] = useState(active.zone ?? game.zones[0].id);
  const [overview, setOverview] = useState(false);
  const [focusedZone, setFocusedZone] = useState<string | null>(null);
  const receipt = useFinancialFeedback(authoritativeGame, room.revision);
  useEffect(() => {
    setViewerId(controls ? active.id : session?.playerId ?? active.id);
    setTerminal(null);
    setOverview(false);
    setFocusedZone(null);
    setDestination(active.zone ?? game.zones[0].id);
    setBrowseZone(active.zone ?? game.zones[0].id);
    setGeographyOpen(true);
  }, [active.id, controls, session?.playerId]);
  useEffect(() => {
    if (!visual.busy && authoritativeGame.phase === "market" && controls) setTerminal("market");
    if (visual.busy) setTerminal(null);
    if (!visual.busy && authoritativeGame.phase === "geography") setGeographyOpen(true);
  }, [authoritativeGame.phase, visual.busy, active.id, controls]);
  useEffect(() => { if (chatOpen) setLastReadMessage(room.messages.at(-1)?.id ?? null); }, [chatOpen, room.messages]);
  const lastReadIndex = room.messages.findIndex(m => m.id === lastReadMessage);
  const unreadMessages = chatOpen ? 0 : room.messages.length - (lastReadIndex + 1);
  const viewer = game.players.find(p => p.id === viewerId) ?? active;
  const holdings = game.companies.filter(c => (c.holdings[viewerId] ?? 0) > 0);
  const controlled = holdings.filter(c => c.holdings[viewerId] === 5);
  const officePlayer = visual.boardGame!.players.find(p => p.id === officeViewerId) ?? game.players.find(p => p.id === session?.playerId) ?? active;
  const officeMarket = playerOfficeMarket(officePlayer);
  const stage = wealthStage((game.players.find(p => p.id === officePlayer.id) ?? officePlayer).fundValue);
  const phaseTitle = game.phase === "settlement" ? "Règlement en cours" : game.phase === "geography" ? "Choisir son marché" : game.phase === "sector" ? "Le circuit des marchés" : game.phase === "market" ? "Composer son portefeuille" : game.phase === "finished" ? "Clôture de la séance" : "Passage de relais";
  const zoneName = (id: string | null) => game.zones.find(z => z.id === id)?.name ?? "Place de marché";
  const send = (c: GameCommand) => { if (!canAct) return; void unlockAudio(); playCue("ui_click"); void command(c, active.id); };
  const sendSettlement = (c: GameCommand) => { if (!canSettle) return; void unlockAudio(); playCue("ui_click"); void command(c, decisionId); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (e.target instanceof Element && e.target.closest("input,select,textarea,a,summary,.floating-terminal,.world-chat") || document.querySelector('[aria-modal="true"]')) return;
      if (e.key === " " && e.target instanceof Element && e.target.closest("button")) return;
      if (e.key.toLowerCase() === "p") { setTerminal("portfolio"); playCue("ui_click"); }
      if (e.key.toLowerCase() === "m") { setTerminal("market"); playCue("ui_click"); }
      if (e.key === " " && game.phase === "sector" && canAct) { e.preventDefault(); send({ type: "ROLL" }); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [game.phase, canAct, active.id]);
  // Commandes interdites côté présentation pendant une scène ; le serveur vérifie aussi.
  const presentation = presentationStage === "MARKET_IMPACT" ? marketPresentation(notice) : null;
  useEffect(() => {
    if (presentationStage === "MARKET_IMPACT") {
      if (visual.gradeImpact) playCue("ABCDE".indexOf(visual.gradeImpact.after) < "ABCDE".indexOf(visual.gradeImpact.before) ? "market-up" : "market-down");
      else if (presentation === "bull" || presentation === "bear" || presentation === "crash") playCue(presentation);
    }
    if (presentationStage === "CARD_DISMISS") playCue("confirm");
    if (presentationStage === "DICE_RESULT") playCue("confirm");
    if (presentationStage === "CARD_DISMISS") {
      const delta = notice?.playerImpacts?.find(p => p.playerId === active.id)?.cash ?? 0;
      if (delta) playCue(delta > 0 ? "money_gain" : "loss");
      if (notice?.playerImpacts?.some(p => p.prison === true)) playCue("prison");
    }
  }, [presentationStage, visual.gradeImpact?.id, visual.gradeImpact?.after, notice?.id]);
  return <main className={`game-world wealth-${stage.id} ${reducedMotion ? "motion-reduced" : ""} ${active.jailed ? "world-detained" : ""}`} data-quality={quality} data-presentation-stage={presentationStage} data-effects-started={presentationStage === "MARKET_IMPACT"}>
    <OfficeEnvironment market={officeMarket} playerId={officePlayer.id} travelling={presentationStage === "TRAVEL_RESOLUTION"} reducedMotion={reducedMotion} /><div className="room-vignette" aria-hidden="true" />
    <div className="world-status">
      <span className="cycle-plate"><span>CYCLE</span><b>{String(game.cycle).padStart(2, "0")}</b><small>/ 101</small></span>
      <div><span className="eyebrow">{game.cycle === 1 ? "OUVERTURE À C/C" : `${100 - game.contextsRemaining} / 100 CONTEXTES`}</span><h1>{phaseTitle}</h1></div>
      <div className="session-instrument"><i /> SALON {room.roomId}<span>{marketPlaceVisuals[officeMarket].city} · {stage.label}</span></div>
    </div>
    <section className="world-ratings" aria-label="Notations économiques">
      <div className="world-sectors">{game.sectors.map(s => { const Icon = sectorIcons[s.id] ?? Globe2; return <div className="economic-tile" key={s.id}><Icon size={20} /><span>{s.name.split("&")[0]}</span><Rating name={s.name} value={game.sectorGrades[s.id]} /></div>; })}</div>
      <div className="world-zones">{game.zones.map(z => <button key={z.id} className={`economic-zone ${active.zone === z.id ? "zone-selected" : ""}`} onClick={() => { setOverview(false); setFocusedZone(focusedZone === z.id ? null : z.id); }} aria-pressed={focusedZone === z.id} title={`${z.name} — ${gradeLabels[game.zoneGrades[z.id]]}`}><Globe2 size={16} /><span>{z.name}</span><Rating name={z.name} value={game.zoneGrades[z.id]} /></button>)}</div>
    </section>
    <div className="board-world" aria-label="Plateau mondial">
      <Suspense fallback={<div className="world-loading"><Globe2 /><span>Installation de la table des marchés…</span></div>}>
        <BoardScene game={visual.boardGame!} timeline={visual.timeline} onRoll={() => send({ type: "ROLL" })} disabled={!canAct || game.phase !== "sector"} reducedMotion={reducedMotion} quality={quality} focusZone={overview ? null : focusedZone ?? (terminal ? browseZone : undefined)} overview={overview} presentation={presentation} />
      </Suspense>
    </div>
    <div className="board-coordinate"><span>52 SEMAINES / 91 ENTREPRISES</span><button className="hud-icon" aria-label="Vue globale du plateau" onClick={() => { setOverview(!overview); setFocusedZone(null); }} aria-pressed={overview}><Maximize2 size={14} /></button></div>
    <aside className="command-console">
      <div className="active-fund"><span className="eyebrow"><i /> AU TOUR DE</span><Pawn id={active.pawn} color={active.color} /><h2>{active.name}</h2><p>{active.bot ? "IA en réflexion…" : controls ? "Vous avez la main" : "Un autre fonds a la main"}</p></div>
      <div className="turn-sequence" aria-label="Séquence du tour">
        {[{ phase: "geography", label: "Implantation" }, { phase: "sector", label: "Dé & case" }, { phase: "market", label: "Trading" }].map((step, index) => <span key={step.phase} className={game.phase === step.phase ? "is-current" : ""} aria-current={game.phase === step.phase ? "step" : undefined}><b>0{index + 1}</b>{step.label}</span>)}
      </div>
      <div className="active-location"><Globe2 size={14} /><span>{zoneName(active.zone)}<small>SEMAINE {String(active.sectorPosition + 1).padStart(2, "0")}</small></span>{active.jailed && <Shield size={18} />}</div>
      <div className="turn-actions">
        {visual.busy ? <div className="world-resolution" role="status"><span className="resolution-orbit" /><b>{stageLabel(presentationStage)}</b><small>{notice?.title ?? "Résolution de la séance"}</small>{current && terminal && <button className="outline-button" onClick={() => setTerminal(null)}>Lire la carte</button>}</div> : game.phase === "sector" ? <button className="gold-button action-dice" disabled={!canAct} onClick={() => send({ type: "ROLL" })}><Dice5 size={27} /><span>Lancer le dé<small>ENTRÉE SUR LE CIRCUIT</small></span><span className="keycap">␣</span></button> : game.phase === "market" ? <><button className="gold-button" onClick={() => setTerminal("market")}><ChartNoAxesCombined size={18} /> Négocier</button>{!terminal && <button className="outline-button" disabled={!canAct} onClick={() => send({ type: "END_TURN" })}>Terminer le marché <Check size={18} /></button>}</> : game.phase === "awaitNext" ? <button className="gold-button" disabled={!canAct} onClick={() => send({ type: "NEXT_TURN" })}>Prochain investisseur <ArrowRight size={18} /></button> : game.phase === "geography" ? <button className="gold-button action-travel" disabled={!canAct} onClick={() => { setTerminal(null); setGeographyOpen(true); }}><Plane size={18} /> Choisir son marché</button> : <p>Implantation avant le dé</p>}
      </div>
      <div className="console-fund"><small>VALEUR DU FONDS ACTIF</small><strong><AnimatedMoney value={active.fundValue} /></strong><span>Liquidités <b><AnimatedMoney value={active.cash} /></b></span></div>
      {active.jailed && <div className="detention-instrument"><Shield size={18} /><b>SOUS CONTRÔLE JUDICIAIRE</b><p>Trading et revenus suspendus. Procès à votre prochain tour ; sortie forcée à la 3e tentative : 5 M€.</p></div>}
      <div className="world-wire"><span><Radio size={11} /> FIL FINANCIER</span><p>{visual.busy ? stageLabel(presentationStage) : game.log.at(-1)}</p></div>
    </aside>
    <section className="fund-dock" aria-label="Fonds à la table">{game.players.map((p, i) => <button key={p.id} className={`investor-card dock-fund ${p.id === active.id ? "is-active" : ""} ${p.id === viewerId ? "inspecting" : ""} ${!p.solvent ? "insolvent" : ""}`} onClick={() => setViewerId(p.id)} style={{ "--player-color": p.color } as CSSProperties} title={`Inspecter ${p.name}`}><span className="dock-number">0{i + 1}</span><Pawn id={p.pawn} color={p.color} /><span className="dock-identity"><b>{p.name}</b><small>{p.jailed ? "Justice · échanges suspendus" : zoneName(p.currentMarket ?? p.zone)} {p.bot ? "· IA" : "· Humain"}{!p.solvent ? " · Insolvable" : ""}</small></span><span className="investor-finances"><span>Liquidités<b><AnimatedMoney value={p.cash} /></b></span><span>Valeur du fonds<strong><AnimatedMoney value={p.fundValue} /></strong></span></span>{p.id === active.id && <i className="active-beacon" />}</button>)}</section>
    <nav className="world-tools" aria-label="Consoles du fonds"><div className="selected-fund"><span>{viewer.name}</span><b>{holdings.length} participations</b>{controlled.length > 0 && <span className="control-summary"><Crown size={13} />{controlled.length} × 100 % · C/C</span>}</div><button aria-pressed={terminal === "portfolio"} onClick={() => { setTerminal("portfolio"); playCue("ui_click"); }}><BriefcaseBusiness size={17} /> Portefeuille <kbd>P</kbd></button><button aria-pressed={terminal === "market"} onClick={() => { setTerminal("market"); playCue("ui_click"); }}><ChartNoAxesCombined size={17} /> Marché <kbd>M</kbd></button><button aria-pressed={terminal === "analysis"} onClick={() => setTerminal("analysis")}><Globe2 size={16} /> Analyse</button><button aria-pressed={terminal === "statistics"} onClick={() => setTerminal("statistics")}><BarChart3 size={16} /> Statistiques</button><button aria-pressed={chatOpen} onClick={() => setChatOpen(!chatOpen)}><MessageSquare size={16} /> Salon{unreadMessages > 0 && <b aria-label={`${unreadMessages} nouveaux messages`}>{unreadMessages}</b>}</button></nav>
    <FinancialTicker companies={game.companies} history={game.marketHistory} />
    {receipt && <div className={`trade-receipt receipt-${receipt.kind}`} key={receipt.id} role="status"><span className="receipt-emblem">{receipt.kind === "control" ? <Crown /> : receipt.kind === "monopoly" ? <Network /> : <Check />}</span><div><span>{receipt.title}</span><h2>{receipt.name}</h2><p>{receipt.detail}</p></div><strong className={receipt.amount < 0 ? "negative" : "positive"}>{receipt.amount > 0 ? "+" : ""}{formatMoney(receipt.amount)}</strong></div>}
    {chatOpen && <aside className="world-chat"><div className="terminal-chrome"><span>SALON PRIVÉ {room.roomId}</span><button className="hud-icon" aria-label="Fermer le chat" onClick={() => setChatOpen(false)}><X size={15} /></button></div><Chat room={room} /></aside>}
    {terminal && <TerminalWindow key={`${viewerId}-${terminal}`} game={game} viewerId={viewerId} canAct={canAct && viewerId === active.id} tab={terminal} browseZone={browseZone} onBrowseZone={setBrowseZone} onCommand={send} onClose={() => { setTerminal(null); setGeographyOpen(true); }} />}
    {!terminal && geographyOpen && canAct && game.phase === "geography" && <Geography game={game} destination={destination} onDestination={setDestination} onAnalyse={id => { setBrowseZone(id); setTerminal("market"); }} onCommand={send} onClose={() => setGeographyOpen(false)} />}
    {current && !terminal && <CardScene embedded notice={current} game={authoritativeGame} onClose={visual.continueCard} />}
    {settlement && !visual.busy && <SettlementDesk key={`${settlement.id}-${settlement.debtorId}-${settlement.creditorId ?? "bank"}-${settlement.completed.length}-${settlement.status}-${settlement.marketSales?.length ?? 0}`} game={authoritativeGame} settlement={settlement} viewerId={decisionControls ? decisionId : session?.playerId ?? viewerId} canAct={canSettle} onCommand={sendSettlement} />}
    {visual.busy && !current && presentationStage === "MARKET_IMPACT" && <ConsequenceRibbon game={game} notice={notice!} gradeImpact={visual.gradeImpact} awaitingMarketConfirmation={visual.awaitingMarketConfirmation} onContinue={visual.continueImpact} />}
    {game.finished && !visual.busy && <Victory game={game} />}
  </main>;
}
