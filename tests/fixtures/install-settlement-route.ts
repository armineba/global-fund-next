import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PLAYER_COLORS, type RoomPlayer, type Session } from "@global-fund/shared";
import type { createServer } from "../../apps/server/src/server.js";
import { createIndustrySettlement, type SettlementFixtureOptions, settlementSeats } from "./settlement.js";

type FixtureServer = Awaited<ReturnType<typeof createServer>>;

/** Register only on an isolated test server; no production fixture endpoint exists. */
export function installSettlementFixtureRoute(service: FixtureServer) {
  service.app.post<{ Body: SettlementFixtureOptions }>("/__test/settlement-fixture", async (request, reply) => {
    const options = request.body ?? {};
    const playerCount = options.playerCount ?? 2;
    if (![2, 3].includes(playerCount)) return reply.code(400).send({ error: "Invalid fixture size." });
    const roomId = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
    const sessions: Session[] = settlementSeats.slice(0, playerCount).map((seat, index) => ({
      roomId, playerId: `p${index + 1}`, token: randomBytes(24).toString("base64url"),
    }));
    const tokenHashes = sessions.map(session => createHash("sha256").update(session.token).digest("hex"));
    const players = settlementSeats.slice(0, playerCount).map((seat, index) => ({
      id: `p${index + 1}`, name: seat.name, kind: seat.kind, bot: false, pawn: seat.pawn,
      startingMarket: seat.startingMarket, difficulty: seat.difficulty, color: PLAYER_COLORS[index]!,
      ready: true, connected: false, controllerId: null, tokenHash: tokenHashes[index]!,
    } satisfies RoomPlayer & { tokenHash: string | null }));
    const room = {
      roomId, status: "playing" as const, hostId: "", hostPlayerId: "p1", players,
      state: createIndustrySettlement(options), messages: [], revision: 1,
      commandIds: {}, chatTimes: {},
    };
    service.rooms.set(roomId, room as never);
    return { roomId, sessions };
  });
}
