import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  LegendScrollComponent,
  AriaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ECharts, EChartsOption } from "echarts";
import type {
  Company,
  GameCommand,
  GameView,
  HistoryPoint,
  Player,
} from "@global-fund/shared";
import "./trading-desk.css";

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  LegendScrollComponent,
  AriaComponent,
  CanvasRenderer,
]);

type Props = {
  game: GameView;
  viewerId: string;
  canAct: boolean;
  onCommand: (command: GameCommand) => void;
};
type Tab = "market" | "portfolio" | "analysis";
type RatingScope = "zone" | "sector";
const money = (value: number) =>
  `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} M€`;
const amount = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
const catalogName = (items: { id: string; name: string }[], id: string) =>
  items.find((item) => item.id === id)?.name ?? id;
const holding = (company: Company, viewerId: string) =>
  amount(company.holdings?.[viewerId]);

function Chart({
  option,
  label,
  className = "",
}: {
  option: EChartsOption;
  label: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts | null>(null);
  useEffect(() => {
    if (!host.current) return;
    const instance = echarts.init(host.current, undefined, {
      renderer: "canvas",
    });
    instance.setOption({ aria: { enabled: true } });
    chart.current = instance;
    const resize = () => instance.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host.current);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      instance.dispose();
      chart.current = null;
    };
  }, []);
  useEffect(() => {
    chart.current?.setOption({ ...option, aria: { enabled: true } }, true);
  }, [option]);
  return (
    <div
      ref={host}
      className={`td-chart ${className}`}
      role="img"
      aria-label={label}
    />
  );
}

function priceSeries(history: HistoryPoint[], companyId: string) {
  return history
    .map((point) => ({
      label: point.label || `Cycle ${point.cycle}`,
      price: amount(point.prices?.[companyId]),
    }))
    .filter((point) => point.price >= 0);
}

