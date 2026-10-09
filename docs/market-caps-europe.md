# European company market caps

Approximate public market capitalizations for the 24 Europe-zone companies in the current catalog, rounded to two significant figures. Values are in USD and are reference data for ranking and market-size context; they do not set in-game share prices or company values.

For a readable regional grouping only, this table uses these broad bands: Small below $10B, Medium from $10B to below $100B, and Large at $100B or more. These bands are not a game pricing formula.

All values were collected on 2026-10-06. CompaniesMarketCap pages report the amounts in USD, so no currency conversion was applied. `asOf` records the month or date shown by the source. Market caps move with prices and outstanding shares; values are rounded estimates.

| ID | Current catalog name | Approx. market cap (USD) | Band | As of | Source |
|---|---|---:|---|---|---|
| `sabmiller-plc` | Heineken N.V. | $44B | Medium | 2026-10 | [Heineken market cap](https://companiesmarketcap.com/heineken/marketcap/) |
| `vodafone-group-plc` | Vodafone Group Plc | $39B | Medium | 2026-10-05 | [Vodafone market cap](https://companiesmarketcap.com/vodafone/marketcap/) |
| `astrazeneca-plc` | AstraZeneca PLC | $260B | Large | 2026-09 | [AstraZeneca market cap](https://companiesmarketcap.com/astrazeneca/marketcap/) |
| `siemens-ag` | Siemens AG | $240B | Large | 2026-10 | [Siemens market cap](https://companiesmarketcap.com/siemens/marketcap/) |
| `sap` | SAP SE | $240B | Large | 2026-10 | [SAP market cap](https://companiesmarketcap.com/sap/marketcap/) |
| `lvmh-sa` | LVMH Moët Hennessy Louis Vuitton SE | $210B | Large | 2026-10 | [LVMH market cap](https://companiesmarketcap.com/lvmh/marketcap/) |
| `british-american-tobacco-plc` | British American Tobacco p.l.c. | $120B | Large | 2026-09 | [British American Tobacco market cap](https://companiesmarketcap.com/british-american-tobacco/marketcap/) |
| `daimler-ag` | Mercedes-Benz Group AG | $43B | Medium | 2026-10 | [Mercedes-Benz market cap](https://companiesmarketcap.com/mercedes-benz-group/marketcap/) |
| `inditex-s-a` | Industria de Diseño Textil, S.A. (Inditex) | $190B | Large | 2026-10 | [Inditex market cap](https://companiesmarketcap.com/inditex/marketcap/) |
| `l-oreal-sa` | L’Oréal S.A. | $220B | Large | 2026-10 | [L’Oréal market cap](https://companiesmarketcap.com/l-oreal/marketcap/) |
| `glaxosmithkline-plc` | GSK plc | $94B | Medium | 2026-10 | [GSK market cap](https://companiesmarketcap.com/glaxo-smith-kline/marketcap/) |
| `banco-santander-s-a` | Banco Santander, S.A. | $200B | Large | 2026-10 | [Santander market cap](https://companiesmarketcap.com/santander/marketcap/) |
| `total-sa` | TotalEnergies SE | $190B | Large | 2026-10-05 | [TotalEnergies market cap](https://companiesmarketcap.com/totalenergies/marketcap/) |
| `volkswagen-ag` | Volkswagen AG | $38B | Medium | 2026-10 | [Volkswagen market cap](https://companiesmarketcap.com/volkswagen/marketcap/) |
| `bp-plc` | BP p.l.c. | $110B | Large | 2026-10-05 | [BP market cap](https://companiesmarketcap.com/bp/marketcap/) |
| `bayer-ag` | Bayer AG | $55B | Medium | 2026-09 | [Bayer market cap](https://companiesmarketcap.com/bayer/marketcap/) |
| `unilever-nv` | Unilever PLC | $130B | Large | 2026-10 | [Unilever market cap](https://companiesmarketcap.com/unilever/marketcap/) |
| `sanofi` | Sanofi | $95B | Medium | 2026-10-05 | [Sanofi market cap](https://companiesmarketcap.com/sanofi/marketcap/) |
| `hsbc-holdings-plc` | HSBC Holdings plc | $330B | Large | 2026-10 | [HSBC market cap](https://companiesmarketcap.com/hsbc/marketcap/) |
| `royal-dutch-shell` | Shell plc | $280B | Large | 2026-10 | [Shell market cap](https://companiesmarketcap.com/shell/marketcap/) |
| `anheuser-busch` | Anheuser-Busch InBev SA/NV | $150B | Large | 2026-09 | [AB InBev market cap](https://companiesmarketcap.com/anheuser-busch-inbev/marketcap/) |
| `nestle` | Nestlé S.A. | $230B | Large | 2026-10 | [Nestlé market cap](https://companiesmarketcap.com/nestle/marketcap/) |
| `novartis` | Novartis AG | $270B | Large | 2026-10 | [Novartis market cap](https://companiesmarketcap.com/novartis/marketcap/) |
| `roche` | Roche Holding AG | $340B | Large | 2026-10 | [Roche market cap](https://companiesmarketcap.com/roche/marketcap/) |

**Catalog mapping notes:** The obsolete SABMiller slot now represents the separately listed brewer Heineken; the market-cap figure is Heineken's own, and does not imply that Heineken acquired or succeeded SABMiller. The legacy Anheuser-Busch slot uses the current listed parent AB InBev as a proxy because Anheuser-Busch is no longer an independent listed company. Those two cases have less direct comparability with the historical entities.

## Data shape

[`market-caps-europe.json`](./market-caps-europe.json) stores one object for each of the 24 European catalog IDs, with the current catalog name, rounded numeric USD value, source date, collection date, source title and URL, evidence note, and confidence rating. The per-company evidence records the figure and date printed by the source.
