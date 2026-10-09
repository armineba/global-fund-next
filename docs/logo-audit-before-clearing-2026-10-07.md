# Audit des logos des 91 sociétés

État vérifié le 7 octobre 2026 à partir du catalogue actuel. Les monogrammes sont des initiales typographiques internes, pas des logos de marque.

## État actuel

- 91 sociétés auditées : **20 logos réels actifs** (chemin `logoPath` non nul) et **71 monogrammes** internes.
- Les 20 chemins actifs concordent exactement entre catalogue et manifeste; chaque actif source/auteur/licence reste renseigné dans `company-logo-updates.json`.
- Douze SVG ont été téléchargés dans cette passe : dix sont actifs dans le catalogue; deux candidats (Amazon et Meta) sont préparés localement mais ne sont ni mappés ni utilisés.
- Pas de logo Apple ajouté : la source Commons repérée repose sur une déclaration de domaine public limitée aux États-Unis et précise que le logo peut rester protégé ailleurs.
- Les nouveaux SVG ont été copiés dans les deux emplacements locaux, contrôlés XML et ne contiennent pas de `script`, `foreignObject`, de lien externe `href`/`src` ou d’URL distante dans le CSS.
- Les notices `PD-textlogo` / `PD-shape` concernent le copyright, pas les droits de marque.

## Actifs ajoutés lors de cette passe

