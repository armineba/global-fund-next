## Règlements consolidés — 9 octobre 2026

La synthèse rassemble les mouvements sous leur motif (par exemple **Revenus du secteur Énergie**) : chaque ligne indique les noms du fonds émetteur et du bénéficiaire, dans le sens réel du versement. Les titres intermédiaires répétés sont supprimés. Le **total réglé** suit les mouvements, puis le carrousel des entreprises concernées.

Une séance payée en cash montre une seule fiche, même avec plusieurs créanciers. Une séance nécessitant une négociation passe par le desk, puis une seule fiche finale. Les ajustements réels de notes/cours conservent leur animation et **Valider les cours** ; cette validation revient directement au jeu. Les calculs, l’ordre des créanciers et les droits de décision restent inchangés.

## Lecture et configuration — 8 octobre 2026

- La configuration conserve les noms des fonds, le nombre de places, les types de joueurs, les pions, les difficultés IA, les marchés humains et l’étape en cours. Revenir à l’accueil ou recharger la page retrouve ces choix dans ce navigateur. Réduire puis réaugmenter le nombre de joueurs restaure les places masquées. Les paramètres de connexion à un salon sont aussi conservés ; un lien d’invitation reste prioritaire.
- Les fiches de versement portent l’en-tête **FLUX DE TRÉSORERIE — NOM DU FONDS**, sans cycle ni titre générique redondant. Les coupures de journal retirent les métadonnées Effet/Cible, l’étiquette du fonds et la famille de l’événement ; conditions judiciaires et conséquences restent visibles.
- Les cartes Contexte, Événement et versement n’ont plus de bandeau inférieur. Le bouton **ÉCHAP** en haut à droite, ou la touche Échap, ferme la carte et révèle ses conséquences.
- Les règlements d’une même opération apparaissent dans **une seule synthèse globale** : versements à chaque fonds, titres transférés, compléments de cash, ventes au marché et impayés. Le bilan intermédiaire « Les fonds sont revalorisés » est supprimé : les liquidités et valeurs restent visibles dans le HUD. Une opération sans changement de marché reprend directement après fermeture de sa fiche.
- Le plateau graphique ne réagit plus au passage de la souris et n’affiche plus de curseur d’aide. Le suivi automatique du pion, les commandes de caméra et l’exploration textuelle au clavier sont conservés.

## Règlements, terminal et dépêches — 7 octobre 2026

- Un paiement sans assez de liquidités ouvre un **desk de règlement** : le débiteur choisit les titres à céder dans tout son portefeuille, même hors de sa place de marché. Cette exception ne permet pas d’acheter. Le tour reprend après résolution de la dette.
- Une dette envers la banque se finance par une vente au marché. Entre joueurs, le débiteur peut proposer des titres au **cours figé par le serveur**. Le créancier accepte, refuse ou exige du cash.
- Le complément est symétrique : pour une dette de 20 M€ et des titres de 12 M€, le débiteur ajoute 8 M€ ; pour des titres de 27 M€, le créancier paie 7 M€ au débiteur. Sans les liquidités requises, il ne peut pas accepter. Le PRU du bénéficiaire utilise la valeur complète de transfert, soit 27 M€ dans ce dernier exemple.
- Plusieurs créanciers sont traités par **valorisation du fonds croissante**, avec départage stable par siège. L’ordre est figé au début du règlement. Les IA utilisent les mêmes commandes ; après refus d’une offre IA, elles liquident au marché. Un créancier ne reçoit que l’argent effectivement financé.
- Si une dette nécessite un choix de titres, le dé et le pion terminent leur déplacement puis le **desk de règlement** s’ouvre directement. Les décisions restent individuelles, mais une seule synthèse est présentée après le règlement de tous les créanciers. Elle reste lisible jusqu’à Échap. L’offre, les règlements déjà effectués et la synthèse survivent à une reprise serveur.
- Le terminal possède un seul en-tête, un cadre de moniteur discret, une fiche de valeur avec cotation fixe, un graphique agrandi et une seule zone de détails défilante. Analyse présente deux grandes répartitions puis les contrôles/monopoles.
- Les Événements prennent la forme de dépêches du **GF Financial Chronicle** ; les récits s’expriment directement. Le ticker financier défile modérément, s’arrête au survol/focus et respecte les animations réduites.
- **47 logos/91** sont maintenant disponibles localement, contre 20 auparavant. Les 44 monogrammes restants sont listés dans [COMPANIES_WITHOUT_LOGO.md](COMPANIES_WITHOUT_LOGO.md). Sources, auteurs et droits : [audit](docs/LOGO_AUDIT.md), [licences](ASSET_LICENSES.md).

