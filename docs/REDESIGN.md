# Global Fund — Refonte « La table privée » (front uniquement)

Branche : `refonte-front`. Cette refonte change **uniquement la présentation**. Elle remplace le plateau 2D PixiJS par une scène 3D temps réel (Three.js via React Three Fiber) et refait toute l'interface HTML.

---

## 0. Règles absolues

1. **Ne jamais toucher `main`.** On travaille uniquement sur `refonte-front`.
2. **Backend en lecture seule** : `apps/server/**`, `packages/game-engine/**`, `packages/shared/**` ne sont **jamais** modifiés. Le protocole, les commandes, les règles et les données restent identiques.
3. **Aucune feature perdue.** Chaque commande, chaque décision, chaque donnée visible aujourd'hui reste accessible. On peut la déplacer, la condenser ou la mettre derrière un survol ou un dépli, mais jamais la supprimer. Inventaire en §7.
4. **Logique client figée** : `store.ts`, `presentation/sequence.ts`, `presentation/useGamePresentation.ts`, `setupDraft.ts`, `trading/tradingSort.ts` gardent leur sémantique. Seules les durées de `PRESENTATION_TIMING` ont été retouchées, et uniquement par le lead.
5. **Contrat de test** : les tests E2E (`tests/e2e/*.spec.ts`) et le script de captures s'appuient sur des classes, des libellés, des rôles et des attributs. Ils sont listés par écran en §7 et doivent rester valides. Si un texte change, on garde au moins la chaîne exigée.
6. **Interface en français.** Montants au format `1 234,50 M€` (`ui/format.ts`), avec un vrai signe moins `−`.

---

## 1. Vision

> Une salle de conseil de banque privée, la nuit. Sur la table, un jeu de plateau de luxe : plateau en laque noire cerclé de laiton, globe armillaire d'obsidienne gravé d'or au centre, figurines taillées dans les pierres précieuses, dé d'onyx à points d'or. Autour, une interface de verre fine comme un trait : peu de mots, une typographie parfaite, seulement les chiffres qui comptent.

**Piliers**
1. **Le plateau est le héros.** La 3D occupe tout l'écran. Le HUD reste en périphérie et en verre.
2. **Un coup d'œil.** Chaque écran dit en moins de 2 s ce qui se passe et ce que je peux faire. Une seule action principale, visuellement dominante.
3. **Le luxe par la retenue.** Des noirs profonds, du laiton chaud, beaucoup d'air, peu de bordures et peu de majuscules. Pas d'images générées par IA. La matière vient de la 3D, de la lumière et de la typographie.
4. **Une animation porte un fait.** Le dé, le déplacement, les cours et les flux montrent un fait déjà décidé par le serveur. Pas de bruit décoratif permanent.
5. **Parité accessibilité.** Avec `prefers-reduced-motion` ou le réglage « Réduire les animations », il n'y a ni mouvement de caméra ni effet intense. On garde le même contenu, les mêmes états et le même ordre.

**Références d'ambiance** : montres de haute horlogerie (laiton satiné, émail), terminaux financiers haut de gamme, jeux de plateau numériques premium (le plateau physique au centre, l'interface discrète autour).

---

## 2. Design system

Tous les tokens sont dans `apps/web/src/styles.css` (`:root`). Les constantes partagées avec la 3D sont dans `apps/web/src/ui/theme.ts`.

| Usage | Tokens |
| --- | --- |
| Fonds | `--ink-950 … --ink-600` (encre de nuit) |
| Laiton | `--gold-200 … --gold-700` (accent principal ; jamais en grands aplats hors bouton primaire) |
| Texte | `--text-100` (blanc chaud), `--text-300`, `--text-500` (données secondaires plus froides) |
| Signaux | `--up` émeraude, `--down` rubis, `--info` bleu, `--warn` ambre. Toujours avec un signe ou une flèche |
| Notes | `--grade-a … --grade-e` via `<GradeJewel/>` |
| Secteurs | `SECTOR_META[id].color` (saphir, or, acier, jade, cuivre, améthyste, péridot, rose, aigue-marine) |
| Surfaces | `.gf-glass` (verre dépoli, filet doré, reflet sur le chant), `.gf-glass--quiet` |
| Rayons | `--radius-xs/sm/md/lg/pill` |
| Mouvement | `--ease-out`, `--ease-spring`, `--dur-1…4` |
| Couches | `--z-scene 0`, `--z-hud 20`, `--z-stage 40`, `--z-modal 60`, `--z-toast 80`, `--z-top 100` |

**Typographie**
- Titres : `var(--font-display)` Cormorant Garamond 500/600, en minuscules avec capitale initiale (`.gf-display`). Tailles 56 / 40 / 30 / 24.
- Marque et gravure : Cinzel (`.gf-brand`). Seulement pour le logotype « GLOBAL FUND », les gravures du plateau 3D et de rares sur-titres.
- Interface : Inter 400/500/600, en 15 / 13 / 12 px.
- Sur-titres : `.gf-kicker`, 10,5 px en capitales espacées. Un seul par bloc au maximum.
- Chiffres : classe `.gf-num` (chiffres tabulaires). Plex Mono (`.gf-mono`) seulement pour les codes (salon, tickers).

