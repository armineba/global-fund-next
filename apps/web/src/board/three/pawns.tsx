/**
 * Figurines — CONTRACT STUB. The "objects" workstream replaces the body with the
 * sculpted gemstone pieces; the exported API below must stay stable.
 *
 * Units: one world unit ≈ one board edge-cell width. A figurine is ~1.05 units
 * tall at scale 1, base radius ~0.3, origin at the centre of its base (y = 0 is
 * the contact point with the board). Materials follow the piece (PAWN_META);
 * `seatColor` drives only the ring/halo so funds stay distinguishable.
 */
import type { ThreeElements } from "@react-three/fiber";
import type { PawnId } from "@global-fund/shared";
import { PAWN_META } from "../../ui/theme";

export interface PawnModelProps {
  /** Piece id (named `piece`: Object3D already owns a numeric `id`). */
  piece: PawnId;
  /** Seat colour (PLAYER_COLORS) for the base ring / halo. */
  seatColor?: string;
  /** Detained funds read as dimmed / desaturated pieces. */
  jailed?: boolean;
  /** The fund whose turn it is: halo ring glows. */
  active?: boolean;
  /** Quality hint: "low" must avoid transmission / heavy materials. */
  quality?: "high" | "medium" | "low";
}

export function PawnModel({ piece, seatColor, jailed = false, active = false, quality = "high", ...group }: PawnModelProps & ThreeElements["group"]) {
  void quality;
  const tint = PAWN_META[piece]?.tint ?? "#d8b25f";
  return (
    <group {...group}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.12, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 0.75, 24]} />
        <meshStandardMaterial color={tint} metalness={0.85} roughness={0.25} transparent={jailed} opacity={jailed ? 0.55 : 1} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.15, 24, 16]} />
        <meshStandardMaterial color={tint} metalness={0.85} roughness={0.25} />
      </mesh>
      {active && seatColor && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.44, 48]} />
          <meshBasicMaterial color={seatColor} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
