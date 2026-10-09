import { afterEach, describe, expect, it } from "vitest";
import { io as clientIo, type Socket } from "socket.io-client";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../apps/server/src/server.js";
import type { ApiResult, RoomView, Session } from "@global-fund/shared";
import { createIndustrySettlementReady, settlementSeats } from "./fixtures/settlement.js";

const services: Awaited<ReturnType<typeof createServer>>[] = [];
const sockets: Socket[] = [];

afterEach(async () => {
  sockets.splice(0).forEach(socket => socket.disconnect());
  await Promise.all(services.splice(0).map(service => service.close()));
});

function emit<T = ApiResult>(socket: Socket, event: string, body?: unknown): Promise<T> {
  return new Promise((resolve, reject) => socket.timeout(5000).emit(event, body, (error: Error | null, result: T) => error ? reject(error) : resolve(result)));
}

async function connect(port: number): Promise<Socket> {
  const socket = clientIo(`http://127.0.0.1:${port}`, { transports: ["websocket"], reconnection: false });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  return socket;
}

async function startService(storageFile: string | false) {
  const service = await createServer({ storageFile });
  services.push(service);
  await service.app.listen({ host: "127.0.0.1", port: 0 });
  const address = service.app.server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP server address.");
  return { service, port: address.port };
}

