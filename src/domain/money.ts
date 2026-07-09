/**
 * Canonical money handling for the ServeStation domain.
 *
 * Phase 3 readiness rule: money is stored and passed around as a raw numeric
 * value (dollars, with cents in the fractional part). Currency formatting is a
 * presentation concern handled here, never baked into the stored/domain value.
 * This lets the Supabase schema use numeric columns and keeps reporting math
 * safe (no parsing of "$13.50" strings).
 */

/** A monetary amount expressed in whole dollars (e.g. 13.5 === $13.50). */
export type Money = number;

/**
 * Format a monetary amount as a `$` currency string with two decimals.
 * @param amount Value in dollars (may be undefined/null → treated as 0).
 * @returns Formatted string, e.g. `$13.50`.
 */
export function formatMoney(amount: Money | null | undefined): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return `$${value.toFixed(2)}`;
}

/**
 * Backward-compatible alias used by existing POS UI components.
 * Prefer {@link formatMoney} in new code.
 */
export const formatCurrency = formatMoney;

/**
 * Parse a user-entered / legacy price string into a numeric {@link Money}.
 * Tolerates a leading `$`, surrounding whitespace, and empty input.
 * @param input Raw string such as "$13.50", "13.50", or "".
 * @returns The parsed dollar value, or 0 when the input is not a valid number.
 */
export function parseMoney(input: string | null | undefined): Money {
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9.-]/g, "").trim();
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Round a monetary amount to cents to avoid floating-point drift before it is
 * persisted or reported on.
 * @param amount Raw dollar value.
 * @returns The amount rounded to two decimal places.
 */
export function roundMoney(amount: Money): Money {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
