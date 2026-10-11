import { Application, extend, useApplication, useTick } from "@pixi/react";
import {
  Assets,
  Container,
  Graphics,
  MeshPlane,
  Rectangle,
  Sprite,
  Text,
  Texture,
  type Ticker,
} from "pixi.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  legacyStartingMarket,
  type BoardCell,
  type GameView,
  type PawnId,
  type Player,
} from "@global-fund/shared";
import { playCue } from "../presentation/audio";
import { boardToScreen, boardDepthScale, boardCellRect, boardCellPoint, boardMeshPositions } from "./BoardProjection";
import type { BoardTimeline, PresentationStage } from "../presentation/sequence";
import "./board-scene.css";

extend({ Container, Graphics, Sprite, Text, MeshPlane });
const WIDTH = 1000;
const HEIGHT = 650;
const GOLD = 0xcba968;
const PALE = 0xf4e5bb;
const TEAL = 0x36bcab;
const FONT = "Inter, Arial, sans-serif";
const SHORT: Record<string, string> = {
  technology: "TECH",
  finance: "FINANCE",
  industry: "INDUSTRIE",
  health: "SANTÉ",
  energy: "ÉNERGIE",
  realestate: "IMMO",
  agrifood: "AGRO",
  media: "MÉDIAS",
  transport: "TRANSPORT",
};
const SECTOR_COLOR: Record<string, number> = {
  technology: 0x6aa8dc,
  finance: 0xc9aa64,
  industry: 0xab96be,
  health: 0x71c3bd,
  energy: 0xdba167,
  realestate: 0xb6a1d6,
  agrifood: 0x8cba87,
  media: 0xd395ac,
  transport: 0x819dc2,
};
const HUBS = [
  { id: "americas", title: "AMÉRIQUES", x: 290, y: 305, px: 125, py: 225 },
  { id: "europe", title: "EUROPE", x: 525, y: 260, px: 560, py: 160 },
  { id: "asia", title: "ASIE", x: 713, y: 305, px: 765, py: 190 },
  { id: "africa", title: "AFRIQUE", x: 530, y: 391, px: 437, py: 414 },
  { id: "oceania", title: "OCÉANIE", x: 798, y: 441, px: 713, py: 459 },
] as const;
type Point = { x: number; y: number };
/** All surface points and upright feet use the same homography. */
function onPlane(point: Point): Point { return boardToScreen(point.x, point.y); }
const PAWN_METAL: Record<PawnId, number> = {
  lion: 0xd8b879, bull: 0x70bce6, leaf: 0x42d9a3,
  crystal: 0xb197e7, globe: 0xd4e0e7, tower: 0xed727b,
};
type CameraMode = "global" | "player" | "cell" | "zone" | "crash";
type Quality = "high" | "medium" | "low";
type Presentation = "context" | "event" | "bull" | "bear" | "crash" | null;
type Geometry = { type: string; coordinates: number[][][] | number[][][][] };
type LandData = { features: { geometry: Geometry }[] };

