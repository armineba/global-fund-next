export type TradingSortKey =
  | "company"
  | "sector"
  | "capitalization"
  | "price"
  | "profitLoss"
  | "held"
  | "available";

export type TradingSortDirection = "ascending" | "descending";

export type TradingSortRow = {
  id: string;
  name: string;
  sector: string;
  capitalization: "small" | "medium" | "large" | null;
  price: number;
  profitLoss: number | null;
  held: number;
  available: number;
};

const CAP_ORDER = { small: 0, medium: 1, large: 2 } as const;

export function profitLossPercent(
  price: number,
  average: number | null | undefined,
  held: number,
): number | null {
  if (held <= 0 || average == null || !Number.isFinite(average) || average <= 0 || !Number.isFinite(price)) return null;
  return (price / average - 1) * 100;
}

const valueFor = (row: TradingSortRow, key: TradingSortKey): string | number | null => {
  switch (key) {
    case "company": return row.name;
    case "sector": return row.sector;
    case "capitalization": return row.capitalization;
    case "price": return row.price;
    case "profitLoss": return row.profitLoss;
    case "held": return row.held;
    case "available": return row.available;
  }
};

const compare = (left: string | number, right: string | number) =>
  typeof left === "string" && typeof right === "string"
    ? left.localeCompare(right, "fr", { sensitivity: "base" })
    : Number(left) - Number(right);

export function sortTradingRows<T extends TradingSortRow>(
  rows: T[],
  key: TradingSortKey,
  direction: TradingSortDirection,
): T[] {
  const sign = direction === "ascending" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = valueFor(left, key);
    const rightValue = valueFor(right, key);

    // Unknown cost bases have no calculable P/L and stay at the end in either order.
    if (key === "profitLoss") {
      if (leftValue === null && rightValue !== null) return 1;
      if (rightValue === null && leftValue !== null) return -1;
    }
    if (key === "capitalization") {
      if (leftValue === null && rightValue !== null) return 1;
      if (rightValue === null && leftValue !== null) return -1;
    }

    const byValue = leftValue == null || rightValue == null
      ? 0
      : key === "capitalization"
        ? (CAP_ORDER[leftValue as keyof typeof CAP_ORDER] - CAP_ORDER[rightValue as keyof typeof CAP_ORDER]) * sign
        : compare(leftValue, rightValue) * sign;
    return byValue || left.id.localeCompare(right.id, "en", { sensitivity: "base" });
  });
}
