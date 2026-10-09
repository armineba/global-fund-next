# Reproducible visual validation

> Latest iteration: see **Sector income without self-payment — 2026-10-09** below. Earlier economy image counts, portfolio impact captures and FPS samples are historical.

The visual capture harness serves the current production frontend build from `apps/web/dist` through an isolated server at `127.0.0.1:3192`. It unsets `DATABASE_URL`, sets `PUBLIC_ORIGIN` to that local origin, and stores the fixture rooms in a unique temporary directory under `/tmp`. It removes the temporary directory and closes the browser and server when capture ends. It does not add an HTTP debug endpoint or modify gameplay/server code.

Run `npm run build` after frontend edits, then `npm run capture:visuals`. The script is also available as `npx tsx scripts/capture-visuals.ts`. Screenshots and a machine-readable report are written to `screenshots/visual-validation/`.

Fixtures are visual test data, not real or saved player sessions. Each uses six fictional local funds with explicit `startingMarket` values, pawns, and varied holdings; nationality is not fixture input. The persisted resume token is the fixed test-only value `visual-validation-session-only`; only its SHA-256 hash is saved in each room, and the browser provides the token through local storage. The game snapshots are made with `createGame`, adjusted in memory, and passed through real `executeCommand` calls for context, board-event, crash, and prison states. Public player/NAV values are recalculated with `getGameView`. Seeded `Math.random` is scoped to fixture preparation and restored before the server starts.

The standard capture set includes the main menu, lobby, gameplay/trading, 100% portfolio, multi point analysis, Context card, board event, Market Crash, and judicial detention scenes at 1920×1080. Gameplay is also captured at 1440×900 and 1366×768. A separate gameplay capture uses low graphics quality and reduced motion. For normal and low/reduced gameplay, the report records observed browser `requestAnimationFrame` rate and the board's own `data-fps` sample over three seconds. Headless Chromium uses SwiftShader; these numbers describe the software-rendered capture environment and should not be presented as a real GPU benchmark or as a target frame rate.

Each game capture waits for the board's `data-scene-ready=true` marker. It then fails on browser page/console errors, a DOM accessible board list other than 52 cells, fewer than six fund pawns, or horizontal document overflow. The fixtures assert ownership totals do not exceed five shares per company, that the whole Europe/technology group is held at five shares by one fund, and that Context/event/crash/prison scenes came from the corresponding engine actions. Several analysis history points are generated through real `NEXT_TURN` Context resolutions against a cloned fixture state. Screenshot labels describe the fixture scene and viewport only; they do not represent actual player activity.

For quick review, the default 1920×1080 captures are also copied to `screenshots/{main-menu,lobby,gameplay,trading,portfolio,analysis,context,context-event,event,crash,prison}.png`.

## Asset paths

- Fonts: `apps/web/public/assets/fonts/Cinzel[wght].ttf`, `CormorantGaramond[wght].ttf`, `Inter[opsz,wght].ttf`, and `IBMPlexMono-*.ttf`.
- Premium pawn renders: `apps/web/public/assets/pawns/premium/{lion,bull,globe,crystal,tower,leaf}.webp` (PNG source sprites remain available beside them).
- Premium board city renders: `apps/web/public/assets/world/cities/*.webp`.
- Scenic images used by the frontend: `apps/web/public/assets/scenes/` and `apps/web/public/assets/scenes/wealth/{distressed,office,desk,tower,floor,gold,world,justice}.webp`.

## Earlier capture run (2026-10-06; superseded by the final validation below)

The latest final-build targeted run refreshed Context, event, Market Crash, prison, trading, portfolio, and the 1366×768 gameplay screenshot. All captures completed with no browser page/console/request errors, no horizontal document overflow, and (for game scenes) 52 accessible board cells and six visible fund pawns. The gameplay view closes the automatically opened terminal; `trading` shows the market tab and `portfolio` shows the Portfolio tab with six positions. The context, event, Market Crash, and prison captures wait for their exact card heading before saving. Context opens with its impact carousel visible; the prison scene uses the justice image.

The phase title and sector row do not overlap at 1920×1080, 1440×900, or the final 1366×768 layout. At 1366×768, the title is 12px in a 120×31px box at (161, 68), and the sector row begins at x=300; their bounds do not intersect. The document width matches the viewport at all three gameplay sizes.

