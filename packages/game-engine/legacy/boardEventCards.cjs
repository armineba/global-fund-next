'use strict';

// Cartes tirées lorsqu'un pion tombe sur une case Événement du plateau.
// Elles sont distinctes des cartes Contexte, tirées au début d'un nouveau cycle.
// activeCash garantit qu'une carte produit toujours un effet pour le joueur actif.
const BOARD_EVENT_CARDS = [
  {
    id: 'board-01', title: 'Contrat public inattendu',
    story: 'Un appel d’offres public est remporté par {company}. Les analystes révisent leurs prévisions dès la clôture.',
    effect: 'cash', activeCash: 2, amount: 2,
  },
  {
    id: 'board-02', title: 'Prime de fidélité bancaire',
    story: 'Une banque partenaire verse une prime exceptionnelle aux investisseurs qui ont accompagné {company} pendant sa phase d’expansion.',
    effect: 'dividend', activeCash: 1, amount: 2, targetSector: 'finance',
  },
  {
    id: 'board-03', title: 'Rachat stratégique',
    story: 'Un acteur industriel annonce le rachat d’une partie des titres de {company} pour sécuriser son approvisionnement.',
    effect: 'buyback', activeCash: 3, amount: 3, targetSector: 'industry',
  },
  {
    id: 'board-04', title: 'Crédit d’innovation',
    story: 'Un programme de soutien à l’innovation débloque immédiatement une enveloppe pour les investisseurs exposés à {company}.',
    effect: 'cash', activeCash: 1, amount: 1,
  },
  {
    id: 'board-05', title: 'Dividende exceptionnel',
    story: 'Après une cession d’actifs, {company} distribue une partie de sa trésorerie à ses actionnaires.',
    effect: 'dividend', activeCash: 2, amount: 3, targetSector: 'energy',
  },
  {
    id: 'board-06', title: 'Commande humanitaire',
    story: 'Une organisation internationale commande en urgence du matériel médical à {company}, ce qui sécurise ses prochains mois d’activité.',
    effect: 'cash', activeCash: 3, amount: 3,
  },
  {
    id: 'board-07', title: 'Offre de retrait',
    story: 'Un fonds d’infrastructure propose de racheter des titres de {company} au comptant afin de financer une modernisation rapide.',
    effect: 'buyback', activeCash: 2, amount: 2, targetSector: 'realestate',
  },
  {
    id: 'board-08', title: 'Brevet décisif',
    story: 'Le brevet de {company} est validé dans plusieurs pays. Une avance de licence arrive sur le compte du fonds.',
    effect: 'dividend', activeCash: 1, amount: 2, targetSector: 'technology',
  },
  {
    id: 'board-09', title: 'Amende de conformité',
    story: 'Un contrôle révèle des déclarations tardives autour de {company}. Le fonds règle une amende administrative immédiate.',
    effect: 'fine', activeCash: -2, amount: 2,
  },
  {
    id: 'board-10', title: 'Rappel de sécurité',
    story: 'Un défaut de fabrication force {company} à rappeler une série de produits. Les investisseurs supportent une partie du coût.',
    effect: 'fine', activeCash: -3, amount: 3, targetSector: 'industry',
  },
  {
    id: 'board-11', title: 'Taxe carbone accélérée',
    story: 'Une taxe carbone entre en vigueur plus tôt que prévu et frappe les positions liées à {company}.',
    effect: 'fine', activeCash: -1, amount: 1, targetSector: 'energy',
  },
  {
    id: 'board-12', title: 'Frais de restructuration',
    story: 'Le conseil de {company} lance une restructuration urgente. Les frais juridiques et sociaux sont facturés aux investisseurs.',
    effect: 'fine', activeCash: -2, amount: 2,
  },
  {
    id: 'board-13', title: 'Vente réglementaire',
    story: 'Un régulateur impose de réduire une position devenue trop concentrée autour de {company}.',
    effect: 'forcedSale', activeCash: -1, quantity: 1, targetSector: 'finance',
  },
  {
    id: 'board-14', title: 'Désengagement d’un assureur',
    story: 'Un assureur retire sa couverture de {company}. Pour rester liquide, le fonds doit céder une partie de ses titres.',
    effect: 'forcedSale', activeCash: -2, quantity: 1, targetSector: 'health',
  },
  {
    id: 'board-15', title: 'Audit des participations croisées',
    story: 'Un audit met au jour des participations croisées dans {company}. Deux titres doivent être revendus avant la prochaine séance.',
    effect: 'forcedSale', activeCash: -3, quantity: 2, targetSector: 'technology',
  },
  {
    id: 'board-16', title: 'Liquidité sous surveillance',
    story: 'Les créanciers de {company} exigent une réduction rapide des risques. Le fonds cède une ligne pour honorer ses engagements.',
    effect: 'forcedSale', activeCash: -2, quantity: 1, targetSector: 'realestate',
  },
  {
    id: 'board-17', title: 'Garantie de rachat',
    story: 'Un partenaire stratégique garantit un prix de sortie temporaire pour les titres de {company}.',
    effect: 'buyback', activeCash: 1, amount: 2, targetSector: 'transport',
  },
  {
    id: 'board-18', title: 'Appel de marge',
    story: 'La volatilité autour de {company} dépasse le seuil prévu par le courtier. Une garantie supplémentaire est exigée.',
    effect: 'marginCall', activeCash: -3, amount: 3, targetSector: 'finance',
  },
  {
    id: 'board-19', title: 'Collatéral déprécié',
    story: 'La valeur des actifs servant de garantie à {company} baisse brutalement. Le fonds doit reconstituer sa marge.',
    effect: 'marginCall', activeCash: -2, amount: 2, targetSector: 'energy',
  },
  {
    id: 'board-20', title: 'Risque de change',
    story: 'Une devise se retourne contre {company}. La chambre de compensation réclame un dépôt de sécurité immédiat.',
    effect: 'marginCall', activeCash: -1, amount: 1, targetSector: 'agrifood',
  },
  {
    id: 'board-21', title: 'Convocation judiciaire',
    story: 'Une enquête vise des transactions liées à {company}. Si votre fonds en détient des titres, le gestionnaire est placé en détention provisoire pour être entendu.',
    effect: 'prison', activeCash: -1,
  },
  {
    id: 'board-22', title: 'Soupçon de délit d’initié',
    story: 'Des ordres passés avant une annonce concernant {company} déclenchent une enquête. Le gestionnaire est placé en détention provisoire si son fonds détient des titres de cette société.',
    effect: 'prison', activeCash: -2, targetSector: 'finance',
  },
  {
    id: 'board-23', title: 'Saisie préventive',
    story: 'Des documents comptables de {company} sont saisis. Si le fonds possède des titres de cette société, son gestionnaire attend les premières auditions en prison.',
    effect: 'prison', activeCash: -3,
  },
  {
    id: 'board-24', title: 'Plafond de détention',
    story: 'Une nouvelle règle de concurrence limite la participation d’un fonds dans {company}. Une position excédentaire doit être réduite.',
    effect: 'regulation', activeCash: 1, quantity: 1, targetSector: 'media',
  },
  {
    id: 'board-25', title: 'Accès équitable au réseau',
    story: 'L’autorité de la concurrence ouvre l’accès aux infrastructures de {company} et redistribue les cartes du marché.',
    effect: 'regulation', activeCash: 2, targetSector: 'transport',
  },
  {
    id: 'board-26', title: 'Fin du privilège exclusif',
    story: 'Un contrat exclusif de {company} est déclaré abusif. Les détenteurs dominants doivent partager une partie de leur position.',
    effect: 'regulation', activeCash: 3, quantity: 1, targetSector: 'health',
  },
  {
    id: 'board-27', title: 'Indemnité de livraison',
    story: 'Un retard logistique de {company} est reconnu par le fournisseur, qui verse une indemnité au fonds.',
    effect: 'cash', activeCash: 2, amount: 2, targetSector: 'transport',
  },
  {
    id: 'board-28', title: 'Récolte sous assurance',
    story: 'Une assurance couvre une partie des pertes subies par {company} après une saison difficile. Le fonds reçoit le règlement.',
    effect: 'dividend', activeCash: 3, amount: 2, targetSector: 'agrifood',
  },
];

