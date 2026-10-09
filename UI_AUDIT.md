# Audit UI — géographie, analyses et terminaux

## Règlement et compacité — 7 octobre 2026

État avant : `baseline/clearing-2026-10-07/`. L’ancien audit ci-dessous reste historique ; son délai de quatre secondes est remplacé par une reprise explicite.

| Élément | Écart observé | Correction actuelle | Vérification |
| --- | --- | --- | --- |
| Impacts | Résultats disparaissent avant lecture | Conséquences majeures persistantes, bouton Reprendre la séance | Playwright attend 5,2 s puis exige encore le bouton |
| Terminal | Plusieurs titres GLOBAL FUND/TERMINAL | Header unique zone/cycle/cash, cadre fin de moniteur | Captures 3 résolutions et gardes de boutons |
| Fiche valeur | Secteur répété, scroll central étroit | Métadonnées uniques, résumé fixe, details flexibles et historique agrandi | Cotation/ticket/motif visibles ; courbe complète 250/180/155 px, une zone de détails défilante |
| Analyse | Petits donuts dans grands panneaux | Deux panneaux larges au-dessus des contrôles, resize ECharts | Donuts/légendes et contenus accessibles aux 3 tailles |
| Règlement | Dette et cause peu explicites | Case/secteur, obligations par créancier, total à régler, desk central | Case Industrie et ordre NAV/siège dans test navigateur |
| Manque de cash | Vente automatique non choisie | Sélection des parts sur tous les marchés, vente ou offre | Titres 12/20/27 M€ pour dette 20 M€, sens du cash affiché |
| Créancier | Décision inaccessible hors de son tour | Acteur distinct serveur, accepter/refuser/exiger cash | Deux contextes distants, incapacité à payer désactive l’acceptation |
| Résumé | Montants dus confondus avec exécutés | Cash réellement payé, titres figés, différence directionnelle, impayé explicite | Tests exacts des mouvements et reprise manuelle |
| Cartes | Modal générique et formulations hors univers | Dépêche GF Financial Chronicle, récit direct, Contexte sans masque latéral | Captures dédiées et audit texte |
| Ticker | Bandeau figé / boucle faible | Défilement lent continu, pause survol/focus, mode réduit | Données historiques réelles, aucune variation inventée |
| Logos | 71 initiales | 28 logos réels ajoutés, 47 actifs, 44 restants | Empreintes et XML/PNG contrôlés, aucun faux logo |

Captures et résultats finaux : [VISUAL_VALIDATION.md](docs/VISUAL_VALIDATION.md). Validation terminée : 33 images aux trois résolutions, dix alias laptop, 122 tests unitaires/intégration et 15 parcours Playwright passent. Les rognages de courbe et de prix après Contexte repérés à 1440×900 ont été corrigés ; les gardes incluent désormais les trois tailles. Les premiers paragraphes décrivent l’état livré ; les diagnostics plus bas restent des archives.

## Itération terminal et places — 7 octobre 2026

La référence avant ces changements est l'archive exacte de 39 images dans `baseline/ux-economy-2026-10-06/screenshots/visual-validation/`.

| Élément | Écart observé | Correction |
| --- | --- | --- |
| Création | Nationalité et configuration financière mélangées | Deux étapes, cinq places graphiques, sélection par fonds humain et IA réparties |
| Bureau | Décor variable selon le fonds inspecté et peu lié au marché | Ville attachée à l'humain client, skyline licenciée locale, changement après le voyage |
| Terminal | Prix et variation marché dominants, peu d'aide à la revente | Cours/PRU/P-L %, résumé fixe de cinq chiffres, sept tris, recherche et filtres CAP |
| Tableau 1366×768 | Détenues et Disponibles étaient hors champ ; filtres empilés | Grille de 596 px minimum, filtres en barre, sept colonnes visibles sans défilement horizontal ; assertion navigateur sur les bornes réelles |
| Portefeuille court | Les groupes absorbaient la hauteur des lignes ; le motif de désactivation de l'ordre était coupé | Groupes défilables sur 64 px, zone de positions réservée, résumé compact conservant le cours 21 px, motifs d'indisponibilité visibles ; garde de capture sur le vrai viewport |
| Laptop | Cartes hautes, illustration trop dominante | Illustration à gauche, histoire et conditions à droite, notes compactes et Continue fixe |
| Contexte 1366×768 | Le carrousel des entreprises commençait sous le pied Continuer | Héros de 104 px, sections et vignettes resserrées sur écran court ; contrôle des bornes du premier cours après et des notes avant toute interaction |
| Impacts | Valorisation finale peu lisible | Ruban majeur quatre secondes avec cash/NAV avant-après et reprise manuelle |
| Caméra | Cadrage global rendait le pion actif petit | Suivi pendant parcours/arrivée, zoom 1,22 et retour global disponible |

