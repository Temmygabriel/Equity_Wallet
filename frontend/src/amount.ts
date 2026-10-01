/* How an amount is written on a certificate, and nothing else.

   This file used to be the browser's memory of a bonus: the USDG amount and the milestone
   were written to localStorage at funding time and read back later. That made the agreement
   depend on the browser that created it — a contractor opening the link on another device,
   or in a private window, saw a certificate with no amount and no description. The contract
   stores both now, so the app no longer keeps them and this file holds only the rule that
   decides how the figure is written.

   The rule: a dollar figure is shown when the contract reports a funded USDG amount. When
   it does not, the figure is the token quantity with no dollar sign. A dollar figure is
   never invented (spec §3.2). */

export function dollarLabel(raw: string): string | undefined {
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value) || value <= 0) return undefined;
  const rounded = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
  return `$${Number(rounded).toLocaleString("en-US")}`;
}

export function quantityLabel(raw: string): string {
  const value = Number(raw);
  if (!Number.isFinite(value)) return raw;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export type CertAmount = {
  amount: string;
  /** Set only in the no-dollar case, where the sub-line drops "in … stock". */
  subLine?: string;
};

/* `fundedUsdg` and `stockAmount` both come from the contract read. */
export function certAmount(fundedUsdg: string, stockAmount: string, stockName: string): CertAmount {
  const dollars = dollarLabel(fundedUsdg);
  if (dollars) return { amount: dollars };
  return { amount: quantityLabel(stockAmount), subLine: `${stockName} stock` };
}