Règles détaillées : [SETTLEMENT_RULES.md](SETTLEMENT_RULES.md). Les archives locales `baseline/`, `samples/` et les sous-dossiers de captures de validation ne sont pas publiés dans Git ; les scripts permettent de régénérer les captures.

## Terminal et places financières — octobre 2026

- La création sépare **configuration des fonds** puis **choix des places de marché**. Chaque humain choisit parmi Amériques, Europe, Asie, Afrique & Moyen-Orient et Océanie ; les IA se répartissent automatiquement. La nationalité du joueur n'est plus demandée. L'implantation initiale est gratuite, à C/C.
- Le bureau appartient au fonds humain de ce navigateur : **New York, Londres, Hong Kong, Dubaï ou Sydney**. Il conserve sa ville pendant les tours IA et la consultation d'un autre fonds. Après un voyage, il change avec un fondu de 500 ms. Les implantations historiques restent distinctes du marché actuel.
- Le terminal propose recherche instantanée, sept colonnes triables et filtres **Tous / Small / Medium / Large**. À 1366×768, les sept colonnes restent visibles sans défilement horizontal. La fiche fixe affiche cours, prix moyen d'achat, P/L en pourcentage, parts et valeur de position. Le P/L est `—` sans titres ou sans PRU connu.
- Sur écran court, les regroupements du portefeuille possèdent leur propre zone défilable au clavier ou à la molette : ils ne masquent plus les positions. Le ticket garde également visibles les motifs d'indisponibilité des ordres.
- Les tailles utilisent une hiérarchie de capitalisations réelles approximatives, documentées ; les prix et revenus de jeu suivent une normalisation séparée. Les seuils Small <40, Medium 40–200 et Large ≥200 Md USD sont propres à l'univers des grandes sociétés de Global Fund.
- Pour les **nouvelles parties**, les prix C/C par part sont Small **5–20 M€**, Medium **36–90 M€**, Large **110–300 M€**. La grille interpole logarithmiquement les capitalisations à l'intérieur de chaque catégorie. Les revenus C/C d'une société entière représentent respectivement 10 / 12 / 14 % de son prix de base à chaque résolution de son secteur ; ce sont des paramètres de jeu, sans équivalence à un dividende annuel réel. Les parties déjà sauvegardées gardent leurs prix et revenus.
- Les fiches de résultat restent affichées **jusqu’à Échap**, y compris les petits versements IA ; aucun bilan financier supplémentaire n’est ouvert ensuite. Les cartes laptop privilégient illustration, résumé, conditions et transitions de notes ; leur texte complet reste disponible. À 1366×768, une carte Contexte montre également les premiers cours avant/après du carrousel sans défilement vertical initial.

Économie et sources : [ECONOMY_BALANCING.md](ECONOMY_BALANCING.md), [COMPANY_AUDIT.md](COMPANY_AUDIT.md), [MARKET_DISTRIBUTION.md](MARKET_DISTRIBUTION.md), [EVENT_CARD_AUDIT.md](EVENT_CARD_AUDIT.md).

## Itération « jeu de plateau » — octobre 2026

