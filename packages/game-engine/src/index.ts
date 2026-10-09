import { createRequire } from "node:module";
import { diversifyStartingMarkets, isMarketId, marketFromLegacyNationality } from "@global-fund/shared";
import type {
  Company,
  Difficulty,
  GameCommand,
  GameState,
  GameView,
  Player,
  SeatConfig,
} from "@global-fund/shared";

const require = createRequire(import.meta.url);
interface LegacyCore {
  createGame(seats: SeatConfig[]): GameState;
  applyAction(
    state: GameState,
    playerId: string,
    action: string,
    payload?: Record<string, unknown>,
  ): GameState;
  publicState(state: GameState): GameView;
  priceFor(company: Company, state: GameState): number;
  incomeFor(company: Company, state: GameState): number;
  incomeForHolder(company: Company, state: GameState, playerId: string): number;
  ownsMonopoly(state: GameState, player: Player, company: Company): boolean;
  fundValue(state: GameState, player: Player): number;
  data: {
    zones: GameView["zones"];
    sectors: GameView["sectors"];
    board: GameView["board"];
  };
  nationalities: { id: string; name: string; flag: string; zoneId: string }[];
}
const core = require("../legacy/game.cjs") as LegacyCore;

/** Read adapter for old clients/saves only. New funds choose a market directly. */
export const nationalities = structuredClone(core.nationalities);
export const zones = structuredClone(core.data.zones);
export const sectors = structuredClone(core.data.sectors);
export const board = structuredClone(core.data.board);

const difficulties: Difficulty[] = ["easy", "normal", "hard"];
const pawns = ["lion", "bull", "globe", "crystal", "tower", "leaf"];

type LegacySeatConfig = Omit<SeatConfig, "startingMarket"> & { startingMarket?: never; nationality: string };

/** Opening at C, with free market placement and diversified AI fund locations. */
export function createGame(seats: (SeatConfig | LegacySeatConfig)[]): GameState {
  if (!Array.isArray(seats) || seats.length < 2 || seats.length > 6)
    throw new Error("La partie doit compter de 2 à 6 joueurs.");
  for (const seat of seats) {
    if (
      !seat ||
      typeof seat.name !== "string" ||
      !seat.name.trim() ||
      seat.name.length > 40
    )
      throw new Error("Nom de joueur invalide.");
    if (!["local", "remote", "ai"].includes(seat.kind))
      throw new Error("Type de joueur invalide.");
    if (Object.hasOwn(seat, "startingMarket")
      ? !isMarketId(seat.startingMarket)
      : !marketFromLegacyNationality(seat.nationality))
      throw new Error("Place de marché inconnue.");
    if (!pawns.includes(seat.pawn)) throw new Error("Pion inconnu.");
    if (!difficulties.includes(seat.difficulty))
      throw new Error("Difficulté inconnue.");
  }
  return refreshState(
    core.createGame(diversifyStartingMarkets(seats.map((seat) => ({
      name: seat.name.trim(),
      kind: seat.kind,
      startingMarket: isMarketId(seat.startingMarket) ? seat.startingMarket : marketFromLegacyNationality(seat.nationality)!,
      ...(marketFromLegacyNationality(seat.nationality) ? { nationality: seat.nationality } : {}),
      pawn: seat.pawn,
      difficulty: seat.difficulty,
    })))),
  );
}

const allowedFields: Record<GameCommand["type"], string[]> = {
  STAY: ["type"],
  MOVE: ["type", "zoneId"],
  ROLL: ["type"],
  PRISON_ROLL: ["type"],
  BUY_SHARE: ["type", "companyId", "quantity"],
  SELL_SHARE: ["type", "companyId", "quantity"],
  END_TURN: ["type"],
  NEXT_TURN: ["type"],
  LIQUIDATE_ASSETS: ["type", "assets"],
  PROPOSE_SETTLEMENT: ["type", "assets"],
  ACCEPT_SETTLEMENT: ["type"],
  REJECT_SETTLEMENT: ["type"],
  REQUIRE_CASH: ["type"],
};

