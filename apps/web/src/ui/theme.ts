import type { Grade, PawnId, ZoneId } from "@global-fund/shared";

/**
 * Shared art direction constants for the HTML interface and the 3D scene.
 * Presentation only: nothing here participates in rules, prices or commands.
 */

export const PALETTE = {
  ink950: "#04060a",
  ink900: "#080c13",
  ink850: "#0c121b",
  ink800: "#111925",
  ink700: "#18222f",
  gold200: "#f6e7c4",
  gold300: "#efd9a7",
  gold400: "#e3c486",
  gold500: "#d2ad66",
  gold600: "#b38c47",
  gold700: "#80642f",
  text100: "#f5f0e6",
  text300: "#cdc6b8",
  text500: "#8f97a6",
  up: "#38d59b",
  down: "#f06b74",
  info: "#72b9ea",
} as const;

export const GRADES: Grade[] = ["A", "B", "C", "D", "E"];
export const GRADE_META: Record<Grade, { label: string; color: string; level: number }> = {
  A: { label: "Très favorable", color: "#38d59b", level: 5 },
  B: { label: "Favorable", color: "#93d9b1", level: 4 },
  C: { label: "Neutre", color: "#e4d5ab", level: 3 },
  D: { label: "Dégradé", color: "#f1a55c", level: 2 },
  E: { label: "Critique", color: "#f06b74", level: 1 },
};
/** Positive when the grade improves (E → A). */
export const gradeDelta = (before: Grade, after: Grade) => GRADE_META[after].level - GRADE_META[before].level;

export type SectorId = "technology" | "finance" | "industry" | "health" | "energy" | "realestate" | "agrifood" | "media" | "transport";
export const SECTOR_META: Record<SectorId, { short: string; label: string; color: string; icon: "cpu" | "landmark" | "factory" | "heart" | "flame" | "building" | "wheat" | "radio" | "plane" }> = {
  technology: { short: "TECH", label: "Technologie", color: "#5c9ded", icon: "cpu" },
  finance: { short: "FINANCE", label: "Finance", color: "#d6b06a", icon: "landmark" },
  industry: { short: "INDUSTRIE", label: "Industrie", color: "#9aa7bb", icon: "factory" },
  health: { short: "SANTÉ", label: "Santé", color: "#4cc7b2", icon: "heart" },
  energy: { short: "ÉNERGIE", label: "Énergie", color: "#f08c4c", icon: "flame" },
  realestate: { short: "IMMO", label: "Immobilier", color: "#ab8de2", icon: "building" },
  agrifood: { short: "AGRO", label: "Agroalimentaire", color: "#8fc46e", icon: "wheat" },
  media: { short: "MÉDIAS", label: "Médias", color: "#e2719e", icon: "radio" },
  transport: { short: "TRANSPORT", label: "Transports", color: "#5dbad8", icon: "plane" },
};
export const sectorMeta = (id: string | undefined) => SECTOR_META[(id ?? "") as SectorId];

/** One stable financial city per economic zone, as used by the offices. */
export const ZONE_META: Record<ZoneId, { short: string; label: string; city: string; lat: number; lon: number }> = {
  americas: { short: "AMÉR.", label: "Amériques", city: "New York", lat: 40.71, lon: -74.01 },
  europe: { short: "EUROPE", label: "Europe", city: "Londres", lat: 51.51, lon: -0.13 },
  asia: { short: "ASIE", label: "Asie", city: "Hong Kong", lat: 22.32, lon: 114.17 },
  africa: { short: "AF. & M.-O.", label: "Afrique & Moyen-Orient", city: "Dubaï", lat: 25.2, lon: 55.27 },
  oceania: { short: "OCÉANIE", label: "Océanie", city: "Sydney", lat: -33.87, lon: 151.21 },
};
export const ZONE_IDS = Object.keys(ZONE_META) as ZoneId[];

/** Figurine materials follow the chosen piece; rings and halos use the seat colour. */
export const PAWN_META: Record<PawnId, { name: string; material: string; tint: string; accent: string }> = {
  lion: { name: "Lion", material: "Or", tint: "#d8b25f", accent: "#f7e3ae" },
  bull: { name: "Taureau", material: "Saphir", tint: "#2d6fd6", accent: "#d8b25f" },
  globe: { name: "Globe", material: "Platine", tint: "#c9d2dc", accent: "#7fb7ea" },
  crystal: { name: "Cristal", material: "Améthyste", tint: "#9a6bea", accent: "#e6d6ff" },
  tower: { name: "Tour", material: "Rubis", tint: "#cf3f4f", accent: "#d8b25f" },
  leaf: { name: "Feuille", material: "Émeraude", tint: "#23b97f", accent: "#d8b25f" },
};

/** Rendered figurine portraits (transparent PNG), with the earlier sprite as fallback. */
export const pawnPortrait = (id: PawnId) => `/assets/pawns/render/${id}.png`;
export const pawnLegacyPortrait = (id: PawnId) => `/assets/pawns/premium/${id}.webp`;
