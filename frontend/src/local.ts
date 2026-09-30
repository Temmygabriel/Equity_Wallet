/* What this browser remembers about a bonus, and the one rule that governs how
   an amount is written.

   The contract stores the stock quantity, not the USDG amount, so a dollar
   figure is shown only where this browser recorded the USDG amount at funding
   time. Everywhere else the figure is the token quantity with no dollar sign.
   A dollar figure is never invented (spec §3.2).

   Everything here reads or writes localStorage, which throws in a private
   window and when site data is blocked, so every call is guarded. None of it is
   load-bearing: the bonus is on chain either way. */

export const USDG_KEY = (id: string) => `ebw.usdg.${id}`;
export const MILESTONE_KEY = (id: string) => `ebw.milestone.${id}`;

/* The list of bonuses funded from this browser (§8.4), read back by §9. */
const MINE_KEY = "ebw.mine";

export function readLocal(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Storage may be unavailable; the bonus is still on chain. */
  }
}

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

export function certAmount(id: string | undefined, stockAmount: string, stockName: string): CertAmount {
  const dollars = id ? dollarLabel(readLocal(USDG_KEY(id)) ?? "") : undefined;
  if (dollars) return { amount: dollars };
  return { amount: quantityLabel(stockAmount), subLine: `${stockName} stock` };
}

export function readRegister(): string[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(MINE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function appendToRegister(id: string): void {
  const ids = readRegister();
  if (ids.includes(id)) return;
  writeLocal(MINE_KEY, JSON.stringify([...ids, id]));
}
