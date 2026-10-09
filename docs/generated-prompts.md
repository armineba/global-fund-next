# Prompts des assets originaux

Mode : outil **imagegen intégré**, sans CLI ni appel API personnalisé. Trois atlas retenus ont été copiés dans le projet, puis découpés et optimisés mécaniquement en sprites WebP. Les PNG sources sont conservés. Les pions et villes ont un canal alpha; les décors sont opaques. La recherche préalable de ressources libres est documentée dans [asset-hunt-visual.md](asset-hunt-visual.md).

Les prompts ci-dessous sont les textes exacts envoyés à l’outil. Le second essai de pions n’a pas été intégré; le premier atlas possédait déjà la transparence requise. Les résultats sont des créations originales, sans revendication de licence CC0. Voir [generated-assets.md](generated-assets.md) pour les sources, découpes et emplacements dérivés.

## Pions — atlas retenu

Source conservée : `assets/pawns/premium-atlas-v1.png`.

```text
Use case: stylized-concept. Asset type: production game sprite atlas with six premium collectible board game figurines, transparent background. Create a single wide 3-column by 2-row sprite sheet, with six complete objects separated by large empty transparent gutters, each centered within an equal rectangular cell and at identical scale; each object's entire body and circular metal plinth must be fully visible. Row one left to right: a regal seated GOLD LION with finely detailed mane, a powerful COBALT BLUE BULL with horns, an upright EMERALD GREEN LEAF sculpture with gold veins. Row two left to right: a tall faceted AMETHYST PURPLE CRYSTAL cluster, a polished SILVER GLOBE with raised geographic continents and dark blue oceans on an elegant stem, an ART DECO RUBY RED AND GOLD SKYSCRAPER TOWER. Premium financial strategy videogame art, photorealistic offline 3D product render, sharp readable silhouettes at 100px tall. Each figurine stands on its own substantial round black metal and gold trimmed plinth. Match a luxury board game in a midnight navy trading room with subtle warm golden rim light from upper left and cool fill right, metallic reflections, beautiful volume, perspective looking slightly downward from 25 degrees, front three-quarter view, not a top down view. Uniform camera and studio lighting across all six. Background truly transparent alpha, no scene, no labels, no letters, no chess pawns, no interface, no extra objects, no characters. Preserve generous margins around each object so they can be used as six independent sprites. Atlas aspect ratio approximately 3:2.
```

## Pions — essai de détourage non retenu

Essai écarté, aucun fichier consommé par le jeu.

```text
Edit target: the supplied 3-column by 2-row atlas of six premium game figurines. Use case: background-extraction. Remove the ENTIRE brown/navy studio gradient background and glow between objects, replacing it with genuinely empty TRANSPARENT alpha pixels. Preserve exactly the six figurines, their details/colors/materials and bases, their positions, scale, and the 1536x1024 3-column 2-row layout. Keep gold lion, blue bull, emerald leaf, violet crystal, silver globe, red gold tower unchanged. Do not rearrange. No checkerboard painted pixels, no opaque background. Each object cleanly isolated so all six can be sliced into independent transparent sprites. Preserve delicate horn tips and the tiny globe pointer. Do not add shadow outside bases, labels, logos, borders or new objects. Transparency is required all around and between the six figurines.
```

## Villes — atlas retenu

Source conservée : `assets/world/cities-atlas-v1.png`.

```text
Use case: stylized-concept. Asset type: one production videogame sprite atlas of miniature financial city skylines for a premium international trading board game. Single 3-column by 2-row sheet of SIX isolated miniature city sculptures, equal rectangular cells, every object fully visible, generous empty transparent margins, no overlap between cells. All six same perspective, camera 30 degrees looking down three-quarter front, expensive physically rendered 3D architectural dioramas, night time gold-lit windows, dark blue glass, warm brass architectural edges, on thin elliptical midnight navy and gold plinths. Row1 left: New York financial district, Empire State and sleek skyscrapers, small Statue of Liberty silhouette. Row1 middle: Europe, Eiffel Tower dominating elegant European banking towers with classical facade foreground. Row1 right: Asian financial city, Shanghai Oriental Pearl tower and Tokyo-style skyscrapers. Row2 left: Africa and Middle East, slender Burj Khalifa and contemporary African banking buildings, sparse palm trees. Row2 middle: Oceania, Sydney opera house sails and Australian skyscrapers. Row2 right: grand international stock exchange building with classical columns, symmetrical facade, gold roof detail. Tall clean recognizable silhouettes, premium collector miniature quality, intricate realistic architectural details but readable at 140px. Consistent subdued institutionally luxurious blue-and-gold design. NOT low-poly, not cartoon, not neon cyberpunk. Background genuinely fully transparent alpha between objects and all around. No ground landscape outside each plinth, no sky, no clouds, no labels, letters, numbers, watermarks, interface, people, or text anywhere. Atlas aspect3:2, do not crop any building tip.
```

## Décors de progression et justice — atlas retenu

Source conservée : `assets/scenes/wealth-atlas-v1.png`.

```text
Use case: stylized-concept. Asset type: production background atlas for a premium financial strategy videogame, eight photographic financial interiors. Create ONE 2-column by 4-row atlas, eight equal LANDSCAPE rectangular panels, no border frames, no writing. Each individual panel is a complete wide 2:1 cinematic nighttime room view, eye height, with a polished dark strategy table in foreground and space for a game board overlay. Visually show growth of a hedge fund's workplace in this exact order: row1left a very small distressed office with worn furniture, cracked plaster, old desk, rain at window, dim tungsten bulb; row1right a modest but tasteful small normal investment office with two monitors and blue night city through a window; row2left a successful compact trading desk office with several blue-screen monitors, elegant wood and glass; row2right a spacious executive office high in a glass skyscraper with huge city skyline windows and walnut furniture; row3left a large sophisticated international trading floor with rows of empty trading desks and many monitors, cinematic depth; row3right an extraordinary refined golden executive office, dark marble, discreet ornate brass, warm lighting, expansive glass windows; row4left the office of an immensely powerful global financier, monumental panoramic windows overlooking world financial metropolis, glowing world map wall, a single tiny silhouette of a businessman viewed from the back at the far window, no recognizable face; row4right a premium financial justice hearing office, dark walnut paneling, subtle bars/window geometric shadows, gavel on a desk, no people. All panels contemporary realistic luxurious institutional finance, navy midnight, gold warm accents, no cyberpunk, no cartoon, no neon, no futuristic fantasy. Sharp architectural material detail, convincing room scale and depth, no titles or logos or captions or financial numbers anywhere. No game UI, no board, no floating particles. Separate images logically by exact panel grid without montage overlapping panels. Each is intended as a full-screen wide room backdrop behind an actual playable board.
```

