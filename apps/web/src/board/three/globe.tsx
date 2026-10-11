/**
 * Armillary globe (presentation only): obsidian sphere with gold-engraved
 * coastlines and NASA night lights, a thin fresnel atmosphere, brass
 * armillary rings, five zone pins with floating labels, fund markers (gems in
 * the seat colour), flight arcs and travel previews.
 *
 * The globe is centred on its group origin; `radius` is in world units.
 * Everything is presentation: it reacts to props and never issues commands.
 */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import type { Grade, PawnId, ZoneId } from "@global-fund/shared";
import { GRADE_META, ZONE_META } from "../../ui/theme";
import { OBJECT_PALETTE, loadLandRings, pieceMaterial, radialGlowTexture, traceLand } from "./materials";

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
  /** Optional: the travelling fund; its marker rides the comet instead of waiting at a pin. */
  playerId?: string;
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
  /**
   * Where a focused city should face: "camera" (default) turns it towards the
   * viewer; a vector is a fixed direction in the globe group's local space.
   */
  facing?: "camera" | [number, number, number];
  /** Brass armillary rings (default true). */
  rings?: boolean;
  /** Label height in world units (default 0.085 × radius). */
  labelSize?: number;
  /** Called once, after the engraved textures are on screen. */
  onReady?: () => void;
}

const DEG = Math.PI / 180;
const ZONES = Object.keys(ZONE_META) as ZoneId[];

/** Position of a lat/lon on a sphere, matching THREE.SphereGeometry's UV layout. */
export function latLonToVector(lat: number, lon: number, radius = 1, out = new THREE.Vector3()) {
  const phi = (lon + 180) * DEG;
  const la = lat * DEG;
  return out.set(-Math.cos(phi) * Math.cos(la) * radius, Math.sin(la) * radius, Math.sin(phi) * Math.cos(la) * radius);
}

const zoneUnit = new Map<ZoneId, THREE.Vector3>(ZONES.map((zone) => [zone, latLonToVector(ZONE_META[zone].lat, ZONE_META[zone].lon)]));
const unitOf = (zone: ZoneId | null | undefined) => (zone ? zoneUnit.get(zone) ?? null : null);

// =========================================================================
// Engraved textures (built once per resolution, shared by every globe)
// =========================================================================
interface GlobeTextures { map: THREE.Texture; orm: THREE.Texture; emissive: THREE.Texture }
const texturePromises = new Map<number, Promise<GlobeTextures | null>>();

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawGraticule(ctx: CanvasRenderingContext2D, w: number, h: number) {
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * w;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * h;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

async function buildGlobeTextures(width: number): Promise<GlobeTextures | null> {
  const [rings, lights] = await Promise.all([loadLandRings(), loadImage("/assets/world/nasa-black-marble-2016.jpg")]);
  if (!rings.length) return null;
  const w = width, h = width / 2;
  const line = Math.max(1.2, width / 1100);
  const canvas = () => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d", { willReadFrequently: false })!] as const; };

  // Colour: deep ocean, very dark land, crisp gold coastlines, faint graticule.
  const [colour, c] = canvas();
  const ocean = c.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, "#060b14");
  ocean.addColorStop(0.5, "#07101c");
  ocean.addColorStop(1, "#060b14");
  c.fillStyle = ocean;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(214, 178, 106, 0.16)";
  c.lineWidth = line * 0.6;
  drawGraticule(c, w, h);
  c.fillStyle = "#0e1117";
  traceLand(c, rings, w, h, "fill");
  c.lineJoin = "round";
  c.lineCap = "round";
  c.strokeStyle = "#e6c27a";
  c.lineWidth = line * 1.25;
  traceLand(c, rings, w, h, "stroke");

  // Roughness (G) / metalness (B): polished obsidian seas, satin land, gold inlay.
  const [orm, o] = canvas();
  o.fillStyle = "rgb(0, 38, 0)";
  o.fillRect(0, 0, w, h);
  o.strokeStyle = "rgb(0, 60, 150)";
  o.lineWidth = line * 0.6;
  drawGraticule(o, w, h);
  o.fillStyle = "rgb(0, 112, 20)";
  traceLand(o, rings, w, h, "fill");
  o.lineJoin = "round";
  o.strokeStyle = "rgb(0, 52, 255)";
  o.lineWidth = line * 1.25;
  traceLand(o, rings, w, h, "stroke");

  // Emission: warm city lights (thresholded) + a faint glow along the gold coastlines.
  const [emissive, e] = canvas();
  e.fillStyle = "#000";
  e.fillRect(0, 0, w, h);
  if (lights) {
    e.drawImage(lights, 0, 0, w, h);
    const pixels = e.getImageData(0, 0, w, h);
    const data = pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.max(data[i]!, data[i + 1]!, data[i + 2]!) / 255;
      const v = Math.pow(Math.max(0, (lum - 0.2) / 0.8), 1.25);
      data[i] = 255 * Math.min(1, v * 1.05);
      data[i + 1] = 205 * Math.min(1, v);
      data[i + 2] = 130 * Math.min(1, v * 0.9);
    }
    e.putImageData(pixels, 0, 0);
  }
  e.globalCompositeOperation = "lighter";
  e.strokeStyle = "rgba(230, 190, 110, 0.22)";
  e.lineJoin = "round";
  e.lineWidth = line * 1.25;
  traceLand(e, rings, w, h, "stroke");
  e.globalCompositeOperation = "source-over";

  const make = (source: HTMLCanvasElement, srgb: boolean) => {
    const texture = new THREE.CanvasTexture(source);
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = 8;
    texture.wrapS = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  };
  return { map: make(colour, true), orm: make(orm, false), emissive: make(emissive, true) };
}

