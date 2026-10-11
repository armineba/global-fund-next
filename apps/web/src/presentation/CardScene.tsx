import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode, type UIEvent } from "react";
import type { Company, GameNotice, GameView, GradeChange, PlayerImpact } from "@global-fund/shared";
import { Gavel, Globe2, Landmark, Lock, LockOpen, Plane, Scale, TrendingDown, TrendingUp, Zap } from "lucide-react";
import Pawn from "../game/Pawn";
import { GradeShift } from "../ui/GradeJewel";
import { SectorIcon } from "../ui/SectorIcon";
import { money, signedMoney, signedPercent, tone } from "../ui/format";
import { GRADE_META, gradeDelta, sectorMeta } from "../ui/theme";
import { playCue } from "./audio";
import "./CardScene.css";
import { usePresentationSettings } from "./settings";
import { useDialogFocus } from "./useDialogFocus";

/**
 * Cards drawn from the deck: context, GF Financial Chronicle, market moves,
 * justice and settlement receipts. Presentation only: every figure comes from
 * the notice and the authoritative game view.
 */
type Props = { notice: GameNotice; game: GameView; onClose: () => void; embedded?: boolean };
type MarketEvent = "bull" | "bear" | "crash";
type EventFamily = "justice" | "regulation" | "premium" | "finance";
type Family = "context" | "chronicle" | "justice" | "ledger" | MarketEvent;
type CompanyImpacts = NonNullable<GameNotice["companyImpacts"]>;

const FAMILY_LABEL: Record<EventFamily, string> = {
  justice: "Justice & enquête",
  regulation: "Régulation",
  premium: "Prime & dividende",
  finance: "Finance & entreprises",
};
const MARKET_LABEL: Record<MarketEvent, string> = { bull: "Marché haussier", bear: "Marché baissier", crash: "Krach boursier" };
const REGULATION_CARDS = ["board-13", "board-14", "board-15", "board-16"];
const PREMIUM_CARDS = ["board-02", "board-05", "board-08", "board-17", "board-28", "board-30", "board-32", "board-34"];
const DETENTION_LINE = "Détention : échanges suspendus, dé de procès à chaque tour, sortie à 5 M€ au 3e essai.";
const DETENTION_RULE = "En détention, le fonds passe ses échanges tant qu’il y reste. À son prochain tour, il lance le dé pour tenter de sortir ; après trois tentatives, la sortie coûte 5 M€.";
const CAPITAL_HINT = "La performance mesure l’évolution du portefeuille hors apports et retraits. Le flux ajuste la trésorerie de l’investisseur.";

const percent2 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const signedPercent2 = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${percent2.format(Math.abs(value))} %`;
const useSafeId = () => `cs${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

/** First sentences of a story, with a flag when the full text says more. */
function summarizeStory(story: string, limit = 2) {
  const sentences = (story.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [story]).map((sentence) => sentence.trim()).filter(Boolean);
  let text = sentences.slice(0, limit).join(" ");
  let truncated = sentences.length > limit;
  if (text.length > 260) {
    text = `${text.slice(0, text.lastIndexOf(" ", 257)).trimEnd()}…`;
    truncated = true;
  }
  return { text, truncated };
}

const companyLogo = (company: Company) => (typeof company.logoPath === "string" && company.logoPath ? company.logoPath : undefined);
function monogram(name: string) {
  const words = name.replace(/[^\p{L}\p{N}&\s-]/gu, " ").split(/\s+/).filter(Boolean);
  const first = words[0] ?? "?";
  if (/^[\p{Lu}\p{N}&]{2,4}$/u.test(first)) return first.slice(0, 3);
  return `${first[0] ?? ""}${words[1]?.[0] ?? first[1] ?? ""}`.toLocaleUpperCase("fr-FR");
}
const gradeName = (game: GameView, change: GradeChange) =>
  (change.scope === "zone" ? game.zones : game.sectors).find((entry) => entry.id === change.id)?.name ?? sectorMeta(change.id)?.label ?? change.id;

/** One-line reading of a market space: how many indices moved, and which way. */
function marketDek(changes: GradeChange[]) {
  if (!changes.length) return "Les notations restent inchangées.";
  const zone = changes[0]!.scope === "zone";
  const noun = (count: number) => (zone ? (count > 1 ? "zones" : "zone") : count > 1 ? "secteurs" : "secteur");
  const up = changes.filter((change) => gradeDelta(change.before, change.after) > 0).length;
  const down = changes.filter((change) => gradeDelta(change.before, change.after) < 0).length;
  const total = changes.length;
  const share = (count: number) => (count === total ? `Les ${total} ${noun(total)}` : `${count} ${noun(count)} sur ${total}`);
  if (up && !down) return `${share(up)} ${up > 1 ? "progressent" : "progresse"}.`;
  if (down && !up) return `${share(down)} ${down > 1 ? "reculent" : "recule"}.`;
  if (!up && !down) return `Les ${total} ${noun(total)} restent stables.`;
  return `${up} en hausse, ${down} en baisse.`;
}

/* ------------------------------------------------------------ engraving -- */
function ringPath(radius: number, amplitude: number, lobes: number, steps = 420) {
  let d = "";
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius + amplitude * Math.sin(lobes * t);
    d += `${i ? "L" : "M"}${(100 + r * Math.cos(t)).toFixed(2)} ${(100 + r * Math.sin(t)).toFixed(2)}`;
  }
  return `${d}Z`;
}
const OUTER_LOBES = 12;
const INNER_LOBES = 9;
const ROSETTE_OUTER = ringPath(74, 11, OUTER_LOBES);
const ROSETTE_INNER = ringPath(51, 7, INNER_LOBES);
/** Evenly interleaved copies of a lobed ring (one lobe period split in `copies`). */
const ringTurns = (lobes: number, copies: number) => Array.from({ length: copies }, (_, k) => ((k * 360) / lobes / copies).toFixed(2));

