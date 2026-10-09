# Progression — 7 octobre 2026

Itération UX, terminal et économie dans **Global Fund Next**. La référence historique reste en lecture seule. État précédent : [progress-2026-10-06.md](docs/progress-2026-10-06.md).

## ENGINE

**Réalisé** : modèle explicite `startingMarket` / `currentMarket`, adaptation des anciennes nationalités sans modifier leurs entreprises incorporées ; cinq IDs validés strictement. Catalogue de 91 IDs, deux acteurs immobiliers cotés ajoutés par remplacement (SHKP en Asie, Emaar en Afrique & Moyen-Orient), capitalisations approximatives sourcées et classes GF Small/Medium/Large. Cent récits macro Contexte et cinquante récits Événement fictifs conservent leurs effets.

**Validation** : 420 parties complètes archivées dans les comparaisons, dont 100 finales sans erreur. Grille v3 : Small 5–20 / Medium 36–90 / Large 110–300 M€ par part C/C, rendements de secteur 10/12/14 %. Small représente 78,12 % des parts acquises au début ; Large devient abordable après réserve IA dans 58 parties et est achetée dans 25, premier cycle médian 28. Trois achats précoces aux cycles 6–7 sont des opportunités à indices dégradés, explicitement conservées dans l’analyse. Revenus sectoriels 95,20 M€/fonds dont banque 37,37, comparés à 208,98/85,42 dans la référence corrigée. Rapports, NAV des survivants et limites : [ECONOMY_BALANCING.md](ECONOMY_BALANCING.md).

**Reste** : essais humains et autres compositions de fonds. Les 100 finales couvrent trois IA ; les positions Medium ne progressent pas régulièrement, et 193/300 fonds sont insolvables. Ce dernier total dépend aussi de la condition de fin : 92 parties se terminent lorsqu'un seul des trois fonds reste solvable. Il ne mesure donc pas, à lui seul, le risque d'insolvabilité par tour. La grille est une première base mesurée, appliquée aux nouvelles parties uniquement.

## NETWORK

**Réalisé** : serveur autoritaire, commandes, droits, révisions, PostgreSQL, reconnexion et salons privés conservés. Le serveur valide la place des humains, répartit les IA puis recopie leur départ au lancement. Les sauvegardes antérieures gardent leur catalogue et leur économie.

**Validation** : les douze parcours navigateur passent, avec jeu local, distant et reconnexion. Le seul service Next a été redémarré ; HTTPS `/health` et les deux services sont actifs.

**Reste** : tests de charge et comptes publics, hors de cette itération.

## GAMEPLAY

**Réalisé** : implantation avant le dé, ouverture gratuite C/C sans Contexte, moteur et règles de liquidation/prison/contrôle/monopole conservés. FSM de présentation séparée de l'autorité serveur. Les impacts majeurs durent quatre secondes, avec avance manuelle possible via Reprendre la séance ; les petits impacts durent 650 ms. Le mode réduit conserve le temps de lecture. La caméra suit le déplacement sans exiger que tout le rail soit toujours visible.

**Validation** : normal/hard ne choisissent plus des destinations uniquement à partir de titres hors budget ; le filtre conserve leurs réserves et déduit le voyage. Onze tests ciblés passent ; la formule de qualité et le comportement easy sont conservés.

**Reste** : essais humains d'équilibrage au-delà des comportements IA mesurés.

## GRAPHICS

**Réalisé** : plateau de 52 cases en projection commune, figurines premium ancrées, suivi caméra à 1,22, cinq bureaux New York/Londres/Hong Kong/Dubaï/Sydney avec skylines locales licenciées, préchargement et fondu après voyage. Les tours distants/IA et l'inspection d'un autre fonds ne remplacent pas la ville du client. Cartes compactes illustration/récit/effets, texte complet disponible. Vingt logos locaux audités, 71 monogrammes.

**Validation** : 57 captures documentées, dont 39 vues aux trois résolutions, deux écrans de choix initial, les cinq bureaux à deux résolutions, cinq phases animées et un mode réduit. Les treize alias attendus sont présents. Revue visuelle effectuée face aux maquettes ; aucun débordement horizontal ni erreur navigateur dans les captures. L'archive de référence de 39 PNG reste dans `baseline/ux-economy-2026-10-06/`. Les versions utilisées et les contrôles sont consignés dans [VISUAL_VALIDATION.md](docs/VISUAL_VALIDATION.md).

**Performances et limite** : après quinze secondes de préchauffage, Chromium/SwiftShader mesure 10 FPS navigateur et 8 FPS plateau en mode normal. En qualité basse avec animations réduites : 60 FPS navigateur, avec ticker du plateau volontairement arrêté. Les captures de phases utilisent une horloge contrôlée et ne constituent pas un benchmark. La cible de 60 FPS sur GPU réel reste à vérifier.

## AUDIO

**Réalisé** : effets Kenney CC0 locaux, feedback des ordres/notes/dé/mouvements, réglages et mute conservés ; audio facultatif. Les crédits des villes et logos sont disponibles dans les mentions locales.

**Reste** : musique et ambiance en boucle, aucune nouvelle piste promise.

## UX

**Réalisé** : création en deux étapes, choix graphique des cinq marchés, IA diversifiées, retour sans perte de configuration ; terminal avec recherche instantanée, sept tris accessibles, filtres de taille, PRU/P-L %/parts/valeur de position fixes et ticket direct quantité+acheter/vendre. P/L inconnu affiché par un tiret. Consultation avant voyage, portefeuille/analyse/statistiques et salon restent disponibles.

**Validation** : douze scénarios navigateur passent, dont quatre nouveaux pour les places, les bureaux et les tris. La revue des captures laptop a révélé des colonnes hors champ, des groupes masquant les positions et un carrousel Contexte trop bas ; ces trois défauts sont corrigés. Un scénario ciblé confirme les sept colonnes visibles sans défilement horizontal. Les gardes de capture confirment la sélection de positions, le motif d'un ordre désactivé et les notes/cours avant-après du Contexte visibles à 1366×768.

**Reste** : tests utilisateurs tablettes/téléphones et multi-navigateurs.

## Vérification finale

- `npm test` : **101/101** après intégration des marchés, prix, IA, tris et lectures d’impacts ; TypeScript et build production passent.
- Tests navigateur : **12/12**, puis **1/1 ciblé** après la correction visuelle laptop, complétés par les gardes des captures. Build final publié le 7 octobre à 09:31 (Europe/Paris) ; contrôle TypeScript final réussi. Les cinq phases et les mesures de performances sont terminées ; les 57 fichiers référencés existent.
- Une revue indépendante n'a trouvé aucun défaut du modèle/serveur ; deux écarts DOM/sélecteurs de setup ont été corrigés.
- Première mesure économique corrigée : l'ancien total de paiements incluait les apports de performance ; les nouveaux rapports distinguent explicitement les flux.
- Intégrité revérifiée le 7 octobre : **157 fichiers historiques et deux configurations d'infrastructure inchangés**.

## Prochain objectif

Faire tester cette version par des humains avec différentes compositions de fonds, puis mesurer le plateau sur un ordinateur équipé d'un GPU. Les prix v3, le modèle des marchés et les corrections du terminal et des cartes sont publiés. Les sauvegardes antérieures conservent leurs prix ; démarrer une nouvelle partie pour tester la grille v3.