// Legacy 2D board kept until the 3D scene replaces this module; it accepts the shared contract.
export type { BoardSceneProps } from "./types";
import type { BoardSceneProps } from "./types";
export const cellRect = boardCellRect;
const cellPoint = boardCellPoint;
function projectedEllipse(g: Graphics, x: number, y: number, rx: number, ry: number, origin: Point = {x:0,y:0}) {
  const points: number[] = [];
  for (let index=0;index<32;index++) {
    const angle=index*Math.PI/16, point=onPlane({x:x+Math.cos(angle)*rx,y:y+Math.sin(angle)*ry});
    points.push(point.x-origin.x,point.y-origin.y);
  }
  return g.poly(points);
}
function color(hex: string) {
  return Number.parseInt(hex.replace("#", ""), 16) || GOLD;
}
function blend(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  return (
    (Math.round(ar + (((b >> 16) & 255) - ar) * t) << 16) +
    (Math.round(ag + (((b >> 8) & 255) - ag) * t) << 8) +
    Math.round(ab + ((b & 255) - ab) * t)
  );
}
function project(lon: number, lat: number): Point {
  return {
    x: 116 + ((lon + 180) / 360) * 768,
    y: 137 + ((83 - lat) / 148) * 376,
  };
}
function Txt({
  text,
  x,
  y,
  size = 12,
  fill = PALE,
  weight = "500",
  anchor = 0.5,
  spacing = 0,
}: {
  text: string;
  x: number;
  y: number;
  size?: number;
  fill?: number;
  weight?: "400" | "500" | "600" | "700";
  anchor?: number;
  spacing?: number;
}) {
  return (
    <pixiText
      text={text}
      x={x}
      y={y}
      anchor={anchor}
      style={{
        fontFamily: FONT,
        fontSize: size,
        fill,
        fontWeight: weight,
        letterSpacing: spacing,
        align: "center",
      }}
    />
  );
}
function PhysicalBoard({ metal }: { metal?: Texture }) {
  const draw = useCallback((g: Graphics) => {
    g.clear();
    // The inset rail belongs to the printed surface; thickness is drawn in screen space.
    g.roundRect(25, 25, 950, 590, 13).fill(0x26303a).stroke({ color: 0xe2c690, width: 2 });
    g.roundRect(34, 34, 932, 572, 8).fill(0x0b1621).stroke({ color: 0x7d6644, width: 2 });
    g.rect(40, 39, 920, 548).stroke({ color: 0x02070d, width: 8, alpha: 0.7 });
    g.rect(110, 83, 780, 480).fill(0x0b2234).stroke({ color: GOLD, width: 1.8 });
    g.rect(116, 89, 768, 468).stroke({ color: 0x70bce6, width: 0.6, alpha: 0.4 });
    g.moveTo(38, 30).lineTo(960, 30).stroke({ color: 0xffe6ac, width: 1.5, alpha: 0.9 });
    g.moveTo(29, 37).lineTo(29, 603).stroke({ color: 0xf0d8a0, width: 1, alpha: 0.75 });
    for (const x of [35, 965]) for (const y of [33, 608]) {
      g.circle(x, y, 3).fill(0x1a2229).stroke({ color: GOLD, width: 0.8 });
      g.moveTo(x - 1.5, y).lineTo(x + 1.5, y).stroke({ color: PALE, width: 0.7 });
    }
  }, []);
  return <pixiContainer><pixiGraphics draw={draw} />{metal && <pixiSprite texture={metal} x={36} y={35} width={928} height={568} alpha={0.065} />}</pixiContainer>;
}
function BoardTile({
  cell,
  index,
  active,
}: {
  cell: BoardCell;
  index: number;
  active: boolean;
}) {
  const r = cellRect(index);
  const mood = /bull/i.test(cell.label)
    ? "bull"
    : /crash/i.test(cell.label)
      ? "crash"
      : /bear/i.test(cell.label)
        ? "bear"
        : "";
  const accent =
    cell.kind === "start"
      ? GOLD
      : mood === "bull"
        ? 0x4dc995
        : mood === "bear" || mood === "crash"
          ? 0xe88273
          : cell.kind === "event"
            ? 0x74ade7
            : SECTOR_COLOR[cell.sector || ""] || GOLD;
  const title =
    cell.kind === "start"
      ? "DÉPART"
      : mood
        ? mood.toUpperCase()
        : cell.kind === "event"
          ? "ÉVÉN."
          : SHORT[cell.sector || ""] || cell.label.toUpperCase().slice(0, 12);
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
        .roundRect(1, 1, 63, 38, 2)
        .fill(
          active
            ? 0x293f48
            : mood === "bull"
              ? 0x10342d
              : mood === "crash"
                ? 0x3e2026
                : mood === "bear"
                  ? 0x30212b
                  : cell.kind === "event"
                    ? 0x132c45
                    : 0x14212d,
        );
      g.roundRect(1, 1, 63, 38, 2).stroke({
        color: active ? PALE : 0x837052,
        width: active ? 1.7 : 0.6,
        alpha: active ? 1 : 0.6,
      });
      g.moveTo(2, 3).lineTo(2, 36).lineTo(62, 36).stroke({ color: 0x02080c, width: 1.5 });
      g.moveTo(4, 6).lineTo(60, 6).stroke({ color: 0xe4d4ad, width: 0.5, alpha: 0.28 });
      for (let stripe = 0; stripe < 4; stripe++)
        g.moveTo(4, 10 + stripe * 6).lineTo(59, 10 + stripe * 6).stroke({ color: 0x93a6ad, width: 0.35, alpha: 0.08 });
      g.rect(2, 2, 61, 3).fill({ color: accent, alpha: active ? 1 : 0.76 });
      g.moveTo(3, 36)
        .lineTo(61, 36)
        .stroke({ color: 0x000000, alpha: 0.5, width: 1 });
      if (mood) {
        g.moveTo(10, 22)
          .lineTo(19, mood === "bull" ? 28 : 17)
          .lineTo(26, 20)
          .lineTo(34, mood === "bull" ? 15 : 29)
          .lineTo(44, mood === "bull" ? 11 : 32)
          .stroke({ color: accent, width: 1.4, alpha: 0.7 });
      }
      if (active)
        g.rect(3, 4, 59, 32).stroke({ color: accent, width: 0.7, alpha: 0.5 });
    },
    [accent, active, cell.kind, mood],
  );
  return (
    <pixiContainer
      x={r.x}
      y={r.y}
      eventMode="none"
    >
      <pixiGraphics draw={draw} />
      <Txt
        text={title}
        x={32.5}
        y={15}
        size={title.length > 8 ? 10.5 : 11}
        fill={accent}
        weight="700"
      />
      <Txt
        text={`${index + 1}`.padStart(2, "0")}
        x={32.5}
        y={29}
        size={12}
        fill={active ? 0xffffff : 0xb3bdc8}
        weight="500"
      />
    </pixiContainer>
  );
}
function WorldMap({ land, night }: { land: LandData | null; night?: Texture }) {
  const croppedNight = useMemo(() => night ? new Texture({ source: night.source, frame: new Rectangle(0, night.height * 7 / 180, night.width, night.height * 148 / 180) }) : null, [night]);
  useEffect(() => () => { croppedNight?.destroy(false); }, [croppedNight]);
  const draw = useCallback((g: Graphics) => {
    g.clear();
    for (let lon = -150; lon <= 150; lon += 30) {
      const p = project(lon, 83);
      g.moveTo(p.x, 130).lineTo(p.x, 511).stroke({ color: 0x70bce6, alpha: 0.13, width: 0.5 });
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const p = project(-180, lat);
      g.moveTo(119, p.y).lineTo(881, p.y).stroke({ color: 0x70bce6, alpha: 0.12, width: 0.5 });
    }
    for (const f of land?.features || []) {
      const polys = f.geometry.type === "MultiPolygon"
        ? f.geometry.coordinates as number[][][][] : [f.geometry.coordinates as number[][][]];
      for (const polygon of polys) {
        const ring = polygon[0];
        if (!ring || ring.every((p) => p[1] < -66)) continue;
        const points = ring.flatMap(([lon, lat]) => { const p = project(lon, Math.max(-66, lat)); return [p.x, p.y]; });
        // Two independent elevation faces below the bright coastline.
        g.poly(points.map((n, i) => n + (i % 2 ? 5 : 2))).fill(0x03111b).stroke({ color: 0x061722, width: 1.8 });
        g.poly(points.map((n, i) => n + (i % 2 ? 2 : 1))).fill(0x416671);
        const mean = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
        g.poly(points).fill({ color: mean > 45 ? 0x8fa7a5 : mean > 10 ? 0x6b8b7e : 0x667c68, alpha: night ? 0.68 : 0.95 })
          .stroke({ color: 0xd2bd88, alpha: 0.82, width: 0.7 });
      }
    }
    // Relief ridges follow the Andes, Rockies, Alps and Himalayas.
    const ridges = [[[-124,49],[-115,41],[-106,32]], [[-74,5],[-77,-10],[-70,-30],[-72,-49]], [[5,46],[9,47],[14,46]], [[66,37],[79,32],[92,28],[103,30]], [[31,11],[36,0],[29,-13]]];
    for (const ridge of ridges) {
      for (let i = 0; i < ridge.length - 1; i++) {
        const a = project(...ridge[i] as [number, number]), b = project(...ridge[i + 1] as [number, number]);
        g.moveTo(a.x + 1, a.y + 3).lineTo(b.x + 1, b.y + 3).stroke({ color: 0x243e41, width: 4, alpha: 0.6 });
        g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0xc4c1a2, width: 1.5, alpha: 0.62 });
      }
    }
  }, [land, night]);
  const lights = useCallback((g: Graphics) => {
    g.clear();
    const cities = [[-74,40.7],[-118,34],[-87,42],[-99,19],[-46,-23],[-58,-34],[2,49],[-0.1,51],[13,52],[28,41],[37,56],[31,30],[18,-34],[3,6],[36,-1],[55,25],[73,19],[103,1],[121,31],[116,40],[139,36],[151,-34],[144,-38],[174,-37],[127,37],[114,22],[100,14],[106,-6]];
    for (const [lon, lat] of cities) {
      const p = project(lon, lat);
      g.circle(p.x, p.y, 4).fill({ color: 0xffd49a, alpha: 0.1 });
      g.circle(p.x, p.y, 1.3).fill({ color: 0xffe3a5, alpha: 0.92 });
    }
    for (let h = 0; h < HUBS.length; h++) for (let j = h + 1; j < HUBS.length; j++) {
      const a = HUBS[h], b = HUBS[j];
      for (let i = 1; i < 35; i++) {
        const t = i / 35;
        g.circle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 38, 0.85)
          .fill({ color: 0xf0cf89, alpha: 0.52 });
      }
    }
  }, []);
  const coastline = useCallback((g: Graphics) => {
    g.clear();
    for (const feature of land?.features ?? []) {
      const polygons = feature.geometry.type === "MultiPolygon"
        ? feature.geometry.coordinates as number[][][][]
        : [feature.geometry.coordinates as number[][][]];
      for (const polygon of polygons) {
        const ring = polygon[0];
        if (!ring || ring.every((point) => point[1] < -66)) continue;
        const points = ring.flatMap(([longitude, latitude]) => {
          const point = project(longitude, Math.max(-66, latitude));
          return [point.x, point.y];
        });
        // Coastline relief remains visible above the satellite texture.
        g.poly(points.map((value, index) => value + (index % 2 ? 2.5 : 1)))
          .stroke({ color: 0x010a11, width: 2, alpha: 0.6 });
        g.poly(points).stroke({ color: 0xc6b27e, width: 0.7, alpha: 0.38 });
      }
    }
  }, [land]);
  return <pixiContainer><pixiGraphics draw={draw} />{croppedNight && <pixiSprite texture={croppedNight} x={116} y={137} width={768} height={376} alpha={0.76} />}<pixiGraphics draw={coastline} /><pixiGraphics draw={lights} /></pixiContainer>;
}
function Hub({ hub, game, focused, texture }: { hub: (typeof HUBS)[number]; game: GameView; focused: boolean; texture?: Texture }) {
  const selected = focused || game.players.find((p) => p.id === game.activePlayerId)?.zone === hub.id;
  const count = game.companies.filter((c) => c.zone === hub.id).length;
  const grade = game.zoneGrades[hub.id] || "C";
  const base = onPlane(hub);
  const landmark = useCallback((g: Graphics) => {
    g.clear().ellipse(4, 6, 48, 10).fill({ color: 0x000000, alpha: 0.4 });
    g.ellipse(0, 0, 43, 9).fill(0x293f43).stroke({ color: GOLD, width: 0.8 });
    for (let i = 0; i < 9; i++) {
      const x = -33 + i * 7, height = 11 + ((i * 19 + hub.x) % 25);
      g.poly([x,-2,x,-height,x+4,-height-2,x+7,-height,x+7,0]).fill(0x887454);
      g.rect(x,-height,4,height-2).fill(i % 3 ? 0x243948 : 0x55716e);
      g.moveTo(x,-height).lineTo(x+4,-height-2).lineTo(x+7,-height).stroke({ color: PALE, width: 0.7 });
      for (let y = -height + 4; y < -4; y += 5) g.rect(x + 1,y,1,1.5).fill(0xe2bd79);
    }
    if (hub.id === "europe") {
      g.poly([-12,0,-4,-26,-2,-46,0,-61,2,-46,4,-26,12,0,5,0,0,-17,-5,0]).fill(0xbba573).stroke({ color: 0xf0d8a0, width: 0.6 });
      for (const y of [-10,-22,-35]) g.moveTo(-8,y).lineTo(8,y).stroke({ color: 0xe8cc8c, width: 1 });
    } else if (hub.id === "oceania") {
      g.moveTo(-19,0).quadraticCurveTo(-28,-27,-9,-34).quadraticCurveTo(-15,-12,0,0).fill(0xd5d2b6);
      g.moveTo(-4,0).quadraticCurveTo(-5,-28,15,-39).quadraticCurveTo(4,-10,23,0).fill(0xf0d8a0);
    } else {
      const height = hub.id === "asia" ? 65 : hub.id === "americas" ? 56 : 49;
      g.poly([-5,0,-4,-height+13,0,-height,4,-height+13,7,0]).fill(0xbb9b63).stroke({ color: PALE, width: 0.8 });
      g.moveTo(-2,-height+12).lineTo(-2,-3).stroke({ color: 0xffe8ad, width: 1 });
      if (hub.id === "asia") for (const y of [-15,-28,-40]) g.poly([-10,y,-5,y-4,6,y-4,11,y]).fill(0xd1b57a);
    }
  }, [hub]);
  const contact = useCallback((g: Graphics) => {
    g.clear();
    projectedEllipse(g,hub.x,hub.y+3,66,19).fill({color:GOLD,alpha:selected?0.10:0.045});
    projectedEllipse(g,hub.x+8,hub.y+8,59,12).fill({color:0x000000,alpha:0.35});
    projectedEllipse(g,hub.x+3,hub.y+4,48,8).fill({color:0x000000,alpha:0.65});
    projectedEllipse(g,hub.x,hub.y+2,51,9).stroke({color:GOLD,width:0.7,alpha:selected?0.48:0.2});
  }, [selected, hub]);
  return <pixiContainer zIndex={base.y}>
    <pixiGraphics draw={contact} />
    <pixiContainer x={base.x} y={base.y} scale={boardDepthScale(hub.y)}>{texture ? <pixiSprite texture={texture} x={0} y={0} anchor={{x:0.5,y:1}} width={110*texture.width/texture.height} height={110} /> : <pixiGraphics draw={landmark} />}</pixiContainer>
  </pixiContainer>;
}
function HubPlaque({ hub, game, focused }: { hub: (typeof HUBS)[number]; game: GameView; focused: boolean }) {
  const selected = focused || game.players.find((player) => player.id === game.activePlayerId)?.zone === hub.id;
  const count = game.companies.filter((company) => company.zone === hub.id).length;
  const grade = game.zoneGrades[hub.id] || "C";
  const label = useCallback((g: Graphics) => {
    g.clear().roundRect(3,4,119,55,4).fill({ color: 0x000000, alpha: 0.35 });
    g.roundRect(0,0,119,55,4).fill(selected ? 0x163040 : 0x0a1721).stroke({ color: selected ? 0xf0d8a0 : 0x88734f, width: selected ? 1.3 : 0.7 });
    g.moveTo(7,2).lineTo(112,2).stroke({ color: PALE, alpha: 0.3, width: 0.7 });
  }, [selected]);
  return (
    <pixiContainer x={hub.px} y={hub.py}><pixiGraphics draw={label} />
      <Txt text={hub.id === "africa" ? "AFRIQUE · M.-ORIENT" : hub.title} x={59.5} y={12} size={10.5} spacing={0.5} fill={0xf1eadb} weight="600" />
      <Txt text={grade} x={28} y={34} size={25} weight="600" fill={grade === "A" || grade === "B" ? 0x75d1ae : grade === "E" ? 0xed727b : PALE} />
      <Txt text={`${count} entreprises`} x={76} y={34} size={11} fill={0xb4c7d1} />
    </pixiContainer>
  );
}
function sculpt(g: Graphics, pawn: PawnId, tint: number) {
  const dark = blend(tint, 0x10151a, 0.65),
    middle = blend(tint, 0x687784, 0.2),
    light = blend(tint, 0xffffff, 0.55);
  g.clear();
  g.ellipse(5, 6, 21, 7).fill({ color: 0x000000, alpha: 0.45 });
  g.ellipse(0, 0, 17, 6).fill(dark).stroke({ color: middle, width: 0.8 });
  g.rect(-17, -6, 34, 6).fill(dark);
  g.ellipse(0, -6, 17, 6).fill(middle).stroke({ color: light, width: 0.7 });
  g.ellipse(-1, -8, 13, 4).fill(dark).stroke({ color: tint, width: 1 });
  g.poly([-9, -8, -6, -15, -5, -21, 5, -21, 6, -15, 9, -8])
    .fill(middle)
    .stroke({ color: light, width: 0.7 });
  g.moveTo(-5, -19).lineTo(-3, -11).stroke({ color: light, width: 1.2 });
  if (pawn === "globe") {
    g.circle(1, -34, 14).fill(dark).stroke({ color: middle, width: 2 });
    g.circle(-1, -35, 12).fill(tint).stroke({ color: light, width: 1 });
    g.ellipse(-1, -35, 6, 12).stroke({ color: dark, width: 0.8 });
    g.ellipse(-1, -35, 12, 4).stroke({ color: dark, width: 0.8 });
    g.moveTo(-12, -40)
      .quadraticCurveTo(-1, -44, 10, -40)
      .stroke({ color: light, width: 1 });
    g.poly([-9, -40, -4, -43, 0, -41, -2, -35, -7, -33, -9, -36]).fill(
      blend(tint, 0xffffff, 0.35),
    );
    g.poly([0, -32, 5, -34, 8, -30, 4, -23, 1, -26]).fill(dark);
    g.ellipse(-5, -41, 4, 2).fill({ color: 0xffffff, alpha: 0.5 });
  } else if (pawn === "crystal") {
    g.poly([1, -56, 14, -32, 7, -18, -6, -18, -12, -31])
      .fill(dark)
      .stroke({ color: light, width: 1 });
    g.poly([1, -56, -3, -32, -6, -18, -12, -31]).fill(
      blend(tint, 0xffffff, 0.25),
    );
    g.poly([1, -56, 10, -32, 2, -23, -3, -32]).fill(tint);
    g.poly([-3, -32, 2, -23, -6, -18]).fill(light);
    g.moveTo(1, -54)
      .lineTo(-3, -32)
      .lineTo(2, -23)
      .lineTo(7, -18)
      .stroke({ color: 0xffffff, alpha: 0.8, width: 0.8 });
  } else if (pawn === "tower") {
    g.poly([-10, -19, -8, -47, 9, -47, 12, -19])
      .fill(dark)
      .stroke({ color: light, width: 0.7 });
    g.poly([-10, -19, -8, -47, 2, -47, 1, -19]).fill(tint);
    g.rect(-11, -51, 24, 7).fill(middle).stroke({ color: light, width: 1 });
    for (const x of [-11, -2, 7])
      g.rect(x, -56, 6, 8).fill(tint).stroke({ color: light, width: 0.7 });
    g.roundRect(-2, -32, 6, 12, 2).fill(dark);
    g.moveTo(-6, -41).lineTo(-6, -24).stroke({ color: light, width: 1 });
  } else if (pawn === "leaf") {
    g.moveTo(-1, -17)
      .bezierCurveTo(-25, -37, -7, -51, 13, -56)
      .bezierCurveTo(20, -30, 9, -23, -1, -17)
      .fill(dark)
      .stroke({ color: light, width: 1 });
    g.moveTo(-2, -19)
      .bezierCurveTo(-20, -39, -4, -47, 11, -54)
      .quadraticCurveTo(0, -31, -2, -19)
      .fill(tint);
    g.moveTo(-2, -20)
      .quadraticCurveTo(4, -40, 12, -54)
      .stroke({ color: light, width: 1.3 });
    for (let i = 0; i < 3; i++)
      g.moveTo(i * 3, -28 - i * 7)
        .lineTo(-8 + i * 3, -33 - i * 6)
        .stroke({ color: light, alpha: 0.65, width: 0.7 });
  } else if (pawn === "bull") {
    g.poly([
      -8, -20, -12, -30, -10, -44, -6, -48, 6, -48, 11, -42, 12, -30, 7, -20,
    ])
      .fill(dark)
      .stroke({ color: light, width: 1 });
    g.poly([-8, -22, -10, -33, -7, -44, 0, -46, 4, -35, 2, -23]).fill(tint);
    g.moveTo(-8, -41)
      .bezierCurveTo(-19, -39, -21, -49, -19, -54)
      .quadraticCurveTo(-15, -43, -8, -47)
      .fill(tint)
      .stroke({ color: light, width: 0.8 });
    g.moveTo(9, -41)
      .bezierCurveTo(20, -40, 22, -49, 19, -54)
      .quadraticCurveTo(14, -44, 8, -47)
      .fill(middle)
      .stroke({ color: light, width: 0.8 });
    g.ellipse(0, -25, 8, 5).fill(middle).stroke({ color: light, width: 0.7 });
    g.circle(-5, -36, 1.4).fill(PALE);
    g.circle(5, -36, 1.4).fill(dark);
    g.circle(-3, -25, 0.8).fill(dark);
    g.circle(3, -25, 0.8).fill(dark);
  } else {
    const pts: number[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i * Math.PI) / 11;
      const r = i % 2 ? 15 : 18;
      pts.push(Math.sin(a) * r, -36 + Math.cos(a) * r);
    }
    g.poly(pts).fill(dark).stroke({ color: light, width: 0.8 });
    g.poly(pts.map((n, i) => n + (i % 2 ? -1 : -2))).fill(tint);
    g.ellipse(-1, -37, 10, 13)
      .fill(middle)
      .stroke({ color: light, width: 0.8 });
    g.circle(-8, -46, 4).fill(tint);
    g.circle(6, -46, 4).fill(middle);
    g.poly([-6, -44, -2, -40, -5, -34, -8, -38]).fill(light);
    g.ellipse(-1, -29, 7, 5).fill(tint).stroke({ color: light, width: 0.7 });
    g.poly([-3, -32, 2, -32, 0, -28]).fill(dark);
    g.circle(-5, -38, 1.2).fill(dark);
    g.circle(4, -38, 1.2).fill(dark);
    g.moveTo(0, -27)
      .lineTo(-3, -25)
      .moveTo(0, -27)
      .lineTo(4, -25)
      .stroke({ color: dark, width: 0.8 });
    for (let i = 0; i < 5; i++)
      g.moveTo(-13 + i * 5, -46)
        .lineTo(-15 + i * 5, -51)
        .stroke({ color: light, width: 1 });
  }
  g.moveTo(-12, -7)
    .quadraticCurveTo(-2, -11, 10, -8)
    .stroke({ color: 0xffffff, alpha: 0.6, width: 1 });
}
function AnimatedToken({ player, players, active, reducedMotion, texture, timeline, tracking }: {
  player: Player; players: Player[]; active: boolean; reducedMotion: boolean;
  texture?: Texture; timeline: BoardTimeline | null; tracking: React.MutableRefObject<Point>;
}) {
  const actor = useRef<Container | null>(null);
  const token = useRef<Container | null>(null), halo = useRef<Graphics | null>(null), shadow = useRef<Graphics | null>(null);
  const pos = ((player.sectorPosition % 52) + 52) % 52;
  const peers = players.filter((p) => p.sectorPosition === player.sectorPosition);
  const stack = peers.findIndex((p) => p.id === player.id);
  const offset = { x: (stack - (peers.length - 1) / 2) * (peers.length > 3 ? 20 : 18), y: peers.length > 3 ? (stack % 2) * 12 - 6 : 0 };
  const motion = useRef({ from: pos, to: pos, start: 0, steps: 0, lastAudibleStep: -1, offset, reducedMotion });
  useEffect(() => {
    const m = motion.current;
    if (m.to !== pos) { m.from = m.to; m.to = pos; m.steps = (pos - m.from + 52) % 52;
      if (timeline?.playerId === player.id && timeline.toPosition === pos) { m.from = timeline.fromPosition; m.steps = timeline.roll; m.start = timeline.motionStartedAt; }
      else m.start = performance.now(); m.lastAudibleStep = -1; if (reducedMotion) playCue("pawn_move"); }
    m.offset = offset; m.reducedMotion = reducedMotion;
  }, [pos, offset.x, offset.y, reducedMotion, timeline, player.id]);
  const animate = useCallback(() => {
    const m = motion.current;
    // The presentation clock rebases after the React/Pixi commit. Read its live
    // epoch so an expensive frame cannot consume the movement before it is seen.
    const startedAt = timeline?.playerId === player.id && timeline.fromPosition === m.from && timeline.toPosition === m.to && timeline.roll === m.steps && m.steps ? timeline.motionStartedAt : m.start;
    const elapsed = Math.max(0, performance.now() - startedAt);
    const progress = m.reducedMotion ? 1 : Math.min(1, elapsed / Math.max(1, m.steps * (timeline?.motionStepMs || BOARD_MOTION.stepMs)));
    let point = cellPoint(m.to), hop = 0;
    if (progress < 1 && m.steps) {
      const fraction = progress * m.steps, step = Math.floor(fraction), t = fraction - step;
      if (performance.now() >= startedAt && step !== m.lastAudibleStep) { m.lastAudibleStep = step; playCue("pawn_move"); }
      const a = cellPoint(m.from + step), b = cellPoint(m.from + step + 1), ease = t * t * (3 - 2 * t);
      point = { x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * ease };
      hop = Math.sin(t * Math.PI) * 12;
    }
    const foot = onPlane({ x: point.x + m.offset.x, y: point.y + m.offset.y + 5 });
    token.current?.position.set(foot.x, foot.y - hop);
    token.current?.scale.set(boardDepthScale(point.y) * (peers.length > 3 ? 0.77 : 0.94));
    if (actor.current) actor.current.zIndex = foot.y;

    if (shadow.current) {
      shadow.current.clear();
      projectedEllipse(shadow.current,point.x+m.offset.x+4,point.y+m.offset.y+8,21,6).fill(0x000000);
      shadow.current.alpha=0.42-hop*0.012;
    }
    if (active) tracking.current = foot;
    if (halo.current) {
      halo.current.clear();
      projectedEllipse(halo.current,point.x+m.offset.x,point.y+m.offset.y+5,24,8).stroke({color:color(player.color),width:1.7});
      projectedEllipse(halo.current,point.x+m.offset.x,point.y+m.offset.y+5,28,10).stroke({color:color(player.color),width:0.7,alpha:0.3});
      halo.current.alpha=active ? m.reducedMotion ? 0.8 : 0.7+Math.sin(performance.now()/650)*0.1 : 0;
    }
  }, [active, tracking, timeline, peers.length, player.color, player.id]);
  useTick(animate);
  const sculptDraw = useCallback((g: Graphics) => sculpt(g, player.pawn, PAWN_METAL[player.pawn]), [player.pawn]);
  const emptyDraw = useCallback((g: Graphics) => {g.clear();}, []);
  const initial = onPlane(cellPoint(pos));
  return <pixiContainer ref={actor} zIndex={initial.y}>
    <pixiGraphics ref={shadow} draw={emptyDraw} alpha={0.42} />
    <pixiGraphics ref={halo} draw={emptyDraw} alpha={active?0.8:0} />
    <pixiContainer ref={token} x={initial.x} y={initial.y} scale={boardDepthScale(cellPoint(pos).y) * (peers.length > 3 ? 0.77 : 0.94)}>
      {texture ? <pixiSprite texture={texture} anchor={{ x: 0.5, y: 1 }} x={0} y={0} width={80 * texture.width / texture.height} height={80} alpha={player.jailed ? 0.55 : 1} /> : <pixiGraphics draw={sculptDraw} />}
    </pixiContainer>
  </pixiContainer>;
}
function playerRegion(player: Player): string {
  const home = legacyStartingMarket(player);
  const region =
    player.jailed || player.zone === "prison"
      ? player.previousZone || home
      : player.currentMarket || player.zone || home;
  return HUBS.some((h) => h.id === region) ? region : home;
}
const REGION_MARKERS: Record<string, Point> = {
  americas: { x: 290, y: 338 },
  europe: { x: 525, y: 287 },
  asia: { x: 713, y: 338 },
  africa: { x: 600, y: 391 },
  oceania: { x: 798, y: 434 },
};
function regionalPoint(player: Player, players: Player[]): Point {
  const region = playerRegion(player),
    peers = players.filter((p) => playerRegion(p) === region);
  const index = Math.max(
    0,
    peers.findIndex((p) => p.id === player.id),
  );
  const center = REGION_MARKERS[region] || REGION_MARKERS.europe;
  return { x: center.x + (index - (peers.length - 1) / 2) * 43, y: center.y };
}
/** Regional pawns are independent of the sector track and always show every fund's market. */
function GeographicPawn({ player, players, number, active, reducedMotion, texture }: {
  player: Player; players: Player[]; number: number; active: boolean; reducedMotion: boolean; texture?: Texture;
}) {
  const piece = useRef<Container | null>(null), shadow = useRef<Graphics | null>(null);
  const marker = useRef<Container | null>(null), logicalPoint = regionalPoint(player, players), point = onPlane(logicalPoint);
  const region = playerRegion(player), jailed = player.jailed || player.zone === "prison";
  const motion = useRef({ region, from: logicalPoint, to: logicalPoint, start: -10000, reducedMotion });
  useEffect(() => {
    const m = motion.current;
    if (m.region !== region) { m.from = m.to; m.region = region; m.start = performance.now(); }
    m.to = logicalPoint; m.reducedMotion = reducedMotion;
  }, [region, logicalPoint.x, logicalPoint.y, reducedMotion]);
  useTick(useCallback(() => {
    const m = motion.current, t = m.reducedMotion ? 1 : Math.min(1, (performance.now()-m.start)/BOARD_MOTION.flightMs), ease = t*t*(3-2*t);
    const logical = {x:m.from.x+(m.to.x-m.from.x)*ease,y:m.from.y+(m.to.y-m.from.y)*ease}, foot=onPlane(logical), hop=Math.sin(t*Math.PI)*50;
    marker.current?.position.set(foot.x,foot.y-hop);
    marker.current?.scale.set(boardDepthScale(logical.y));
    if(piece.current) piece.current.zIndex=foot.y;
    if(shadow.current) {
      shadow.current.clear();
      projectedEllipse(shadow.current,logical.x+3,logical.y+4,17,6).fill({color:0x000000,alpha:0.5-hop*0.005});
    }
  }, []));
  const draw = useCallback((g: Graphics) => {
    const tint = jailed ? 0x71828e : color(player.color);
    g.clear().ellipse(2,5,12,4).fill({ color: 0x000000, alpha: 0.45 });
    g.ellipse(0,0,12,4).fill(0x091722).stroke({ color: tint, width: active ? 1.6 : 0.8 });
    g.circle(0,-8,10).fill(0x0b1d29).stroke({ color: tint, width: 1 });
    g.circle(-3,-11,3).fill({ color: 0xffffff, alpha: 0.13 });
    if (jailed) {
      g.roundRect(6,-24,9,8,2).fill(0x71828e);
      g.moveTo(8,-24).lineTo(8,-27).quadraticCurveTo(10,-31,13,-27).lineTo(13,-24).stroke({ color: 0xbac7cf, width: 1.5 });
    }
  }, [active, jailed, player.color]);
  const figure = useCallback((g: Graphics) => sculpt(g, player.pawn, PAWN_METAL[player.pawn]), [player.pawn]);
  return <pixiContainer ref={piece} zIndex={point.y}>
    <pixiGraphics ref={shadow} draw={useCallback((g: Graphics) => {g.clear();},[])} />
    <pixiContainer ref={marker} x={point.x} y={point.y} scale={boardDepthScale(logicalPoint.y)}>
    {texture ? <pixiSprite texture={texture} anchor={{ x: 0.5, y: 1 }} x={0} y={0} width={59 * texture.width / texture.height} height={59} alpha={jailed ? 0.5 : 1} /> : <pixiContainer scale={0.68}><pixiGraphics draw={figure} /></pixiContainer>}
    <pixiContainer y={13}><pixiGraphics draw={draw} /><Txt text={String(number).padStart(2,"0")} x={0} y={-8} size={9} weight="700" fill={PALE} /></pixiContainer>
    </pixiContainer>
  </pixiContainer>;
}