- **Avant de voyager**, ouvrez Marché, Portefeuille, Analyse ou Statistiques pour comparer les zones. La consultation ne coûte rien et ne valide aucune action ; la destination reste sélectionnée. Seuls **Rester** et **Voyager** transmettent ce choix au serveur.
- Le dé tourne, s’immobilise, puis le pion avance de case en case. Les cartes laissent le temps de lire ; **Continuer** déclenche leur présentation financière : notes réelles une à une, cours, puis valorisation des fonds. Les événements de case ne modifient pas les notes. Le serveur a déjà calculé le résultat ; cette chronologie organise uniquement ce qui est visible.
- Le ticket d’ordre utilise **quantité + Acheter / Vendre**, sans dialogue supplémentaire. Les échanges restent soumis à la phase, à la zone, aux liquidités, aux titres disponibles et aux droits vérifiés par le serveur.
- La **couronne** identifie le contrôle total 5/5, avec revenu minimum C/C. Le **réseau** identifie un monopole complet Zone × Secteur, avec revenu minimum A/A. Les détentions partielles indiquent la progression du groupe.
- Analyse présente diversification et contrôle ; Statistiques présente les historiques réellement enregistrés. Le salon reste accessible depuis chaque terminal.
- Le catalogue contient **91 entreprises réelles**, dont TotalEnergies et trois industriels asiatiques (Mitsubishi Heavy Industries, Komatsu, FANUC), ainsi que Sun Hung Kai Properties et Emaar dans l'Immobilier. Les IDs restent stables ; les parties déjà sauvegardées conservent leurs entreprises et leur économie incorporées. 47 logos réels locaux documentés sont utilisés ; les 44 autres sociétés gardent un monogramme.

Documentation : [UI_AUDIT.md](UI_AUDIT.md), [BOARD_PROJECTION.md](BOARD_PROJECTION.md), [COMPANY_AUDIT.md](COMPANY_AUDIT.md), [MARKET_DISTRIBUTION.md](MARKET_DISTRIBUTION.md). Captures de cette itération : `screenshots/current/` ; référence avant modification : `baseline/board-game-2026-10-06/`.

# Global Fund Next

## Scène immersive — octobre 2026

La partie s'affiche maintenant comme une table de stratégie en plein écran : plateau Pixi en perspective, 52 plaques, carte terrestre nocturne, villes en volume et six figurines distinctes. Les données économiques et les liquidités/valorisations de tous les fonds restent dans le HUD. Le marché, le portefeuille, l'analyse et le chat s'ouvrent au-dessus du plateau.

- **Marché / M** : terminal de négociation ; sélectionner une société et une quantité, puis cliquer directement sur Acheter ou Vendre. Le reçu apparaît après réception de l’état validé par le serveur.
- **Portefeuille / P** : participations, prix moyen, parts disponibles, contrôle 100 % avec minimum C/C, monopoles avec minimum A/A et diversification.
- **Espace** : lancer le dé lorsque le fonds actif est contrôlé par ce navigateur. Le pion avance réellement de semaine en semaine, après l'animation du dé.
- **Vue globale** : revenir à l'ensemble du plateau. Cliquer sur un indicateur de zone recentre la caméra sur cette région.
- **Paramètres** : réduire les animations, qualité haute/moyenne/basse et volumes. Le choix de mouvement réduit du système est respecté. Le son est muet par défaut ; les effets sont locaux. Musique et ambiance n'ont pas encore de pistes en boucle.

La ville du bureau suit le fonds humain du navigateur, indépendamment du fonds inspecté. Sa valeur fait évoluer la tonalité et l'indication de prestige : difficulté sous 50 M€, bureau normal, desk à 500 M€, bureau en tour à 1 Md€, salle mondiale à 5 Md€, décor doré à 10 Md€ et influence mondiale à 100 Md€. Ces indications n'ajoutent aucun bonus financier.

