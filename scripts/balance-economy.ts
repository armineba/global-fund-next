import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createGame, chooseAiCommand, executeCommand, fundValue, ownsMonopoly, priceFor, getDecisionPlayerId } from "@global-fund/game-engine";
import type { Company, GameState, SeatConfig } from "@global-fund/shared";
import { capCategoryFor, normalizeEconomy, ECONOMY_SCENARIOS, CAP_THRESHOLDS_USD, type CapCategory } from "../packages/game-engine/src/economy.js";

// Each game has its own seed so candidate runs use the same starting random sequence.
function randomFor(seed: number) { let value = seed >>> 0; return () => { value += 0x6d2b79f5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const count = Number(process.argv[2] ?? 100);
const scenario = process.argv[3] ?? "baseline";
const seed = Number(process.argv[4] ?? 20261006);
const maximumSeconds = Number(process.argv[5] ?? 600);
const outputLabel = process.argv[6] ?? scenario;
if (!/^[a-z0-9-]+$/.test(outputLabel)) throw new Error("Invalid output label.");
const baselinePath = "docs/economy-baseline-catalog.json";
const originalCompanies: any[] = scenario === "baseline" && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")).companies : [];
const originalValues = new Map(originalCompanies.map(company => [company.id, company]));
if (!Number.isInteger(count) || count < 1 || count > 10000) throw new Error("Count must be 1..10000.");
if (scenario !== "baseline" && !ECONOMY_SCENARIOS[scenario]) throw new Error("Unknown scenario.");
const capRows = existsSync("docs/market-caps.json")
  ? JSON.parse(readFileSync("docs/market-caps.json", "utf8")).rows
  : ["americas", "europe", "world"].flatMap(region => {
  const path = `docs/market-caps-${region}.json`;
  if (!existsSync(path)) return [];
  const data = JSON.parse(readFileSync(path, "utf8"));
  return Array.isArray(data) ? data : data.rows ?? data.companies ?? [];
});
const catalogPath = "packages/game-engine/legacy/data/gameData.json";
const catalogHash = createHash("sha256").update(readFileSync(catalogPath)).digest("hex");
const researchHash = createHash("sha256").update(JSON.stringify(capRows)).digest("hex");
const caps = new Map<string, number>(capRows.filter((row: any) => Number.isFinite(row.marketCapUSD) && row.marketCapUSD > 0).map((row: any) => [row.id, row.marketCapUSD]));
const category = (company: Company): CapCategory | "unknown" => {
  const known = company as Company & { capCategory?: CapCategory; marketCapUSD?: number };
  const cap = caps.get(company.id) ?? known.marketCapUSD;
  return known.capCategory ?? (cap ? capCategoryFor(cap) : "unknown");
};
const categories = ["small", "medium", "large", "unknown"] as const;
const zeros = () => ({ small: 0, medium: 0, large: 0, unknown: 0 });
const stages = { beginning: { purchases: zeros(), shares: zeros() }, middle: { purchases: zeros(), shares: zeros() }, end: { purchases: zeros(), shares: zeros() } };
const stageFor = (cycle: number) => cycle <= 10 ? "beginning" : cycle <= 50 ? "middle" : "end";
function snapshot(state: GameState) {
  const held = zeros(); const shares = zeros(); const value = zeros();
  for (const company of state.companies) {
    const cap = category(company); const quantity = Object.values(company.holdings).reduce((sum, n) => sum + n, 0);
    held[cap] += Object.values(company.holdings).filter(n => n > 0).length;
    shares[cap] += quantity;
    value[cap] += quantity * priceFor(company, state);
  }
  const controls = state.companies.filter(company => Object.values(company.holdings).some(quantity => quantity === 5)).length;
  const monopolies = new Set(state.companies.filter(company => state.players.some(player => ownsMonopoly(state, player, company))).map(company => `${company.zone}:${company.sector}`)).size;
  return { cycle: state.cycle, averageNAV: state.players.reduce((sum, player) => sum + fundValue(state, player), 0) / state.players.length, averageCash: state.players.reduce((sum, player) => sum + player.cash, 0) / state.players.length, held, shares, value, controls, monopolies };
}
const started = performance.now(); const records: any[] = []; const failures: any[] = [];
const originalRandom = Math.random;
let commands = 0;
try {
  for (let gameIndex = 0; gameIndex < count; gameIndex++) {
    if ((performance.now() - started) / 1000 >= maximumSeconds) break;
    Math.random = randomFor(seed + gameIndex);
    const gameStarted = performance.now();
    let state = createGame((["easy", "normal", "hard"] as const).map((difficulty, index) => ({ name: difficulty, kind: "ai", startingMarket: ["europe", "americas", "asia"][index], pawn: ["lion", "bull", "globe"][index], difficulty })) as SeatConfig[]);
    if (scenario === "baseline" && originalValues.size) {
      state.companies = state.companies.map(company => { const original = originalValues.get(company.id); return original ? { ...company, basePrice: original.basePrice, baseIncome: original.baseIncome } : company; });
    }
    if (scenario !== "baseline") {
      const input = state.companies.map(company => ({ ...company, marketCapUSD: caps.get(company.id) ?? (company as Company & { marketCapUSD?: number }).marketCapUSD ?? 0 }));
      const missing = input.filter(company => !company.marketCapUSD).map(company => company.id);
      if (missing.length) throw new Error(`Missing cap research: ${missing.join(", ")}`);
      state.companies = normalizeEconomy(input, ECONOMY_SCENARIOS[scenario]);
      // Opening history must describe the candidate values rather than baseline catalogue prices.
      for (const point of state.marketHistory) point.prices = Object.fromEntries(state.companies.map(company => [company.id, priceFor(company, state)]));
    }
    let purchases = 0; let purchasedShares = 0; let income = 0; let bankIncome = 0; let performanceFlows = 0; let performanceInjections = 0; let performanceWithdrawals = 0; let marketEndsWithAffordableElsewhere = 0; let dividends = 0; let bankruptcies = 0; let latestNotice = 0; let firstLargePurchase: number | null = null;
    let peakControls = 0; let peakMonopolies = 0;
    const largeAnyMarketTurns = new Set<string>();
    const largeCurrentMarketTurns = new Set<string>();
    const largeAnyMarketRawCashTurns = new Set<string>();
    const largeCurrentMarketRawCashTurns = new Set<string>();
    const checkpoints: Record<string, ReturnType<typeof snapshot>> = { opening: snapshot(state) };
    const incomeByPlayer: Record<string, number> = Object.fromEntries(state.players.map(player => [player.id, 0]));
    try {
      for (let step = 0; !state.finished; step++) {
        if (step >= 20000) throw new Error("Command limit reached.");
        if ((performance.now() - started) / 1000 >= maximumSeconds) throw new Error("Wall time limit reached.");
        const previous = state; const player = state.players.find(p => p.id === getDecisionPlayerId(state))!;
        if (state.phase === "market") {
          const turnKey = `${state.cycle}:${player.id}`;
          if (!largeAnyMarketTurns.has(turnKey) || !largeCurrentMarketTurns.has(turnKey) || !largeAnyMarketRawCashTurns.has(turnKey) || !largeCurrentMarketRawCashTurns.has(turnKey)) {
            const reserve = player.difficulty === "hard" ? 18 : player.difficulty === "easy" ? 45 : 30;
            const largeCandidates = state.companies.filter(company => category(company) === "large" && company.available && !(state.zoneGrades[company.zone] === "E" && state.sectorGrades[company.sector] === "E") && Object.values(company.holdings).reduce((sum, n) => sum + n, 0) < 5);
            for (const company of largeCandidates) {
              const price = priceFor(company, state);
              const travelCost = company.zone === player.zone ? 0 : 1;
              if (price <= player.cash - travelCost) largeAnyMarketRawCashTurns.add(turnKey);
              if (price <= player.cash - reserve - travelCost) largeAnyMarketTurns.add(turnKey);
              if (company.zone === player.zone && price <= player.cash) largeCurrentMarketRawCashTurns.add(turnKey);
              if (company.zone === player.zone && price <= player.cash - reserve) largeCurrentMarketTurns.add(turnKey);
            }
          }
        }
        const command = chooseAiCommand(state, player.difficulty);
        if (command.type === "END_TURN" && state.phase === "market") {
          const reserve = player.difficulty === "hard" ? 18 : player.difficulty === "easy" ? 45 : 30;
          if (state.companies.some(company => company.zone !== player.zone && company.available && !(state.zoneGrades[company.zone] === "E" && state.sectorGrades[company.sector] === "E") && Object.values(company.holdings).reduce((sum, n) => sum + n, 0) < 5 && priceFor(company, state) <= player.cash - reserve - 1)) marketEndsWithAffordableElsewhere++;
        }
        state = executeCommand(state, player.id, command); commands++;
        // Reporting history is independent from rules; retain the last seq/deduplication point.
        state.marketHistory = state.marketHistory.slice(-2);
        for (const [index, next] of state.players.entries()) {
          const flow = Number(next.capitalFlows ?? 0) - Number(previous.players[index].capitalFlows ?? 0);
          performanceFlows += flow;
          if (flow > 0) performanceInjections += flow;
          if (flow < 0) performanceWithdrawals -= flow;
        }
        if (command.type === "BUY_SHARE") {
          purchases++; purchasedShares += command.quantity;
          const company = state.companies.find(company => company.id === command.companyId)!;
          const cap = category(company); const stage = stages[stageFor(previous.cycle)];
          stage.purchases[cap]++; stage.shares[cap] += command.quantity;
          if (cap === "large" && firstLargePurchase === null) firstLargePurchase = previous.cycle;
        }
        bankruptcies += state.companies.filter(company => !company.available && previous.companies.find(before => before.id === company.id)?.available).length;
        for (const notice of state.notices.filter(notice => notice.id > latestNotice)) {
          for (const payment of notice.payments ?? []) if (payment.toId && payment.companyId) { income += payment.amount; incomeByPlayer[payment.toId] += payment.amount; if (!payment.fromId) bankIncome += payment.amount; }
          for (const line of notice.effectLines ?? []) {
            const match = line.match(/reçoit ([\d.,]+) M€ de dividende/);
            if (match) dividends += Number(match[1].replace(",", "."));
          }
          latestNotice = Math.max(latestNotice, notice.id);
        }
        if (command.type === "BUY_SHARE" || state.cycle !== previous.cycle || state.finished) {
          const current = snapshot(state); peakControls = Math.max(peakControls, current.controls); peakMonopolies = Math.max(peakMonopolies, current.monopolies);
          for (const cycle of [10, 35, 70]) if (state.cycle >= cycle && !checkpoints[cycle]) checkpoints[cycle] = current;
        }
      }
      records.push({ game: gameIndex + 1, seed: seed + gameIndex, durationSeconds: (performance.now() - gameStarted) / 1000, purchases, purchasedShares, sectorIncome: income, bankIncome, performanceFlows, performanceInjections, performanceWithdrawals, marketEndsWithAffordableElsewhere, dividends, incomeByPlayer, bankruptcies, insolventFunds: state.players.filter(player => !player.solvent).length, firstLargePurchase, largeAnyMarketTurns: largeAnyMarketTurns.size, largeCurrentMarketTurns: largeCurrentMarketTurns.size, largeAnyMarketRawCashTurns: largeAnyMarketRawCashTurns.size, largeCurrentMarketRawCashTurns: largeCurrentMarketRawCashTurns.size, largeOpportunityStages: Object.fromEntries(["beginning", "middle", "end"].map(stage => [stage, Object.fromEntries(Object.entries({ currentMarketRawCash: largeCurrentMarketRawCashTurns, currentMarketAfterReserve: largeCurrentMarketTurns, anyMarketRawCashAfterTravel: largeAnyMarketRawCashTurns, anyMarketAfterReserveAndTravel: largeAnyMarketTurns }).map(([scope, keys]) => [scope, [...keys].filter(key => stageFor(Number(key.split(":")[0])) === stage).length]))])), peakControls, peakMonopolies, checkpoints, final: snapshot(state), players: state.players.map(player => ({ difficulty: player.difficulty, nav: fundValue(state, player), cash: player.cash, solvent: player.solvent })) });
    } catch (error) { failures.push({ game: gameIndex + 1, cycle: state.cycle, phase: state.phase, error: String(error) }); break; }
    if ((gameIndex + 1) % 10 === 0) console.error(`${scenario}: ${gameIndex + 1}/${count} completed, ${Math.round((performance.now() - started) / 1000)}s`);
  }
} finally { Math.random = originalRandom; }
const average = (fn: (record: any) => number) => records.length ? records.reduce((sum, record) => sum + fn(record), 0) / records.length : 0;
const checkpointSummary = Object.fromEntries(["opening", "10", "35", "70", "final"].map(key => {
  const available = records.map(record => key === "final" ? record.final : record.checkpoints[key]).filter(Boolean);
  const mean = (fn: (item: any) => number) => available.length ? available.reduce((sum, item) => sum + fn(item), 0) / available.length : 0;
  return [key, { games: available.length, averageNAV: mean(item => item.averageNAV), averageCash: mean(item => item.averageCash), heldCompaniesPerFund: Object.fromEntries(categories.map(cap => [cap, mean(item => item.held[cap]) / 3])), sharesPerFund: Object.fromEntries(categories.map(cap => [cap, mean(item => item.shares[cap]) / 3])), controlsPerGame: mean(item => item.controls), monopoliesPerGame: mean(item => item.monopolies) }];
}));
const finalPlayers = records.flatMap(record => record.players);
const survivors = finalPlayers.filter(player => player.solvent);
const median = (values: number[]) => { const ordered = values.slice().sort((a, b) => a - b); const middle = Math.floor(ordered.length / 2); return ordered.length ? ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2 : 0; };
const quantile = (values: number[], p: number) => { const ordered = values.slice().sort((a, b) => a - b); if (!ordered.length) return null; const position = (ordered.length - 1) * p; const low = Math.floor(position); return ordered[low] + ((ordered[low + 1] ?? ordered[low]) - ordered[low]) * (position - low); };
const firstLargeCycles = records.filter(record => record.firstLargePurchase !== null).map(record => record.firstLargePurchase);
const largeOpportunitiesByStage = Object.fromEntries(["beginning", "middle", "end"].map(stage => [stage, Object.fromEntries(["currentMarketRawCash", "currentMarketAfterReserve", "anyMarketRawCashAfterTravel", "anyMarketAfterReserveAndTravel"].map(scope => [scope, { sessions: records.reduce((sum, record) => sum + (record.largeOpportunityStages?.[stage]?.[scope] ?? 0), 0), perGame: average(record => record.largeOpportunityStages?.[stage]?.[scope] ?? 0) }]))]));
const output = { scenario, outputLabel, largeOpportunitiesByStage, aiPolicy: "affordable-geography", engineIndexHash: createHash("sha256").update(readFileSync("packages/game-engine/src/index.ts")).digest("hex"), baseValuesPath: scenario === "baseline" && originalValues.size ? baselinePath : catalogPath, seed, historyRetention: 2, capThresholdsUSD: CAP_THRESHOLDS_USD, catalogPath, catalogHash, researchHash, bands: ECONOMY_SCENARIOS[scenario] ?? null, requestedGames: count, completedGames: records.length, durationSeconds: (performance.now() - started) / 1000, commands, failures, classificationCoverage: caps.size, stages, checkpoints: checkpointSummary, summary: { averageCycles: average(record => record.final.cycle), averageGameSeconds: average(record => record.durationSeconds), averageNAV: average(record => record.final.averageNAV), averageCash: average(record => record.final.averageCash), medianNAV: median(finalPlayers.map(player => player.nav)), maximumNAV: finalPlayers.length ? Math.max(...finalPlayers.map(player => player.nav)) : null, p95NAV: quantile(finalPlayers.map(player => player.nav), .95), p95SurvivorNAV: quantile(survivors.map(player => player.nav), .95), averageSurvivorNAV: survivors.length ? survivors.reduce((sum, player) => sum + player.nav, 0) / survivors.length : 0, medianSurvivorNAV: median(survivors.map(player => player.nav)), averageWinnerNAV: average(record => Math.max(...record.players.map((player: any) => player.nav))), sectorIncomePerFund: average(record => record.sectorIncome / 3), sectorBankIncomePerFund: average(record => record.bankIncome / 3), performanceFlowsPerFund: average(record => record.performanceFlows / 3), performanceInjectionsPerFund: average(record => record.performanceInjections / 3), performanceWithdrawalsPerFund: average(record => record.performanceWithdrawals / 3), marketEndsWithAffordableElsewherePerGame: average(record => record.marketEndsWithAffordableElsewhere), dividendsPerFund: average(record => record.dividends / 3), purchasesPerFund: average(record => record.purchases / 3), purchasedSharesPerFund: average(record => record.purchasedShares / 3), bankruptciesPerGame: average(record => record.bankruptcies), insolventFunds: records.reduce((sum, record) => sum + record.insolventFunds, 0), gamesWithAffordableLarge: records.filter(record => record.largeAnyMarketTurns > 0).length, affordableLargeAnyMarketTurnsPerGame: average(record => record.largeAnyMarketTurns), affordableLargeCurrentMarketTurnsPerGame: average(record => record.largeCurrentMarketTurns), affordableLargeAnyMarketRawCashTurnsPerGame: average(record => record.largeAnyMarketRawCashTurns), affordableLargeCurrentMarketRawCashTurnsPerGame: average(record => record.largeCurrentMarketRawCashTurns), gamesWithLargePurchase: firstLargeCycles.length, medianFirstLargeCycle: firstLargeCycles.length ? median(firstLargeCycles) : null, gamesWithLargePurchaseByCycle10: records.filter(record => record.firstLargePurchase !== null && record.firstLargePurchase <= 10).length, minimumFirstLargeCycle: Math.min(...records.filter(record => record.firstLargePurchase !== null).map(record => record.firstLargePurchase)), averageFirstLargeCycle: records.filter(record => record.firstLargePurchase !== null).reduce((sum, record, _, all) => sum + record.firstLargePurchase / all.length, 0), peakControlsPerGame: average(record => record.peakControls), peakMonopoliesPerGame: average(record => record.peakMonopolies) }, records };
const path = `docs/economy-simulation-${outputLabel}.json`;
writeFileSync(path, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ path, ...output.summary, ...{ completedGames: output.completedGames, durationSeconds: output.durationSeconds, failures } }, null, 2));
