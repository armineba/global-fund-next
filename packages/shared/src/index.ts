export type Grade = "A" | "B" | "C" | "D" | "E";
export { default as NATIONALITIES } from "./nationalities.json";
export type ZoneId = "americas" | "europe" | "asia" | "africa" | "oceania";
export type SectorId =
  | "technology"
  | "finance"
  | "industry"
  | "health"
  | "energy"
  | "realestate"
  | "agrifood"
  | "media"
  | "transport";
export type PawnId = "lion" | "bull" | "globe" | "crystal" | "tower" | "leaf";
export type Difficulty = "easy" | "normal" | "hard";
export type SlotKind = "local" | "remote" | "ai";
export type Phase =
  | "geography"
  | "sector"
  | "market"
  | "awaitNext"
  | "finished";
export interface MarketEntry {
  id: string;
  name: string;
}
export interface SeatConfig {
  name: string;
  kind: SlotKind;
  nationality: string;
  pawn: PawnId;
  difficulty: Difficulty;
}
export interface Player {
  id: string;
  name: string;
  bot: boolean;
  pawn: PawnId;
  color: string;
  nationality: string;
  nationalityName: string;
  nationalityFlag: string;
  cash: number;
  fundValue: number;
  valuation?: number;
  zone: string | null;
  sectorPosition: number;
  position?: number;
  jailed: boolean;
  prisonStage: number;
  prisonWait: boolean;
  geoResolved: boolean;
  solvent: boolean;
  lapStartValue?: number;
  capitalFlows?: number;
  lapStartCapitalFlows?: number;
  lapPerformance?: number;
  botMarketDone?: boolean;
  botSectorRolled?: boolean;
  difficulty?: Difficulty;
  previousZone?: string;
}
export interface Company {
  id: string;
  name: string;
  zone: string;
  sector: string;
  basePrice: number;
  baseIncome: number;
  holdings: Record<string, number>;
  costBasis?: Record<string, number | null>;
  available: boolean;
  price: number;
  income: number;
  totalHeld: number;
  sharesAvailable: number;
  averageBuyPrice: Record<string, number | null>;
  source?: string;
  ticker?: string;
}
export interface BoardCell {
  kind: "start" | "sector" | "event" | "market";
  label: string;
  sector?: string;
  index?: number;
}
export interface GradeChange {
  scope: "zone" | "sector";
  id: string;
  before: Grade;
  after: Grade;
}
export interface Payment {
  fromId: string | null;
  toId: string | null;
  companyId?: string | null;
  companyName?: string | null;
  quantity?: number;
  perShare?: number;
  amount: number;
  reason?: string;
  forcedSales?: ForcedSale[];
}
export interface ForcedSale {
  companyId: string;
  companyName: string;
  quantity: number;
  amount?: number;
  perShare?: number;
}
export interface PlayerImpact {
  playerId: string;
  playerName: string;
  cash: number;
  valuation: number;
  prison: boolean | null;
  sharesSold?: ForcedSale[];
}
export interface CompanyImpact {
  companyId: string;
  companyName: string;
  beforePrice: number;
  afterPrice: number;
  bankruptcy: boolean;
  returned: boolean;
  sharesChanged?: {
    playerId: string;
    playerName: string;
    before: number;
    after: number;
  }[];
}
export interface GameNotice {
  id: number;
  cycle: number;
  kind: "event" | "payments";
  title?: string;
  description?: string;
  source?: "card" | "board";
  cardType?: "context" | "event";
  action?: string;
  roll?: number;
  position?: number;
  playerId?: string;
  playerName?: string;
  fromZoneId?: string | null;
  zoneId?: string;
  zoneName?: string;
  cell?: Pick<BoardCell, "kind" | "label" | "sector"> | null;
  payments?: Payment[];
  gradeChanges?: GradeChange[];
  gradeOutcomes?: GradeChange[];
  playerImpacts?: PlayerImpact[];
  companyImpacts?: CompanyImpact[];
  effectLines?: string[];
  lapPerformance?: number;
  lapReturn?: number;
  effect?: string;
  targetCompanyId?: string;
  targetCompanyName?: string;
  targetedSector?: string;
  targetedZone?: string;
  cardId?: string;
}
export interface ContextCard {
  id: number | string;
  title: string;
  description?: string;
  type?: string;
  changes: { scope: "zone" | "sector"; id: string; grade: Grade }[];
}
export interface EventCard {
  id: string;
  title: string;
  story: string;
  effect: string;
  activeCash?: number;
  amount?: number;
  quantity?: number;
  targetSector?: string;
}
export interface HistoryPoint {
  id?: number;
  label?: string;
  cycle: number;
  reason?: string;
  zoneGrades: Record<string, Grade>;
  sectorGrades: Record<string, Grade>;
  prices: Record<string, number>;
  funds: Record<string, number>;
  [key: string]: unknown;
}
export interface GameView {
  players: Player[];
  companies: Company[];
  zones: MarketEntry[];
  sectors: MarketEntry[];
  board: BoardCell[];
  zoneGrades: Record<string, Grade>;
  sectorGrades: Record<string, Grade>;
  phase: Phase;
  stage: string;
  cycle: number;
  activeIndex: number;
  activePlayerId: string;
  starterIndex: number;
  initiative: number[];
  completedPlayers: string[];
  currentContext: ContextCard | null;
  contextsRemaining: number;
  boardEventsRemaining: number;
  notices: GameNotice[];
  noticeSeq: number;
  marketHistory: HistoryPoint[];
  log: string[];
  finished: boolean;
  winnerIds: string[];
}
export interface GameState
  extends Omit<
    GameView,
    "activePlayerId" | "contextsRemaining" | "boardEventsRemaining"
  > {
  deck: ContextCard[];
  boardEventDeck: EventCard[];
  boardEventDiscard: EventCard[];
  legacyOpening?: boolean;
  rulesVersion?: number;
  turnFormat?: string;
  eventTextVersion?: number;
  cardRulesVersion?: number;
  nationalityRulesVersion?: number;
  started?: boolean;
}
export type GameCommand =
  | { type: "STAY" }
  | { type: "MOVE"; zoneId: string }
  | { type: "ROLL" }
  | { type: "PRISON_ROLL" }
  | { type: "BUY_SHARE" | "SELL_SHARE"; companyId: string; quantity: number }
  | { type: "END_TURN" }
  | { type: "NEXT_TURN" };
