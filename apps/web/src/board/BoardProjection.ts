/** Logical board space is shared by the printed surface, figures and input. */
export interface BoardPoint { x: number; y: number }
export const BOARD_PLANE = { width: 1000, height: 650, top: 25, bottom: 615, centerX: 500 } as const;
const FAR_DENOMINATOR = 1.105;
const DENOMINATOR_SLOPE = 1 - FAR_DENOMINATOR;
const SCREEN_TOP = 70;
const SCREEN_HEIGHT = 510;
const HORIZONTAL_SCALE = 0.98;

/** A symmetric pinhole homography: the far rail is only ten percent narrower. */
export function boardToScreen(x: number, y: number): BoardPoint {
  const depth = (y - BOARD_PLANE.top) / (BOARD_PLANE.bottom - BOARD_PLANE.top);
  const denominator = FAR_DENOMINATOR + DENOMINATOR_SLOPE * depth;
  return {
    x: BOARD_PLANE.centerX + (x - BOARD_PLANE.centerX) * HORIZONTAL_SCALE / denominator,
    y: SCREEN_TOP + SCREEN_HEIGHT * depth / denominator,
  };
}

/** Inverts the same camera, for hit testing in projected world coordinates. */
export function screenToBoard(x: number, y: number): BoardPoint {
  const vertical = y - SCREEN_TOP;
  const depth = vertical * FAR_DENOMINATOR / (SCREEN_HEIGHT - vertical * DENOMINATOR_SLOPE);
  const denominator = FAR_DENOMINATOR + DENOMINATOR_SLOPE * depth;
  return {
    x: BOARD_PLANE.centerX + (x - BOARD_PLANE.centerX) * denominator / HORIZONTAL_SCALE,
    y: BOARD_PLANE.top + depth * (BOARD_PLANE.bottom - BOARD_PLANE.top),
  };
}

/** Upright pieces keep their silhouette and shrink with the plane's depth. */
export function boardDepthScale(y: number): number {
  const depth = (y - BOARD_PLANE.top) / (BOARD_PLANE.bottom - BOARD_PLANE.top);
  return 1 / (FAR_DENOMINATOR + DENOMINATOR_SLOPE * depth);
}

/** The clockwise 14 by 14 perimeter includes each corner exactly once. */
export function boardCellRect(index: number) {
  const i = ((index % 52) + 52) % 52;
  let col = 0, row = 0;
  if (i < 14) col = i;
  else if (i < 26) { col = 13; row = i - 13; }
  else if (i < 40) { col = 39 - i; row = 13; }
  else { col = 0; row = 52 - i; }
  return { x: 45 + col * 65, y: 43 + row * 40, width: 65, height: 40 };
}
export function boardCellPoint(index: number): BoardPoint {
  const rect = boardCellRect(index);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}
export function boardCellAtScreen(x: number, y: number): number | null {
  const point = screenToBoard(x, y);
  for (let index = 0; index < 52; index++) {
    const rect = boardCellRect(index);
    if (point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height) return index;
  }
  return null;
}

/** Dense triangles share this camera with every object anchor. */
export function boardMeshPositions(columns: number, rows: number): Float32Array {
  const positions = new Float32Array(columns * rows * 2);
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const point = boardToScreen(column * BOARD_PLANE.width / (columns - 1), row * BOARD_PLANE.height / (rows - 1));
    const index = (row * columns + column) * 2;
    positions[index] = point.x; positions[index + 1] = point.y;
  }
  return positions;
}
