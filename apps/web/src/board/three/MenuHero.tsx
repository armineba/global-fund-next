/**
 * Full-screen 3D backdrop for the title, setup and lobby screens — CONTRACT STUB.
 * The "objects" workstream replaces it with the cinematic armillary-globe scene.
 *
 * Usage (lazy, behind the HTML UI):
 *   const MenuHero = lazy(() => import("../board/three/MenuHero"));
 *   <Suspense fallback={null}><MenuHero variant="menu" /></Suspense>
 * It renders a position:fixed, pointer-events:none, aria-hidden layer (z-index 0).
 */
import type { PawnId } from "@global-fund/shared";

export interface MenuHeroProps {
  /** Camera pose / composition: title screen, fund setup, or lobby table. */
  variant: "menu" | "setup" | "lobby";
  /** Figurines to showcase (setup: configured seats; lobby: seated funds). */
  pawns?: PawnId[];
  /** Highlighted figurine (e.g. the piece being chosen). */
  focusPawn?: PawnId | null;
  reducedMotion?: boolean;
  quality?: "high" | "medium" | "low";
}

export default function MenuHero({ variant }: MenuHeroProps) {
  return <div className={`menu-hero menu-hero--${variant}`} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(80% 70% at 70% 45%, #142033 0%, #05070b 70%)" }} />;
}
