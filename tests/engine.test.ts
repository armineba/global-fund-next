import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  Company,
  ContextCard,
  EventCard,
  GameCommand,
  GameState,
  SeatConfig,
} from "@global-fund/shared";
import {
  chooseAiCommand,
  createGame,
  executeCommand,
  fundValue,
  getGameView,
  incomeFor,
  incomeForHolder,
  ownsMonopoly,
  priceFor,
} from "@global-fund/game-engine";

const seats: SeatConfig[] = [
  {
    name: "Alice",
    kind: "local",
    nationality: "france",
    pawn: "lion",
    difficulty: "normal",
  },
  {
    name: "Bob",
    kind: "ai",
    nationality: "japan",
    pawn: "bull",
    difficulty: "hard",
  },
];
const active = (state: GameState) => state.players[state.activeIndex];
const act = (state: GameState, command: GameCommand) =>
  executeCommand(state, active(state).id, command);
const copy = <T>(value: T): T => structuredClone(value);
function game(): GameState {
  return createGame(seats);
}
function die(value = 1): void {
  vi.spyOn(Math, "random").mockReturnValue((value - 0.5) / 6);
}
function land(state: GameState, index: number): GameState {
  state.phase = "sector";
  state.stage = "sector";
  active(state).sectorPosition =
    (index - 1 + state.board.length) % state.board.length;
  die();
  return act(state, { type: "ROLL" });
}
function context(state: GameState, card: ContextCard): GameState {
  state.phase = "awaitNext";
  state.completedPlayers = state.players
    .filter((player) => player.id !== active(state).id)
    .map((player) => player.id);
  state.deck.unshift(card);
  return act(state, { type: "NEXT_TURN" });
}
function holding(
  state: GameState,
  company: Company,
  pid: string,
  quantity: number,
): void {
  company.holdings[pid] = quantity;
  company.costBasis ??= {};
  company.costBasis[pid] = quantity * priceFor(company, state);
}
const eventCard = (
  effect: string,
  extra: Partial<EventCard> = {},
): EventCard => ({
  id: "fixture",
  title: "Incident vérifiable",
  story: "Une opération concerne {company}.",
  effect,
  ...extra,
});

afterEach(() => vi.restoreAllMocks());

describe("dataset and opening", () => {
  it("has 52 balanced board cells, 50 distinct incidents, 100 Contexts and 91 companies", () => {
    const state = game();
    expect(state.board).toHaveLength(52);
    expect(state.boardEventDeck).toHaveLength(50);
    expect(state.deck).toHaveLength(100);
    expect(state.companies).toHaveLength(91);
    expect(new Set(state.boardEventDeck.map((card) => card.id)).size).toBe(50);
    expect(new Set(state.boardEventDeck.map((card) => card.title)).size).toBe(
      50,
    );
    for (const sector of state.sectors)
      expect(
        state.board.filter((cell) => cell.sector === sector.id).length,
      ).toBeGreaterThanOrEqual(4);
    expect(state.board.filter((cell) => cell.kind === "event")).toHaveLength(
      10,
    );
    expect(state.board.filter((cell) => cell.kind === "market")).toHaveLength(
      3,
    );
    expect(state.board.filter((cell) => cell.kind === "start")).toHaveLength(1);
  });
  it("places nationalities for free at C and skips geography during the opening cycle", () => {
    let state = game();
    expect(state.phase).toBe("sector");
    expect(state.currentContext).toBeNull();
    expect(state.players.map((player) => player.zone)).toEqual([
      "europe",
      "asia",
    ]);
    expect(state.players.map((player) => player.cash)).toEqual([100, 100]);
    expect(
      Object.values(state.zoneGrades).every((grade) => grade === "C"),
    ).toBe(true);
    expect(
      Object.values(state.sectorGrades).every((grade) => grade === "C"),
    ).toBe(true);
    expect(() => act(state, { type: "MOVE", zoneId: "americas" })).toThrow();
    expect(() => act(state, { type: "STAY" })).toThrow();
    die();
    state = act(state, { type: "ROLL" });
    expect(state.phase).toBe("market");
    expect(active(state).cash).toBe(100);
    const company = state.companies.find(
      (company) => company.zone === active(state).zone,
    )!;
    state = act(state, {
      type: "BUY_SHARE",
      companyId: company.id,
      quantity: 1,
    });
    expect(active(state).cash).toBeCloseTo(100 - priceFor(company, state));
    state = act(act(state, { type: "END_TURN" }), { type: "NEXT_TURN" });
    expect(state.phase).toBe("sector");
    expect(state.cycle).toBe(1);
    expect(state.currentContext).toBeNull();
    expect(state.players.map((player) => player.nationality)).toEqual([
      "france",
      "japan",
    ]);
  });
  it("rejects invalid setup descriptors", () => {
    expect(() => createGame([seats[0]])).toThrow();
    expect(() =>
      createGame([{ ...seats[0], nationality: "unknown" }, seats[1]]),
    ).toThrow();
    expect(() => createGame([{ ...seats[0], name: " " }, seats[1]])).toThrow();
  });
});