/** Banknote rosette (guilloché) engraved with the GF monogram. */
function Rosette() {
  const id = useSafeId();
  return (
    <span className="cs-emblem cs-rosette" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <defs>
          <path id={`${id}-o`} d={ROSETTE_OUTER} />
          <path id={`${id}-i`} d={ROSETTE_INNER} />
        </defs>
        <circle cx="100" cy="100" r="98" className="cs-emblem-disc" />
        <circle cx="100" cy="100" r="97" className="cs-line" />
        <circle cx="100" cy="100" r="92" className="cs-line is-faint" />
        <g className="cs-rosette-band">{ringTurns(OUTER_LOBES, 6).map((turn) => <use key={turn} href={`#${id}-o`} transform={`rotate(${turn} 100 100)`} />)}</g>
        <g className="cs-rosette-band is-inner">{ringTurns(INNER_LOBES, 5).map((turn) => <use key={turn} href={`#${id}-i`} transform={`rotate(${turn} 100 100)`} />)}</g>
        <circle cx="100" cy="100" r="35" className="cs-emblem-core" />
        <circle cx="100" cy="100" r="30" className="cs-line is-faint" />
        <text x="100" y="111" textAnchor="middle" className="cs-rosette-mark">GF</text>
      </svg>
    </span>
  );
}

/** Large faint rosette printed behind the context header, like banknote security printing. */
function Watermark() {
  const id = useSafeId();
  return (
    <span className="cs-hero-art" aria-hidden="true">
      <svg className="cs-watermark" viewBox="0 0 200 200">
        <defs><path id={`${id}-w`} d={ROSETTE_OUTER} /><path id={`${id}-v`} d={ROSETTE_INNER} /></defs>
        {ringTurns(OUTER_LOBES, 10).map((turn) => <use key={`o${turn}`} href={`#${id}-w`} transform={`rotate(${turn} 100 100)`} />)}
        {ringTurns(INNER_LOBES, 8).map((turn) => <use key={`i${turn}`} href={`#${id}-v`} transform={`rotate(${turn} 100 100)`} />)}
      </svg>
    </span>
  );
}

/** Round seal with engraved ring text and a central glyph. */
function Seal({ ring, children, className = "" }: { ring: string; children: ReactNode; className?: string }) {
  const id = useSafeId();
  return (
    <span className={`cs-emblem cs-seal ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs><path id={`${id}-r`} d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" /></defs>
        <circle cx="60" cy="60" r="58.5" className="cs-emblem-disc" />
        <circle cx="60" cy="60" r="57.5" className="cs-line" />
        <circle cx="60" cy="60" r="54" className="cs-line is-faint" />
        <circle cx="60" cy="60" r="37" className="cs-emblem-core" />
        <circle cx="60" cy="60" r="37" className="cs-line" />
        <text className="cs-seal-ring"><textPath href={`#${id}-r`} textLength="280" lengthAdjust="spacing">{ring}</textPath></text>
      </svg>
      <span className="cs-seal-icon">{children}</span>
    </span>
  );
}

function chartPaths(kind: MarketEvent, seed: number) {
  let state = (Math.imul(seed + 1, 2654435761) >>> 0) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  const width = 1000;
  const height = 160;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= 56; i += 1) {
    const t = i / 56;
    const base = kind === "bull" ? 0.84 - 0.66 * t ** 1.4
      : kind === "bear" ? 0.2 + 0.58 * t ** 1.1
        : t < 0.6 ? 0.24 + 0.05 * Math.sin(t * 19) : t < 0.74 ? 0.26 + 0.66 * ((t - 0.6) / 0.14) ** 0.8 : 0.9 - 0.12 * Math.sin((t - 0.74) * 9);
    const cliff = kind === "crash" && t > 0.6 && t < 0.74;
    const y = Math.min(0.97, Math.max(0.04, base + (random() - 0.5) * (cliff ? 0.02 : 0.085)));
    points.push([t * width, y * height]);
  }
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  return { line, area: `${line}L${width} ${height}L0 ${height}Z` };
}

/** Market line drawn once across the card header. */
function MarketChart({ kind, seed }: { kind: MarketEvent; seed: number }) {
  const id = useSafeId();
  const { line, area } = useMemo(() => chartPaths(kind, seed), [kind, seed]);
  return (
    <span className="cs-chart" aria-hidden="true">
    <svg viewBox="0 0 1000 160" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="cs-chart-stop-a" />
          <stop offset="1" className="cs-chart-stop-b" />
        </linearGradient>
      </defs>
      <g className="cs-chart-grid">{[40, 80, 120].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} />)}</g>
      <path d={area} className="cs-chart-area" fill={`url(#${id}-a)`} />
      <path d={line} className="cs-chart-line" pathLength={1} />
    </svg>
    </span>
  );
}

/* ----------------------------------------------------------- data rows -- */
function GradeRow({ change, game, compact = false }: { change: GradeChange; game: GameView; compact?: boolean }) {
  const full = gradeName(game, change);
  const name = compact && change.scope === "sector" ? sectorMeta(change.id)?.label ?? full : full;
  const delta = gradeDelta(change.before, change.after);
  const color = change.scope === "sector" ? sectorMeta(change.id)?.color : undefined;
  return (
    <div
      className={`cs-grade-row ${delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat"} ${compact ? "is-compact" : ""}`}
      title={`${full} : ${GRADE_META[change.before].label} → ${GRADE_META[change.after].label}`}
      style={color ? ({ "--row-color": color } as CSSProperties) : undefined}
    >
      <span className="cs-grade-icon" aria-hidden="true">{change.scope === "zone" ? <Globe2 size={15} strokeWidth={1.6} /> : <SectorIcon id={change.id} size={15} />}</span>
      <span className="cs-grade-name">
        {!compact && <small className="cs-scope">{change.scope === "zone" ? "Zone" : "Secteur"}</small>}
        <strong>{name}</strong>
      </span>
      <GradeShift before={change.before} after={change.after} label={full} />
    </div>
  );
}

