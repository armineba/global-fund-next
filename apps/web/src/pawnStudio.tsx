/**
 * Dev-only figurine studio (apps/web/pawn-studio.html, never in the production
 * build input). Renders the 3D pieces in a refined 3/4 studio light.
 *
 *   ?piece=lion&size=1024   transparent portrait canvas; window.__pawnStudio.capture(512) → PNG data URL
 *   ?mode=sheet             all pieces side by side (idle / active / jailed)
 *   ?mode=review            the generated PNG portraits at UI sizes
 *   ?mode=globe             the armillary globe alone
 *   ?mode=hero&variant=menu the menu backdrop (menu | setup | lobby)
 *
 * scripts/redesign/render-pawns.ts drives the portrait mode headlessly.
 */
import { StrictMode, Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { PLAYER_COLORS, type PawnId, type ZoneId } from "@global-fund/shared";
import { PawnModel, PAWN_IDS, getPieceParts } from "./board/three/pawns";
import { ArmillaryGlobe } from "./board/three/globe";
import { transmissionBackdropMaterial, transmissionOnlyBeforeRender } from "./board/three/materials";
import { PAWN_META } from "./ui/theme";

const MenuHero = lazy(() => import("./board/three/MenuHero"));

declare global {
  interface Window {
    __pawnStudio?: { ready: boolean; frames: number; capture: (size: number) => string };
  }
}

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") ?? (params.get("piece") ? "portrait" : "sheet");
const quality = (params.get("quality") as "high" | "medium" | "low" | null) ?? "high";

/** Warm key, cool rim, soft fill; reflections from procedural softboxes only. */
function StudioLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <hemisphereLight args={["#3d4d6b", "#140f0a", 0.35 * intensity]} />
      <directionalLight position={[-2.6, 4.2, 3.2]} intensity={2.3 * intensity} color="#ffe2b8" />
      <directionalLight position={[2.8, 2.4, -3.2]} intensity={2.6 * intensity} color="#9ec5ff" />
      <directionalLight position={[0.5, -1.5, 2.5]} intensity={0.25 * intensity} color="#c99a5b" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.6} color="#ffe6c4" position={[-3, 3.6, 3]} scale={[4, 3, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="rect" intensity={3.2} color="#a6c8ff" position={[3.4, 2.2, -3]} scale={[0.9, 5, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="ring" intensity={1.8} color="#fff4e0" position={[0, 6, 0.5]} scale={3} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.3} color="#ffffff" position={[-4.2, 1.4, -1]} scale={[0.6, 4, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="rect" intensity={0.55} color="#b98a4a" position={[0, -2, 2.5]} scale={[8, 2, 1]} target={[0, 0.5, 0]} />
      </Environment>
    </>
  );
}

/** Hidden backdrop that gems refract (transparent output stays clean). */
function TransmissionBackdrop() {
  const material = useMemo(() => transmissionBackdropMaterial(), []);
  return <mesh material={material} onBeforeRender={transmissionOnlyBeforeRender} frustumCulled={false} renderOrder={-10}><sphereGeometry args={[30, 32, 16]} /></mesh>;
}

// ------------------------------------------------------------- portrait --
const PORTRAIT = { fov: 19, elevation: 0.24, yaw: 0.36, fill: 0.86, top: 1.07, base: 0.305 };

function PortraitCamera() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    camera.fov = PORTRAIT.fov;
    camera.near = 0.1;
    camera.far = 60;
    camera.aspect = 1;
    const direction = new THREE.Vector3(0, Math.sin(PORTRAIT.elevation), Math.cos(PORTRAIT.elevation));
    const points: THREE.Vector3[] = [new THREE.Vector3(0, PORTRAIT.top, 0)];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * PORTRAIT.base, 0, Math.sin(a) * PORTRAIT.base));
      points.push(new THREE.Vector3(Math.cos(a) * 0.3, 0.75, Math.sin(a) * 0.3));
    }
    let target = 0.52;
    let distance = 4;
    const ndc = new THREE.Vector3();
    for (let iteration = 0; iteration < 40; iteration++) {
      camera.position.set(0, target, 0).addScaledVector(direction, distance);
      camera.lookAt(0, target, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      let min = Infinity, max = -Infinity;
      for (const point of points) { ndc.copy(point).project(camera); min = Math.min(min, ndc.y); max = Math.max(max, ndc.y); }
      const centre = (min + max) / 2;
      target += centre * distance * Math.tan(THREE.MathUtils.degToRad(PORTRAIT.fov / 2)) * 0.9;
      distance *= (max - min) / (2 * PORTRAIT.fill);
    }
  }, [camera]);
  return null;
}