function validateCommand(command: GameCommand): void {
  if (!command || typeof command !== "object" || Array.isArray(command))
    throw new Error("Commande invalide.");
  if (
    !Object.hasOwn(command, "type") ||
    !Object.hasOwn(allowedFields, command.type)
  )
    throw new Error("Commande inconnue.");
  const fields = allowedFields[command.type];
  if (Object.keys(command).some((field) => !fields.includes(field)))
    throw new Error(
      "Champ de commande interdit : les dés sont tirés par le serveur.",
    );
  if (command.type === "LIQUIDATE_ASSETS" || command.type === "PROPOSE_SETTLEMENT") {
    if (!Array.isArray(command.assets) || !command.assets.length || command.assets.some((asset) =>
      !asset || typeof asset !== "object" || Object.keys(asset).some((field) => !["companyId", "quantity"].includes(field)) ||
      typeof asset.companyId !== "string" || !asset.companyId || !Number.isInteger(asset.quantity) || asset.quantity < 1 || asset.quantity > 5))
      throw new Error("Sélection de titres invalide.");
  }
  if (
    command.type === "MOVE" &&
    !isMarketId(command.zoneId)
  )
    throw new Error("Zone invalide.");
  if (command.type === "BUY_SHARE" || command.type === "SELL_SHARE") {
    if (
      typeof command.companyId !== "string" ||
      !command.companyId ||
      !Number.isInteger(command.quantity) ||
      command.quantity < 1 ||
      command.quantity > 5
    ) {
      throw new Error("Quantité ou entreprise invalide.");
    }
  }
}

/** Transactions run on a clone: both successful and rejected commands leave the input untouched. */
export function executeCommand(
  state: GameState,
  playerId: string,
  command: GameCommand,
): GameState {
  validateCommand(command);
  const next = structuredClone(state);
  switch (command.type) {
    case "STAY":
      core.applyAction(next, playerId, "stay");
      break;
    case "MOVE":
      core.applyAction(next, playerId, "move", { zoneId: command.zoneId });
      break;
    case "ROLL":
      core.applyAction(next, playerId, "roll");
      break;
    case "PRISON_ROLL":
      core.applyAction(next, playerId, "prisonRoll");
      break;
    case "BUY_SHARE":
    case "SELL_SHARE":
      core.applyAction(next, playerId, "trade", {
        side: command.type === "BUY_SHARE" ? "buy" : "sell",
        companyId: command.companyId,
        quantity: command.quantity,
      });
      break;
    case "END_TURN":
      core.applyAction(next, playerId, "endMarket");
      break;
    case "LIQUIDATE_ASSETS":
    case "PROPOSE_SETTLEMENT":
      core.applyAction(next, playerId, command.type === "LIQUIDATE_ASSETS" ? "liquidateAssets" : "proposeSettlement", { assets: command.assets });
      break;
    case "ACCEPT_SETTLEMENT":
    case "REJECT_SETTLEMENT":
    case "REQUIRE_CASH":
      core.applyAction(next, playerId, ({ ACCEPT_SETTLEMENT: "acceptSettlement", REJECT_SETTLEMENT: "rejectSettlement", REQUIRE_CASH: "requireCash" })[command.type]);
      break;
    case "NEXT_TURN":
      core.applyAction(next, playerId, "nextTurn");
      break;
  }
  return refreshState(next);
}

function refreshState(state: GameState): GameState {
  const view = core.publicState(state);
  state.players = view.players;
  state.companies = view.companies.map((company) => ({
    ...company,
    costBasis:
      state.companies.find((item) => item.id === company.id)?.costBasis ?? {},
  }));
  state.marketHistory = view.marketHistory;
  return state;
}

/** Return a detached snapshot without exposing hidden decks or purchase basis. */
export function getGameView(state: GameState): GameView {
  return core.publicState(structuredClone(state));
}

export function priceFor(company: Company, state: GameState): number {
  return core.priceFor(company, state);
}
export function incomeFor(company: Company, state: GameState): number {
  return core.incomeFor(company, state);
}
export function incomeForHolder(
  company: Company,
  state: GameState,
  playerId: string,
): number {
  return core.incomeForHolder(company, state, playerId);
}
export function ownsMonopoly(
  state: GameState,
  player: Player,
  company: Company,
): boolean {
  return core.ownsMonopoly(state, player, company);
}
export function fundValue(state: GameState, player: Player): number {
  return core.fundValue(state, player);
}