/** Funds actually touched: value change, cash when it tells something else, detention. */
function FundImpacts({ impacts, game }: { impacts: PlayerImpact[]; game: GameView }) {
  const touched = impacts.filter((impact) => impact.cash !== 0 || impact.valuation !== 0 || impact.prison === true);
  if (!touched.length) return <p className="cs-empty">Aucun portefeuille touché.</p>;
  return (
    <>
      <div className="cs-fund-list">
        {touched.map((impact) => {
          const fund = game.players.find((player) => player.id === impact.playerId);
          return (
            <div className="cs-fund" key={impact.playerId} style={fund ? ({ "--seat": fund.color } as CSSProperties) : undefined}>
              {fund ? <Pawn id={fund.pawn} color={fund.color} size={30} /> : <span className="cs-fund-dot" aria-hidden="true" />}
              <span className="cs-fund-name">{impact.playerName}</span>
              {impact.valuation !== 0 && <strong className={`cs-fund-value ${tone(impact.valuation)}`} title="Variation de la valeur du fonds">{signedMoney(impact.valuation)}</strong>}
              {impact.cash !== 0 && impact.cash !== impact.valuation && <span className="cs-fund-note">Trésorerie <b className={tone(impact.cash)}>{signedMoney(impact.cash)}</b></span>}
              {impact.prison === true && <span className="cs-fund-flag" title="Placé en détention à la fermeture de la carte"><Lock size={11} strokeWidth={2} aria-hidden="true" /> Détention</span>}
            </div>
          );
        })}
      </div>
      {touched.length < impacts.length && <p className="cs-empty">Aucun autre fonds concerné.</p>}
    </>
  );
}

function CompanyMark({ company }: { company: Company }) {
  const [failed, setFailed] = useState(false);
  const logo = companyLogo(company);
  if (logo && !failed) {
    return <span className="cs-company-mark"><img src={logo} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} /></span>;
  }
  return <span className="cs-company-mark is-monogram" aria-hidden="true">{monogram(company.name)}</span>;
}

