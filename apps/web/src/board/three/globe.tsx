/**
 * Armillary globe — CONTRACT STUB. The "objects" workstream replaces the body
 * (obsidian sphere, gold-engraved coastlines, NASA night lights, brass rings,
 * zone pins, fund markers, flight arcs). Keep the exported API stable.
 *
 * The globe is centred on its group origin; `radius` is in world units.
 */
import type { ThreeElements } from "@react-three/fiber";
import type { Grade, PawnId, ZoneId } from "@global-fund/shared";

export interface GlobeMarker {
  playerId: string;
  zoneId: ZoneId;
  seatColor: string;
  pawn: PawnId;
  active: boolean;
  jailed: boolean;
}

export interface GlobeFlight {
  /** Stable key (notice id) so the arc replays once per travel. */
  key: string | number;
  fromZone: ZoneId;
  toZone: ZoneId;
  seatColor: string;
  /** performance.now() epoch and duration of the visible flight. */
  startedAt: number;
  durationMs: number;
}

export interface GlobeProps {
  radius?: number;
  zoneGrades: Record<string, Grade>;
  /** Zone the globe should turn towards (focus, travel preview, travel). */
  focusZone?: ZoneId | null;
  /** Zone of the fund whose turn it is (its pin glows softly). */
  activeZone?: ZoneId | null;
  markers: GlobeMarker[];
  flight?: GlobeFlight | null;
  /** Dashed arc previewing a possible move; no command is involved. */
  preview?: { fromZone: ZoneId | null; toZone: ZoneId } | null;
  /** Zone rating being revealed (MARKET_IMPACT): pin pulses green/red. */
  impact?: { zoneId: ZoneId; direction: "up" | "down"; key: string } | null;
  /** Show floating HTML-free labels (city + grade) next to each pin. */
  labels?: boolean;
  reducedMotion: boolean;
  quality: "high" | "medium" | "low";
}

export function ArmillaryGlobe({ radius = 2.4, reducedMotion, quality, zoneGrades, focusZone, activeZone, markers, flight, preview, impact, labels, ...group }: GlobeProps & ThreeElements["group"]) {
  void reducedMotion; void quality; void zoneGrades; void focusZone; void activeZone; void markers; void flight; void preview; void impact; void labels;
  return (
    <group {...group}>
      <mesh castShadow>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshStandardMaterial color="#0c1420" metalness={0.2} roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.12, 0.02, 12, 128]} />
        <meshStandardMaterial color="#d2ad66" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}
