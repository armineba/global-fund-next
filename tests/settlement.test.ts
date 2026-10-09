import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameState, SeatConfig } from "@global-fund/shared";
import { chooseAiCommand, createGame, executeCommand, fundValue, getDecisionPlayerId, getGameView, incomeForHolder, ownsMonopoly, priceFor } from "@global-fund/game-engine";
const seats: SeatConfig[] = ["Apex", "Meridian", "Zenith"].map((name, index) => ({ name, kind: "local", startingMarket: "europe", pawn: (["lion", "bull", "globe"] as const)[index], difficulty: "normal" }));
function fixture(assetPrice = 12, cash = 5) {
  vi.restoreAllMocks();
  const state = createGame(seats);
  state.activeIndex = 0; state.starterIndex = 0;
  const debtor = state.players[0], creditor = state.players[1];
  state.companies.forEach(company => { company.holdings = {}; company.costBasis = {}; });
  const source = state.companies.find(company => company.sector === "industry")!;
  source.holdings[creditor.id] = 1;
  source.baseIncome = 100;
  const asset = state.companies.find(company => company.sector !== "industry")!;
  asset.basePrice = assetPrice * 5;
  asset.holdings[debtor.id] = 2; asset.costBasis![debtor.id] = 14;
  debtor.cash = cash;
  state.phase = "sector"; state.stage = "sector";
  const index = state.board.findIndex(cell => cell.sector === "industry");
  debtor.sectorPosition = index - 1;
  vi.spyOn(Math, "random").mockReturnValue(0.01);
  const pending = executeCommand(state, debtor.id, { type: "ROLL" });
  return { initial: state, state: pending, debtor: debtor.id, creditor: creditor.id, assetId: asset.id, sourceId: source.id };
}
function offer(f: ReturnType<typeof fixture>, quantity = 1) {
  return executeCommand(f.state, f.debtor, { type: "PROPOSE_SETTLEMENT", assets: [{ companyId: f.assetId, quantity }] });
}
afterEach(() => vi.restoreAllMocks());
describe("authoritative settlement", () => {
  it("emits one operation receipt for two creditors paid immediately in cash", () => {
    const f = fixture();
    const state = structuredClone(f.initial);
    state.players[0].cash = 100;
    state.companies.find(company => company.id === f.sourceId)!.holdings[state.players[2].id] = 1;
    const settled = executeCommand(state, f.debtor, { type: "ROLL" });
    expect(settled.pendingSettlement).toBeUndefined();
    expect(settled.players[0].cash).toBe(60);
    expect(settled.players[1].cash).toBe(120);
    expect(settled.players[2].cash).toBe(120);
    const receipts = settled.notices.filter(notice => notice.action === "settlementComplete");
    expect(receipts).toHaveLength(1);
    expect(receipts[0].settlements).toHaveLength(2);
    expect(receipts[0].settlements!.reduce((sum, result) => sum + result.amount, 0)).toBe(40);
    expect(receipts[0].playerImpacts!.find(impact => impact.playerId === f.debtor)?.cash).toBe(-40);
    expect(settled.settlementHistory).toHaveLength(2);
  });
  it("suspends the active turn and leaves cash and holdings untouched until a funded decision", () => {
    const f = fixture();
    expect(f.state.phase).toBe("settlement");
    expect(f.state.pendingSettlement).toMatchObject({ debtorId: f.debtor, creditorId: f.creditor, amount: 20, status: "selectAssets", sectorId: "industry" });
    expect(f.state.players[0].cash).toBe(5);
    expect(f.state.players[1].cash).toBe(100);
    expect(f.state.companies.find(c => c.id === f.assetId)!.holdings[f.debtor]).toBe(2);
    const before = structuredClone(f.state);
    expect(() => executeCommand(f.state, f.debtor, { type: "NEXT_TURN" })).toThrow();
    expect(f.state).toEqual(before);
    expect(f.state.activeIndex).toBe(0);
  });
  it("supports a below-debt offer with debtor cash and beneficiary weighted PRU", () => {
    const f = fixture(12, 8);
    f.state.companies.find(c => c.id === f.assetId)!.holdings[f.creditor] = 1;
    f.state.companies.find(c => c.id === f.assetId)!.costBasis![f.creditor] = 30;
    const proposed = offer(f);
    expect(getDecisionPlayerId(proposed)).toBe(f.creditor);
    const settled = executeCommand(proposed, f.creditor, { type: "ACCEPT_SETTLEMENT" });
    expect(settled.players[0].cash).toBe(0); expect(settled.players[1].cash).toBe(108);
    const asset = getGameView(settled).companies.find(c => c.id === f.assetId)!;
    expect(asset.holdings[f.creditor]).toBe(2); expect(asset.holdings[f.debtor]).toBe(1);
    expect(asset.averageBuyPrice[f.creditor]).toBe(21);
    expect(settled.phase).toBe("market"); expect(settled.pendingSettlement).toBeUndefined();
    expect(settled.settlementHistory!.at(-1)).toMatchObject({ amount: 20, cashAmount: 8, unpaidAmount: 0 });
  });
  it("accepts an equal-value title without cash and freezes the offered price", () => {
    const f = fixture(20);
    const proposed = offer(f);
    proposed.zoneGrades[proposed.companies.find(c => c.id === f.assetId)!.zone] = "A";
    const settled = executeCommand(proposed, f.creditor, { type: "ACCEPT_SETTLEMENT" });
    expect(settled.players[0].cash).toBe(5); expect(settled.players[1].cash).toBe(100);
    expect(settled.settlementHistory!.at(-1)!.assets[0].perShare).toBe(20);
  });
  it("transfers the over-debt difference from creditor to debtor atomically", () => {
    const f = fixture(27);
    const proposed = offer(f);
    expect(proposed.pendingSettlement!.offer!.cashDelta).toBe(-7);
    const settled = executeCommand(proposed, f.creditor, { type: "ACCEPT_SETTLEMENT" });
    expect(settled.players[0].cash).toBe(12); expect(settled.players[1].cash).toBe(93);
    expect(settled.settlementHistory!.at(-1)!.cashAmount).toBe(-7);
  });
  it("rejects acceptance when the creditor cannot fund the difference without any mutation", () => {
    const f = fixture(27); f.state.players[1].cash = 6;
    const proposed = offer(f); const before = structuredClone(proposed);
    expect(() => executeCommand(proposed, f.creditor, { type: "ACCEPT_SETTLEMENT" })).toThrow("Liquidités insuffisantes");
    expect(proposed).toEqual(before);
    expect(() => executeCommand(proposed, f.debtor, { type: "ACCEPT_SETTLEMENT" })).toThrow();
  });
  it("returns a rejected offer to debtor selection with no transfer then allows market liquidation", () => {
    const f = fixture(27);
    const rejected = executeCommand(offer(f), f.creditor, { type: "REJECT_SETTLEMENT" });
    expect(rejected.pendingSettlement!.decisionActorId).toBe(f.debtor);
    expect(rejected.companies.find(c => c.id === f.assetId)!.holdings[f.creditor]).toBeUndefined();
    const settled = executeCommand(rejected, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(settled.players[0].cash).toBe(12); expect(settled.players[1].cash).toBe(120);
    expect(settled.settlementHistory!.at(-1)!.marketSales[0].quantity).toBe(1);
  });
  it("creditor cash demand sells offered assets and pays the creditor with the surplus retained", () => {
    const f = fixture(27);
    const settled = executeCommand(offer(f), f.creditor, { type: "REQUIRE_CASH" });
    expect(settled.players[0].cash).toBe(12); expect(settled.players[1].cash).toBe(120);
    expect(settled.companies.find(c => c.id === f.assetId)!.holdings[f.creditor]).toBeUndefined();
  });
  it("allows incremental liquidation across markets and only credits actual funded cash on insolvency", () => {
    const f = fixture(6, 1);
    const partial = executeCommand(f.state, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(partial.phase).toBe("settlement"); expect(partial.players[0].cash).toBe(7);
    expect(partial.players[1].cash).toBe(100);
    const insolvent = executeCommand(partial, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(insolvent.players[0].solvent).toBe(false); expect(insolvent.players[0].cash).toBe(0);
    expect(insolvent.players[1].cash).toBe(113); expect(insolvent.phase).toBe("awaitNext");
    expect(insolvent.settlementHistory!.at(-1)).toMatchObject({ unpaidAmount: 7, cashAmount: 13 });
    expect(insolvent.settlementHistory!.at(-1)!.marketSales).toHaveLength(2);
  });
  it("rejects duplicate, unavailable, forged-value, and unsupported ordinary trade commands atomically", () => {
    const f = fixture(); const before = structuredClone(f.state);
    for (const assets of [[{ companyId: f.assetId, quantity: 1 }, { companyId: f.assetId, quantity: 1 }], [{ companyId: f.assetId, quantity: 3 }], [{ companyId: f.sourceId, quantity: 1 }]]) {
      expect(() => executeCommand(f.state, f.debtor, { type: "LIQUIDATE_ASSETS", assets })).toThrow();
    }
    expect(() => executeCommand(f.state, f.debtor, { type: "PROPOSE_SETTLEMENT", assets: [{ companyId: f.assetId, quantity: 1, perShare: 100 }] } as never)).toThrow();
    expect(() => executeCommand(f.state, f.debtor, { type: "BUY_SHARE", companyId: f.assetId, quantity: 1 })).toThrow();
    expect(f.state).toEqual(before);
  });
  it("snapshots the NAV ordering with stable seat ties and retains it after each settlement", () => {
    const f = fixture(27);
    const state = structuredClone(f.initial);
    const source = state.companies.find(c => c.id === f.sourceId)!;
    source.holdings[state.players[2].id] = 1;
    state.players[1].cash = 0; state.players[2].cash = 0;
    state.players[2].cash += fundValue(state, state.players[1]) - fundValue(state, state.players[2]);
    const pending = executeCommand(state, f.debtor, { type: "ROLL" });
    expect(pending.pendingSettlement!.creditorOrder).toEqual([f.creditor, state.players[2].id]);
    expect(pending.pendingSettlement!.creditorPriorities![0].value).toBe(pending.pendingSettlement!.creditorPriorities![1].value);
    const next = executeCommand(pending, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(next.pendingSettlement!.creditorId).toBe(state.players[2].id);
    expect(next.pendingSettlement!.creditorOrder).toEqual([f.creditor, state.players[2].id]);
  });
  it("AI offers titles and uses the nonactive creditor decision actor", () => {
    const f = fixture(27); f.state.players[0].bot = true; f.state.players[1].bot = true;
    const command = chooseAiCommand(f.state, "hard"); expect(command.type).toBe("PROPOSE_SETTLEMENT");
    const proposed = executeCommand(f.state, getDecisionPlayerId(f.state), command);
    expect(getDecisionPlayerId(proposed)).toBe(f.creditor);
    proposed.players[1].cash = 0;
    expect(chooseAiCommand(proposed, "hard")).toEqual({ type: "REQUIRE_CASH" });
    const settled = executeCommand(proposed, getDecisionPlayerId(proposed), chooseAiCommand(proposed, "hard"));
    expect(settled.phase).toBe("market");
  });
  it("recalculates five-share control and monopoly after direct ownership transfer", () => {
    const f = fixture(20);
    const asset = f.state.companies.find(c => c.id === f.assetId)!;
    asset.holdings[f.debtor] = 1; asset.holdings[f.creditor] = 4; asset.costBasis![f.creditor] = 80;
    for (const company of f.state.companies.filter(c => c.zone === asset.zone && c.sector === asset.sector && c.id !== asset.id)) company.holdings[f.creditor] = 5;
    const settled = executeCommand(offer(f), f.creditor, { type: "ACCEPT_SETTLEMENT" });
    expect(settled.companies.find(c => c.id === f.assetId)!.holdings[f.creditor]).toBe(5);
    expect(ownsMonopoly(settled, settled.players[1], settled.companies.find(c => c.id === f.assetId)!)).toBe(true);
  });
  it("an AI debtor liquidates after a human rejection instead of proposing forever", () => {
    const f = fixture(27); f.state.players[0].bot = true;
    const proposed = executeCommand(f.state, f.debtor, chooseAiCommand(f.state, "hard"));
    const rejected = executeCommand(proposed, f.creditor, { type: "REJECT_SETTLEMENT" });
    const command = chooseAiCommand(rejected, "hard");
    expect(command.type).toBe("LIQUIDATE_ASSETS");
    const settled = executeCommand(rejected, f.debtor, command);
    expect(settled.pendingSettlement).toBeUndefined(); expect(settled.players[1].cash).toBe(120);
  });
  it("records direct transfers and emits one receipt after all partial sales", () => {
    const f = fixture(27);
    const settled = executeCommand(offer(f), f.creditor, { type: "ACCEPT_SETTLEMENT" });
    const directReceipt = settled.notices.at(-1)!;
    expect(directReceipt.playerImpacts!.find(item => item.playerId === f.debtor)).toMatchObject({ cash: 7, valuation: -20 });
    expect(directReceipt.playerImpacts!.find(item => item.playerId === f.creditor)).toMatchObject({ cash: -7, valuation: 20 });
    expect(directReceipt.companyImpacts!.find(item => item.companyId === f.assetId)!.sharesChanged).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: f.debtor, before: 2, after: 1 }), expect.objectContaining({ playerId: f.creditor, before: 0, after: 1 }),
    ]));
    const low = fixture(6, 1);
    const partial = executeCommand(low.state, low.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: low.assetId, quantity: 1 }] });
    expect(partial.notices.some(item => item.action === "settlementComplete")).toBe(false);
    const final = executeCommand(partial, low.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: low.assetId, quantity: 1 }] });
    const receipt = final.notices.at(-1)!;
    expect(receipt).toMatchObject({ action: "settlementComplete", settlements: [{ amount: 20, cashAmount: 13, unpaidAmount: 7 }] });
    expect(receipt.playerImpacts!.find(item => item.playerId === low.debtor)).toMatchObject({ cash: -1, valuation: -13 });
    expect(receipt.companyImpacts!.find(item => item.companyId === low.assetId)!.sharesChanged).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: low.debtor, before: 2, after: 0 }),
    ]));
  });
  it("persists receipt baseline through a save roundtrip and summarizes later creditors together", () => {
    const f = fixture(6, 1);
    const pending = f.state.pendingSettlement!;
    pending.debts = [{ debtorId: f.debtor, creditorId: f.state.players[2].id, amount: 5, reason: "Créancier suivant" }];
    const partial = executeCommand(f.state, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(partial.pendingSettlement).toBeDefined();
    expect(partial.pendingSettlement!.receiptBefore).toBeDefined();
    const resumed = JSON.parse(JSON.stringify(partial)) as GameState;
    const final = executeCommand(resumed, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    const summaries = final.notices.filter(item => item.action === "settlementComplete");
    expect(summaries).toHaveLength(1);
    expect(summaries[0].settlements).toHaveLength(2);
    expect(summaries[0].settlements).toMatchObject([
      { creditorId: f.creditor, amount: 20, cashAmount: 13, unpaidAmount: 7 },
      { creditorId: f.state.players[2].id, amount: 5, cashAmount: 0, unpaidAmount: 5 },
    ]);
    expect(summaries[0].playerImpacts!.find(item => item.playerId === f.debtor)).toMatchObject({ cash: -1, valuation: -13 });
    expect(summaries[0].playerImpacts!.find(item => item.playerId === f.creditor)).toMatchObject({ cash: 13 });
    expect(summaries[0].playerImpacts!.find(item => item.playerId === f.state.players[2].id)).toMatchObject({ cash: 0 });
    expect(summaries[0].companyImpacts!.find(item => item.companyId === f.assetId)!.sharesChanged).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: f.debtor, before: 2, after: 0 }),
    ]));
  });
  it("resumes an older pending settlement without a receipt baseline", () => {
    const f = fixture(6, 1);
    const partial = executeCommand(f.state, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    delete partial.pendingSettlement!.receiptBefore;
    const final = executeCommand(partial, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(final.phase).toBe("awaitNext");
    expect(final.notices.at(-1)).toMatchObject({ action: "settlementComplete", settlements: [{ amount: 20, unpaidAmount: 7 }] });
  });
  it("defers a travel charge without reporting phantom cash and resumes the sector phase", () => {
    const f = fixture(12, 0);
    const state = structuredClone(f.initial);
    state.cycle = 2; state.phase = "geography"; state.stage = "geography"; state.players[0].geoResolved = false;
    const pending = executeCommand(state, f.debtor, { type: "MOVE", zoneId: "asia" });
    expect(pending.pendingSettlement).toMatchObject({ creditorId: null, amount: 1, reason: "Voyage entre marchés" });
    expect(pending.notices.find(item => item.action === "move")!.payments![0]).toMatchObject({ amount: 0, dueAmount: 1 });
    expect(pending.players[0].cash).toBe(0); expect(pending.players[0].zone).toBe("asia");
    const settled = executeCommand(pending, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(settled.players[0].cash).toBe(11); expect(settled.phase).toBe("sector");
  });
  it("defers the mandatory prison fee and resumes released geography without rolling twice", () => {
    const f = fixture(12, 0); const state = structuredClone(f.initial);
    state.cycle = 2; state.phase = "geography"; state.stage = "geography";
    Object.assign(state.players[0], { jailed: true, zone: "prison", previousZone: "europe", prisonStage: 2, geoResolved: false });
    const pending = executeCommand(state, f.debtor, { type: "PRISON_ROLL" });
    expect(pending.pendingSettlement).toMatchObject({ creditorId: null, amount: 5, reason: "Libération de prison" });
    expect(pending.players[0].jailed).toBe(false);
    const settled = executeCommand(pending, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(settled.phase).toBe("geography"); expect(settled.players[0].zone).toBe("europe"); expect(settled.players[0].cash).toBe(7);
  });
  it("creates an explicit bank event obligation with the card cause and allows liquidation", () => {
    const f = fixture(12, 0); const state = structuredClone(f.initial);
    state.players[0].sectorPosition = state.board.findIndex(cell => cell.kind === "event") - 1;
    state.boardEventDeck = [{ id: "bank-fee", title: "Frais de contrôle", story: "Le contrôle impose une charge.", effect: "cash", activeCash: -10 }];
    const pending = executeCommand(state, f.debtor, { type: "ROLL" });
    expect(pending.pendingSettlement).toMatchObject({ creditorId: null, amount: 10, reason: "Carte — Frais de contrôle" });
    expect(pending.players[0].cash).toBe(0);
    expect(() => executeCommand(pending, f.debtor, { type: "PROPOSE_SETTLEMENT", assets: [{ companyId: f.assetId, quantity: 1 }] })).toThrow("bancaire");
    const settled = executeCommand(pending, f.debtor, { type: "LIQUIDATE_ASSETS", assets: [{ companyId: f.assetId, quantity: 1 }] });
    expect(settled.players[0].cash).toBe(2); expect(settled.phase).toBe("market");
  });
  it("sorts by NAV despite a conflicting cash order and freezes the initial priorities", () => {
    const f = fixture(27); const state = structuredClone(f.initial);
    const source = state.companies.find(c => c.id === f.sourceId)!;
    source.holdings[state.players[2].id] = 1;
    state.players[1].cash = 0; state.players[2].cash = 10;
    const owned = state.companies.find(c => c.id !== f.assetId && c.id !== f.sourceId)!;
    owned.basePrice = 1000; owned.holdings[f.creditor] = 1;
    const pending = executeCommand(state, f.debtor, { type: "ROLL" });
    expect(pending.pendingSettlement!.creditorOrder).toEqual([state.players[2].id, f.creditor]);
    expect(pending.pendingSettlement!.priorityMetric).toBe("fundValue");
    expect(fundValue(state, state.players[1])).toBeGreaterThan(fundValue(state, state.players[2]));
    expect(pending.pendingSettlement!.creditorPriorities![0].value).toBeLessThan(pending.pendingSettlement!.creditorPriorities![1].value);
  });

});
