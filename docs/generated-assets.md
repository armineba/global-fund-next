# Provenance des sprites générés

Les trois atlas sources ont été générés par l’outil imagegen intégré à OpenAI, à la demande de l’orchestrateur. Aucun modèle 3D ou image de référence tiers n’a été identifié comme source de ces illustrations. Les [conditions européennes OpenAI](https://openai.com/policies/eu-terms-of-use/) précisent que l’utilisateur possède les sorties dans la limite permise par la loi applicable. Les images ne sont donc pas marquées CC0 et aucune garantie d’unicité n’est revendiquée.

## Pions

- Atlas original conservé : `assets/pawns/premium-atlas-v1.png` (copie de `/home/codex/.codex/generated_images/01a0f1ed-7d6f-78f0-b3d9-428ea9d1938a/exec-a705c399-3765-444b-a1c8-0d8b2ad2a506.png`).
- Sprites dérivées : `assets/pawns/premium/{lion,bull,leaf,crystal,globe,tower}.png`, plus les copies identiques sous `apps/web/public/assets/pawns/premium/`.
- Pipeline : découpage RGBA mécanique de la grille 3×2, alpha conservé, rognage de la transparence extérieure, marge transparente de 16 px, ajustement proportionnel sur une toile transparente de 512×512. Les silhouettes ont été contrôlées via le canal alpha et par composition sur fond blanc.

## Villes

- Atlas original conservé : `assets/world/cities-atlas-v1.png` (copie de `/home/codex/.codex/generated_images/01a0f1ed-7d6f-78f0-b3d9-428ea9d1938a/exec-a8ace618-be3a-40f1-be88-8a41f1866467.png`).
- Sprites dérivées : `assets/world/cities/{americas,europe,asia,africa,oceania,exchange}.png`, plus les copies identiques sous `apps/web/public/assets/world/cities/`.
- Pipeline : séparation RGBA mécanique selon les limites de contenu détectées dans l’atlas, sans recadrage dans les pointes visibles des bâtiments. Fenêtres source `(x, y, largeur, hauteur)` : Americas `(0, 0, 520, 486)`, Europe `(520, 0, 508, 486)`, Asia `(1028, 0, 508, 486)`, Africa `(0, 486, 522, 538)`, Oceania `(522, 486, 508, 538)`, Exchange `(1030, 486, 506, 538)`. Alpha conservé, rognage de la transparence extérieure, marge transparente de 12 px, ajustement proportionnel sur une toile transparente de 512×512. Les six silhouettes et pointes ont été vérifiées visuellement sur fond blanc.

## Scènes de richesse

- Atlas original conservé : `assets/scenes/wealth-atlas-v1.png` (copie de `/home/codex/.codex/generated_images/01a0f1ed-7d6f-78f0-b3d9-428ea9d1938a/exec-9b53af5c-7c84-4e62-8674-c4ac7b13e490.png`). C’est un atlas RGB de 1774×887 généré avec l’outil imagegen intégré à OpenAI, sans image externe identifiée.
- Sorties WebP : `assets/scenes/wealth/{distressed,office,desk,tower,floor,gold,world,justice}.webp` et copies sous `apps/web/public/assets/scenes/wealth/`.
- Ordre de l’atlas : rangée 1 `distressed`, `office`; rangée 2 `desk`, `tower`; rangée 3 `floor`, `gold`; rangée 4 `world`, `justice`.
- Pipeline : séparation mécanique des huit cases sans ajout de texte ni retouche; traits séparateurs exclus. Atlas source 2 colonnes de 887 px, séparation centrale x=886–887; séparateurs horizontaux y=221, 443, 664. Dimensions source des cases : 886×221, 886×221, 886×220, 886×222 px (largeur×hauteur); conversion WebP qualité 85, effort 6. Source non alpha, sorties WebP RGB.
- Limite d’affichage : les scènes sont très larges. Un arrière-plan CSS réglé sur `cover` avec position centrée peut rogner les bords selon le ratio du conteneur; aucun texte généré dans les scènes ne nécessite de rester lisible.

## Variantes WebP des sprites

- Copies optimisées en WebP qualité 90 placées à côté des PNG : sprites de pion avec effort 6 sous `assets/pawns/premium/{lion,bull,leaf,crystal,globe,tower}.webp`, sprites de ville avec effort 4 sous `assets/world/cities/{americas,europe,asia,africa,oceania,exchange}.webp`; mêmes fichiers sous `apps/web/public/assets/`.
- Les PNG de référence restent présents. Les variantes pawns et villes conservent l’alpha (512×512, quatre canaux); les scènes sont en WebP opaque. Aucune extension ni référence UI n’a été modifiée.

Les fichiers sources atlas permettent de réexaminer les fenêtres de découpe. Les coordonnées et les noms descriptifs sont des choix de montage; ils ne proviennent pas de données géographiques exactes. Les [prompts originaux et le mode de génération](generated-prompts.md) sont conservés séparément.