describe("travel before the die and phase gates", () => {
  it("opens one shared Context before cycle 2 and requires move/stay before rolling", () => {
    const initial = game();
    let state = context(initial, {
      id: "travel-context",
      title: "Contexte stable",
      type: "neutral",
      changes: [],
    });
    expect(state.cycle).toBe(2);
    expect(state.phase).toBe("geography");
    expect(state.currentContext?.id).toBe("travel-context");
    expect(() => act(state, { type: "ROLL" })).toThrow();
    expect(() => act(state, { type: "END_TURN" })).toThrow();
    const nationality = active(state).nationality;
    const before = active(state).cash;
    const destination = active(state).zone === "europe" ? "asia" : "europe";
    state = act(state, { type: "MOVE", zoneId: destination });
    expect(active(state).cash).toBe(before - 1);
    expect(active(state).nationality).toBe(nationality);
    expect(active(state).zone).toBe(destination);
    expect(state.phase).toBe("sector");
    expect(() => act(state, { type: "STAY" })).toThrow();
    expect(() =>
      act(state, {
        type: "BUY_SHARE",
        companyId: state.companies[0].id,
        quantity: 1,
      }),
    ).toThrow();
    die();
    state = act(state, { type: "ROLL" });
    expect(state.phase).toBe("market");
    expect(() => act(state, { type: "MOVE", zoneId: "americas" })).toThrow();
    state = act(state, { type: "END_TURN" });
    expect(state.phase).toBe("awaitNext");
    expect(() => act(state, { type: "ROLL" })).toThrow();
    state = act(state, { type: "NEXT_TURN" });
    expect(state.phase).toBe("geography");
    expect(state.cycle).toBe(2);
    expect(state.currentContext?.id).toBe("travel-context");
  });
  it("staying is free and an insolvent travel payment skips the rest of the turn", () => {
    const initial = game();
    initial.cycle = 2;
    initial.phase = "geography";
    active(initial).geoResolved = false;
    const stayed = act(initial, { type: "STAY" });
    expect(active(stayed).cash).toBe(100);
    expect(stayed.phase).toBe("sector");
    active(initial).cash = 0;
    const next = act(initial, {
      type: "MOVE",
      zoneId: active(initial).zone === "europe" ? "asia" : "europe",
    });
    expect(active(next).solvent).toBe(false);
    expect(next.phase).toBe("awaitNext");
  });
});