Les nouvelles captures et leurs contrôles sont consignés dans [VISUAL_VALIDATION.md](docs/VISUAL_VALIDATION.md) après exécution. Les captures de phases absentes de la référence ne sont pas comptées comme un résultat antérieur validé.

Diagnostic initial en lecture seule du frontend et des captures archivées dans `baseline/board-game-2026-10-06/`. Analyse des captures alors présentes dans `screenshots/visual-validation/` et `samples/`. Les références de `samples/` sont des maquettes d’intention; les captures de validation montrent l’interface actuelle. Aucun build, test ou navigateur n’a été lancé pendant cette passe.

| Élément | État observé avant cette itération | Correction proposée | Critère d’acceptation |
|---|---|---|---|
| Choix géographique | `Geography.tsx` affiche une grande photo d’aéroport, une icône avion, une option « rester » et quatre destinations en boutons texte. Le dialogue est modal (`aria-modal=true`) et piège le focus via `useDialogFocus`; l’arrière-plan est assombri et bloqué, donc les instruments/notes du HUD ne sont pas consultables pendant la décision de voyage. La maquette `samples/FC7E64E8-C6BE-4297-8D7C-1082BB6FF9B0.PNG` garde les marchés/notes visibles autour du choix géographique. Aucune capture actuelle du dialogue de voyage n’est dans les captures de validation. | Rendre les notes et informations nécessaires à la décision consultables dans le dialogue, ou offrir un accès qui ne ferme pas le choix en cours; conserver une destination sélectionnée, son coût, et l’action gratuite de rester clairement distincts. | Pendant le choix du vol, le joueur peut consulter les notes/indicateurs économiques sans perdre destination ou état choisi; toutes les actions sont accessibles au clavier, lisibles et non coupées aux trois résolutions ciblées. |
| Dialogues géographie et justice | `Geography.tsx` réutilise le même panneau pour voyage et détention; le panneau de détention n’offre que le texte de situation et le dé du procès. La scène est défilable, avec une hauteur d’image minimale de 550 px et un agencement à deux colonnes; sous 600 px elle devient empilée. | Vérifier les deux variantes à hauteur réduite et traiter les libellés longs, la navigation radio et le défilement du dialogue. | À 1366×768, le dialogue tient dans la zone visible ou défile jusqu’à son dernier bouton; focus reste dans le dialogue et les actions restent atteignables. |
| Répartition par zone/secteur | L’onglet Analyse contient deux donuts (`TradingDesk.tsx`, `exposure`/`donut`). Sur `analysis-1920x1080.png`, les panneaux sont bas et les donuts/légendes paraissent tronqués par le bas. Le layout CSS impose une hauteur de graphique de 170 px, tandis que le bureau flottant est limité à 635 px dans la règle générale. | Donner une hauteur effective aux cartes/graphes et organiser les panneaux en rangées qui peuvent défiler dans la surface du terminal. Éviter que le terminal coupe son contenu. | Donuts entiers, légendes complètes et infobulles utilisables dans Analyse; le reste du contenu reste accessible par défilement si la hauteur disponible ne permet pas de tout afficher. |
| Historique et notations | Les graphiques de valeur liquidative et d’évolution des notes partagent la grille avec les donuts et les règles de détention. La capture 1920 montre leurs axes/courbes à la limite basse des panneaux; aucune capture d’analyse à 1440 ou 1366 n’existe. | Définir une hauteur minimale compatible avec les axes et libellés et adapter la grille aux petites largeurs; garder des états vides informatifs. | Axes, séries, unités et légendes ne se chevauchent pas et ne sont pas masqués en 1920×1080, 1440×900 et 1366×768; états sans historique lisibles. |
| Terminal de marché, dimensions | Le terminal est un modal dans le plateau. `game-world.css` le contraint par des insets dépendant de la largeur et une hauteur de bureau dépendant de la hauteur d’écran; `trading-desk.css` cache le débordement du conteneur principal. Les captures de validation montrent le gameplay aux trois résolutions, mais Analyse seulement à 1920×1080. | Faire dépendre la hauteur du terminal de l’espace réellement disponible et prévoir une zone interne défilable pour chaque onglet; conserver en permanence fermeture, onglets et confirmation accessibles. | Pour Marché, Portefeuille et Analyse, à chaque résolution cible, le terminal ne dépasse pas l’écran, ne masque pas les commandes essentielles et donne accès à tout contenu par défilement explicite. |

