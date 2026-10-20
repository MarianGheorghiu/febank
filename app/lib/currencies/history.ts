import type { CurrencyPoint } from "./contracts";

/** Presentation history returned by the local data adapter, shaped like the Go DTO. */
export function openingCurrencyHistory(opening: CurrencyPoint, before: string): CurrencyPoint[] {
  const end = Date.parse(before) - 1;
  const curve = [0.82, 0.835, 0.83, 0.85, 0.842, 0.858, 0.88, 0.874, 0.89, 0.906, 0.895, 0.91, 0.923, 0.918, 0.94, 0.93, 0.951, 0.944, 0.962, 0.978, 0.965, 0.981, 0.99, 0.979, 0.995, 1.012, 1.004, 1.016, 1.008, 1];
  return curve.map((factor, index) => ({
    id: index === curve.length - 1 ? opening.id : `history-${index}`,
    at: new Date(end - (curve.length - 1 - index) * 86400000).toISOString(),
    fiat: (Number(opening.fiat) * (0.6 + factor * 0.4)).toFixed(2),
    crypto: (Number(opening.crypto) * factor).toFixed(2),
    stock: (Number(opening.stock) * (factor + Math.sin(index * 1.9) * 0.012 * (index === curve.length - 1 ? 0 : 1))).toFixed(2),
  }));
}