Les fenêtres de résultat attendent la fin des déplacements. Les Contextes, Événements, Bull/Bear/Crash et situations judiciaires ont leur propre présentation ; la lecture reste libre. Échap ferme la carte puis déclenche l’animation des conséquences ; les notes, cours et fonds restent à leurs valeurs précédentes pendant la lecture. Les entreprises concernées défilent horizontalement à la molette ou au toucher ; les listes d'impacts plus longues restent défilables.

**Règles conservées** : implantation avant le dé, cycle initial à C/C sans Contexte, cinq zones du moteur historique (Amériques, Europe, Asie, Afrique/Moyen-Orient, Océanie). Les 91 IDs et les entreprises incorporées aux sauvegardes restent conservés. Les nouvelles parties utilisent le catalogue courant et sa grille économique documentée ; le serveur garde l'autorité sur chaque action.

Direction et suivi : [VISUAL_AUDIT.md](VISUAL_AUDIT.md), [ART_DIRECTION.md](ART_DIRECTION.md), [PROGRESS.md](PROGRESS.md), [ASSET_LICENSES.md](ASSET_LICENSES.md). Captures reproductibles : `npm run build`, puis `npm run capture:visuals` ; elles utilisent uniquement des salons de test isolés. Voir [VISUAL_VALIDATION.md](docs/VISUAL_VALIDATION.md).

Aperçus : [plateau](screenshots/gameplay.png), [trading](screenshots/trading.png), [portefeuille](screenshots/portfolio.png), [Contexte](screenshots/context.png), [Crash](screenshots/crash.png), [justice](screenshots/prison.png). Les sprites originaux et leurs prompts sont décrits dans [generated-assets.md](docs/generated-assets.md) et [generated-prompts.md](docs/generated-prompts.md).

Le build web prépare une nouvelle release avant de remplacer le lien `apps/web/dist`. Les anciennes ressources hashées restent servies aux clients déjà ouverts. Les dossiers `apps/web/.releases` sont ignorés par Git et ne sont pas purgés automatiquement. Le contexte Docker exclut ces releases et les captures de validation ; son build produit sa propre release.

Nouvelle application autonome de Global Fund. Le projet de référence reste séparé : Next ne partage ni son code d'exécution, ni ses salons, ni sa base. L'application est en français et utilise ses ressources graphiques locales ; leur provenance et leurs licences figurent dans [ASSET_LICENSES.md](ASSET_LICENSES.md).

## Première tranche jouable

- Ouvrir un salon de 2 à 6 fonds, avec des personnes sur le même écran, des invités distants ou des IA de trois niveaux. Les salons proposent un code/lien d'invitation, un état « prêt », la reprise de session et un chat.
- Jouer sur un plateau de 52 cases avec 91 sociétés, neuf secteurs, cinq zones économiques, 100 cartes Contexte et 50 Événements. Le cycle d'ouverture place gratuitement chaque fonds sur sa place de marché choisie, à indices C/C. À partir du cycle 2, une carte Contexte commune est tirée puis chaque fonds choisit son implantation **avant le dé** : rester ne coûte rien, changer de zone coûte 1 M€.
- Acheter et vendre jusqu'à cinq parts par société, suivre les cours et le portefeuille, et voir les historiques construits pendant la partie. Le contrôle complet (5/5) garantit au moins C/C de revenu ; un monopole exige toutes les parts de toutes les sociétés du groupe zone/secteur et garantit au moins A/A. La faillite E/E liquide les parts puis suspend la société jusqu'à amélioration d'une note.
- Résoudre les revenus, événements, détentions, passages à Départ et fins de partie du moteur. À Départ, la variation de valeur du fonds est mesurée hors apports/retraits depuis le précédent passage : +20 M€ si elle est positive, −20 M€ si elle est négative, aucun flux si elle est nulle. La partie se termine après le cycle de la 100e carte Contexte ou lorsqu’un seul fonds reste solvable.
- Synchroniser les commandes par Socket.IO avec contrôles serveur du joueur, du tour, de la phase et de la révision. Les dés et les tirages restent décidés par le moteur, côté serveur.

