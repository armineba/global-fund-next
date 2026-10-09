import { useEffect, useMemo, useRef, useState } from "react";
import type { Company, GameNotice, GameView, Grade } from "@global-fund/shared";
import "./CardScene.css";
import { useDialogFocus } from "./useDialogFocus";
import { playCue } from "./audio";
import { usePresentationSettings } from "./settings";

type Props = { notice: GameNotice; game: GameView; onClose: () => void; embedded?: boolean };
const money = (n: number) =>
  `${n < 0 ? "−" : ""}${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))} M€`;
const gradeNames: Record<Grade, string> = {
  A: "Exceptionnel",
  B: "Solide",
  C: "Stable",
  D: "Fragile",
  E: "Critique",
};
const categoryNames: Record<string, string> = {
  technology: "Technologie",
  finance: "Finance",
  industry: "Industrie",
  health: "Santé",
  energy: "Énergie",
  realestate: "Immobilier",
  agrifood: "Agroalimentaire",
  media: "Médias",
  transport: "Transport",
};
const grade = (g: Grade) => (
  <span
    className={`cs-grade grade-${g.toLowerCase()}`}
    aria-label={`${g}, ${gradeNames[g]}`}
  >
    {g}
  </span>
);
const companyArtwork = (sector: string) =>
  `/assets/scenes/sector-${sector}.webp`;
const companyLogo = (company: Company) => {
  const path = (company as Company & { logoPath?: unknown }).logoPath;
  return typeof path === "string" && path ? path : undefined;
};
const summarizeStory = (story: string) => {
  const sentences = story.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [story];
  const summary = sentences.slice(0, 2).join(" ").trim();
  if (summary.length <= 260) return summary;
  return `${summary.slice(0, summary.lastIndexOf(" ", 257)).trimEnd()}…`;
};

