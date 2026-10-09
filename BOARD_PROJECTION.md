# Plateau : caméra commune et présentation

Le plan logique reste à 1000 × 650. Les 52 cases suivent le périmètre 14 × 14 existant; les quatre coins ne sont jamais dupliqués. La carte mondiale et ses WebP/JPEG existants sont conservés.

`apps/web/src/board/BoardProjection.ts` est la source de coordonnées unique :

- `boardToScreen(x, y)` applique une homographie de caméra symétrique;
- `screenToBoard(x, y)` inverse exactement cette transformation;
- `boardCellAtScreen(x, y)` inverse la caméra puis trouve une case;
- `boardDepthScale(y)` donne l'échelle d'un objet dressé à cette profondeur;
- `boardMeshPositions(columns, rows)` applique la même caméra aux sommets du plan.

La largeur du rail arrière représente environ 90,5 % de celle du rail proche. La projection ne cisaille pas le plateau vers un côté. Les coordonnées de caméra sont séparées du déplacement et du zoom modérés de la scène complète; les interactions Pixi reviennent d'abord dans les coordonnées locales de cette scène.

## Surface et objets

Le matériau, le cadre, le rail, la carte, les 52 cases, leurs textes et les plaques des zones sont rendus dans une seule texture locale. Une grille de 29 × 19 sommets projette cette texture. Cette tessellation partage la caméra des pieds des objets; elle évite une transformation indépendante de chaque case, texte ou image.

La texture est régénérée après les changements de contenu imprimé, d’assets ou de qualité, jamais dans le ticker. Une empreinte des cases, cycle, résultat, sélection et plaques évite toute régénération due à une copie identique de snapshot. Le mesh reçoit la nouvelle texture avant de libérer l’ancienne. Le mode de mouvement réduit force également un rendu après mise à jour de la texture, même avec le ticker arrêté.

Les villes et pions réutilisent les sprites locaux. Leur silhouette reste dressée, leur pied est projeté et leur taille dépend de la profondeur. Ils partagent une couche Pixi `sortableChildren`, avec `zIndex` égal à la hauteur écran de leur pied. Les ombres de contact et surbrillances sont des polygones projetés sur le plan. Les arcs et effets ont leurs points projetés par la même caméra. Une tranche proche de neuf pixels et une ombre de table constituent la base physique sous la surface.

## Dé et déplacement

`BoardScene` reçoit `timeline` et `stage` de l'orchestrateur de présentation. La timeline contient le résultat autoritaire, l'acteur, les positions de départ/arrivée et les epochs `performance.now()` du dé et du mouvement. Le plateau ne déduit pas une nouvelle séquence des anciennes notices.

Le dé dure 1100 ms, puis le résultat reste visible 450 ms. Le pion se déplace à 155 ms par case, puis la présentation conserve une pause d'arrivée de 300 ms. Le mouvement lit l’epoch partagé, recalé une seule fois après le commit de l’étape. Les réveils anticipés du timer ne repoussent pas l’échéance. Une callback normale ne saute jamais plusieurs étapes; le mode réduit peut les résoudre instantanément après lecture. Le dernier visage du dé est toujours le résultat du serveur. Les préférences de mouvement réduit suppriment les mouvements visuels.

Les attributs `data-presentation-stage`, `data-dice-state` et `data-pawn-state` exposent l'état de présentation pour la validation de l'interface.

## Validation

`tests/board-projection.test.ts` vérifie l'inverse, les coins et ancrages cartographiques, l'identification des 52 cases, la convergence symétrique modérée, l'échelle selon la profondeur et la cohérence des sommets du mesh. Une validation par captures reste nécessaire pour vérifier lisibilité, composition et intégration des sprites à chaque taille d'écran.

## Formule et cadrage

Pour `t = (y - 25) / 590` et `d = 1,105 - 0,105 × t` :

```text
x écran = 500 + (x - 500) × 0,98 / d
y écran = 70 + 510 × t / d
échelle d'un objet dressé = 1 / d
```

L’inverse sert au survol et à la sélection. La caméra de scène translate/zoome ensuite l’ensemble, avec une échelle de base `min(largeur / 1060, max(180, hauteur - 24) / 550)`. Les insets de la zone centrale réservent l’espace du HUD, de la console et du dock; aucune transformation CSS supplémentaire n’est appliquée au plateau.

Pendant le résultat du dé, le parcours et l'arrivée, la caméra suit le pion actif avec un zoom de 1,22 et un recentrage progressif. Le rail opposé peut sortir du champ ; les 52 cases restent dans la scène. La vue globale revient à l'échelle de base. Le focus de zone utilise 1,10 et Crash un recul bref à 0,93. Les mouvements réduits désactivent le suivi automatique. Ce cadrage utilise la même transformation que les objets et les interactions.
