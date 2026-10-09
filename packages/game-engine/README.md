# Game engine

The TypeScript facade validates typed commands and clones the state before applying them. Rejected commands leave the original state intact. The engine has no UI, networking, timers, persistence, or browser dependencies. Its local CommonJS core is adapted from the old project; the old project itself remains untouched.

## Turn schedule

The highest opening die selects the starter once. Play follows the cyclic seat order from that seat, and this order never rotates at cycle boundaries. Insolvent seats are skipped; detained solvent players retain their turn for trial. `starterIndex` is a fixed order anchor, even if its original seat becomes insolvent. Older saves retain and freeze their currently stored anchor, without replaying turns or inferring unrecorded tie-break rolls.

Cycle 1 starts with all indices at C, no Context, and each fund's chosen starting market already selected at no cost. Players roll, resolve their cell, trade, end their turn, then acknowledge the next turn. Cycle 2 onward opens with one shared Context and each player chooses geography before rolling. Staying costs zero; moving to another market costs 1 M€. A detained player rolls their trial in geography on a subsequent turn. A failed trial skips the turn; detention on a cell immediately skips trading. No jailed holder receives sector income or Event dividends, although NAV continues to reflect prices.

## Data additions

All original 44 cells keep their relative order. The eight inserted cells are two Events, two real estate, and one each of transport, media, finance, and technology. Underrepresented sectors first gain four additional cells to reach four appearances; finance and technology receive the other two sector additions. Every sector consequently appears four or five times. There are 38 sector cells, 10 Events, 3 market cells, and Start. Extra Events sit in the two longest gaps in the original Event layout. This keeps every sector represented without increasing the original three global market shocks.

The separate Event deck contains the original 28 incidents plus 22 distinct financial stories covering dividends, fines, buybacks, required sales, margin calls, regulation, cash, and targeted detention. Event cards never change economic grades. Only the Context deck (100 cards) and Bull/Bear/Crash cells change grades. Event discards reshuffle when exhausted.

The opening cycle is numbered 1. The 100 Context cards govern cycles 2 through 101; after every solvent player completes the final Context cycle, the next-turn command finishes the game and ranks solvent funds by current NAV. If only one solvent fund remains, the game ends earlier.

Event notices publish the selected company's ID and name, its zone and sector, and the effect separately from the story. Judicial targeting never depends on parsing the narrative.

## Start accounting

On crossing Start, performance is current NAV minus the previous Start NAV, excluding external capital flows since that baseline. A positive result injects 20 M€, a negative result withdraws 20 M€ through the settlement payment process, and an unchanged value produces no flow. The new baseline is recorded after that flow, before resolving the landing cell. Lap notices expose performance in M€ and percentage return. Monetary amounts are rounded to cents for comparing NAV, so floating point noise cannot trigger a reward.

Landing on a sector pays only other holders: the active fund receives no bank or market income for its own shares, including fully controlled companies and monopolies. Those holdings still earn income when another fund lands on the sector. Full control of one company guarantees at least C/C income. A monopoly requires all five shares of every company in the same zone and sector and guarantees at least A/A income. At E/E an available company pays its current liquidation share value to holders, clears holdings and acquisition basis, and stays unavailable until either grade improves.

All dice and card draws are authoritative random outcomes. Runtime validation rejects unknown command fields, including injected `die`, `roll`, or `value`.

## Market placement and save compatibility

`SeatConfig.startingMarket` and `RoomPlayer.startingMarket` use exactly five IDs: `americas`, `europe`, `asia`, `africa` (Africa and Middle East), and `oceania`. New funds have explicit `startingMarket` and `currentMarket`. The legacy `zone` field remains the authority for movement/trading and synchronizes `currentMarket` in commands and snapshots. Detention keeps `zone: "prison"` and exposes `currentMarket: null`; `previousZone` retains the market to return to.

Human starting choices are preserved. AI starting locations balance market occupancy, without changing opening cash, grades, or economic rules. The server recalculates AI placement at launch after remote humans choose their market.

Old country IDs are accepted only as a reading adapter for old clients and saves. Missing initial markets infer from an existing recognized nationality, then a valid saved location, then Europe if neither exists. The adapter never moves an existing fund or rewrites its company catalog, holdings, costs, cash, grades, or phase. Real legacy nationality fields remain when already supplied; new market selections never invent a nationality. Explicit invalid market IDs are rejected instead of falling back to a legacy country.

## Economy v3

New games take normalized values from the local catalogue. `src/economy.ts` separates approximate, sourced real capitalizations from game values: game classes use 40/200 billion USD thresholds, then logarithmic interpolation within each class. The measured `progression-growth` scenario uses full-company C/C prices 25–100 / 180–450 / 550–1500 M€ and per-sector-landing incomes of 10 / 12 / 14 percent of those prices. Large shares cost 110–300 M€ at opening C/C. These yields are gameplay parameters, not real annual investment returns. Embedded saved catalogs are never repriced.

Normal/hard AI destination scoring ignores shares it cannot buy after its existing cash reserve and the travel cost. The scoring formula and easy strategy are preserved. AI uses the same validated command API as humans. Reproducible balancing reports and their limitations are documented in `ECONOMY_BALANCING.md`.

## Settlement authority

Insufficient cash opens `phase: "settlement"` when liquid assets remain. The debt, resume phase, creditor order, frozen priority values, decision actor and optional offer are part of the state. A rejected engine command leaves that state intact.

- `LIQUIDATE_ASSETS` sells selected owned shares across markets to fund the obligation. Partial liquidation may keep the selection phase open.
- `PROPOSE_SETTLEMENT` freezes server prices; it accepts assets below, equal to or above the debt, provided the payer can cover the cash complement.
- `ACCEPT_SETTLEMENT`, `REJECT_SETTLEMENT` and `REQUIRE_CASH` belong to the pending creditor, not necessarily the active turn player.
- `cashDelta = debt − frozenAssetValue`; positive cash goes debtor→creditor, negative cash goes creditor→debtor. Receiving cost basis uses full frozen share value.
- Multi-creditor order uses ascending fund valuation then stable seat order, as explicitly confirmed by the user. Values are frozen before payments.
- This exceptional liquidation bypasses normal zone/detention sale restrictions and never grants ordinary buying rights. Exhausted insufficient assets trigger insolvency with only funded money credited.

Simulation and server loops use `getDecisionPlayerId(state)` before selecting and executing an AI command; using only `activePlayerId` would miss creditor decisions. The engine still has no socket, database, timer or UI dependency. Persistence and command serialization belong to the server. Structured receipts are kept in `settlementHistory` with title values, signed cash, reason, cycle and unpaid amount.

Full French rules and presentation behavior: [SETTLEMENT_RULES.md](../../SETTLEMENT_RULES.md).