export interface RoomPlayer {
  id: string;
  name: string;
  kind: SlotKind;
  bot: boolean;
  pawn: PawnId;
  nationality: string;
  difficulty: Difficulty;
  color: string;
  ready: boolean;
  connected: boolean;
  controllerId: string | null;
}
export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  createdAt: string;
}
export interface RoomView {
  roomId: string;
  status: "lobby" | "playing" | "finished";
  hostId: string;
  players: RoomPlayer[];
  game: GameView | null;
  messages: ChatMessage[];
  revision: number;
}
export interface Session {
  roomId: string;
  playerId: string;
  token: string;
}
export type ApiResult =
  | { ok: true; room: RoomView; session?: Session }
  | { ok: false; error: string; code?: string };
export interface CommandRequest {
  roomId: string;
  commandId: string;
  expectedRevision: number;
  playerId: string;
  command: GameCommand;
}
export const PLAYER_COLORS = [
  "#dfb96d",
  "#55a9e2",
  "#c2cbd6",
  "#b18bea",
  "#e96b6b",
  "#55b999",
];
export const PAWNS: { id: PawnId; name: string; label: string }[] = [
  { id: "lion", name: "Lion", label: "Stratégie" },
  { id: "bull", name: "Taureau", label: "Audace" },
  { id: "globe", name: "Globe", label: "Vision" },
  { id: "crystal", name: "Cristal", label: "Précision" },
  { id: "tower", name: "Tour", label: "Puissance" },
  { id: "leaf", name: "Feuille", label: "Équilibre" },
];
