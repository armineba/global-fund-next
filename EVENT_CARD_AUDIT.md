# Audit des cartes Événement

Audit recalculé le 7 octobre 2026 depuis le catalogue courant : **91 sociétés, 50 cartes Événement et 100 cartes Contexte**.

## Méthode

- Les 50 identifiants, effets, montants, quantités et secteurs cibles restent inchangés. Chaque récit Événement est fictif et utilise le jeton {company} plutôt qu’un nom réel.
- Le moteur privilégie une société détenue par le joueur actif, puis une société déjà détenue, puis toute société disponible du pool. Les répartitions ci-dessous décrivent les possibilités de ciblage, pas les probabilités réelles.
- Les 100 descriptions Contexte sont **appliquées** dans packages/game-engine/legacy/data/gameData.json; leurs changements d’indices sont ceux du catalogue courant.

## Catégories de capitalisation

Catégories lues depuis capCategory, selon les seuils Global Fund de 40 Md USD et 200 Md USD.

| Catégorie | Seuil Global Fund | Sociétés |
|---|---:|---:|
| Small | moins de 40 Md USD | 20 |
| Medium | de 40 à moins de 200 Md USD | 31 |
| Large | 200 Md USD ou plus | 40 |

## Répartition des effets

| Effet moteur | Nombre |
|---|---:|---:|
| buyback | 6 |
| cash | 8 |
| dividend | 8 |
| fine | 8 |
| forcedSale | 6 |
| marginCall | 5 |
| prison | 4 |
| regulation | 5 |

## Couverture des secteurs et zones

Chaque entrée de Pool S / M / L donne le nombre de sociétés admissibles pour une carte de ce secteur. Tous secteurs couvre le catalogue entier.

| Secteur ciblé | Cartes | Pool S / M / L | Sociétés | Zones présentes |
|---|---:|---:|---:|---|
| Technologie | 5 | 1 / 0 / 12 | 13 | Europe, Asie, Amériques, Océanie |
| Finance | 6 | 2 / 3 / 9 | 14 | Asie, Afrique & Moyen-Orient, Amériques, Europe, Océanie |
| Industrie | 5 | 2 / 7 / 5 | 14 | Asie, Europe, Amériques, Océanie |
| Santé | 4 | 0 / 5 / 4 | 9 | Europe, Amériques, Océanie |
| Énergie | 6 | 3 / 4 / 4 | 11 | Amériques, Afrique & Moyen-Orient, Europe, Asie, Océanie |
| Immobilier & infrastructures | 5 | 4 / 0 / 0 | 4 | Afrique & Moyen-Orient, Asie, Océanie |
| Agroalimentaire & ressources | 4 | 1 / 7 / 4 | 12 | Amériques, Europe, Océanie |
| Communication & médias | 3 | 4 / 3 / 1 | 8 | Afrique & Moyen-Orient, Amériques, Europe, Asie, Océanie |
| Transports & logistique | 5 | 3 / 2 / 1 | 6 | Asie, Amériques, Europe, Océanie |
| Tous secteurs | 7 | 20 / 31 / 40 | 91 | Amériques, Europe, Asie, Afrique & Moyen-Orient, Océanie |

### Occurrences théoriques dans les pools des 50 cartes

Les pools cumulent **1080 occurrences société-carte**. Une même société compte une fois par carte dont elle est candidate. Small / Medium / Large et les zones reflètent le catalogue actuel; la détention par les joueurs peut modifier les tirages réels.

| Taille | Occurrences | Part |
|---|---:|---:|
| Small | 236 | 21.9 % |
| Medium | 361 | 33.4 % |
| Large | 483 | 44.7 % |

| Zone | Occurrences pool | Small / Medium / Large |
|---|---:|---:|
| Amériques | 415 | 26 / 146 / 243 |
| Europe | 281 | 22 / 128 / 131 |
| Asie | 208 | 36 / 63 / 109 |
| Afrique & Moyen-Orient | 70 | 70 / 0 / 0 |
| Océanie | 106 | 82 / 24 / 0 |

Les récits citent explicitement **0 noms de société en dur**; les 50 utilisent un emplacement dynamique. Dans le JSON, chaque société a explicitCompanyMentions à zéro et targetPoolOccurrences indique combien de pools incluent la société.

### Contrôle des remplacements de catalogue

| ID catalogue conservé | Nom courant | Secteur | Zone | Catégorie |
|---|---|---|---|---|
| agricultural-bank-of-china | Sun Hung Kai Properties Limited | Immobilier & infrastructures | Asie | Small |
| industries-qatar | Emaar Properties PJSC | Immobilier & infrastructures | Afrique & Moyen-Orient | Small |

## Audit carte par carte