// Twenty-two additional local financial incidents; none changes an index grade.
BOARD_EVENT_CARDS.push(...[
  {
    "id": "board-29",
    "title": "Accord de cybersécurité",
    "story": "Un audit valide les protections de {company}. Un assureur rembourse une partie de la prime du fonds.",
    "effect": "cash",
    "activeCash": 2,
    "targetSector": "technology"
  },
  {
    "id": "board-30",
    "title": "Licence médicale",
    "story": "Une autorité délivre une nouvelle licence à {company}. La société distribue les recettes initiales aux actionnaires.",
    "effect": "dividend",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "health"
  },
  {
    "id": "board-31",
    "title": "Révision des normes comptables",
    "story": "Les comptes de {company} nécessitent une correction. Les détenteurs financent un audit complémentaire.",
    "effect": "fine",
    "activeCash": -1,
    "amount": 1,
    "targetSector": "finance"
  },
  {
    "id": "board-32",
    "title": "Conversion des entrepôts",
    "story": "Un promoteur propose une prime pour les titres de {company} afin de financer la reconversion de ses entrepôts.",
    "effect": "buyback",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "realestate"
  },
  {
    "id": "board-33",
    "title": "Fret exceptionnel",
    "story": "Un contrat de fret d’urgence mobilise {company}. Le fonds perçoit une indemnité de disponibilité.",
    "effect": "cash",
    "activeCash": 3,
    "targetSector": "transport"
  },
  {
    "id": "board-34",
    "title": "Couverture agricole",
    "story": "Un assureur verse à {company} une indemnité après des intempéries. La trésorerie est distribuée aux porteurs.",
    "effect": "dividend",
    "activeCash": 2,
    "amount": 1,
    "targetSector": "agrifood"
  },
  {
    "id": "board-35",
    "title": "Violation de données",
    "story": "Une fuite de données chez {company} impose une notification des clients. Les actionnaires règlent les frais.",
    "effect": "fine",
    "activeCash": -2,
    "amount": 2,
    "targetSector": "technology"
  },
  {
    "id": "board-36",
    "title": "Réparation du réseau",
    "story": "Une panne de réseau oblige {company} à engager une maintenance exceptionnelle. Les porteurs contribuent au financement.",
    "effect": "fine",
    "activeCash": -1,
    "amount": 2,
    "targetSector": "energy"
  },
  {
    "id": "board-37",
    "title": "Autorisation de distribution",
    "story": "Le catalogue de {company} obtient une licence de distribution internationale. Une avance est versée au fonds.",
    "effect": "cash",
    "activeCash": 2,
    "targetSector": "media"
  },
  {
    "id": "board-38",
    "title": "Simplification de la structure",
    "story": "La simplification des filiales de {company} conduit à une réduction des participations croisées. Un titre est cédé au marché.",
    "effect": "forcedSale",
    "activeCash": -1,
    "quantity": 1,
    "targetSector": "industry"
  },
  {
    "id": "board-39",
    "title": "Offre de coopérative",
    "story": "Une coopérative propose un rachat avec prime des titres de {company} pour sécuriser les livraisons locales.",
    "effect": "buyback",
    "activeCash": 2,
    "amount": 1,
    "targetSector": "agrifood"
  },
  {
    "id": "board-40",
    "title": "Chambre de compensation",
    "story": "Une nouvelle exigence de compensation sur {company} appelle une garantie supplémentaire du fonds exposé.",
    "effect": "marginCall",
    "activeCash": -1,
    "amount": 2,
    "targetSector": "transport"
  },
  {
    "id": "board-41",
    "title": "Diversification imposée",
    "story": "Le régulateur exige la diversification du fonds autour de {company}. Deux titres détenus sont vendus.",
    "effect": "forcedSale",
    "activeCash": -2,
    "quantity": 2,
    "targetSector": "energy"
  },
  {
    "id": "board-42",
    "title": "Clause de transparence",
    "story": "L’autorité examine les positions dominantes autour de {company}. Une part doit être libérée pour ouvrir la concurrence.",
    "effect": "regulation",
    "activeCash": 1,
    "quantity": 1,
    "targetSector": "finance"
  },
  {
    "id": "board-43",
    "title": "Commercialisation d’un vaccin",
    "story": "Le lancement d’un vaccin par {company} débloque une distribution exceptionnelle aux investisseurs.",
    "effect": "dividend",
    "activeCash": 2,
    "amount": 2,
    "targetSector": "health"
  },
  {
    "id": "board-44",
    "title": "Contrôle des loyers",
    "story": "Une révision des baux de {company} impose des frais administratifs immédiats aux porteurs.",
    "effect": "fine",
    "activeCash": -2,
    "amount": 1,
    "targetSector": "realestate"
  },
  {
    "id": "board-45",
    "title": "Archives judiciaires",
    "story": "Des documents liés à {company} déclenchent une audition judiciaire. Le gestionnaire du fonds est détenu uniquement s’il détient la société.",
    "effect": "prison",
    "activeCash": -1,
    "targetSector": "industry"
  },
  {
    "id": "board-46",
    "title": "Redevances audiovisuelles",
    "story": "Des redevances internationales arrivent chez {company}. La société partage cette recette avec ses actionnaires.",
    "effect": "dividend",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "media"
  },
  {
    "id": "board-47",
    "title": "Garantie de chantier",
    "story": "Le courtier exige un dépôt complémentaire après la révision d’un chantier de {company}. Le fonds exposé doit couvrir la marge.",
    "effect": "marginCall",
    "activeCash": -2,
    "amount": 3,
    "targetSector": "realestate"
  },
  {
    "id": "board-48",
    "title": "Programme de recyclage",
    "story": "Le programme de recyclage de {company} obtient une subvention. Une avance de financement est créditée au fonds.",
    "effect": "cash",
    "activeCash": 1,
    "targetSector": "industry"
  },
  {
    "id": "board-49",
    "title": "Ouverture des brevets",
    "story": "Une autorité de concurrence impose le partage d’une position dominante liée à {company}. Une participation doit être cédée.",
    "effect": "regulation",
    "activeCash": 2,
    "quantity": 1,
    "targetSector": "technology"
  },
  {
    "id": "board-50",
    "title": "Rachat du réseau local",
    "story": "Un opérateur local propose une prime sur les titres de {company} pour regrouper ses infrastructures.",
    "effect": "buyback",
    "activeCash": 1,
    "amount": 3,
    "targetSector": "energy"
  }
]);

module.exports = { BOARD_EVENT_CARDS };
