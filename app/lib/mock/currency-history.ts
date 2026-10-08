import type { AssetClass, Timeframe } from "@/app/lib/types/currency-history";

export const generateMarketData = (asset: AssetClass, timeframe: Timeframe) => {
  let points = 12;
  if (timeframe === "1D") points = 24;
  if (timeframe === "1W") points = 7;
  if (timeframe === "1M") points = 30;

  const seeds: Record<AssetClass, number> = {
    FIAT: 1.5,
    CRYPTO: 7.3,
    STOCKS: 4.1,
  };
  const seed = seeds[asset];

  const data = [];
  const baseValue =
    asset === "CRYPTO" ? 64200 : asset === "STOCKS" ? 14800 : 28400;

  for (let i = 0; i < points; i++) {
    const wave1 = Math.sin(i * 0.4 + seed);
    const wave2 = Math.cos(i * 0.15 - seed) * 0.4;
    const marketTrend = i * (asset === "FIAT" ? 0.0005 : 0.015);

    const volatilityFactor =
      asset === "CRYPTO" ? 0.07 : asset === "STOCKS" ? 0.03 : 0.003;
    const finalPrice =
      baseValue * (1 + (wave1 + wave2 + marketTrend) * volatilityFactor);

    let label = `P-${i}`;
    if (timeframe === "1D") label = `${i}:00`;
    if (timeframe === "1W")
      label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7];
    if (timeframe === "1M") label = `06/${i + 1 < 10 ? "0" + (i + 1) : i + 1}`;
    if (timeframe === "1Y")
      label = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][i % 12];
    if (timeframe === "ALL")
      label = `'${22 + Math.floor(i / 3)} Q${(i % 4) + 1}`;

    data.push({
      name: label,
      valoare: Math.round(finalPrice * 100) / 100,
    });
  }
  return data;
};
