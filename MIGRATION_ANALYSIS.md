# Diagnostic de migration — Global Fund

## Périmètre et protection

Référence analysée en lecture seule : `/home/codex/projects/trading-game`. Destination entièrement indépendante : `/home/codex/projects/global-fund-next`. Un manifeste SHA-256 couvre 157 fichiers de référence ; `data/rooms.json`, modifié par son service actif, est volontairement exclu. Les sources et ressources retenues sont copiées localement, sans lien d'exécution vers la référence.

## Architecture actuelle

React 19 et Vite présentent les écrans. Node.js, Express et Socket.IO assurent le serveur autoritaire. `server/game.js` concentre les transitions métier ; `server/index.js` gère les salons, sessions, commandes, IA, chat et sauvegardes dans `data/rooms.json`. Le navigateur reçoit `publicState` et soumet des actions. Les dés et cartes sont tirés sur le serveur.

## Classification avant migration

| Module / source | Classement | Travail retenu |
| --- | --- | --- |
| Formules `priceFor`, `incomeFor`, `incomeForHolder`, `fundValue` dans `server/game.js` | RÉUTILISABLE TEL QUEL | Extraire les calculs, vérifier les coefficients et revenus avec des tests. |
| Liquidation, dettes et procès : `payOrSell`, `processPrisonRoll`, liquidation E/E | ADAPTABLE | Conserver les mécanismes ; les détentions, revenus et transactions restent vérifiés par le moteur. |
| `createGame`, `applyAction`, `roll`, `nextTurn`, `ownsMonopoly` | À ADAPTER / À RÉÉCRIRE pour les règles modifiées | Implantation avant dé, 52 cases, performance à Départ et monopole intégral. Extraire les fonctions fiables autour de ces modifications. |
| `data/gameData.json`, `data/nationalities.json` | À MIGRER | Copier les 91 sociétés, 5 zones, 9 secteurs et 22 nationalités ; adapter le parcours. |
| `server/boardEventCards.js`, `server/eventStories.js` | ADAPTABLE | Réutiliser les récits et effets fiables ; augmenter les Événements de 28 à 50 et conserver un paquet Contexte distinct. |
| `server/index.js` | À RÉÉCRIRE, avec réutilisation des principes | Fastify/TypeScript, contrats partagés, contrôle des sessions, révisions, idempotence, file de commandes, persistance PostgreSQL isolée. |
| Écrans `src/App.jsx`, `GameExperience.jsx`, `MarketExperience.jsx`, `WorldMap.jsx`, `IsometricBoard.jsx` et CSS | À RÉÉCRIRE | Réutiliser les intentions UX et références visuelles ; nouvelle scène Pixi et composants HTML React typés. |
| Tests moteur, nationalités, salons et robots de `tests/` | À MIGRER | Retenir leurs scénarios métier ; adapter les assertions aux règles Next et ajouter des tests du nouveau protocole. |
| `public/scene`, photographies et registres `data/*Sources.json` | RÉUTILISABLE après contrôle de provenance | Copier l'art interne et les ressources libres compatibles ; documenter les licences et modifications. |
| `public/company-logos` | À MIGRER après audit des droits | Monogrammes dans la première scène ; aucun logo transféré sans vérification. |
| Compatibilité d'anciennes sauvegardes, aliases de cartes, anciens rendus de plateau | OBSOLÈTE pour la nouvelle application | Aucun import automatique des anciennes parties, dont les règles et le parcours diffèrent. |
| Ancien déploiement | RÉFÉRENCE EN LECTURE SEULE | Conserver son service et hôte ; créer un service, port, base et hôte propres à Next. |

## Données et fonctionnalités opérationnelles

La référence possède 44 cases : 32 sectorielles, 8 Événements, 3 marchés et Départ. Elle contient 100 Contextes, 28 Événements, 91 sociétés avec cinq parts de 20 %, et 22 nationalités. Les cours et revenus sont calculés par `base / 5 × coefficient zone × coefficient secteur`, avec A=1,50, B=1,25, C=1, D=0,75 et E=0,50. La valeur du fonds additionne liquidités et participations valorisées.

L'ouverture se fait à C/C sans Contexte. La nationalité choisit le marché initial gratuit. Les cycles suivants reçoivent un Contexte commun ; les Événements sont tirés sur les cases correspondantes. La référence propose aussi des humains locaux/distants, IA, achat/vente, prix moyen d'achat, revenus, faillites, prison, ventes forcées, historique, chat et reprise de session.

Le revenu d'une détention 5/5 est au minimum C/C. L'ancien monopole exigeait le contrôle complet d'au moins la moitié des sociétés du groupe, arrondie au supérieur. À Départ, la référence attribuait systématiquement 20 M€. Le dé précédait le choix géographique. La liquidation E/E rembourse les parts au cours E/E, supprime les participations et ferme temporairement la société jusqu'à l'amélioration d'une note. La prison bloque le trading et la perception de revenus, avec procès aux tours suivants et sortie forcée pouvant coûter 5 M€.

## Écarts décidés pour Next

- **Implantation avant le dé**, confirmé explicitement par l'utilisateur le 4 octobre 2026. La contradiction du texte initial est résolue ; aucune option d'ordre ambiguë n'est conservée.
- Ouverture gratuite par nationalité, sans Contexte ni voyage au cycle 1. Cent Contextes communs sont ensuite joués ; le dernier cycle porte donc le numéro 101. La partie peut finir plus tôt lorsqu'un seul fonds reste solvable.
- Parcours de 52 semaines : 38 cases sectorielles, 10 Événements, 3 marchés et Départ. Paquet Événement porté à 50 cartes.
- Monopole : 5/5 parts de **chaque** entreprise du groupe zone/secteur, donnant au minimum A/A.
- Départ : +20 M€ si la performance du tour est positive, −20 M€ si elle est négative, zéro si elle est nulle. Les apports/retraits sont neutralisés dans cette performance ; ils restent inclus dans la valeur du fonds.
- Le navigateur soumet des commandes typées ; le serveur valide, exécute, sauvegarde et diffuse. Le moteur est extrait dans `packages/game-engine`, avec une façade TypeScript et un noyau JavaScript local progressivement typé.

## Points forts et dette technique

Les calculs et transitions existants couvrent des situations complexes et constituent la principale valeur à conserver. Les datasets et scénarios de tests offrent une base de comparaison solide. Les références du répertoire `samples/` guident la hiérarchie des écrans, le plateau central, le terminal financier, les cartes et le salon.

La dette principale est la taille du module métier JavaScript, les anciens champs de compatibilité, le couplage des phases à l'interface historique et le stockage de salons en fichier. Le nouveau périmètre impose aussi des vérifications de concurrence, une aléatoire reproductible pour l'équilibrage, des mesures graphiques sur matériel réel et un audit des logos. Ces travaux sont priorisés dans ROADMAP.md.
