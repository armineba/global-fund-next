# Répartition actuelle du marché

État généré depuis `packages/game-engine/legacy/data/gameData.json`, avec les capitalisations de `docs/market-caps.json` consultées le **2026-10-06**. Le catalogue contient **91 IDs uniques**. Les cellules montrent `nombre (Small / Medium / Large)` selon les seuils Global Fund : Small `<40 Md USD`, Medium `40 à <200 Md`, Large `≥200 Md`. Les capitalisations réelles sont des repères d’ordre de grandeur; elles ne sont pas des prix de jeu.

## Matrice zone × secteur × taille

| Secteur | Amériques | Europe | Asie | Afrique & Moyen-Orient | Océanie | Total (S/M/L) |
|---|---:|---:|---:|---:|---:|---:|
| Technologie | 7 (0/0/7) | 1 (0/0/1) | 4 (0/0/4) | 0 (0/0/0) | 1 (1/0/0) | 1/0/12 |
| Finance | 6 (1/0/5) | 2 (0/0/2) | 4 (0/2/2) | 1 (1/0/0) | 1 (0/1/0) | 2/3/9 |
| Industrie | 5 (0/3/2) | 5 (0/2/3) | 3 (1/2/0) | 0 (0/0/0) | 1 (1/0/0) | 2/7/5 |
| Santé | 2 (0/1/1) | 6 (0/3/3) | 0 (0/0/0) | 0 (0/0/0) | 1 (0/1/0) | 0/5/4 |
| Énergie | 4 (1/1/2) | 3 (0/2/1) | 2 (0/1/1) | 1 (1/0/0) | 1 (1/0/0) | 3/4/4 |
| Immobilier & infrastructures | 0 (0/0/0) | 0 (0/0/0) | 1 (1/0/0) | 2 (2/0/0) | 1 (1/0/0) | 4/0/0 |
| Agroalimentaire & ressources | 7 (0/4/3) | 4 (0/3/1) | 0 (0/0/0) | 0 (0/0/0) | 1 (1/0/0) | 1/7/4 |
| Communication & médias | 3 (0/3/0) | 1 (1/0/0) | 1 (0/0/1) | 2 (2/0/0) | 1 (1/0/0) | 4/3/1 |
| Transports & logistique | 1 (0/1/0) | 2 (1/1/0) | 2 (1/0/1) | 0 (0/0/0) | 1 (1/0/0) | 3/2/1 |
| **Total (S/M/L)** | 35 (2/13/20) | 24 (2/11/11) | 17 (3/5/9) | 6 (6/0/0) | 9 (7/2/0) | **91 (20/31/40)** |

### Totaux par zone

| Zone | Entreprises | Small | Medium | Large |
|---|---:|---:|---:|---:|
| Amériques | 35 | 2 | 13 | 20 |
| Europe | 24 | 2 | 11 | 11 |
| Asie | 17 | 3 | 5 | 9 |
| Afrique & Moyen-Orient | 6 | 6 | 0 | 0 |
| Océanie | 9 | 7 | 2 | 0 |
| **Total** | **91** | **20** | **31** | **40** |

## Groupes et potentiel de monopole

Un groupe de la matrice correspond à une zone × un secteur. Un groupe à une entreprise est plus facile à monopoliser puisqu’il ne demande de contrôler qu’un émetteur; un groupe avec deux entreprises ou plus demande de réunir les positions de toutes les entreprises du groupe. Cela décrit la structure du catalogue, pas la probabilité effective d’un monopole en partie.

Sur **45 groupes possibles** : **9** sont vides, **16** ont une entreprise, et **20** en ont au moins deux. Sur les 36 cases occupées, 16 sont des groupes à émetteur unique et 20 demandent deux positions ou plus.

### Groupes à entreprise unique

| Zone | Secteur | Entreprise | CAP Global Fund |
|---|---|---|---|
| Amériques | Transports & logistique | United Parcel Service, Inc. | Medium |
| Europe | Technologie | SAP SE | Large |
| Europe | Communication & médias | Vodafone Group Plc | Small |
| Asie | Immobilier & infrastructures | Sun Hung Kai Properties Limited | Small |
| Asie | Communication & médias | China Mobile Limited | Large |
| Afrique & Moyen-Orient | Finance | Qatar National Bank | Small |
| Afrique & Moyen-Orient | Énergie | Sasol Limited | Small |
| Océanie | Technologie | WiseTech Global Limited | Small |
| Océanie | Finance | Commonwealth Bank of Australia | Medium |
| Océanie | Industrie | Fortescue | Small |
| Océanie | Santé | CSL Limited | Medium |
| Océanie | Énergie | Origin Energy | Small |
| Océanie | Immobilier & infrastructures | Goodman Group | Small |
| Océanie | Agroalimentaire & ressources | Woolworths Group Limited | Small |
| Océanie | Communication & médias | Telstra Group | Small |
| Océanie | Transports & logistique | Qantas Airways | Small |

### Cellules vides

| Zone | Secteurs sans entreprise |
|---|---|
| Amériques | Immobilier & infrastructures |
| Europe | Immobilier & infrastructures |
| Asie | Santé, Agroalimentaire & ressources |
| Afrique & Moyen-Orient | Technologie, Industrie, Santé, Agroalimentaire & ressources, Transports & logistique |

