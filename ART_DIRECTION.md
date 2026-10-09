# Global Fund — direction artistique de la scène jouable

## Terminal et places — 7 octobre 2026

Cinq identités de bureau stables : Manhattan, Canary Wharf, Victoria Harbour, Dubaï et Sydney. Skylines photographiques licenciées locales, verre vertical, intérieur commun et lumière nocturne ; la ville reste lisible indépendamment du niveau de fortune. Le bureau appartient à l'humain du client et change avec un fondu de 500 ms après son voyage.

Le terminal privilégie le cours et la rentabilité de sa propre position. Cours/PRU/P-L/parts/valeur restent fixés au-dessus du graphique et du ticket ; la liste se recherche et se trie. CAP est un repère de taille sobre. Les cartes laptop ont une illustration latérale, un résumé économique et des conditions visibles ; le récit complet se déplie sans pousser le bouton Continuer hors écran.

La caméra suit le pion à zoom 1,22 pendant son parcours et l'arrivée ; les rails éloignés peuvent quitter le cadre. La vue globale reste accessible et le mode réduit désactive le suivi automatique. Les variations importantes se présentent quatre secondes, avec une reprise manuelle possible, afin de laisser lire cash, valeur et positions concernées.

## Intention

Le joueur est assis devant une table de stratégie financière dans un bureau nocturne. Le plateau est le monde du jeu ; les commandes sont des instruments posés autour de cette table. Références : les quatre images de `samples/`, particulièrement B82F pour la scène, FC7E pour le terminal et 95365 pour les cartes.

## Composition

- Scène plein écran, sans défilement sur desktop. Le plateau occupe la majorité de la surface utile. Aucun en-tête de site, aucune colonne de cartes administratives.
- Premier plan : table sombre, contour métallique, 52 plaques, carte terrestre en relief et figurines. Projection par une homographie commune, symétrique et modérée : rail arrière environ 10 % plus étroit, sans cisaillement. Carte, cases et plaques appartiennent au même plan. Pieds et ombres des pions sont projetés par cette caméra ; leur silhouette reste verticale et leur taille varie légèrement avec la profondeur. Voir BOARD_PROJECTION.md.
- HUD supérieur fin : marque, cycle, phase, connexion, réglages. Rail économique compact en haut du plateau. Dock des six fonds en bas ; liquidités et valeur de chaque fonds toujours lisibles.
- Console du fonds actif et bouton d'action près du bord droit. Portefeuille et marché sont des fenêtres flottantes ouvrables au clavier et par boutons, sans quitter la scène.
- Caméra amortie : vue globale, suivi de la case active, focus géographique au marché, recul lors d'un Crash. Limiter le zoom pour conserver les repères.

## Palette et matières

| Usage | Teinte | Matière / lumière |
| --- | --- | --- |
| Fond | `#03080f`, `#081522` | Nuit, verre fumé, bureaux en profondeur |
| Plateau | `#101c29`, `#183144` | Métal brossé, carbone, mer profonde |
| Or | `#d8b879`, `#f0d8a0` | Laiton satiné, éclat sur les arêtes |
| Texte | `#f1eadb`, `#a9bdc9` | Blanc cassé, données secondaires plus froides |
| Hausse | `#42d9a3` | Émeraude, flèches et signe + en plus de la couleur |
| Baisse | `#ed727b` | Rouge sombre, flèches et signe − |
| Information | `#70bce6` | Bleu institutionnel |

Éviter les grands dégradés multicolores et les halos omniprésents. Les reflets servent à montrer les matières, les ombres à séparer les plans.

## Typographie

Titres institutionnels avec une police à empattements libre, données avec une sans-serif lisible et chiffres tabulaires. Polices hébergées localement et licences conservées. Montants et cours prioritaires, titres courts, libellés français. Taille minimale raisonnable pour les données essentielles ; les semaines du plateau peuvent rester petites mais accessibles par survol et description HTML.

## Objets et carte