describe("trades, prices and ownership income", () => {
  it("prices each 20% share from both factors and retains weighted cost basis on partial sales", () => {
    let state = game();
    state.phase = "market";
    const selected = state.companies.find(
      (company) => company.zone === active(state).zone,
    )!;
    expect(priceFor(selected, state)).toBeCloseTo(selected.basePrice / 5);
    state = act(state, {
      type: "BUY_SHARE",
      companyId: selected.id,
      quantity: 1,
    });
    state.zoneGrades[selected.zone] = "A";
    state.sectorGrades[selected.sector] = "B";
    expect(priceFor(selected, state)).toBeCloseTo(
      Math.round((selected.basePrice / 5) * 1.5 * 1.25 * 100) / 100,
    );
    const high = priceFor(selected, state);
    state = act(state, {
      type: "BUY_SHARE",
      companyId: selected.id,
      quantity: 1,
    });
    const average =
      Math.round(((selected.basePrice / 5 + high) / 2) * 100) / 100;
    expect(
      getGameView(state).companies.find(
        (company) => company.id === selected.id,
      )!.averageBuyPrice[active(state).id],
    ).toBeCloseTo(average);
    state = act(state, {
      type: "SELL_SHARE",
      companyId: selected.id,
      quantity: 1,
    });
    expect(
      getGameView(state).companies.find(
        (company) => company.id === selected.id,
      )!.averageBuyPrice[active(state).id],
    ).toBeCloseTo(average);
    state = act(state, {
      type: "SELL_SHARE",
      companyId: selected.id,
      quantity: 1,
    });
    expect(
      state.companies.find((company) => company.id === selected.id)!
        .costBasis?.[active(state).id],
    ).toBeUndefined();
  });
  it("requires five shares of every company in the same group for A/A monopoly income", () => {
    const state = game();
    const player = active(state);
    const selected = state.companies.find(
      (company) =>
        state.companies.filter(
          (item) =>
            item.zone === company.zone && item.sector === company.sector,
        ).length > 1,
    )!;
    const group = state.companies.filter(
      (company) =>
        company.zone === selected.zone && company.sector === selected.sector,
    );
    state.zoneGrades[selected.zone] = "E";
    state.sectorGrades[selected.sector] = "D";
    holding(state, group[0], player.id, 5);
    expect(incomeFor(group[0], state)).toBeCloseTo(group[0].baseIncome / 5);
    expect(ownsMonopoly(state, player, group[0])).toBe(false);
    group.slice(1).forEach((company) => holding(state, company, player.id, 4));
    expect(ownsMonopoly(state, player, group[0])).toBe(false);
    group.forEach((company) => holding(state, company, player.id, 5));
    expect(ownsMonopoly(state, player, group[0])).toBe(true);
    expect(incomeForHolder(group[0], state, player.id)).toBeCloseTo(
      Math.round((group[0].baseIncome / 5) * 2.25 * 100) / 100,
    );
  });
  it("never exceeds five issued shares and rejects out-of-zone or insufficient-cash trades", () => {
    const state = game();
    state.phase = "market";
    const player = active(state);
    const selected = state.companies.find(
      (company) => company.zone === player.zone,
    )!;
    holding(
      state,
      selected,
      state.players.find((item) => item.id !== player.id)!.id,
      5,
    );
    expect(() =>
      act(state, { type: "BUY_SHARE", companyId: selected.id, quantity: 1 }),
    ).toThrow();
    const foreign = state.companies.find(
      (company) => company.zone !== player.zone,
    )!;
    expect(() =>
      act(state, { type: "BUY_SHARE", companyId: foreign.id, quantity: 1 }),
    ).toThrow();
    player.cash = 0;
    selected.holdings = {};
    expect(() =>
      act(state, { type: "BUY_SHARE", companyId: selected.id, quantity: 1 }),
    ).toThrow();
  });
});

describe("Start performance excludes capital flows", () => {
  it.each([
    [105, 125, 5, 20],
    [95, 75, -5, -20],
    [100, 100, 0, 0],
  ])("settles NAV %i to %i", (nav, after, performance, capitalFlow) => {
    const initial = game();
    active(initial).cash = nav;
    const state = land(initial, 0);
    expect(active(state).cash).toBe(after);
    expect(active(state).lapPerformance).toBe(performance);
    expect(active(state).capitalFlows).toBe(capitalFlow);
    expect(active(state).lapStartValue).toBe(after);
    expect(active(state).lapStartCapitalFlows).toBe(capitalFlow);
    expect(
      state.notices.find((notice) => notice.action === "lap"),
    ).toMatchObject({ lapPerformance: performance, lapReturn: performance });
  });
  it("does not reward its own previous injection or another external flow", () => {
    const initial = game();
    active(initial).cash = 105;
    let state = land(initial, 0);
    state.phase = "sector";
    active(state).sectorPosition = 51;
    state = act(state, { type: "ROLL" });
    expect(active(state).cash).toBe(125);
    expect(active(state).lapPerformance).toBe(0);
    expect(active(state).capitalFlows).toBe(20);
    active(state).cash += 10;
    active(state).capitalFlows! += 10;
    state.phase = "sector";
    active(state).sectorPosition = 51;
    state = act(state, { type: "ROLL" });
    expect(active(state).lapPerformance).toBe(0);
    expect(active(state).cash).toBe(135);
  });
  it("withdraws through forced sales and records the baseline after payment", () => {
    const initial = game();
    const player = active(initial);
    const company = initial.companies[0];
    holding(initial, company, player.id, 5);
    player.cash = 0;
    player.lapStartValue = fundValue(initial, player) + 5;
    const state = land(initial, 0);
    expect(active(state).lapPerformance).toBe(-5);
    expect(state.companies[0].holdings[player.id] ?? 0).toBeLessThan(5);
    expect(active(state).lapStartValue).toBe(fundValue(state, active(state)));
    expect(
      state.notices
        .flatMap((notice) => notice.payments ?? [])
        .find((payment) => payment.reason === "Performance au Départ")
        ?.forcedSales?.length,
    ).toBeGreaterThan(0);
  });
  it("becomes insolvent and skips trading when the negative payment cannot be covered", () => {
    const initial = game();
    active(initial).cash = 1;
    const state = land(initial, 0);
    expect(active(state).cash).toBe(0);
    expect(active(state).solvent).toBe(false);
    expect(state.phase).toBe("awaitNext");
    const finished = act(state, { type: "NEXT_TURN" });
    expect(finished.finished).toBe(true);
    expect(finished.winnerIds).not.toContain(active(state).id);
  });
});