Il s'agit d'une première tranche : les salons sont privés par code et les sessions sont conservées dans le navigateur ; il n'y a pas de comptes, de matchmaking public, de classement interparties ni d'administration des utilisateurs. Le jeu est encore en cours de migration progressive du noyau métier hérité. La sauvegarde serveur conserve l'état des salons, pas un historique produit/exportable des parties.

## Règles financières et phases

Chaque fonds démarre avec **100 M€**. Sa valeur est la somme des liquidités et des parts au cours actuel ; le prix moyen d'achat sert à lire la rentabilité d'une revente.

| Note | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| Coefficient | 1,50 | 1,25 | 1,00 | 0,75 | 0,50 |

Le cours d'une part est la valeur de base de l'entreprise divisée par cinq, multipliée par les coefficients de zone et de secteur. Son revenu utilise la même formule avec le revenu de base. Chaque société possède cinq parts de 20 %.

Les dés de départ sont tirés par le serveur et leurs résultats sont affichés ; le plus haut commence. L’ordre de jeu est fixé au lancement : le gagnant du dé commence, puis les fonds jouent suivant l’ordre des places autour de la table. **Cet ordre reste identique à chaque cycle** ; les fonds insolvables sont simplement sautés. Pour une partie sauvegardée avant cette modification, l’ordre actuellement enregistré est figé, sans interrompre le tour en cours. L'ouverture est le cycle 1, sans Contexte : les cent Contextes sont joués du cycle 2 au cycle 101.

À chaque tour, dès le cycle 2 :

1. Choisir de rester gratuitement ou de voyager pour 1 M€, dans la scène d'aéroport.
2. Lancer le dé et parcourir les cases sectorielles.
3. Résoudre la case et lire les conséquences après l'animation.
4. Acheter ou vendre dans sa zone, puis passer la main.

Sur une case sectorielle, le joueur actif paie les autres détenteurs au prorata des parts. **Il ne reçoit aucun revenu du marché ou de la banque pour ses propres participations lorsqu’il tombe sur ce secteur**, même avec un contrôle total ou un monopole. Ces participations rapportent leurs revenus lorsqu’un autre fonds tombe sur le secteur. Les détenus ne perçoivent pas de revenus : ceux qui leur étaient dus vont à la banque. Une société contrôlée à 5/5 garantit au moins le revenu C/C ; le contrôle intégral de toutes les entreprises d'un groupe zone/secteur garantit A/A.

Le **Contexte** est collectif et modifie les notes, cours, revenus et valorisations. Il n'envoie pas directement en prison et n'impose pas de vente. Un **Événement**, tiré sur sa case, concerne surtout le joueur actif : dividende, amende, financement, vente imposée ou enquête. Il ne modifie pas les notes. Bull, Bear et Crash modifient directement le marché.

Une enquête ciblant une entreprise n'emprisonne que le joueur qui en détient des parts. La détention suspend ses échanges et revenus ; les participations continuent à être valorisées. Le procès commence au tour suivant : sortie sur 6 au premier procès, sur 5 ou 6 au deuxième, puis sortie forcée pour 5 M€ au troisième selon le mécanisme conservé.

En cas de **faillite E/E**, les parts sont remboursées au cours E/E : `base / 5 × 0,50 × 0,50`. Elles sont retirées des portefeuilles et l'entreprise ferme temporairement. Dès qu'au moins une note s'améliore, ses cinq parts redeviennent disponibles. Les protections de revenu C/C et A/A ne bloquent pas cette liquidation.

Une dette peut imposer la vente de titres. Un fonds incapable de la régler après liquidation de ses positions devient insolvable. La partie finit après le cycle de la 100e carte Contexte ou lorsqu'un seul fonds reste solvable ; la plus grande valeur du fonds gagne.

## GitHub, développement sur Mac et déploiement automatique

