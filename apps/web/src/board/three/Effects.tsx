/**
 * Event effects on the board: the arrival ripple in the cell's colour, and the
 * bull market's gold-emerald light sweep with rising motes. Nothing here runs
 * permanently; everything is idle (and invisible) outside its event.
 */
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BOARD_SIZE, PLAQUE_TOP, TRACK_HALF, cellAt } from "./layout";
import { useDisposable } from "./Board";
import { clamp01, easeOutCubic, seeded, useRuntime } from "./runtime";

const RIPPLE_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform vec3 uColor;
  varying vec2 vUv;
  float ring(float r, float radius, float width) { return smoothstep(width, 0.0, abs(r - radius)); }
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float p = clamp(uProgress, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - p, 3.0);
    float a = ring(r, mix(0.12, 0.96, e), 0.035 + 0.05 * p) * pow(1.0 - p, 1.4);
    float q = clamp(p * 1.35 - 0.35, 0.0, 1.0);
    a += ring(r, mix(0.1, 0.7, 1.0 - pow(1.0 - q, 3.0)), 0.03) * pow(1.0 - q, 1.6) * step(0.001, q) * 0.7;
    a += smoothstep(0.5, 0.0, r) * pow(1.0 - p, 2.4) * 0.18;
    gl_FragColor = vec4(uColor * a, a);
  }`;
const BASIC_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function ArrivalRipple() {
  const runtime = useRuntime();
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useDisposable(() => new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), []);
  const material = useDisposable(() => new THREE.ShaderMaterial({
    uniforms: { uProgress: { value: 0 }, uColor: { value: new THREE.Color() } },
    vertexShader: BASIC_VERTEX, fragmentShader: RIPPLE_FRAGMENT,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }), []);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const rt = runtime.current;
    const arrival = rt.arrival;
    const progress = arrival ? (performance.now() - arrival.at) / 1100 : 2;
    m.visible = !rt.reduced && progress >= 0 && progress < 1;
    if (!m.visible || !arrival) return;
    const cell = cellAt(arrival.cell);
    m.position.set(cell.cx, PLAQUE_TOP + 0.012, cell.cz);
    material.uniforms.uProgress!.value = progress;
    (material.uniforms.uColor!.value as THREE.Color).set(arrival.color).multiplyScalar(1.7);
  });
  return <mesh ref={mesh} geometry={geometry} material={material} visible={false} renderOrder={4} />;
}

// ------------------------------------------------------------------- bull --
const SWEEP_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float d = (vUv.x + (1.0 - vUv.y)) * 0.5 - (uProgress * 1.5 - 0.25);
    float band = exp(-d * d * 60.0);
    vec3 gold = vec3(1.0, 0.78, 0.38);
    vec3 emerald = vec3(0.2, 1.0, 0.62);
    vec3 col = mix(emerald, gold, smoothstep(-0.12, 0.12, d)) * 1.6;
    float edge = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x) * smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
    float a = band * uStrength * edge * 0.55;
    gl_FragColor = vec4(col * a, a);
  }`;
const MOTE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform float uScale;
  attribute vec4 aSeed;
  varying float vAlpha;
  varying float vMix;
  void main() {
    float life = fract(aSeed.w + uTime * (0.16 + aSeed.z * 0.2));
    vec3 p = vec3(aSeed.x + sin(uTime * 1.3 + aSeed.w * 20.0) * 0.18, 0.7 + life * 4.6, aSeed.y + cos(uTime * 1.1 + aSeed.w * 13.0) * 0.18);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uScale * (0.55 + aSeed.z) / -mv.z;
    vAlpha = sin(life * 3.14159) * uStrength;
    vMix = fract(aSeed.w * 7.31);
  }`;
const MOTE_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying float vMix;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    vec3 col = mix(vec3(1.0, 0.8, 0.42), vec3(0.3, 1.0, 0.66), vMix) * 2.4;
    gl_FragColor = vec4(col * a, a);
  }`;

export function BullEffects({ count }: { count: number }) {
  const runtime = useRuntime();
  const dpr = useThree((s) => s.viewport.dpr);
  const sweep = useRef<THREE.Mesh>(null);
  const motes = useRef<THREE.Points>(null);
  const sweepGeometry = useDisposable(() => new THREE.PlaneGeometry(TRACK_HALF * 2, TRACK_HALF * 2).rotateX(-Math.PI / 2), []);
  const sweepMaterial = useDisposable(() => new THREE.ShaderMaterial({
    uniforms: { uProgress: { value: 0 }, uStrength: { value: 0 } },
    vertexShader: BASIC_VERTEX, fragmentShader: SWEEP_FRAGMENT,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }), []);
  const moteGeometry = useDisposable(() => {
    const random = seeded(42);
    const seeds = new Float32Array(count * 4);
    const half = BOARD_SIZE / 2 - 1;
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = (random() * 2 - 1) * half;
      seeds[i * 4 + 1] = (random() * 2 - 1) * half;
      seeds[i * 4 + 2] = random();
      seeds[i * 4 + 3] = random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 3, 0), 14);
    return geo;
  }, [count]);
  const moteMaterial = useDisposable(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 }, uScale: { value: 60 } },
    vertexShader: MOTE_VERTEX, fragmentShader: MOTE_FRAGMENT,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }), []);
  const scale = useMemo(() => 240 * dpr, [dpr]);

  useFrame(() => {
    const rt = runtime.current;
    const active = rt.mood === "bull" && !rt.reduced;
    const age = (performance.now() - rt.moodAt) / 1000;
    const strength = active ? clamp01(age / 0.4) * (age < 4.5 ? 1 : clamp01(1 - (age - 4.5) / 1.5)) : 0;
    if (sweep.current) {
      sweep.current.visible = strength > 0 && age < 3.6;
      sweepMaterial.uniforms.uProgress!.value = easeOutCubic((age % 1.8) / 1.8);
      sweepMaterial.uniforms.uStrength!.value = strength;
    }
    if (motes.current) {
      motes.current.visible = strength > 0;
      moteMaterial.uniforms.uTime!.value = age;
      moteMaterial.uniforms.uStrength!.value = strength;
      moteMaterial.uniforms.uScale!.value = scale;
    }
  });
  return (
    <>
      <mesh ref={sweep} geometry={sweepGeometry} material={sweepMaterial} position={[0, PLAQUE_TOP + 0.02, 0]} visible={false} renderOrder={3} />
      <points ref={motes} geometry={moteGeometry} material={moteMaterial} visible={false} renderOrder={6} />
    </>
  );
}
