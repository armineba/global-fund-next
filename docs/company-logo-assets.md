# Logos de sociétés — lot Commons

Vérification et téléchargement effectués le 6 octobre 2026. Huit actifs sont documentés dans le lot principal; deux logos supplémentaires (MHI et Telstra) ont été ajoutés depuis le rapport monde. Les dix slots figurent dans `packages/game-engine/legacy/data/gameData.json`. Les fichiers ont été téléchargés depuis les fichiers originaux Wikimedia Commons, puis copiés dans `assets/companies/logos/` et dans le miroir `apps/web/public/assets/companies/logos/`.

| Société | Identifiant du jeu | Fichier local | Fichier Commons et preuve de provenance/licence |
|---|---|---|---|
| TotalEnergies | `total-sa` | `totalenergies.svg` | [TotalEnergies wordmark (2021-present).svg](https://commons.wikimedia.org/wiki/File:TotalEnergies_wordmark_(2021-present).svg) — vectorisé par Vulphere à partir du rapport financier officiel H1 2021 de TotalEnergies; `PD-textlogo` et `Trademarked`. Wordmark rouge seul; le nom affiché du catalogue est désormais TotalEnergies SE. |
| Siemens AG | `siemens-ag` | `siemens.svg` | [Siemens AG logo.svg](https://commons.wikimedia.org/wiki/File:Siemens_AG_logo.svg) — auteur indiqué: Siemens AG; logo officiel Siemens référencé sur la page; `PD-textlogo` et `Trademarked`. |
| SAP | `sap` | `sap.svg` | [SAP 2011 logo.svg](https://commons.wikimedia.org/wiki/File:SAP_2011_logo.svg) — auteur indiqué: SAP SE; source SAP Design System; `PD-textlogo` et `Trademarked`. |
| Microsoft Corporation | `microsoft-corp` | `microsoft.svg` | [Microsoft.svg](https://commons.wikimedia.org/wiki/File:Microsoft.svg) — fichier actuel présenté comme logo 2012; source Flipgrid/Microsoft, crédit Microsoft Corporation / Jason Wells; `PD-textlogo` et `Trademarked`. |
| IBM | `ibm-corp` | `ibm.svg` | [IBM logo.svg](https://commons.wikimedia.org/wiki/File:IBM_logo.svg) — wordmark de Paul Rand, source IBM Design Language citée; `PD-textlogo` et `Trademarked`. |
| Intel | `intel-corp` | `intel.svg` | [Intel logo 2023.svg](https://commons.wikimedia.org/wiki/File:Intel_logo_2023.svg) — source press kit Intel, auteur Intel; logo 2020; `PD-textlogo` et `Trademarked`. |
| Oracle Corporation | `oracle-corp` | `oracle.svg` | [Oracle wordmark.svg](https://commons.wikimedia.org/wiki/File:Oracle_wordmark.svg) — auteur Oracle Corporation, source Oracle Signature; `PD-textlogo` et `Trademarked`. |
| Shell plc | `royal-dutch-shell` | `shell.svg` | [Shell wordmark 2019.svg](https://commons.wikimedia.org/wiki/File:Shell_wordmark_2019.svg) — auteur Royal Dutch Shell; extrait du logo Shell Energy 2019; `PD-textlogo` et `Trademarked`. Wordmark seul. |

| Mitsubishi Heavy Industries (MHI) | `gazprom` | `gazprom.svg` | [Mitsubishi heavyindustries mhi logo.svg](https://commons.wikimedia.org/wiki/File:Mitsubishi_heavyindustries_mhi_logo.svg) — source MHI officielle citée sur Commons; original [SVG](https://upload.wikimedia.org/wikipedia/commons/f/f1/Mitsubishi_heavyindustries_mhi_logo.svg); `PD-textlogo` et `Trademarked`. ID historique conservé pour les anciennes parties. |
| Telstra Group | `pacific-link` | `pacific-link.svg` | [Telstra logo (horizontal variant).svg](https://commons.wikimedia.org/wiki/File:Telstra_logo_(horizontal_variant).svg) — source Telstra officielle citée sur Commons; original [SVG](https://upload.wikimedia.org/wikipedia/commons/4/4e/Telstra_logo_%28horizontal_variant%29.svg); `PD-textlogo` et `Trademarked`. ID historique conservé pour les anciennes parties. |

## Droits et limites

Les dix fichiers sont reliés aux noms actuels du catalogue par `logoPath` et `logoSource` dans `gameData.json`; leur provenance détaillée figure également dans `company-logo-assets.json`. Les deux logos ajoutés pour MHI et Telstra correspondent aux remplacements actifs des slots historiques `gazprom` et `pacific-link`.

Pour chacun de ces éléments, Commons indique que l'image est dans le domaine public parce qu'elle se limite à du texte ou à des formes simples. Commons appose séparément un avertissement **Trademarked**: le domaine public au titre du droit d'auteur ne donne pas de droit d'usage de marque. Les noms et logos sont présents comme éléments d'identification dans le jeu. Les règles applicables aux marques doivent être vérifiées avant toute exploitation commerciale ou promotionnelle.

Les copies sont autonomes et locales. Contrôle effectué sur chaque SVG: XML parseable, absence d'éléments `script` et `foreignObject`, absence de liens `href`/`src` vers des ressources externes ou `data:`. Les chemins sources, fichiers téléchargés et provenance détaillée figurent dans [`company-logo-assets.json`](company-logo-assets.json). Le catalogue référence les dix chemins locaux. La politique globale `ASSET_LICENSES.md` reste gérée séparément.