describe("Context, bankruptcy and Event separation", () => {
  it("liquidates E/E at current value, clears cost basis, and relists only after improvement", () => {
    const initial = game();
    const playerId = active(initial).id;
    const selected = initial.companies[0];
    holding(initial, selected, playerId, 2);
    const before = active(initial).cash;
    let state = context(initial, {
      id: "bankruptcy",
      title: "Faillite",
      changes: [
        { scope: "zone", id: selected.zone, grade: "E" },
        { scope: "sector", id: selected.sector, grade: "E" },
      ],
    });
    let company = state.companies.find(
      (company) => company.id === selected.id,
    )!;
    expect(company.available).toBe(false);
    expect(company.holdings).toEqual({});
    expect(company.costBasis).toEqual({});
    expect(
      state.players.find((player) => player.id === playerId)!.cash,
    ).toBeCloseTo(before + (selected.basePrice / 5) * 0.25 * 2);
    expect(
      getGameView(state).companies.find(
        (company) => company.id === selected.id,
      )!.sharesAvailable,
    ).toBe(0);
    state.phase = "market";
    active(state).zone = selected.zone;
    active(state).geoResolved = true;
    expect(() =>
      act(state, { type: "BUY_SHARE", companyId: selected.id, quantity: 1 }),
    ).toThrow();
    state = context(state, {
      id: "recovery",
      title: "Reprise",
      changes: [{ scope: "zone", id: selected.zone, grade: "D" }],
    });
    company = state.companies.find((company) => company.id === selected.id)!;
    expect(company.available).toBe(true);
    expect(company.costBasis).toEqual({});
    expect(company.holdings).toEqual({});
    expect(company.sharesAvailable).toBe(5);
  });
  it("Context prison and regulation categories only set indices without detention or forced sales", () => {
    const initial = game();
    const company = initial.companies[0];
    const player = active(initial);
    holding(initial, company, player.id, 5);
    const state = context(initial, {
      id: "prison-context",
      title: "Enquête",
      type: "prison",
      changes: [{ scope: "sector", id: company.sector, grade: "B" }],
    });
    expect(state.players.every((player) => !player.jailed)).toBe(true);
    expect(state.companies[0].holdings[player.id]).toBe(5);
    expect(state.notices.at(-1)?.cardType).toBe("context");
  });
  it("all 50 Event effects preserve grades and the Context deck", () => {
    const original = game();
    for (const card of original.boardEventDeck) {
      const state = copy(original);
      state.boardEventDeck = [card];
      const sector = card.targetSector ?? state.companies[0].sector;
      const company = state.companies.find(
        (company) => company.sector === sector,
      )!;
      holding(state, company, active(state).id, 1);
      active(state).cash = 1000;
      const next = land(
        state,
        state.board.findIndex((cell) => cell.kind === "event"),
      );
      expect(next.zoneGrades, card.id).toEqual(original.zoneGrades);
      expect(next.sectorGrades, card.id).toEqual(original.sectorGrades);
      expect(next.deck, card.id).toEqual(original.deck);
      expect(next.boardEventDiscard.at(-1)?.id).toBe(card.id);
    }
  });
  it("recycles Event discards and global market cells never consume an Event card", () => {
    const initial = game();
    initial.boardEventDeck = [];
    initial.boardEventDiscard = [eventCard("cash", { activeCash: 2 })];
    let state = land(
      initial,
      initial.board.findIndex((cell) => cell.kind === "event"),
    );
    expect(state.boardEventDiscard).toHaveLength(1);
    expect(
      state.notices.find((notice) => notice.cardId === "fixture"),
    ).toBeDefined();
    const before = copy(state.boardEventDeck);
    const discard = copy(state.boardEventDiscard);
    state = land(
      state,
      state.board.findIndex((cell) => cell.label === "Bull Market"),
    );
    expect(state.boardEventDeck).toEqual(before);
    expect(state.boardEventDiscard).toEqual(discard);
    expect(
      Object.values(state.zoneGrades).every((grade) => grade === "B"),
    ).toBe(true);
  });
});

