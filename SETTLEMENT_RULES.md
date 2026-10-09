# Règlement et livraison des titres

## Obligation et interruption du tour

Le moteur calcule la dette et sa cause. Sur une case sectorielle, le joueur actif paie les autres détenteurs au prorata de leurs parts. Ses propres participations ne déclenchent aucun versement du marché ou de la banque, même en cas de contrôle total ou de monopole ; elles rapportent lorsque d’autres fonds tombent sur ce secteur. Les montants proviennent du moteur, avec les bonus de contrôle et de monopole existants.

Un paiement couvert par les liquidités est exécuté en cash. Si elles sont insuffisantes et que des participations sont liquidables, le tour passe en `settlement`. Le dé et les effets de la case ne sont pas rejoués. Les autres commandes du tour restent interdites jusqu’au règlement.

## Sélection et vente au marché

Le débiteur sélectionne les entreprises et quantités à céder. Cette cession exceptionnelle peut concerner toutes les zones, y compris pendant une détention. Elle ne donne aucun droit d’achat ni d’arbitrage ordinaire.

Une dette envers la banque se règle par vente au marché puis paiement. Une cession partielle permet de continuer la sélection si la dette reste à couvrir. Le surplus de cash appartient au débiteur. Les titres indisponibles ou sans valeur liquidable ne sont pas proposés.

## Proposition au créancier

Pour une dette entre fonds, le débiteur peut proposer des titres. Le serveur vérifie leur propriété, leur disponibilité et leur quantité, puis fige le cours au moment de la proposition. Il n’effectue aucun transfert avant acceptation.

`cashDelta = dette − valeur des titres proposés`

| Valeur des titres | Conséquence à l’acceptation |
| --- | --- |
| Inférieure à la dette | Le débiteur transfère les titres et verse le complément en cash. |
| Égale à la dette | Seuls les titres changent de propriétaire. |
| Supérieure à la dette | Le créancier reçoit les titres et verse la différence au débiteur. |

Le serveur refuse une acceptation si le fonds devant payer le complément ne dispose pas du cash nécessaire. La demande est exécutée sur une copie d’état : un refus de validation ne modifie ni propriété ni liquidités.

## Refus et exigence de cash

Le créancier peut accepter, refuser ou exiger du cash. Un refus rend la sélection au débiteur, qui peut préparer une autre proposition ou vendre au marché. Exiger du cash entraîne la liquidation nécessaire puis le paiement ; un débiteur IA revient également à cette solution après refus, pour éviter une boucle de propositions identiques.

## Base de coût et contrôles

La base de coût des parts reçues est leur valeur de transfert figée, même si elle dépasse la dette. Elle se combine avec la base de coût des parts déjà détenues pour calculer le PRU pondéré. Le débiteur conserve le PRU proportionnel des titres restants. Les contrôles 5/5, monopoles, revenus futurs et valorisations sont recalculés à partir de la propriété confirmée.

## Plusieurs créanciers

L’ordre est fixé côté serveur au début du règlement : **valorisation du fonds croissante**, puis ordre stable des sièges en cas d’égalité. Le créancier ayant la valeur de fonds la plus faible est prioritaire. Les valorisations ayant servi au classement sont figées et conservées pour expliquer l’ordre affiché.

Le brief mentionnait aussi un classement par liquidités. L’utilisateur a explicitement confirmé le classement par valorisation du fonds : cette réponse résout la contradiction et prévaut sur les autres formulations du brief.

Les obligations suivantes restent en attente jusqu’au règlement du créancier courant. Ni le client ni une variation liée au paiement du premier créancier ne reclasse cette file.

## Insolvabilité

Lorsque les liquidités et tous les actifs liquidables ne suffisent pas, le moteur liquide les actifs et applique l’insolvabilité existante. Un créancier reçoit uniquement le montant effectivement financé. Aucun cash manquant n’est créé, aucune dette négative permanente n’est ajoutée. Le journal distingue le montant réglé et le montant non réglé.

## IA, droits et sauvegardes

Les IA utilisent les mêmes commandes que les humains. Le fonds devant décider peut être le débiteur ou le créancier, sans changer le joueur actif du tour. Le serveur authentifie le contrôleur de ce fonds, vérifie la révision de salle et déduplique les commandes.

La proposition, les cours figés, la file et les décisions en attente font partie de l’état sauvegardé. Une reconnexion reprend le règlement. Les transferts de titres, le cash et la résolution de la dette sont persistés ensemble avant diffusion aux clients.

## Présentation et historique

Les écrans et résumés rappellent la case et le secteur lorsqu’ils sont à l’origine du paiement. L’historique conserve la dette, les titres, leur valeur figée, le sens du cash et les éventuels montants impayés.

Une opération présente **une seule synthèse globale**, avec tous ses créanciers, le total réglé, les titres cédés, le sens du cash et les impayés. Les choix de financement restent distincts dans le desk ; aucune fiche de reçu ne s’ouvre entre deux créanciers ou deux liquidations partielles. La synthèse finale se ferme par **Échap** ; les petits versements restent eux aussi lisibles dans leur fiche. Le bilan supplémentaire « Les fonds sont revalorisés » est supprimé, les liquidités et valorisations restant affichées dans le HUD. Les ajustements réels de marché gardent leur confirmation puis reviennent directement au jeu. Ce rythme de lecture appartient à la présentation et ne remplace pas les validations du serveur.