The cold-start sample (1 FPS browser RAF, board 0) occurred during SwiftShader startup and is superseded by the warmed-up run. `--perf-only` waits 15 seconds after closing the terminal, waits for a nonzero board `data-fps` in normal mode (up to 30 seconds), then samples browser RAF and board FPS for three seconds. In low/reduced-motion mode it performs the same 15-second warmup but skips the board-FPS readiness wait because reduced motion intentionally stops the board ticker. This earlier run measured 8 browser RAF FPS and 7 board FPS in normal mode, and 60 browser RAF FPS with board FPS 0 in low/reduced-motion mode. These values are superseded by the 2026-10-07 warmed measurements below.

The earlier Context interaction check advanced the carousel with a wheel gesture. The current screenshot state is documented below; this older run's claim that the screenshot returned to the first card does not apply to the current capture.

## Earlier UI baseline before the economy follow-up — 2026-10-06 (superseded)

The 06:57 final UI build completed all eight Playwright E2E scenarios (2.8 minutes). They covered free travel consultation and return, a paid trip and its receipt, Continue before market impact, a two-share single-command purchase, statistics resizing, normal dice/result/pawn/card order, local handoff, remote reconnect, and tablet market selection.

The initial static run saved 39 PNGs: 13 views (`main-menu`, `lobby`, `gameplay`, `trading`, `portfolio`, `analysis`, `statistics`, `geography`, `context`, `event`, `crash`, `prison`, and `ending`) at 1920×1080, 1440×900, and 1366×768. Exact files remain archived under `baseline/ux-economy-2026-10-06/screenshots/visual-validation/`. That run ended before transient phase captures and `--perf-only`; its incomplete status has since been superseded by the final validation below.

At this earlier point, `capture-report.json` contained only the targeted run, and four phase aliases were absent. The report, images, and aliases have since been updated; see the final status below.

## Final validation of the economy UI — 2026-10-07

The current report contains 57 image entries: the standard 13-view matrix at three desktop sizes (39 images), two initial market setup views (1920 and 1366), five office environments at 1920 and 1366 (10 images), five presentation phases at 1920, and one low/reduced-motion view at 1440. All 13 required aliases are present under `screenshots/current/`.

Images were refreshed selectively across releases. The main menu, lobby, analysis, statistics, market setup, and unaffected gameplay/trading views were retained from build `.releases/2026-10-07T06-58-54-730Z-301204` because later UI fixes were scoped elsewhere. Portfolio was refreshed at all three sizes and Trading at 1366 after `.releases/2026-10-07T07-13-00-295Z-303240`. The five board-event/end scenes were captured at all sizes, Geography at 1440 and 1366, and all five office environments at 1920 and 1366 on that release; Geography-1920 remained from the earlier capture set. Context-1366 was refreshed after `.releases/2026-10-07T07-31-19-997Z-306039`; Context-1920 and 1440 were retained from the prior capture because the later CSS correction only targeted laptop height. The standard matrix is complete, but this provenance means not every PNG was regenerated from one build.

The 1366×768 portfolio check verifies a 104px `.td-table-scroll`, 11 selectable positions, a first row visible below the sticky header, and a successful second-row selection followed by restoration of the first row at scroll position 0. The selected-company ticket ends at y=566.36 inside the detail card ending at y=576; the disabled reason also ends at y=566.36. The Context-1366 check verifies two visible grade rows and the first company's after-price (y=532.5–552) above the footer (top y=557). The Context carousel still advances on wheel input; the 1920 screenshot shows item 7/26 after the interaction and is not described as item 1.

The five phase images (`dice-rolling`, `dice-result`, `pawn-moving`, `market-impact`, and `portfolio-impact`) use a Playwright clock installed and paused before navigation. The capture explicitly advances fake time and verifies the requested stage again after a render frame. Any phase `data-fps` value comes from this controlled 16ms render and is not a performance result.

Separate `--perf-only` sampling used headless Chromium launched with ANGLE/SwiftShader. After a 15-second warmup, normal mode sampled 3016ms at browser RAF 10 FPS and board `data-fps` 8 FPS. Low quality with reduced motion sampled 3007ms at browser RAF 60 FPS and board `data-fps` 0; the stopped ticker is expected in this mode. These results describe the software-rendered capture environment, not a hardware benchmark or target frame rate. The machine-readable details and image provenance are in `screenshots/visual-validation/capture-run-status.json` and `capture-report.json`.

## Settlement and compact terminal validation — 2026-10-07

**33 distinct images** were validated at 1920×1080, 1440×900 and 1366×768:

| Set | Views | Images |
| --- | --- | --- |
| Terminal and cards | Trading, Portfolio/value card, Analysis, Statistics, Context, newspaper Event | 18 |
| Settlement | Selection, forced liquidation selection, creditor offer, offer over debt, multi-creditor priority | 15 |