| État | ID du catalogue | Nom actuel | Chemin local | Source / auteur | Licence copyright indiquée |
|---|---|---|---|---|---|
| Candidat non utilisé | `amazon-com` | Amazon.com, Inc. | `/assets/companies/logos/amazon.svg` | [Amazon 2024.svg](https://commons.wikimedia.org/wiki/File:Amazon_2024.svg) — Amazon.com, Inc.; Koto; NaN (créateur de caractères), métadonnées Commons | PD-textlogo (domaine public aux États-Unis); Trademarked |
| Actif | `alphabet-google-inc` | Alphabet Inc. | `/assets/companies/logos/alphabet.svg` | [Alphabet Inc Logo 2015.svg](https://commons.wikimedia.org/wiki/File:Alphabet_Inc_Logo_2015.svg) — Alphabet Inc.; vectorisé par Totie | PD-textlogo; Trademarked |
| Candidat non utilisé | — | Meta Platforms, Inc. | `/assets/companies/logos/meta.svg` | [Meta Platforms Inc. logo.svg](https://commons.wikimedia.org/wiki/File:Meta_Platforms_Inc._logo.svg) — Meta Platforms | PD-textlogo; Trademarked |
| Actif | `cisco-systems` | Cisco Systems, Inc. | `/assets/companies/logos/cisco.svg` | [Cisco logo blue 2016.svg](https://commons.wikimedia.org/wiki/File:Cisco_logo_blue_2016.svg) — Cisco | PD-textlogo; Trademarked |
| Actif | `toyota-motor` | Toyota Motor Corporation | `/assets/companies/logos/toyota.svg` | [Toyota carlogo.svg](https://commons.wikimedia.org/wiki/File:Toyota_carlogo.svg) — Toyota Motor Corporation; édition Commons par Maanshen | PD-textlogo / formes géométriques simples; Trademarked |
| Actif | `volkswagen-ag` | Volkswagen AG | `/assets/companies/logos/volkswagen.svg` | [Volkswagen logo 2019.svg](https://commons.wikimedia.org/wiki/File:Volkswagen_logo_2019.svg) — Volkswagen | PD-textlogo; Trademarked |
| Actif | `the-boeing-company` | The Boeing Company | `/assets/companies/logos/boeing.svg` | [Boeing full logo.svg](https://commons.wikimedia.org/wiki/File:Boeing_full_logo.svg) — Boeing; Richard Burch Eiber | PD-textlogo; Trademarked |
| Actif | `pfizer-inc` | Pfizer Inc. | `/assets/companies/logos/pfizer.svg` | [Pfizer (2021).svg](https://commons.wikimedia.org/wiki/File:Pfizer_(2021).svg) — Pfizer, Team | PD-textlogo; Trademarked |
| Actif | `agricultural-bank-of-china` | Sun Hung Kai Properties Limited | `/assets/companies/logos/sun-hung-kai.svg` | [Sun Hung Kai Properties logo.svg](https://commons.wikimedia.org/wiki/File:Sun_Hung_Kai_Properties_logo.svg) — Auteur inconnu; conversion vectorielle par Marsupilami | PD-shape; Trademarked |
| Actif | `industries-qatar` | Emaar Properties PJSC | `/assets/companies/logos/emaar.svg` | [Emaar logo.svg](https://commons.wikimedia.org/wiki/File:Emaar_logo.svg) — Emaar Properties (orthographié “Emmar” sur Commons) | PD-textlogo / formes simples; pas d’avertissement trademark explicite sur la page Commons consultée |
| Actif | `taiwan-semiconductor-manufacturing` | Taiwan Semiconductor Manufacturing Company Limited | `/assets/companies/logos/tsmc.svg` | [TSMC wordmark.svg](https://commons.wikimedia.org/wiki/File:TSMC_wordmark.svg) — Taiwan Semiconductor Manufacturing Company Limited | PD-shape / géométrie simple; Trademarked |
| Actif | `china-construction-bank-corp` | Komatsu Ltd. | `/assets/companies/logos/komatsu.svg` | [Komatsu company logos.svg](https://commons.wikimedia.org/wiki/File:Komatsu_company_logos.svg) — 鉄之介; fichier actualisé par Vikassinghhhh | PD-textlogo; Trademarked |

Amazon et Meta sont des candidats non utilisés, car absents du catalogue actuel. Aucun faux mapping n’est créé.

## Logos actifs déjà présents avant cette passe

| ID | Nom actuel | Chemin actif | Notes de fraîcheur / visuel |
|---|---|---|---|
| `siemens-ag` | Siemens AG | `/assets/companies/logos/siemens.svg` | Wordmark issu d’un actif officiel, file Commons révisé en 2022; sans pictogramme. |
| `sap` | SAP SE | `/assets/companies/logos/sap.svg` | Page Commons mise à jour depuis le système de marque SAP en 2025. |
| `gazprom` | Mitsubishi Heavy Industries (MHI) | `/assets/companies/logos/gazprom.svg` | Logo MHI issu de la marque corporate officielle; ID catalogue historique. |
| `total-sa` | TotalEnergies SE | `/assets/companies/logos/totalenergies.svg` | TotalEnergies wordmark rouge 2021; sans emblème multicolore. |
| `intel-corp` | Intel Corporation | `/assets/companies/logos/intel.svg` | Logo Intel 2020 issu du press kit officiel. |
| `ibm-corp` | International Business Machines Corporation (IBM) | `/assets/companies/logos/ibm.svg` | Wordmark huit barres historique mais encore utilisé; version comprend ®. |
| `royal-dutch-shell` | Shell plc | `/assets/companies/logos/shell.svg` | Wordmark Shell 2019; sans emblème coquillage. |
| `oracle-corp` | Oracle Corporation | `/assets/companies/logos/oracle.svg` | Wordmark classique; fichier Commons source initiale 2007, à revalider sur le portail Oracle. |
| `microsoft-corp` | Microsoft Corporation | `/assets/companies/logos/microsoft.svg` | Logo Microsoft avec fenêtres (2012); Commons le décrit comme actuel, révision en 2025. |
| `pacific-link` | Telstra Group | `/assets/companies/logos/pacific-link.svg` | Wordmark horizontal Telstra issu du site officiel, fichier Commons ancien (source initiale 2012); à revalider. |

Les logos avec des identifiants legacy restent associés à leur nom courant exact. Exemples : `agricultural-bank-of-china` désigne désormais Sun Hung Kai Properties Limited et `industries-qatar` désigne Emaar Properties PJSC; les fichiers mappés portent les marques correspondantes. Le mapping courant est vérifié par égalité des noms et des chemins dans le manifeste JSON.

## Roster des 91 entreprises

| ID | Nom courant | Ressource active |
|---|---|---|
| `orascom-construction-industries` | Orascom Construction PLC | Monogramme interne (pas de logo réel actif) |
| `tata-motors` | Tata Motors Limited | Monogramme interne (pas de logo réel actif) |
| `maroc-telecom` | Maroc Telecom | Monogramme interne (pas de logo réel actif) |
| `enersis` | Enel Chile | Monogramme interne (pas de logo réel actif) |
| `bank-central-asia` | PT Bank Central Asia Tbk | Monogramme interne (pas de logo réel actif) |
| `astra-international` | FANUC Corporation | Monogramme interne (pas de logo réel actif) |
| `industries-qatar` | Emaar Properties PJSC | Logo actif `/assets/companies/logos/emaar.svg` |
| `mtn-group` | MTN Group Limited | Monogramme interne (pas de logo réel actif) |
| `qatar-national-bank` | Qatar National Bank | Monogramme interne (pas de logo réel actif) |
| `sasol` | Sasol Limited | Monogramme interne (pas de logo réel actif) |
| `banco-brasil` | Banco do Brasil | Monogramme interne (pas de logo réel actif) |
| `amx` | América Móvil | Monogramme interne (pas de logo réel actif) |
| `walmex` | Walmart de México y Centroamérica | Monogramme interne (pas de logo réel actif) |
| `sabmiller-plc` | Heineken N.V. | Monogramme interne (pas de logo réel actif) |
| `vodafone-group-plc` | Vodafone Group Plc | Monogramme interne (pas de logo réel actif) |
| `mcdonald-s-corp` | McDonald’s Corporation | Monogramme interne (pas de logo réel actif) |
| `astrazeneca-plc` | AstraZeneca PLC | Monogramme interne (pas de logo réel actif) |
| `siemens-ag` | Siemens AG | Logo actif `/assets/companies/logos/siemens.svg` |
| `sap` | SAP SE | Logo actif `/assets/companies/logos/sap.svg` |
| `lvmh-sa` | LVMH Moët Hennessy Louis Vuitton SE | Monogramme interne (pas de logo réel actif) |
| `taiwan-semiconductor-manufacturing` | Taiwan Semiconductor Manufacturing Company Limited | Logo actif `/assets/companies/logos/tsmc.svg` |
| `nike-inc` | NIKE, Inc. | Monogramme interne (pas de logo réel actif) |
| `united-parcel-service` | United Parcel Service, Inc. | Monogramme interne (pas de logo réel actif) |
| `gazprom` | Mitsubishi Heavy Industries (MHI) | Logo actif `/assets/companies/logos/gazprom.svg` |
| `british-american-tobacco-plc` | British American Tobacco p.l.c. | Monogramme interne (pas de logo réel actif) |
| `3m-co` | 3M Company | Monogramme interne (pas de logo réel actif) |
| `mastercard-inc` | Mastercard Incorporated | Monogramme interne (pas de logo réel actif) |
| `the-boeing-company` | The Boeing Company | Logo actif `/assets/companies/logos/boeing.svg` |
| `daimler-ag` | Mercedes-Benz Group AG | Monogramme interne (pas de logo réel actif) |
| `inditex-s-a` | Industria de Diseño Textil, S.A. (Inditex) | Monogramme interne (pas de logo réel actif) |
| `l-oreal-sa` | L’Oréal S.A. | Monogramme interne (pas de logo réel actif) |
| `glaxosmithkline-plc` | GSK plc | Monogramme interne (pas de logo réel actif) |
| `petrobras` | Petróleo Brasileiro S.A. (Petrobras) | Monogramme interne (pas de logo réel actif) |
| `ping-an-insurance-group-co-of-china-ltd` | Ping An Insurance (Group) Company of China, Ltd. | Monogramme interne (pas de logo réel actif) |
| `banco-santander-s-a` | Banco Santander, S.A. | Monogramme interne (pas de logo réel actif) |
| `total-sa` | TotalEnergies SE | Logo actif `/assets/companies/logos/totalenergies.svg` |
| `volkswagen-ag` | Volkswagen AG | Logo actif `/assets/companies/logos/volkswagen.svg` |
| `bp-plc` | BP p.l.c. | Monogramme interne (pas de logo réel actif) |
| `philip-morris-international` | Philip Morris International Inc. | Monogramme interne (pas de logo réel actif) |
| `bayer-ag` | Bayer AG | Monogramme interne (pas de logo réel actif) |
| `sinopec` | China Petroleum & Chemical Corporation (Sinopec) | Monogramme interne (pas de logo réel actif) |
| `unilever-nv` | Unilever PLC | Monogramme interne (pas de logo réel actif) |
| `ambev` | Ambev S.A. | Monogramme interne (pas de logo réel actif) |
| `sanofi` | Sanofi | Monogramme interne (pas de logo réel actif) |
| `pepsico` | PepsiCo, Inc. | Monogramme interne (pas de logo réel actif) |
| `cisco-systems` | Cisco Systems, Inc. | Logo actif `/assets/companies/logos/cisco.svg` |
| `intel-corp` | Intel Corporation | Logo actif `/assets/companies/logos/intel.svg` |
| `hsbc-holdings-plc` | HSBC Holdings plc | Monogramme interne (pas de logo réel actif) |
| `ibm-corp` | International Business Machines Corporation (IBM) | Logo actif `/assets/companies/logos/ibm.svg` |
| `visa-inc` | Visa Inc. | Monogramme interne (pas de logo réel actif) |
| `at-t-inc` | AT&T Inc. | Monogramme interne (pas de logo réel actif) |
| `the-coca-cola-co` | The Coca-Cola Company | Monogramme interne (pas de logo réel actif) |
| `toyota-motor` | Toyota Motor Corporation | Logo actif `/assets/companies/logos/toyota.svg` |
| `the-walt-disney-co` | The Walt Disney Company | Monogramme interne (pas de logo réel actif) |
| `tencent-holdings-ltd` | Tencent Holdings Limited | Monogramme interne (pas de logo réel actif) |
| `royal-dutch-shell` | Shell plc | Logo actif `/assets/companies/logos/shell.svg` |
| `agricultural-bank-of-china` | Sun Hung Kai Properties Limited | Logo actif `/assets/companies/logos/sun-hung-kai.svg` |
| `oracle-corp` | Oracle Corporation | Logo actif `/assets/companies/logos/oracle.svg` |
| `alibaba-group-holding` | Alibaba Group Holding Limited | Monogramme interne (pas de logo réel actif) |
| `bank-of-china-ltd` | Bank of China Limited | Monogramme interne (pas de logo réel actif) |
| `chevron-corp` | Chevron Corporation | Monogramme interne (pas de logo réel actif) |
| `anheuser-busch` | Anheuser-Busch InBev SA/NV | Monogramme interne (pas de logo réel actif) |
| `china-construction-bank-corp` | Komatsu Ltd. | Logo actif `/assets/companies/logos/komatsu.svg` |
| `samsung-electronics-co-ltd` | Samsung Electronics Co., Ltd. | Monogramme interne (pas de logo réel actif) |
| `pfizer-inc` | Pfizer Inc. | Logo actif `/assets/companies/logos/pfizer.svg` |
| `procter-gamble-co` | The Procter & Gamble Company | Monogramme interne (pas de logo réel actif) |
| `nestle` | Nestlé S.A. | Monogramme interne (pas de logo réel actif) |
| `novartis` | Novartis AG | Monogramme interne (pas de logo réel actif) |
| `jpmorgan-chase-co` | JPMorgan Chase & Co. | Monogramme interne (pas de logo réel actif) |
| `roche` | Roche Holding AG | Monogramme interne (pas de logo réel actif) |
| `general-electric` | GE Aerospace | Monogramme interne (pas de logo réel actif) |
| `wal-mart-stores-inc` | Walmart Inc. | Monogramme interne (pas de logo réel actif) |
| `china-mobile-ltd` | China Mobile Limited | Monogramme interne (pas de logo réel actif) |
| `icbc-ltd` | Industrial and Commercial Bank of China Limited | Monogramme interne (pas de logo réel actif) |
| `wells-fargo-co` | Wells Fargo & Company | Monogramme interne (pas de logo réel actif) |
| `johnson-johnson` | Johnson & Johnson | Monogramme interne (pas de logo réel actif) |
| `petrochina-co-ltd` | PetroChina Company Limited | Monogramme interne (pas de logo réel actif) |
| `microsoft-corp` | Microsoft Corporation | Logo actif `/assets/companies/logos/microsoft.svg` |
| `exxon-mobil-corp` | Exxon Mobil Corporation | Monogramme interne (pas de logo réel actif) |
| `berkshire-hathaway-inc` | Berkshire Hathaway Inc. | Monogramme interne (pas de logo réel actif) |
| `alphabet-google-inc` | Alphabet Inc. | Logo actif `/assets/companies/logos/alphabet.svg` |
| `apple-inc` | Apple Inc. | Monogramme interne (pas de logo réel actif) |
| `pacifica-minerals` | Woolworths Group Limited | Monogramme interne (pas de logo réel actif) |
| `southern-cross-energy` | Origin Energy | Monogramme interne (pas de logo réel actif) |
| `coral-reef-health` | CSL Limited | Monogramme interne (pas de logo réel actif) |
| `pacific-link` | Telstra Group | Logo actif `/assets/companies/logos/pacific-link.svg` |
| `harbour-infrastructure` | Goodman Group | Monogramme interne (pas de logo réel actif) |
| `oceanic-air` | Qantas Airways | Monogramme interne (pas de logo réel actif) |
| `southpoint-finance` | Commonwealth Bank of Australia | Monogramme interne (pas de logo réel actif) |
| `reef-data-systems` | WiseTech Global Limited | Monogramme interne (pas de logo réel actif) |
| `austral-manufacturing` | Fortescue | Monogramme interne (pas de logo réel actif) |

Détail machine-readable des sources, URL directe, auteur, licence, permission, ancienne ressource, modifications et sécurité : [`company-logo-updates.json`](company-logo-updates.json).
