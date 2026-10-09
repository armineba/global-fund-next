# Roadmap

## Itération visuelle — octobre 2026

La priorité de cette itération est la présentation des mécanismes existants. Le moteur, le serveur et les formats de sauvegarde restent inchangés.

| Phase | Livrable | État |
| --- | --- | --- |
| A — Audit | Quatre maquettes étudiées et captures de départ | Réalisé : `VISUAL_AUDIT.md`, `baseline/` |
| B — Direction | Palette, matières, caméra, HUD, audio et budgets | Réalisé : `ART_DIRECTION.md` |
| C — Assets | Sources libres vérifiées, sprites et polices locaux | Réalisé : `ASSET_LICENSES.md`, `docs/generated-assets.md` |
| D — Plateau | Scène Pixi 52 cases, carte nocturne, six figurines et métropoles | Réalisé |
| E — HUD | Fonds visibles, notations, commandes et terminal flottants | Réalisé |
| F — Animations | Dé, progression case par case, caméra, voyage et reçus financiers | Réalisé |
| G — Cartes | Contexte, Événement, Bull/Bear/Crash et justice | Réalisé |
| H — Audio | Effets locaux facultatifs et réglages | Réalisé pour les effets ; musique et ambiance à poursuivre |
| I — Validation | Tests, captures desktop et mesures de rendu | Résultats consignés dans `PROGRESS.md` et `docs/VISUAL_VALIDATION.md` |

La suite de finition porte sur les essais joueurs, les GPU de laptops et les pistes d'ambiance. Elle ne doit pas déclencher une réécriture du métier ou une multiplication de fonctions secondaires.

## Étape A — Diagnostic et isolation

Analyser les modules et écarts de règles, consigner le manifeste de la référence, créer le projet autonome, les contrats et le registre des décisions.

## Étape B — Scène verticale jouable

Extraire le métier ; adapter les 52 cases, 50 Événements, monopoles, implantation et flux de Départ. Relier Fastify/Socket.IO à React/Pixi. Livrer un plateau vivant, les 5 zones/9 secteurs, plusieurs pions, le dé, des transactions réelles, un portefeuille, des historiques ECharts et les deux familles de cartes. Les parties locales, mixtes et avec IA utilisent ce même chemin.

## Étape C — Fiabilité et accès de test

Tester les calculs sensibles et le protocole réel entre clients ; contrôler la scène dans Chromium, les mouvements réduits et les erreurs de console ; publier sous un hôte séparé. Vérifier le maintien du service et du manifeste de référence. Activer le stockage PostgreSQL propre à Next lorsque disponible.

## Étape D — Qualité de jeu à étendre

Typage progressif complet du noyau et injection d'aléatoire reproductible ; simulations de 100/1 000/10 000 parties avec mesures de variance ; stratégies IA évaluées ; équilibrage de la fréquence des cases et cartes ; reprise avancée et diagnostics de désynchronisation.

## Étape E — Finition commerciale

Audit d'accessibilité clavier/lecteurs d'écran ; budgets graphiques sur laptops réels ; textures optimisées et chargement différé ; enrichissement des figurines, scènes spécifiques, audio et onboarding ; sauvegardes PostgreSQL/restauration vérifiées ; observabilité, tests de charge multi-salons et matrice de navigateurs. Ces validations précèdent toute promesse de qualité commerciale ou de 60 FPS sur tout matériel.

Chaque étape met à jour PROGRESS.md. Les fonctionnalités de la scène doivent être utilisables immédiatement ; les prochaines étapes renforcent une base existante.

## Itération règlement et compacité — 7 octobre 2026

Cette étape prolonge la scène existante : le moteur est adapté pour le règlement, sans reconstruire le projet ni toucher à la référence historique.

| Priorité | Livrable | État |
| --- | --- | --- |
| P0 | Conséquences persistantes, Reprendre la séance, cause sectorielle | Réalisé |
| P1 | Terminal à en-tête unique, cotation fixe, historique complet et Analyse agrandie | Réalisé ; revue laptop effectuée |
| P2 | Liquidations choisies, offres figées, cash dans les deux sens, PRU et insolvabilité | Réalisé ; ordre NAV/siège confirmé par l’utilisateur |
| P3 | Coupures de presse, ticker continu, Contexte sans masque latéral | Réalisé |
| P4 | Logos locaux, tests et captures aux trois résolutions | 47 logos, 122 tests et 15 parcours E2E passent ; 33 captures et dix alias vérifiés |

Les résultats exacts et la provenance des captures sont consignés dans `PROGRESS.md` et `docs/VISUAL_VALIDATION.md`. La prochaine étape de fond est une campagne d’essais joueurs et d’équilibrage du nouveau règlement ; les anciennes simulations économiques ne suffisent pas à l’évaluer.