describe("authoritative settlement commands", () => {
  it("persists a real sector debt and offer, authorizes the creditor, rejects stale decisions, and deduplicates acceptance", async () => {
    const folder = mkdtempSync(join(tmpdir(), "global-fund-settlement-"));
    const storageFile = join(folder, "rooms.json");
    let service: Awaited<ReturnType<typeof createServer>>;
    let host: Socket;
    let guest: Socket;
    let port: number;
    let hostSession: Session;
    let guestSession: Session;
    let room: RoomView;

    try {
      ({ service, port } = await startService(storageFile));
      host = await connect(port);
      const created = await emit(host, "room:create", { seats: settlementSeats.slice(0, 2) });
      if (!created.ok || !created.session) throw new Error("Could not create the settlement room.");
      hostSession = created.session;
      guest = await connect(port);
      const joined = await emit(guest, "room:join", { roomId: created.room.roomId, name: "Meridian Fund" });
      if (!joined.ok || !joined.session) throw new Error("Could not join the settlement room.");
      guestSession = joined.session;
      await emit(guest, "room:ready", { roomId: created.room.roomId, ready: true });
      const started = await emit(host, "room:start", { roomId: created.room.roomId });
      if (!started.ok) throw new Error("Could not start the settlement room.");
      room = started.room;

      // Install a deterministic legal board position, then use the public ROLL
      // command so the server and game engine create and persist the debt.
      const stored = service.rooms.get(room.roomId);
      if (!stored) throw new Error("Started room was not stored by the server.");
      stored.state = createIndustrySettlementReady();
      const asset = stored.state.companies.find(company => company.holdings.p1 === 1 && company.baseIncome === 30 && company.sector === "industry")!;
      const originalRandom = Math.random;
      let rolled: ApiResult;
      Math.random = () => 0.999999;
      try {
        rolled = await emit(host, "room:command", {
          roomId: room.roomId, playerId: "p1", commandId: "settlement-roll",
          expectedRevision: room.revision, command: { type: "ROLL" },
        });
      } finally { Math.random = originalRandom; }
      if (!rolled.ok) throw new Error(`Sector roll failed: ${rolled.error}`);
      room = rolled.room;
      expect(room.game?.phase).toBe("settlement");
      expect(room.game?.pendingSettlement).toMatchObject({ debtorId: "p1", creditorId: "p2", status: "selectAssets", remainingAmount: 20 });
      expect(room.game?.pendingSettlement?.reason).toMatch(/industrie/i);
      expect(room.game?.players.find(player => player.id === "p1")?.cash).toBe(0);
      expect(room.game?.notices.flatMap(notice => notice.payments ?? []).some(payment => payment.fromId === null && payment.toId === "p1")).toBe(false);

      const proposal = await emit(host, "room:command", {
        roomId: room.roomId, playerId: "p1", commandId: "settlement-proposal",
        expectedRevision: room.revision,
        command: { type: "PROPOSE_SETTLEMENT", assets: [{ companyId: asset.id, quantity: 1 }] },
      });
      if (!proposal.ok) throw new Error(`Settlement proposal failed: ${proposal.error}`);
      room = proposal.room;
      const offerRevision = room.revision;
      expect(room.game?.pendingSettlement).toMatchObject({
        status: "awaitingCreditor", decisionActorId: "p2",
        offer: { value: 27, cashDelta: -7 },
      });

      // The debtor remains the original active seat, but only the creditor
      // controls the pending decision. A valid seat cannot act as another seat.
      const debtorDecision = await emit(host, "room:command", {
        roomId: room.roomId, playerId: "p1", commandId: "wrong-settlement-seat",
        expectedRevision: offerRevision, command: { type: "ACCEPT_SETTLEMENT" },
      });
      expect(debtorDecision).toMatchObject({ ok: false, code: "NOT_ACTIVE" });
      const forgedSeat = await emit(host, "room:command", {
        roomId: room.roomId, playerId: "p2", commandId: "forged-creditor-seat",
        expectedRevision: offerRevision, command: { type: "ACCEPT_SETTLEMENT" },
      });
      expect(forgedSeat).toMatchObject({ ok: false, code: "UNAUTHORIZED" });

      // Restarting the server exercises its persisted room representation and
      // resume-token authentication while an offer is waiting for a decision.
      await service.close();
      services.splice(services.indexOf(service), 1);
      ({ service, port } = await startService(storageFile));
      host = await connect(port);
      guest = await connect(port);
      const resumedHost = await emit(host, "room:resume", hostSession);
      const resumedGuest = await emit(guest, "room:resume", guestSession);
      expect(resumedHost.ok).toBe(true);
      expect(resumedGuest.ok).toBe(true);
      if (!resumedHost.ok || !resumedGuest.ok) throw new Error("Could not resume both settlement seats.");
      room = resumedGuest.room;
      expect(room.game?.pendingSettlement).toMatchObject({ status: "awaitingCreditor", decisionActorId: "p2", offer: { value: 27, cashDelta: -7 } });
      const decisionRevision = room.revision;

      const stale = await emit(guest, "room:command", {
        roomId: room.roomId, playerId: "p2", commandId: "stale-settlement-decision",
        expectedRevision: decisionRevision - 1, command: { type: "ACCEPT_SETTLEMENT" },
      });
      expect(stale).toMatchObject({ ok: false, code: "STALE_REVISION" });

      const accepted = await emit(guest, "room:command", {
        roomId: room.roomId, playerId: "p2", commandId: "accept-settlement-once",
        expectedRevision: decisionRevision, command: { type: "ACCEPT_SETTLEMENT" },
      });
      if (!accepted.ok) throw new Error(`Creditor acceptance failed: ${accepted.error}`);
      expect(accepted.room.game?.pendingSettlement).toBeFalsy();
      const finalCompany = accepted.room.game?.companies.find(company => company.id === asset.id);
      expect(finalCompany?.holdings).toMatchObject({ p2: 1 });
      expect(finalCompany?.holdings.p1 ?? 0).toBe(0);
      expect(accepted.room.game?.players.find(player => player.id === "p1")?.cash).toBe(7);
      expect(accepted.room.game?.players.find(player => player.id === "p2")?.cash).toBe(93);
      expect(accepted.room.game?.settlementHistory?.at(-1)).toMatchObject({ debtorId: "p1", creditorId: "p2", amount: 20, cashAmount: -7 });

      const repeated = await emit(guest, "room:command", {
        roomId: room.roomId, playerId: "p2", commandId: "accept-settlement-once",
        expectedRevision: decisionRevision, command: { type: "ACCEPT_SETTLEMENT" },
      });
      expect(repeated.ok).toBe(true);
      if (!repeated.ok) throw new Error("Duplicate acceptance was not acknowledged.");
      expect(repeated.room.revision).toBe(accepted.room.revision);
      expect(repeated.room.game?.players.find(player => player.id === "p1")?.cash).toBe(7);
      expect(repeated.room.game?.settlementHistory).toHaveLength(1);
    } finally {
      await Promise.all(services.splice(0).map(active => active.close()));
      rmSync(folder, { recursive: true, force: true });
    }
  }, 25_000);
});
