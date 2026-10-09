# Audit P4 des entreprises — Asie, Afrique & Moyen-Orient, Océanie

Audit documentaire du 6 octobre 2026 sur 32 lignes de `packages/game-engine/legacy/data/gameData.json` : 17 Asie, 6 Afrique & Moyen-Orient et 9 Océanie. Ce rapport a été relevé sur v1 avant intégration. Les recommandations retenues sont maintenant intégrées dans le catalogue v2; les 91 IDs et toutes les valeurs de base restent identiques.

Les sources officielles ont été ouvertes ou recherchées avec leur contenu dans l’outil web. Chaque entrée du [rapport JSON](company-audit-world.json) comprend une courte preuve, une date et un statut. Quand l’ouverture directe a échoué, le rapport le signale explicitement et baisse le niveau de confiance; l’extrait officiel indexé ne remplace pas une vérification directe.

## Trois remplacements proposés en Asie

Les remplacements gardent les mêmes IDs et valeurs de prix/revenu dans la proposition. Ils changent les noms, pays et secteurs; ils ont été intégrés au catalogue v2 en conservant les IDs.

| ID conservé | Avant (pays, secteur, prix/revenu de base) | Après proposé (pays, secteur, prix/revenu de base) |
|---|---|---|
| `gazprom` | Gazprom (Russie, `energy`, 100 / 50) | Mitsubishi Heavy Industries (Japon, `industry`, 100 / 50) |
| `china-construction-bank-corp` | China Construction Bank Corp (Chine, `realestate`, 210 / 50) | Komatsu Ltd. (Japon, `industry`, 210 / 50) |
| `astra-international` | Astra International (Indonésie, `transport`, 30 / 10) | FANUC Corporation (Japon, `industry`, 30 / 10) |

MHI, Komatsu et FANUC sont confirmés par leurs profils d’entreprise officiels. Daikin et Hitachi restent deux candidats de rechange dans le JSON. Les pages Gazprom et CCB n’ont pas pu être ouvertes directement: leurs fiches le notent comme non vérifié directement et fournissent les extraits officiels consultés pour les lignes avant remplacement. La ligne Gazprom n’est pas recommandée pour Europe.

## Remplacements proposés en Océanie

| ID conservé | Secteur | Nom proposé | Pays | Motif |
|---|---|---|---|---|
| `pacifica-minerals` | `agrifood` | Woolworths Group Limited | Australie | Commerce alimentaire; cohérent avec Agroalimentaire. |
| `southern-cross-energy` | `energy` | Origin Energy | Australie | Énergie, gaz, solaire et renouvelables. |
| `coral-reef-health` | `health` | CSL Limited | Australie | Biotechnologie, médicaments et vaccins. |
| `pacific-link` | `media` | Telstra Group | Australie | Télécommunications. |
| `harbour-infrastructure` | `realestate` | Goodman Group | Australie | Immobilier logistique et centres de données. |
| `oceanic-air` | `transport` | Qantas Airways | Australie | Transport aérien de passagers et fret. |
| `southpoint-finance` | `finance` | Commonwealth Bank of Australia | Australie | Banque. |
| `reef-data-systems` | `technology` | WiseTech Global Limited | Australie | Logiciels de logistique; siège/opérations australiens. Atlassian est écartée car son parent a adopté une incorporation au Delaware en 2022 (SEC). |
| `austral-manufacturing` | `industry` | Fortescue | Australie | Mines et métaux; secteur Industrie. |

## Logos

Deux SVG ont été téléchargés depuis Wikimedia Commons et copiés dans les deux dossiers d’assets demandés : MHI (`gazprom.svg`, pour le remplacement proposé de la ligne `gazprom`) et Telstra (`pacific-link.svg`, pour le remplacement proposé de `pacific-link`). Les pages de fichier donnent provenance officielle et statut PD-textlogo; elles précisent aussi que les marques peuvent rester protégées. Cette licence de droit d’auteur ne constitue pas une autorisation de marque. Les métadonnées complètes et les URLs figurent sous `assetPolicy.files` dans le JSON.

Ces logos correspondent aux noms actuels du catalogue v2, appliqués aux slots historiques `gazprom` (MHI) et `pacific-link` (Telstra). Le monogramme reste le fallback pour les autres IDs.

## Limites

L’audit documente les sources et recommandations, sans changer les 91 lignes de données. Certains sites d’entreprise bloquent l’ouverture directe via l’outil web; leurs fiches indiquent alors `direct_access_unavailable_search_excerpt_only`, `sourceVerified: false` et une confiance moyenne. Ces cas doivent être ouverts manuellement avant toute intégration définitive.
