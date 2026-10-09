import type { ZoneId } from "@global-fund/shared";
import { MARKET_PLACES, marketOverview } from "./marketPlaceVisuals";
import "./starting-market-picker.css";

export default function StartingMarketPicker({
  value,
  onChange,
  label = "Place de marché initiale",
}: {
  value: ZoneId;
  onChange: (market: ZoneId) => void;
  label?: string;
}) {
  return (
    <fieldset className="starting-market-picker" data-testid="starting-market-picker">
      <legend>{label}</legend>
      <div className="starting-market-picker__options">
        {MARKET_PLACES.map((place) => {
          const overview = marketOverview(place.id);
          const selected = value === place.id;
          return (
            <button
              key={place.id}
              data-testid={`market-option-${place.id}`}
              type="button"
              className={`starting-market-option${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onChange(place.id)}
            >
              <img className="starting-market-option__visual" src={place.background} alt="" />
              <span className="starting-market-option__name">{place.name}</span>
              <strong>{place.city}</strong>
              <span className="starting-market-option__meta">
                Note C <i aria-hidden="true">·</i> {overview.companyCount} entreprises
              </span>
              <span className="starting-market-option__sectors">
                {overview.sectors.slice(0, 3).map((sector) => `${sector.name} ${sector.count}`).join(" · ")}
              </span>
              <span className="starting-market-option__caps" title="Classes de taille Global Fund fondées sur les capitalisations approximatives; les prix du jeu sont normalisés séparément.">Small {overview.caps.small} · Medium {overview.caps.medium} · Large {overview.caps.large}</span>
            </button>
          );
        })}
      </div>
      <p className="starting-market-picker__caption">
        Votre fonds opère depuis {MARKET_PLACES.find((place) => place.id === value)?.city}. {MARKET_PLACES.find((place) => place.id === value)?.description}
      </p>
    </fieldset>
  );
}
