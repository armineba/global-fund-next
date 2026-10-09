import { describe, expect, it } from "vitest";
import { chooseAiCommand, createGame, executeCommand } from "@global-fund/game-engine";
import type { Company, Difficulty, GameState } from "@global-fund/shared";

function fixture(difficulty: Difficulty, cash: number): GameState {
  const state = createGame([
    { name: "Alpha", kind: "ai", startingMarket: "europe", pawn: "lion", difficulty },
    { name: "Bravo", kind: "ai", startingMarket: "asia", pawn: "bull", difficulty: "normal" },
  ]);
  state.cycle = 2;
  state.phase = "geography";
  state.stage = "geography";
  const player = state.players[state.activeIndex];
  player.zone = "europe";
  player.currentMarket = "europe";
  player.geoResolved = false;
  player.cash = cash;
  state.companies = [];
  return state;
}
function company(id: string, zone: string, price: number, yieldRatio = .1): Company {
  return { id, name: id, zone, sector: "industry", basePrice: price * 5, baseIncome: price * 5 * yieldRatio, holdings: {}, costBasis: {}, available: true, price, income: price * yieldRatio, totalHeld: 0, sharesAvailable: 5, averageBuyPrice: {} };
}
const reserveFor = (difficulty: Difficulty) => difficulty === "hard" ? 18 : 30;

describe("AI geography respects the existing trade budget", () => {
  it.each(["normal", "hard"] as const)("%s ignores the unaffordable high yield destination", difficulty => {
    const state = fixture(difficulty, reserveFor(difficulty) + 11);
    state.companies = [company("expensive", "americas", 100, .9), company("affordable", "asia", 10, .08)];
    expect(chooseAiCommand(state, difficulty)).toEqual({ type: "MOVE", zoneId: "asia" });
  });

  it.each(["normal", "hard"] as const)("%s moves to an affordable market despite an empty home market", difficulty => {
    const state = fixture(difficulty, reserveFor(difficulty) + 6);
    state.companies = [company("unaffordable-home", "europe", 100), company("affordable-abroad", "oceania", 5, .01)];
    expect(chooseAiCommand(state, difficulty)).toEqual({ type: "MOVE", zoneId: "oceania" });
  });

  it.each(["normal", "hard"] as const)("%s stays when travel would leave no affordable title", difficulty => {
    const state = fixture(difficulty, reserveFor(difficulty) + 10);
    state.companies = [company("travel-over-budget", "americas", 10)];
    expect(chooseAiCommand(state, difficulty)).toEqual({ type: "STAY" });
  });

  it.each(["normal", "hard"] as const)("%s can buy legally at the exact post-travel budget", difficulty => {
    const reserve = reserveFor(difficulty);
    let state = fixture(difficulty, reserve + 11);
    state.companies = [company("exact-budget", "americas", 10)];
    const playerId = state.players[state.activeIndex].id;
    const travel = chooseAiCommand(state, difficulty);
    expect(travel).toEqual({ type: "MOVE", zoneId: "americas" });
    state = executeCommand(state, playerId, travel);
    expect(state.players[state.activeIndex].cash).toBe(reserve + 10);
    state.phase = "market";
    state.stage = "market";
    const buy = chooseAiCommand(state, difficulty);
    expect(buy).toEqual({ type: "BUY_SHARE", companyId: "exact-budget", quantity: 1 });
    const next = executeCommand(state, playerId, buy);
    expect(next.players[next.activeIndex].cash).toBe(reserve);
    expect(next.companies[0].holdings[playerId]).toBe(1);
  });

  it("excludes unavailable, E/E and fully held companies from destinations", () => {
    const state = fixture("normal", 100);
    const unavailable = company("unavailable", "americas", 1, .9);
    unavailable.available = false;
    const fullyHeld = company("fully-held", "oceania", 1, .9);
    fullyHeld.holdings = { [state.players[1].id]: 5 };
    const doubleE = company("double-e", "africa", 1, .9);
    state.zoneGrades.africa = "E";
    state.sectorGrades.industry = "E";
    state.companies = [unavailable, fullyHeld, doubleE, company("eligible", "asia", 1, .01)];
    expect(chooseAiCommand(state, "normal")).toEqual({ type: "MOVE", zoneId: "asia" });
  });

  it("keeps the stay bonus when the home market contains an affordable title", () => {
    const state = fixture("normal", 100);
    state.companies = [company("home", "europe", 10), company("abroad", "americas", 10)];
    expect(chooseAiCommand(state, "normal")).toEqual({ type: "STAY" });
  });

  it("keeps easy AI's conservative stay choice", () => {
    const state = fixture("easy", 100);
    state.companies = [company("abroad", "americas", 1, .9)];
    expect(chooseAiCommand(state, "easy")).toEqual({ type: "STAY" });
  });
});