The ten exact requested aliases in `screenshots/current/` now use 1366×768. Baseline images and sources remain under `baseline/clearing-2026-10-07/`. The [machine-readable manifest](clearing-visual-validation.json) records each file, dimensions, timestamp, SHA-256, source release and layout metrics.

### Results and review

- `npm test`: 122 passing tests in nine files, including 18 dedicated settlement scenarios and authoritative server persistence/authorization tests.
- `npm run test:e2e`: 15/15 passing (6.8 minutes), including three live settlement workflows, offers worth 12/20/27 M€ for a 20 M€ debt, unaffordable creditor cash, refusal/reproposal, market liquidation and frozen NAV/seat priority.
- `npm run build`: typecheck and production build pass. Final release: `.releases/2026-10-07T21-22-53-574Z-337339`.
- Major-result checks wait 5.2 seconds and still require **Reprendre la séance**. This is deliberate persistence, not an increased dismissal timer.
- General capture guards reject page/console/request errors, horizontal overflow, HUD overlaps or anything other than 52 accessible cells and six fixture pawns. Settlement guards also check the desk, fixed footer and visible action bounds (2 px tolerance); no page or console errors occurred.
- Trading and Portfolio historical charts are fully readable inside the details viewport at all three sizes: 250 px at 1920, 180 px at 1440, 155 px at 1366. The quote and order remain fixed. At 1366, the Portfolio table is 195 px high with 11 selectable rows; selection, scroll reset and disabled-order explanation are checked.
- Context checks at all three sizes ensure changed grades and the first company's after-price are above the footer before scrolling. Wheel input advances the company carousel. At 1366 the first after-price ends at y=552 before the footer at y=557; at 1440 it ends at y≈575 before y=676.
- Visual review compared the archived laptop terminal/newspaper images and checked wide, intermediate and laptop charts, cards and clearing desks. The intermediate review found two clipping defects missed by the initial laptop-only guards; both were fixed, the guards expanded, and the nine affected images regenerated.

### Image provenance

Trading, Portfolio and Context were refreshed at all three sizes on the final 21:22 release. Analysis, Statistics and newspaper Event retain the successful 21:12 release: the final CSS changes affect only the trading details and Context selectors, absent from those views. The 15 settlement images retain the successful 20:55 presentation release; later updates only change company logos and trading/Context presentation, absent from the captured clearing desks. Business logic and network code are identical across these presentation releases; logo metadata is the only catalog change. The 15 E2E paths ran on the 20:55 presentation release; subsequent changes are verified by the targeted visual guards, latest catalog tests and production typecheck/build.

The exact current alias names are: `trading`, `value-card`, `analysis`, `event-newspaper`, `context`, `settlement`, `forced-liquidation`, `share-offer`, `share-offer-over-debt`, and `multi-creditor-settlement`.

### Deployment and limits

The public HTTPS index matches the final build, health is OK, and both Next and the historical service are active. Final integrity checks found 157 historical source files and two infrastructure configurations unchanged. The catalog contains 47 locally mapped real logos and 44 documented monograms after retiring the old Telstra lockup; Oracle's wordmark color follows the official current guide.

These static captures use reduced motion and headless software rendering. They are not a new 60 FPS benchmark. Real laptop GPU measurement, user balancing trials and load tests remain separate follow-up work; the earlier economy simulations precede settlement and do not demonstrate its balance.


## 8 octobre 2026 — configuration et lecture compacte

Onze captures nouvelles, avec le même build atomique : Contextes et dépêches aux formats 1920×1080, 1440×900 et 1366×768 ; fiches de versement aux mêmes trois tailles ; étapes d’ajustement des cours et des fonds en 1366×768. Les alias récents dans `screenshots/current/` utilisent la taille laptop.

Contrôles : notes et premier prix après visibles dans le Contexte sans footer, carrousel à la molette, en-tête versement du bon fonds sans cycle et avec un seul bouton, bouton Valider les cours lisible, absence de superposition sur le HUD. Revue visuelle du journal, Contexte, versement et ajustements effectuée. Les tests couvrent aussi le clavier Échap, le survol passif du plateau, le retour depuis le salon, la reprise de brouillon et le rechargement.

Les 16 scénarios navigateur ont été validés sur le build courant ; trois anciens échecs de harnais ont été corrigés puis relancés, et le test de configuration étendu au salon a été relancé seul. Les 123 tests moteur/serveur/présentation passent. La performance GPU n’a pas été remesurée pour cette itération.