/** Settlement can ask a creditor outside the active player's turn. */
export function getDecisionPlayerId(state: GameState | GameView): string {
  return state.pendingSettlement?.decisionActorId ?? state.players[state.activeIndex].id;
}

function chooseSettlementCommand(state: GameState, difficulty: Difficulty): GameCommand {
  const pending = state.pendingSettlement!;
  const debtor = state.players.find((player) => player.id === pending.debtorId)!;
  if (pending.status === "awaitingCreditor") {
    const creditor = state.players.find((player) => player.id === pending.creditorId)!;
    const offer = pending.offer!;
    if (offer.cashDelta < 0 && creditor.cash < -offer.cashDelta) return { type: "REQUIRE_CASH" };
    const strategic = offer.assets.some((asset) => {
      const company = state.companies.find((item) => item.id === asset.companyId)!;
      return (company.holdings[creditor.id] || 0) > 0 || company.zone === creditor.zone || company.capCategory === "large";
    });
    const reserve = difficulty === "hard" ? 8 : difficulty === "normal" ? 15 : 25;
    return strategic && creditor.cash + offer.cashDelta >= reserve
      ? { type: "ACCEPT_SETTLEMENT" } : { type: "REQUIRE_CASH" };
  }
  const companies = state.companies.filter((company) => company.available && priceFor(company, state) > 0 && (company.holdings[debtor.id] || 0) > 0)
    .sort((a, b) => incomeFor(a, state) / priceFor(a, state) - incomeFor(b, state) / priceFor(b, state) || a.id.localeCompare(b.id));
  const assets: { companyId: string; quantity: number }[] = [];
  let value = 0;
  for (const company of companies) {
    if (debtor.cash + value >= pending.amount) break;
    const quantity = Math.min(company.holdings[debtor.id], Math.ceil((pending.amount - debtor.cash - value) / priceFor(company, state)));
    assets.push({ companyId: company.id, quantity }); value += quantity * priceFor(company, state);
  }
  return { type: pending.creditorId && !pending.marketOnly && debtor.cash + value >= pending.amount ? "PROPOSE_SETTLEMENT" : "LIQUIDATE_ASSETS", assets };
}

function quality(
  state: GameState,
  company: Company,
  difficulty: Difficulty,
): number {
  const held = Object.values(company.holdings).reduce(
    (sum, quantity) => sum + quantity,
    0,
  );
  const active = state.players[state.activeIndex];
  const controlled = company.holdings[active.id] || 0;
  const yieldRatio =
    incomeFor(company, state) / Math.max(0.01, priceFor(company, state));
  if (difficulty === "easy") return 1;
  const group = state.companies.filter(
    (item) => item.zone === company.zone && item.sector === company.sector,
  );
  const ownership =
    difficulty === "hard"
      ? group.reduce((sum, item) => sum + (item.holdings[active.id] || 0), 0) /
        (group.length * 5)
      : 0;
  return (
    yieldRatio + controlled * 0.015 + ownership * 0.15 + (held < 5 ? 0.01 : 0)
  );
}

