import { Application, extend, useApplication, useTick } from "@pixi/react";
import {
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
  type Ticker,
} from "pixi.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NATIONALITIES,
  type BoardCell,
  type GameView,
  type PawnId,
  type Player,
} from "@global-fund/shared";
import "./board-scene.css";

extend({ Container, Graphics, Sprite, Text });
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
  { id: "americas", title: "AMÉRIQUES", x: 290, y: 305, px: 195, py: 226 },
  { id: "europe", title: "EUROPE", x: 525, y: 260, px: 462, py: 158 },
  { id: "asia", title: "ASIE", x: 713, y: 305, px: 685, py: 215 },
  { id: "africa", title: "AFRIQUE", x: 530, y: 391, px: 437, py: 414 },
  { id: "oceania", title: "OCÉANIE", x: 798, y: 441, px: 713, py: 459 },
] as const;
type Point = { x: number; y: number };
type Geometry = { type: string; coordinates: number[][][] | number[][][][] };
type LandData = { features: { geometry: Geometry }[] };

export interface BoardSceneProps {
  game: GameView;
  onRoll?: () => void;
  disabled?: boolean;
  reducedMotion?: boolean;
}
/** The clockwise 14 by 14 perimeter has exactly 52 cells, including four corners. */
export function cellRect(index: number) {
  const i = ((index % 52) + 52) % 52;
  let col = 0,
    row = 0;
  if (i < 14) col = i;
  else if (i < 26) {
    col = 13;
    row = i - 13;
  } else if (i < 40) {
    col = 39 - i;
    row = 13;
  } else {
    col = 0;
    row = 52 - i;
  }
  return { x: 45 + col * 65, y: 43 + row * 40, width: 65, height: 40 };
}
function cellPoint(index: number): Point {
  const r = cellRect(index);
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
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
function PhysicalBoard({
  walnut,
  metal,
}: {
  walnut?: Texture;
  metal?: Texture;
}) {
  const draw = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(14, 28, 972, 608, 25).fill({ color: 0x000000, alpha: 0.45 });
    g.roundRect(26, 35, 948, 594, 18)
      .fill(0x241d15)
      .stroke({ color: 0x665039, width: 2 });
    for (let i = 0; i < 7; i++)
      g.roundRect(29, 41 + i * 2, 942, 577, 15).stroke({
        color: i % 2 ? 0x4c3520 : 0x140e09,
        width: 1,
      });
    g.roundRect(28, 26, 944, 595, 18)
      .fill(0x211d18)
      .stroke({ color: 0x765637, width: 3 });
    g.roundRect(36, 34, 928, 579, 10)
      .fill(0x806038)
      .stroke({ color: 0xead296, width: 1 });
    g.roundRect(40, 38, 920, 571, 7)
      .fill(0x101923)
      .stroke({ color: 0x342c23, width: 2 });
    g.rect(110, 83, 780, 480).fill(0x061724).stroke({ color: GOLD, width: 2 });
    g.rect(116, 89, 768, 468).stroke({ color: 0x625538, width: 1 });
    g.moveTo(37, 33)
      .lineTo(963, 33)
      .stroke({ color: 0xffe5a6, alpha: 0.8, width: 1 });
    for (const x of [35, 965])
      for (const y of [33, 616]) {
        g.circle(x, y, 3).fill(0x3b2b18).stroke({ color: GOLD, width: 1 });
        g.moveTo(x - 1, y)
          .lineTo(x + 1, y)
          .stroke({ color: 0xecd598, width: 0.8 });
      }
  }, []);
  return (
    <pixiContainer>
      {walnut && (
        <pixiSprite
          texture={walnut}
          width={WIDTH}
          height={HEIGHT}
          alpha={0.22}
        />
      )}
      <pixiGraphics draw={draw} />
      {metal && (
        <pixiSprite
          texture={metal}
          x={42}
          y={40}
          width={916}
          height={568}
          alpha={0.035}
        />
      )}
    </pixiContainer>
  );
}
function BoardTile({
  cell,
  index,
  active,
  onHover,
}: {
  cell: BoardCell;
  index: number;
  active: boolean;
  onHover: (index: number | null) => void;
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
        .rect(1, 1, 63, 38)
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
      g.rect(1, 1, 63, 38).stroke({
        color: active ? PALE : 0x837052,
        width: active ? 1.7 : 0.6,
        alpha: active ? 1 : 0.6,
      });
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
      eventMode="static"
      cursor="help"
      onPointerOver={() => onHover(index)}
      onPointerOut={() => onHover(null)}
    >
      <pixiGraphics draw={draw} />
      <Txt
        text={title}
        x={32.5}
        y={15}
        size={title.length > 9 ? 9 : 10}
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
function WorldMap({ land }: { land: LandData | null }) {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      for (let lon = -150; lon <= 150; lon += 30) {
        const p = project(lon, 83);
        g.moveTo(p.x, 130)
          .lineTo(p.x, 511)
          .stroke({ color: 0x4b8fa0, alpha: 0.11, width: 0.6 });
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const p = project(-180, lat);
        g.moveTo(119, p.y)
          .lineTo(881, p.y)
          .stroke({ color: 0x4b8fa0, alpha: 0.1, width: 0.6 });
      }
      for (const f of land?.features || []) {
        const polys =
          f.geometry.type === "MultiPolygon"
            ? (f.geometry.coordinates as number[][][][])
            : [f.geometry.coordinates as number[][][]];
        for (const polygon of polys) {
          const ring = polygon[0];
          if (!ring || ring.some((p) => p[1] < -66)) continue;
          const points = ring.flatMap(([lon, lat]) => {
            const p = project(lon, lat);
            return [p.x, p.y];
          });
          // Fine gold coastline over two stepped relief layers keeps the geography readable.
          g.poly(points.map((n, i) => n + (i % 2 ? 2.2 : 1.1))).fill(0x081019);
          g.poly(points)
            .fill(0x173d4c)
            .stroke({ color: 0x778967, alpha: 0.6, width: 0.8 });
        }
      }
      const cities = [
        [-74, 40.7],
        [-118, 34],
        [-87, 42],
        [-99, 19],
        [-46, -23],
        [-58, -34],
        [2, 49],
        [-0.1, 51],
        [13, 52],
        [28, 41],
        [37, 56],
        [31, 30],
        [18, -34],
        [3, 6],
        [36, -1],
        [55, 25],
        [73, 19],
        [103, 1],
        [121, 31],
        [116, 40],
        [139, 36],
        [151, -34],
        [144, -38],
        [174, -37],
        [127, 37],
        [114, 22],
        [100, 14],
        [106, -6],
      ];
      for (const [lon, lat] of cities) {
        const p = project(lon, lat);
        g.circle(p.x, p.y, 4).fill({ color: 0xe9bf70, alpha: 0.06 });
        g.circle(p.x, p.y, 1.5).fill({ color: 0xf6d793, alpha: 0.75 });
      }
      for (let h = 0; h < HUBS.length; h++)
        for (let j = h + 1; j < HUBS.length; j++) {
          const a = HUBS[h],
            b = HUBS[j];
          for (let i = 1; i < 30; i++) {
            const t = i / 30;
            const x = a.x + (b.x - a.x) * t,
              y = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 38;
            g.circle(x, y, 0.8).fill({ color: GOLD, alpha: 0.27 });
          }
        }
    },
    [land],
  );
  return <pixiGraphics draw={draw} />;
}
function Hub({ hub, game }: { hub: (typeof HUBS)[number]; game: GameView }) {
  const selected =
    game.players.find((p) => p.id === game.activePlayerId)?.zone === hub.id;
  const count = game.companies.filter((c) => c.zone === hub.id).length;
  const grade = game.zoneGrades[hub.id] || "C";
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.ellipse(hub.x + 4, hub.y + 9, 45, 9).fill({
        color: 0x000000,
        alpha: 0.5,
      });
      g.ellipse(hub.x, hub.y + 3, 42, 10)
        .fill(0x312c1d)
        .stroke({ color: GOLD, width: 0.6 });
      g.ellipse(hub.x, hub.y, 42, 9)
        .fill(0x52604b)
        .stroke({ color: 0xd6bc76, width: 0.8 });
      for (let i = 0; i < 9; i++) {
        const x = hub.x - 31 + i * 7,
          height = 10 + ((i * 19 + hub.x) % 27);
        g.poly([
          x,
          hub.y - 3,
          x,
          hub.y - height,
          x + 4,
          hub.y - height - 2,
          x + 7,
          hub.y - height,
          x + 7,
          hub.y - 1,
        ]).fill(0x9c8859);
        g.rect(x, hub.y - height, 4, height - 3).fill(
          i % 3 ? 0x3a4b49 : 0x727964,
        );
        g.moveTo(x, hub.y - height)
          .lineTo(x + 4, hub.y - height - 2)
          .lineTo(x + 7, hub.y - height)
          .stroke({ color: 0xf2d391, width: 0.7 });
        for (let y = hub.y - height + 4; y < hub.y - 4; y += 5)
          g.rect(x + 1.2, y, 1.2, 1.5).fill({ color: 0xf9d486, alpha: 0.65 });
      }
      // A slim spire is a landmark rather than a chart bar.
      g.poly([
        hub.x - 3,
        hub.y - 1,
        hub.x - 1,
        hub.y - 47,
        hub.x + 1,
        hub.y - 59,
        hub.x + 3,
        hub.y - 47,
        hub.x + 6,
        hub.y - 1,
      ]).fill(0xbba46a);
      g.moveTo(hub.x + 1, hub.y - 57)
        .lineTo(hub.x + 1, hub.y - 4)
        .stroke({ color: 0xffe0a0, width: 1 });
      g.roundRect(hub.px + 3, hub.py + 4, 125, 65, 5).fill({
        color: 0x000000,
        alpha: 0.45,
      });
      g.roundRect(hub.px, hub.py, 125, 65, 5)
        .fill(selected ? 0x173347 : 0x0b1d2a)
        .stroke({
          color: selected ? 0xf0cf86 : 0x79674b,
          width: selected ? 1.4 : 0.8,
        });
      g.moveTo(hub.px + 8, hub.py + 1)
        .lineTo(hub.px + 117, hub.py + 1)
        .stroke({ color: PALE, alpha: selected ? 0.8 : 0.28, width: 1 });
    },
    [hub, selected],
  );
  return (
    <pixiContainer>
      <pixiGraphics draw={draw} />
      <Txt
        text={hub.title}
        x={hub.px + 62.5}
        y={hub.py + 14}
        size={11}
        fill={selected ? 0xffffff : 0xd7e1e4}
        weight="700"
        spacing={1.2}
      />
      <Txt
        text={grade}
        x={hub.px + 62.5}
        y={hub.py + 35}
        size={24}
        fill={
          grade === "A" || grade === "B"
            ? 0x72d2b0
            : grade === "E"
              ? 0xea8b81
              : PALE
        }
        weight="600"
      />
      <Txt
        text={`${count} entreprises`}
        x={hub.px + 62.5}
        y={hub.py + 55}
        size={10}
        fill={0x93a8b7}
      />
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
function AnimatedToken({
  player,
  players,
  active,
  reducedMotion,
  texture,
}: {
  player: Player;
  players: Player[];
  active: boolean;
  reducedMotion: boolean;
  texture?: Texture;
}) {
  const token = useRef<Container | null>(null);
  const pedestal = useMemo(
    () =>
      texture
        ? new Texture({
            source: texture.source,
            frame: new Rectangle(
              texture.width * 0.23,
              texture.height * 0.59,
              texture.width * 0.54,
              texture.height * 0.29,
            ),
          })
        : null,
    [texture],
  );
  const halo = useRef<Graphics | null>(null);
  const pos = (((player.sectorPosition || 0) % 52) + 52) % 52;
  const sameCell = players.filter((p) => p.sectorPosition % 52 === pos);
  const stack = sameCell.findIndex((p) => p.id === player.id);
  const offset = (stack - (sameCell.length - 1) / 2) * 13;
  const motion = useRef({
    from: pos,
    to: pos,
    start: 0,
    steps: 0,
    xOffset: offset,
    reducedMotion,
  });
  useEffect(() => {
    const m = motion.current;
    if (m.to !== pos) {
      m.from = m.to;
      m.to = pos;
      m.steps = (pos - m.from + 52) % 52;
      m.start = performance.now();
    }
    m.xOffset = offset;
    m.reducedMotion = reducedMotion;
  }, [pos, offset, reducedMotion]);
  const animate = useCallback(
    (_ticker: Ticker) => {
      const m = motion.current,
        elapsed = performance.now() - m.start;
      const duration = Math.max(1, m.steps * 155),
        progress = m.reducedMotion ? 1 : Math.min(1, elapsed / duration);
      let point = cellPoint(m.to),
        hop = 0;
      if (progress < 1 && m.steps) {
        const fraction = progress * m.steps,
          step = Math.floor(fraction),
          t = fraction - step;
        const a = cellPoint(m.from + step),
          b = cellPoint(m.from + step + 1),
          smooth = t * t * (3 - 2 * t);
        point = {
          x: a.x + (b.x - a.x) * smooth,
          y: a.y + (b.y - a.y) * smooth,
        };
        hop = Math.sin(t * Math.PI) * 13;
      }
      if (token.current) {
        token.current.position.set(point.x + m.xOffset, point.y + 5 - hop);
        token.current.rotation =
          progress < 1 ? Math.sin(progress * m.steps * Math.PI * 2) * 0.045 : 0;
      }
      if (halo.current)
        halo.current.alpha = active
          ? m.reducedMotion
            ? 0.8
            : 0.65 + Math.sin(performance.now() / 650) * 0.15
          : 0;
    },
    [active],
  );
  useTick(animate);
  const draw = useCallback(
    (g: Graphics) => sculpt(g, player.pawn, color(player.color)),
    [player.pawn, player.color],
  );
  const drawHalo = useCallback(
    (g: Graphics) => {
      g.clear()
        .ellipse(0, 1, 24, 9)
        .stroke({ color: color(player.color), width: 2, alpha: 0.8 });
      g.ellipse(0, 1, 29, 11).stroke({
        color: color(player.color),
        width: 1,
        alpha: 0.25,
      });
    },
    [player.color],
  );
  const initial = cellPoint(pos);
  return (
    <pixiContainer
      ref={token}
      x={initial.x + offset}
      y={initial.y + 5}
      scale={0.77}
    >
      <pixiGraphics ref={halo} draw={drawHalo} />
      {pedestal && (
        <pixiSprite
          texture={pedestal}
          x={0}
          y={4}
          anchor={{ x: 0.5, y: 1 }}
          width={44}
          height={23}
        />
      )}
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

function playerRegion(player: Player): string {
  const home =
    NATIONALITIES.find((n) => n.id === player.nationality)?.zoneId || "europe";
  const region =
    player.jailed || player.zone === "prison"
      ? player.previousZone || home
      : player.zone || home;
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
  return { x: center.x + (index - (peers.length - 1) / 2) * 28, y: center.y };
}
/** Regional pawns are independent of the sector track and always show every fund's market. */
function GeographicPawn({
  player,
  players,
  number,
  active,
  reducedMotion,
  texture,
}: {
  player: Player;
  players: Player[];
  number: number;
  active: boolean;
  reducedMotion: boolean;
  texture?: Texture;
}) {
  const token = useRef<Container | null>(null);
  const region = playerRegion(player),
    point = regionalPoint(player, players),
    jailed = player.jailed || player.zone === "prison";
  const motion = useRef({
    region,
    from: point,
    to: point,
    start: -10000,
    reducedMotion,
  });
  const pedestal = useMemo(
    () =>
      texture
        ? new Texture({
            source: texture.source,
            frame: new Rectangle(
              texture.width * 0.23,
              texture.height * 0.59,
              texture.width * 0.54,
              texture.height * 0.29,
            ),
          })
        : null,
    [texture],
  );
  useEffect(() => {
    const m = motion.current;
    if (m.region !== region) {
      m.from = token.current
        ? { x: token.current.x, y: token.current.y }
        : m.to;
      m.region = region;
      m.start = performance.now();
    }
    m.to = point;
    m.reducedMotion = reducedMotion;
  }, [region, point.x, point.y, reducedMotion]);
  const animate = useCallback(() => {
    const m = motion.current,
      t = m.reducedMotion
        ? 1
        : Math.min(1, (performance.now() - m.start) / BOARD_MOTION.flightMs);
    const smooth = t * t * (3 - 2 * t);
    if (token.current) {
      token.current.position.set(
        m.from.x + (m.to.x - m.from.x) * smooth,
        m.from.y + (m.to.y - m.from.y) * smooth - Math.sin(t * Math.PI) * 70,
      );
      token.current.rotation = t < 1 ? Math.sin(t * Math.PI * 2) * 0.06 : 0;
    }
  }, []);
  useTick(animate);
  const draw = useCallback(
    (g: Graphics) =>
      sculpt(g, player.pawn, jailed ? 0x8f9ba5 : color(player.color)),
    [player.pawn, player.color, jailed],
  );
  const badge = useCallback(
    (g: Graphics) => {
      g.clear()
        .roundRect(-11, 6, 22, 14, 4)
        .fill(jailed ? 0x26313a : active ? 0x244334 : 0x112431)
        .stroke({
          color: jailed ? 0x71828e : color(player.color),
          width: active ? 1.1 : 0.7,
        });
      if (active)
        g.ellipse(0, 0, 13, 5).stroke({
          color: color(player.color),
          width: 1,
          alpha: 0.75,
        });
      if (jailed) {
        g.roundRect(8, -15, 11, 9, 2)
          .fill(0x71828e)
          .stroke({ color: 0xd8e0e5, width: 0.7 });
        g.moveTo(10, -15)
          .lineTo(10, -18)
          .quadraticCurveTo(13.5, -23, 17, -18)
          .lineTo(17, -15)
          .stroke({ color: 0xbac7cf, width: 1.7 });
        g.circle(13.5, -11, 1).fill(0x16202a);
      }
    },
    [active, jailed, player.color],
  );
  return (
    <pixiContainer ref={token} x={point.x} y={point.y}>
      <pixiContainer scale={0.49}>
        {pedestal && (
          <pixiSprite
            texture={pedestal}
            x={0}
            y={4}
            anchor={{ x: 0.5, y: 1 }}
            width={44}
            height={23}
            alpha={jailed ? 0.35 : 1}
          />
        )}
        <pixiGraphics draw={draw} />
      </pixiContainer>
      <pixiGraphics draw={badge} />
      <Txt
        text={String(number).padStart(2, "0")}
        x={0}
        y={13}
        size={9}
        fill={jailed ? 0xb8c1c8 : PALE}
        weight="700"
      />
    </pixiContainer>
  );
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
  for (const [x, y] of PIPS[value] || PIPS[1]) {
    g.circle(x, y, 3).fill(0x2b2f32);
    g.circle(x - 0.5, y - 0.7, 1.7).fill(0x53544e);
  }
}
function Dice({
  roll,
  rollId,
  trigger,
  reducedMotion,
}: {
  roll: number;
  rollId: number;
  trigger: number;
  reducedMotion: boolean;
}) {
  const die = useRef<Container | null>(null),
    face = useRef<Graphics | null>(null);
  const motion = useRef({
    start: -2000,
    result: roll,
    reducedMotion,
    rolling: false,
  });
  const mounted = useRef(false);
  const drawnFace = useRef(roll);
  useEffect(() => {
    const m = motion.current;
    m.result = roll;
    m.reducedMotion = reducedMotion;
    if (mounted.current) {
      m.start = performance.now();
      m.rolling = true;
    }
    mounted.current = true;
  }, [rollId, roll, trigger, reducedMotion]);
  const animate = useCallback(() => {
    const m = motion.current,
      elapsed = performance.now() - m.start;
    const rolling = m.rolling && elapsed < 750 && !m.reducedMotion;
    if (die.current) {
      die.current.rotation = rolling ? Math.sin(elapsed / 58) * 0.15 : 0;
      die.current.y = rolling
        ? 524 - Math.abs(Math.sin(elapsed / 115)) * 15
        : 524;
    }
    const nextFace = rolling ? 1 + (Math.floor(elapsed / 75) % 6) : m.result;
    if (face.current && drawnFace.current !== nextFace) {
      drawDice(face.current, nextFace);
      drawnFace.current = nextFace;
    }
    if (!rolling) m.rolling = false;
  }, []);
  useTick(animate);
  const draw = useCallback((g: Graphics) => drawDice(g, roll), [roll]);
  return (
    <pixiContainer ref={die} x={653} y={524}>
      <pixiGraphics ref={face} draw={draw} />
    </pixiContainer>
  );
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
    if (a && b) route.current = { from: a, to: b, started: performance.now() };
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
      const p = point(i / 44);
      g.circle(p.x, p.y, 1.7).fill({ color: PALE, alpha: alpha * 0.8 });
    }
    if (t < 1) {
      const p = point(t);
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
  diceMs: 750,
  flightMs: 1100,
  routeFadeMs: 2800,
} as const;
function RenderBudget({
  reducedMotion,
  visible,
  frameKey,
}: {
  reducedMotion: boolean;
  visible: boolean;
  frameKey: unknown;
}) {
  const { app, isInitialised } = useApplication();
  useEffect(() => {
    const ticker = app.ticker;
    if (!isInitialised || !ticker) return;
    // Une scène immobile ne doit pas monopoliser le GPU, surtout en rendu logiciel.
    ticker.maxFPS = reducedMotion ? 0 : 60;
    if (!visible || reducedMotion) ticker.stop();
    else ticker.start();
    if (!visible || !reducedMotion) return;
    const draw = () => {
      if (app.ticker === ticker) ticker.update(performance.now());
    };
    const frame = requestAnimationFrame(draw);
    const fade = window.setTimeout(draw, 3000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fade);
    };
  }, [app, isInitialised, reducedMotion, visible, frameKey]);
  return null;
}
function MarketAtmosphere({
  game,
  reducedMotion,
}: {
  game: GameView;
  reducedMotion: boolean;
}) {
  const overlay = useRef<Graphics | null>(null);
  const last = game.notices[game.notices.length - 1];
  const label = `${last?.title || ""} ${last?.cell?.label || ""} ${game.currentContext?.title || ""}`;
  const accent = /crash|bear|récession|crise/i.test(label)
    ? 0xdd6d65
    : /bull|croissance|essor/i.test(label)
      ? TEAL
      : GOLD;
  const started = useRef(-10000),
    previous = useRef(game.noticeSeq);
  useEffect(() => {
    if (previous.current !== game.noticeSeq) {
      previous.current = game.noticeSeq;
      started.current = performance.now();
    }
  }, [game.noticeSeq]);
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
        .rect(118, 91, 764, 464)
        .stroke({ color: accent, width: 1, alpha: 0.7 });
      g.rect(120, 93, 760, 460).stroke({
        color: accent,
        width: 7,
        alpha: 0.06,
      });
    },
    [accent],
  );
  const animate = useCallback(() => {
    if (overlay.current)
      overlay.current.alpha = reducedMotion
        ? 0.4
        : 0.35 +
          Math.max(0, 1 - (performance.now() - started.current) / 1500) * 0.65;
  }, [reducedMotion]);
  useTick(animate);
  return <pixiGraphics ref={overlay} draw={draw} />;
}
function BoardStage({
  game,
  land,
  walnut,
  metal,
  pawnTextures,
  reducedMotion,
  rollTrigger,
  onHover,
}: {
  game: GameView;
  land: LandData | null;
  walnut?: Texture;
  metal?: Texture;
  pawnTextures: Partial<Record<PawnId, Texture>>;
  reducedMotion: boolean;
  rollTrigger: number;
  onHover: (i: number | null) => void;
}) {
  const active = game.players.find((p) => p.id === game.activePlayerId);
  const rollNotice = [...game.notices].reverse().find((n) => n.roll);
  const footerDraw = useCallback((g: Graphics) => {
    g.clear()
      .moveTo(136, 510)
      .lineTo(391, 510)
      .stroke({ color: GOLD, width: 0.7, alpha: 0.4 });
    g.circle(428, 527, 17).stroke({ color: GOLD, width: 1 });
    g.ellipse(428, 527, 8, 17).stroke({ color: GOLD, width: 0.7 });
    g.ellipse(428, 527, 17, 6).stroke({ color: GOLD, width: 0.7 });
    g.moveTo(449, 509)
      .lineTo(594, 509)
      .stroke({ color: GOLD, width: 0.6, alpha: 0.3 });
  }, []);
  return (
    <>
      <PhysicalBoard walnut={walnut} metal={metal} />
      <WorldMap land={land} />
      <MarketAtmosphere game={game} reducedMotion={reducedMotion} />
      <Txt
        text="LES MARCHÉS MONDIAUX"
        x={139}
        y={111}
        size={12}
        anchor={0}
        fill={GOLD}
        weight="600"
        spacing={1.8}
      />
      <Txt
        text={`CYCLE ${`${game.cycle}`.padStart(2, "0")}  /  RÉSEAU GLOBAL`}
        x={863}
        y={113}
        size={10}
        anchor={1}
        fill={0x8ca7b8}
        spacing={1.1}
      />
      {HUBS.map((h) => (
        <Hub key={h.id} hub={h} game={game} />
      ))}
      <TravelRoute game={game} reducedMotion={reducedMotion} />
      {game.players.map((p, i) => (
        <GeographicPawn
          key={p.id}
          player={p}
          players={game.players}
          number={i + 1}
          active={p.id === game.activePlayerId}
          reducedMotion={reducedMotion}
          texture={pawnTextures[p.pawn]}
        />
      ))}
      <pixiGraphics draw={footerDraw} />
      <Txt
        text="GLOBAL FUND"
        x={451}
        y={518}
        size={17}
        anchor={0}
        fill={PALE}
        weight="500"
        spacing={1.5}
      />
      <Txt
        text="INVESTIR · ANTICIPER · DOMINER"
        x={451}
        y={542}
        size={7.5}
        anchor={0}
        fill={0x998868}
        spacing={1.1}
      />
      <Txt
        text={
          game.currentContext?.title?.toUpperCase().slice(0, 34) ||
          "MARCHÉS À L’ÉQUILIBRE"
        }
        x={142}
        y={529}
        size={11}
        anchor={0}
        fill={PALE}
        weight="600"
      />
      <Txt
        text="CONTEXTE ÉCONOMIQUE"
        x={142}
        y={546}
        size={8}
        anchor={0}
        fill={0x8ca7b8}
        spacing={1.4}
      />
      <Dice
        roll={rollNotice?.roll || 1}
        rollId={rollNotice?.id || 0}
        trigger={rollTrigger}
        reducedMotion={reducedMotion}
      />
      <Txt
        text={game.phase === "sector" ? "LANCEZ LE DÉ" : "DÉ SECTORIEL"}
        x={713}
        y={529}
        size={9}
        anchor={0}
        fill={GOLD}
        weight="600"
        spacing={0.7}
      />
      <Txt
        text="PARCOURS DE 52 CASES"
        x={713}
        y={545}
        size={8}
        anchor={0}
        fill={0x8ca7b8}
      />
      {Array.from({ length: 52 }, (_, i) => (
        <BoardTile
          key={i}
          index={i}
          cell={game.board[i] || { kind: "sector", label: `Case ${i + 1}` }}
          active={active?.sectorPosition === i}
          onHover={onHover}
        />
      ))}
      {/* Tokens deliberately follow every board, geography, route, and label layer. */}
      {game.players.map((p) => (
        <AnimatedToken
          key={p.id}
          player={p}
          players={game.players}
          active={p.id === game.activePlayerId}
          reducedMotion={reducedMotion}
          texture={pawnTextures[p.pawn]}
        />
      ))}
    </>
  );
}
export default function BoardScene({
  game,
  onRoll,
  disabled = false,
  reducedMotion = false,
}: BoardSceneProps) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [land, setLand] = useState<LandData | null>(null);
  const [textures, setTextures] = useState<{
    walnut?: Texture;
    metal?: Texture;
    pawns: Partial<Record<PawnId, Texture>>;
  }>({ pawns: {} });
  const [hovered, setHovered] = useState<number | null>(null);
  const [rollTrigger, setRollTrigger] = useState(0);
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) =>
      setVisible(entries[0]?.isIntersecting ?? true),
    );
    if (canvasHost.current) observer.observe(canvasHost.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    fetch("/assets/world/ne_110m_land.geojson", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Map asset unavailable");
        return r.json();
      })
      .then((data: LandData) => {
        if (alive) setLand(data);
      })
      .catch(() => {});
    const pawnIds: PawnId[] = [
      "lion",
      "bull",
      "globe",
      "crystal",
      "tower",
      "leaf",
    ];
    Promise.allSettled([
      Assets.load<Texture>("/assets/board/board-walnut.jpg"),
      Assets.load<Texture>("/assets/board/board-metal.jpg"),
      ...pawnIds.map((p) => Assets.load<Texture>(`/assets/pawns/${p}.png`)),
    ]).then((results) => {
      if (!alive) return;
      const loaded: {
        walnut?: Texture;
        metal?: Texture;
        pawns: Partial<Record<PawnId, Texture>>;
      } = { pawns: {} };
      if (results[0].status === "fulfilled") loaded.walnut = results[0].value;
      if (results[1].status === "fulfilled") loaded.metal = results[1].value;
      pawnIds.forEach((id, i) => {
        const item = results[i + 2];
        if (item.status === "fulfilled") loaded.pawns[id] = item.value;
      });
      setTextures(loaded);
    });
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);
  const active = game.players.find((p) => p.id === game.activePlayerId);
  const selected = hovered ?? active?.sectorPosition ?? 0;
  const cell = game.board[selected];
  const playersHere = game.players.filter((p) => p.sectorPosition === selected);
  const summary = useMemo(
    () =>
      game.players
        .map(
          (p) =>
            `${p.name} : case ${p.sectorPosition + 1}, ${game.board[p.sectorPosition]?.label || "départ"}, marché ${game.zones.find((z) => z.id === playerRegion(p))?.name || playerRegion(p)}${p.jailed ? " (en enquête)" : ""}`,
        )
        .join(". "),
    [game.players, game.board],
  );
  const animateLess = reducedMotion || systemReduced;
  const frameKey = useMemo(
    () => ({ game, textures, land, hovered }),
    [game, textures, land, hovered],
  );
  return (
    <section className="fund-board" aria-label="Plateau des marchés mondiaux">
      <div className="fund-board-heading">
        <span>
          <i /> TABLE DES MARCHÉS
        </span>
        <span className="fund-board-live">
          52 CASES <b>·</b> 5 ZONES
        </span>
      </div>
      <div
        ref={canvasHost}
        className="fund-board-canvas"
        role="img"
        aria-label={`Plateau Global Fund. ${summary}`}
      >
        <Application
          width={WIDTH}
          height={HEIGHT}
          background={0x07111b}
          antialias
          resolution={Math.min(window.devicePixelRatio || 1, 2)}
          autoDensity
        >
          <RenderBudget
            reducedMotion={animateLess}
            visible={visible}
            frameKey={frameKey}
          />
          <BoardStage
            game={game}
            land={land}
            walnut={textures.walnut}
            metal={textures.metal}
            pawnTextures={textures.pawns}
            reducedMotion={animateLess}
            rollTrigger={rollTrigger}
            onHover={setHovered}
          />
        </Application>
      </div>
      <div className="fund-board-caption">
        <div>
          <span className="fund-board-cell-number">
            {`${selected + 1}`.padStart(2, "0")}
          </span>
          <span>
            <strong>{cell?.label || "Départ"}</strong>
            <small>
              {playersHere.length
                ? playersHere.map((p) => p.name).join(" · ")
                : "Survolez une case pour explorer le parcours"}
            </small>
          </span>
        </div>
        {onRoll && (
          <button
            type="button"
            className="fund-board-roll"
            disabled={disabled}
            onClick={() => {
              setRollTrigger((v) => v + 1);
              onRoll();
            }}
          >
            Lancer le dé <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
      <ol
        className="fund-board-region-legend"
        aria-label="Implantation géographique des fonds"
      >
        {game.players.map((p, i) => (
          <li
            key={p.id}
            className={
              p.jailed || p.zone === "prison" ? "is-detained" : undefined
            }
            aria-current={p.id === game.activePlayerId ? "true" : undefined}
          >
            <span
              className="fund-board-fund-number"
              style={{
                color: p.jailed ? "#95a3ad" : p.color,
                borderColor: p.jailed ? "#71828e" : p.color,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <strong>{p.name}</strong>
              <small>
                {p.jailed || p.zone === "prison" ? "Enquête · " : ""}
                {game.zones.find((z) => z.id === playerRegion(p))?.name ||
                  playerRegion(p)}
              </small>
            </span>
          </li>
        ))}
      </ol>
      <details className="fund-board-accessible">
        <summary>Consulter le plateau en liste</summary>
        <p aria-live="polite">{summary}</p>
        <ol>
          {game.board.map((c, i) => (
            <li
              key={i}
              aria-current={active?.sectorPosition === i ? "step" : undefined}
            >
              <strong>
                Case {i + 1} : {c.label}
              </strong>
              {game.players
                .filter((p) => p.sectorPosition === i)
                .map((p) => (
                  <span key={p.id}> — {p.name}</span>
                ))}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