## Priorités constatées avant la refonte

- **P0 : le dialogue modal de voyage bloque la consultation des indicateurs/notes du HUD au moment où le joueur doit choisir sa zone.** Le piège de focus est bien présent et cohérent pour le dialogue; c’est l’accès à l’information économique pendant ce choix qui est bloqué. La capture de cette phase manque encore pour vérifier la composition exacte.
- **P1 :** le rendu Analyse à 1920×1080 montre déjà des graphiques partiellement coupés; à traiter avant de considérer l’onglet Analyse validé.
- **P1 :** le dialogue de voyage et les onglets terminal à 1440×900 et 1366×768 n’ont pas de captures dédiées; le CSS utilise des règles de hauteur/largeur différentes dans ces plages.

## Couverture initialement manquante

- Capturer les états voyage normal et détention à **1920×1080**, **1440×900** et **1366×768**.
- Capturer les trois onglets du terminal (Marché, Portefeuille, Analyse) aux mêmes résolutions, avec assez de positions pour remplir les listes et graphiques.
- Vérifier le défilement, le focus clavier, les boutons d’action et l’absence de débordement vertical/horizontal; ajouter des contrôles de bornes des panneaux et graphiques au rapport de capture.
- Le `capture-report.json` actuel ne rapporte que les dimensions et chevauchements du titre/secteurs du plateau; il ne mesure ni les bornes du terminal/dialogue, ni le rognage des graphiques.

## Références de code

- `apps/web/src/game/Geography.tsx` — dialogue voyage/détention, choix de destination.
- `apps/web/src/styles.css` — styles du dialogue géographique, règles responsive jusqu’à 600 px.
- `apps/web/src/trading/TradingDesk.tsx` — données d’exposition et contenu de l’onglet Analyse.
- `apps/web/src/trading/trading-desk.css` — grille Analyse et dimensions des graphiques.
- `apps/web/src/game/game-world.css` — insets et hauteurs du terminal selon viewport.
- `screenshots/visual-validation/analysis-1920x1080.png`, `gameplay-1440x900.png`, `gameplay-1366x768.png`, `capture-report.json`; références visuelles `samples/FC7E64E8-C6BE-4297-8D7C-1082BB6FF9B0.PNG` et `samples/23DB635A-EE7A-4C13-8972-15E13B9853D9.PNG`.

## Corrections de l’itération du 6 octobre 2026

| Élément | Correction implémentée | Vérification prévue |
| --- | --- | --- |
| Implantation | Décision centrale non modale; cinq marchés, notes, nombre de sociétés, sélection persistante et coût. Ouvrir un outil conserve la décision; revenir la restaure. | Parcours Playwright consultation → retour → un seul MOVE. |
| Terminaux | Même surface centrale pour marché, portefeuille, analyse et statistiques. HUD périphérique et accès chat conservés. | Bornes centrales, absence d’intersection console/dock, captures aux trois tailles. |
| Trading | Quantité + Acheter/Vendre; aucune seconde confirmation. En consultation géographique, les ordres sont désactivés. | Deux parts par une seule commande; cash/parts reçus du serveur. |
| Graphiques | Hauteur minimale, espace pour les axes, légendes défilables, ResizeObserver et resize ECharts. Statistiques distinctes de la diversification. | Redimensionnements 1920/1440/1366 et captures. |
| Plateau | Une homographie commune; pions et bâtiments droits avec pieds/ombres projetés, tri par profondeur, tranche affinée. | Tests de projection et comparaison avant/après à chaque taille. |
| Chronologie | Dé 1100 ms, résultat arrêté 450 ms, parcours par case, arrivée puis lecture. Continuer ferme la carte puis révèle notes, cours et fonds. | Tests de présentation, observation DOM des phases normales, captures des cinq moments. |
| Monopoles | Couronne 5/5 C/C; réseau pour le groupe entièrement contrôlé A/A; regroupement et progression sans bonus pour le groupe incomplet. | Fixture multi-sociétés et captures portefeuille. |

Les conséquences décrites sur une carte constituent un aperçu; les instruments du plateau restent à leurs valeurs précédentes jusqu’à « Continuer ». Les copies de présentation n’écrivent jamais l’état serveur.

Un premier contrôle à 1366×768 a détecté deux régressions de composition, corrigées avant la validation finale : la règle générique des modales prenait priorité sur la décision de voyage; le terminal touchait le dock des fonds. Les règles centrales ont maintenant une portée explicite et une marge autour du HUD.