/** AI chooses only legal domain commands; dice and events remain engine outcomes. */
export function chooseAiCommand(
  state: GameState,
  difficulty: Difficulty = "normal",
): GameCommand {
  if (!difficulties.includes(difficulty))
    throw new Error("Difficulté inconnue.");
  if (state.finished || state.phase === "finished")
    throw new Error("La partie est terminée.");
  if (state.pendingSettlement) return chooseSettlementCommand(state, difficulty);
  const player = state.players[state.activeIndex];
  if (!player.solvent || state.phase === "awaitNext")
    return { type: "NEXT_TURN" };
  if (state.phase === "geography") {
    if (player.jailed) return { type: "PRISON_ROLL" };
    if (difficulty === "easy") return { type: "STAY" };
    const reserve = difficulty === "hard" ? 18 : 30;
    const ranked = state.zones
      .map((zone) => {
        const travelCost = zone.id === player.zone ? 0 : 1;
        const candidates = state.companies.filter(
          (company) =>
            company.zone === zone.id &&
            company.available &&
            !(state.zoneGrades[company.zone] === "E" && state.sectorGrades[company.sector] === "E") &&
            Object.values(company.holdings).reduce((sum, value) => sum + value, 0) < 5 &&
            priceFor(company, state) <= player.cash - reserve - travelCost,
        );
        return {
          id: zone.id,
          value: candidates.reduce(
            (best, company) => Math.max(best, quality(state, company, difficulty)),
            0,
          ) + (candidates.length && zone.id === player.zone ? 0.025 : 0),
        };
      })
      .sort((a, b) => b.value - a.value);
    return !ranked[0] || ranked[0].value <= 0 || ranked[0].id === player.zone || player.cash <= 1
      ? { type: "STAY" }
      : { type: "MOVE", zoneId: ranked[0].id };
  }
  if (state.phase === "sector") return { type: "ROLL" };
  if (state.phase !== "market" || player.jailed) return { type: "END_TURN" };
  const reserve =
    difficulty === "hard" ? 18 : difficulty === "normal" ? 30 : 45;
  const candidates = state.companies.filter(
    (company) =>
      company.zone === player.zone &&
      company.available &&
      !(
        state.zoneGrades[company.zone] === "E" &&
        state.sectorGrades[company.sector] === "E"
      ) &&
      Object.values(company.holdings).reduce((sum, value) => sum + value, 0) <
        5 &&
      priceFor(company, state) <= player.cash - reserve,
  );
  if (!candidates.length) return { type: "END_TURN" };
  const chosen =
    difficulty === "easy"
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : candidates.sort(
          (a, b) =>
            quality(state, b, difficulty) - quality(state, a, difficulty),
        )[0];
  const remaining =
    5 - Object.values(chosen.holdings).reduce((sum, value) => sum + value, 0);
  const quantity = Math.min(
    remaining,
    Math.floor((player.cash - reserve) / priceFor(chosen, state)),
    difficulty === "easy" ? 1 : 5,
  );
  return { type: "BUY_SHARE", companyId: chosen.id, quantity };
}

export interface SimulationSummary {
  games: number;
  completed: number;
  commands: number;
  averageCycles: number;
  insolventFunds: number;
  bankruptCompanies: number;
  wins: Record<Difficulty, number>;
}

/** Run complete games through the same public command API used by the server. */
export function simulateGames(count: number): SimulationSummary {
  if (!Number.isInteger(count) || count < 1 || count > 10000)
    throw new Error(
      "Le nombre de simulations doit être compris entre 1 et 10000.",
    );
  const summary: SimulationSummary = {
    games: count,
    completed: 0,
    commands: 0,
    averageCycles: 0,
    insolventFunds: 0,
    bankruptCompanies: 0,
    wins: { easy: 0, normal: 0, hard: 0 },
  };
  const difficulties: Difficulty[] = ["easy", "normal", "hard"];
  for (let index = 0; index < count; index += 1) {
    let state = createGame(
      difficulties.map((difficulty, seat) => ({
        name: difficulty,
        kind: "ai",
        startingMarket: ["europe", "americas", "asia"][seat] as SeatConfig["startingMarket"],
        pawn: ["lion", "bull", "globe"][seat] as SeatConfig["pawn"],
        difficulty,
      })),
    );
    // Each successful command advances a phase or uses a finite cash/share budget.
    for (let step = 0; !state.finished; step += 1) {
      if (step >= 20000)
        throw new Error(
          `Simulation ${index + 1} bloquée au cycle ${state.cycle}.`,
        );
      const active = state.players.find((player) => player.id === getDecisionPlayerId(state))!;
      state = executeCommand(
        state,
        active.id,
        chooseAiCommand(state, active.difficulty),
      );
      summary.commands += 1;
    }
    summary.completed += 1;
    summary.averageCycles += state.cycle;
    summary.insolventFunds += state.players.filter(
      (player) => !player.solvent,
    ).length;
    summary.bankruptCompanies += state.log.filter((line) =>
      line.startsWith("Faillite de "),
    ).length;
    for (const winnerId of state.winnerIds)
      summary.wins[
        state.players.find((player) => player.id === winnerId)!.difficulty!
      ] += 1;
  }
  summary.averageCycles =
    Math.round((summary.averageCycles / count) * 100) / 100;
  return summary;
}