const PIPS: Record<number, number[][]> = {
  1: [[0, 0]],
  2: [
    [-8, -8],
    [8, 8],
  ],
  3: [
    [-8, -8],
    [0, 0],
    [8, 8],
  ],
  4: [
    [-8, -8],
    [8, -8],
    [-8, 8],
    [8, 8],
  ],
  5: [
    [-8, -8],
    [8, -8],
    [0, 0],
    [-8, 8],
    [8, 8],
  ],
  6: [
    [-8, -9],
    [8, -9],
    [-8, 0],
    [8, 0],
    [-8, 9],
    [8, 9],
  ],
};
function drawDice(g: Graphics, value: number) {
  g.clear();
  g.ellipse(5, 23, 31, 9).fill({ color: 0x000000, alpha: 0.5 });
  g.poly([-20, -18, -12, -25, 26, -25, 20, -18])
    .fill(0xf7e8c8)
    .stroke({ color: GOLD, width: 0.7 });
  g.poly([20, -18, 26, -25, 26, 12, 20, 20])
    .fill(0xa18a62)
    .stroke({ color: 0x6e5b3b, width: 0.7 });
  g.roundRect(-20, -18, 40, 38, 4)
    .fill(0xe5d4ad)
    .stroke({ color: 0xfff6df, width: 1 });
  g.roundRect(-17, -15, 34, 32, 3).stroke({ color: 0xbdab86, width: 0.6 });
  // Other faces retain engraved pips, showing a solid cube at rest.
  for (const [x,y] of [[-8,-22],[10,-22]]) g.ellipse(x,y,2.2,0.8).fill(0x837254);
  for (const y of [-9,2,10]) g.ellipse(23,y,1,2).fill(0x514c40);
  for (const [x, y] of PIPS[value] || PIPS[1]) {
    g.circle(x, y, 3).fill(0x2b2f32);
    g.circle(x - 0.5, y - 0.7, 1.7).fill(0x53544e);
  }
}
function Dice({ roll, timeline, reducedMotion }: { roll: number; timeline: BoardTimeline | null; reducedMotion: boolean }) {
  const die = useRef<Container | null>(null), face = useRef<Graphics | null>(null);
  const drawnFace = useRef(roll), heard = useRef<number | null>(null);
  const base = onPlane({ x: 655, y: 524 });
  useEffect(() => {
    if (timeline && heard.current !== timeline.noticeId) { heard.current = timeline.noticeId; playCue("dice"); }
  }, [timeline?.noticeId]);
  useTick(useCallback(() => {
    const elapsed = timeline ? performance.now() - timeline.diceStartedAt : Infinity;
    const rolling = !!timeline && elapsed >= 0 && elapsed < BOARD_MOTION.diceMs && !reducedMotion;
    if (die.current) {
      die.current.rotation = rolling ? Math.sin(elapsed / 58) * 0.13 : 0;
      die.current.y = base.y - (rolling ? Math.abs(Math.sin(elapsed / 115)) * 15 : 0);
    }
    // The changing faces are decoration; the stopped face is the server's result.
    const nextFace = rolling ? 1 + Math.floor(elapsed / 75) % 6 : timeline?.roll || roll;
    if (face.current && drawnFace.current !== nextFace) { drawDice(face.current, nextFace); drawnFace.current = nextFace; }
  }, [timeline, reducedMotion, roll, base.y]));
  return <pixiContainer ref={die} x={base.x} y={base.y} zIndex={base.y} scale={boardDepthScale(524)}><pixiGraphics ref={face} draw={useCallback((g: Graphics) => drawDice(g, timeline?.roll || roll), [timeline?.roll, roll])} /></pixiContainer>;
}
function TravelRoute({
  game,
  reducedMotion,
}: {
  game: GameView;
  reducedMotion: boolean;
}) {
  const graphics = useRef<Graphics | null>(null);
  const route = useRef<{ from: Point; to: Point; started: number } | null>(
    null,
  );
  const travel = [...game.notices]
    .reverse()
    .find((n) => n.fromZoneId && n.zoneId && n.fromZoneId !== n.zoneId);
  const previous = useRef<number | null>(travel?.id || null);
  useEffect(() => {
    if (!travel || previous.current === travel.id) return;
    previous.current = travel.id;
    const a = HUBS.find((h) => h.id === travel.fromZoneId),
      b = HUBS.find((h) => h.id === travel.zoneId);
    if (a && b) { route.current = { from: a, to: b, started: performance.now() }; playCue("travel"); }
  }, [travel]);
  const animate = useCallback(() => {
    const g = graphics.current,
      r = route.current;
    if (!g) return;
    g.clear();
    if (!r) return;
    const age = performance.now() - r.started;
    if (age > 2800) {
      route.current = null;
      return;
    }
    const alpha = Math.min(1, (2800 - age) / 600),
      t = reducedMotion ? 1 : Math.min(1, age / 1100);
    const point = (p: number) => ({
      x: r.from.x + (r.to.x - r.from.x) * p,
      y: r.from.y + (r.to.y - r.from.y) * p - Math.sin(p * Math.PI) * 70,
    });
    for (let i = 0; i <= 44 * t; i++) {
      const p = onPlane(point(i / 44));
      g.circle(p.x, p.y, 1.7).fill({ color: PALE, alpha: alpha * 0.8 });
    }
    if (t < 1) {
      const p = onPlane(point(t));
      g.poly([
        p.x - 7,
        p.y + 4,
        p.x + 8,
        p.y,
        p.x - 7,
        p.y - 4,
        p.x - 4,
        p.y,
      ]).fill(PALE);
      g.circle(p.x, p.y, 9).stroke({ color: GOLD, width: 1, alpha: 0.4 });
    }
  }, [reducedMotion]);
  useTick(animate);
  return (
    <pixiGraphics
      ref={graphics}
      draw={useCallback((g: Graphics) => {
        g.clear();
      }, [])}
    />
  );
}
export const BOARD_MOTION = {
  stepMs: 155,
  diceMs: 1100,
  dicePauseMs: 450,
  arrivalMs: 300,
  flightMs: 1100,
  routeFadeMs: 2800,
} as const;
function RenderBudget({ reducedMotion, visible, frameKey, quality, host }: {
  reducedMotion: boolean; visible: boolean; frameKey: unknown; quality: Quality;
  host: React.RefObject<HTMLDivElement | null>;
}) {
  const { app, isInitialised } = useApplication();
  const measured = useRef({ started: performance.now(), frames: 0 });
  useTick(useCallback(() => {
    if (reducedMotion || !visible) return;
    if (host.current) host.current.dataset.sceneReady = "true";
    const m = measured.current;
    m.frames++;
    const now = performance.now();
    if (now - m.started >= 1000) {
      if (host.current) host.current.dataset.fps = String(Math.round(m.frames * 1000 / (now - m.started)));
      m.frames = 0; m.started = now;
    }
  }, [host, reducedMotion, visible]));
  useEffect(() => {
    if (!isInitialised || !app.ticker) return;
    const ticker = app.ticker;
    const resolution = Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.5 : quality === "medium" ? 1 : 0.75);
    if (app.renderer.resolution !== resolution) { app.renderer.resolution = resolution; app.resize(); }
    ticker.maxFPS = quality === "low" ? 30 : quality === "medium" ? 45 : 60;
    measured.current = { started: performance.now(), frames: 0 };
    if (!visible || reducedMotion) {
      ticker.stop();
      if (host.current) host.current.dataset.fps = "0";
    } else ticker.start();
    if (!visible || !reducedMotion) return;
    // A stopped scene renders once after state/asset/resize changes.
    const frame = requestAnimationFrame(() => {
      if (app.ticker !== ticker) return;
      // maxFPS can discard a solitary RAF immediately after app initialization.
      // Advance beyond its throttle interval, apply all positions, then render.
      ticker.update(Math.max(performance.now(), ticker.lastTime + 34));
      app.render();
      if (host.current) host.current.dataset.sceneReady = "true";
    });
    return () => cancelAnimationFrame(frame);
  }, [app, isInitialised, reducedMotion, visible, frameKey, quality, host]);
  return null;
}
function SceneAtmosphere({ quality, reducedMotion, presentation }: { quality: Quality; reducedMotion: boolean; presentation: Presentation }) {
  const particles = useRef<Graphics | null>(null), previousFrame = useRef(0);
  const animate = useCallback(() => {
    const g = particles.current;
    if (!g) return;
    const now = performance.now();
    if (now - previousFrame.current < 50) return;
    previousFrame.current = now;
    g.clear();
    const accent = presentation === "crash" || presentation === "bear" ? 0xed727b : presentation === "bull" ? 0x42d9a3 : 0xe0c18b;
    const count = quality === "low" ? 0 : quality === "medium" ? 12 : 28;
    for (let i = 0; i < count; i++) {
      const t = reducedMotion ? i / count : ((now / 16000) + i * 0.137) % 1;
      const x = 110 + ((i * 193) % 760), y = 510 - t * 400;
      const projected = onPlane({ x, y });
      g.circle(projected.x, projected.y, i % 3 ? 0.8 : 1.4).fill({ color: accent, alpha: Math.sin(t * Math.PI) * 0.25 });
    }
    for (let i = 0; i < HUBS.length - 1; i++) {
      const a = HUBS[i], b = HUBS[i + 1], t = reducedMotion ? 0.5 : ((now / 6500) + i * 0.23) % 1;
      const projected = onPlane({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 38 });
      g.circle(projected.x, projected.y, 2)
        .fill({ color: accent, alpha: 0.8 });
    }
  }, [quality, reducedMotion, presentation]);
  useTick(animate);
  return <pixiGraphics ref={particles} draw={useCallback((g: Graphics) => { g.clear(); }, [])} />;
}
function CameraRig({ world, tracking, game, hovered, focusZone, presentation, reducedMotion, host, overview, stage }: {
  world: React.RefObject<Container | null>; tracking: React.MutableRefObject<Point>; game: GameView;
  hovered: number | null; focusZone: string | null; presentation: Presentation; reducedMotion: boolean;
  host: React.RefObject<HTMLDivElement | null>; overview: boolean; stage?: PresentationStage;
}) {
  const { app } = useApplication();
  const active = game.players.find((p) => p.id === game.activePlayerId);
  const following = !reducedMotion && ["BOARD_FOCUS", "DICE_RESULT", "PAWN_MOVING", "PAWN_ARRIVAL", "SPACE_REVEAL"].includes(stage ?? "");
  const mode: CameraMode = presentation === "crash" ? "crash" : overview ? "global" : hovered !== null ? "cell" : following ? "player" : focusZone ? "zone" : !reducedMotion && game.phase === "sector" ? "player" : "global";
  const current = useRef({ x: 0, y: 0, scale: 1, initialized: false });
  useEffect(() => { if (host.current) host.current.dataset.camera = mode; }, [host, mode]);
  useTick(useCallback((ticker: Ticker) => {
    if (!world.current || !app.screen.width || !app.screen.height) return;
    const width = app.screen.width, height = app.screen.height;
    const base = Math.min(width / 1060, Math.max(180, height - 24) / 550);
    const target = hovered !== null ? onPlane(cellPoint(hovered)) : focusZone ? onPlane(HUBS.find((h) => h.id === focusZone) || HUBS[1]) : active ? tracking.current : onPlane({ x: 500, y: 325 });
    const center = onPlane({ x: 500, y: 325 });
    const zoom = mode === "crash" ? 0.93 : mode === "zone" ? 1.1 : mode === "cell" ? 1.18 : mode === "player" ? following ? 1.22 : 1.07 : 1;
    const scale = base * zoom;
    // During a move the view may crop the distant rail; the active foot remains in context.
    const pan = mode === "global" || mode === "crash" ? 0 : mode === "zone" ? 0.12 : following ? 0.3 : 0.18;
    const x = width * 0.49 - (center.x + (target.x - center.x) * pan) * scale;
    const y = height * 0.52 - (center.y + (target.y - center.y) * pan) * scale;
    const m = current.current, ease = reducedMotion || !m.initialized ? 1 : 1 - Math.exp(-Math.min(50, ticker.deltaMS) / 420);
    m.x += (x - m.x) * ease; m.y += (y - m.y) * ease; m.scale += (scale - m.scale) * ease; m.initialized = true;
    world.current.position.set(m.x, m.y); world.current.scale.set(m.scale);
  }, [app, world, tracking, active, hovered, focusZone, mode, reducedMotion, following]));
  return null;
}
/** The complete printed surface is captured once per data change, then projected as one mesh. */
function ProjectedSurface({ floor, quality, frameKey }: {
  floor: React.RefObject<Container | null>; quality: Quality; frameKey: unknown;
}) {
  const { app, isInitialised } = useApplication();
  const mesh = useRef<MeshPlane | null>(null);
  const surfaceTexture = useRef<Texture | null>(null);
  useEffect(() => {
    const source = floor.current;
    if (!isInitialised || !source || !mesh.current) return;
    source.visible = true;
    let generated: Texture;
    try {
      generated = app.renderer.generateTexture({ target: source, frame: new Rectangle(0, 0, WIDTH, HEIGHT), resolution: quality === "high" ? 2 : quality === "medium" ? 1.5 : 1, antialias: quality !== "low" });
    } finally { source.visible = false; }
    // Swap synchronously before disposing the old texture. React state updates
    // can defer the mesh prop while RenderBudget renders a stopped scene.
    const previous = surfaceTexture.current;
    mesh.current.texture = generated;
    mesh.current.geometry.positions = boardMeshPositions(29, 19);
    surfaceTexture.current = generated;
    app.render();
    previous?.destroy(true);
  }, [app, isInitialised, floor, quality, frameKey]);
  useEffect(() => () => {
    if (mesh.current) mesh.current.texture = Texture.EMPTY;
    surfaceTexture.current?.destroy(true);
    surfaceTexture.current = null;
  }, []);
  return <pixiMeshPlane ref={mesh} texture={Texture.EMPTY} verticesX={29} verticesY={19} eventMode="none" />;
}
function BoardStage({ game, land, metal, night, pawnTextures, cityTextures, reducedMotion, hovered, focusZone, quality, presentation, host, overview, timeline, stage }: {
  game: GameView; land: LandData | null; metal?: Texture; night?: Texture; pawnTextures: Partial<Record<PawnId, Texture>>; cityTextures: Partial<Record<string, Texture>>;
  reducedMotion: boolean; hovered: number | null; focusZone: string | null; quality: Quality; presentation: Presentation;
  host: React.RefObject<HTMLDivElement | null>; overview: boolean; timeline: BoardTimeline | null; stage?: PresentationStage;
}) {
  const floor = useRef<Container | null>(null), world = useRef<Container | null>(null);
  const active = game.players.find((player) => player.id === game.activePlayerId);
  const tracking = useRef(onPlane(cellPoint(active?.sectorPosition || 0)));
  const rollNotice = [...game.notices].reverse().find((notice) => notice.roll);
  const visibleRoll = stage === "DICE_ROLLING" ? "—" : timeline?.roll || rollNotice?.roll || "—";
  const highlightedPosition = stage === "PAWN_MOVING" ? null : active?.sectorPosition;
  // Presentation snapshots copy arrays at every stage. Cache the printed data,
  // so unchanged cells and plaques do not stall the animated scene with a capture.
  const printedKey = JSON.stringify([
    Array.from({ length: 52 }, (_, index) => {
      const cell = game.board[index] || { kind: "sector", label: `Case ${index + 1}` };
      return [cell.kind, cell.label, cell.sector || ""];
    }),
    game.cycle, highlightedPosition, visibleRoll,
    HUBS.map(hub => [
      game.zoneGrades[hub.id] || "C",
      game.companies.filter(company => company.zone === hub.id).length,
      hub.id === focusZone || active?.zone === hub.id,
    ]),
  ]);
  const floorKey = useMemo(() => ({ land, metal, night, printedKey }), [land, metal, night, printedKey]);
  const accent = presentation === "crash" || presentation === "bear" ? 0xed727b : presentation === "bull" ? 0x42d9a3 : GOLD;
  const selection = useCallback((g: Graphics) => {
    const rect = (x: number, y: number, width: number, height: number) => [onPlane({x,y}), onPlane({x:x+width,y}), onPlane({x:x+width,y:y+height}), onPlane({x,y:y+height})].flatMap(point => [point.x,point.y]);
    g.clear().poly(rect(117,90,766,466)).stroke({ color: accent, width: presentation ? 2 : 0.7, alpha: presentation ? 0.7 : 0.3 });
    if (hovered !== null) {
      const cell = cellRect(hovered);
      g.poly(rect(cell.x+2,cell.y+2,cell.width-4,cell.height-4)).fill({ color: PALE, alpha: 0.08 }).stroke({ color: PALE, width: 1.5 });
    }
    if (focusZone) {
      const hub = HUBS.find(candidate => candidate.id === focusZone);
      if (hub) projectedEllipse(g,hub.x,hub.y,78,40).stroke({color:PALE,width:1.3,alpha:0.55});
    }
  }, [accent, focusZone, presentation, hovered]);
  const foundation = useCallback((g: Graphics) => {
    const corners = [{x:25,y:25},{x:975,y:25},{x:975,y:615},{x:25,y:615}].map(onPlane);
    const [a,b,c,d] = corners;
    g.clear().poly(corners.flatMap(point => [point.x+4,point.y+15])).fill({color:0x000000,alpha:0.48});
    g.poly([b.x,b.y,c.x,c.y,c.x,c.y+9,b.x,b.y+6]).fill(0x17232c).stroke({color:0x685636,width:0.7});
    g.poly([d.x,d.y,c.x,c.y,c.x,c.y+9,d.x,d.y+9]).fill(0x101b25).stroke({color:0x8a7048,width:0.8});
    g.moveTo(d.x+3,d.y+6).lineTo(c.x-3,c.y+6).stroke({color:GOLD,width:0.6,alpha:0.4});
  }, []);
  const exchange = onPlane({ x:205, y:540 });
  return <>
    <pixiContainer ref={floor} visible={false} eventMode="none">
      <PhysicalBoard metal={metal} /><WorldMap land={land} night={night} />
      <Txt text="RÉSEAU DES MARCHÉS MONDIAUX" x={142} y={111} size={11} anchor={0} fill={GOLD} weight="600" spacing={1.5} />
      <Txt text="GLOBAL FUND" x={424} y={533} size={23} fill={PALE} spacing={3} />
      <Txt text="INVESTIR · ANTICIPER · DOMINER" x={424} y={549} size={7.5} fill={0x9faeaa} spacing={1.4} />
      <Txt text={`CYCLE ${String(game.cycle).padStart(2,"0")}`} x={849} y={110} size={9} anchor={1} fill={0xa9bdc9} spacing={1} />
      <Txt text="DÉ SECTORIEL" x={730} y={533} size={10} fill={GOLD} weight="600" />
      <Txt text={`RÉSULTAT  ${visibleRoll}`} x={730} y={548} size={9} fill={0xbfcbd1} />
      {Array.from({length:52},(_,index) => <BoardTile key={index} index={index} cell={game.board[index] || {kind:"sector",label:`Case ${index+1}`}} active={highlightedPosition===index} />)}
      {HUBS.map(hub => <HubPlaque key={hub.id} hub={hub} game={game} focused={hub.id===focusZone} />)}
    </pixiContainer>
    <CameraRig world={world} tracking={tracking} game={game} hovered={hovered} focusZone={focusZone} presentation={presentation} reducedMotion={reducedMotion} host={host} overview={overview} stage={stage} />
    <pixiContainer ref={world} eventMode="none">
      <pixiGraphics draw={foundation} />
      <ProjectedSurface floor={floor} quality={quality} frameKey={floorKey} />
      <pixiGraphics draw={selection} eventMode="none" />
      <pixiContainer sortableChildren eventMode="passive">
        {HUBS.map(hub => <Hub key={hub.id} hub={hub} game={game} focused={hub.id===focusZone} texture={cityTextures[hub.id]} />)}
        {game.players.map((player,index) => <GeographicPawn key={`region-${player.id}`} player={player} players={game.players} number={index+1} active={player.id===game.activePlayerId} reducedMotion={reducedMotion} texture={pawnTextures[player.pawn]} />)}
        {cityTextures.exchange && <pixiSprite texture={cityTextures.exchange} x={exchange.x} y={exchange.y} zIndex={exchange.y} anchor={{x:0.5,y:1}} width={72*boardDepthScale(540)} height={72*boardDepthScale(540)} />}
        <Dice roll={rollNotice?.roll || 1} timeline={timeline} reducedMotion={reducedMotion} />
        {game.players.map(player => <AnimatedToken key={player.id} player={player} players={game.players} active={player.id===game.activePlayerId} reducedMotion={reducedMotion} texture={pawnTextures[player.pawn]} timeline={timeline} tracking={tracking} />)}
      </pixiContainer>
      <SceneAtmosphere quality={quality} reducedMotion={reducedMotion} presentation={presentation} />
      <TravelRoute game={game} reducedMotion={reducedMotion} />
    </pixiContainer>
  </>;
}
export default function BoardScene({ game, onRoll, disabled = false, reducedMotion = false, focusZone = null, quality = "high", presentation = null, overview = false, timeline = null, stage }: BoardSceneProps) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!document.hidden), [land, setLand] = useState<LandData | null>(null);
  const [textures, setTextures] = useState<{ metal?: Texture; night?: Texture; pawns: Partial<Record<PawnId, Texture>>; cities: Partial<Record<string, Texture>> }>({ pawns: {}, cities: {} });
  const [hovered, setHovered] = useState<number | null>(null), [rollTrigger, setRollTrigger] = useState(0), [systemReduced, setSystemReduced] = useState(false), [viewport, setViewport] = useState(0);
  useEffect(() => {
    let intersecting = true;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver((entries) => { intersecting = entries[0]?.isIntersecting ?? true; update(); });
    if (canvasHost.current) observer.observe(canvasHost.current);
    document.addEventListener("visibilitychange", update);
    const resize = new ResizeObserver(() => setViewport((v) => v+1));
    if (canvasHost.current) resize.observe(canvasHost.current);
    return () => { observer.disconnect(); resize.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches); update();
    media.addEventListener("change", update); return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const controller = new AbortController(); let alive = true;
    fetch("/assets/world/ne_110m_land.geojson", { signal: controller.signal }).then((r) => { if (!r.ok) throw new Error("Map asset unavailable"); return r.json(); }).then((data: LandData) => { if (alive) setLand(data); }).catch(() => {});
    const ids: PawnId[] = ["lion","bull","globe","crystal","tower","leaf"];
    const cityIds = [...HUBS.map((hub) => hub.id), "exchange"];
    Promise.allSettled([Assets.load<Texture>("/assets/board/board-metal.jpg"), Assets.load<Texture>("/assets/world/nasa-black-marble-2016.jpg"), ...ids.map((id) => Assets.load<Texture>(`/assets/pawns/premium/${id}.webp`)), ...cityIds.map((id) => Assets.load<Texture>(`/assets/world/cities/${id}.webp`))]).then((results) => {
      if (!alive) return;
      const loaded: typeof textures = { pawns: {}, cities: {} };
      if (results[0].status === "fulfilled") loaded.metal = results[0].value;
      if (results[1].status === "fulfilled") loaded.night = results[1].value;
      ids.forEach((id,i) => { const result = results[i+2]; if (result.status === "fulfilled") loaded.pawns[id] = result.value; });
      cityIds.forEach((id,i) => { const result = results[i + ids.length + 2]; if (result.status === "fulfilled") loaded.cities[id] = result.value; });
      setTextures(loaded);
    });
    return () => { alive = false; controller.abort(); };
  }, []);
  const active = game.players.find((p) => p.id === game.activePlayerId), selected = hovered ?? active?.sectorPosition ?? 0;
  const summary = useMemo(() => game.players.map((p) => `${p.name} : case ${p.sectorPosition+1}, ${game.board[p.sectorPosition]?.label || "départ"}, marché ${game.zones.find((z) => z.id === playerRegion(p))?.name || playerRegion(p)}${p.jailed ? ", en enquête" : ""}`).join(". "), [game.players, game.board, game.zones]);
  const animateLess = reducedMotion || systemReduced;
  const frameKey = useMemo(() => ({ game, textures, land, hovered, viewport, focusZone, presentation, quality, rollTrigger, overview, timeline, stage }), [game, textures, land, hovered, viewport, focusZone, presentation, quality, rollTrigger, overview, timeline, stage]);
  return <section className="fund-board" aria-label="Plateau des marchés mondiaux" data-quality={quality} data-reduced-motion={animateLess} data-presentation-stage={stage} data-dice-state={stage === "DICE_ROLLING" && !animateLess ? "rolling" : "stopped"} data-pawn-state={stage === "PAWN_MOVING" && !animateLess ? "moving" : "idle"}>
    <div ref={canvasHost} className="fund-board-canvas" role="img" aria-label={`Plateau Global Fund. ${summary}`} data-camera="global" data-fps="0" data-scene-ready="false">
      <Application resizeTo={canvasHost} width={WIDTH} height={HEIGHT} backgroundAlpha={0} antialias={false} resolution={Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.5 : quality === "medium" ? 1 : 0.75)} autoDensity>
        <BoardStage game={game} land={land} metal={textures.metal} night={textures.night} pawnTextures={textures.pawns} cityTextures={textures.cities} reducedMotion={animateLess} timeline={timeline} stage={stage} hovered={hovered} focusZone={focusZone} quality={quality} presentation={presentation} host={canvasHost} overview={overview} />
        <RenderBudget reducedMotion={animateLess} visible={visible} frameKey={frameKey} quality={quality} host={canvasHost} />
      </Application>
    </div>
    {hovered !== null && <div className="fund-board-tooltip" aria-hidden="true"><span>SEMAINE {String(selected+1).padStart(2,"0")}</span><strong>{game.board[selected]?.label}</strong></div>}
    <div className="fund-board-accessible">
      <details><summary>Explorer les 52 cases</summary><p aria-live="polite">{summary}</p><ol>{game.board.map((c,i) => <li key={i}><button type="button" onFocus={() => setHovered(i)} onBlur={() => setHovered(null)} aria-current={active?.sectorPosition === i ? "step" : undefined}>Case {i+1} : {c.label}{game.players.filter((p) => p.sectorPosition === i).map((p) => ` — ${p.name}`).join("")}</button></li>)}</ol></details>
      {onRoll && <button className="fund-board-accessible-roll" type="button" disabled={disabled} onClick={() => { setRollTrigger((v) => v+1); onRoll(); }}>Lancer le dé</button>}
    </div>
  </section>;
}
