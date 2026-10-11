/**
 * GPU resources built from the atlas: textures, the merged enamel plaques
 * (one draw call for 52 cells) and the per-cell effect texture that lets the
 * presentation glow, pulse or darken any cell without new materials.
 */
import * as THREE from "three";
import { atlasUV, type BoardAtlas, type AtlasRect } from "./atlas";
import { CELLS, CELL_COUNT, PLAQUE_BEVEL, PLAQUE_GAP, PLAQUE_TOP, SLAB_H } from "./layout";

export function atlasTextures(atlas: BoardAtlas, anisotropy: number) {
  const color = new THREE.CanvasTexture(atlas.color);
  color.colorSpace = THREE.SRGBColorSpace;
  color.anisotropy = anisotropy;
  color.minFilter = THREE.LinearMipmapLinearFilter;
  color.magFilter = THREE.LinearFilter;
  color.generateMipmaps = true;
  color.needsUpdate = true;
  let mask: THREE.CanvasTexture | null = null;
  if (atlas.mask) {
    mask = new THREE.CanvasTexture(atlas.mask);
    mask.colorSpace = THREE.NoColorSpace;
    mask.anisotropy = Math.min(anisotropy, 4);
    mask.minFilter = THREE.LinearMipmapLinearFilter;
    mask.generateMipmaps = true;
    mask.needsUpdate = true;
  }
  return { color, mask };
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, srgb = true) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Table radius in world units (the board half-diagonal is ≈ 11.3). */
export const TABLE_RADIUS = 17;

/** Dark leather table: opaque under the board, dissolving into the room. */
export function tableTexture(size: number) {
  return canvasTexture(size, size, (ctx) => {
    const image = ctx.createImageData(size, size);
    const data = image.data;
    const random = mulberry(7);
    const c = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - c) / c, dy = (y - c) / c;
        const r = Math.sqrt(dx * dx + dy * dy);
        const grain = (random() - 0.5) * 9;
        // Soft contact shadow under the board footprint (board half 8).
        const board = Math.max(Math.abs(dx), Math.abs(dy)) / (8.5 / TABLE_RADIUS);
        const under = board < 1 ? 0.6 : Math.max(0, 1 - (board - 1) * 3.2) * 0.6;
        const warm = 1 - r * 0.6;
        const i = (y * size + x) * 4;
        data[i] = Math.max(0, (46 * warm + grain) * (1 - under));
        data[i + 1] = Math.max(0, (30 * warm + grain * 0.8) * (1 - under));
        data[i + 2] = Math.max(0, (21 * warm + grain * 0.6) * (1 - under));
        const fade = r < 0.66 ? 1 : r > 0.99 ? 0 : 1 - smooth((r - 0.66) / 0.33);
        data[i + 3] = Math.round(255 * fade);
      }
    }
    ctx.putImageData(image, 0, 0);
  });
}