function PortraitCapture({ waitFor }: { waitFor: number }) {
  const { gl, scene, camera } = useThree();
  const frames = useRef(0);
  useEffect(() => {
    window.__pawnStudio = {
      ready: false,
      frames: 0,
      capture: (size: number) => {
        gl.render(scene, camera);
        const source = gl.domElement;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // Two-step downscale keeps fine gold edges crisp but alias-free.
        let current: HTMLCanvasElement = source;
        while (current.width / 2 >= size * 1.01) {
          const half = document.createElement("canvas");
          half.width = Math.round(current.width / 2);
          half.height = Math.round(current.height / 2);
          const hctx = half.getContext("2d")!;
          hctx.imageSmoothingEnabled = true;
          hctx.imageSmoothingQuality = "high";
          hctx.drawImage(current, 0, 0, half.width, half.height);
          current = half;
        }
        ctx.drawImage(current, 0, 0, size, size);
        return canvas.toDataURL("image/png");
      },
    };
  }, [gl, scene, camera]);
  useFrame(() => {
    frames.current += 1;
    if (window.__pawnStudio) {
      window.__pawnStudio.frames = frames.current;
      if (frames.current >= waitFor) window.__pawnStudio.ready = true;
    }
  });
  return null;
}

function Portrait({ piece, size }: { piece: PawnId; size: number }) {
  const [loaded, setLoaded] = useState(piece !== "globe");
  useEffect(() => {
    if (piece === "globe") { const timer = window.setTimeout(() => setLoaded(true), 900); return () => window.clearTimeout(timer); }
  }, [piece]);
  getPieceParts(piece, quality);
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        dpr={1}
        flat={false}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        camera={{ fov: PORTRAIT.fov, position: [0, 1, 4] }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.02; }}
        style={{ width: size, height: size }}
      >
        <PortraitCamera />
        <StudioLights />
        <TransmissionBackdrop />
        <PawnModel piece={piece} quality={quality} rotation={[0, PORTRAIT.yaw, 0]} reducedMotion />
        <PortraitCapture waitFor={loaded ? 12 : 1e9} />
      </Canvas>
    </div>
  );
}

// ----------------------------------------------------------------- sheet --
function SheetScene() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  useEffect(() => { camera.position.set(0, 1.9, 9.4); camera.lookAt(0, 0.95, 0); camera.updateProjectionMatrix(); }, [camera]);
  return (
    <>
      <StudioLights />
      {PAWN_IDS.map((piece, index) => (
        <group key={piece} position={[(index - 2.5) * 1.05, 0, 0]}>
          <PawnModel piece={piece} quality={quality} position={[0, 1.25, 0]} rotation={[0, 0.36, 0]} reducedMotion />
          <PawnModel piece={piece} quality={quality} seatColor={PLAYER_COLORS[index]} active={index % 2 === 0} jailed={index === 5} position={[0, -0.05, 1.2]} rotation={[0, 0.2, 0]} reducedMotion />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.051, 1.2]} receiveShadow>
        <planeGeometry args={[9, 2.6]} />
        <meshStandardMaterial color="#0b0f16" roughness={0.6} metalness={0.2} />
      </mesh>
    </>
  );
}

/** One piece from four angles (sculpt review). */
function TurnScene({ piece }: { piece: PawnId }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  useEffect(() => { camera.position.set(0, 1.25, 6.4); camera.lookAt(0, 0.58, 0); camera.updateProjectionMatrix(); }, [camera]);
  return (
    <>
      <StudioLights />
      {[0, 0.6, Math.PI / 2, Math.PI].map((yaw, index) => (
        <PawnModel key={index} piece={piece} quality={quality} position={[(index - 1.5) * 1.15, 0, 0]} rotation={[0, yaw, 0]} reducedMotion />
      ))}
    </>
  );
}

function Turn() {
  const piece = (params.get("piece") as PawnId | null) ?? "lion";
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ fov: 30 }} style={{ position: "fixed", inset: 0, background: "radial-gradient(70% 80% at 50% 40%, #1a2333 0%, #06080c 75%)" }}>
      <TurnScene piece={piece} />
      <TransmissionBackdrop />
      <PortraitCaptureFlag />
    </Canvas>
  );
}

function Sheet() {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ fov: 30 }} style={{ position: "fixed", inset: 0, background: "radial-gradient(70% 80% at 50% 40%, #1a2333 0%, #06080c 75%)" }}>
      <SheetScene />
      <TransmissionBackdrop />
      <PortraitCaptureFlag />
    </Canvas>
  );
}

/** Generic "rendered a few frames" flag for the screenshot script. */
function PortraitCaptureFlag() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    window.__pawnStudio = { ready: frames.current > 20, frames: frames.current, capture: () => "" };
  });
  return null;
}

