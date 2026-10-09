# Progression — 4 octobre 2026

## Réalisé

### Étape A — Diagnostic et isolation

- Référence analysée en lecture seule ; classification des composants dans MIGRATION_ANALYSIS.md.
- Projet autonome `/home/codex/projects/global-fund-next`, monorepo npm initialisé, TypeScript strict, contrats partagés.
- Architecture, décisions, roadmap, règles et provenance des ressources documentées.
- Contrôle final : **157 fichiers de référence inchangés**, configuration Nginx et unité systemd de la référence inchangées ; son service conserve son processus et répond en HTTPS.

### Étape B — Moteur et scène jouable

- Noyau métier extrait localement, façade TypeScript indépendante de React/Pixi/réseau, simulateur CLI de 1 à 10 000 parties.
- 52 cases, 50 Événements distincts des 100 Contextes, implantation avant dé, ouverture gratuite à C/C, monopoles complets et performance de tour à Départ.
- Salons mixtes de 2 à 6 places, humains locaux/distants, nationalités, pions, niveaux d'IA, état prêt, invitations, chat et reprise de session.
- Plateau Pixi avec carte Natural Earth, textures libres, pions sectoriels et géographiques, lancer de dé, progression, vols et effets de marché.
- Terminal React : trading, portefeuille, prix moyen, parts disponibles, protections C/C, monopoles A/A, diversification et historiques réels des entreprises, fonds, zones et secteurs.
- Contextes, Événements et paiements mis en scène ; carrousel de toutes les sociétés impactées, molette/tactile, focus clavier et effets différés après les déplacements.
- Audio facultatif : volumes, son CC0 et signaux de jeu ; architecture prête pour musique et ambiance.

### Étape C — Fiabilité et déploiement indépendant

- Commandes autoritaires : sessions, validation stricte, révisions, idempotence, sauvegarde avant diffusion et refus atomiques.
- Persistance Drizzle/PostgreSQL dédiée ; reprise des IA après redémarrage. Adaptateur fichier atomique et sérialisé pour le développement.
- **36 tests unitaires et d'intégration** : 29 moteur, 7 serveur. **3 scénarios Playwright** : local, deux clients distants avec transaction/rechargement, tablette. Les parcours contrôlent aussi les erreurs de console.
- Construction TypeScript/Vite réussie ; audit npm sans vulnérabilité signalée au moment de la vérification.
- Trois simulations supplémentaires terminées : 702 commandes légales, moyenne 20 cycles, 7,58 s. Ce petit échantillon vérifie l'exécution ; il ne constitue pas une validation de l'équilibrage.
- Déploiement HTTPS sur `https://global-fund-next.213.199.40.67.sslip.io`, service `global-fund-next.service`, port 3101 et base `global_fund_next`.
- Achat réel via WebSocket HTTPS conservé après redémarrage du service : liquidités, nombre de parts et prix moyen retrouvés depuis PostgreSQL.
- Vérification en HTTPS dans Chromium : Contexte collectif au cycle 2, aéroport avant dé, vol visible avant la fenêtre, destination renseignée, carrousel à la molette et graphiques ; aucune erreur de console.
- Exemples Docker Compose fournis ; non exécutés car Docker est absent du VPS.

## En cours

- Première scène intégrée et vérifiée ; aucune étape nécessaire à cette livraison ne reste en cours.
- La suite est décrite dans ROADMAP.md.

## Reste à faire

- Typage progressif complet du noyau JavaScript extrait et injection de l'aléatoire reproductible.
- Campagnes d'équilibrage 100 / 1 000 / 10 000 parties et comparaison des stratégies.
- Audits sur plusieurs navigateurs et laptops réels, mesures de charge et budgets de rendu ; aucune promesse de 60 FPS universels.
- Figurines et illustrations spécifiques enrichies, logos après vérification des droits, musique/ambiance, onboarding.
- Sauvegardes PostgreSQL automatisées, restauration, diagnostics et observabilité ; reprise avancée avec comptes si nécessaire.

## Problèmes identifiés et décisions

- Contradiction d'ordre du tour résolue par confirmation de l'utilisateur : implantation avant dé.
- Anciennes parties incompatibles avec le nouveau parcours/règles : aucun import automatique.
- Rendu logiciel de Chromium et captures répétées coûteux : traces de tests sans screencast ; plateau en pause hors écran et rendu ponctuel en mode animations réduites. Le contrôle du ticker attend l'initialisation asynchrone de Pixi.
- Logos non transférés sans licence vérifiée. Les sprites libres sont dérivés d'un même modèle de pion ; les sculptures du plateau différencient leurs identités.

## Prochain objectif

Évaluer cette première scène avec des joueurs, puis mener l'étape D de ROADMAP.md : aléatoire reproductible, simulations et équilibrage, avant les finitions commerciales.
