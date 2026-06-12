import { CollateralAsset, PricingDiscount, LoanRiskStatus } from "./types";

export const calculateLTV = (
  borrowedAmount: number,
  collateralValue: number,
): number => {
  if (collateralValue <= 0) return 0;
  return Number(((borrowedAmount / collateralValue) * 100).toFixed(2));
};

export const calculateDynamicRate = (
  baseRate: number,
  discounts: PricingDiscount[],
): number => {
  const totalDiscount = discounts
    .filter((d) => d.isAchieved)
    .reduce((sum, d) => sum + d.discountValue, 0);

  return Number(Math.max(0, baseRate - totalDiscount).toFixed(2));
};

export const getLTVStatus = (
  currentLTV: number,
  marginCallLTV: number,
  liquidationLTV: number,
): LoanRiskStatus => {
  if (currentLTV === 0) return "SAFE";
  if (currentLTV >= liquidationLTV) return "CRITICAL";
  if (currentLTV >= marginCallLTV) return "WARNING";
  return "SAFE";
};

export const calculateMaxBorrowCapacity = (
  assets: CollateralAsset[],
): number => {
  return assets.reduce((total, asset) => {
    if (!asset.isEligible) return total;
    return total + asset.totalValue * (asset.maxLTV / 100);
  }, 0);
};