export default function TradingDesk({
  game,
  viewerId,
  canAct,
  onCommand,
}: Props) {
  const viewer = game.players.find((player) => player.id === viewerId) as
    | Player
    | undefined;
  const [tab, setTab] = useState<Tab>("market");
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [filter, setFilter] = useState("all");
  const [ratingScope, setRatingScope] = useState<RatingScope>("zone");
  const activeZone = viewer?.zone ?? "";
  const selected =
    game.companies.find((company) => company.id === selectedId) ?? null;
  const companies = useMemo(() => {
    const source =
      tab === "portfolio"
        ? game.companies.filter((company) => holding(company, viewerId) > 0)
        : game.companies.filter((company) => company.zone === activeZone);
    return source
      .filter((company) => filter === "all" || company.sector === filter)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [game.companies, tab, viewerId, activeZone, filter]);
  useEffect(() => {
    if (!companies.some((company) => company.id === selectedId))
      setSelectedId(companies[0]?.id ?? "");
  }, [companies, selectedId]);
  const held = selected ? holding(selected, viewerId) : 0;
  const average = selected?.averageBuyPrice?.[viewerId] ?? null;
  const buyTotal = amount(selected?.price) * quantity;
  const canTrade = Boolean(
    selected &&
      viewer &&
      canAct &&
      game.phase === "market" &&
      game.activePlayerId === viewerId &&
      !viewer.jailed &&
      viewer.geoResolved &&
      viewer.zone === selected.zone &&
      selected.available &&
      quantity >= 1 &&
      quantity <= 5,
  );
  const disabledReason = !viewer
    ? "Joueur introuvable."
    : game.phase !== "market"
      ? "Les échanges sont disponibles pendant la phase Marché."
      : game.activePlayerId !== viewerId || !canAct
        ? "Attendez votre tour pour passer un ordre."
        : viewer.jailed
          ? "Les échanges sont suspendus pendant la détention."
          : !viewer.geoResolved
            ? "Choisissez une destination avant de trader."
            : selected && selected.zone !== viewer.zone
              ? "Cette entreprise est hors de votre zone active."
              : selected && !selected.available
                ? "Cette entreprise n’est pas disponible à l’échange."
                : "";
  const trade = (side: "BUY_SHARE" | "SELL_SHARE") => {
    if (!selected || !canTrade) return;
    if (
      side === "BUY_SHARE" &&
      (quantity > selected.sharesAvailable || buyTotal > amount(viewer?.cash))
    )
      return;
    if (side === "SELL_SHARE" && quantity > held) return;
    onCommand({ type: side, companyId: selected.id, quantity });
  };
  const history = selected ? priceSeries(game.marketHistory, selected.id) : [];
  const marketOption = useMemo<EChartsOption>(() => {
    const values = selected ? priceSeries(game.marketHistory, selected.id) : [];
    const up = values.length > 1 && values.at(-1)!.price >= values[0].price;
    return {
      animation: false,
      grid: { left: 4, right: 12, top: 12, bottom: 28 },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v) => `${Number(v).toFixed(2)} M€`,
      },
      xAxis: {
        type: "category",
        data: values.map((v) => v.label),
        boundaryGap: false,
        axisLabel: { color: "#858a8d", fontSize: 10, hideOverlap: true },
        axisLine: { lineStyle: { color: "#343a39" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: {
          color: "#858a8d",
          fontSize: 10,
          formatter: (v: number) => `${v} M€`,
        },
        splitLine: { lineStyle: { color: "#292f2e" } },
      },
      series: [
        {
          type: "line",
          data: values.map((v) => v.price),
          smooth: 0.25,
          showSymbol: false,
          lineStyle: { width: 2.5, color: up ? "#d4b16c" : "#d78476" },
          areaStyle: {
            color: up ? "rgba(212,177,108,.13)" : "rgba(215,132,118,.11)",
          },
        },
      ],
    };
  }, [selected, game.marketHistory]);
  const exposure = useMemo(() => {
    const rows = (key: "zone" | "sector", catalog: typeof game.zones) =>
      catalog
        .map((item) => ({
          ...item,
          value: game.companies
            .filter((c) => c[key] === item.id)
            .reduce(
              (sum, c) => sum + holding(c, viewerId) * amount(c.price),
              0,
            ),
        }))
        .filter((item) => item.value > 0);
    return {
      zones: rows("zone", game.zones),
      sectors: rows("sector", game.sectors),
    };
  }, [game.companies, game.zones, game.sectors, viewerId]);
  const donut = (rows: { name: string; value: number }[]): EChartsOption => ({
    animation: false,
    tooltip: { trigger: "item", valueFormatter: (v) => money(Number(v)) },
    legend: {
      bottom: 0,
      textStyle: { color: "#a4aaa7", fontSize: 10 },
      itemWidth: 8,
      itemHeight: 8,
    },
    series: [
      {
        type: "pie",
        radius: ["53%", "76%"],
        center: ["50%", "43%"],
        label: { show: false },
        itemStyle: { borderColor: "#141a19", borderWidth: 3 },
        data: rows.map((row, i) => ({
          name: row.name,
          value: row.value,
          itemStyle: {
            color: [
              "#d3b16f",
              "#7ca08e",
              "#8098b3",
              "#ba8e82",
              "#a28ab5",
              "#9ba77d",
              "#c68e5e",
              "#6dabb0",
              "#baaa8c",
            ][i % 9],
          },
        })),
      },
    ],
  });
  const fullOwned = game.companies.filter(
    (company) => holding(company, viewerId) >= 5,
  );
  const monopolyCount = useMemo(() => {
    const groups = new Map<string, { all: Company[]; owned: Company[] }>();
    game.companies.forEach((company) => {
      const key = `${company.zone}:${company.sector}`;
      const group = groups.get(key) ?? { all: [], owned: [] };
      group.all.push(company);
      if (holding(company, viewerId) >= 5) group.owned.push(company);
      groups.set(key, group);
    });
    return [...groups.values()].filter(
      (group) =>
        group.owned.length === group.all.length && group.all.length > 0,
    ).length;
  }, [game.companies, viewerId]);
  const ownershipGroups = useMemo(() => {
    const groups = new Map<
      string,
      { zone: string; sector: string; companies: Company[]; complete: boolean }
    >();
    game.companies.forEach((company) => {
      const key = `${company.zone}:${company.sector}`;
      const group = groups.get(key) ?? {
        zone: company.zone,
        sector: company.sector,
        companies: [],
        complete: true,
      };
      group.companies.push(company);
      group.complete &&= holding(company, viewerId) >= 5;
      groups.set(key, group);
    });
    return [...groups.values()];
  }, [game.companies, viewerId]);
  const fullGroups = ownershipGroups.filter((group) => group.complete);
  const selectedGroup = selected
    ? ownershipGroups.find(
        (group) =>
          group.zone === selected.zone && group.sector === selected.sector,
      )
    : undefined;
  const navHistory = game.marketHistory
    .map((point) => ({
      label: point.label || `Cycle ${point.cycle}`,
      value: point.funds?.[viewerId],
    }))
    .filter((point): point is { label: string; value: number } =>
      Number.isFinite(point.value),
    );
  const navOption = useMemo<EChartsOption>(
    () => ({
      animation: false,
      grid: { left: 8, right: 12, top: 16, bottom: 28 },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => money(Number(value)),
      },
      xAxis: {
        type: "category",
        data: navHistory.map((point) => point.label),
        boundaryGap: false,
        axisLabel: { color: "#858a8d", fontSize: 10, hideOverlap: true },
        axisLine: { lineStyle: { color: "#343a39" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: {
          color: "#858a8d",
          fontSize: 10,
          formatter: (value: number) => `${value} M€`,
        },
        splitLine: { lineStyle: { color: "#292f2e" } },
      },
      series: [
        {
          name: "Valeur du fonds",
          type: "line",
          data: navHistory.map((point) => point.value),
          smooth: 0.2,
          showSymbol: false,
          lineStyle: { width: 2.5, color: "#d4b16c" },
          areaStyle: { color: "rgba(212,177,108,.13)" },
        },
      ],
    }),
    [navHistory],
  );
  const ratingCatalog = ratingScope === "zone" ? game.zones : game.sectors;
  const ratingKey = ratingScope === "zone" ? "zoneGrades" : "sectorGrades";
  const ratingOption = useMemo<EChartsOption>(
    () => ({
      animation: false,
      color: [
        "#d6b674",
        "#8bad99",
        "#88a4bd",
        "#bd9387",
        "#ab92ba",
        "#a5a976",
        "#c28f64",
        "#70aeb0",
        "#b9ad91",
      ],
      grid: { left: 30, right: 12, top: 32, bottom: 30 },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) =>
          ["E", "D", "C", "B", "A"][Number(value) - 1] ?? "",
      },
      legend: {
        type: "scroll",
        top: 0,
        textStyle: { color: "#a4aaa7", fontSize: 9 },
        pageTextStyle: { color: "#a4aaa7" },
        itemWidth: 9,
        itemHeight: 9,
      },
      xAxis: {
        type: "category",
        data: game.marketHistory.map(
          (point) => point.label || `C${point.cycle}`,
        ),
        axisLabel: { color: "#858a8d", fontSize: 9, hideOverlap: true },
        axisLine: { lineStyle: { color: "#343a39" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 1,
        max: 5,
        interval: 1,
        axisLabel: {
          color: "#858a8d",
          fontSize: 9,
          formatter: (value: number) => ["E", "D", "C", "B", "A"][value - 1],
        },
        splitLine: { lineStyle: { color: "#292f2e" } },
      },
      series: ratingCatalog.map((item) => ({
        name: item.name,
        type: "line" as const,
        connectNulls: false,
        showSymbol: true,
        symbolSize: 4,
        data: game.marketHistory.map((point) => {
          const grade = point[ratingKey]?.[item.id];
          return grade
            ? ({ A: 5, B: 4, C: 3, D: 2, E: 1 } as const)[
                grade as "A" | "B" | "C" | "D" | "E"
              ]
            : null;
        }),
      })),
    }),
    [game.marketHistory, ratingCatalog, ratingKey],
  );

  return (
    <section className="trading-desk" aria-label="Salle des marchés">
      <header className="td-header">
        <div>
          <span className="td-eyebrow">
            GLOBAL FUND <i /> MARCHÉ
          </span>
          <h1>Salle des marchés</h1>
          <p>
            Arbitrez vos positions avec une lecture claire du cours, du risque
            et du capital.
          </p>
        </div>
        <div className="td-capital">
          <span>TRÉSORERIE DISPONIBLE</span>
          <strong>{money(amount(viewer?.cash))}</strong>
          <small>
            Cycle {game.cycle} <i />{" "}
            {catalogName(game.zones, activeZone) || "Zone non définie"}
          </small>
        </div>
      </header>
      <nav className="td-tabs" aria-label="Vues du marché">
        {(
          [
            ["market", "Marché"],
            ["portfolio", "Portefeuille"],
            ["analysis", "Analyse"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
            {id === "portfolio" && (
              <b>
                {game.companies.filter((c) => holding(c, viewerId) > 0).length}
              </b>
            )}
          </button>
        ))}
      </nav>
      {tab === "analysis" ? (
        <div className="td-analysis">
          <article className="td-card td-donut-card">
            <span className="td-eyebrow">EXPOSITION DU FONDS</span>
            <h2>Répartition par zone</h2>
            {exposure.zones.length ? (
              <Chart
                option={donut(exposure.zones)}
                label={`Répartition par zone : ${exposure.zones.map((r) => `${r.name} ${money(r.value)}`).join(", ")}`}
              />
            ) : (
              <p className="td-empty">Aucune position à analyser.</p>
            )}
          </article>
          <article className="td-card td-donut-card">
            <span className="td-eyebrow">EXPOSITION DU FONDS</span>
            <h2>Répartition par secteur</h2>
            {exposure.sectors.length ? (
              <Chart
                option={donut(exposure.sectors)}
                label={`Répartition par secteur : ${exposure.sectors.map((r) => `${r.name} ${money(r.value)}`).join(", ")}`}
              />
            ) : (
              <p className="td-empty">Aucune position à analyser.</p>
            )}
          </article>
          <article className="td-card td-nav-history">
            <span className="td-eyebrow">VALEUR DU FONDS</span>
            <h2>Historique de la valeur liquidative</h2>
            {navHistory.length > 1 ? (
              <Chart
                option={navOption}
                label={`Valeur du fonds : ${navHistory.map((point) => `${point.label}, ${money(point.value)}`).join("; ")}`}
              />
            ) : (
              <p className="td-empty">
                {navHistory.length === 1
                  ? `Un relevé réel : ${money(navHistory[0].value)}`
                  : "Aucun historique de valeur n’est encore enregistré."}
              </p>
            )}
          </article>
          <article className="td-card td-rating-history">
            <span className="td-eyebrow">FONDAMENTAUX</span>
            <h2>Évolution des notations</h2>
            <div
              className="td-rating-tabs"
              role="group"
              aria-label="Groupe de notations"
            >
              <button
                className={ratingScope === "zone" ? "active" : ""}
                onClick={() => setRatingScope("zone")}
              >
                Zones
              </button>
              <button
                className={ratingScope === "sector" ? "active" : ""}
                onClick={() => setRatingScope("sector")}
              >
                Secteurs
              </button>
            </div>
            {game.marketHistory.length > 1 ? (
              <Chart
                option={ratingOption}
                label={`Historique des notations par ${ratingScope === "zone" ? "zone" : "secteur"} : ${ratingCatalog.map((item) => `${item.name}, ${game.marketHistory.map((point) => point[ratingKey]?.[item.id] ?? "aucun relevé").join(", ")}`).join("; ")}`}
              />
            ) : (
              <p className="td-empty">
                {game.marketHistory.length === 1
                  ? "Un seul relevé réel ; l’évolution apparaîtra après les prochains mouvements."
                  : "Aucun historique de notation n’est encore enregistré."}
              </p>
            )}
          </article>
          <article className="td-card td-ownership">
            <span className="td-eyebrow">RÈGLES DE REVENU</span>
            <h2>Contrôle des actifs</h2>
            <div className="td-rule">
              <strong>{fullOwned.length}</strong>
              <span>
                <b>Détentions intégrales</b>
                <small>5/5 parts · revenu minimum C/C</small>
              </span>
            </div>
            <div className="td-rule">
              <strong>{monopolyCount}</strong>
              <span>
                <b>Monopoles zone / secteur</b>
                <small>
                  Toutes les entreprises du groupe à 5/5 · revenu minimum A/A
                </small>
              </span>
            </div>
            {fullOwned.length > 0 && (
              <div className="td-owned-list">
                <strong>Sociétés détenues à 100 % · C/C</strong>
                {fullOwned.map((c) => (
                  <div key={c.id}>
                    <span>{c.name}</span>
                    <b>5 / 5</b>
                  </div>
                ))}
              </div>
            )}
            {fullGroups.length > 0 && (
              <div className="td-owned-list">
                <strong>Monopoles actifs · A/A</strong>
                {fullGroups.map((group) => (
                  <div key={`${group.zone}:${group.sector}`}>
                    <span>
                      {catalogName(game.zones, group.zone)} ·{" "}
                      {catalogName(game.sectors, group.sector)}
                    </span>
                    <b>{group.companies.length} sociétés</b>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      ) : (
        <div className="td-workspace">
          <section className="td-card td-list">
            <div className="td-list-head">
              <div>
                <span className="td-eyebrow">
                  {tab === "portfolio"
                    ? "VOS POSITIONS"
                    : `COTATIONS · ${catalogName(game.zones, activeZone).toUpperCase()}`}
                </span>
                <strong>
                  {companies.length.toString().padStart(2, "0")}{" "}
                  <small>lignes</small>
                </strong>
              </div>
              <label className="td-filter">
                <span className="sr-only">Filtrer par secteur</span>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">Tous les secteurs</option>
                  {game.sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="td-column-head">
              <span>ACTIF</span>
              <span>SECTEUR</span>
              <span>COURS</span>
              <span>DISP. / POSITION</span>
              <span>PRIX MOYEN</span>
            </div>
            <div className="td-rows">
              {companies.map((company) => {
                const shares = holding(company, viewerId);
                const avg = company.averageBuyPrice?.[viewerId];
                return (
                  <button
                    key={company.id}
                    className={`td-row ${selected?.id === company.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedId(company.id);
                      setQuantity(1);
                    }}
                  >
                    <span className="td-name">
                      <i>{company.name.slice(0, 2).toUpperCase()}</i>
                      <b>
                        {company.name}
                        <small>
                          {company.ticker || company.id.toUpperCase()}
                        </small>
                      </b>
                    </span>
                    <span className="td-sector">
                      {catalogName(game.sectors, company.sector)}
                    </span>
                    <span className="td-price">{money(company.price)}</span>
                    <span className="td-holding">
                      <b>
                        {company.sharesAvailable}
                        <small> / 5 libres</small>
                      </b>
                      <i>{shares}/5 détenues</i>
                    </span>
                    <span className="td-average">
                      {avg == null ? "—" : money(avg)}
                    </span>
                  </button>
                );
              })}
              {!companies.length && (
                <p className="td-empty">
                  {tab === "portfolio"
                    ? "Aucune position dans votre portefeuille."
                    : "Aucune entreprise dans cette zone."}
                </p>
              )}
            </div>
          </section>
          <aside className="td-card td-focus">
            {selected ? (
              <>
                <div className="td-focus-top">
                  <div>
                    <span className="td-eyebrow">FICHE VALEUR</span>
                    <h2>{selected.name}</h2>
                    <p>
                      {catalogName(game.sectors, selected.sector)} <i />{" "}
                      {catalogName(game.zones, selected.zone)}
                    </p>
                  </div>
                  <span className="td-monogram">
                    {selected.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div
                  className="td-sector-art"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(13,19,18,.88), rgba(13,19,18,.15)), url(/assets/scenes/sector-${selected.sector}.webp)`,
                  }}
                >
                  <span>SECTEUR</span>
                  <b>{catalogName(game.sectors, selected.sector)}</b>
                </div>
                <div className="td-ownership-badges">
                  {held >= 5 && (
                    <span className="td-rule-badge">
                      5/5 · REVENU MINIMUM C/C
                    </span>
                  )}
                  {selectedGroup?.complete && (
                    <span className="td-rule-badge td-monopoly-badge">
                      MONOPOLE {catalogName(game.zones, selectedGroup.zone)} ·{" "}
                      {catalogName(game.sectors, selectedGroup.sector)} · A/A
                    </span>
                  )}
                </div>
                <div className="td-quote">
                  <div>
                    <span>COURS ACTUEL</span>
                    <strong>{money(selected.price)}</strong>
                  </div>
                  <div>
                    <span>VOTRE POSITION</span>
                    <strong>
                      {held} <small>/ 5 parts</small>
                    </strong>
                  </div>
                </div>
                <div className="td-chart-title">
                  <span>HISTORIQUE DU COURS</span>
                  <small>
                    {history.length
                      ? `${history.length} relevés`
                      : "Pas encore de relevés"}
                  </small>
                </div>
                {history.length > 1 ? (
                  <Chart
                    option={marketOption}
                    label={`Historique de ${selected.name} : ${history.map((row) => `${row.label}, ${money(row.price)}`).join("; ")}`}
                    className="td-price-chart"
                  />
                ) : (
                  <div className="td-no-chart">
                    {history.length === 1
                      ? `Un seul relevé : ${money(history[0].price)}`
                      : "L’historique se construit au fil des mouvements réels du marché."}
                  </div>
                )}
                <div className="td-cost">
                  <span>PRIX MOYEN D’ACHAT</span>
                  <b>{average == null ? "Aucune position" : money(average)}</b>
                  <small>
                    {average == null
                      ? ""
                      : `${selected.price >= average ? "+" : "−"}${money(Math.abs(selected.price - average))} par part vs. cours`}
                  </small>
                </div>
                <div className="td-trade">
                  <div className="td-quantity">
                    <button
                      aria-label="Réduire la quantité"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <span>
                      <b>{quantity}</b>
                      <small>parts</small>
                    </span>
                    <button
                      aria-label="Augmenter la quantité"
                      onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                    >
                      +
                    </button>
                  </div>
                  <div className="td-trade-buttons">
                    <button
                      className="td-sell"
                      disabled={!canTrade || quantity > held}
                      onClick={() => trade("SELL_SHARE")}
                    >
                      Vendre
                    </button>
                    <button
                      className="td-buy"
                      disabled={
                        !canTrade ||
                        quantity > selected.sharesAvailable ||
                        buyTotal > amount(viewer?.cash)
                      }
                      onClick={() => trade("BUY_SHARE")}
                    >
                      Acheter <small>{money(buyTotal)}</small>
                    </button>
                  </div>
                </div>
                {disabledReason && (
                  <p className="td-disabled-reason" role="status">
                    {disabledReason}
                  </p>
                )}
                {canTrade && quantity > selected.sharesAvailable && (
                  <p className="td-disabled-reason" role="status">
                    Seulement {selected.sharesAvailable} parts disponibles.
                  </p>
                )}
                {canTrade && buyTotal > amount(viewer?.cash) && (
                  <p className="td-disabled-reason" role="status">
                    Trésorerie insuffisante pour cet ordre.
                  </p>
                )}
              </>
            ) : (
              <div className="td-no-selection">
                <span>GF</span>
                <h2>Sélectionnez une valeur</h2>
                <p>
                  Les cotations, l’historique et les ordres apparaîtront ici.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
      <footer className="td-footer">
        <span>
          <i /> {game.phase === "market" ? "MARCHÉ OUVERT" : "MARCHÉ EN PAUSE"}
        </span>
        <small>
          Vos ordres sont confirmés avant leur inscription au portefeuille.
        </small>
      </footer>
    </section>
  );
}