Provenance et empreintes : [ux-reading-validation.json](ux-reading-validation.json).

Commandes de capture :

```bash
npm run capture:visuals -- --only=context,event
npm run capture:visuals -- --only=market-impact,portfolio-impact --size=1366
npm run capture:settlement -- --payment-card-only
```


### Correction suivante — bilan financier persistant

Les versements sans évolution réelle du marché ne passent plus par le panneau vide « Les cours s’ajustent / Règlements de la séance ». Le bilan qui suit attend toujours Continuer, quel que soit le montant. Les mouvements réels de notes/cours conservent leur mise en scène.

Deux captures en 1366×768 (`screenshots/current/income-reading-no-preference.png` et `income-reading-reduce.png`) montrent le bilan après 35 secondes simulées, avec son bouton visible. Le scénario vient d’un vrai ROLL IA sur une case Énergie versant 1 M€ depuis la banque ; sa route de préparation n’existe que sur le serveur de tests. Les tests vérifient l’absence de MARKET_IMPACT, le maintien du bilan et la reprise uniquement après clic. Le parcours de Contexte réel reste validé.

Validation : 123 tests unitaires/intégration, trois scénarios navigateur ciblés et build. Le premier test réduit a rencontré une date passée dans la simulation Playwright ; la cible de pause future corrige le harnais, et les deux modes ont été relancés avec succès. Revue visuelle du bilan réduite effectuée. Provenance : [portfolio-reading-validation.json](portfolio-reading-validation.json).

## Global settlement receipts — 2026-10-09

The redundant financial ribbon (`PORTFOLIO_IMPACT`) is removed. The one final receipt lists every creditor, transferred shares, cash top-ups, liquidations and unpaid balances. Immediate cash operations combine the debt announcement and receipt; pending operations open the decision desk after motion and show their single receipt after the last decision. Real market adjustments still wait for `Valider les cours` and then return directly to gameplay.

Browser fixtures cover two-creditor cash payments, automatic payment followed by negotiated shares, reconnection, and the 1 M€ AI bank income with normal/reduced motion. The card remains readable after 35 seconds of simulated time; closing it opens no redundant market or financial ribbon. Final HUD figures are asserted after the number animation, rather than freezing its first frame. New receipts remain closed only after Échap. The old portfolio-impact screenshots describe an earlier version.

Captures: `screenshots/current/global-cash-settlement.png`, `global-negotiated-settlement.png`, `income-direct-{no-preference,reduce}.png`; `npm run capture:settlement -- --payment-card-only` captures the single-close receipt at 1920×1080, 1440×900 and 1366×768. All capture endpoints remain confined to isolated test servers.


## Named settlement movements — 2026-10-09

The receipt now groups movements under the sector-income reason. Repeated investor/completed headings and individual payment subtotals are removed. Cash rows name the actual payer and recipient, including reversed creditor top-ups; bank income is shown inside the corresponding sector group. One global paid total precedes the retained company carousel. Financial calculations are unchanged.

123 unit/integration tests pass. Three targeted browser scenarios passed; the cash case was rerun after the final subtotal removal. Production build/typecheck pass. Four final-build captures were reviewed: multi-creditor cash and the receipt at 1920×1080, 1440×900, 1366×768. The carousel remains below the summary within the existing details scroll; wheel/touch behavior is unchanged. Independent review found no concrete remaining receipt defect. No full E2E suite or new performance benchmark is claimed.

Release, image hashes and live checks: [receipt-lines-validation.json](receipt-lines-validation.json). HTTPS index matches the release, health is OK, both services are active, and historical sources/infrastructure remain unchanged.


## Sector income without self-payment — 2026-10-09

The engine no longer pays bank/market income to the active fund for its own shares on a sector landing. The receipt therefore contains only actual payments to other holders, plus any distinct existing cash flows. Historical receipts remain readable. README and in-game rules now describe this rule.

128 unit/integration tests pass across nine files; build/typecheck pass. Five targeted browser scenarios pass, including normal/reduced-motion AI payment to a human, cash creditors, negotiated transfer with reconnection and consecutive financing choices. Four E2E screenshots were refreshed: `global-cash-settlement`, `global-negotiated-settlement`, `income-direct-no-preference` and `income-direct-reduce`. The cash receipt was visually checked: no own bank-income line, correct named external movements, total and company carousel retained. No new desktop matrix or performance measurement is claimed.

The server was restarted after a verified PostgreSQL backup. Public index and health checks pass; the historical project and infrastructure remain unchanged. Provenance: [no-self-sector-income-validation.json](no-self-sector-income-validation.json).
