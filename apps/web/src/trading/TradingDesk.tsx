import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Network } from "lucide-react";
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
import AnimatedMoney from "../presentation/AnimatedMoney";
import { profitLossPercent, sortTradingRows, type TradingSortDirection, type TradingSortKey } from "./tradingSort";
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
  browseZone?: string;
  onBrowseZoneChange?: (zoneId: string) => void;
  initialTab?: Tab;
  onClose?: () => void;
  onEndTurn?: () => void;
  onReturnTravel?: () => void;
};
type Tab = "market" | "portfolio" | "analysis" | "statistics";
type RatingScope = "zone" | "sector";
const money = (value: number) =>
  `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} M€`;
const amount = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
const catalogName = (items: { id: string; name: string }[], id: string) =>
  items.find((item) => item.id === id)?.name ?? id;
const holding = (company: Company, viewerId: string) =>
  amount(company.holdings?.[viewerId]);
const formatPercent = (value: number) =>
  `${value >= 0 ? "+" : "−"}${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(value))} %`;

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
  const optionRef = useRef(option);
  useEffect(() => { optionRef.current = option; }, [option]);
  useEffect(() => {
    if (!host.current) return;
    let instance: ECharts | null = null;
    let observer: ResizeObserver | null = null;
    let frame = 0;
    let resizeFrame = 0;
    const resize = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => instance?.resize());
    };
    frame = requestAnimationFrame(() => {
      if (!host.current) return;
      instance = echarts.init(host.current, undefined, { renderer: "canvas" });
      instance.setOption({ ...optionRef.current, aria: { enabled: true } }, true);
      chart.current = instance;
      observer = new ResizeObserver(resize);
      observer.observe(host.current);
      window.addEventListener("resize", resize);
      resize();
    });
    return () => {
      cancelAnimationFrame(frame);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      instance?.dispose();
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
    .filter((point) => Number.isFinite(point.prices?.[companyId]))
    .map((point) => ({
      label: point.label || `Cycle ${point.cycle}`,
      price: point.prices[companyId],
    }))
    .filter((point) => point.price >= 0);
}