describe("prison and suspended income", () => {
  it("detention immediately skips trading; the next turn trials before sector movement", () => {
    const initial = game();
    const player = active(initial);
    const company = initial.companies[0];
    holding(initial, company, player.id, 1);
    initial.boardEventDeck = [
      eventCard("prison", { targetSector: company.sector }),
    ];
    let state = land(
      initial,
      initial.board.findIndex((cell) => cell.kind === "event"),
    );
    expect(active(state).jailed).toBe(true);
    expect(state.phase).toBe("awaitNext");
    expect(
      state.notices.find((notice) => notice.cardId === "fixture"),
    ).toMatchObject({
      playerId: player.id,
      effect: "prison",
      targetCompanyId: company.id,
      targetCompanyName: company.name,
      targetedSector: company.sector,
      targetedZone: company.zone,
    });
    expect(state.notices.at(-1)?.action).toBe("skipTrading");
    expect(() =>
      act(state, { type: "BUY_SHARE", companyId: company.id, quantity: 1 }),
    ).toThrow();
    state.completedPlayers = state.players
      .filter((item) => item.id !== player.id)
      .map((item) => item.id);
    state = act(state, { type: "NEXT_TURN" });
    // The other seat starts the new cycle; finish its turn to return to the prisoner.
    if (active(state).id !== player.id) {
      state.phase = "awaitNext";
      state = act(state, { type: "NEXT_TURN" });
    }
    expect(active(state).id).toBe(player.id);
    expect(state.phase).toBe("geography");
    const position = active(state).sectorPosition;
    state = act(state, { type: "PRISON_ROLL" });
    expect(active(state).prisonStage).toBe(1);
    expect(active(state).sectorPosition).toBe(position);
    expect(active(state).jailed).toBe(true);
    expect(state.phase).toBe("awaitNext");
  });
  it("third trial pays 5 M€ and releases to the previous market before travel", () => {
    const initial = game();
    initial.cycle = 2;
    initial.phase = "geography";
    const player = active(initial);
    const previousZone = player.zone!;
    player.previousZone = previousZone;
    player.zone = "prison";
    player.jailed = true;
    player.geoResolved = false;
    player.prisonStage = 2;
    die();
    let state = act(initial, { type: "PRISON_ROLL" });
    expect(active(state).cash).toBe(95);
    expect(active(state).jailed).toBe(false);
    expect(active(state).zone).toBe(previousZone);
    expect(state.phase).toBe("geography");
    expect(() => act(state, { type: "ROLL" })).toThrow();
    state = act(state, { type: "STAY" });
    expect(state.phase).toBe("sector");
  });
  it("redirects sector income owed to a jailed holder to the bank while marking NAV", () => {
    const initial = game();
    const payer = active(initial);
    const holder = initial.players.find((player) => player.id !== payer.id)!;
    const company = initial.companies[0];
    holding(initial, company, holder.id, 2);
    holder.jailed = true;
    holder.previousZone = holder.zone!;
    holder.zone = "prison";
    initial.zoneGrades[company.zone] = "A";
    const index = initial.board.findIndex(
      (cell) => cell.sector === company.sector,
    );
    const amount = incomeForHolder(company, initial, holder.id) * 2;
    const state = land(initial, index);
    expect(state.players.find((player) => player.id === holder.id)!.cash).toBe(
      100,
    );
    expect(active(state).cash).toBeCloseTo(100 - amount);
    expect(
      state.notices
        .flatMap((notice) => notice.payments ?? [])
        .find((payment) => payment.companyId === company.id),
    ).toMatchObject({ fromId: payer.id, toId: null, amount });
    expect(
      getGameView(state).players.find((player) => player.id === holder.id)!
        .fundValue,
    ).toBeCloseTo(100 + 2 * priceFor(company, state));
  });
  it("does not distribute Event dividends to jailed holders", () => {
    const initial = game();
    const holder = initial.players.find(
      (player) => player.id !== active(initial).id,
    )!;
    const company = initial.companies[0];
    holding(initial, company, holder.id, 2);
    holder.jailed = true;
    holder.zone = "prison";
    initial.boardEventDeck = [
      eventCard("dividend", { amount: 3, targetSector: company.sector }),
    ];
    const state = land(
      initial,
      initial.board.findIndex((cell) => cell.kind === "event"),
    );
    expect(state.players.find((player) => player.id === holder.id)!.cash).toBe(
      100,
    );
  });
});

