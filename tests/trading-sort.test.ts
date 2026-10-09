import { describe, expect, it } from "vitest";
import { profitLossPercent, sortTradingRows, type TradingSortRow } from "../apps/web/src/trading/tradingSort";

const rows: TradingSortRow[] = [
  { id: "c", name: "Cedar", sector: "Finance", capitalization: "small", price: 30, profitLoss: 3, held: 2, available: 3 },
  { id: "b", name: "Birch", sector: "Santé", capitalization: "medium", price: 20, profitLoss: null, held: 0, available: 4 },
  { id: "a", name: "Alder", sector: "Industrie", capitalization: "medium", price: 4, profitLoss: -2, held: 1, available: 4 },
  { id: "d", name: "Delta", sector: "Énergie", capitalization: "large", price: 101, profitLoss: 101, held: 1, available: 4 },
  { id: "e", name: "Elm", sector: "Santé", capitalization: null, price: 4, profitLoss: null, held: 0, available: 5 },
];

describe("sortTradingRows", () => {
  it("sorts in ascending order and reverses on descending order", () => {
    expect(sortTradingRows(rows, "company", "ascending").map((row) => row.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect(sortTradingRows(rows, "company", "descending").map((row) => row.id)).toEqual(["e", "d", "c", "b", "a"]);
  });

  it("orders CAP Small, Medium, Large and keeps unknown categories last", () => {
    expect(sortTradingRows(rows, "capitalization", "ascending").map((row) => row.id)).toEqual(["c", "a", "b", "d", "e"]);
    expect(sortTradingRows(rows, "capitalization", "descending").map((row) => row.id)).toEqual(["d", "a", "b", "c", "e"]);
  });

  it("keeps ID ascending to break equal-value ties in either direction", () => {
    expect(sortTradingRows(rows, "capitalization", "ascending").map((row) => row.id).slice(1, 3)).toEqual(["a", "b"]);
    expect(sortTradingRows(rows, "capitalization", "descending").map((row) => row.id).slice(1, 3)).toEqual(["a", "b"]);
  });

  it("keeps unknown profit/loss values last in both directions", () => {
    expect(sortTradingRows(rows, "profitLoss", "ascending").map((row) => row.id)).toEqual(["a", "c", "d", "b", "e"]);
    expect(sortTradingRows(rows, "profitLoss", "descending").map((row) => row.id)).toEqual(["d", "c", "a", "b", "e"]);
  });

  it("calculates unbounded percentage P/L only with a valid PRU and held shares", () => {
    expect(profitLossPercent(30, 10, 2)).toBe(200);
    expect(profitLossPercent(10, 20, 1)).toBe(-50);
    expect(profitLossPercent(10, 0, 1)).toBeNull();
    expect(profitLossPercent(10, null, 1)).toBeNull();
    expect(profitLossPercent(10, 5, 0)).toBeNull();
  });
});