| ID | Titre | Catégorie narrative | Cible : secteur, zones et pool S / M / L | Effet | Intensité |
|---|---|---|---|---|---|
| board-01 | Contrat public inattendu | Opportunité / financement | Tous secteurs; 91 sociétés (20/31/40); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | cash | modérée |
| board-02 | Prime de fidélité bancaire | Finance / distributions | Finance; 14 sociétés (2/3/9); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | dividend | modérée |
| board-03 | Rachat stratégique | Consolidation / OPA | Industrie; 14 sociétés (2/7/5); Amériques, Asie, Europe, Océanie | buyback | forte |
| board-04 | Crédit d’innovation | Opportunité / financement | Tous secteurs; 91 sociétés (20/31/40); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | cash | faible |
| board-05 | Dividende exceptionnel | Finance / distributions | Énergie; 11 sociétés (3/4/4); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | dividend | forte |
| board-06 | Commande humanitaire | Opportunité / financement | Tous secteurs; 91 sociétés (20/31/40); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | cash | forte |
| board-07 | Offre de retrait | Consolidation / OPA | Immobilier & infrastructures; 4 sociétés (4/0/0); Afrique & Moyen-Orient, Asie, Océanie | buyback | modérée |
| board-08 | Brevet décisif | Finance / distributions | Technologie; 13 sociétés (1/0/12); Amériques, Asie, Europe, Océanie | dividend | modérée |
| board-09 | Amende de conformité | Risque / sanction | Tous secteurs; 91 sociétés (20/31/40); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | fine | modérée |
| board-10 | Rappel de sécurité | Risque / sanction | Industrie; 14 sociétés (2/7/5); Amériques, Asie, Europe, Océanie | fine | forte |
| board-11 | Taxe carbone accélérée | Risque / sanction | Énergie; 11 sociétés (3/4/4); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | fine | faible |
| board-12 | Frais de restructuration | Risque / sanction | Tous secteurs; 91 sociétés (20/31/40); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | fine | modérée |
| board-13 | Vente réglementaire | Réallocation / vente | Finance; 14 sociétés (2/3/9); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | forcedSale | faible |
| board-14 | Désengagement d’un assureur | Réallocation / vente | Santé; 9 sociétés (0/5/4); Amériques, Europe, Océanie | forcedSale | modérée |
| board-15 | Audit des participations croisées | Réallocation / vente | Technologie; 13 sociétés (1/0/12); Amériques, Asie, Europe, Océanie | forcedSale | forte |
| board-16 | Liquidité sous surveillance | Réallocation / vente | Immobilier & infrastructures; 4 sociétés (4/0/0); Afrique & Moyen-Orient, Asie, Océanie | forcedSale | modérée |
| board-17 | Garantie de rachat | Consolidation / OPA | Transports & logistique; 6 sociétés (3/2/1); Amériques, Asie, Europe, Océanie | buyback | modérée |
| board-18 | Appel de marge | Tension / liquidité | Finance; 14 sociétés (2/3/9); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | marginCall | forte |
| board-19 | Collatéral déprécié | Tension / liquidité | Énergie; 11 sociétés (3/4/4); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | marginCall | modérée |
| board-20 | Risque de change | Tension / liquidité | Agroalimentaire & ressources; 12 sociétés (1/7/4); Amériques, Europe, Océanie | marginCall | faible |
| board-21 | Convocation judiciaire | Justice / contrôle interne | Tous secteurs; 91 sociétés (20/31/40); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | prison | faible |
| board-22 | Soupçon de délit d’initié | Justice / contrôle interne | Finance; 14 sociétés (2/3/9); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | prison | modérée |
| board-23 | Saisie préventive | Justice / contrôle interne | Tous secteurs; 91 sociétés (20/31/40); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | prison | forte |
| board-24 | Plafond de détention | Concurrence / régulation | Communication & médias; 8 sociétés (4/3/1); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | regulation | faible |
| board-25 | Accès équitable au réseau | Concurrence / régulation | Transports & logistique; 6 sociétés (3/2/1); Amériques, Asie, Europe, Océanie | regulation | modérée |
| board-26 | Fin du privilège exclusif | Concurrence / régulation | Santé; 9 sociétés (0/5/4); Amériques, Europe, Océanie | regulation | forte |
| board-27 | Indemnité de livraison | Opportunité / financement | Transports & logistique; 6 sociétés (3/2/1); Amériques, Asie, Europe, Océanie | cash | modérée |
| board-28 | Récolte sous assurance | Finance / distributions | Agroalimentaire & ressources; 12 sociétés (1/7/4); Amériques, Europe, Océanie | dividend | forte |
| board-29 | Accord de cybersécurité | Opportunité / financement | Technologie; 13 sociétés (1/0/12); Amériques, Asie, Europe, Océanie | cash | modérée |
| board-30 | Licence médicale | Finance / distributions | Santé; 9 sociétés (0/5/4); Amériques, Europe, Océanie | dividend | modérée |
| board-31 | Révision des normes comptables | Risque / sanction | Finance; 14 sociétés (2/3/9); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | fine | faible |
| board-32 | Conversion des entrepôts | Consolidation / OPA | Immobilier & infrastructures; 4 sociétés (4/0/0); Afrique & Moyen-Orient, Asie, Océanie | buyback | modérée |
| board-33 | Fret exceptionnel | Opportunité / financement | Transports & logistique; 6 sociétés (3/2/1); Amériques, Asie, Europe, Océanie | cash | forte |
| board-34 | Couverture agricole | Finance / distributions | Agroalimentaire & ressources; 12 sociétés (1/7/4); Amériques, Europe, Océanie | dividend | modérée |
| board-35 | Violation de données | Risque / sanction | Technologie; 13 sociétés (1/0/12); Amériques, Asie, Europe, Océanie | fine | modérée |
| board-36 | Réparation du réseau | Risque / sanction | Énergie; 11 sociétés (3/4/4); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | fine | modérée |
| board-37 | Autorisation de distribution | Opportunité / financement | Communication & médias; 8 sociétés (4/3/1); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | cash | modérée |
| board-38 | Simplification de la structure | Réallocation / vente | Industrie; 14 sociétés (2/7/5); Amériques, Asie, Europe, Océanie | forcedSale | faible |
| board-39 | Offre de coopérative | Consolidation / OPA | Agroalimentaire & ressources; 12 sociétés (1/7/4); Amériques, Europe, Océanie | buyback | modérée |
| board-40 | Chambre de compensation | Tension / liquidité | Transports & logistique; 6 sociétés (3/2/1); Amériques, Asie, Europe, Océanie | marginCall | modérée |
| board-41 | Diversification imposée | Réallocation / vente | Énergie; 11 sociétés (3/4/4); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | forcedSale | modérée |
| board-42 | Clause de transparence | Concurrence / régulation | Finance; 14 sociétés (2/3/9); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | regulation | faible |
| board-43 | Commercialisation d’un vaccin | Finance / distributions | Santé; 9 sociétés (0/5/4); Amériques, Europe, Océanie | dividend | modérée |
| board-44 | Contrôle des loyers | Risque / sanction | Immobilier & infrastructures; 4 sociétés (4/0/0); Afrique & Moyen-Orient, Asie, Océanie | fine | modérée |
| board-45 | Archives judiciaires | Justice / contrôle interne | Industrie; 14 sociétés (2/7/5); Amériques, Asie, Europe, Océanie | prison | faible |
| board-46 | Redevances audiovisuelles | Finance / distributions | Communication & médias; 8 sociétés (4/3/1); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | dividend | modérée |
| board-47 | Garantie de chantier | Tension / liquidité | Immobilier & infrastructures; 4 sociétés (4/0/0); Afrique & Moyen-Orient, Asie, Océanie | marginCall | forte |
| board-48 | Programme de recyclage | Opportunité / financement | Industrie; 14 sociétés (2/7/5); Amériques, Asie, Europe, Océanie | cash | faible |
| board-49 | Ouverture des brevets | Concurrence / régulation | Technologie; 13 sociétés (1/0/12); Amériques, Asie, Europe, Océanie | regulation | modérée |
| board-50 | Rachat du réseau local | Consolidation / OPA | Énergie; 11 sociétés (3/4/4); Afrique & Moyen-Orient, Amériques, Asie, Europe, Océanie | buyback | forte |

## Inspirations historiques

Références de genre seulement : les cartes décrivent des scénarios fictifs et n’imputent aucun fait à une société actuelle.

- Pertes liées à des positions de trading non autorisées : [Société Générale, dossier Kerviel](https://www.societegenerale.com/en/news/newsroom/kerviel-case).
- Fraude d’investissement et fausse performance : [SEC, affaire Madoff](https://www.sec.gov/news/press/2008/2008-293.htm).
- Crise de liquidité et contagion financière : [BCE, crise financière mondiale](https://www.ecb.europa.eu/press/key/date/2009/html/sp090612.en.html).
- Embargo et choc énergétique de 1973–1974 : [IEA, histoire de l’agence](https://www.iea.org/about/mission/history-of-the-iea).
- Ruptures d’approvisionnement pandémiques : [OMS, système de chaîne d’approvisionnement COVID-19](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/covid-19-operations/).
- Régulation des positions dominantes : [Commission européenne, article 102](https://competition-policy.ec.europa.eu/antitrust-and-cartels/legislation/application-article-102-tfeu_en).

Le détail machine lisible, avec les pools et tailles par carte, le suivi par société et les descriptions Contexte appliquées, figure dans docs/card-audit.json.