describe("authority and atomic transitions", () => {
  it.each(["roll", "die", "value"])(
    "rejects client-provided %s rather than rolling it",
    (field) => {
      const state = game();
      const before = copy(state);
      expect(() =>
        act(state, { type: "ROLL", [field]: 6 } as GameCommand),
      ).toThrow();
      expect(state).toEqual(before);
    },
  );
  it("returns a detached new state and makes rejected transitions atomic", () => {
    const state = game();
    const before = copy(state);
    expect(() =>
      executeCommand(
        state,
        state.players.find((player) => player.id !== active(state).id)!.id,
        { type: "ROLL" },
      ),
    ).toThrow();
    expect(state).toEqual(before);
    state.phase = "market";
    const original = copy(state);
    const own = state.companies.find(
      (company) => company.zone === active(state).zone,
    )!;
    expect(() =>
      act(state, { type: "SELL_SHARE", companyId: own.id, quantity: 1 }),
    ).toThrow();
    expect(state).toEqual(original);
    const next = act(state, {
      type: "BUY_SHARE",
      companyId: own.id,
      quantity: 1,
    });
    expect(next).not.toBe(state);
    expect(state).toEqual(original);
    next.players[0].name = "Changed";
    expect(state.players[0].name).toBe("Alice");
  });
  it("never exposes hidden decks and returns a detached view", () => {
    const state = game();
    const view = getGameView(state);
    expect(view).not.toHaveProperty("deck");
    expect(view).not.toHaveProperty("boardEventDeck");
    expect(view).not.toHaveProperty("boardEventDiscard");
    expect(
      view.companies.every((company) => !Object.hasOwn(company, "costBasis")),
    ).toBe(true);
    view.players[0].cash = -999;
    expect(state.players[0].cash).toBe(100);
  });
  it("AI commands are legal and planning does not mutate the state", () => {
    const state = game();
    const before = copy(state);
    const command = chooseAiCommand(state, "hard");
    expect(command).toEqual({ type: "ROLL" });
    expect(state).toEqual(before);
    die();
    expect(() => act(state, command)).not.toThrow();
  });
  it("runs all three AI difficulties to completion through legal commands", () => {
    let state = createGame([
      ...seats.map((seat) => ({ ...seat, kind: "ai" as const })),
      {
        name: "Easy",
        kind: "ai",
        nationality: "united-states",
        pawn: "globe",
        difficulty: "easy",
      },
    ]);
    // A short Context deck retains complete cycle/turn behavior without a minutes-long unit test.
    state.deck = state.deck.slice(0, 3);
    let commands = 0;
    for (; !state.finished && commands < 400; commands += 1) {
      const player = active(state);
      state = executeCommand(
        state,
        player.id,
        chooseAiCommand(state, player.difficulty),
      );
      expect(
        state.players.every(
          (player) => Number.isFinite(player.fundValue) && player.cash >= 0,
        ),
      ).toBe(true);
      expect(
        state.companies.every(
          (company) =>
            Object.values(company.holdings).reduce(
              (sum, value) => sum + value,
              0,
            ) <= 5,
        ),
      ).toBe(true);
    }
    expect(state.finished).toBe(true);
    expect(commands).toBeLessThan(400);
    expect(state.winnerIds.length).toBeGreaterThanOrEqual(1);
  });
});