**Composants partagés** (styles.css, `ui/`)
- Boutons : `.gf-btn` + `--primary` (laiton, reflet au survol), `--ghost`, `--quiet`, `--up`, `--down`, tailles `--sm/--lg`, `--block`. Les alias historiques `.gold-button` et `.outline-button` sont gardés car les tests et l'ancien code les ciblent.
- `.gf-icon-btn` (rond, verre), `.gf-chip`, `.gf-kbd`, `.gf-dot`, `.gf-divider`.
- `<GradeJewel grade label size pips/>` et `<GradeShift before after/>` dans `ui/GradeJewel.tsx`.
- `<SectorIcon id/>` et `sectorIcon(id)` dans `ui/SectorIcon.tsx`. `SECTOR_META`, `ZONE_META`, `PAWN_META` et `GRADE_META` dans `ui/theme.ts`.
- `<Pawn id color size/>` (`game/Pawn.tsx`) : portrait PNG rendu depuis la figurine 3D, rangé dans `/assets/pawns/render/{id}.png`. À défaut, il bascule sur l'ancien sprite, puis sur une icône. **`.pawn-object` est un hook de test.**
- `<AnimatedMoney value/>` (`presentation/AnimatedMoney.tsx`) pour tout montant qui évolue.
- Formatage : `money`, `signedMoney`, `signedPercent`, `tone`, `pad2` (`ui/format.ts`).
- Mouvement global : `html[data-motion="reduced"]` (réglage in-app) et `@media (prefers-reduced-motion)` neutralisent les animations CSS. `html[data-quality]` vaut `high`, `medium` ou `low`.
- Animations de panneaux : la bibliothèque `motion` (`import { motion, AnimatePresence } from "motion/react"`) est disponible. Ses animations doivent se dégrader en fondu simple en mouvement réduit (`useReducedMotion` ou le réglage in-app).

---

## 3. Règles d'écriture (condensation)

L'utilisateur trouve l'existant trop bavard et redondant. Règles :
1. **Une idée par ligne.** Titre de 4 mots maximum, texte d'appui d'une phrase (environ 90 caractères).
2. **Ne pas répéter ce qui est déjà visible** : pas de « Prenez le temps de lire » en trois endroits, ni de « Vous avez la main » à côté d'un gros bouton d'action. Un même nombre ne s'affiche qu'une fois par vue.
3. **Masquer les zéros** : une liste d'impacts ne montre que les fonds réellement touchés, avec la mention « Aucun autre fonds concerné » si nécessaire.
4. **Les explications passent dans un `title`, une infobulle ou un dépli** (`<details>`), pas dans le flux.
5. **Capitales réservées aux sur-titres de 1 à 3 mots.** Jamais de phrase entière en capitales.
6. **États vides élégants et courts.** « Rien à régler. » plutôt que trois phrases.
7. Les chaînes exigées par les tests (§7) restent mot pour mot.

