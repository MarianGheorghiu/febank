import { RetailLoansData } from "./types";

export const mockRetailLoans: RetailLoansData = {
  userFinancialHealthScore: 815,
  monthlyTurnover: 8450,
  hasSalaryTransferred: false,
  currency: "USD",

  collateralPortfolio: [
    {
      id: "ast-101",
      name: "Apple Inc.",
      ticker: "AAPL",
      type: "STOCK",
      totalValue: 24500,
      maxLTV: 65,
      isEligible: true,
      allocatedToLoan: 15000,
    },
    {
      id: "ast-102",
      name: "Microsoft Corp.",
      ticker: "MSFT",
      type: "STOCK",
      totalValue: 19200,
      maxLTV: 65,
      isEligible: true,
      allocatedToLoan: 10000,
    },
    {
      id: "ast-103",
      name: "NVIDIA Corporation",
      ticker: "NVDA",
      type: "STOCK",
      totalValue: 31000,
      maxLTV: 55,
      isEligible: true,
      allocatedToLoan: 0,
    },
    {
      id: "ast-201",
      name: "Vanguard S&P 500 ETF",
      ticker: "VOO",
      type: "ETF",
      totalValue: 45000,
      maxLTV: 75,
      isEligible: true,
      allocatedToLoan: 20000,
    },
    {
      id: "ast-202",
      name: "Invesco QQQ Trust",
      ticker: "QQQ",
      type: "ETF",
      totalValue: 28000,
      maxLTV: 70,
      isEligible: true,
      allocatedToLoan: 0,
    },
    {
      id: "ast-301",
      name: "US Treasury Bonds 10Y",
      ticker: "US10Y",
      type: "BOND",
      totalValue: 15000,
      maxLTV: 85,
      isEligible: true,
      allocatedToLoan: 5000,
    },
    {
      id: "ast-401",
      name: "Bitcoin",
      ticker: "BTC",
      type: "CRYPTO",
      totalValue: 12400,
      maxLTV: 45,
      isEligible: true,
      allocatedToLoan: 4000,
    },
    {
      id: "ast-402",
      name: "Ethereum",
      ticker: "ETH",
      type: "CRYPTO",
      totalValue: 8900,
      maxLTV: 40,
      isEligible: true,
      allocatedToLoan: 0,
    },
    {
      id: "ast-403",
      name: "Solana",
      ticker: "SOL",
      type: "CRYPTO",
      totalValue: 3200,
      maxLTV: 30,
      isEligible: false,
      allocatedToLoan: 0,
    },
  ],

  activeLombardLoans: [
    {
      id: "lomb-9901",
      borrowedAmount: 18500,
      collateralValue: 54000, // Combined value of allocated AAPL, MSFT, VOO, US10Y, BTC
      currentLTV: 34.25, // Highly secured position
      interestRate: 3.45, // Heavily discounted premium rate
      marginCallLTV: 70.0,
      liquidationLTV: 82.0,
      issuedAt: "2026-02-14",
      maturityDate: "2027-02-14",
    },
    {
      id: "lomb-9902",
      borrowedAmount: 2200,
      collateralValue: 4000, // Volatile asset backup (Crypto specific pool)
      currentLTV: 55.0, // Closer to risk limit
      interestRate: 4.2,
      marginCallLTV: 65.0,
      liquidationLTV: 75.0,
      issuedAt: "2026-05-01",
      maturityDate: "2026-11-01",
    },
  ],

  smartPricing: {
    baseRate: 4.45,
    currentRate: 3.95, // Base (4.45) - Turnover (0.25) - Credit/Health Score (0.25)
    discounts: [
      {
        id: "dsc-lnk-01",
        type: "SALARY_ROUTING",
        label: "Salary Routing",
        description:
          "Route your primary monthly payout directly to your account",
        discountValue: 0.5,
        isAchieved: false,
        targetValue: "Direct Deposit Match",
        currentValue: "Not Detected",
      },
      {
        id: "dsc-lnk-02",
        type: "HIGH_TURNOVER",
        label: "Premium Asset Volume",
        description:
          "Maintain a transactional card volume above $5,000 monthly",
        discountValue: 0.25,
        isAchieved: true,
        targetValue: "> $5,000/mo",
        currentValue: "$8,450/mo",
      },
      {
        id: "dsc-lnk-03",
        type: "CREDIT_SCORE",
        label: "Financial Health Milestone",
        description:
          "Keep your in-app score above 750 points via balanced leverage",
        discountValue: 0.25,
        isAchieved: true,
        targetValue: "> 750 Pts",
        currentValue: "815 Pts",
      },
      {
        id: "dsc-lnk-04",
        type: "WEALTH_TIER",
        label: "AUM Asset Tier Status",
        description:
          "Total portfolio valuation inside the platform over $100,000",
        discountValue: 0.3,
        isAchieved: true,
        targetValue: "> $100k AUM",
        currentValue: "$183,100 AUM",
      },
    ],
  },

  bufferLine: {
    id: "buf-master-01",
    limit: 5000,
    usedAmount: 1250, // Currently dipping into the safety buffer
    isActive: true,
    gracePeriodDays: 10,
    remainingGraceDays: 7, // 3 days already elapsed on this specific overdraft cycle
    baseInterestRate: 8.99,
    utilizationHistory: [
      { date: "2026-06-05", amount: 1250, type: "DRAWDOWN" },
      { date: "2026-05-20", amount: 800, type: "DRAWDOWN" },
      { date: "2026-05-22", amount: 800, type: "REPAYMENT" },
    ],
  },
};