// ---------------------------------------------------------------- review --
function Review() {
  const stamp = useMemo(() => Date.now(), []);
  useEffect(() => { document.body.classList.add("is-review"); window.__pawnStudio = { ready: true, frames: 0, capture: () => "" }; }, []);
  const sizes = [32, 44, 64, 96, 168, 256];
  const surfaces = [
    { name: "ink", background: "#04060a" },
    { name: "glass", background: "linear-gradient(180deg, rgba(20,28,41,.92), rgba(8,12,19,.96))" },
    { name: "parchment", background: "#e9e2d2" },
  ];
  return (
    <div style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif", color: "#cdc6b8" }}>
      {surfaces.map((surface) => (
        <div key={surface.name} style={{ background: surface.background, borderRadius: 14, padding: "18px 22px", marginBottom: 18, border: "1px solid rgba(226,196,134,.18)" }}>
          {PAWN_IDS.map((piece) => (
            <div key={piece} style={{ display: "flex", alignItems: "flex-end", gap: 18, padding: "6px 0" }}>
              <span style={{ width: 70, fontSize: 12, color: surface.name === "parchment" ? "#3a3326" : "#cdc6b8" }}>{PAWN_META[piece].name}</span>
              {sizes.map((size) => (
                <img key={size} src={`/assets/pawns/render/${piece}.png?v=${stamp}`} width={size} height={size} alt="" style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,.55))" }} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------- globe --
function GlobeReview() {
  const [zone, setZone] = useState<ZoneId | null>(null);
  useEffect(() => {
    const cycle: Array<ZoneId | null> = [null, "europe", "asia", "americas", "oceania", "africa"];
    if (params.get("cycle") !== "1") { setZone((params.get("zone") as ZoneId | null) ?? null); return; }
    let i = 0;
    const timer = window.setInterval(() => { i = (i + 1) % cycle.length; setZone(cycle[i]!); }, 3000);
    return () => window.clearInterval(timer);
  }, []);
  const now = useMemo(() => performance.now(), []);
  const reduced = params.get("reduced") === "1";
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ fov: 32, position: [0, 2.6, 8.6] }} style={{ position: "fixed", inset: 0, background: "radial-gradient(70% 80% at 50% 45%, #142033 0%, #05070b 72%)" }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
      <StudioLights intensity={0.8} />
      <ArmillaryGlobe
        reducedMotion={reduced}
        quality={quality}
        zoneGrades={{ americas: "B", europe: "A", asia: "C", africa: "D", oceania: "E" }}
        focusZone={zone}
        activeZone="europe"
        labels
        markers={[
          { playerId: "p1", zoneId: "europe", seatColor: PLAYER_COLORS[0]!, pawn: "lion", active: true, jailed: false },
          { playerId: "p2", zoneId: "europe", seatColor: PLAYER_COLORS[1]!, pawn: "bull", active: false, jailed: false },
          { playerId: "p3", zoneId: "asia", seatColor: PLAYER_COLORS[2]!, pawn: "globe", active: false, jailed: false },
          { playerId: "p4", zoneId: "americas", seatColor: PLAYER_COLORS[3]!, pawn: "crystal", active: false, jailed: true },
        ]}
        flight={params.get("flight") === "1" ? { key: "f1", fromZone: "europe", toZone: "asia", seatColor: PLAYER_COLORS[0]!, startedAt: now + 600, durationMs: 4000 } : null}
        preview={params.get("preview") === "1" ? { fromZone: "europe", toZone: "americas" } : null}
        impact={params.get("impact") === "1" ? { zoneId: "africa", direction: "down", key: "i1" } : null}
      />
      <PortraitCaptureFlag />
    </Canvas>
  );
}

// ------------------------------------------------------------------ hero --
function HeroReview() {
  const variant = (params.get("variant") as "menu" | "setup" | "lobby" | null) ?? "menu";
  const [current, setCurrent] = useState(variant);
  const [focus, setFocus] = useState<PawnId | null>((params.get("focus") as PawnId | null) ?? "bull");
  useEffect(() => {
    window.__pawnStudio = { ready: false, frames: 0, capture: () => "" };
    const timer = window.setTimeout(() => { if (window.__pawnStudio) window.__pawnStudio.ready = true; }, Number(params.get("wait") ?? 3500));
    if (params.get("cycle") !== "1") return () => window.clearTimeout(timer);
    const order: Array<"menu" | "setup" | "lobby"> = ["menu", "setup", "lobby"];
    let i = 0;
    const cycle = window.setInterval(() => { i = (i + 1) % 3; setCurrent(order[i]!); setFocus(PAWN_IDS[(i * 2) % 6]!); }, 4000);
    return () => { window.clearTimeout(timer); window.clearInterval(cycle); };
  }, []);
  const pawns = (params.get("pawns")?.split(",") as PawnId[] | undefined) ?? PAWN_IDS;
  return (
    <Suspense fallback={null}>
      <MenuHero variant={current} pawns={pawns} focusPawn={focus} quality={quality} reducedMotion={params.get("reduced") === "1" ? true : params.get("reduced") === "0" ? false : undefined} />
    </Suspense>
  );
}

function Studio() {
  if (mode === "portrait") {
    const piece = (params.get("piece") as PawnId) ?? "lion";
    return <Portrait piece={PAWN_IDS.includes(piece) ? piece : "lion"} size={Number(params.get("size") ?? 1024)} />;
  }
  if (mode === "review") return <Review />;
  if (mode === "globe") return <GlobeReview />;
  if (mode === "hero") return <HeroReview />;
  if (mode === "turn") return <Turn />;
  return <Sheet />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Studio /></StrictMode>);
