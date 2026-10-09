'use strict';

// Cartes Événement du plateau. Les récits de marché sont fictifs; les effets
// mécaniques restent définis par les champs de chaque carte.
const BOARD_EVENT_CARDS = [
  {
    "id": "board-01",
    "title": "Contrat public inattendu",
    "story": "Un marché public est attribué à {company} après une procédure concurrentielle. Le fonds actif reçoit une indemnité liée à la transaction.",
    "effect": "cash",
    "activeCash": 2,
    "amount": 2
  },
  {
    "id": "board-02",
    "title": "Prime de fidélité bancaire",
    "story": "Une banque partenaire réorganise ses réserves et distribue une prime exceptionnelle aux porteurs de {company}.",
    "effect": "dividend",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "finance"
  },
  {
    "id": "board-03",
    "title": "Rachat stratégique",
    "story": "Une offre de rachat avec prime est déposée sur {company} afin de sécuriser une chaîne d’approvisionnement.",
    "effect": "buyback",
    "activeCash": 3,
    "amount": 3,
    "targetSector": "industry"
  },
  {
    "id": "board-04",
    "title": "Crédit d’innovation",
    "story": "Un fonds d’innovation règle une avance au fonds actif après la validation d’un programme lié à {company}.",
    "effect": "cash",
    "activeCash": 1,
    "amount": 1
  },
  {
    "id": "board-05",
    "title": "Dividende exceptionnel",
    "story": "Après la cession d’un actif, {company} décide une distribution ponctuelle aux actionnaires.",
    "effect": "dividend",
    "activeCash": 2,
    "amount": 3,
    "targetSector": "energy"
  },
  {
    "id": "board-06",
    "title": "Commande humanitaire",
    "story": "Une commande d’urgence de matériel médical est attribuée à {company}. Une indemnité de mobilisation revient au fonds actif.",
    "effect": "cash",
    "activeCash": 3,
    "amount": 3
  },
  {
    "id": "board-07",
    "title": "Offre de retrait",
    "story": "Un investisseur propose un retrait avec prime sur {company} pour financer la rénovation d’actifs immobiliers.",
    "effect": "buyback",
    "activeCash": 2,
    "amount": 2,
    "targetSector": "realestate"
  },
  {
    "id": "board-08",
    "title": "Brevet décisif",
    "story": "Une licence de brevet ouvre de nouveaux débouchés à {company} ; les actionnaires reçoivent une distribution exceptionnelle.",
    "effect": "dividend",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "technology"
  },
  {
    "id": "board-09",
    "title": "Amende de conformité",
    "story": "Un audit de conformité révèle des dossiers incomplets autour de {company}. Le fonds actif règle les frais de procédure.",
    "effect": "fine",
    "activeCash": -2,
    "amount": 2
  },
  {
    "id": "board-10",
    "title": "Rappel de sécurité",
    "story": "Un défaut détecté lors d’un contrôle qualité entraîne le rappel d’un lot de {company} ; les porteurs financent une partie des coûts.",
    "effect": "fine",
    "activeCash": -3,
    "amount": 3,
    "targetSector": "industry"
  },
  {
    "id": "board-11",
    "title": "Taxe carbone accélérée",
    "story": "Une tarification carbone entre en vigueur plus tôt que prévu et renchérit l’exposition associée à {company}.",
    "effect": "fine",
    "activeCash": -1,
    "amount": 1,
    "targetSector": "energy"
  },
  {
    "id": "board-12",
    "title": "Frais de restructuration",
    "story": "Le conseil de {company} lance une réorganisation. Les coûts de conseil et de transition pèsent sur les détenteurs de titres.",
    "effect": "fine",
    "activeCash": -2,
    "amount": 2
  },
  {
    "id": "board-13",
    "title": "Vente réglementaire",
    "story": "Une nouvelle règle prudentielle impose de réduire une position concentrée dans {company}.",
    "effect": "forcedSale",
    "activeCash": -1,
    "quantity": 1,
    "targetSector": "finance"
  },
  {
    "id": "board-14",
    "title": "Désengagement d’un assureur",
    "story": "Un assureur révise les conditions de couverture de {company} ; certains fonds réduisent leur exposition.",
    "effect": "forcedSale",
    "activeCash": -2,
    "quantity": 1,
    "targetSector": "health"
  },
  {
    "id": "board-15",
    "title": "Audit des participations croisées",
    "story": "Un audit indépendant relève des participations croisées autour de {company}. Les porteurs réduisent leurs lignes.",
    "effect": "forcedSale",
    "activeCash": -3,
    "quantity": 2,
    "targetSector": "technology"
  },
  {
    "id": "board-16",
    "title": "Liquidité sous surveillance",
    "story": "Des créanciers demandent un plan de liquidité après la réévaluation d’actifs liés à {company}.",
    "effect": "forcedSale",
    "activeCash": -2,
    "quantity": 1,
    "targetSector": "realestate"
  },
  {
    "id": "board-17",
    "title": "Garantie de rachat",
    "story": "Un partenaire industriel propose une sortie à prime pour les titres de {company}.",
    "effect": "buyback",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "transport"
  },
  {
    "id": "board-18",
    "title": "Appel de marge",
    "story": "Une séance très volatile sur {company} déclenche un appel de marge pour le fonds actif.",
    "effect": "marginCall",
    "activeCash": -3,
    "amount": 3,
    "targetSector": "finance"
  },
  {
    "id": "board-19",
    "title": "Collatéral déprécié",
    "story": "La valeur du collatéral adossé à {company} baisse ; le fonds actif doit reconstituer sa garantie.",
    "effect": "marginCall",
    "activeCash": -2,
    "amount": 2,
    "targetSector": "energy"
  },
  {
    "id": "board-20",
    "title": "Risque de change",
    "story": "Un mouvement de change renchérit les contrats associés à {company} et entraîne un appel de marge.",
    "effect": "marginCall",
    "activeCash": -1,
    "amount": 1,
    "targetSector": "agrifood"
  },
  {
    "id": "board-21",
    "title": "Convocation judiciaire",
    "story": "Une enquête sur des opérations liées à {company} conduit le gestionnaire du fonds à être entendu par la justice.",
    "effect": "prison",
    "activeCash": -1
  },
  {
    "id": "board-22",
    "title": "Soupçon de délit d’initié",
    "story": "Des ordres atypiques précèdent une annonce concernant {company}. Une enquête de marché est ouverte et le gestionnaire exposé est convoqué.",
    "effect": "prison",
    "activeCash": -2,
    "targetSector": "finance"
  },
  {
    "id": "board-23",
    "title": "Saisie préventive",
    "story": "Des pièces comptables liées à {company} sont saisies pour expertise ; le gestionnaire exposé est retenu le temps des auditions.",
    "effect": "prison",
    "activeCash": -3
  },
  {
    "id": "board-24",
    "title": "Plafond de détention",
    "story": "Un régulateur plafonne les participations croisées dans {company} afin d’ouvrir davantage le marché.",
    "effect": "regulation",
    "activeCash": 1,
    "quantity": 1,
    "targetSector": "media"
  },
  {
    "id": "board-25",
    "title": "Accès équitable au réseau",
    "story": "Une autorité impose un accès ouvert à des infrastructures liées à {company}, réduisant les avantages d’une position dominante.",
    "effect": "regulation",
    "activeCash": 2,
    "targetSector": "transport"
  },
  {
    "id": "board-26",
    "title": "Fin du privilège exclusif",
    "story": "Un contrat d’exclusivité associé à {company} est révisé après un examen de concurrence ; les positions dominantes sont réduites.",
    "effect": "regulation",
    "activeCash": 3,
    "quantity": 1,
    "targetSector": "health"
  },
  {
    "id": "board-27",
    "title": "Indemnité de livraison",
    "story": "Un retard de livraison imputable à un prestataire de {company} donne lieu à une indemnité versée au fonds actif.",
    "effect": "cash",
    "activeCash": 2,
    "amount": 2,
    "targetSector": "transport"
  },
  {
    "id": "board-28",
    "title": "Récolte sous assurance",
    "story": "Une assurance couvre une partie des pertes d’une filière liée à {company} après une saison difficile ; une distribution suit.",
    "effect": "dividend",
    "activeCash": 3,
    "amount": 2,
    "targetSector": "agrifood"
  },
  {
    "id": "board-29",
    "title": "Accord de cybersécurité",
    "story": "Un audit de cybersécurité valide un plan de continuité lié à {company}. Le fonds actif reçoit une indemnité d’assurance.",
    "effect": "cash",
    "activeCash": 2,
    "targetSector": "technology"
  },
  {
    "id": "board-30",
    "title": "Licence médicale",
    "story": "Une nouvelle autorisation commerciale ouvre un marché à {company}, qui distribue une partie des premières recettes.",
    "effect": "dividend",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "health"
  },
  {
    "id": "board-31",
    "title": "Révision des normes comptables",
    "story": "Une révision comptable liée à {company} entraîne des frais de contrôle supplémentaires pour ses porteurs.",
    "effect": "fine",
    "activeCash": -1,
    "amount": 1,
    "targetSector": "finance"
  },
  {
    "id": "board-32",
    "title": "Conversion des entrepôts",
    "story": "Un investisseur propose une prime de rachat sur {company} pour financer la reconversion d’entrepôts.",
    "effect": "buyback",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "realestate"
  },
  {
    "id": "board-33",
    "title": "Fret exceptionnel",
    "story": "Une mission de fret urgente mobilise {company} ; le fonds actif reçoit une indemnité de disponibilité.",
    "effect": "cash",
    "activeCash": 3,
    "targetSector": "transport"
  },
  {
    "id": "board-34",
    "title": "Couverture agricole",
    "story": "Après des intempéries, un assureur indemnise une filière liée à {company}, qui partage une partie des recettes avec ses porteurs.",
    "effect": "dividend",
    "activeCash": 2,
    "amount": 1,
    "targetSector": "agrifood"
  },
  {
    "id": "board-35",
    "title": "Violation de données",
    "story": "Une fuite de données impose des frais de notification et de sécurisation autour de {company}.",
    "effect": "fine",
    "activeCash": -2,
    "amount": 2,
    "targetSector": "technology"
  },
  {
    "id": "board-36",
    "title": "Réparation du réseau",
    "story": "Une panne sur un réseau lié à {company} exige une réparation exceptionnelle, financée en partie par les détenteurs de titres.",
    "effect": "fine",
    "activeCash": -1,
    "amount": 2,
    "targetSector": "energy"
  },
  {
    "id": "board-37",
    "title": "Autorisation de distribution",
    "story": "Une licence de distribution internationale est accordée à {company} ; une avance revient au fonds actif.",
    "effect": "cash",
    "activeCash": 2,
    "targetSector": "media"
  },
  {
    "id": "board-38",
    "title": "Simplification de la structure",
    "story": "Une simplification des filiales de {company} réduit les participations croisées et entraîne une cession de titres.",
    "effect": "forcedSale",
    "activeCash": -1,
    "quantity": 1,
    "targetSector": "industry"
  },
  {
    "id": "board-39",
    "title": "Offre de coopérative",
    "story": "Une coopérative propose une offre de rachat avec prime sur {company} pour fiabiliser les livraisons locales.",
    "effect": "buyback",
    "activeCash": 2,
    "amount": 1,
    "targetSector": "agrifood"
  },
  {
    "id": "board-40",
    "title": "Chambre de compensation",
    "story": "Une chambre de compensation relève les garanties exigées sur les positions associées à {company}.",
    "effect": "marginCall",
    "activeCash": -1,
    "amount": 2,
    "targetSector": "transport"
  },
  {
    "id": "board-41",
    "title": "Diversification imposée",
    "story": "Une règle de diversification limite l’exposition du fonds à {company} ; une partie de la ligne est cédée.",
    "effect": "forcedSale",
    "activeCash": -2,
    "quantity": 2,
    "targetSector": "energy"
  },
  {
    "id": "board-42",
    "title": "Clause de transparence",
    "story": "Une autorité examine les positions dominantes autour de {company} et exige une cession pour rouvrir le marché.",
    "effect": "regulation",
    "activeCash": 1,
    "quantity": 1,
    "targetSector": "finance"
  },
  {
    "id": "board-43",
    "title": "Commercialisation d’un vaccin",
    "story": "Après l’autorisation d’un nouveau produit de santé lié à {company}, une distribution exceptionnelle est versée aux actionnaires.",
    "effect": "dividend",
    "activeCash": 2,
    "amount": 2,
    "targetSector": "health"
  },
  {
    "id": "board-44",
    "title": "Contrôle des loyers",
    "story": "Une révision réglementaire des baux associés à {company} entraîne des frais administratifs pour ses porteurs.",
    "effect": "fine",
    "activeCash": -2,
    "amount": 1,
    "targetSector": "realestate"
  },
  {
    "id": "board-45",
    "title": "Archives judiciaires",
    "story": "Des archives liées à {company} sont examinées ; le gestionnaire exposé est entendu.",
    "effect": "prison",
    "activeCash": -1,
    "targetSector": "industry"
  },
  {
    "id": "board-46",
    "title": "Redevances audiovisuelles",
    "story": "Les droits d’exploitation de contenus associés à {company} génèrent une recette ponctuelle, partagée avec ses porteurs.",
    "effect": "dividend",
    "activeCash": 1,
    "amount": 2,
    "targetSector": "media"
  },
  {
    "id": "board-47",
    "title": "Garantie de chantier",
    "story": "La réévaluation d’un chantier lié à {company} conduit le courtier à demander un dépôt complémentaire.",
    "effect": "marginCall",
    "activeCash": -2,
    "amount": 3,
    "targetSector": "realestate"
  },
  {
    "id": "board-48",
    "title": "Programme de recyclage",
    "story": "Un programme de recyclage lié à {company} obtient une subvention ; une avance est créditée au fonds actif.",
    "effect": "cash",
    "activeCash": 1,
    "targetSector": "industry"
  },
  {
    "id": "board-49",
    "title": "Ouverture des brevets",
    "story": "Une autorité ouvre l’accès à des brevets associés à {company} pour stimuler la concurrence ; les positions dominantes sont réduites.",
    "effect": "regulation",
    "activeCash": 2,
    "quantity": 1,
    "targetSector": "technology"
  },
  {
    "id": "board-50",
    "title": "Rachat du réseau local",
    "story": "Un opérateur propose une prime pour regrouper des infrastructures liées à {company}.",
    "effect": "buyback",
    "activeCash": 1,
    "amount": 3,
    "targetSector": "energy"
  }
];

module.exports = { BOARD_EVENT_CARDS };
