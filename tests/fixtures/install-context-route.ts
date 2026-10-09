import type { createServer } from "../../apps/server/src/server.js";

/** Put a real, market-moving context card next in the deck for deterministic browser coverage. */
export function installContextFixtureRoute(service: Awaited<ReturnType<typeof createServer>>) {
  service.app.post<{ Body: { roomId?: string } }>("/__test/context-fixture", async (request, reply) => {
    const roomId = request.body?.roomId;
    const room = typeof roomId === "string" ? service.rooms.get(roomId) : undefined;
    const state = room?.state;
    if (!state) return reply.code(404).send({ error: "Game room not found." });

    const index = state.deck.findIndex(card => card.changes.some(change =>
      (change.scope === "zone" ? state.zoneGrades : state.sectorGrades)[change.id] !== change.grade,
    ));
    if (index < 0) return reply.code(500).send({ error: "No market-moving context card is available." });
    const [card] = state.deck.splice(index, 1);
    state.deck.unshift(card!);
    return { ok: true };
  });
}