## Validation de la baseline du 6 octobre 2026

- **E2E : 8/8 réussis** sur le build `.releases/2026-10-06T06-57-23-991Z-246622`. Le test de voyage consulte Portefeuille/Marché avant la sélection, retrouve la destination après retour, traite la carte de paiement et vérifie une seule commande `MOVE`. Le test normal observe dé, résultat, déplacement, puis carte; la carte de contexte vérifie que « Continuer » déclenche les impacts. L’achat de deux parts émet une commande unique; les statistiques restent visibles aux tailles 1920, 1440 et 1366.
- **Images statiques : 39/39 enregistrées**, soit 13 vues aux résolutions 1920×1080, 1440×900 et 1366×768. Elles sont conservées dans [l’archive UX économie](</home/codex/projects/global-fund-next/baseline/ux-economy-2026-10-06/screenshots/visual-validation/>). Les neuf alias statiques disponibles sont dans `screenshots/current/`.
- **Phases transitoires et performance : non validées dans cette baseline.** Le processus s’est terminé avant les cinq captures de phase, le low/reduced-motion et `--perf-only`. Le [statut du run](</home/codex/projects/global-fund-next/screenshots/visual-validation/capture-run-status.json>) détaille la couverture. `capture-report.json` est resté celui du run ciblé précédent; il ne contient pas les mesures de ces 39 nouvelles images. Les quatre alias qui dépendent de phases (`dice-rolling`, `dice-result`, `pawn-moving`, `context-impact`) restent donc absents de `screenshots/current/`.

À la date de cette première baseline, le parcours testé avait résolu la priorité P0 — la consultation économique pendant le choix de voyage — mais il restait des images de phases et des mesures à produire. La validation finale du 7 octobre ci-dessous complète cette couverture et rapporte les mesures réelles du renderer de capture.

## Validation visuelle finale — 2026-10-07

- Les 39 images standards sont disponibles pour les 13 vues et les trois tailles desktop. Deux vues de setup marché et dix vues de bureaux complètent la suite. Les images inchangées reprises du build précédent sont listées dans [le rapport de capture](</home/codex/projects/global-fund-next/screenshots/visual-validation/capture-run-status.json>); elles n’ont pas été artificiellement présentées comme recapturées.
- Les 1366×768 du Portefeuille confirment un viewport de table de 104px, la visibilité de la première position sous l’en-tête, l’accès à la seconde position et le retour de sélection avant la capture. Le ticket et la raison désactivée tiennent dans les limites de la fiche.
- La carte Contexte laptop montre les notes et le premier cours après dans la zone au-dessus du pied. Le carrousel avance au geste horizontal; la capture 1920×1080 est au repère 7/26 après ce geste.
- Les cinq phases sont capturées à 1920 avec une horloge Playwright contrôlée et vérification du stage après rendu. Leurs données `fps` ne sont pas utilisées comme benchmark.
- La mesure SwiftShader à chaud donne 10 FPS RAF navigateur / 8 FPS du plateau en mode normal (3016ms), et 60 / 0 en qualité basse avec mouvement réduit (3007ms). Ces chiffres décrivent le rendu logiciel headless.
- Les 13 alias de revue, y compris les alias de phase, sont présents dans `screenshots/current/`.

Les images sont dans `screenshots/visual-validation/`. Certaines captures non touchées par les corrections ciblées proviennent du build précédent, selon les provenances consignées dans le rapport.


## 8 octobre 2026 — corrections de lecture

| Élément | État précédent | Correction | Vérification |
| --- | --- | --- | --- |
| Configuration | État perdu à la fermeture de l’écran | Brouillon navigateur, toutes les places conservées | Parcours menu/reprise, rechargement et réduction/rétablissement du nombre de joueurs |
| Versements | Cycle, titres génériques et pied de page répétés | FLUX DE TRÉSORERIE — fonds, opérations et détails seulement | Capture payment-card et contrôle des textes/boutons |
| Journal / Contexte | Métadonnées et bandeau inférieur absorbent la hauteur | Métadonnées ordinaires et footer supprimés, Échap conservé | Capture événement/Contexte, notes et cours non rognés |
| Ajustements de cours | Défilement automatique rapide | Bouton Valider les cours, aucune expiration | Horloge de présentation IA, animations réduites, parcours navigateur |
| Plateau | Survol et curseur help | Canvas passif sans hit testing | Curseur, pointer-events et absence d’infobulle au survol |
