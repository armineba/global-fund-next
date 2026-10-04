import { useEffect, useMemo, useRef, useState } from "react";
import type { Company, GameNotice, GameView, Grade } from "@global-fund/shared";
import "./CardScene.css";
import { useDialogFocus } from "./useDialogFocus";

type Props = { notice: GameNotice; game: GameView; onClose: () => void };
const money = (n: number) =>
  `${n < 0 ? "−" : ""}${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Math.abs(n))} M€`;
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
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY, behavior: "smooth" });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [companies.length]);
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
                  <span className="cs-company-name">{company.name}</span>
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

export default function CardScene({ notice, game, onClose }: Props) {
  const dialog = useDialogFocus(onClose);
  const context = notice.cardType === "context";
  const paymentsNotice = notice.kind === "payments";
  const player =
    game.players.find((p) => p.id === notice.playerId) ??
    game.players.find((p) => p.id === game.activePlayerId);
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
    if (!list.length && paymentsNotice)
      list = game.companies.filter((c) =>
        (notice.payments ?? []).some((p) => p.companyId === c.id),
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
  const title =
    notice.title ||
    (context
      ? "Conjoncture des marchés"
      : paymentsNotice
        ? "Règlement des opérations"
        : "Événement de marché");
  const contextStory =
    notice.description ||
    "Les conditions économiques évoluent. Les investisseurs réévaluent leurs perspectives et les valorisations s’ajustent.";
  const targetName = notice.targetCompanyName || targetCompany?.name;
  const eventCategory = targetName
    ? `SITUATION · ${targetName}`
    : notice.source === "board"
      ? "ÉVÉNEMENT DE PLATEAU"
      : "ÉVÉNEMENT DE MARCHÉ";
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
      className="cs-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`cs-scene ${context ? "is-context" : paymentsNotice ? "is-payments" : `is-event tone-${marketTone}`}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cs-title"
        aria-describedby="cs-summary"
        tabIndex={-1}
        ref={dialog}
      >
        <button
          type="button"
          className="cs-close"
          onClick={onClose}
          aria-label="Fermer cette scène"
        >
          <span aria-hidden="true">×</span>
          <small>ÉCHAP</small>
        </button>
        <header
          className="cs-hero"
          style={
            context
              ? {
                  backgroundImage:
                    'linear-gradient(90deg,rgba(5,10,18,.97) 0%,rgba(5,10,18,.84) 47%,rgba(5,10,18,.18) 100%),linear-gradient(0deg,#080e16 0%,transparent 48%),url("/assets/scenes/context-market.webp")',
                }
              : undefined
          }
        >
          <div className="cs-hero-copy">
            <span className="cs-kicker">
              {context
                ? `CYCLE ${notice.cycle} · NOTE DE CONJONCTURE`
                : paymentsNotice
                  ? `CYCLE ${notice.cycle} · FLUX DE TRÉSORERIE`
                  : eventCategory}
            </span>
            <h1 id="cs-title">{title}</h1>
            <p id="cs-summary">
              {context
                ? contextStory
                : notice.description ||
                  notice.effect ||
                  notice.effectLines?.[0] ||
                  "Les marchés réagissent à cette nouvelle."}
            </p>
            {!paymentsNotice && !context && notice.effect && (
              <p className="cs-event-effect">{notice.effect}</p>
            )}
            {context ? (
              <div className="cs-player-tag">
                CONTEXTE COMMUN · TOUS LES FONDS
              </div>
            ) : (
              player && (
                <div className="cs-player-tag">
                  <i style={{ background: player.color }} /> {player.name}
                  {player.jailed ? <span> · DÉTENTION</span> : null}
                </div>
              )
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
                    <span className="cs-kicker">L’ONDE DE CHOC</span>
                    <h2>Du contexte aux valorisations</h2>
                  </div>
                </div>
                <div className="cs-cascade">
                  <div>
                    <span>01 · MARCHÉ</span>
                    <strong>
                      {gradeChanges.length
                        ? "Conditions révisées"
                        : "Conjoncture globale"}
                    </strong>
                  </div>
                  <b aria-hidden="true">→</b>
                  <div>
                    <span>02 · ZONE & SECTEUR</span>
                    <strong>
                      {gradeChanges.length
                        ? `${gradeChanges.length} indicateur${gradeChanges.length > 1 ? "s" : ""} ajusté${gradeChanges.length > 1 ? "s" : ""}`
                        : "Perspectives actualisées"}
                    </strong>
                  </div>
                  <b aria-hidden="true">→</b>
                  <div>
                    <span>03 · ENTREPRISES</span>
                    <strong>
                      {affectedCompanies.length
                        ? `${affectedCompanies.length} valeur${affectedCompanies.length > 1 ? "s" : ""} concernée${affectedCompanies.length > 1 ? "s" : ""}`
                        : "Valorisations réévaluées"}
                    </strong>
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
                          <span className="cs-jail">PLACÉ EN DÉTENTION</span>
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
              {!!notice.companyImpacts?.length && (
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
                          {impact.prison && <em>Détention</em>}
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
                <div className="cs-section-heading">
                  <div>
                    <span className="cs-kicker">OPÉRATIONS DU TOUR</span>
                    <h2>Règlements entre joueurs</h2>
                  </div>
                </div>
                {notice.payments?.length ? (
                  <div className="cs-payment-list">
                    {notice.payments.map((payment, i) => {
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
                              : payment.reason ||
                                payment.companyName ||
                                "Flux de trésorerie"}
                          </div>
                          <strong
                            className={
                              payment.amount < 0 ? "negative" : "positive"
                            }
                          >
                            {money(payment.amount)}
                          </strong>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="cs-no-payments">
                    <span className="cs-no-payment-icon">—</span>
                    <strong>Aucun paiement ce tour</strong>
                    <p>
                      Aucune transaction ni redistribution de trésorerie n’a été
                      déclenchée.
                    </p>
                  </div>
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
        <footer className="cs-footer">
          <span>
            <i /> MARCHÉS MONDIAUX <b>·</b> CYCLE {notice.cycle}
          </span>
          <button type="button" onClick={onClose} autoFocus={false}>
            Continuer <span aria-hidden="true">→</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
