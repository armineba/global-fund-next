import nationalities from "./nationalities.json";
import type { ZoneId } from "./index.js";

/** The only five playable markets. Africa includes the Middle East. */
export const MARKET_IDS = ["americas", "europe", "asia", "africa", "oceania"] as const;

export function isMarketId(value: unknown): value is ZoneId {
  return typeof value === "string" && (MARKET_IDS as readonly string[]).includes(value);
}

/** Reading adapter for old clients and saves; never invents a player's country. */
export function marketFromLegacyNationality(value: unknown): ZoneId | undefined {
  const zone = nationalities.find((entry) => entry.id === value)?.zoneId;
  return isMarketId(zone) ? zone : undefined;
}

/** Infer missing initial placement without moving the fund's saved current location. */
export function legacyStartingMarket(record: {
  startingMarket?: unknown;
  nationality?: unknown;
  zone?: unknown;
}): ZoneId {
  if (isMarketId(record.startingMarket)) return record.startingMarket;
  return marketFromLegacyNationality(record.nationality) ??
    (isMarketId(record.zone) ? record.zone : "europe");
}

/** AI placement balances occupation across the five markets; humans retain their choice. */
export function diversifyStartingMarkets<T extends { kind: string; startingMarket: ZoneId }>(seats: T[]): T[] {
  const counts = Object.fromEntries(MARKET_IDS.map((id) => [id, 0])) as Record<ZoneId, number>;
  for (const seat of seats) if (seat.kind !== "ai") counts[seat.startingMarket] += 1;
  return seats.map((seat) => {
    if (seat.kind !== "ai") return { ...seat };
    const lowest = Math.min(...Object.values(counts));
    const startingMarket = counts[seat.startingMarket] === lowest
      ? seat.startingMarket
      : MARKET_IDS.find((id) => counts[id] === lowest)!;
    counts[startingMarket] += 1;
    return { ...seat, startingMarket };
  });
}
