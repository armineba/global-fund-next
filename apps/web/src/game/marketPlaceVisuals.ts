import { legacyStartingMarket, type Player, type ZoneId } from "@global-fund/shared";
import catalog from "../../../../packages/game-engine/legacy/data/gameData.json";

/** One economic zone, one stable financial city. No player nationality is inferred. */
export const MARKET_PLACES: ReadonlyArray<{
  id: ZoneId;
  name: string;
  city: string;
  description: string;
  background: string;
  cityAsset: string;
}> = [
  { id: "americas", name: "Amériques", city: "New York", description: "Installez votre fonds au cœur de Manhattan.", background: "/assets/environments/offices/americas/skyline.webp", cityAsset: "/assets/world/cities/americas.webp" },
  { id: "europe", name: "Europe", city: "Londres", description: "Prenez position sur une grande place financière européenne.", background: "/assets/environments/offices/europe/skyline.webp", cityAsset: "/assets/world/cities/europe.webp" },
  { id: "asia", name: "Asie", city: "Hong Kong", description: "Opérez depuis les tours de Victoria Harbour.", background: "/assets/environments/offices/asia/skyline.webp", cityAsset: "/assets/world/cities/asia.webp" },
  { id: "africa", name: "Afrique & Moyen-Orient", city: "Dubaï", description: "Ouvrez votre fonds sur une place internationale du Golfe.", background: "/assets/environments/offices/africa/skyline.webp", cityAsset: "/assets/world/cities/africa.webp" },
  { id: "oceania", name: "Océanie", city: "Sydney", description: "Installez-vous face au quartier financier et à la baie.", background: "/assets/environments/offices/oceania/skyline.webp", cityAsset: "/assets/world/cities/oceania.webp" },
];

export const marketPlaceVisuals = Object.fromEntries(MARKET_PLACES.map(place => [place.id, place])) as Record<ZoneId, (typeof MARKET_PLACES)[number]>;

/** Read-only catalogue data; the browser never calculates whether an order is valid. */
export function marketOverview(id: ZoneId) {
  const companies = catalog.companies.filter(company => company.zone === id);
  const sectors = catalog.sectors.map(sector => ({
    id: sector.id,
    name: sector.name,
    count: companies.filter(company => company.sector === sector.id).length,
  })).filter(sector => sector.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
  const caps = { small: 0, medium: 0, large: 0 };
  for (const company of companies) {
    const category = company.capCategory;
    if (category === "small" || category === "medium" || category === "large") caps[category] += 1;
  }
  return { companyCount: companies.length, sectors, caps };
}

/** Detention retains the last office. Current market and rights of implantation stay distinct. */
export function playerOfficeMarket(player: Player): ZoneId {
  const current = player.currentMarket ?? player.zone;
  return MARKET_PLACES.find(place => place.id === current)?.id
    ?? MARKET_PLACES.find(place => place.id === player.previousZone)?.id
    ?? legacyStartingMarket(player);
}