function CompanyRail({
  companies,
  impacts = [],
}: {
  companies: Company[];
  impacts?: GameNotice["companyImpacts"];
}) {
  const impactById = new Map(
    (impacts ?? []).map((impact) => [impact.companyId, impact]),
  );
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { reducedMotion } = usePresentationSettings();
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY, behavior: reducedMotion ? "instant" : "smooth" });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [companies.length, reducedMotion]);
  return (
    <section className="cs-companies" aria-label="Entreprises concernées">
      <div className="cs-section-heading">
        <div>
          <span className="cs-kicker">EN BOURSE</span>
          <h2>Les entreprises concernées</h2>
        </div>
        {companies.length > 1 && (
          <span className="cs-counter">
            {active + 1} / {companies.length}
          </span>
        )}
      </div>
      {companies.length ? (
        <div
          className="cs-rail"
          ref={rail}
          onScroll={(e) => {
            const el = e.currentTarget;
            const cards = Array.from(el.children) as HTMLElement[];
            const index = cards.reduce(
              (best, card, i) =>
                Math.abs(card.offsetLeft - el.scrollLeft) <
                Math.abs((cards[best]?.offsetLeft ?? 0) - el.scrollLeft)
                  ? i
                  : best,
              0,
            );
            setActive(index);
          }}
        >
          {companies.map((company) => {
            const impact = impactById.get(company.id);
            return (
              <article className="cs-company" key={company.id}>
                <div
                  className="cs-company-art"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(5,10,17,.06),rgba(5,10,17,.86)),url("${companyArtwork(company.sector)}")`,
                  }}
                >
                  {companyLogo(company) && (
                    <img className="cs-company-logo" src={companyLogo(company)} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  )}
                  <span className="cs-company-sector">
                    {categoryNames[company.sector] ?? company.sector}
                  </span>
                  {(impact?.bankruptcy || impact?.returned) && (
                    <span
                      className={`cs-company-status ${impact?.bankruptcy ? "is-liquidated" : "is-returned"}`}
                    >
                      {impact?.bankruptcy
                        ? "Liquidée · faillite"
                        : "Retour au marché"}
                    </span>
                  )}
                  <span className="cs-company-name" title={company.name} aria-label={company.name}>{company.name}</span>
                </div>
                <div className="cs-company-data">
                  {impact ? (
                    <>
                      <span>Cours avant</span>
                      <strong>{money(impact.beforePrice)}</strong>
                      <span>Cours après</span>
                      <strong
                        className={
                          impact.afterPrice < impact.beforePrice
                            ? "negative"
                            : impact.afterPrice > impact.beforePrice
                              ? "positive"
                              : ""
                        }
                      >
                        {money(impact.afterPrice)}
                      </strong>
                      <span
                        className={`cs-company-delta ${impact.afterPrice < impact.beforePrice ? "negative" : impact.afterPrice > impact.beforePrice ? "positive" : ""}`}
                      >
                        {impact.afterPrice > impact.beforePrice ? "+" : ""}
                        {money(impact.afterPrice - impact.beforePrice)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{company.ticker || "Cours actuel"}</span>
                      <strong>{money(company.price)}</strong>
                    </>
                  )}
                  <span className="cs-company-income">
                    Revenu / action <b>{money(company.income)}</b>
                  </span>
                  {!!impact?.sharesChanged?.length && (
                    <span className="cs-company-holders">
                      {impact.sharesChanged
                        .map(
                          (holder) =>
                            `${holder.playerName} : ${holder.before} → ${holder.after}`,
                        )
                        .join(" · ")}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="cs-muted">
          Aucune entreprise cotée n’est directement concernée.
        </p>
      )}
      {companies.length > 1 && (
        <div className="cs-dots" aria-label="Position dans les entreprises">
          {companies.map((company, i) => (
            <span key={company.id} className={i === active ? "active" : ""} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function CardScene({ notice, game, onClose, embedded = false }: Props) {
  const dialog = useDialogFocus(onClose, !embedded);
  const { reducedMotion } = usePresentationSettings();
  const context = notice.cardType === "context";
  const paymentsNotice = notice.kind === "payments";
  const settlements = (notice.settlements ?? []);
  const settlement = settlements[0] ?? notice.settlement;
  const settlementResults = settlements.length ? settlements : settlement ? [settlement] : [];
  const settlementSector = settlementResults.every(result => result.sectorId === settlement?.sectorId) ? settlement?.sectorLabel ?? (settlement?.sectorId
    ? game.sectors.find((sector) => sector.id === settlement.sectorId)?.name
    : undefined) : undefined;
  const cellSectorId = notice.cell?.sector;
  const cellSector = cellSectorId
    ? game.sectors.find((sector) => sector.id === cellSectorId)?.name ?? cellSectorId
    : undefined;
  const marketCell = notice.position == null ? undefined : game.board[notice.position];
  const exactMarketLabel = `${marketCell?.label ?? notice.title ?? ""}`.trim().toLocaleLowerCase();
  const marketEvent = notice.source === "board" && marketCell?.kind === "market"
    ? exactMarketLabel === "bull market" ? "bull"
      : exactMarketLabel === "bear market" ? "bear"
        : exactMarketLabel === "market crash" ? "crash" : undefined
    : undefined;
  const effectKind = notice.effect ?? "";
  const eventFamily = effectKind === "prison"
    ? "justice"
    : effectKind === "regulation" || notice.cardId === "board-13" || notice.cardId === "board-14" || notice.cardId === "board-15" || notice.cardId === "board-16"
      ? "regulation"
      : effectKind === "dividend" || ["board-02", "board-05", "board-08", "board-17", "board-28", "board-30", "board-32", "board-34"].includes(notice.cardId ?? "")
        ? "premium"
        : "finance";
  useEffect(() => {
    if (context) playCue("context");
    else if (notice.cardType === "event") playCue("event");
  }, [context, notice.cardType, notice.id]);
  const player =
    game.players.find((p) => p.id === notice.playerId) ??
    game.players.find((p) => p.id === game.activePlayerId);
  // Payment cards describe the fund named by the notice, even if turn state has
  // already advanced to another player while the card is being presented.
  const paymentPlayer = game.players.find((p) => p.id === notice.playerId);
  const gradeChanges = notice.gradeOutcomes?.length
    ? notice.gradeOutcomes
    : (notice.gradeChanges ?? []);
  const noticeCopy = [notice.description, ...(notice.effectLines ?? [])]
    .filter(Boolean)
    .join(" ");
  const mentionedCompany = game.companies.find(
    (company) =>
      company.name &&
      noticeCopy.toLocaleLowerCase().includes(company.name.toLocaleLowerCase()),
  );
  const targetCompany =
    game.companies.find((c) => c.id === notice.targetCompanyId) ??
    (notice.targetCompanyName
      ? game.companies.find((c) => c.name === notice.targetCompanyName)
      : undefined) ??
    mentionedCompany;
  const impactedIds = new Set(
    (notice.companyImpacts ?? []).map((c) => c.companyId),
  );
  const affectedCompanies = useMemo(() => {
    const targetSector = notice.targetedSector ?? targetCompany?.sector;
    let list = game.companies.filter(
      (c) => impactedIds.has(c.id) || c.id === targetCompany?.id,
    );
    if (!list.length && targetSector)
      list = game.companies.filter(
        (c) =>
          c.sector === targetSector &&
          (!notice.targetedZone || c.zone === notice.targetedZone),
      );
    if (!list.length && gradeChanges.some((g) => g.scope === "sector"))
      list = game.companies.filter((c) =>
        gradeChanges.some((g) => g.scope === "sector" && g.id === c.sector),
      );
    if (paymentsNotice)
      list = game.companies.filter((c) =>
        (notice.payments ?? []).some((p) => p.companyId === c.id) ||
        settlementResults.some((result) =>
          result.assets.some((asset) => asset.companyId === c.id) ||
          result.marketSales.some((sale) => sale.companyId === c.id) ||
          result.items?.some((item) => item.companyId === c.id)),
      );
    return list;
  }, [
    game.companies,
    notice,
    impactedIds,
    gradeChanges,
    paymentsNotice,
    targetCompany,
  ]);
  const eventTone = (notice.action ?? notice.title ?? "").toLowerCase();
  const marketTone = /crash|crise|krach|bear|chute/.test(eventTone)
    ? "down"
    : /bull|hausse|boom|reprise/.test(eventTone)
      ? "up"
      : "neutral";
  const title = settlementResults.length
    ? `Synthèse des règlements${settlementSector ? ` — ${settlementSector}` : ""}`
    : paymentsNotice && cellSector
      ? `Règlement — ${cellSector}`
      :
    notice.title ||
    (context
      ? "Conjoncture des marchés"
      : paymentsNotice
        ? "Règlement des opérations"
        : "Événement de marché");
  const settlementFunding = (notice.payments ?? []).reduce(
    (sum, payment) => sum + Math.abs(payment.amount),
    0,
  );
  const obligations = notice.obligations ?? [];
  const obligationsTotal = obligations.reduce((sum, obligation) => sum + obligation.amount, 0);
  const paymentRows = (notice.payments ?? []).filter(
    (payment) => payment.amount !== 0 || (payment.dueAmount ?? 0) > 0 || (payment.quantity ?? 0) > 0,
  );
  const bankIncomeRows = paymentRows.filter((payment) =>
    !payment.fromId && !!payment.toId && !!payment.companyId && (payment.quantity ?? 0) > 0,
  );
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
  const contextStory =
    notice.description ||
    "Les conditions économiques évoluent. Les investisseurs réévaluent leurs perspectives et les valorisations s’ajustent.";
  const contextSummary = summarizeStory(contextStory);
  const eventStory = settlement
    ? `${settlementResults.length} règlement${settlementResults.length > 1 ? "s" : ""} pour cette opération. ${money(settlementPaid)} réglés${settlementUnpaid ? ` ; ${money(settlementUnpaid)} impayés` : ""}. Les transferts de titres et de liquidités sont détaillés ci-dessous.`
    : paymentsNotice && cellSector
      ? `Votre fonds tombe sur la case ${cellSector}. Les détenteurs des entreprises du secteur perçoivent leurs revenus. ${settlementFunding > 0 ? `Les versements déjà effectués totalisent ${money(settlementFunding)}.` : "Aucun versement n’a encore été effectué."}${sectorDueTotal > 0 ? ` Montant à financer : ${money(sectorDueTotal)}.` : ""}`
      : notice.description || notice.effect || notice.effectLines?.[0] || "Les marchés réagissent à cette nouvelle.";
  const eventSummary = summarizeStory(eventStory);
  const targetName = notice.targetCompanyName || targetCompany?.name;
  const targetShares = targetCompany && player ? targetCompany.holdings[player.id] ?? 0 : 0;
  const eventCategory = targetName
    ? `SITUATION · ${targetName}`
    : notice.source === "board"
      ? "ÉVÉNEMENT DE PLATEAU"
      : "ÉVÉNEMENT DE MARCHÉ";
  const eventEdition = `CYCLE ${String(notice.cycle).padStart(2, "0")} · ÉDITION DU MARCHÉ`;
  const ordinaryEvent = !context && !paymentsNotice && !marketEvent;
  const pressIllustration = eventFamily === "justice"
    ? "/assets/scenes/wealth/justice.webp"
    : companyArtwork(targetCompany?.sector ?? notice.targetedSector ?? notice.cell?.sector ?? "finance");
  const capitalFlows = player?.capitalFlows ?? 0;
  const lapCapitalDelta =
    capitalFlows - (player?.lapStartCapitalFlows ?? capitalFlows);
  const investorFlow = paymentsNotice
    ? (notice.payments ?? [])
        .filter(
          (p) =>
            p.reason?.toLowerCase().includes("départ") ||
            p.reason?.toLowerCase().includes("capital"),
        )
        .reduce(
          (sum, p) =>
            sum +
            (p.toId === player?.id
              ? p.amount
              : p.fromId === player?.id
                ? -p.amount
                : 0),
          0,
        )
    : 0;
  const showLap =
    notice.lapPerformance != null ||
    notice.lapReturn != null ||
    notice.action === "lap";
  const eventFlowText = notice.description
    ?.match(/Flux de capital\s*:\s*([+-]?[\d.,]+)/i)?.[1]
    ?.replace(",", ".");
  const eventFlow =
    eventFlowText != null ? Number(eventFlowText) : lapCapitalDelta;
  return (
    <div
      className={`cs-backdrop ${embedded ? "is-embedded" : "is-modal"} ${reducedMotion ? "reduce-motion" : ""}`}
    >
      <section
        className={`cs-scene ${context ? "is-context" : paymentsNotice ? "is-payments" : `is-event tone-${marketTone}`} ${ordinaryEvent ? "is-editorial" : ""} ${marketEvent ? `is-${marketEvent}` : `family-${eventFamily}`} ${reducedMotion ? "reduce-motion" : ""}`}
        role="dialog"
        aria-modal={embedded ? "false" : "true"}
        aria-labelledby="cs-title"
        aria-describedby="cs-summary"
        tabIndex={-1}
        ref={dialog}
      >
        <button
          type="button"
          className="cs-close"
          onClick={onClose}
          aria-label="Continuer et appliquer les conséquences"
        >
          <span aria-hidden="true">×</span>
          <small>ÉCHAP</small>
        </button>
        <header
          className="cs-hero"
          data-family={context ? "context" : marketEvent ?? eventFamily}
          style={
            ordinaryEvent
              ? undefined
              : context
              ? {
                  backgroundImage:
                    "linear-gradient(135deg,rgba(12,27,39,.98),rgba(5,11,18,.98))",
                }
              : marketEvent
                ? { backgroundImage: `linear-gradient(90deg,rgba(5,10,18,.97) 0%,rgba(5,10,18,.76) 48%,rgba(5,10,18,.2) 100%),linear-gradient(0deg,#080e16 0%,transparent 54%),url("/assets/scenes/context-market.webp")` }
                : eventFamily === "justice"
                  ? { backgroundImage: `linear-gradient(90deg,rgba(5,10,18,.98) 0%,rgba(5,10,18,.77) 50%,rgba(5,10,18,.18) 100%),linear-gradient(0deg,#080e16 0%,transparent 54%),url("/assets/scenes/wealth/justice.webp")` }
                  : { backgroundImage: `linear-gradient(90deg,rgba(5,10,18,.97) 0%,rgba(5,10,18,.8) 53%,rgba(5,10,18,.24) 100%),linear-gradient(0deg,#080e16 0%,transparent 54%),url("${companyArtwork(targetCompany?.sector ?? notice.targetedSector ?? notice.cell?.sector ?? "finance")}")` }
          }
        >
          {context && <div className="cs-context-art" aria-hidden="true" />}
          {ordinaryEvent && (
            <div className="cs-newspaper-meta" aria-label={`GF Financial Chronicle, ${eventEdition}`}>
              <strong>GF FINANCIAL CHRONICLE</strong>
              <span>{eventEdition}</span>
            </div>
          )}
          {ordinaryEvent && (
            <div
              className="cs-press-illustration"
              role="img"
              aria-label={targetName ? `Illustration de ${targetName}` : `Illustration · ${eventCategory}`}
              style={{ backgroundImage: `linear-gradient(180deg,rgba(8,14,20,.04),rgba(8,14,20,.55)),url("${pressIllustration}")` }}
            >
              <span>{targetName ?? (eventFamily === "justice" ? "DOSSIER JUDICIAIRE" : categoryNames[notice.targetedSector ?? ""] ?? "ACTUALITÉ DES MARCHÉS")}</span>
            </div>
          )}
          <div className="cs-hero-copy">
            <span className="cs-kicker">
              {context
                ? `CONTEXTE MACRO · CYCLE ${notice.cycle}`
              : paymentsNotice
                  ? `FLUX DE TRÉSORERIE — ${paymentPlayer?.name.toLocaleUpperCase("fr-FR") ?? "FONDS"}`
                  : eventCategory}
            </span>
            <h1 id="cs-title">{title}</h1>
            <p id="cs-summary">
              {context
                ? contextSummary
                : paymentsNotice ? eventStory : eventSummary}
            </p>
            {(context ? contextSummary.length < contextStory.trim().length : !paymentsNotice && eventSummary.length < eventStory.trim().length) && (
              <details className="cs-story-full">
                <summary>Lire le texte complet</summary>
                <p>{context ? contextStory : eventStory}</p>
              </details>
            )}
            {eventFamily === "justice" && (
              <p className="cs-event-condition"><b>CONDITION</b>{targetShares > 0 ? `Vous détenez ${targetShares} action${targetShares > 1 ? "s" : ""} de la société visée : détention à la fermeture de la carte.` : "Sans action de la société visée, pas de détention."}</p>
            )}
            {context ? (
              <div className="cs-player-tag">
                CONTEXTE COMMUN · TOUS LES FONDS
              </div>
            ) : !ordinaryEvent && !paymentsNotice ? (
              player && (
                <div className="cs-player-tag">
                  <i style={{ background: player.color }} /> {player.name}
                  {player.jailed ? <span> · DÉTENTION</span> : null}
                </div>
              )
            ) : null}
            {!context && !paymentsNotice && !ordinaryEvent && (
              <div className={`cs-family-label family-label-${marketEvent ?? eventFamily}`}>
                <span aria-hidden="true">{marketEvent === "bull" ? "↗" : marketEvent === "bear" || marketEvent === "crash" ? "↘" : eventFamily === "justice" ? "⚖" : eventFamily === "regulation" ? "§" : eventFamily === "premium" ? "✦" : "◇"}</span>
                {marketEvent === "bull" ? "Marché haussier" : marketEvent === "bear" ? "Marché baissier" : marketEvent === "crash" ? "Correction brutale" : eventFamily === "justice" ? "Justice & enquête" : eventFamily === "regulation" ? "Régulation" : eventFamily === "premium" ? "Prime & dividende" : "Finance & entreprises"}
              </div>
            )}
          </div>
          {!context && !paymentsNotice && (
            <div
              className={`cs-event-seal seal-${marketTone}`}
              aria-hidden="true"
            >
              <span>
                {marketTone === "down" ? "▼" : marketTone === "up" ? "▲" : "◆"}
              </span>
              <small>
                {marketTone === "down"
                  ? "PRESSION"
                  : marketTone === "up"
                    ? "DYNAMIQUE"
                    : "MARCHÉ"}
              </small>
            </div>
          )}
        </header>
        <div className="cs-content">
          {context && (
            <>
              <section className="cs-section">
                <div className="cs-section-heading">
                  <div>
                    <span className="cs-kicker">CONSÉQUENCES À VENIR</span>
                    <h2>Évolution des zones et secteurs</h2>
                  </div>
                </div>
                {!!gradeChanges.length && (
                  <div className="cs-grade-list">
                    {gradeChanges.map((change, index) => {
                      const entry =
                        change.scope === "zone"
                          ? game.zones.find((x) => x.id === change.id)
                          : game.sectors.find((x) => x.id === change.id);
                      return (
                        <div
                          className="cs-grade-row"
                          key={`${change.scope}-${change.id}-${index}`}
                        >
                          <span className="cs-scope">
                            {change.scope === "zone" ? "ZONE" : "SECTEUR"}
                          </span>
                          <strong>
                            {entry?.name ??
                              categoryNames[change.id] ??
                              change.id}
                          </strong>
                          <span className="cs-grade-transition">
                            {grade(change.before)}{" "}
                            <span aria-hidden="true">→</span>{" "}
                            {grade(change.after)}
                          </span>
                          <span
                            className={`cs-delta delta-${change.after < change.before ? "up" : change.after > change.before ? "down" : "flat"}`}
                          >
                            {gradeNames[change.before]} →{" "}
                            {gradeNames[change.after]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
              {!!notice.playerImpacts?.length && (
                <section className="cs-section">
                  <div className="cs-section-heading">
                    <div>
                      <span className="cs-kicker">RÉPERCUSSIONS</span>
                      <h2>Impact sur les portefeuilles</h2>
                    </div>
                  </div>
                  <div className="cs-impact-grid">
                    {notice.playerImpacts.map((impact) => (
                      <article className="cs-impact" key={impact.playerId}>
                        <span className="cs-impact-name">
                          {impact.playerName}
                        </span>
                        <div>
                          <span>Trésorerie</span>
                          <strong
                            className={
                              impact.cash < 0
                                ? "negative"
                                : impact.cash > 0
                                  ? "positive"
                                  : ""
                            }
                          >
                            {impact.cash > 0 ? "+" : ""}
                            {money(impact.cash)}
                          </strong>
                        </div>
                        <div>
                          <span>Valorisation</span>
                          <strong>{money(impact.valuation)}</strong>
                        </div>
                        {impact.prison && (
                          <span className="cs-jail">DÉTENTION APRÈS CONTINUER</span>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <CompanyRail
                companies={affectedCompanies}
                impacts={notice.companyImpacts}
              />
            </>
          )}
          {!context && !paymentsNotice && (
            <>
              {marketEvent && (
                <section className="cs-section cs-market-brief">
                  <div className="cs-section-heading"><div><span className="cs-kicker">LE MONDE CHANGE</span><h2>Indices et valorisations</h2></div></div>
                  <div className="cs-market-grades">{gradeChanges.map((change, index) => <div key={`${change.scope}-${change.id}-${index}`}><span>{(change.scope === "zone" ? game.zones : game.sectors).find(entry => entry.id === change.id)?.name ?? change.id}</span><span className="cs-grade-transition">{grade(change.before)}<span aria-hidden="true">→</span>{grade(change.after)}</span></div>)}</div>
                  <div className="cs-market-funds">{notice.playerImpacts?.map(impact => <div key={impact.playerId}><span>{impact.playerName}</span><b className={impact.valuation < 0 ? "negative" : impact.valuation > 0 ? "positive" : ""}>{impact.valuation > 0 ? "+" : ""}{money(impact.valuation)}</b></div>)}</div>
                </section>
              )}
              {targetCompany && (
                <div
                  className="cs-target-banner"
                  style={{
                    backgroundImage: `linear-gradient(90deg,rgba(6,11,18,.94),rgba(6,11,18,.38)),url("${companyArtwork(targetCompany.sector)}")`,
                  }}
                >
                  <span className="cs-kicker">VALEUR CIBLÉE</span>
                  <strong>{targetName ?? "Entreprise concernée"}</strong>
                  <span>
                    {categoryNames[targetCompany.sector] ??
                      targetCompany.sector}
                  </span>
                </div>
              )}
              {!!notice.companyImpacts?.length && !marketEvent && (
                <section className="cs-section">
                  <div className="cs-section-heading">
                    <div>
                      <span className="cs-kicker">ISSUE SOCIÉTAIRE</span>
                      <h2>Valorisation & actionnariat</h2>
                    </div>
                  </div>
                  <div className="cs-company-outcomes">
                    {notice.companyImpacts.map((impact) => (
                      <article key={impact.companyId}>
                        <div className="cs-co-head">
                          <strong>{impact.companyName}</strong>
                          <span>
                            {money(impact.beforePrice)} <b>→</b>{" "}
                            <strong
                              className={
                                impact.afterPrice < impact.beforePrice
                                  ? "negative"
                                  : impact.afterPrice > impact.beforePrice
                                    ? "positive"
                                    : ""
                              }
                            >
                              {money(impact.afterPrice)}
                            </strong>
                          </span>
                        </div>
                        {(impact.bankruptcy || impact.returned) && (
                          <div className="cs-co-flags">
                            {impact.bankruptcy && (
                              <span>LIQUIDÉE · FAILLITE</span>
                            )}
                            {impact.returned && <span>RETOUR AU MARCHÉ</span>}
                          </div>
                        )}
                        {!!impact.sharesChanged?.length && (
                          <div className="cs-co-holders">
                            {impact.sharesChanged.map((holder) => (
                              <div key={holder.playerId}>
                                <span>{holder.playerName}</span>
                                <b>
                                  {holder.before} → {holder.after} actions
                                </b>
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {marketEvent && <CompanyRail companies={affectedCompanies} impacts={notice.companyImpacts} />}
              {eventFamily === "justice" && (
                <section className="cs-section cs-justice-brief" aria-label="Règle de détention">
                  <div className="cs-justice-mark" aria-hidden="true">⚖</div>
                  <div>
                    <span className="cs-kicker">CONDITION DE L’ENQUÊTE</span>
                    <strong>{targetName ? `La détention dépend de votre position sur ${targetName}.` : "La détention dépend de la société visée par l’enquête."}</strong>
                    <p>{targetShares > 0 ? `Votre fonds possède ${targetShares} action${targetShares > 1 ? "s" : ""} : le gestionnaire sera placé en détention à la fermeture de la carte.` : "Sans action de la société visée, le gestionnaire ne sera pas envoyé en détention."} En détention, vous passez les échanges tant que vous y restez. Au prochain tour, lancez le dé pour tenter de sortir ; après trois tentatives, la sortie coûte 5 M€.</p>
                  </div>
                </section>
              )}
              <section className="cs-section">
                <div className="cs-section-heading">
                  <div>
                    <span className="cs-kicker">CONSÉQUENCES</span>
                    <h2>Ce qui change</h2>
                  </div>
                </div>
                {notice.effectLines?.length ? (
                  <ul className="cs-effects">
                    {notice.effectLines.map((line, i) => (
                      <li key={i}>
                        <span className="cs-effect-mark">
                          {line.toLowerCase().includes("perd") ||
                          line.includes("−")
                            ? "−"
                            : "＋"}
                        </span>
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cs-muted">
                    {notice.effect ||
                      notice.description ||
                      "Les acteurs du marché ajustent leurs décisions."}
                  </p>
                )}
                {!!notice.playerImpacts?.length && (
                  <div className="cs-outcomes">
                    {notice.playerImpacts.map((impact) => (
                      <div className="cs-outcome" key={impact.playerId}>
                        <span>{impact.playerName}</span>
                        <div className="cs-outcome-values">
                          <span
                            className={
                              impact.cash < 0 ? "negative" : "positive"
                            }
                          >
                            Trésorerie{" "}
                            <b>
                              {impact.cash > 0 ? "+" : ""}
                              {money(impact.cash)}
                            </b>
                          </span>
                          <span>
                            Patrimoine <b>{money(impact.valuation)}</b>
                          </span>
                          {impact.prison && <em>Détention après Continuer</em>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              {showLap && (
                <section className="cs-section cs-capital">
                  <div className="cs-section-heading">
                    <div>
                      <span className="cs-kicker">DÉPART · PERFORMANCE</span>
                      <h2>Bilan de l’investisseur</h2>
                    </div>
                  </div>
                  <div className="cs-capital-grid">
                    <div>
                      <span>Performance du tour</span>
                      <strong
                        className={
                          (notice.lapPerformance ?? 0) < 0
                            ? "negative"
                            : "positive"
                        }
                      >
                        {money(notice.lapPerformance ?? 0)}
                      </strong>
                    </div>
                    <div>
                      <span>Rendement</span>
                      <strong
                        className={
                          (notice.lapReturn ?? 0) < 0 ? "negative" : "positive"
                        }
                      >
                        {new Intl.NumberFormat("fr-FR", {
                          maximumFractionDigits: 2,
                        }).format(notice.lapReturn ?? 0)}{" "}
                        %
                      </strong>
                    </div>
                    <div>
                      <span>
                        {eventFlow < 0
                          ? "Retrait de capital"
                          : eventFlow > 0
                            ? "Apport de capital"
                            : "Flux de capital"}
                      </span>
                      <strong
                        className={eventFlow < 0 ? "negative" : "positive"}
                      >
                        {eventFlow > 0 ? "+" : ""}
                        {money(eventFlow)}
                      </strong>
                    </div>
                  </div>
                  <p className="cs-muted">
                    La performance mesure l’évolution du portefeuille hors
                    apports et retraits. Le flux ajuste la trésorerie de
                    l’investisseur.
                  </p>
                </section>
              )}
              <CompanyRail
                companies={affectedCompanies}
                impacts={notice.companyImpacts}
              />
            </>
          )}
          {paymentsNotice && (
            <>
              <section className="cs-section">
                {!settlement && <div className="cs-section-heading">
                  <div>
                    <span className="cs-kicker">{obligations.length ? "OBLIGATIONS DU TOUR" : "OPÉRATIONS DU TOUR"}</span>
                    {obligations.length > 0 && <h2>À régler</h2>}
                  </div>
                </div>}
                {!!obligations.length && (
                  <div className="cs-obligation-list" aria-label="Obligations annoncées">
                    {obligations.map((obligation, i) => (
                      <article className="cs-obligation" key={`${obligation.debtorId}-${obligation.creditorId}-${i}`}>
                        <div><strong>{game.players.find((p) => p.id === obligation.creditorId)?.name ?? "Banque / marché"}</strong><small>{game.players.find((p) => p.id === obligation.debtorId)?.name ?? "Débiteur"} → {game.players.find((p) => p.id === obligation.creditorId)?.name ?? "Banque / marché"} · {obligation.reason}</small></div>
                        <b>{money(obligation.amount)}</b>
                      </article>
                    ))}
                    <div className="cs-obligation-total"><span>Total à financer</span><strong>{money(obligationsTotal)}</strong></div>
                  </div>
                )}
                {settlementResults.length ? (
                  <>
                    <div className="cs-settlement-results" aria-label="Règlements entre investisseurs">
                      {settlementGroups.map((group) => (
                        <article className="cs-settlement-receipt" key={group.reason}>
                          <h2 className="cs-settlement-heading">{group.reason}</h2>
                          {group.results.map((result, index) => {
                            const debtor = game.players.find((p) => p.id === result.debtorId)?.name ?? "Débiteur";
                            const creditor = game.players.find((p) => p.id === result.creditorId)?.name ?? "Banque / marché";
                            return <div className="cs-settlement-cash-row" key={`${result.debtorId}-${result.creditorId}-${index}`}>
                              {!!result.assets.length && <div className="cs-settlement-assets">{result.assets.map((asset, assetIndex) => <div key={`${asset.companyId}-${assetIndex}`}><span>{debtor} → {creditor} · {asset.quantity} action{asset.quantity === 1 ? "" : "s"} · {asset.companyName ?? game.companies.find((company) => company.id === asset.companyId)?.name ?? "Titre"}</span><strong>{money(asset.value)}</strong></div>)}</div>}
                              {!!result.marketSales.length && <div className="cs-settlement-assets">{result.marketSales.map((sale, saleIndex) => <div key={`${sale.companyId}-${saleIndex}`}><span>Banque / marché → {debtor} · vente de {sale.quantity} action{sale.quantity === 1 ? "" : "s"} · {sale.companyName}</span><strong>{money(sale.amount ?? 0)}</strong></div>)}</div>}
                              {result.cashAmount !== 0 && <div className="cs-settlement-cash"><span>{result.cashAmount < 0 ? `${creditor} → ${debtor}` : `${debtor} → ${creditor}`}</span><strong className={result.cashAmount < 0 ? "negative" : "positive"}>{money(Math.abs(result.cashAmount))}</strong></div>}
                              {!!result.unpaidAmount && <p className="cs-settlement-unpaid">Impayé · {debtor} → {creditor} · {money(result.unpaidAmount)}</p>}
                            </div>;
                          })}
                          {!!group.incomes.length && <div className="cs-payment-list">{group.incomes.map((payment, i) => <article className="cs-payment" key={`bank-income-${payment.companyId}-${i}`}><div className="cs-transfer"><span>Banque</span><b aria-hidden="true">→</b><span>{game.players.find((p) => p.id === payment.toId)?.name ?? "Investisseur"}</span></div><div className="cs-payment-detail">{payment.companyName || payment.reason || "Revenu bancaire"}</div><div className="cs-payment-values"><span><small>Revenu bancaire</small><b className="positive">{money(payment.amount)}</b></span></div></article>)}</div>}
                        </article>
                      ))}
                    </div>
                    <div className="cs-global-totals" aria-label="Totaux consolidés">
                      <div><span>TOTAL RÉGLÉ</span><strong>{money(settlementPaid)}</strong></div>
                      {settlementUnpaid > 0 && <div className="is-unpaid"><span>Reste impayé</span><strong>{money(settlementUnpaid)}</strong></div>}
                    </div>
                  </>
                ) : (
                  <>
                    {paymentRows.length ? (
                      <>
                        <h3 className="cs-executed-heading">{paymentRows.some((payment) => (payment.dueAmount ?? 0) > 0) ? "Versements exécutés ou à financer" : "Versements exécutés"}</h3>
                        <div className="cs-payment-list">
                          {paymentRows.map((payment, i) => {
                            const from =
                              game.players.find((p) => p.id === payment.fromId)
                                ?.name ??
                              (payment.fromId ? "Investisseur" : "Marché");
                            const to =
                              game.players.find((p) => p.id === payment.toId)?.name ??
                              (payment.toId ? "Investisseur" : "Marché");
                            return (
                              <article
                                className="cs-payment"
                                key={`${payment.fromId}-${payment.toId}-${i}`}
                              >
                                <div className="cs-transfer">
                                  <span>{from}</span>
                                  <b aria-hidden="true">→</b>
                                  <span>{to}</span>
                                </div>
                                <div className="cs-payment-detail">
                                  {payment.quantity
                                    ? `${payment.quantity} action${payment.quantity > 1 ? "s" : ""}${payment.companyName ? ` · ${payment.companyName}` : ""}`
                                    : payment.reason || payment.companyName || "Flux de trésorerie"}
                                </div>
                                <div className="cs-payment-values">
                                  {payment.amount !== 0 && <span><small>Versé</small><b className={payment.amount < 0 ? "negative" : "positive"}>{money(payment.amount)}</b></span>}
                                  {(payment.dueAmount ?? 0) > 0 && <span><small>À financer</small><b className="negative">{money(payment.dueAmount ?? 0)}</b></span>}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                    {!paymentRows.length && !obligations.length && (
                      <div className="cs-no-payments">
                        <span className="cs-no-payment-icon">—</span>
                        <strong>Aucun paiement ce tour</strong>
                        <p>
                          Aucune transaction ni redistribution de trésorerie n’a été
                          déclenchée.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </section>
              {(investorFlow !== 0 ||
                notice.lapPerformance != null ||
                notice.lapReturn != null) && (
                <section className="cs-section cs-capital">
                  <div className="cs-section-heading">
                    <div>
                      <span className="cs-kicker">DÉPART · PERFORMANCE</span>
                      <h2>Flux de capital investisseur</h2>
                    </div>
                  </div>
                  <div className="cs-capital-grid">
                    <div>
                      <span>Performance du tour</span>
                      <strong
                        className={
                          (notice.lapPerformance ?? 0) < 0
                            ? "negative"
                            : "positive"
                        }
                      >
                        {money(notice.lapPerformance ?? 0)}
                      </strong>
                    </div>
                    <div>
                      <span>Rendement</span>
                      <strong
                        className={
                          (notice.lapReturn ?? 0) < 0 ? "negative" : "positive"
                        }
                      >
                        {new Intl.NumberFormat("fr-FR", {
                          maximumFractionDigits: 2,
                        }).format(notice.lapReturn ?? 0)}{" "}
                        %
                      </strong>
                    </div>
                    <div>
                      <span>
                        {investorFlow < 0
                          ? "Retrait de capital"
                          : investorFlow > 0
                            ? "Apport de capital"
                            : "Flux de capital"}
                      </span>
                      <strong
                        className={investorFlow < 0 ? "negative" : "positive"}
                      >
                        {investorFlow > 0 ? "+" : ""}
                        {money(investorFlow)}
                      </strong>
                    </div>
                  </div>
                  <p className="cs-muted">
                    {investorFlow === 0
                      ? "Aucun apport ni retrait de capital n’a été réalisé au Départ."
                      : "Le flux de capital ajuste la trésorerie de l’investisseur."}
                  </p>
                </section>
              )}
              <CompanyRail
                companies={affectedCompanies}
                impacts={notice.companyImpacts}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
