import type { Company, HistoryPoint } from "@global-fund/shared";
import { formatMoney } from "@global-fund/ui";
import "./FinancialTicker.css";

interface FinancialTickerProps {
  companies: Company[];
  history: HistoryPoint[];
}

/** A low motion financial tape using live server quotes and recorded market history. */
export function FinancialTicker({ companies, history }: FinancialTickerProps) {
  const available = companies.filter(company => company.available);
  const previous = history.at(-2)?.prices;
  const latest = history.at(-1)?.prices;
  const entries = available.map(company => {
    const before = previous?.[company.id];
    const after = latest?.[company.id];
    return { company, delta: before != null && after != null ? after - before : null };
  });

  if (!entries.length) return null;
  const tape = (copy: boolean) => <div className="financial-ticker__group" aria-hidden={copy || undefined}>
    {entries.map(({ company, delta }) => <span className="financial-ticker__quote" key={company.id}>
      <b>{company.ticker ?? company.name}</b>
      <strong>{formatMoney(company.price)}</strong>
      {delta != null && <i className={delta < 0 ? "negative" : delta > 0 ? "positive" : "flat"}>
        {delta < 0 ? "▼" : delta > 0 ? "▲" : "•"} {formatMoney(Math.abs(delta))}
      </i>}
    </span>)}
  </div>;

  return <section className="financial-ticker" aria-label="Cours du marché">
    <span className="financial-ticker__label">GLOBAL EXCHANGE</span>
    <div className="financial-ticker__viewport">
      <div className="financial-ticker__track" tabIndex={0} style={{ animationDuration: `${Math.max(90, entries.length * 6)}s` }}>
        {tape(false)}
        {tape(true)}
      </div>
    </div>
  </section>;
}