export default function TradingDesk({
  game,
  viewerId,
  canAct,
  onCommand,
  browseZone,
  onBrowseZoneChange,
  initialTab = "market",
  onClose,
  onEndTurn,
  onReturnTravel,
}: Props) {
  const viewer = game.players.find((player) => player.id === viewerId) as
    | Player
    | undefined;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [filter, setFilter] = useState("all");
  const [capFilter, setCapFilter] = useState<"all" | "small" | "medium" | "large">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: TradingSortKey; direction: TradingSortDirection }>({ key: "company", direction: "ascending" });
  const [ratingScope, setRatingScope] = useState<RatingScope>("zone");
  const activeZone = viewer?.zone ?? "";
  const selectedZone = game.phase === "geography" ? browseZone ?? activeZone : activeZone;
  const selected =
    game.companies.find((company) => company.id === selectedId) ?? null;
  const companies = useMemo(() => {
    const source =
      tab === "portfolio"
        ? game.companies.filter((company) => holding(company, viewerId) > 0)
        : game.companies.filter((company) => company.zone === selectedZone);
    return source
      .filter((company) => filter === "all" || company.sector === filter)
      .filter((company) => capFilter === "all" || company.capCategory === capFilter)
      .filter((company) => {
        const query = search.trim().toLocaleLowerCase("fr-FR");
        return !query || [company.name, company.ticker, company.country]
          .some((value) => value?.toLocaleLowerCase("fr-FR").includes(query));
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [game.companies, tab, viewerId, selectedZone, filter, capFilter, search]);
  const sortedCompanies = useMemo(() => {
    const rows = companies.map((company) => {
      const held = holding(company, viewerId);
      const average = company.averageBuyPrice?.[viewerId];
      return {
        id: company.id,
        name: company.name,
        sector: catalogName(game.sectors, company.sector),
        capitalization: company.capCategory ?? null,
        price: amount(company.price),
        profitLoss: profitLossPercent(amount(company.price), average, held),
        held,
        available: amount(company.sharesAvailable),
        company,
      };
    });
    return sortTradingRows(rows, sort.key, sort.direction).map((row) => row.company);
  }, [companies, game.sectors, sort, viewerId]);
  useEffect(() => {
    if (tab === "statistics") {
      if (!game.companies.some((company) => company.id === selectedId))
        setSelectedId(game.companies[0]?.id ?? "");
      return;
    }
    if (!companies.some((company) => company.id === selectedId))
      setSelectedId(companies[0]?.id ?? "");
  }, [companies, game.companies, selectedId, tab]);
  const held = selected ? holding(selected, viewerId) : 0;
  const average = selected?.averageBuyPrice?.[viewerId] ?? null;
  const selectedProfitLoss = selected
    ? profitLossPercent(amount(selected.price), average, held)
    : null;
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
  const buyDisabled = !canTrade || !selected || quantity > selected.sharesAvailable || buyTotal > amount(viewer?.cash);
  const sellDisabled = !canTrade || quantity > held;
  const history = selected ? priceSeries(game.marketHistory, selected.id) : [];
  const marketOption = useMemo<EChartsOption>(() => {
    const values = selected ? priceSeries(game.marketHistory, selected.id) : [];
    const up = values.length > 1 && values.at(-1)!.price >= values[0].price;
    return {
      animation: false,
      grid: { left: 42, right: 14, top: 14, bottom: 38, containLabel: true },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v) => `${Number(v).toFixed(2)} M€`,
      },
      xAxis: {
        type: "category",
        data: values.map((v) => v.label),
        boundaryGap: false,
        axisLabel: { color: "#a9bdc9", fontSize: 9, hideOverlap: true, margin: 10 },
        axisLine: { lineStyle: { color: "#343a39" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: {
          color: "#a9bdc9",
          fontSize: 9,
          margin: 10,
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
      type: "scroll",
      bottom: 2,
      left: 10,
      right: 10,
      textStyle: { color: "#c3d0d6", fontSize: 10 },
      pageTextStyle: { color: "#a9bdc9" },
      pageIconSize: 10,
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
    },
    series: [
      {
        type: "pie",
        radius: ["56%", "82%"],
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
  const portfolioGroups = ownershipGroups
    .map((group) => ({
      ...group,
      companies: group.companies.filter((company) => holding(company, viewerId) > 0),
    }))
    .filter((group) => group.companies.length > 0)
    .sort((a, b) => `${a.zone}:${a.sector}`.localeCompare(`${b.zone}:${b.sector}`));
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
      grid: { left: 42, right: 16, top: 14, bottom: 38, containLabel: true },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => money(Number(value)),
      },
      xAxis: {
        type: "category",
        data: navHistory.map((point) => point.label),
        boundaryGap: false,
        axisLabel: { color: "#a9bdc9", fontSize: 9, hideOverlap: true, margin: 10 },
        axisLine: { lineStyle: { color: "#343a39" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: {
          color: "#a9bdc9",
          fontSize: 9,
          margin: 10,
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
      grid: { left: 42, right: 18, top: 52, bottom: 42, containLabel: true },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) =>
          ["E", "D", "C", "B", "A"][Number(value) - 1] ?? "",
      },
      legend: {
        type: "scroll",
        top: 4,
        left: 4,
        right: 4,
        textStyle: { color: "#a9bdc9", fontSize: 8 },
        pageTextStyle: { color: "#a9bdc9" },
        itemWidth: 8,
        itemHeight: 8,
      },
      xAxis: {
        type: "category",
        data: game.marketHistory.map(
          (point) => point.label || `C${point.cycle}`,
        ),
        axisLabel: { color: "#a9bdc9", fontSize: 8, hideOverlap: true, margin: 9 },
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
          <h1>{tab === "portfolio" ? "PORTEFEUILLE" : `TRADING — ${catalogName(game.zones, selectedZone).toUpperCase() || "ZONE À DÉFINIR"}`}</h1>
          <p>Cycle {game.cycle}</p>
        </div>
        <div className="td-capital">
          <span>CASH</span>
          <strong><AnimatedMoney value={amount(viewer?.cash)} /></strong>
        </div>
        <div className="td-header-actions">
          {game.phase === "market" && canAct && onEndTurn && (
            <button type="button" onClick={onEndTurn} aria-label="Terminer le marché" title="Terminer le marché">Terminer</button>
          )}
          {game.phase === "geography" && onReturnTravel && (
            <button type="button" onClick={onReturnTravel} aria-label="Retour à la décision de voyage" title="Retour à la décision de voyage">Voyage</button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Retour au plateau" title="Retour au plateau">×</button>
          )}
        </div>
      </header>
      <nav className="td-tabs" aria-label="Vues du marché">
        {(
          [
            ["market", "Marché"],
            ["portfolio", "Portefeuille"],
            ["analysis", "Analyse"],
            ["statistics", "Statistiques"],
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
      ) : tab === "statistics" ? (
        <div className="td-statistics">
          <article className="td-card td-nav-history">
            <span className="td-eyebrow">VALEUR DU FONDS</span>
            <h2>Historique de la valeur liquidative</h2>
            {navHistory.length > 1 ? <Chart option={navOption} label={`Historique NAV : ${navHistory.map((p) => `${p.label} ${money(p.value)}`).join("; ")}`} /> : <p className="td-empty">{navHistory.length ? `Un relevé réel : ${money(navHistory[0].value)}` : "Aucun historique de valeur enregistré."}</p>}
          </article>
          <article className="td-card td-rating-history">
            <span className="td-eyebrow">FONDAMENTAUX</span><h2>Évolution des notations</h2>
            <div className="td-rating-tabs" role="group" aria-label="Groupe de notations">
              <button className={ratingScope === "zone" ? "active" : ""} onClick={() => setRatingScope("zone")}>Zones</button>
              <button className={ratingScope === "sector" ? "active" : ""} onClick={() => setRatingScope("sector")}>Secteurs</button>
            </div>
            {game.marketHistory.length > 1 ? <Chart option={ratingOption} label={`Historique des notations par ${ratingScope === "zone" ? "zone" : "secteur"}`} /> : <p className="td-empty">Historique insuffisant pour afficher une évolution.</p>}
          </article>
          <article className="td-card td-nav-history td-company-history">
            <span className="td-eyebrow">COTATIONS HISTORIQUES</span><h2>Historique des cours</h2>
            <label className="td-filter"><span className="sr-only">Entreprise à analyser</span><select value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>{game.companies.map((company) => <option key={company.id} value={company.id}>{company.name} · {catalogName(game.zones, company.zone)}</option>)}</select></label>
            {history.length > 1 ? <Chart option={marketOption} label={`Historique de ${selected?.name ?? "l’entreprise"} : ${history.map((p) => `${p.label} ${money(p.price)}`).join("; ")}`} /> : <p className="td-empty">{history.length ? `Un relevé réel : ${money(history[0].price)}` : "Aucun historique de cours pour cette société."}</p>}
          </article>
        </div>
      ) : (
        <div className="td-workspace">
          <section className={`td-card td-list ${tab === "portfolio" ? "is-portfolio" : ""}`}>
            <div className="td-list-head">
              <div>
                <span className="td-eyebrow">
                  {tab === "portfolio"
                    ? "VOS POSITIONS"
                    : `COTATIONS · ${catalogName(game.zones, selectedZone).toUpperCase()}`}
                </span>
                <strong>
                  {companies.length.toString().padStart(2, "0")}{" "}
                  <small>lignes</small>
                </strong>
              </div>
              <div className="td-market-filters">
                <label className="td-search">
                  <span className="sr-only">Rechercher une entreprise</span>
                  <input type="search" aria-label="Rechercher une entreprise" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Entreprise, ticker, pays" />
                </label>
                {game.phase === "geography" && onBrowseZoneChange && <label className="td-filter"><span className="sr-only">Zone à consulter</span><select value={selectedZone} onChange={(event) => onBrowseZoneChange(event.target.value)}>{game.zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.id === activeZone ? " · position" : ""}</option>)}</select></label>}
                <label className="td-filter">
                  <span className="sr-only">Filtrer par secteur</span>
                  <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                    <option value="all">Tous les secteurs</option>
                    {game.sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
                  </select>
                </label>
                <label className="td-filter">
                  <span className="sr-only">Filtrer par taille de capitalisation</span>
                  <select value={capFilter} onChange={(event) => setCapFilter(event.target.value as typeof capFilter)}>
                    <option value="all">Tous</option>
                    <option value="small">Small Cap</option>
                    <option value="medium">Medium Cap</option>
                    <option value="large">Large Cap</option>
                  </select>
                </label>
              </div>
            </div>
            {tab === "portfolio" && <section className="td-portfolio-groups" tabIndex={0} aria-label="Groupes de contrôle par zone et secteur">{portfolioGroups.map((group) => { const controlled = group.companies.filter((company) => holding(company, viewerId) === 5).length; const total = game.companies.filter((company) => company.zone === group.zone && company.sector === group.sector).length; const complete = controlled === total && total > 0; return <article className={`td-portfolio-group ${complete ? "complete" : ""}`} key={`${group.zone}:${group.sector}`}><header>{complete && <Network size={14} aria-label="Monopole" />}<strong>{catalogName(game.zones, group.zone)} · {catalogName(game.sectors, group.sector)}</strong><small>{controlled}/{total} contrôlées</small></header><div className="td-group-companies">{group.companies.map((company) => <span key={company.id} title={`${company.name} : ${holding(company, viewerId)}/5 parts`}>{company.name}<b>{holding(company, viewerId)}/5</b><i><i style={{width:`${holding(company, viewerId) * 20}%`}} /></i></span>)}</div><footer>{complete ? <><Network size={11} /> Monopole · revenu minimum A/A</> : <><span className="td-progress-symbol" aria-hidden="true">◌</span> Parts détenues · seuil 5/5 pour C/C</>}</footer></article>; })}</section>}
            <div className="td-table-scroll">
              <div className="td-column-head">
                {([
                  ["company", "ENTREPRISE", "entreprise", undefined],
                  ["sector", "SECTEUR", "secteur", undefined],
                  ["capitalization", "CAP", "catégorie de capitalisation : Small Cap, Medium Cap ou Large Cap", "Taille de l’entreprise : Small Cap, Medium Cap ou Large Cap"],
                  ["price", "COURS", "cours actuel par part", undefined],
                  ["profitLoss", "P/L", "plus-value ou moins-value en pourcentage par rapport au prix moyen d’achat", "P/L = (cours actuel / prix moyen − 1) × 100 ; tiret si PRU inconnu ou aucune part détenue"],
                  ["held", "DÉTENUES", "parts détenues", undefined],
                  ["available", "DISPONIBLES", "parts disponibles", undefined],
                ] as const).map(([key, label, accessibleLabel, tooltip]) => (
                  <span
                    key={key}
                    className="td-column"
                    role="columnheader"
                    aria-sort={sort.key === key ? sort.direction : "none"}
                  >
                    <button
                      type="button"
                      className="td-sort-button"
                      title={tooltip}
                      aria-label={`Trier par ${accessibleLabel}, ordre ${sort.key === key && sort.direction === "ascending" ? "décroissant" : "croissant"}`}
                      onClick={() => setSort((current) => ({
                        key,
                        direction: current.key === key && current.direction === "ascending" ? "descending" : "ascending",
                      }))}
                    >
                      {label}{sort.key === key && <span className="td-sort-indicator" aria-hidden="true">{sort.direction === "ascending" ? " ↑" : " ↓"}</span>}{key === "capitalization" && <small className="td-sort-help">Small · Medium · Large</small>}
                    </button>
                  </span>
                ))}
              </div>
              <div className="td-rows">
              {sortedCompanies.map((company) => {
                const shares = holding(company, viewerId);
                const avg = company.averageBuyPrice?.[viewerId];
                const profitLoss = profitLossPercent(amount(company.price), avg, shares);
                const monopoly = fullGroups.some(group => group.zone === company.zone && group.sector === company.sector);
                return (
                  <button
                    key={company.id}
                    className={`td-row ${selected?.id === company.id ? "selected" : ""} ${shares === 5 ? "has-control" : ""} ${monopoly ? "has-monopoly" : ""}`}
                    onClick={() => {
                      setSelectedId(company.id);
                      setQuantity(1);
                    }}
                  >
                    <span className="td-name">
                      <i className="td-company-photo"><span>{company.name.slice(0, 2).toUpperCase()}</span>{company.logoPath && <img key={company.logoPath} src={company.logoPath} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</i>
                      <b>
                        {shares === 5 && <span className="td-control-tooltip" title="5/5 parts · revenu minimum C/C"><Crown className="td-control-mark" size={12} aria-label="Contrôle total" /></span>}{company.name}
                        <small>
                          {company.ticker || company.id.toUpperCase()}{company.country ? ` · ${company.country}` : ""}
                        </small>
                      </b>
                    </span>
                    <span className="td-sector">
                      {catalogName(game.sectors, company.sector)}
                      {shares === 5 && <em className="td-row-bonus">{monopoly && <Network size={10} aria-label="Monopole" />}{monopoly ? "MONOPOLE · A/A" : "100 % · C/C"}</em>}
                    </span>
                    <span className={`td-cap-category ${company.capCategory ?? "unknown"}`} title={company.capCategory ? `${company.capCategory[0].toUpperCase()}${company.capCategory.slice(1)} Cap` : "Catégorie de taille inconnue"}>{company.capCategory?.toUpperCase() ?? "—"}</span>
                    <span className="td-price"><b><AnimatedMoney value={amount(company.price)} /></b></span>
                    <span className={`td-profit-loss ${profitLoss == null ? "unknown" : profitLoss >= 0 ? "positive" : "negative"}`}>{profitLoss == null ? "—" : formatPercent(profitLoss)}</span>
                    <span className="td-held">{shares}<small> / 5 parts</small></span>
                    <span className="td-available">{company.sharesAvailable}<small> / 5 parts</small></span>
                  </button>
                );
              })}
              {!companies.length && (
                <p className="td-empty">
                  {search.trim()
                    ? "Aucune entreprise ne correspond à cette recherche."
                    : tab === "portfolio"
                    ? "Aucune position dans votre portefeuille."
                    : "Aucune entreprise dans cette zone."}
                </p>
              )}
              </div>
            </div>
          </section>
          <aside className="td-card td-focus">
            {selected ? (
              <>
                <div className="td-focus-summary">
                <div className="td-focus-top">
                  <div>
                    <span className="td-eyebrow">FICHE VALEUR</span>
                    <h2 title={selected.name}>{selected.name}</h2>
                    <p>
                      {catalogName(game.sectors, selected.sector)}{selected.country ? ` · ${selected.country}` : ""} <i />{" "}
                      {catalogName(game.zones, selected.zone)}
                    </p>
                  </div>
                  <span className="td-monogram td-company-photo">
                    <span>{selected.name.slice(0, 2).toUpperCase()}</span>{selected.logoPath && <img key={selected.logoPath} src={selected.logoPath} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                  </span>
                </div>
                <div className="td-quote">
                  <div>
                    <span title="Cours actuel d’une part">COURS</span>
                    <strong><AnimatedMoney value={amount(selected.price)} /></strong>
                  </div>
                  <div>
                    <span title="Prix moyen d’achat par part">PRU</span>
                    <strong>{average == null ? "—" : money(average)}</strong>
                  </div>
                  <div>
                    <span title="Plus ou moins-value latente par rapport au prix moyen d’achat">P/L</span>
                    <strong className={selectedProfitLoss == null ? "unknown" : selectedProfitLoss >= 0 ? "positive" : "negative"}>{selectedProfitLoss == null ? "—" : formatPercent(selectedProfitLoss)}</strong>
                  </div>
                  <div>
                    <span>PARTS DÉTENUES</span>
                    <strong>{held} <small>/ 5</small></strong>
                  </div>
                  <div>
                    <span title="Valorisation actuelle de cette participation">VALEUR</span>
                    <strong>{money(amount(selected.price) * held)}</strong>
                  </div>
                </div>
                </div>
                <div className="td-focus-details">
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
                </div>
                <div className="td-focus-order">
                <div className="td-order-ticket">
                  <div className="td-order-quantity-label">QUANTITÉ · {money(amount(selected.price))} / PART</div>
                  <div className="td-trade">
                    <div className="td-quantity">
                      <button aria-label="Réduire la quantité" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                      <span><b>{quantity}</b><small>parts</small></span>
                      <button aria-label="Augmenter la quantité" disabled={quantity >= 5} onClick={() => setQuantity((q) => Math.min(5, q + 1))}>+</button>
                    </div>
                    <div className="td-trade-buttons">
                      <div className="td-direct-order"><button className="td-buy" aria-label="Acheter" disabled={buyDisabled} onClick={() => trade("BUY_SHARE")}>Acheter</button><small>Montant <b>{money(buyTotal)}</b></small></div>
                      <div className="td-direct-order"><button className="td-sell" aria-label="Vendre" disabled={sellDisabled} onClick={() => trade("SELL_SHARE")}>Vendre</button><small>Montant <b>{money(buyTotal)}</b></small></div>
                    </div>
                  </div>
                </div>
                {disabledReason && (
                  <p className="td-disabled-reason" role="status">
                    {game.phase === "geography" ? "Consultation libre pendant la décision de voyage. Les ordres restent disponibles en phase Marché." : disabledReason}
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
                </div>
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