Le code est partagé sur [mattmofr/global-fund-next](https://github.com/mattmofr/global-fund-next). Chaque push sur `main` lance les tests unitaires, la compilation et les parcours Playwright ; leur réussite déclenche la mise à jour du VPS. Le [guide Mac et GitHub Actions](deploy/GITHUB_WORKFLOW.md) décrit le clone local, les commandes Git et le retour à une version précédente.

## Prérequis et démarrage local

Node.js 22.12 ou plus récent et npm sont requis. PostgreSQL est facultatif en développement ; sans `DATABASE_URL`, les salons sont écrits atomiquement dans `runtime/rooms.json`.

```sh
cp -n .env.example .env
npm ci
npm run dev
```

Ouvrir <http://localhost:5174>. Vite sert l'interface et relaie Socket.IO vers le serveur sur le port 3101. Les variables locales de [`.env.example`](.env.example) sont `HOST`, `PORT`, `PUBLIC_ORIGIN` et, facultativement, `DATABASE_URL`. Ne mettez pas de secret dans ce fichier modèle ou dans le dépôt. Le fichier `.env` est ignoré par Git.

## Commandes courantes

```sh
npm run dev                 # serveur et Vite en parallèle
npm run build               # vérification TypeScript puis bundle web
npm run typecheck           # vérification TypeScript seule
npm test                    # tests unitaires moteur/serveur
npm run test:e2e            # parcours navigateur avec Playwright
npm run simulate -- 100     # simuler 100 parties complètes (1 à 10000)
npx tsx scripts/balance-economy.ts 100 progression-growth 20261006 1200
# comparaison économique reproductible, rapports locaux et graine fixée
npm run db:migrate          # appliquer les migrations SQL PostgreSQL
npm run start               # lancer le serveur et servir apps/web/dist
```

Les tests navigateur démarrent leur propre serveur isolé, sans base PostgreSQL ni salons enregistrés. Pour simuler le moteur sans navigateur ni serveur, `simulate` joue des parties complètes avec les trois niveaux d'IA et affiche le nombre de parties terminées, la durée moyenne, les insolvabilités, faillites et victoires. Cette simulation est aléatoire ; relancer la commande peut donner d'autres résultats.

## Configuration

| Variable | Usage |
| --- | --- |
| `HOST` | Adresse d'écoute du serveur (`127.0.0.1` par défaut ; `0.0.0.0` dans Compose). |
| `PORT` | Port du serveur HTTP et Socket.IO (3101 par défaut). |
| `PUBLIC_ORIGIN` | Origine autorisée pour les connexions Socket.IO depuis un navigateur. En production : `https://global-fund-next.213.199.40.67.sslip.io`. |
| `DATABASE_URL` | URL PostgreSQL facultative ; sa présence active le stockage Drizzle des salons. |
| `POSTGRES_PASSWORD` | Secret exigé par Compose pour son conteneur PostgreSQL ; à définir uniquement dans le `.env` local non versionné. |

En production, utiliser une base PostgreSQL dédiée `global_fund_next`, créée avec un compte applicatif séparé. Ne réutilisez ni la base ni les identifiants de la référence. `DATABASE_URL` contient un secret : donnez au fichier d'environnement système des droits `0600`, et choisissez pour Compose un mot de passe hexadécimal afin qu'il reste utilisable sans encodage dans une URL.

## Déploiement Linux

Le jeu est accessible à <https://global-fund-next.213.199.40.67.sslip.io>, via Nginx et le service systemd séparés sur le port local 3101. Ce déploiement réutilise l'infrastructure existante ; il ne requiert pas le redémarrage du service de référence.

L’installation effective de ce VPS est décrite dans [deploy/VPS_DEPLOYMENT.md](deploy/VPS_DEPLOYMENT.md). Les étapes ci-dessous décrivent une installation portable dans `/opt/`.

1. Installer Node.js 22.12+, npm, PostgreSQL et Nginx sur l'hôte. Créer l'utilisateur système `global-fund-next`, la base dédiée `global_fund_next` et son utilisateur SQL. Préparer `/opt/global-fund-next/current` avec les sources et dépendances npm, puis un lien `/opt/global-fund-next/current/runtime` vers un répertoire persistant appartenant à cet utilisateur.
2. Construire l'interface (`npm ci && npm run build`) et créer `/etc/global-fund-next/global-fund-next.env`, lisible uniquement par root et le service. Il doit définir `PUBLIC_ORIGIN=https://global-fund-next.213.199.40.67.sslip.io` et `DATABASE_URL=postgres://.../global_fund_next`. `HOST=127.0.0.1` et `PORT=3101` sont définis par l'unité. Garder les secrets hors du dépôt.
3. Installer [l'exemple systemd](deploy/global-fund-next.service.example) sous `/etc/systemd/system/global-fund-next.service`, puis charger et démarrer le service :

   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable --now global-fund-next
   sudo systemctl status global-fund-next
   ```

   L'unité applique les migrations au démarrage et relance le serveur en cas d'échec. Les journaux sont consultables avec `journalctl -u global-fund-next`.
4. Installer [l'exemple Nginx](deploy/nginx.conf.example), vérifier que le certificat TLS du nom prévu existe dans `/etc/letsencrypt/live/`, puis vérifier et recharger Nginx (`nginx -t && systemctl reload nginx`). Le bloc dédié relaie aussi les connexions WebSocket de `/socket.io/` vers le port 3101.

Les chemins d'installation et de certificat des exemples supposent cette disposition et peuvent être ajustés à l'hôte. L'exemple Nginx suppose que les certificats ACME sont déjà émis ; il ne les demande pas. Avant d'exposer le service, contrôler l'accès HTTPS à l'interface et à un salon avec un invité distant.

### Alternative Docker Compose

Un `compose.yaml` autonome fournit l'application et un PostgreSQL avec volume nommé, attente de disponibilité et port applicatif lié à `127.0.0.1:3101`. Aucun port PostgreSQL n'est publié sur l'hôte. Compose n'est pas le déploiement retenu pour le VPS ; Docker n'y est pas installé et ces fichiers n'y ont pas été exécutés.

Pour l'essayer sur une machine équipée de Docker Compose, créer un `.env` racine non versionné avec un mot de passe alphanumérique fort et une origine adaptée, par exemple :

```dotenv
POSTGRES_PASSWORD=remplacer-par-un-secret-hexadecimal
PUBLIC_ORIGIN=http://localhost:3101
```

Puis construire et lancer :

```sh
docker compose up --build -d
docker compose logs -f app
```

Le volume `global_fund_next_pgdata` conserve PostgreSQL entre redémarrages. Une base persistante exige une sauvegarde externe ; supprimer ce volume détruit les données. Pour arrêter les services sans supprimer la base : `docker compose down`.

## Structure et documentation

- `apps/web` : React, Vite, PixiJS pour le plateau et ECharts pour les cours.
- `apps/server` : Fastify, Socket.IO, sessions et persistance.
- `packages/game-engine` : moteur métier indépendant de l'interface et du réseau.
- `packages/shared` : contrats et données partagés.
- [ARCHITECTURE.md](ARCHITECTURE.md), [DECISIONS.md](DECISIONS.md), [PROGRESS.md](PROGRESS.md), [ROADMAP.md](ROADMAP.md) : architecture, décisions et suivi.
- [ASSET_LICENSES.md](ASSET_LICENSES.md) : sources, licences et provenance des ressources locales.

## Aperçus de la scène livrée

[Accueil](docs/screenshots/accueil.png) · [Plateau](docs/screenshots/plateau.png) · [Contexte](docs/screenshots/contexte.png) · [Implantation](docs/screenshots/aeroport.png) · [Vol](docs/screenshots/vol.png) · [Analyse](docs/screenshots/analyse.png).
