# Game engine

The TypeScript facade validates typed commands and clones the state before applying them. Rejected commands leave the original state intact. The engine has no UI, networking, timers, persistence, or browser dependencies. Its local CommonJS core is adapted from the old project; the old project itself remains untouched.

## Turn schedule

Cycle 1 starts with all indices at C, no Context, and each player's nationality market already selected at no cost. Players roll, resolve their cell, trade, end their turn, then acknowledge the next turn. Cycle 2 onward opens with one shared Context and each player chooses geography before rolling. Staying costs zero; moving to another market costs 1 M€. A detained player rolls their trial in geography on a subsequent turn. A failed trial skips the turn; detention on a cell immediately skips trading. No jailed holder receives sector income or Event dividends, although NAV continues to reflect prices.

## Data additions

All original 44 cells keep their relative order. The eight inserted cells are two Events, two real estate, and one each of transport, media, finance, and technology. Underrepresented sectors first gain four additional cells to reach four appearances; finance and technology receive the other two sector additions. Every sector consequently appears four or five times. There are 38 sector cells, 10 Events, 3 market cells, and Start. Extra Events sit in the two longest gaps in the original Event layout. This keeps every sector represented without increasing the original three global market shocks.

The separate Event deck contains the original 28 incidents plus 22 distinct financial stories covering dividends, fines, buybacks, required sales, margin calls, regulation, cash, and targeted detention. Event cards never change economic grades. Only the Context deck (100 cards) and Bull/Bear/Crash cells change grades. Event discards reshuffle when exhausted.

The opening cycle is numbered 1. The 100 Context cards govern cycles 2 through 101; after every solvent player completes the final Context cycle, the next-turn command finishes the game and ranks solvent funds by current NAV. If only one solvent fund remains, the game ends earlier.

Event notices publish the selected company's ID and name, its zone and sector, and the effect separately from the story. Judicial targeting never depends on parsing the narrative.

## Start accounting

On crossing Start, performance is current NAV minus the previous Start NAV, excluding external capital flows since that baseline. A positive result injects 20 M€, a negative result withdraws 20 M€ through the normal forced-sale payment process, and an unchanged value produces no flow. The new baseline is recorded after that flow, before resolving the landing cell. Lap notices expose performance in M€ and percentage return. Monetary amounts are rounded to cents for comparing NAV, so floating point noise cannot trigger a reward.

Full control of one company guarantees at least C/C income. A monopoly requires all five shares of every company in the same zone and sector and guarantees at least A/A income. At E/E an available company pays its current liquidation share value to holders, clears holdings and acquisition basis, and stays unavailable until either grade improves.

All dice and card draws are authoritative random outcomes. Runtime validation rejects unknown command fields, including injected `die`, `roll`, or `value`.