function CompanyRail({ companies, impacts, leadId }: { companies: Company[]; impacts?: CompanyImpacts; leadId?: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { reducedMotion } = usePresentationSettings();
  const impactById = useMemo(() => new Map((impacts ?? []).map((impact) => [impact.companyId, impact])), [impacts]);
  // Biggest movers first (failures, then the largest relative change); the set itself is unchanged.
  const ordered = useMemo(() => {
    const weight = (company: Company) => {
      const impact = impactById.get(company.id);
      if (!impact) return -1;
      if (impact.bankruptcy || impact.returned) return Number.MAX_SAFE_INTEGER;
      const move = Math.abs(impact.afterPrice - impact.beforePrice);
      return impact.beforePrice > 0 ? move / impact.beforePrice : move;
    };
    return companies
      .map((company, index) => ({ company, index, lead: company.id === leadId, weight: weight(company) }))
      .sort((a, b) => Number(b.lead) - Number(a.lead) || b.weight - a.weight || a.index - b.index)
      .map((entry) => entry.company);
  }, [companies, impactById, leadId]);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0 || (event.deltaY < 0 && el.scrollLeft <= 0) || (event.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY, behavior: reducedMotion ? "instant" : "smooth" });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [companies.length, reducedMotion]);
  if (!companies.length) return null;
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const cards = Array.from(el.children) as HTMLElement[];
    const index = cards.reduce((best, card, i) =>
      Math.abs(card.offsetLeft - el.scrollLeft) < Math.abs((cards[best]?.offsetLeft ?? 0) - el.scrollLeft) ? i : best, 0);
    setActive(index);
  };
  return (
    <section className="cs-companies cs-reveal" aria-label="Entreprises concernées">
      <div className="cs-rail-head">
        <h2 className="cs-label">Sociétés</h2>
        {companies.length > 1 && <span className="cs-counter">{active + 1} / {companies.length}</span>}
      </div>
      <div className="cs-rail" ref={rail} onScroll={onScroll} tabIndex={0} aria-label="Sociétés concernées, défilement horizontal">
        {ordered.map((company) => {
          const impact = impactById.get(company.id);
          const meta = sectorMeta(company.sector);
          const delta = impact ? impact.afterPrice - impact.beforePrice : 0;
          const deltaTone = tone(delta);
          return (
            <article className={`cs-company ${impact?.bankruptcy ? "is-liquidated" : impact?.returned ? "is-returned" : ""}`} key={company.id} style={meta ? ({ "--sector": meta.color } as CSSProperties) : undefined}>
              <div className="cs-company-head">
                <CompanyMark company={company} />
                <div className="cs-company-id">
                  <span className="cs-company-name" title={company.name}>{company.name}</span>
                  <span className="cs-company-sector"><SectorIcon id={company.sector} size={12} />{meta?.label ?? company.sector}</span>
                </div>
              </div>
              {(impact?.bankruptcy || impact?.returned) && <span className="cs-company-status">{impact.bankruptcy ? "Liquidée · faillite" : "Retour au marché"}</span>}
              <div className="cs-company-data">
                {impact ? (
                  <>
                    <span className="sr-only">Cours avant</span>
                    <strong className={`cs-price-before ${delta === 0 ? "sr-only" : ""}`}>{money(impact.beforePrice)}</strong>
                    {delta !== 0 && <span className="cs-price-arrow" aria-hidden="true">→</span>}
                    <span className="sr-only">Cours après</span>
                    <strong className={`cs-price-after ${deltaTone}`}>{money(impact.afterPrice)}</strong>
                    <span className={`cs-company-delta ${deltaTone}`}>
                      {delta === 0 ? "Cours inchangé" : `${signedMoney(delta)}${impact.beforePrice > 0 ? ` · ${signedPercent((delta / impact.beforePrice) * 100)}` : ""}`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="cs-price-label">{company.ticker || "Cours actuel"}</span>
                    <strong className="cs-price-after">{money(company.price)}</strong>
                  </>
                )}
                <span className="cs-company-income">Revenu / action <b>{money(company.income)}</b></span>
                {!!impact?.sharesChanged?.length && (
                  <span className="cs-company-holders">{impact.sharesChanged.map((holder) => `${holder.playerName} : ${holder.before} → ${holder.after}`).join(" · ")}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CapitalFigures({ label, performance, rate, flow }: { label: string; performance: number; rate: number; flow: number }) {
  return (
    <section className="cs-section cs-capital cs-reveal" title={CAPITAL_HINT}>
      <h2 className="cs-label">{label}</h2>
      <dl className="cs-capital-grid">
        <div><dt>Performance du tour</dt><dd className={tone(performance)}>{signedMoney(performance)}</dd></div>
        <div><dt>Rendement</dt><dd className={tone(rate)}>{signedPercent2(rate)}</dd></div>
        <div><dt>{flow < 0 ? "Retrait de capital" : flow > 0 ? "Apport de capital" : "Flux de capital"}</dt><dd className={tone(flow)}>{signedMoney(flow)}</dd></div>
      </dl>
    </section>
  );
}

const reveal = (index: number) => ({ "--i": index }) as CSSProperties;

export default function CardScene({ notice, game, onClose, embedded = false }: Props) {
  const dialog = useDialogFocus(onClose, !embedded);
  const { reducedMotion } = usePresentationSettings();
  const context = notice.cardType === "context";
  const paymentsNotice = notice.kind === "payments";
  const settlements = notice.settlements ?? [];
  const settlement = settlements[0] ?? notice.settlement;
  const settlementResults = settlements.length ? settlements : settlement ? [settlement] : [];
  const settlementSector = settlementResults.every((result) => result.sectorId === settlement?.sectorId)
    ? settlement?.sectorLabel ?? (settlement?.sectorId ? game.sectors.find((sector) => sector.id === settlement.sectorId)?.name : undefined)
    : undefined;
  const cellSectorId = notice.cell?.sector;
  const cellSector = cellSectorId ? game.sectors.find((sector) => sector.id === cellSectorId)?.name ?? cellSectorId : undefined;
  const marketCell = notice.position == null ? undefined : game.board[notice.position];
  const exactMarketLabel = `${marketCell?.label ?? notice.title ?? ""}`.trim().toLocaleLowerCase();
  const marketEvent: MarketEvent | undefined = notice.source === "board" && marketCell?.kind === "market"
    ? exactMarketLabel === "bull market" ? "bull"
      : exactMarketLabel === "bear market" ? "bear"
        : exactMarketLabel === "market crash" ? "crash" : undefined
    : undefined;
  const effectKind = notice.effect ?? "";
  const eventFamily: EventFamily = effectKind === "prison"
    ? "justice"
    : effectKind === "regulation" || REGULATION_CARDS.includes(notice.cardId ?? "")
      ? "regulation"
      : effectKind === "dividend" || PREMIUM_CARDS.includes(notice.cardId ?? "")
        ? "premium"
        : "finance";
  useEffect(() => {
    if (context) playCue("context");
    else if (notice.cardType === "event") playCue("event");
  }, [context, notice.cardType, notice.id]);
  const player = game.players.find((p) => p.id === notice.playerId) ?? game.players.find((p) => p.id === game.activePlayerId);
  // Payment cards describe the fund named by the notice, even if turn state has
  // already advanced to another player while the card is being presented.
  const paymentPlayer = game.players.find((p) => p.id === notice.playerId);
  const gradeChanges = notice.gradeOutcomes?.length ? notice.gradeOutcomes : notice.gradeChanges ?? [];
  const noticeCopy = [notice.description, ...(notice.effectLines ?? [])].filter(Boolean).join(" ");
  const mentionedCompany = game.companies.find((company) => company.name && noticeCopy.toLocaleLowerCase().includes(company.name.toLocaleLowerCase()));
  const targetCompany = game.companies.find((c) => c.id === notice.targetCompanyId)
    ?? (notice.targetCompanyName ? game.companies.find((c) => c.name === notice.targetCompanyName) : undefined)
    ?? mentionedCompany;
  const affectedCompanies = useMemo(() => {
    const impactedIds = new Set((notice.companyImpacts ?? []).map((c) => c.companyId));
    const targetSector = notice.targetedSector ?? targetCompany?.sector;
    let list = game.companies.filter((c) => impactedIds.has(c.id) || c.id === targetCompany?.id);
    if (!list.length && targetSector) list = game.companies.filter((c) => c.sector === targetSector && (!notice.targetedZone || c.zone === notice.targetedZone));
    if (!list.length && gradeChanges.some((g) => g.scope === "sector")) list = game.companies.filter((c) => gradeChanges.some((g) => g.scope === "sector" && g.id === c.sector));
    if (paymentsNotice) {
      list = game.companies.filter((c) =>
        (notice.payments ?? []).some((p) => p.companyId === c.id)
        || settlementResults.some((result) =>
          result.assets.some((asset) => asset.companyId === c.id)
          || result.marketSales.some((sale) => sale.companyId === c.id)
          || result.items?.some((item) => item.companyId === c.id)));
    }
    return list;
    // gradeChanges and settlementResults derive from the notice itself.
  }, [game.companies, notice, paymentsNotice, targetCompany]);
  const eventTone = (notice.action ?? notice.title ?? "").toLowerCase();
  const marketTone = /crash|crise|krach|bear|chute/.test(eventTone) ? "down" : /bull|hausse|boom|reprise/.test(eventTone) ? "up" : "neutral";
  const title = settlementResults.length
    ? `Synthèse des règlements${settlementSector ? ` — ${settlementSector}` : ""}`
    : paymentsNotice && cellSector
      ? `Règlement — ${cellSector}`
      : notice.title || (context ? "Conjoncture des marchés" : paymentsNotice ? "Règlement des opérations" : "Événement de marché");
  const settlementFunding = (notice.payments ?? []).reduce((sum, payment) => sum + Math.abs(payment.amount), 0);
  const obligations = notice.obligations ?? [];
  const obligationsTotal = obligations.reduce((sum, obligation) => sum + obligation.amount, 0);
  const paymentRows = (notice.payments ?? []).filter((payment) => payment.amount !== 0 || (payment.dueAmount ?? 0) > 0 || (payment.quantity ?? 0) > 0);
  const bankIncomeRows = paymentRows.filter((payment) => !payment.fromId && !!payment.toId && !!payment.companyId && (payment.quantity ?? 0) > 0);
  const settlementGroups = (() => {
    const groups = new Map<string, { reason: string; results: typeof settlementResults; incomes: typeof bankIncomeRows }>();
    for (const result of settlementResults) {
      const reason = result.reason || "Règlement";
      const group = groups.get(reason) ?? { reason, results: [], incomes: [] };
      group.results.push(result);
      groups.set(reason, group);
    }
    for (const payment of bankIncomeRows) {
      const company = game.companies.find((item) => item.id === payment.companyId);
      const resultReason = settlementResults.find((result) => result.sectorId && result.sectorId === company?.sector)?.reason;
      const sectorLabel = company?.sector ? game.sectors.find((item) => item.id === company.sector)?.name : undefined;
      const reason = resultReason || payment.reason || (sectorLabel ? `Revenus du secteur ${sectorLabel}` : undefined) || (settlementSector ? `Revenus du secteur ${settlementSector}` : "Revenus bancaires");
      const group = groups.get(reason) ?? { reason, results: [], incomes: [] };
      group.incomes.push(payment);
      groups.set(reason, group);
    }
    return [...groups.values()];
  })();
  const settlementPaid = settlementResults.reduce((sum, result) => sum + Math.max(0, result.amount - (result.unpaidAmount ?? 0)), 0);
  const settlementUnpaid = settlementResults.reduce((sum, result) => sum + (result.unpaidAmount ?? 0), 0);
  const sectorDueTotal = obligationsTotal || paymentRows.reduce((sum, payment) => sum + (payment.dueAmount ?? 0), 0);
  const contextStory = notice.description || "Les conditions économiques évoluent. Les investisseurs réévaluent leurs perspectives et les valorisations s’ajustent.";
  const contextSummary = summarizeStory(contextStory, 2);
  const settlementMode = (() => {
    const viaAssets = settlementResults.some((result) => result.assets.length || result.marketSales.length);
    const viaCash = settlementResults.some((result) => result.cashAmount !== 0);
    return viaAssets && viaCash ? "en titres et liquidités" : viaAssets ? "en titres" : "en liquidités";
  })();
  const eventStory = settlement
    ? `${settlementResults.length} règlement${settlementResults.length > 1 ? "s" : ""} ${settlementMode} — ${settlementUnpaid ? "reste un impayé." : "opération soldée."}`
    : paymentsNotice && cellSector
      ? !paymentRows.length && !obligations.length
        ? "Aucun détenteur à rémunérer — rien à régler."
        : sectorDueTotal > 0
          ? "Revenus dus aux détenteurs du secteur, en partie à financer."
          : "Revenus versés aux détenteurs du secteur."
      : paymentsNotice && notice.action === "move"
        ? "Changement de place financière."
        : notice.description || notice.effect || notice.effectLines?.[0] || "Les marchés réagissent à cette nouvelle.";
  const eventSummary = summarizeStory(eventStory, 1);
  const targetName = notice.targetCompanyName || targetCompany?.name;
  const targetShares = targetCompany && player ? targetCompany.holdings[player.id] ?? 0 : 0;
  const eventCategory = targetName ? `${FAMILY_LABEL[eventFamily]} · ${targetName}` : notice.source === "board" ? "Événement de plateau" : "Événement de marché";
  const eventEdition = `Cycle ${String(notice.cycle).padStart(2, "0")} · Édition du marché`;
  const ordinaryEvent = !context && !paymentsNotice && !marketEvent;
  const capitalFlows = player?.capitalFlows ?? 0;
  const lapCapitalDelta = capitalFlows - (player?.lapStartCapitalFlows ?? capitalFlows);
  const investorFlow = paymentsNotice
    ? (notice.payments ?? [])
        .filter((p) => p.reason?.toLowerCase().includes("départ") || p.reason?.toLowerCase().includes("capital"))
        .reduce((sum, p) => sum + (p.toId === player?.id ? p.amount : p.fromId === player?.id ? -p.amount : 0), 0)
    : 0;
  const showLap = notice.lapPerformance != null || notice.lapReturn != null || notice.action === "lap";
  const eventFlowText = notice.description?.match(/Flux de capital\s*:\s*([+-]?[\d.,]+)/i)?.[1]?.replace(",", ".");
  const eventFlow = eventFlowText != null ? Number(eventFlowText) : lapCapitalDelta;

  // Visual family: the trial and frozen-assets notices share the justice card.
  const justiceAction = notice.action === "prisonRoll" || notice.action === "skipTrading";
  const family: Family = context ? "context" : paymentsNotice ? "ledger" : marketEvent ?? (eventFamily === "justice" || justiceAction ? "justice" : "chronicle");
  const playerName = paymentPlayer?.name ?? player?.name;
  const kicker = context
    ? `Contexte · cycle ${notice.cycle}`
    : paymentsNotice
      ? `${paymentPlayer?.name ?? "Fonds"} · ${cellSector ? `case ${cellSector}` : notice.action === "move" ? "voyage" : "trésorerie"}`
      : marketEvent
        ? `${MARKET_LABEL[marketEvent]}${player ? ` · ${player.name}` : ""}`
        : notice.action === "lap"
          ? `Départ${playerName ? ` · ${playerName}` : ""}`
          : notice.action === "prisonRoll"
            ? `Procès${playerName ? ` · ${playerName}` : ""}`
            : notice.action === "skipTrading"
              ? `Justice${playerName ? ` · ${playerName}` : ""}`
              : eventCategory;
  const lapCard = notice.action === "lap";
  const summary = context
    ? contextSummary.text
    : paymentsNotice
      ? eventStory
      : marketEvent
        ? marketDek(gradeChanges)
        : lapCard
          ? "Le tour se clôt : la performance fixe l’apport ou le retrait de capital."
          : eventSummary.text;
  const fullStory = context
    ? contextSummary.truncated ? contextStory : undefined
    : paymentsNotice || lapCard
      ? undefined
      : marketEvent
        ? notice.description
        : eventSummary.truncated ? eventStory : undefined;

  const impacts = notice.playerImpacts ?? [];
  const effectLines = notice.effectLines ?? [];
  const detained = targetShares > 0;
  const showRules = eventFamily === "justice" || notice.action === "skipTrading" || (notice.action === "prisonRoll" && !!player?.jailed);
  const leadId = family === "chronicle" || family === "justice" ? targetCompany?.id : undefined;
  const rail = <CompanyRail companies={affectedCompanies} impacts={notice.companyImpacts} leadId={leadId} />;
  const nameOf = (id: string | null | undefined, fallback: string) => game.players.find((p) => p.id === id)?.name ?? fallback;
  const emptyPayment = paymentsNotice && !settlementResults.length && !paymentRows.length && !obligations.length;
  const showInvestorFlow = paymentsNotice && (investorFlow !== 0 || notice.lapPerformance != null || notice.lapReturn != null);
  const capitalLeg = (payment: (typeof paymentRows)[number]) => /départ|capital/i.test(payment.reason ?? "") && payment.amount !== 0 && !(payment.dueAmount ?? 0);
  // A capital leg already shown in the capital block is not listed twice.
  const listedPayments = showInvestorFlow ? paymentRows.filter((payment) => !capitalLeg(payment)) : paymentRows;
  const paidRows = listedPayments.filter((payment) => payment.amount !== 0);
  const showPaidTotal = paidRows.length > 1 && paidRows.every((payment) => payment.fromId && payment.fromId === paidRows[0]!.fromId);
  const compact = emptyPayment && !showInvestorFlow && !affectedCompanies.length;
  const ledgerRows = settlementResults.length ? 99 : listedPayments.length + obligations.length;
  const brief = !compact && !affectedCompanies.length && (paymentsNotice
    ? ledgerRows <= 2 && !showInvestorFlow
    : !marketEvent && !context && !effectLines.length && !impacts.length && !showLap);

  const emblem = family === "context"
    ? <Rosette />
    : family === "justice"
      ? <Seal ring="Justice · Enquête · Détention · " className="is-justice"><Scale size={30} strokeWidth={1.4} /></Seal>
      : family === "ledger"
        ? <Seal ring="Global Fund · Livre de comptes · " className="is-ledger">
            {cellSectorId ? <SectorIcon id={cellSectorId} size={28} /> : notice.action === "move" ? <Plane size={26} strokeWidth={1.4} /> : <Landmark size={26} strokeWidth={1.4} />}
          </Seal>
        : null;
  const kickerIcon = marketEvent === "bull" ? <TrendingUp size={14} strokeWidth={2} aria-hidden="true" />
    : marketEvent === "bear" ? <TrendingDown size={14} strokeWidth={2} aria-hidden="true" />
      : marketEvent === "crash" ? <Zap size={14} strokeWidth={2} aria-hidden="true" />
        : family === "justice" && notice.action !== "prisonRoll" ? <Gavel size={13} strokeWidth={1.8} aria-hidden="true" /> : null;

  const effectsBlock = effectLines.length > 0 && (
    <section className="cs-section cs-effects-block">
      <h2 className="cs-label">Ce qui change</h2>
      <ul className="cs-effects">{effectLines.map((line, i) => <li key={i}>{line}</li>)}</ul>
    </section>
  );
  const fundsBlock = impacts.length > 0 && (
    <section className="cs-section cs-funds" aria-label="Impact sur les portefeuilles">
      <h2 className="cs-label">Valeur des fonds</h2>
      <FundImpacts impacts={impacts} game={game} />
    </section>
  );
  const lapBlock = showLap && <CapitalFigures label={lapCard ? "En chiffres" : "Bilan au Départ"} performance={notice.lapPerformance ?? 0} rate={notice.lapReturn ?? 0} flow={eventFlow} />;
  const storyColumns = (effectsBlock || fundsBlock || lapBlock) && (
    <div className={`cs-columns cs-reveal ${effectsBlock && (fundsBlock || lapBlock) ? "" : "is-single"}`} style={reveal(1)}>
      {effectsBlock}
      {(fundsBlock || lapBlock) && <div className="cs-stack">{fundsBlock}{lapBlock}</div>}
    </div>
  );

  return (
    <div className={`cs-backdrop ${embedded ? "is-embedded" : "is-modal"} ${reducedMotion ? "reduce-motion" : ""}`}>
      <section
        className={`cs-scene cs-family-${family} ${context ? "is-context" : paymentsNotice ? "is-payments" : `is-event tone-${marketTone}`} ${ordinaryEvent ? "is-editorial" : ""} ${marketEvent ? `is-${marketEvent}` : `event-${eventFamily}`} ${compact ? "is-compact" : brief ? "is-brief" : ""}`}
        role="dialog"
        aria-modal={embedded ? "false" : "true"}
        aria-labelledby="cs-title"
        aria-describedby="cs-summary"
        tabIndex={-1}
        ref={dialog}
        data-family={family}
      >
        <span className="cs-frame" aria-hidden="true"><i /><i /></span>
        <header className={`cs-hero ${emblem ? "has-emblem" : ""}`}>
          {family === "chronicle" && (
            <div className="cs-masthead">
              <span className="cs-edition">{eventEdition}</span>
              <strong>GF Financial Chronicle</strong>
            </div>
          )}
          {marketEvent && <MarketChart kind={marketEvent} seed={notice.id} />}
          {family === "context" && <Watermark />}
          {emblem}
          <div className="cs-hero-copy">
            <span className="cs-kicker">{kickerIcon}<span>{kicker}</span></span>
            <h1 id="cs-title">{title}</h1>
            <p id="cs-summary">{summary}</p>
            {fullStory && (
              <details className="cs-story-full">
                <summary>Lire le texte complet</summary>
                <p>{fullStory}</p>
              </details>
            )}
          </div>
          <button type="button" className="cs-close" onClick={onClose} aria-label="Continuer et appliquer les conséquences">
            <span>Continuer</span>
            <kbd>Échap</kbd>
          </button>
        </header>
        <div className="cs-content">
          {family === "context" && (
            <>
              <div className={`cs-columns cs-reveal ${impacts.length ? "" : "is-single"}`} style={reveal(0)}>
                <section className="cs-section cs-grades" aria-label="Évolution des zones et secteurs">
                  <h2 className="cs-label">Notations</h2>
                  {gradeChanges.length
                    ? <div className="cs-grade-list">{gradeChanges.map((change, index) => <GradeRow key={`${change.scope}-${change.id}-${index}`} change={change} game={game} />)}</div>
                    : <p className="cs-empty">Aucune notation ne change.</p>}
                </section>
                {fundsBlock}
              </div>
              {rail}
            </>
          )}

          {marketEvent && (
            <>
              <section className="cs-section cs-grades is-market cs-reveal" style={reveal(0)} aria-label="Indices et valorisations">
                <h2 className="cs-label">Notations{gradeChanges.length ? ` · ${gradeChanges[0]!.scope === "zone" ? "zones" : "secteurs"}` : ""}</h2>
                <div className="cs-grade-grid" style={{ "--n": Math.max(1, gradeChanges.length) } as CSSProperties}>{gradeChanges.map((change, index) => <GradeRow key={`${change.scope}-${change.id}-${index}`} change={change} game={game} compact />)}</div>
              </section>
              {fundsBlock && <div className="cs-reveal" style={reveal(1)}>{fundsBlock}</div>}
              {rail}
            </>
          )}

          {family === "justice" && (
            <>
              {(eventFamily === "justice" || showRules) && (
                <section className={`cs-verdict cs-reveal ${eventFamily === "justice" ? (detained ? "is-detained" : "is-clear") : "is-rule"}`} style={reveal(0)} aria-label="Règle de détention">
                  {eventFamily === "justice" && (
                    <>
                      <span className="cs-verdict-icon" aria-hidden="true">{detained ? <Lock size={18} strokeWidth={1.7} /> : <LockOpen size={18} strokeWidth={1.7} />}</span>
                      <span className="cs-verdict-label">Condition</span>
                      <strong className="cs-event-condition">
                        {detained
                          ? `${player?.name ?? "Le fonds"} détient ${targetShares} action${targetShares > 1 ? "s" : ""} de ${targetName ?? "la société visée"} : détention à la fermeture de la carte.`
                          : `Sans action de ${targetName ?? "la société visée"}, pas de détention.`}
                      </strong>
                    </>
                  )}
                  {showRules && (
                    <details className="cs-rules">
                      <summary><Scale size={13} strokeWidth={1.7} aria-hidden="true" />{DETENTION_LINE}</summary>
                      <p>{DETENTION_RULE}</p>
                    </details>
                  )}
                </section>
              )}
              {storyColumns}
              {rail}
            </>
          )}

          {family === "chronicle" && (
            <>
              {storyColumns}
              {rail}
            </>
          )}

          {family === "ledger" && (
            <>
              {!emptyPayment && (
                <section className="cs-section cs-ledger cs-reveal" style={reveal(0)}>
                  {!!obligations.length && (
                    <div className="cs-obligation-list" aria-label="Obligations annoncées">
                      <h2 className="cs-label">À régler</h2>
                      {obligations.map((obligation, i) => (
                        <div className="cs-ledger-row cs-obligation" key={`${obligation.debtorId}-${obligation.creditorId}-${i}`}>
                          <span className="cs-flow">{nameOf(obligation.debtorId, "Débiteur")} <i aria-hidden="true">→</i> {nameOf(obligation.creditorId, "Banque / marché")}</span>
                          <small>{obligation.reason}</small>
                          <span className="cs-leader" aria-hidden="true" />
                          <strong className="cs-amount">{money(obligation.amount)}</strong>
                        </div>
                      ))}
                      <div className="cs-ledger-row cs-obligation-total"><span>Total à financer</span><span className="cs-leader" aria-hidden="true" /><strong className="cs-amount">{money(obligationsTotal)}</strong></div>
                    </div>
                  )}
                  {settlementResults.length ? (
                    <>
                      <div className="cs-settlement-results" aria-label="Reçus de règlement">
                        {settlementGroups.map((group) => (
                          <article className="cs-settlement-receipt" key={group.reason}>
                            <h2 className="cs-settlement-heading">{group.reason}</h2>
                            {group.results.map((result, index) => {
                              const debtor = nameOf(result.debtorId, "Débiteur");
                              const creditor = nameOf(result.creditorId, "Banque / marché");
                              return (
                                <div className="cs-settlement-cash-row" key={`${result.debtorId}-${result.creditorId}-${index}`}>
                                  {!!result.assets.length && (
                                    <div className="cs-settlement-assets">
                                      {result.assets.map((asset, assetIndex) => (
                                        <div className="cs-ledger-row" key={`${asset.companyId}-${assetIndex}`}>
                                          <span className="cs-flow">{debtor} <i aria-hidden="true">→</i> {creditor}</span>
                                          <small>{asset.quantity} action{asset.quantity === 1 ? "" : "s"} · {asset.companyName ?? game.companies.find((company) => company.id === asset.companyId)?.name ?? "Titre"}</small>
                                          <span className="cs-leader" aria-hidden="true" />
                                          <strong className="cs-amount">{money(asset.value)}</strong>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {!!result.marketSales.length && (
                                    <div className="cs-settlement-assets">
                                      {result.marketSales.map((sale, saleIndex) => (
                                        <div className="cs-ledger-row" key={`${sale.companyId}-${saleIndex}`}>
                                          <span className="cs-flow">Banque / marché <i aria-hidden="true">→</i> {debtor}</span>
                                          <small>vente de {sale.quantity} action{sale.quantity === 1 ? "" : "s"} · {sale.companyName}</small>
                                          <span className="cs-leader" aria-hidden="true" />
                                          <strong className="cs-amount">{money(sale.amount ?? 0)}</strong>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {result.cashAmount !== 0 && (
                                    <div className={`cs-ledger-row cs-settlement-cash ${result.cashAmount < 0 ? "is-reverse" : ""}`}>
                                      <span className="cs-flow">{result.cashAmount < 0 ? creditor : debtor} <i>→</i> {result.cashAmount < 0 ? debtor : creditor}</span>
                                      <span className="cs-leader" aria-hidden="true" />
                                      <strong className="cs-amount">{money(Math.abs(result.cashAmount))}</strong>
                                    </div>
                                  )}
                                  {!!result.unpaidAmount && (
                                    <p className="cs-ledger-row cs-settlement-unpaid">
                                      <span className="cs-flow">Impayé · {debtor} <i aria-hidden="true">→</i> {creditor}</span>
                                      <span className="cs-leader" aria-hidden="true" />
                                      <strong className="cs-amount">{money(result.unpaidAmount)}</strong>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                            {!!group.incomes.length && (
                              <div className="cs-payment-list">
                                {group.incomes.map((payment, i) => (
                                  <article className="cs-ledger-row cs-payment" key={`bank-income-${payment.companyId}-${i}`}>
                                    <span className="cs-flow">Banque <i aria-hidden="true">→</i> {nameOf(payment.toId, "Investisseur")}</span>
                                    <small>{payment.companyName || payment.reason || "Revenu bancaire"} · revenu bancaire</small>
                                    <span className="cs-leader" aria-hidden="true" />
                                    <strong className="cs-amount is-up">{money(payment.amount)}</strong>
                                  </article>
                                ))}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                      <div className="cs-global-totals" aria-label="Totaux consolidés">
                        <div className="cs-total is-main"><span>TOTAL RÉGLÉ</span><strong>{money(settlementPaid)}</strong></div>
                        {settlementUnpaid > 0 && <div className="cs-total is-unpaid"><span>Reste impayé</span><strong>{money(settlementUnpaid)}</strong></div>}
                      </div>
                    </>
                  ) : listedPayments.length ? (
                    <div className="cs-payment-block">
                      <h2 className="cs-label">{listedPayments.some((payment) => (payment.dueAmount ?? 0) > 0) ? "Versements · à financer" : "Versements"}</h2>
                      <div className="cs-payment-list">
                        {listedPayments.map((payment, i) => (
                          <article className="cs-ledger-row cs-payment" key={`${payment.fromId}-${payment.toId}-${i}`}>
                            <span className="cs-flow">{nameOf(payment.fromId, payment.fromId ? "Investisseur" : "Marché")} <i aria-hidden="true">→</i> {nameOf(payment.toId, payment.toId ? "Investisseur" : "Marché")}</span>
                            <small>
                              {notice.action === "move"
                                ? "Frais de voyage"
                                : payment.quantity && (payment.companyId || payment.companyName)
                                  ? `${payment.quantity} action${payment.quantity > 1 ? "s" : ""}${payment.companyName ? ` · ${payment.companyName}` : ""}`
                                  : payment.reason || payment.companyName || "Flux de trésorerie"}
                            </small>
                            <span className="cs-leader" aria-hidden="true" />
                            <span className="cs-payment-values">
                              {payment.amount !== 0 && <strong className="cs-amount" title="Versé">{money(payment.amount)}</strong>}
                              {(payment.dueAmount ?? 0) > 0 && <strong className="cs-amount is-due" title="À financer">{money(payment.dueAmount ?? 0)} <small>à financer</small></strong>}
                            </span>
                          </article>
                        ))}
                      </div>
                      {showPaidTotal && settlementFunding > 0 && (
                        <div className="cs-ledger-row cs-payment-total"><span>Total versé</span><span className="cs-leader" aria-hidden="true" /><strong className="cs-amount">{money(paidRows.reduce((sum, payment) => sum + Math.abs(payment.amount), 0))}</strong></div>
                      )}
                    </div>
                  ) : null}
                </section>
              )}
              {showInvestorFlow && <CapitalFigures label="Flux de capital" performance={notice.lapPerformance ?? 0} rate={notice.lapReturn ?? 0} flow={investorFlow} />}
              {rail}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
