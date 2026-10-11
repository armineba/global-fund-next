/**
 * Live board state read by the render loop. React props are copied here after
 * each commit so per-frame code never waits for a re-render; event epochs
 * (arrival, mood, impact…) use the presentation clock, performance.now().
 */
import { createContext, useContext } from "react";
import type { GameView } from "@global-fund/shared";
import type { BoardTimeline, PresentationStage } from "../../presentation/sequence";
import type { BoardInsets } from "../types";
import type { TierSettings } from "./quality";

export type CameraMode = "global" | "player" | "cell" | "zone" | "crash";
export type Mood = "crash" | "bull" | "bear" | null;
export type DeckFocus = "context" | "event" | null;

export interface BoardRuntime {
  game: GameView;
  timeline: BoardTimeline | null;
  stage: PresentationStage | undefined;
  reduced: boolean;
  tier: TierSettings;
  insets: BoardInsets;
  hovered: number | null;
  focusZone: string | null;
  cameraMode: CameraMode;
  mood: Mood;
  moodAt: number;
  deck: DeckFocus;
  deckAt: number;
  impact: { cells: number[]; up: boolean; at: number; key: string } | null;
  arrival: { cell: number; at: number; color: string } | null;
  activeId: string;
  viewerId: string | undefined;
  /** Display position of the active figurine (camera follow), world x / z. */
  activePos: { x: number; z: number };
  /** Epoch of the last mood start that should shake the camera. */
  shakeAt: number;
}

export const RuntimeContext = createContext<{ current: BoardRuntime } | null>(null);

export function useRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error("Board runtime is missing");
  return runtime;
}

// ----------------------------------------------------------------- motion --
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Frame-rate independent exponential damping factor. */
export const dampFactor = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);

/** Deterministic pseudo random generator (mulberry32). */
export function seeded(seed: number) {
  let a = (seed | 0) + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
