# Asset licenses and provenance

All downloaded third-party files below are stored under `assets/`. Source pages and license texts were checked before download. Textures, the source pawn model, and Natural Earth GeoJSON are unmodified. Six PNG pawn sprites were rendered from the CC0 model with a metallic material, player-specific color, studio lighting, a soft transparent ground shadow, and a transparent background. Identical PNG copies are placed in `apps/web/public/assets/pawns/` for browser loading.

| Asset path | Source / author | License | Modifications |
| --- | --- | --- | --- |
| `assets/world/ne_110m_land.geojson` | [Natural Earth vector repository](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson); Natural Earth contributors, led by Tom Patterson and Nathaniel Vaughn Kelso | Public domain; [official terms](https://www.naturalearthdata.com/about/terms-of-use/) | None. Downloaded GeoJSON land polygons at 1:110m scale. |
| `assets/board/board-walnut.jpg` | [Black Walnut Veneer 02 — Poly Haven](https://polyhaven.com/a/black_walnut_veneer_02); Jenelle van Heerden | CC0; [Poly Haven license](https://polyhaven.com/license) | None. 1K diffuse JPG. |
| `assets/board/board-metal.jpg` | [Metal Plate 02 — Poly Haven](https://polyhaven.com/a/metal_plate_02); Rob Tuytel | CC0; [Poly Haven license](https://polyhaven.com/license) | None. 1K diffuse JPG. |
| `assets/pawns/chess-pawn.glb` | [3D chess pieces — OpenGameArt](https://opengameart.org/content/3d-chess-pieces), tunakron | CC0 (declared on source page); [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | None. Pawn GLB extracted from the source ZIP. |
| `assets/pawns/{lion,bull,globe,crystal,tower,leaf}.png` and matching `apps/web/public/assets/pawns/` copies | Derived from the OpenGameArt pawn by tunakron | CC0, same source license | Rendered at 768×768 with Three.js WebGL using metallic material and studio lighting, soft transparent ground shadow, transparent canvas, and six player colors (gold, blue, silver, purple, red, green). The shape is the same pawn model in every sprite; file names are player identifiers. |
| `assets/audio/chips-collide.ogg` | [Boardgame Pack — Kenney](https://kenney.nl/assets/boardgame-pack), Kenney Vleugels | CC0; [Kenney asset license](https://kenney.nl/support) and included `license.txt` | None. `Bonus/chipsCollide1.ogg` extracted from the pack. |

Natural Earth asks users who wish to cite the map data to say “Made with Natural Earth”; no attribution is required by its public-domain terms. CC0 assets do not require attribution, though credit is appreciated by Poly Haven and Kenney.

## Illustrations de Global Fund réutilisées

Les illustrations `apps/web/public/assets/scenes/*.webp` sont les créations d'ambiance et de secteurs du projet de référence, fournies avec Global Fund. Elles ont été copiées localement sans modification ; leur origine est `/home/codex/projects/trading-game/public/scene/`. Elles ne sont pas déclarées CC0. Les logos de marques externes de la référence n'ont pas été transférés faute d'un audit de leurs licences.

## Photographie d'aéroport

- Nom : Interior of Zvartnots International Airport (June 2023), panoramic.
- Source : [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Interior_of_Zvartnots_International_Airport_(June_2023)_panoramic.jpg).
- Auteur : Benoît Prieur.
- Licence : CC0 1.0 ; provenance également conservée dans le registre `data/assetSources.json` de la référence.
- Modifications : version 1280 px existante copiée et renommée ; teinte et superposition sombre appliquées uniquement en CSS.
- Emplacements : `assets/cards/airport.jpg`, `apps/web/public/assets/cards/airport.jpg`.

## Icônes d'interface

- Nom : Lucide React.
- Source et auteur : [Lucide](https://lucide.dev/license), contributeurs Lucide.
- Licence : ISC pour les icônes et les bibliothèques actuelles (certaines icônes héritées Feather sont MIT), notices incluses dans `node_modules/lucide-react/LICENSE`.
- Modifications : couleur, taille et épaisseur définies par les composants et CSS ; pas de modification des sources.
- Emplacement : dépendance npm verrouillée `lucide-react`, intégrée localement au bundle web.
