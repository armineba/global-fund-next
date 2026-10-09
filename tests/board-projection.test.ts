import { describe, expect, it } from "vitest";
import { boardToScreen, screenToBoard, boardDepthScale, boardCellPoint, boardCellRect, boardCellAtScreen, boardMeshPositions } from "../apps/web/src/board/BoardProjection";

describe("shared table projection", () => {
  it("round trips corners, map anchors and all 52 printed cells", () => {
    const points = [{x:25,y:25},{x:975,y:25},{x:975,y:615},{x:25,y:615},{x:116,y:137},{x:884,y:513}, ...Array.from({length:52},(_,index) => boardCellPoint(index))];
    for (const point of points) {
      const screen = boardToScreen(point.x,point.y), inverse = screenToBoard(screen.x,screen.y);
      expect(inverse.x).toBeCloseTo(point.x,9);
      expect(inverse.y).toBeCloseTo(point.y,9);
    }
  });
  it("keeps the rail symmetric and only moderately convergent", () => {
    const leftFar=boardToScreen(25,25),rightFar=boardToScreen(975,25),leftNear=boardToScreen(25,615),rightNear=boardToScreen(975,615);
    expect(leftFar.x+rightFar.x).toBeCloseTo(1000,9);
    expect(leftNear.x+rightNear.x).toBeCloseTo(1000,9);
    const ratio=(rightFar.x-leftFar.x)/(rightNear.x-leftNear.x);
    expect(ratio).toBeGreaterThan(0.88);expect(ratio).toBeLessThan(0.94);
    expect(leftFar.y).toEqual(rightFar.y);expect(leftNear.y).toEqual(rightNear.y);
  });
  it("preserves a complete 52-cell perimeter and hits every projected center", () => {
    const rects = Array.from({length:52},(_,index) => boardCellRect(index));
    expect(new Set(rects.map(rect=>`${rect.x},${rect.y}`)).size).toBe(52);
    for(let index=0;index<52;index++) {
      const point=boardCellPoint(index), screen=boardToScreen(point.x,point.y);
      expect(boardCellAtScreen(screen.x,screen.y)).toBe(index);
      expect(boardCellRect(index+52)).toEqual(rects[index]);
    }
    const center=boardToScreen(500,325);
    expect(boardCellAtScreen(center.x,center.y)).toBeNull();
    expect(boardCellAtScreen(-100,-100)).toBeNull();
  });
  it("increases figure scale monotonically toward the viewer", () => {
    let previous=0;
    for(let y=25;y<=615;y+=10) {
      const scale=boardDepthScale(y);
      expect(scale).toBeGreaterThan(previous);expect(scale).toBeLessThanOrEqual(1);
      previous=scale;
    }
    expect(boardDepthScale(25)).toBeGreaterThan(0.9);
  });
  it("projects mesh vertices with the same camera as figure feet", () => {
    const columns=29,rows=19,positions=boardMeshPositions(columns,rows);
    expect(positions.length).toBe(columns*rows*2);
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++) {
      const expected=boardToScreen(col*1000/(columns-1),row*650/(rows-1));
      const offset=(row*columns+col)*2;
      expect(positions[offset]).toBeCloseTo(expected.x,3);
      expect(positions[offset+1]).toBeCloseTo(expected.y,3);
    }
  });
});
