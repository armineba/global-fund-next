/**
 * Warm zenithal key (shadows), cool blue rim, low fill and a procedural
 * studio environment (no HDR file) for the metal reflections. Market moods
 * shift the lights: crash ruby, bull gold-emerald, bear cold.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { dampFactor, useRuntime, type Mood } from "./runtime";
import type { TierSettings } from "./quality";

interface Rig { key: THREE.Color; keyI: number; rim: THREE.Color; rimI: number; sky: THREE.Color; fillI: number }
const RIGS: Record<"calm" | Exclude<Mood, null>, Rig> = {
  calm: { key: new THREE.Color("#ffe3c0"), keyI: 2.7, rim: new THREE.Color("#86aaff"), rimI: 1.25, sky: new THREE.Color("#1d2a44"), fillI: 0.42 },
  crash: { key: new THREE.Color("#ffb4a4"), keyI: 1.55, rim: new THREE.Color("#ff2e48"), rimI: 3.0, sky: new THREE.Color("#2c0a12"), fillI: 0.28 },
  bull: { key: new THREE.Color("#fff1cc"), keyI: 3.1, rim: new THREE.Color("#3ee6a6"), rimI: 2.2, sky: new THREE.Color("#10302a"), fillI: 0.46 },
  bear: { key: new THREE.Color("#bfd3ff"), keyI: 2.0, rim: new THREE.Color("#6c8cff"), rimI: 1.9, sky: new THREE.Color("#132544"), fillI: 0.34 },
};

/** Soft elliptical falloff so the lacquer reflection has no hard edge. */
function softboxTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 0.5, 0, 0);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.45, "#9a9a9a");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Lighting({ tier }: { tier: TierSettings }) {
  const runtime = useRuntime();
  const softbox = useMemo(() => softboxTexture(), []);
  useEffect(() => () => softbox.dispose(), [softbox]);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);

  useFrame((_, delta) => {
    const rt = runtime.current;
    const rig = RIGS[rt.mood ?? "calm"];
    const k = rt.reduced ? 1 : dampFactor(3.2, Math.min(delta, 0.1));
    if (key.current) { key.current.color.lerp(rig.key, k); key.current.intensity += (rig.keyI - key.current.intensity) * k; }
    if (rim.current) { rim.current.color.lerp(rig.rim, k); rim.current.intensity += (rig.rimI - rim.current.intensity) * k; }
    if (fill.current) { fill.current.color.lerp(rig.sky, k); fill.current.intensity += (rig.fillI - fill.current.intensity) * k; }
  });

  const s = 11.5;
  return (
    <>
      <directionalLight
        ref={key}
        position={[-7.5, 17, 9.5]}
        intensity={RIGS.calm.keyI}
        color={RIGS.calm.key}
        castShadow={tier.shadows}
        shadow-mapSize-width={tier.shadowSize}
        shadow-mapSize-height={tier.shadowSize}
        shadow-camera-left={-s}
        shadow-camera-right={s}
        shadow-camera-top={s}
        shadow-camera-bottom={-s}
        shadow-camera-near={4}
        shadow-camera-far={48}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={tier.tier === "high" ? 5 : 3}
      />
      <directionalLight ref={rim} position={[7, 6.5, -15]} intensity={RIGS.calm.rimI} color={RIGS.calm.rim} />
      <hemisphereLight ref={fill} args={[RIGS.calm.sky, new THREE.Color("#1c130c"), RIGS.calm.fillI]} />
      <Environment resolution={tier.envResolution} frames={1} background={false} environmentIntensity={1}>
        <color attach="background" args={["#040508"]} />
        <Lightformer form="rect" intensity={2.2} color="#ffe6c4" scale={[14, 7, 1]} position={[0, 16, 2]} />
        <Lightformer form="rect" intensity={1.5} color="#ffeedd" scale={[30, 11, 1]} position={[0, 13, -13]} map={softbox} />
        <Lightformer form="rect" intensity={1.5} color="#d6e4ff" scale={[1.4, 20, 1]} position={[-15, 6, 0]} />
        <Lightformer form="rect" intensity={1.25} color="#ffd6a0" scale={[1.4, 20, 1]} position={[15, 6, 0]} />
        <Lightformer form="ring" intensity={1.6} color="#ffcf8a" scale={7} position={[0, 6, -17]} />
        <Lightformer form="rect" intensity={0.7} color="#fff3e0" scale={[24, 0.7, 1]} position={[0, 2, 17]} />
        <Lightformer form="circle" intensity={0.9} color="#7fa2ff" scale={5} position={[-10, 10, -10]} />
      </Environment>
    </>
  );
}