function globeTextures(width: number) {
  let promise = texturePromises.get(width);
  if (!promise) {
    promise = typeof document === "undefined" ? Promise.resolve(null) : buildGlobeTextures(width).catch(() => null);
    texturePromises.set(width, promise);
  }
  return promise;
}

// =========================================================================
// Cached geometry & materials
// =========================================================================
const geometryCache = new Map<string, THREE.BufferGeometry>();
function cached<T extends THREE.BufferGeometry>(key: string, build: () => T): T {
  let geometry = geometryCache.get(key) as T | undefined;
  if (!geometry) { geometry = build(); geometryCache.set(key, geometry); }
  return geometry;
}

function bandGeometry(radius: number, width: number, thickness: number, segments: number) {
  const r0 = radius - thickness / 2, r1 = radius + thickness / 2, hw = width / 2, b = Math.min(thickness, width) * 0.3;
  const profile = [
    [r0 + b, -hw], [r1 - b, -hw], [r1, -hw + b], [r1, hw - b], [r1 - b, hw], [r0 + b, hw], [r0, hw - b], [r0, -hw + b], [r0 + b, -hw],
  ].map(([x, y]) => new THREE.Vector2(x!, y!));
  return new THREE.LatheGeometry(profile, segments);
}

const sphereMaterials = new Map<string, THREE.MeshStandardMaterial>();
function sphereMaterial(quality: GlobeProps["quality"]) {
  let material = sphereMaterials.get(quality);
  if (!material) {
    const params: THREE.MeshPhysicalMaterialParameters = {
      color: OBJECT_PALETTE.obsidian, roughness: 0.22, metalness: 0.1, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0, envMapIntensity: 1,
    };
    material = quality === "low"
      ? new THREE.MeshStandardMaterial(params as THREE.MeshStandardMaterialParameters)
      : new THREE.MeshPhysicalMaterial({ ...params, clearcoat: 0.7, clearcoatRoughness: 0.07 });
    material.name = `gf-obsidian-${quality}`;
    sphereMaterials.set(quality, material);
  }
  return material;
}

function applyTextures(material: THREE.MeshStandardMaterial, textures: GlobeTextures) {
  if (material.map === textures.map) return;
  material.color.set("#ffffff");
  material.map = textures.map;
  material.roughnessMap = textures.orm;
  material.metalnessMap = textures.orm;
  material.roughness = 1;
  material.metalness = 1;
  material.emissiveMap = textures.emissive;
  material.emissiveIntensity = 2.1;
  material.needsUpdate = true;
}

