/**
 * Centre piece: the armillary globe raised on its brass and black-marble
 * pedestal, above the engraved compass rose.
 */
import { Suspense, useEffect } from "react";
import * as THREE from "three";
import { ArmillaryGlobe, type GlobeProps } from "./globe";
import { CENTRE } from "./layout";
import { PEDESTAL_TOP, Pedestal, useDisposable, type BoardMaterials } from "./Board";

const STEM = 0.34;
export const GLOBE_CENTER_Y = PEDESTAL_TOP + STEM + CENTRE.globeRadius * 1.14;

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

export function Centerpiece({ materials, globe, onReady }: { materials: BoardMaterials; globe: Omit<GlobeProps, "radius">; onReady: () => void }) {
  const stem = useDisposable(() => {
    const points = [
      new THREE.Vector2(0.2, 0), new THREE.Vector2(0.17, 0.03), new THREE.Vector2(0.075, 0.08),
      new THREE.Vector2(0.06, STEM * 0.55), new THREE.Vector2(0.11, STEM * 0.62), new THREE.Vector2(0.06, STEM * 0.7),
      new THREE.Vector2(0.05, STEM + CENTRE.globeRadius * 0.1),
    ];
    return new THREE.LatheGeometry(points, 48);
  }, []);
  const g = CENTRE.globe;
  return (
    <group>
      <Pedestal materials={materials} />
      <mesh geometry={stem} material={materials.brass} position={[g.x, PEDESTAL_TOP, g.z]} castShadow />
      <Suspense fallback={null}>
        <ArmillaryGlobe radius={CENTRE.globeRadius} position={[g.x, GLOBE_CENTER_Y, g.z]} {...globe} />
        <Ready onReady={onReady} />
      </Suspense>
    </group>
  );
}