Exemple de la carte « Règlement — Industrie » (capture de l'utilisateur) :
- **Avant** : un sur-titre, un titre, une phrase de 2 lignes, « OPÉRATIONS DU TOUR », « Aucun paiement ce tour », une phrase d'explication, puis « EN BOURSE — Les entreprises concernées — Aucune entreprise cotée n'est directement concernée. »
- **Après** : une carte compacte. Sur-titre « Apex Capital · case Industrie », titre « Règlement — Industrie », puis une ligne « Aucun détenteur à rémunérer — rien à régler. » et le bouton Continuer. La section entreprises disparaît quand elle est vide.

---

## 4. Mouvement

- Entrées de panneaux en 240–420 ms (`--ease-out`) : fondu, translation de 8 à 14 px, échelle de 0,985 à 1. Sorties deux fois plus rapides.
- Cartes : entrée « tirée du paquet » (rotation 3D CSS de −8° à 0°, translation et fondu), puis un reflet doré qui balaie la carte une seule fois.
- Chiffres : interpolation `AnimatedMoney` et flash vert/rouge.
- Un seul effet continu toléré dans le HUD : la pulsation lente de l'action principale quand c'est au joueur d'agir.
- 3D : toutes les durées viennent de `PRESENTATION_TIMING` et de la `timeline` (§8). En mouvement réduit, pas d'interpolation ni de secousse, et un rendu à la demande.

---

## 5. Agencement en jeu (desktop ≥ 1280 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◎  Cycle 07/101 · Composer son portefeuille        Salon A11C·Londres  ● 🔊 ⚙ │  bande haute (App topbar + .world-status)
│ ┌──────────┐                                                   ┌──────────┐ │
│ │ INDICES  │                                                   │  FONDS   │ │
│ │ zones ×5 │              PLATEAU 3D (plein écran,             │ cartes   │ │
│ │ secteurs │              derrière tout le HUD)                │ joueurs  │ │
│ │   ×9     │                                                   │  ×2–6    │ │
│ │.world-   │                                                   │.fund-dock│ │
│ │ ratings  │                                                   │          │ │
│ └──────────┘                                                   └──────────┘ │
│ [⤢ vue]        ┌────────── .command-console ──────────┐   [P][M][A][S][Salon] │
│                │ pion·nom·étapes  [ ACTION PRINCIPALE ] cash│   .world-tools     │
│                └──────────────────────────────────────┘                       │
│ GLOBAL EXCHANGE ── ticker ─────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Le canvas 3D est **plein écran** (`.fund-board { position: fixed; inset: 0; z-index: 1 }`) sous le HUD (z ≥ 20). Le bureau (`.market-office`, skyline photographique de la ville du joueur) est un calque DOM fixe **derrière** le canvas (`z-index: 0`), assombri et flouté. Le canvas est transparent hors de la table. Aucun ancêtre du plateau ne doit porter de `transform` ou de `filter` : cela casserait le `position: fixed`.
- **Règle des pointeurs** : les conteneurs du HUD sont en `pointer-events: none` ; seuls les contrôles interactifs et les panneaux défilables repassent en `auto`. Le test survole `.fund-board-canvas` en (100, 100) : aucun élément interactif ne doit s'y trouver, et un texte du HUD posé à cet endroit doit être en `pointer-events: none`.
- **Scène centrale** (terminal, cartes, décision de voyage, desk de règlement) : variables CSS sur `.game-world` : `--center-top`, `--center-right`, `--center-bottom` et `--center-left`. Ce sont des **longueurs px simples** (par ex. `92px`), jamais `calc()`, car le script de captures les lit avec `parseFloat`. Chaque surface se positionne avec `position: fixed; top: var(--center-top); right: var(--center-right); bottom: var(--center-bottom); left: var(--center-left)`. Le hud positionne `.floating-terminal`, `.cs-backdrop.is-embedded` et `.geography-scene` ; le desk de règlement positionne lui-même `.settlement-desk`. Le contenu central doit rester dans ce rectangle **sans chevaucher `.command-console` ni `.fund-dock`**.
- **Mode focus** : quand une surface centrale est ouverte, le rail gauche peut être recouvert et le rail droit (`.fund-dock`) se réduit à une colonne d'avatars d'environ 76 px. Son texte reste dans le DOM, car les tests lisent `textContent`. Les variables `--center-*` sont mises à jour en conséquence, par exemple `.game-world[data-stage-open] { --center-left: 16px; … }`.
- Insets transmis au plateau : `BoardScene` reçoit `insets` (px masqués par le HUD) et cadre le plateau dans la zone libre.
- Responsive :
  - ≤ 1440 : rails plus étroits.
  - ≤ 1180 : rail gauche en colonne compacte (lettres seules).
  - ≤ 900 (tablette) : bande haute, plateau, puis les rails en bandes horizontales défilables et la console en bas. Le test tablette (768×1024) exige que le dialogue de carte et son bouton de fermeture soient visibles dans le viewport.
  - ≤ 600 : mobile utilisable.

---

## 6. Direction 3D

### 6.1 Rendu
- R3F `<Canvas>` avec `gl={{ alpha: true, antialias, powerPreference: "high-performance" }}`, rendu sRGB, `ACESFilmicToneMapping` (exposition ≈ 1), ombres douces (`PCFSoftShadowMap`).
- Qualité :
  - `high` : DPR [1, 1.75], post-traitement complet (Bloom mipmap sélectif, Vignette, léger grain, SMAA ou MSAA 4), ombres 2048.
  - `medium` : DPR [1, 1.25], Bloom et Vignette, ombres 1024.
  - `low` : DPR 0.85, sans composer ni transmission, ombres basiques ou aucune.
  - **Rendu logiciel** (`WEBGL_debug_renderer_info` contient « SwiftShader », « llvmpipe » ou « Software ») : forcer `low` avec un DPR ≤ 0.75. Les tests E2E tournent sous SwiftShader.
- `frameloop="always"` en mouvement normal (60 fps maximum, en pause quand l'onglet est caché ou le canvas hors écran) et `frameloop="demand"` en mouvement réduit, avec `invalidate()` à chaque changement de props, de textures ou de taille.
- `data-scene-ready="true"` sur `.fund-board-canvas` après la première image rendue une fois les assets critiques chargés (ou après 4 s de délai, même si un asset échoue). `data-fps` est mesuré chaque seconde en mouvement normal et vaut `"0"` en mouvement réduit.

### 6.2 Composition (unités monde ; arête de case ≈ 1)
- **Table** : grand disque de cuir ou de bois sombre qui se fond en alpha vers les bords (dégradé radial), pour que le bureau DOM apparaisse derrière.
- **Plateau** : dalle de 16 × 16 × 0,45 en laque noire (`MeshPhysicalMaterial`, clearcoat 1), cadre de laiton biseauté (metalness 1, roughness 0,3), filet d'or incrusté.
- **52 cases, disposition « Monopoly »** : 4 coins carrés (index 0 Départ, 13 Bull Market, 26 Événement, 39 Événement) et 12 cases par côté. Ordre horaire depuis Départ (coin avant-gauche du point de vue de la caméra par défaut). Chaque case est une plaque d'émail sombre légèrement surélevée, avec un **liseré de couleur secteur** côté intérieur, une icône et un libellé gravés à la feuille d'or (texture canvas Cinzel, atlas unique), et le numéro de semaine 01–52 en petit. Cases spéciales :
  - Départ : laiton plein avec une flèche.
  - Événement : sceau, émail bleu nuit.
  - Bull : émeraude avec ▲.
  - Bear : rubis assombri avec ▼.
  - Crash : rubis profond avec un éclair.
- **Centre** :
  - le globe armillaire (`globe.tsx`) sur un piédestal de laiton et de marbre noir ;
  - une rose des vents gravée ;
  - deux **paquets de cartes 3D**, CONTEXTE (100) et ÉVÉNEMENTS (50), dont la hauteur suit `contextsRemaining` et `boardEventsRemaining` ;
  - la zone de lancer du dé.
- **Figurines** (`pawns.tsx`, `PawnModel`) : lion en or, taureau saphir, globe platine, cristal améthyste, tour (gratte-ciel Art déco) rubis, feuille émeraude. Socle tourné, anneau à la couleur du siège. La figurine active porte un halo pulsé et un léger spot. Une figurine détenue est désaturée et assombrie, avec un anneau rubis.
- **Dé** : cube d'onyx à arêtes arrondies et points d'or incrustés.
- **Lumière** : clé chaude zénithale qui projette les ombres, contre-jour froid bleu, remplissage faible. `<Environment>` drei avec des `<Lightformer>` procéduraux (aucun fichier HDR) pour les reflets du métal. Pas de brouillard opaque : la transparence doit rester.

### 6.3 Mouvements synchronisés (source unique : `timeline` + `stage`)
- `timeline` (`BoardTimeline`) fournit `diceStartedAt`, `motionStartedAt` (horloge `performance.now()`), `roll`, `fromPosition`, `toPosition`, `motionStepMs` et `playerId`.
- **Dé** : de `diceStartedAt` à `+PRESENTATION_TIMING.dice`, lancer depuis le côté du joueur actif, deux rebonds amortis, culbutes, puis une interpolation (slerp) vers l'orientation qui montre **exactement `timeline.roll`** sur la face supérieure. Pendant `DICE_RESULT`, éclat doré bref et pastille du résultat. Hors lancer, le dé repose sur la dernière valeur.
- **Pion** : à partir de `motionStartedAt`, une case par `motionStepMs`, en arc (hauteur ≈ 0,55) avec écrasement à l'atterrissage, de `fromPosition` vers `toPosition` (modulo 52). La caméra suit. À l'arrivée (`PAWN_ARRIVAL`), une onde au sol à la couleur du secteur et la case s'illumine. Un procès en prison donne `fromPosition === toPosition` : aucun déplacement.
- `game.players[].sectorPosition` suit déjà l'avant ou l'après mouvement selon l'étape (vue détachée). Le plateau ne calcule aucune règle.
- **Voyage** : la dernière notice avec `fromZoneId → zoneId` devient un `flight` du globe (arc de grand cercle lumineux, comète à la couleur du siège, `PRESENTATION_TIMING.travel`). Le marqueur du fonds se déplace avec elle.
- **Aperçu de voyage** : `travelPreview` donne un arc pointillé et le globe pivote vers la destination.
- **MARKET_IMPACT** : `marketImpact` (`GradeChange`). Pour un secteur, ses cases pulsent en vert ou en rouge. Pour une zone, l'épingle du globe pulse.
- **Présentations** :
  - `crash` : vignette rubis, secousse courte de caméra (pas en mouvement réduit), cases assombries.
  - `bull` : balayage de lumière or-vert et particules ascendantes.
  - `bear` : lumière froide.
  - `context` : reflet doré sur le paquet Contexte.
  - `event` : spot sur le paquet Événements.
- **Caméra** (amortie, environ 500 ms) :
  - `global` : tout le plateau, cadré dans les `insets` ;
  - `player` : suivi du pion pendant `BOARD_FOCUS → SPACE_REVEAL` ;
  - `zone` : vers le globe pour `focusZone` ;
  - `crash` : recul ;
  - `overview` force `global`.
  - Dérive inactive très lente et parallaxe souris de ±1,5° (écoute `window`, le canvas reste `pointer-events: none`), désactivées en mouvement réduit.

### 6.4 Écrans de menu
`MenuHero` (`board/three/MenuHero.tsx`) est un fond 3D plein écran derrière l'accueil, la configuration et le salon : globe armillaire en vedette, figurines sur un socle miroir, poussière d'or. Trois cadrages : `menu`, `setup` (les figurines des sièges configurés, la figurine choisie en avant) et `lobby` (figurines assises autour de la table).

---

## 7. Inventaire des features et contrat de test par écran

### 7.1 Coquille App, menus, configuration, salon — `App.tsx`, `game/MainMenu.tsx`, `game/StartingMarketPicker.tsx`, `game/Chat.tsx`
- Le texte **« Serveur connecté »** est visible sur tous les écrans, jeu compris. Sinon : « Reconnexion… ».
- Bascule son (`aria-label` « Activer le son » / « Couper le son »), bouton « Paramètres ».
- Menu : boutons dont le nom contient **NOUVELLE PARTIE**, **REJOINDRE**, **REPRENDRE** (si session), **RÈGLES** et **PARAMÈTRES**.
- Configuration, étape 1 (`data-testid="setup-step-funds"`) :
  - select `aria-label="Nombre de joueurs"` (valeurs 2–6) ;
  - par siège N : input `Nom du fonds N`, select `Type du joueur N` (local / remote / ai ; siège 1 désactivé), select `Difficulté de l’IA N` pour une IA (easy / normal / hard) ;
  - `role="radiogroup"` `aria-label="Pion du joueur N"`, avec des radios nommées par le nom du pion (Lion, Taureau, Globe, Cristal, Tour, Feuille) et `aria-checked` ;
  - bouton **« Choisir les places financières »** (texte exact).
- Configuration, étape 2 (`data-testid="setup-step-markets"`) :
  - `.market-player-tabs button` × humains, avec `data-testid="market-player-tab-{index}"` et `aria-pressed` ;
  - `StartingMarketPicker` : 5 `.starting-market-option` (`data-testid="market-option-{zone}"`, `aria-pressed`) dont le texte contient la région (Amériques, Europe, Asie, Afrique & Moyen-Orient, Océanie), la ville (New York, Londres, Hong Kong, Dubaï, Sydney) et **« Note C »** ;
  - liste des implantations IA automatiques ;
  - bouton dont le nom contient **« Configuration des fonds »** (retour) ;
  - bouton **« Créer ma partie »**.
- Bouton exact **« ← Retour au menu »**. Bascule « J’ai déjà un code d’invitation → » / « Créer une nouvelle partie → ».
- `.home-scene` ne contient jamais « nationalité », « nationality » ni « pays du joueur ».
- Rejoindre : `Code du salon`, `Nom pour rejoindre`, un `StartingMarketPicker`, select `Pion pour rejoindre`, bouton **« Rejoindre »**.
- Brouillon : le setup est sauvegardé via `saveSetupDraft` à chaque changement (logique existante à garder telle quelle).
- Salon :
  - titre **« Le capital vous attend. »** ;
  - **« CODE D’INVITATION »** ;
  - `.room-code b` contient le code ; bouton Inviter qui copie le lien ;
  - `.lobby-player` par fonds avec le nom, la place de marché de départ, la ville, le type (IA / DISTANT / LOCAL), le niveau d'IA et le statut : **« Prêt à investir »**, « Connexion établie · en attente » ou « En attente de votre invité » ;
  - le chat ;
  - **« Retour à l’accueil »** ;
  - pour l'hôte, **« Ouvrir le parquet »**, désactivé tant que les distants ne sont pas tous prêts, avec une note courte ;
  - pour l'invité, **« Je suis prêt »** / « Annuler mon état prêt ».
- Paramètres (dialogue) : son activé, volumes (général, musique, ambiance, effets), « Réduire les animations », select `Qualité graphique`, lien « Crédits et licences », bouton « Reprendre la séance ». Règles (dialogue) : les règles du jeu, à condenser en liste lisible sans perdre aucune règle.
- Bandeau d'erreur : bouton `Fermer le message d’erreur`, bouton « Nouvelle session ».

### 7.2 Monde de jeu (HUD) — `game/GameWorld.tsx`, `game/Geography.tsx`, `game/OfficeEnvironment.tsx`, `game/FinancialTicker.tsx`
- `.game-world` porte `data-presentation-stage`, `data-effects-started` (`"true"` seulement en `MARKET_IMPACT`) et `data-quality`, ainsi que les classes `motion-reduced`, `wealth-{id}` et `world-detained`.
- `.world-status h1` contient le **titre de phase exact** : « Règlement en cours », « Choisir son marché », « Le circuit des marchés », « Composer son portefeuille », « Clôture de la séance » ou « Passage de relais ». Au cycle 1, le texte **« OUVERTURE À C/C »** est affiché, puis « n / 100 CONTEXTES ».
- `.world-ratings` contient `.world-sectors` (9 secteurs, chacun avec icône, nom et note) et `.world-zones` (5 boutons `.economic-zone`, chacun avec `.rating-instrument > b` = lettre). Le clic sur une zone bascule la focalisation du plateau.
- `.command-console` :
  - `.active-fund h2` = nom du fonds actif, avec son statut (IA en réflexion, à vous, autre fonds) ;
  - les 3 étapes (Implantation, Dé & case, Trading) ;
  - `.active-location` = nom de la zone du fonds actif et sa semaine ;
  - `.turn-actions` :
    - « Lancer le dé » (`.action-dice`, raccourci ␣) ;
    - « Négocier » ;
    - « Terminer le marché », seulement quand le terminal est fermé ;
    - « Prochain investisseur » ;
    - « Choisir son marché » (`.action-travel`) ;
  - `.console-fund` : sa **dernière** `.animated-money` = liquidités du fonds actif ;
  - la détention (procès, sortie forcée à 5 M€) ;
  - pendant une présentation, le libellé d'étape, avec « Lire la carte » si le terminal masque une carte.
- `.fund-dock` : un `button.investor-card` par fonds, avec `.pawn-object`, le nom, la zone ou « Justice », IA/Humain, Insolvable, les liquidités et la valeur du fonds (`AnimatedMoney`). La classe `is-active` marque le fonds actif, `inspecting` le fonds inspecté. Le clic inspecte ce fonds (`viewerId`).
- `.world-tools` : boutons contenant **Portefeuille**, **Marché**, **Analyse**, **Statistiques** et **Salon** (badge non lus). On y trouve aussi le nom du fonds inspecté, le nombre de participations et le nombre de contrôles 100 % (C/C).
- Raccourcis : **P** portefeuille, **M** marché, **Espace** lance le dé (en phase dé, si autorisé, hors champ de saisie ou de bouton). Échap ferme le terminal.
- `.trade-receipt` : reçu construit depuis deux états serveur, de titre « ACHAT VALIDÉ », « VENTE VALIDÉE », « CONTRÔLE TOTAL » ou « MONOPOLE CONSTITUÉ ».
- `.world-chat` : salon de discussion du jeu.
- Terminal : `.terminal-backdrop` > `.floating-terminal` (`role="dialog"`, `aria-modal="false"`, `aria-label="Terminal de trading"`) qui contient `TradingDesk`.
- Décision de voyage (`Geography`) :
  - `.decision-backdrop.central-decision` > `.geography-scene` ;
  - fermeture `aria-label="Consulter le plateau avant de décider"` ;
  - `.travel-market` (+ `.current-market`, `.selected`) avec `.travel-zone-select` (`role="radio"`, `aria-checked`, `aria-label="Choisir {zone}"`, contenant `<b>{zone}</b>`), plus `.travel-analyse` (`aria-label="Analyser le marché {zone}"`) ;
  - `.travel-choice-summary` : destination et coût (« 0,00 M€ » ou « 1,00 M€ ») ;
  - boutons « Rester en {zone} » et « Voyager vers {zone} » ;
  - en détention, « Lancer le dé du procès ».
- `ConsequenceRibbon` : `.consequence-ribbon`, avec un bouton `.impact-continue` « Valider les cours » quand une confirmation est attendue. Il affiche la note qui change ou le cours d'une société.
- Victoire : `.victory-stage` (dialogue), `h2` avec les noms des gagnants, le classement complet et le bouton « Nouvelle partie ».
- Bureau : `.market-office` avec `data-current-market`, `data-office-city` et `data-office-player`. `.office-leaving` n'existe que pendant le fondu. Le bureau suit le fonds humain du client et change **après** `TRAVEL_RESOLUTION`. L'indication de prestige (`wealthStage`) est conservée.
- Ticker `.financial-ticker` (« GLOBAL EXCHANGE ») : défilement lent, arrêt au survol, respect du mouvement réduit.

### 7.3 Cartes — `presentation/CardScene.tsx`
- `.cs-backdrop` (`.is-embedded` / `.is-modal`) > `section.cs-scene.is-context | .is-payments | .is-event`, avec `role="dialog"`, `aria-labelledby="cs-title"` (**`h1#cs-title` = titre exact de la notice**) et `aria-describedby="cs-summary"`.
- Bouton `.cs-close` `aria-label="Continuer et appliquer les conséquences"` (affiche « Échap »). Échap ferme la carte. **Aucun `.cs-footer`.** Le contenu défile dans `.cs-content`.
- Contexte : résumé, avec le texte complet en dépli ; une `.cs-grade-row` par changement de note ; impacts portefeuilles **non nuls uniquement** ; détention éventuelle ; carrousel `.cs-companies` > `.cs-rail` > `.cs-company` > `.cs-company-data` avec `strong` cours avant puis cours après (le 2e `strong` = cours après).
- Événement (« GF Financial Chronicle ») : catégorie, cible, condition judiciaire et conséquences (`effectLines`), impacts non nuls, bilan Départ (performance, rendement, flux de capital), sociétés.
- Bull / Bear / Crash : notes qui changent, variation de valeur de chaque fonds touché, sociétés.
- Règlement :
  - `.cs-settlement-results` > `.cs-settlement-receipt` (un par motif), `h2.cs-settlement-heading` (motif, par exemple « Revenus du secteur Industrie ») ;
  - lignes `.cs-settlement-cash` (« Payeur → Bénéficiaire » et montant), `.cs-settlement-assets` (titres transférés ou vendus) et revenus bancaires en `.cs-payment-list .cs-payment` ;
  - ensuite `.cs-global-totals` (« TOTAL RÉGLÉ », « Reste impayé »), puis `.cs-companies`, **dans cet ordre DOM** ;
  - titre (heading) **« Synthèse des règlements — {secteur} »** ;
  - interdits : les textes « RÈGLEMENT ENTRE INVESTISSEURS », « Liquidités · débiteur → créancier » et « créancier → débiteur », le heading « Règlement terminé » et l'élément `.cs-settlement-total`.
- Paiements simples : versements exécutés ou « à financer », obligations, flux de capital au Départ.

### 7.4 Terminal — `trading/TradingDesk.tsx`
- `section.trading-desk` (`aria-label="Salle des marchés"`).
- `.td-header h1` : « TRADING — {ZONE EN MAJUSCULES} » ou « PORTEFEUILLE ».
- `.td-capital strong` : cash du fonds affiché.
- Boutons d'en-tête : `aria-label` « Terminer le marché », « Retour à la décision de voyage » (phase voyage) et « Retour au plateau ».
- `.td-tabs` : boutons « Marché » (nom exact), « Portefeuille » (avec badge), « Analyse » et « Statistiques ». L'onglet actif porte la classe `active`.
- Filtres :
  - searchbox `aria-label="Rechercher une entreprise"` ;
  - select `Zone à consulter` (phase voyage) ;
  - select `Filtrer par secteur` ;
  - select `Filtrer par taille de capitalisation` (valeurs all / small / medium / large).
- `.td-table-scroll` > `.td-column-head` contient **7** `.td-column[role=columnheader][aria-sort]`, chacune avec un `button.td-sort-button`. `.td-rows` contient des `button.td-row`, avec `.selected`, `.has-control` et `.has-monopoly`. Cellules :
  - `.td-name b` : le premier nœud texte = nom de la société ;
  - `.td-sector` ;
  - `.td-cap-category` : texte « SMALL », « MEDIUM » ou « LARGE », ou bien `.unknown` ;
  - `.td-price b` ;
  - `.td-profit-loss` : `.unknown` si le texte est « — », sinon par exemple « +0,0 % » ;
  - `.td-held` ;
  - `.td-available`.
  - Les valeurs numériques restent analysables : nombre au début du texte.
- À 1366×768, les 7 colonnes tiennent sans défilement horizontal.
- `.td-focus` (fiche) : `h2` = nom de la société. `.td-quote` contient **exactement des `div` plats (sans `div` imbriqué)** dans cet ordre : cours, PRU, P/L, parts détenues (`strong` = « 1 / 5 »), valeur. Le `strong` du cours fait au moins 18 px.
- Ticket : `.td-quantity` avec « Réduire la quantité », « Augmenter la quantité » et `b` = quantité, puis les boutons **« Acheter »** et **« Vendre »** (noms exacts) et le montant. Un `.td-focus-details` contient `.td-price-chart` (au moins 150–180 px de haut). `.td-focus-order` reste dans `.td-focus`. Motifs d'indisponibilité dans `.td-disabled-reason`, dont « Consultation libre pendant la décision de voyage… ».
- Portefeuille : « VOS POSITIONS », groupes zone × secteur (`.td-portfolio-groups`), progression de contrôle, monopole.
- Analyse (`.td-analysis`) : répartition par zone et par secteur (anneaux), contrôles 5/5 C/C, monopoles A/A.
- Statistiques (`.td-statistics`) : au moins 3 `.td-card` enfants directs, chacun d'au moins 180 px de haut : historique de valeur du fonds, notations zones/secteurs, cours d'une société. Le terminal reste dans le viewport à 1920, 1440 et 1366.
- Graphiques : ECharts, à restyler (palette laiton, grilles discrètes).

### 7.5 Desk de règlement — `game/SettlementDesk.tsx`
- `main.settlement-desk` (`aria-label="Desk de règlement"`).
- Cause : texte « CASE INDUSTRIE » (« CASE {SECTEUR} »).
- Débiteur, montant restant, créancier dans `.sd-party-creditor` (cash), liquidités disponibles et manque.
- `.sd-priority` (plus d'un créancier) : `:scope > div > span` par créancier, avec le nom et la valeur figée, plus le texte « Valorisation au début du règlement ».
- Sélection : `.sd-assets-table tbody tr`, boutons « Ajouter une part de {société} » et « Retirer une part de {société} », `.sd-quantity b` ; valeur indicative et complément estimé.
- Boutons « Vendre au marché » et « Proposer au créancier ».
- Titres « Choisissez les actifs à céder » et « {Débiteur} vous propose un règlement ».
- Offre (`.sd-offer-main`) : textes « Le débiteur vous verse », « Vous versez au débiteur », « Aucun complément en cash » et « Les parts couvrent exactement… » ; boutons « Refuser », « Exiger du cash », « Accepter et payer {montant} » et « Accepter le règlement ».
- `.sd-cash-warning` : « Disponible : X » et « requis : Y ».
- États d'attente : la décision appartient à un autre fonds.

### 7.6 Plateau — `board/BoardScene.tsx` (+ `board/three/*`)
- `section.fund-board` avec `data-quality`, `data-reduced-motion`, `data-presentation-stage`, `data-dice-state` (`"rolling"` si et seulement si l'étape est `DICE_ROLLING` sans mouvement réduit, sinon `"stopped"`) et `data-pawn-state` (`"moving"` si et seulement si `PAWN_MOVING` sans mouvement réduit, sinon `"idle"`).
- `.fund-board-canvas` (`role="img"`, `aria-label` = résumé des positions) avec `data-camera`, `data-fps` et `data-scene-ready`. Son `<canvas>` a `pointer-events: none` et un curseur différent de `help`. **Jamais de `.fund-board-tooltip`.**
- `.fund-board-accessible` : `<details><summary>Explorer les 52 cases</summary>` avec un `<ol>` de **52 `li`** (boutons). Bouton `.fund-board-accessible-roll` « Lancer le dé » (visuellement masqué).

---

## 8. Répartition (workstreams) et coordination

| Workstream | Fichiers (propriété exclusive) |
| --- | --- |
| **board** | `board/BoardScene.tsx`, `board/board-scene.css`, `board/three/*` sauf `pawns.tsx`, `globe.tsx` et `MenuHero.tsx` |
| **objects** | `board/three/pawns.tsx`, `board/three/globe.tsx`, `board/three/MenuHero.tsx`, `board/three/materials.ts` (matières partagées), studio de rendu des portraits (`apps/web/pawn-studio.html`, `apps/web/src/pawnStudio.tsx`, `scripts/redesign/render-pawns.ts`), `public/assets/pawns/render/*.png` |
| **hud** | `game/GameWorld.tsx`, `game/game-world.css`, `game/impact-ribbon.css`, `game/Geography.tsx` (+ son css), `game/OfficeEnvironment.tsx`, `game/office-environment.css`, `game/FinancialTicker.tsx`, `game/FinancialTicker.css` |
| **cards** | `presentation/CardScene.tsx`, `presentation/CardScene.css` |
| **terminal** | `trading/TradingDesk.tsx`, `trading/trading-desk.css` |
| **settlement** | `game/SettlementDesk.tsx`, `game/settlement-desk.css` |
| **menus** | `App.tsx`, `game/MainMenu.tsx`, `game/main-menu.css`, `game/StartingMarketPicker.tsx`, `game/starting-market-picker.css`, `game/Chat.tsx`, nouveaux `game/app-shell.css`, `game/home.css` et `game/lobby.css` |
| **lead** | `styles.css`, `ui/*`, `game/Pawn.tsx`, `board/types.ts`, `main.tsx`, `presentation/*` hors CardScene, `index.html`, `package.json`, docs, `scripts/redesign/shoot.ts` |

- Ne jamais modifier un fichier d'un autre workstream. Un besoin partagé (token, primitive) est noté dans le rapport final : le lead l'intègre.
- Les styles d'un écran vivent dans son fichier CSS. Les sélecteurs sont préfixés par la racine de l'écran pour ne pas fuir.
- `motion` est disponible (`motion/react`). `lucide-react` fournit les icônes, avec un trait de 1,5–1,75.

## 9. Vérification

- Typage : `npx tsc --noEmit -p .` depuis la racine, en filtrant ses propres fichiers (d'autres workstreams peuvent être en cours).
- Captures :
  ```
  npx tsx scripts/redesign/shoot.ts --scenes=<scènes> --sizes=1920x1080,1366x768 --out=<dossier> --cache=<workstream>
  ```
  Scènes : `menu`, `settings`, `rules`, `setup`, `setup-markets`, `join`, `lobby`, `board`, `chat`, `dice`, `roll` (avec `--motion=full`), `trading`, `portfolio`, `analysis`, `statistics`, `travel`, `jail`, `context`, `impact`, `event`, `prison`, `crash`, `bull`, `bear`, `payments`, `settlement-cash`, `settlement`, `creditor`, `ending`. Le rapport (`report.json`) liste aussi les erreurs console. Par défaut le GPU matériel (RTX) est utilisé ; `--swiftshader` reproduit le rendu logiciel des tests E2E (qualité `low` forcée). Regarder chaque PNG produit avec l'outil Read.
- Avant de rendre la main : zéro erreur console sur ses scènes, contrat §7 respecté, revue critique de ses propres captures à 1920 et 1366 (luxe, lisibilité, densité, alignements).
