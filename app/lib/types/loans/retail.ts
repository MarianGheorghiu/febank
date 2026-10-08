export type AssetType = "STOCK" | "ETF" | "CRYPTO" | "BOND";
export type LoanRiskStatus = "SAFE" | "WARNING" | "CRITICAL";
export type DiscountType =
  | "SALARY_ROUTING"
  | "HIGH_TURNOVER"
  | "CREDIT_SCORE"
  | "WEALTH_TIER";

export interface CollateralAsset {
  id: string;
  name: string;
  ticker: string;
  type: AssetType;
  totalValue: number;
  maxLTV: number; // Maximum Loan-to-Value allowed for this asset class
  isEligible: boolean;
  allocatedToLoan: number; // Value currently locked as collateral
}

export interface LombardLoan {
  id: string;
  borrowedAmount: number;
  collateralValue: number;
  currentLTV: number;
  interestRate: number;
  liquidationLTV: number;
  marginCallLTV: number;
  issuedAt: string;
  maturityDate: string;
}

export interface PricingDiscount {
  id: string;
  type: DiscountType;
  label: string;
  description: string;
  discountValue: number; // e.g., 0.50 for 0.50% off
  isAchieved: boolean;
  targetValue: string;
  currentValue: string;
}

export interface SmartPricingEngine {
  baseRate: number;
  currentRate: number;
  discounts: PricingDiscount[];
}

export interface BufferLine {
  id: string;
  limit: number;
  usedAmount: number;
  isActive: boolean;
  gracePeriodDays: number;
  remainingGraceDays: number;
  baseInterestRate: number;
  utilizationHistory: {
    date: string;
    amount: number;
    type: "DRAWDOWN" | "REPAYMENT";
  }[];
}

export interface RetailLoansData {
  userFinancialHealthScore: number;
  monthlyTurnover: number;
  hasSalaryTransferred: boolean;
  currency: string;
  collateralPortfolio: CollateralAsset[];
  activeLombardLoans: LombardLoan[];
  smartPricing: SmartPricingEngine;
  bufferLine: BufferLine;
}
