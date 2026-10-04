# Global Fund Next

Nouvelle application autonome de Global Fund. Le projet de référence reste séparé : Next ne partage ni son code d'exécution, ni ses salons, ni sa base. L'application est en français et utilise ses ressources graphiques locales ; leur provenance et leurs licences figurent dans [ASSET_LICENSES.md](ASSET_LICENSES.md).

## Première tranche jouable

- Ouvrir un salon de 2 à 6 fonds, avec des personnes sur le même écran, des invités distants ou des IA de trois niveaux. Les salons proposent un code/lien d'invitation, un état « prêt », la reprise de session et un chat.
- Jouer sur un plateau de 52 cases avec 91 sociétés, neuf secteurs, cinq zones économiques, 100 cartes Contexte et 50 Événements. Le cycle d'ouverture place gratuitement chaque fonds sur le marché de sa nationalité, à indices C/C. À partir du cycle 2, une carte Contexte commune est tirée puis chaque fonds choisit son implantation **avant le dé** : rester ne coûte rien, changer de zone coûte 1 M€.
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

Les dés de départ sont tirés par le serveur et leurs résultats sont affichés ; le plus haut commence. Le premier investisseur tourne à chaque cycle. L'ouverture est le cycle 1, sans Contexte : les cent Contextes sont joués du cycle 2 au cycle 101.

À chaque tour, dès le cycle 2 :

1. Choisir de rester gratuitement ou de voyager pour 1 M€, dans la scène d'aéroport.
2. Lancer le dé et parcourir les cases sectorielles.
3. Résoudre la case et lire les conséquences après l'animation.
4. Acheter ou vendre dans sa zone, puis passer la main.

Sur une case sectorielle, le joueur actif paie les autres détenteurs au prorata des parts ; la banque lui verse les revenus de ses propres participations. Les détenus ne perçoivent pas de revenus : ceux qui leur étaient dus vont à la banque. Une société contrôlée à 5/5 garantit au moins le revenu C/C ; le contrôle intégral de toutes les entreprises d'un groupe zone/secteur garantit A/A.

Le **Contexte** est collectif et modifie les notes, cours, revenus et valorisations. Il n'envoie pas directement en prison et n'impose pas de vente. Un **Événement**, tiré sur sa case, concerne surtout le joueur actif : dividende, amende, financement, vente imposée ou enquête. Il ne modifie pas les notes. Bull, Bear et Crash modifient directement le marché.

Une enquête ciblant une entreprise n'emprisonne que le joueur qui en détient des parts. La détention suspend ses échanges et revenus ; les participations continuent à être valorisées. Le procès commence au tour suivant : sortie sur 6 au premier procès, sur 5 ou 6 au deuxième, puis sortie forcée pour 5 M€ au troisième selon le mécanisme conservé.

En cas de **faillite E/E**, les parts sont remboursées au cours E/E : `base / 5 × 0,50 × 0,50`. Elles sont retirées des portefeuilles et l'entreprise ferme temporairement. Dès qu'au moins une note s'améliore, ses cinq parts redeviennent disponibles. Les protections de revenu C/C et A/A ne bloquent pas cette liquidation.

Une dette peut imposer la vente de titres. Un fonds incapable de la régler après liquidation de ses positions devient insolvable. La partie finit après le cycle de la 100e carte Contexte ou lorsqu'un seul fonds reste solvable ; la plus grande valeur du fonds gagne.

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
