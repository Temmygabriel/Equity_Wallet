export type StockTicker = "AAPL" | "TSLA" | "NVDA";

/* The test stocks the demo deploys. The company name is what the UI says out
   loud; the pill carries the ticker and the mock nature is stated underneath. */
export const STOCKS: { ticker: StockTicker; company: string }[] = [
  { ticker: "AAPL", company: "Apple" },
  { ticker: "TSLA", company: "Tesla" },
  { ticker: "NVDA", company: "Nvidia" }
];

/** "Apple-linked". Never a ticker, never "stock" on its own (§12.2). */
export function stockLabel(ticker: StockTicker): string {
  const company = STOCKS.find((entry) => entry.ticker === ticker)?.company ?? ticker;
  return `${company}-linked`;
}

type StockPickerProps = { value: StockTicker; onChange: (ticker: StockTicker) => void };

/* Real radios behind the labels, so arrow keys move between options. */
export function StockPicker({ value, onChange }: StockPickerProps) {
  return (
    <fieldset className="stocks">
      <legend className="sr-only">Which test stock</legend>
      {STOCKS.map((entry) => {
        const selected = entry.ticker === value;
        return (
          <label key={entry.ticker} className={`stock-opt${selected ? " is-on" : ""}`}>
            <input
              type="radio"
              name="stock"
              value={entry.ticker}
              checked={selected}
              onChange={() => onChange(entry.ticker)}
            />
            <span className="co">{entry.company}</span>
            <span className="pill">{entry.ticker}</span>
            <span className="test">Test stock</span>
          </label>
        );
      })}
    </fieldset>
  );
}
