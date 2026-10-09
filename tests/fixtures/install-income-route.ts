import { createHash, randomBytes, randomUUID } from "node:crypto";
import { executeCommand, getGameView } from "@global-fund/game-engine";
import { PLAYER_COLORS, type Player, type RoomPlayer, type Session } from "@global-fund/shared";
import type { createServer } from "../../apps/server/src/server.js";
import { createIndustrySettlementReady } from "./settlement.js";

/** A real AI sector roll with 1 M€ paid by the AI to the human investor and no change to market prices.
 * Installed only in the isolated browser test server, never in production. */
export function installIncomeFixtureRoute(service: Awaited<ReturnType<typeof createServer>>) {
  service.app.post("/__test/income-fixture", async () => {
    const state = createIndustrySettlementReady();
    state.players.forEach(player => { player.cash = 100; });
    state.players[1]!.bot = true;
    state.activeIndex = 1;
    for (const company of state.companies) { company.holdings = {}; company.costBasis = {}; }
    const company = state.companies.find(entry => entry.sector === "energy")!;
    company.basePrice = 125;
    company.baseIncome = 5;
    company.holdings = { p1: 1, p2: 1 };
    company.costBasis = { p1: 25, p2: 25 };
    // Stay clear of Départ so the fixture contains only the one-sector income.
    const position = state.board.findIndex((cell, index) => index >= 6 && cell.kind === "sector" && cell.sector === "energy");
    if (position < 6) throw new Error("No Energy cell for income fixture.");
    state.players[1]!.sectorPosition = position - 6;
    state.players = getGameView(state).players as Player[];
    state.notices = [];
    state.noticeSeq = 0;
    const priorRandom = Math.random;
    Math.random = () => 0.999999;
    let after;
    try { after = executeCommand(state, "p2", { type: "ROLL" }); } finally { Math.random = priorRandom; }
    if (after.players[0]!.cash !== 101 || after.players[1]!.cash !== 99 || after.pendingSettlement) throw new Error("Expected 1 M€ paid by the AI to the human investor and no self-income.");
    // The AI has finished; a human's next die awaits the local reading sequence.
    after.activeIndex = 0;
    after.phase = "sector";
    after.stage = "sector";
    const roomId = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
    const session: Session = { roomId, playerId: "p1", token: randomBytes(24).toString("base64url") };
    const players = after.players.map((player, index) => ({
      id: player.id, name: player.name, kind: index ? "ai" : "local", bot: !!index,
      pawn: player.pawn, startingMarket: index ? "asia" : "europe", difficulty: "normal",
      color: PLAYER_COLORS[index]!, ready: true, connected: false, controllerId: null,
      tokenHash: index ? null : createHash("sha256").update(session.token).digest("hex"),
    } satisfies RoomPlayer & { tokenHash: string | null }));
    service.rooms.set(roomId, {
      roomId, status: "playing", hostId: "", hostPlayerId: "p1", players,
      state: after, messages: [], revision: 1, commandIds: {}, chatTimes: {},
    } as never);
    return { session };
  });
}