/** Polished black marble with warm veins (pedestal). Repeats horizontally. */
export function marbleTexture() {
  const texture = canvasTexture(1024, 256, (ctx) => {
    const random = mulberry(19);
    ctx.fillStyle = "#07080b";
    ctx.fillRect(0, 0, 1024, 256);
    const cloud = ctx.createLinearGradient(0, 0, 1024, 256);
    cloud.addColorStop(0, "rgba(40,36,44,0.35)");
    cloud.addColorStop(0.5, "rgba(10,10,14,0)");
    cloud.addColorStop(1, "rgba(48,40,36,0.3)");
    ctx.fillStyle = cloud;
    ctx.fillRect(0, 0, 1024, 256);
    for (let v = 0; v < 26; v++) {
      const y0 = random() * 256;
      const width = 0.4 + random() * (v < 4 ? 2.4 : 1.1);
      const alpha = v < 4 ? 0.5 : 0.18 + random() * 0.2;
      ctx.strokeStyle = random() > 0.6 ? `rgba(226,196,134,${alpha})` : `rgba(210,214,222,${alpha * 0.8})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      let x = -20, y = y0;
      ctx.moveTo(x, y);
      while (x < 1044) {
        const nx = x + 40 + random() * 90;
        const ny = y + (random() - 0.5) * 70;
        ctx.quadraticCurveTo((x + nx) / 2 + (random() - 0.5) * 30, (y + ny) / 2 + (random() - 0.5) * 40, nx, ny);
        x = nx; y = ny;
      }
      ctx.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/** Fine felt for the dice tray. */
export function feltTexture() {
  const texture = canvasTexture(256, 256, (ctx) => {
    const random = mulberry(3);
    const image = ctx.createImageData(256, 256);
    for (let i = 0; i < image.data.length; i += 4) {
      const n = 30 + random() * 16;
      image.data[i] = n * 0.6;
      image.data[i + 1] = n * 0.82;
      image.data[i + 2] = n * 1.25;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (t: number) => t * t * (3 - 2 * t);

// ------------------------------------------------------------- cell fx --
/** 52×1 texture: rgb = emissive glow (× scale), a = darkening. */
export function cellFxTexture() {
  const texture = new THREE.DataTexture(new Uint8Array(CELL_COUNT * 4), CELL_COUNT, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export const CELL_FX_SCALE = 2.6;

/** Inject the per-cell glow / darkening into a standard or physical material. */
export function withCellFx<T extends THREE.MeshStandardMaterial>(material: T, fx: THREE.DataTexture): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCellFx = { value: fx };
    shader.uniforms.uFxScale = { value: CELL_FX_SCALE };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aCell;\nvarying float vCell;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCell = aCell;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D uCellFx;\nuniform float uFxScale;\nvarying float vCell;")
      .replace("#include <opaque_fragment>", "vec4 cellFx = texture2D( uCellFx, vec2( ( vCell + 0.5 ) / 52.0, 0.5 ) );\noutgoingLight = outgoingLight * ( 1.0 - cellFx.a ) + cellFx.rgb * uFxScale;\n#include <opaque_fragment>");
  };
  material.customProgramCacheKey = () => "gf-cell-fx";
  return material;
}

// ------------------------------------------------------------- geometry --
type V3 = [number, number, number];

/** Merged bevelled plaques; the bevel samples the tile's rim, the sides a dark swatch. */
export function plaqueGeometry(atlas: BoardAtlas) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const cells: number[] = [];
  const side = atlasUV(atlas, atlas.side);
  const su = (side.u0 + side.u1) / 2, sv = (side.vTop + side.vBottom) / 2;
  const g = PLAQUE_GAP / 2, b = PLAQUE_BEVEL;
  const top = PLAQUE_TOP, edge = PLAQUE_TOP - b * 0.85, base = SLAB_H - 0.005;

  for (const cell of CELLS) {
    const x0 = cell.x0 + g, x1 = cell.x1 - g, z0 = cell.z0 + g, z1 = cell.z1 - g;
    const r = atlasUV(atlas, atlas.cells[cell.index] as AtlasRect);
    const map = (p: V3): [number, number] => [
      r.u0 + ((p[0] - x0) / (x1 - x0)) * (r.u1 - r.u0),
      r.vTop - ((p[2] - z0) / (z1 - z0)) * (r.vTop - r.vBottom),
    ];
    const face = (pts: V3[], outward: V3, textured: boolean) => {
      // Two triangles, wound so that the geometric normal matches `outward`.
      const [a, bb, c] = pts as [V3, V3, V3];
      const e1 = [bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]];
      const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [e1[1]! * e2[2]! - e1[2]! * e2[1]!, e1[2]! * e2[0]! - e1[0]! * e2[2]!, e1[0]! * e2[1]! - e1[1]! * e2[0]!];
      const flip = n[0]! * outward[0] + n[1]! * outward[1] + n[2]! * outward[2] < 0;
      const order = flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
      const len = Math.hypot(...outward) || 1;
      for (const k of order) {
        const p = pts[k]!;
        positions.push(p[0], p[1], p[2]);
        normals.push(outward[0] / len, outward[1] / len, outward[2] / len);
        const uv = textured ? map(p) : [su, sv];
        uvs.push(uv[0]!, uv[1]!);
        cells.push(cell.index);
      }
    };
    const A: V3 = [x0 + b, top, z0 + b], B: V3 = [x1 - b, top, z0 + b], C: V3 = [x1 - b, top, z1 - b], D: V3 = [x0 + b, top, z1 - b];
    const a: V3 = [x0, edge, z0], bb: V3 = [x1, edge, z0], c: V3 = [x1, edge, z1], d: V3 = [x0, edge, z1];
    face([A, B, C, D], [0, 1, 0], true);
    face([a, bb, B, A], [0, 0.75, -1], true);
    face([bb, c, C, B], [1, 0.75, 0], true);
    face([c, d, D, C], [0, 0.75, 1], true);
    face([d, a, A, D], [-1, 0.75, 0], true);
    const la: V3 = [x0, base, z0], lb: V3 = [x1, base, z0], lc: V3 = [x1, base, z1], ld: V3 = [x0, base, z1];
    face([la, lb, bb, a], [0, 0, -1], false);
    face([lb, lc, c, bb], [1, 0, 0], false);
    face([lc, ld, d, c], [0, 0, 1], false);
    face([ld, la, a, d], [-1, 0, 0], false);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("aCell", new THREE.Float32BufferAttribute(cells, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** A flat quad lying on the slab, textured with an atlas region. */
export function decalGeometry(atlas: BoardAtlas, region: AtlasRect, width: number, depth: number) {
  const geometry = new THREE.PlaneGeometry(width, depth);
  geometry.rotateX(-Math.PI / 2);
  const r = atlasUV(atlas, region);
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) ? r.u1 : r.u0, uv.getY(i) ? r.vTop : r.vBottom);
  }
  uv.needsUpdate = true;
  return geometry;
}