Six identités : lion doré, taureau bleu, feuille émeraude, cristal violet, globe argenté et tour rouge. Sprites de figurines en volume, socle métallique et ombre séparée. Aucun mélange entre un pion aplati par la projection et un plateau incliné.

Carte : géographie réelle, relief discret, villes illuminées et routes courbes. Les **zones du moteur validé restent Amériques, Europe, Asie, Afrique/Moyen-Orient et Océanie**. Les maquettes regroupent différemment les continents ; leur style est repris sans redistribuer les 91 entreprises ou modifier les sauvegardes. Une nouvelle nomenclature économique nécessiterait une migration métier distincte.

## Fenêtres et HUD

Angles légèrement chanfreinés, cadres fins métalliques, séparateurs gravés, surfaces presque opaques derrière les chiffres. Fenêtres positionnées au-dessus du monde ; le plateau reste visible sur leurs bords. Le terminal conserve les vrais composants HTML, graphiques ECharts et contrôles accessibles.

Les notes sont des instruments gradués A/B/C/D/E avec état textuel et lumière de niveau. C/C garanti et A/A monopole reçoivent une récompense dorée ; aucun bonus fictif.

## Animation

| Moment | Mise en scène | Budget indicatif |
| --- | --- | --- |
| Dé | Rotation, rebond, résultat net puis mouvement | 1 100 ms + pause de résultat de 450 ms |
| Pion | Avance de case en case, ombre et arrivée amortie | 140–180 ms / case |
| Caméra | Interpolation douce, faible amplitude | 400–700 ms |
| Voyage | Arc pointillé, trace lumineuse qui disparaît | 1,1–1,8 s |
| Transaction | Confirmation après état serveur, montant et participation | 1,5–2 s |
| Contexte | Assombrissement, illustration, récit puis impacts | Entrée 200 ms ; lecture libre ; après Continuer, notes successives de 250 ms puis cours et fonds |
| Bull / Bear | Pulsation positive ou tension baissière, signal net | 1–1,5 s |
| Crash | Recul, flash mesuré, courbe descendante, pertes | < 3 s, accélérable |

Les fenêtres de résultat attendent la fin des déplacements. L'option réduire les animations et `prefers-reduced-motion` suppriment les mouvements de caméra et les effets intenses. Les conséquences restent identiques et lisibles.

## Audio et qualité

Effets courts issus de ressources libres locales : dé, pas, ordre, gains/pertes, cartes, voyage, marché et justice. Son désactivé par défaut ; activation sur geste utilisateur. Canaux général, musique, ambiance, effets. Aucun son ne remplace une information visuelle.

Niveaux graphique haut/moyen/bas : nombre de particules, résolution, mouvement ambiant. Mise en pause hors onglet et réduction d'animation. Mesurer les images/seconde en conditions de test ; ne pas déclarer 60 FPS sur la seule foi d'un build.

## Validation

Captures automatiques de menu, salon, scène, terminal, contexte, Crash et prison. Vérification à 1920×1080, 1440×900 et 1366×768. La scène doit être immédiatement identifiable comme un jeu financier ; le moteur, le protocole, les fichiers de sauvegarde et les règles restent indépendants de cette présentation.

## Itération plateau — 6 octobre 2026

Une seule surface centrale accueille voyage, terminaux et cartes. Zones, secteurs, fonds et accès au salon restent autour. La consultation d’un marché est libre pendant l’implantation et conserve le choix de destination. Les fenêtres entrent en 200 ms ; leur contenu défile à l’intérieur sans masquer les actions.

Le récit précède les conséquences : les valeurs serveur sont conservées dans un état de présentation détaché pendant la lecture. Continuer ferme la carte, révèle chaque changement de note réel, les cours, puis les fonds. Le dé s’immobilise 450 ms avant le premier pas. Les événements de case ne créent aucune modification de note supplémentaire.

La couronne signifie uniquement 5/5 et revenu minimum C/C. Un réseau de sociétés signifie monopole et minimum A/A, seulement lorsque toutes les entreprises du groupe sont intégralement détenues. Les groupes incomplets montrent leur progression sans afficher un bonus obtenu.