### Groupes avec plusieurs entreprises

| Zone | Secteur | Nombre | Sociétés |
|---|---|---:|---|
| Amériques | Technologie | 7 | Cisco Systems, Inc., Intel Corporation, International Business Machines Corporation (IBM), Oracle Corporation, Microsoft Corporation, Alphabet Inc., Apple Inc. |
| Amériques | Finance | 6 | Banco do Brasil, Mastercard Incorporated, Visa Inc., JPMorgan Chase & Co., Wells Fargo & Company, Berkshire Hathaway Inc. |
| Amériques | Industrie | 5 | NIKE, Inc., 3M Company, The Boeing Company, The Procter & Gamble Company, GE Aerospace |
| Amériques | Santé | 2 | Pfizer Inc., Johnson & Johnson |
| Amériques | Énergie | 4 | Enel Chile, Petróleo Brasileiro S.A. (Petrobras), Chevron Corporation, Exxon Mobil Corporation |
| Amériques | Agroalimentaire & ressources | 7 | Walmart de México y Centroamérica, McDonald’s Corporation, Philip Morris International Inc., Ambev S.A., PepsiCo, Inc., The Coca-Cola Company, Walmart Inc. |
| Amériques | Communication & médias | 3 | América Móvil, AT&T Inc., The Walt Disney Company |
| Europe | Finance | 2 | Banco Santander, S.A., HSBC Holdings plc |
| Europe | Industrie | 5 | Siemens AG, LVMH Moët Hennessy Louis Vuitton SE, British American Tobacco p.l.c., Industria de Diseño Textil, S.A. (Inditex), L’Oréal S.A. |
| Europe | Santé | 6 | AstraZeneca PLC, GSK plc, Bayer AG, Sanofi, Novartis AG, Roche Holding AG |
| Europe | Énergie | 3 | TotalEnergies SE, BP p.l.c., Shell plc |
| Europe | Agroalimentaire & ressources | 4 | Heineken N.V., Unilever PLC, Anheuser-Busch InBev SA/NV, Nestlé S.A. |
| Europe | Transports & logistique | 2 | Mercedes-Benz Group AG, Volkswagen AG |
| Asie | Technologie | 4 | Taiwan Semiconductor Manufacturing Company Limited, Tencent Holdings Limited, Alibaba Group Holding Limited, Samsung Electronics Co., Ltd. |
| Asie | Finance | 4 | PT Bank Central Asia Tbk, Ping An Insurance (Group) Company of China, Ltd., Bank of China Limited, Industrial and Commercial Bank of China Limited |
| Asie | Industrie | 3 | FANUC Corporation, Mitsubishi Heavy Industries (MHI), Komatsu Ltd. |
| Asie | Énergie | 2 | China Petroleum & Chemical Corporation (Sinopec), PetroChina Company Limited |
| Asie | Transports & logistique | 2 | Tata Motors Limited, Toyota Motor Corporation |
| Afrique & Moyen-Orient | Immobilier & infrastructures | 2 | Orascom Construction PLC, Emaar Properties PJSC |
| Afrique & Moyen-Orient | Communication & médias | 2 | Maroc Telecom, MTN Group Limited |

## Immobilier en Asie et en Afrique & Moyen-Orient

Le secteur Immobilier & infrastructures est désormais présent en Asie avec **Sun Hung Kai Properties Limited** et en Afrique & Moyen-Orient avec **Orascom Construction PLC, Emaar Properties PJSC**. L’Asie compte 1 entreprise de ce secteur; la zone Afrique & Moyen-Orient en compte 2. Ces remplacements gardent les mêmes IDs historiques et le catalogue total à 91.

## Lecture des classes

La CAP Global Fund est la classification utilisée pour ordonner les entreprises dans le jeu : Small `<40 Md USD`, Medium `40 à <200 Md USD`, Large `≥200 Md USD`. Elle est calibrée sur les grandes entreprises du catalogue. Les classifications boursières conventionnelles ont des seuils différents et variables selon les marchés; leur comparaison indicative figure dans [`COMPANY_AUDIT.md`](COMPANY_AUDIT.md). La CAP Global Fund est une normalisation de progression de jeu, pas une catégorie financière officielle.

La matrice fait ressortir une Océanie entièrement en groupes singleton, des groupes singleton en Afrique & Moyen-Orient, et des groupes finance/technologie/industrie plus étoffés en Asie et dans les Amériques. Les cellules vides sont des choix de rareté du catalogue; elles ne constituent pas toutes des manques à combler.

## Prix et revenus du jeu

Les capitalisations ci-dessus ne sont pas converties directement en prix de jeu. La grille économie v3 retenue (`progression-growth`) a reçu une première validation simulée : 100 parties finales, dans le cadre de 420 exécutions comparatives documentées. Elle conserve des limites : 193 fonds sur 300 deviennent insolvables, et la progression des positions Medium n’est pas régulière. Voir [`ECONOMY_BALANCING.md`](ECONOMY_BALANCING.md) pour la grille, la méthode de normalisation et les résultats.