let atmosphereMaterial: THREE.ShaderMaterial | null = null;
function getAtmosphereMaterial() {
  if (!atmosphereMaterial) {
    atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      toneMapped: false,
      uniforms: { uColor: { value: new THREE.Color(OBJECT_PALETTE.atmosphere) }, uWarm: { value: new THREE.Color("#e8c27c") }, uStrength: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec3 vNormalV;
        varying vec3 vViewDir;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormalV = normalize(normalMatrix * normal);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uWarm;
        uniform float uStrength;
        varying vec3 vNormalV;
        varying vec3 vViewDir;
        void main() {
          float facing = clamp(dot(normalize(vNormalV), normalize(vViewDir)), 0.0, 1.0);
          float rim = pow(1.0 - facing, 3.2);
          vec3 col = mix(uColor, uWarm, smoothstep(0.2, 0.9, vNormalV.y * 0.5 + 0.5) * 0.25);
          gl_FragColor = vec4(col * rim * 0.95 * uStrength, rim * uStrength);
        }`,
    });
  }
  return atmosphereMaterial;
}

let arcProgram: { vertexShader: string; fragmentShader: string } | null = null;
function arcMaterial(color: string, dashed: boolean) {
  arcProgram ??= {
    vertexShader: /* glsl */ `
      varying float vU;
      void main() {
        vU = uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uHead;
      uniform float uTail;
      uniform float uOpacity;
      uniform float uDash;
      uniform float uTime;
      varying float vU;
      void main() {
        float a;
        if (uDash > 0.5) {
          float d = fract(vU * 26.0 - uTime * 0.55);
          a = smoothstep(0.0, 0.1, d) * (1.0 - smoothstep(0.46, 0.56, d)) * 0.9;
          a *= smoothstep(0.0, 0.04, vU) * (1.0 - smoothstep(0.96, 1.0, vU));
        } else {
          float behind = uHead - vU;
          if (behind < 0.0) discard;
          a = 0.3 + 0.7 * exp(-behind / max(uTail, 0.001));
        }
        gl_FragColor = vec4(uColor * (0.7 + 1.6 * a), a * uOpacity);
      }`,
  };
  return new THREE.ShaderMaterial({
    ...arcProgram,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uHead: { value: 0 },
      uTail: { value: 0.3 },
      uOpacity: { value: 1 },
      uDash: { value: dashed ? 1 : 0 },
      uTime: { value: 0 },
    },
  });
}

/** Great-circle arc lifted above the surface (local globe space). */
function arcCurve(from: THREE.Vector3, to: THREE.Vector3, radius: number) {
  const omega = Math.acos(THREE.MathUtils.clamp(from.dot(to), -1, 1));
  const lift = radius * (0.06 + 0.24 * (omega / Math.PI));
  const points: THREE.Vector3[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = omega < 1e-4 ? from.clone() : from.clone().multiplyScalar(Math.sin((1 - t) * omega)).addScaledVector(to, Math.sin(t * omega)).divideScalar(Math.sin(omega));
    points.push(p.normalize().multiplyScalar(radius * 1.008 + lift * Math.sin(Math.PI * t)));
  }
  return new THREE.CatmullRomCurve3(points);
}

const markerMaterials = new Map<string, THREE.MeshStandardMaterial>();
function markerMaterial(color: string, state: "idle" | "active" | "jailed") {
  const key = `${color}|${state}`;
  let material = markerMaterials.get(key);
  if (!material) {
    const tint = state === "jailed" ? new THREE.Color("#3a3d44") : new THREE.Color(color);
    material = new THREE.MeshStandardMaterial({
      color: tint,
      emissive: state === "jailed" ? new THREE.Color(OBJECT_PALETTE.rubyGlow) : new THREE.Color(color),
      emissiveIntensity: state === "active" ? 1.9 : state === "jailed" ? 0.5 : 0.55,
      metalness: 0.35,
      roughness: 0.16,
      flatShading: true,
      toneMapped: state !== "active",
    });
    markerMaterials.set(key, material);
  }
  return material;
}

// =========================================================================
// Labels (canvas sprites: Cinzel city + grade jewel)
// =========================================================================
const labelTextures = new Map<string, THREE.CanvasTexture>();
let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  if (!fontsReady && typeof document !== "undefined" && document.fonts) {
    fontsReady = Promise.all([document.fonts.load("600 44px Cinzel"), document.fonts.load("800 40px Inter")]).catch(() => null);
  }
  return fontsReady ?? Promise.resolve(null);
}

function labelTexture(zone: ZoneId, grade: Grade, active: boolean) {
  const key = `${zone}|${grade}|${active ? 1 : 0}`;
  let texture = labelTextures.get(key);
  if (texture) return texture;
  const scale = 2;
  const height = 48 * scale;
  const city = ZONE_META[zone].city.toUpperCase();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `600 ${21 * scale}px Cinzel, "Cormorant Garamond", serif`;
  ctx.font = font;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${2.2 * scale}px`;
  const textWidth = ctx.measureText(city).width;
  const jewel = 17 * scale;
  const pad = 12 * scale;
  const width = Math.ceil(pad + jewel * 2 + 10 * scale + textWidth + pad * 1.15);
  canvas.width = width;
  canvas.height = height;
  // Glass pill with a brass hairline.
  const r = height / 2 - 2;
  ctx.beginPath();
  ctx.roundRect(2, 2, width - 4, height - 4, r);
  ctx.fillStyle = active ? "rgba(26, 21, 12, 0.82)" : "rgba(6, 9, 14, 0.72)";
  ctx.fill();
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeStyle = active ? "rgba(239, 217, 167, 0.85)" : "rgba(226, 196, 134, 0.42)";
  ctx.stroke();
  // Grade jewel.
  const meta = GRADE_META[grade] ?? GRADE_META.C;
  const cx = pad + jewel - 2 * scale, cy = height / 2;
  const g = ctx.createRadialGradient(cx - jewel * 0.35, cy - jewel * 0.45, jewel * 0.1, cx, cy, jewel);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.28, meta.color);
  g.addColorStop(1, new THREE.Color(meta.color).multiplyScalar(0.55).getStyle());
  ctx.beginPath();
  ctx.arc(cx, cy, jewel - 3 * scale, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = "#0a0e14";
  ctx.font = `800 ${19 * scale}px Inter, system-ui, sans-serif`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(grade, cx, cy + 1 * scale);
  // City.
  ctx.font = font;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${2.2 * scale}px`;
  ctx.textAlign = "left";
  ctx.fillStyle = active ? "#f6e7c4" : "#e9dcc0";
  ctx.fillText(city, cx + jewel + 8 * scale, cy + 1.5 * scale);
  texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  labelTextures.set(key, texture);
  return texture;
}

// =========================================================================
// Component
// =========================================================================
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _c = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const smooth = (edge0: number, edge1: number, x: number) => { const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1); return t * t * (3 - 2 * t); };
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Spin that brings longitude ~15°E (Europe / Africa) to the front by default. */
const HOME = latLonToVector(18, 15);
const HOME_SPIN = -Math.atan2(HOME.x, HOME.z);

export const ArmillaryGlobe = memo(function ArmillaryGlobe({
  radius = 2.4, reducedMotion, quality, zoneGrades, focusZone, activeZone, markers, flight, preview, impact, labels,
  facing = "camera", rings = true, labelSize, onReady, ...group
}: GlobeProps & ThreeElements["group"]) {
  const R = radius;
  const { camera, invalidate } = useThree();
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const ecliptic = useRef<THREE.Group>(null);
  const pose = useRef({ spin: HOME_SPIN, tilt: 0, axis: new THREE.Vector3(-1, 0, 0) });
  const ready = useRef<"waiting" | "applied" | "done">("waiting");
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const detail = quality === "low" ? 0 : quality === "medium" ? 1 : 2;
  const material = sphereMaterial(quality);
  const [, setTexturesVersion] = useState(0);

  // Engraved textures (async, shared). Labels need the fonts before drawing.
  useEffect(() => {
    let alive = true;
    globeTextures(quality === "low" ? 1024 : 2048).then((textures) => {
      if (!alive) return;
      if (textures) applyTextures(material, textures);
      ready.current = "applied";
      setTexturesVersion((v) => v + 1);
      invalidate();
    });
    return () => { alive = false; };
  }, [material, quality, invalidate]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    if (!labels) return;
    let alive = true;
    ensureFonts().then(() => { if (alive) { setFontsLoaded(true); invalidate(); } });
    return () => { alive = false; };
  }, [labels, invalidate]);

  const sphereGeometry = cached(`sphere|${detail}`, () => new THREE.SphereGeometry(1, [64, 112, 160][detail]!, [44, 80, 112][detail]!));
  const atmosphereGeometry = cached(`atmo|${detail}`, () => new THREE.SphereGeometry(1, [48, 72, 96][detail]!, [32, 48, 64][detail]!));
  const segments = [96, 160, 220][detail]!;
  const equatorGeometry = cached(`equator|${detail}`, () => bandGeometry(1.105, 0.022, 0.012, segments));
  const eclipticGeometry = cached(`ecliptic|${detail}`, () => bandGeometry(1.17, 0.07, 0.014, segments));
  const meridianGeometry = cached(`meridian|${detail}`, () => bandGeometry(1.25, 0.03, 0.016, segments));
  const tickGeometry = cached("tick", () => new THREE.BoxGeometry(1, 1, 1));
  const pinGeometry = cached(`pin|${detail}`, () => {
    const needle = new THREE.CylinderGeometry(0.0055, 0.0035, 0.072, 10, 1).translate(0, 0.036, 0);
    return needle;
  });
  const headGeometry = cached(`head|${detail}`, () => new THREE.SphereGeometry(0.019, 20, 14));
  const socketGeometry = cached("socket", () => new THREE.TorusGeometry(0.016, 0.0035, 8, 32).rotateX(Math.PI / 2));
  const gemGeometry = cached("gem", () => new THREE.OctahedronGeometry(0.024, 0).scale(1, 1.55, 1).translate(0, 0.04, 0));
  const pulseGeometry = cached("pulse", () => new THREE.RingGeometry(0.02, 0.028, 48).rotateX(-Math.PI / 2));

  const brass = pieceMaterial("brass", quality) as THREE.MeshStandardMaterial;
  const gold = pieceMaterial("gold", quality) as THREE.MeshStandardMaterial;
  const onyx = pieceMaterial("onyx", quality) as THREE.MeshStandardMaterial;
  const activeHead = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffe2a0", emissive: new THREE.Color("#ffc96b"), emissiveIntensity: 2.4, metalness: 0.6, roughness: 0.2, toneMapped: false }), []);
  const glowSprite = useMemo(() => new THREE.SpriteMaterial({ map: radialGlowTexture(), color: new THREE.Color("#ffcf7a"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.8 }), []);
  const pulseMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#38d59b", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }), []);
  useEffect(() => () => { activeHead.dispose(); glowSprite.dispose(); pulseMaterial.dispose(); }, [activeHead, glowSprite, pulseMaterial]);

  // Engraved ticks on the ecliptic band (instanced, set once).
  const ticks = useMemo(() => {
    const mesh = new THREE.InstancedMesh(tickGeometry, onyx, 72);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const major = i % 6 === 0;
      m.compose(
        new THREE.Vector3(Math.cos(a) * 1.177, 0, Math.sin(a) * 1.177),
        new THREE.Quaternion().setFromAxisAngle(UP, -a),
        new THREE.Vector3(0.004, major ? 0.06 : 0.032, 0.006),
      );
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [tickGeometry, onyx]);
  useEffect(() => () => ticks.dispose(), [ticks]);

  // Pins: local orientation (needle along the surface normal).
  const pins = useMemo(() => ZONES.map((zone) => {
    const normal = zoneUnit.get(zone)!.clone();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, normal);
    return { zone, normal, quaternion };
  }), []);

  // Markers grouped around their zone pin.
  const markerLayout = useMemo(() => {
    const byZone = new Map<ZoneId, GlobeMarker[]>();
    for (const marker of markers) {
      if (!zoneUnit.has(marker.zoneId)) continue;
      const list = byZone.get(marker.zoneId) ?? [];
      list.push(marker);
      byZone.set(marker.zoneId, list);
    }
    const out: Array<{ marker: GlobeMarker; position: THREE.Vector3; quaternion: THREE.Quaternion }> = [];
    for (const [zone, list] of byZone) {
      const normal = zoneUnit.get(zone)!;
      const tangent = new THREE.Vector3().crossVectors(UP, normal).normalize();
      if (tangent.lengthSq() < 1e-6) tangent.set(1, 0, 0);
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      list.forEach((marker, index) => {
        const angle = (index / Math.max(1, list.length)) * Math.PI * 2 + Math.PI / 4;
        const ring = 0.058 + 0.006 * Math.max(0, list.length - 3);
        const position = normal.clone().multiplyScalar(1.002)
          .addScaledVector(tangent, Math.cos(angle) * ring)
          .addScaledVector(bitangent, Math.sin(angle) * ring)
          .normalize().multiplyScalar(1.002);
        out.push({ marker, position, quaternion: new THREE.Quaternion().setFromUnitVectors(UP, position.clone().normalize()) });
      });
    }
    return out;
  }, [markers]);

  // Flight & preview arcs.
  const flightArc = useMemo(() => {
    if (!flight) return null;
    const from = unitOf(flight.fromZone), to = unitOf(flight.toZone);
    if (!from || !to || flight.fromZone === flight.toZone) return null;
    const curve = arcCurve(from, to, 1);
    const geometry = new THREE.TubeGeometry(curve, 120, 0.0065, 6, false);
    return { curve, geometry, material: arcMaterial(flight.seatColor, false), key: flight.key };
  }, [flight]);
  useEffect(() => () => { flightArc?.geometry.dispose(); flightArc?.material.dispose(); }, [flightArc]);
  const previewArc = useMemo(() => {
    if (!preview?.fromZone) return null;
    const from = unitOf(preview.fromZone), to = unitOf(preview.toZone);
    if (!from || !to || preview.fromZone === preview.toZone) return null;
    const curve = arcCurve(from, to, 1);
    return { geometry: new THREE.TubeGeometry(curve, 120, 0.0052, 6, false), material: arcMaterial("#efd9a7", true) };
  }, [preview?.fromZone, preview?.toZone]);
  useEffect(() => () => { previewArc?.geometry.dispose(); previewArc?.material.dispose(); }, [previewArc]);

  const comet = useRef<THREE.Group>(null);
  const cometSprite = useMemo(() => new THREE.SpriteMaterial({ map: radialGlowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  useEffect(() => () => cometSprite.dispose(), [cometSprite]);
  useEffect(() => { if (flight) cometSprite.color.set(flight.seatColor); }, [flight, cometSprite]);

  // Reduced motion renders on demand: wake the canvas when a flight starts and ends.
  useEffect(() => {
    if (!flight) return;
    const now = performance.now();
    const timers = [flight.startedAt - now, flight.startedAt + flight.durationMs - now, flight.startedAt + flight.durationMs + 800 - now]
      .filter((delay) => delay > 0).map((delay) => window.setTimeout(() => invalidate(), delay + 16));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [flight, invalidate]);

  // Impact pulse bookkeeping.
  const impactStart = useRef(0);
  useEffect(() => {
    if (!impact) return;
    impactStart.current = performance.now();
    pulseMaterial.color.set(impact.direction === "up" ? "#38d59b" : "#f06b74");
    invalidate();
  }, [impact?.key, impact, pulseMaterial, invalidate]);

  const labelRefs = useRef(new Map<ZoneId, THREE.Sprite>());
  const pulseRef = useRef<THREE.Mesh>(null);
  const activeGlowRef = useRef<THREE.Sprite>(null);
  const markerRefs = useRef(new Map<string, THREE.Object3D>());

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const now = performance.now();
    const t = state.clock.elapsedTime;
    const group = root.current, tiltGroup = tilt.current, spinGroup = spin.current;
    if (!group || !tiltGroup || !spinGroup) return;

    // --- orientation: spin + tilt so the focused city faces the viewer.
    if (facing === "camera") {
      group.updateWorldMatrix(true, false);
      group.worldToLocal(_v.copy(camera.position));
      if (_v.lengthSq() < 1e-8) _v.set(0, 0, 1);
      _v.normalize();
    } else {
      _v.set(facing[0], facing[1], facing[2]).normalize();
    }
    const azF = Math.atan2(_v.x, _v.z);
    const elevF = Math.asin(THREE.MathUtils.clamp(_v.y, -1, 1));
    const target = unitOf(focusZone ?? null);
    const p = pose.current;
    let wantSpin = p.spin;
    let wantTilt = 0;
    if (target) {
      wantSpin = p.spin + wrapAngle(azF - Math.atan2(target.x, target.z) - p.spin);
      wantTilt = THREE.MathUtils.clamp(elevF - Math.asin(target.y), -0.62, 0.62);
    }
    p.axis.set(-Math.cos(azF), 0, Math.sin(azF));
    if (reducedMotion) {
      if (target) { p.spin = wantSpin; p.tilt = wantTilt; }
      else p.tilt = 0;
    } else {
      const k = 1 - Math.exp(-dt * 3.6);
      if (target) p.spin += (wantSpin - p.spin) * k;
      else p.spin += dt * 0.045;
      p.tilt += (wantTilt - p.tilt) * k;
    }
    tiltGroup.quaternion.copy(_q.setFromAxisAngle(p.axis, p.tilt));
    spinGroup.rotation.y = p.spin;
    if (ecliptic.current && !reducedMotion) ecliptic.current.rotation.y += dt * 0.06;

    // --- labels fade on the far side.
    if (labels) {
      spinGroup.updateWorldMatrix(true, false);
      group.getWorldPosition(_c);
      for (const [zone, sprite] of labelRefs.current) {
        const unit = zoneUnit.get(zone)!;
        _w.copy(unit).multiplyScalar(R).applyMatrix4(spinGroup.matrixWorld);
        const toCamera = _v.copy(camera.position).sub(_w).normalize();
        const normal = _w.sub(_c).normalize();
        const opacity = smooth(0.08, 0.4, normal.dot(toCamera));
        (sprite.material as THREE.SpriteMaterial).opacity = opacity;
        sprite.visible = opacity > 0.01;
      }
    }

    // --- active pin glow.
    const pulse = reducedMotion ? 0.65 : 0.5 + 0.5 * Math.sin(t * 2.4);
    activeHead.emissiveIntensity = 1.6 + 1.4 * pulse;
    if (activeGlowRef.current) {
      glowSprite.opacity = 0.45 + 0.4 * pulse;
      activeGlowRef.current.scale.setScalar(R * (0.13 + 0.03 * pulse));
    }

    // --- impact pulse ring.
    if (pulseRef.current) {
      if (impact) {
        const elapsed = (now - impactStart.current) / 1000;
        const phase = reducedMotion ? 0.45 : (elapsed % 1.3) / 1.3;
        pulseRef.current.visible = reducedMotion || elapsed < 3.9;
        pulseRef.current.scale.setScalar(R * (1 + phase * 3.4));
        pulseMaterial.opacity = (1 - phase) * 0.95;
      } else pulseRef.current.visible = false;
    }

    // --- flight arc + comet (the travelling fund's gem rides the comet).
    if (flightArc && flight && comet.current) {
      const raw = (now - flight.startedAt) / Math.max(1, flight.durationMs);
      const uniforms = flightArc.material.uniforms;
      const mesh = comet.current;
      if (raw < 0) {
        uniforms.uOpacity!.value = 0;
        mesh.visible = false;
      } else if (reducedMotion) {
        const visible = raw <= 1;
        uniforms.uHead!.value = 1;
        uniforms.uTail!.value = 10;
        uniforms.uOpacity!.value = visible ? 0.9 : 0;
        mesh.visible = false;
      } else if (raw <= 1) {
        const head = easeInOut(raw);
        uniforms.uHead!.value = head;
        uniforms.uTail!.value = 0.28;
        uniforms.uOpacity!.value = 1;
        flightArc.curve.getPointAt(head, mesh.position);
        mesh.quaternion.setFromUnitVectors(UP, _w.copy(mesh.position).normalize());
        mesh.visible = true;
        mesh.scale.setScalar(1);
      } else {
        const fade = Math.min(1, (raw - 1) * flight.durationMs / 800);
        uniforms.uHead!.value = 1;
        uniforms.uOpacity!.value = 1 - fade;
        mesh.visible = fade < 1;
        mesh.scale.setScalar(1 - fade);
      }
      const riding = flight.playerId && raw >= 0 && raw <= 1 && !reducedMotion;
      for (const [playerId, object] of markerRefs.current) object.visible = !(riding && playerId === flight.playerId);
    } else {
      for (const object of markerRefs.current.values()) object.visible = true;
    }
    if (previewArc) previewArc.material.uniforms.uTime!.value = reducedMotion ? 0 : t;

    // --- active fund gems turn slowly.
    if (!reducedMotion) for (const { marker } of markerLayout) {
      if (!marker.active) continue;
      const object = markerRefs.current.get(marker.playerId)?.children[0];
      if (object) object.rotation.y = t * 1.2;
    }

    if (ready.current === "applied") {
      ready.current = "done";
      onReadyRef.current?.();
    }
  });

  const activePin = activeZone ? pins.find((pin) => pin.zone === activeZone) : undefined;
  const impactPin = impact ? pins.find((pin) => pin.zone === impact.zoneId) : undefined;
  const previewPin = preview ? pins.find((pin) => pin.zone === preview.toZone) : undefined;
  const size = labelSize ?? R * 0.085;

  return (
    <group ref={root} {...group}>
      <group ref={tilt}>
        <group ref={spin}>
          <mesh geometry={sphereGeometry} material={material} scale={R} castShadow receiveShadow />
          {pins.map((pin) => (
            <group key={pin.zone} position={pin.normal.clone().multiplyScalar(R)} quaternion={pin.quaternion} scale={R}>
              <mesh geometry={socketGeometry} material={brass} />
              <mesh geometry={pinGeometry} material={gold} />
              <mesh
                geometry={headGeometry}
                material={pin.zone === activeZone || pin.zone === previewPin?.zone ? activeHead : gold}
                position={[0, 0.074, 0]}
              />
            </group>
          ))}
          {activePin && (
            <sprite ref={activeGlowRef} material={glowSprite} position={activePin.normal.clone().multiplyScalar(R * 1.074)} scale={R * 0.14} renderOrder={3} />
          )}
          {impactPin && (
            <mesh ref={pulseRef} geometry={pulseGeometry} material={pulseMaterial} position={impactPin.normal.clone().multiplyScalar(R * 1.004)} quaternion={impactPin.quaternion} scale={R} renderOrder={4} />
          )}
          {labels && fontsLoaded && pins.map((pin) => {
            const grade = (zoneGrades[pin.zone] ?? "C") as Grade;
            const texture = labelTexture(pin.zone, grade, pin.zone === activeZone);
            const aspect = texture.image.width / texture.image.height;
            return (
              <sprite
                key={`${pin.zone}-${grade}-${pin.zone === activeZone ? 1 : 0}`}
                ref={(sprite) => { if (sprite) labelRefs.current.set(pin.zone, sprite); else labelRefs.current.delete(pin.zone); }}
                position={pin.normal.clone().multiplyScalar(R * 1.1)}
                scale={[size * aspect, size, 1]}
                center={new THREE.Vector2(-0.06, 0.5)}
                renderOrder={10}
              >
                <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
              </sprite>
            );
          })}
          {markerLayout.map(({ marker, position, quaternion }) => (
            <group
              key={marker.playerId}
              ref={(object) => { if (object) markerRefs.current.set(marker.playerId, object); else markerRefs.current.delete(marker.playerId); }}
              position={position.clone().multiplyScalar(R)}
              quaternion={quaternion}
              scale={R}
            >
              <mesh geometry={gemGeometry} material={markerMaterial(marker.seatColor, marker.jailed ? "jailed" : marker.active ? "active" : "idle")} castShadow />
            </group>
          ))}
          {flightArc && (
            <>
              <mesh geometry={flightArc.geometry} material={flightArc.material} scale={R} renderOrder={6} />
              <group scale={R}>
                <group ref={comet} visible={false}>
                  <mesh geometry={gemGeometry} material={markerMaterial(flight!.seatColor, "active")} position={[0, -0.04, 0]} />
                  <sprite material={cometSprite} scale={0.16} renderOrder={7} />
                </group>
              </group>
            </>
          )}
          {previewArc && <mesh geometry={previewArc.geometry} material={previewArc.material} scale={R} renderOrder={6} />}
        </group>
        {rings && (
          <>
            <mesh geometry={equatorGeometry} material={brass} scale={R} />
            <group rotation={[0, 0, 23.44 * DEG]}>
              <group ref={ecliptic}>
                <mesh geometry={eclipticGeometry} material={brass} scale={R} />
                <primitive object={ticks} scale={R} />
              </group>
            </group>
          </>
        )}
      </group>
      <mesh geometry={atmosphereGeometry} material={getAtmosphereMaterial()} scale={R * 1.012} renderOrder={2} />
      {rings && <mesh geometry={meridianGeometry} material={brass} scale={R} rotation={[Math.PI / 2, 0.32, 0, "YXZ"]} />}
    </group>
  );
});

/**
 * Brass column and black lacquer foot for the globe (optional). The group sits
 * at the globe centre; `height` is the distance from the centre down to the floor.
 */
export function GlobeStand({ radius = 2.4, height = 3.2, quality = "high", ...group }: { radius?: number; height?: number; quality?: GlobeProps["quality"] } & ThreeElements["group"]) {
  const brass = pieceMaterial("brass", quality);
  const lacquer = pieceMaterial("lacquer", quality);
  const parts = useMemo(() => {
    const R = radius;
    const segments = quality === "low" ? 40 : 96;
    const footHeight = 0.07 * R;
    const floor = -height;
    const f0 = floor + footHeight;
    const top = -1.25 * R + 0.02 * R;
    const span = Math.max(0.2 * R, top - f0);
    const y = (fraction: number) => f0 + span * fraction;
    const profile = [
      [0, f0], [0.42 * R, f0], [0.43 * R, y(0.03)], [0.4 * R, y(0.07)], [0.3 * R, y(0.11)], [0.16 * R, y(0.18)], [0.075 * R, y(0.27)],
      [0.05 * R, y(0.36)], [0.048 * R, y(0.44)], [0.085 * R, y(0.5)], [0.048 * R, y(0.56)], [0.045 * R, y(0.8)], [0.075 * R, y(0.9)],
      [0.1 * R, y(0.97)], [0.06 * R, y(1)], [0, y(1)],
    ].map(([x, yy]) => new THREE.Vector2(x!, yy!));
    const column = new THREE.LatheGeometry(new THREE.SplineCurve(profile).getSpacedPoints(64), segments);
    const foot = new THREE.CylinderGeometry(0.5 * R, 0.52 * R, footHeight, segments).translate(0, floor + footHeight / 2, 0);
    const ring = new THREE.TorusGeometry(0.5 * R, 0.012 * R, 8, segments).rotateX(Math.PI / 2).translate(0, f0, 0);
    return { column, foot, ring };
  }, [radius, height, quality]);
  useEffect(() => () => { parts.column.dispose(); parts.foot.dispose(); parts.ring.dispose(); }, [parts]);
  return (
    <group {...group}>
      <mesh geometry={parts.column} material={brass} castShadow receiveShadow />
      <mesh geometry={parts.ring} material={brass} castShadow />
      <mesh geometry={parts.foot} material={lacquer} castShadow receiveShadow />
    </group>
  );
}

