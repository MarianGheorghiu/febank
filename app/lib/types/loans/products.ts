export type RetailLoanType =
  | "HOME"
  | "AUTO"
  | "PERSONAL"
  | "STUDENT"
  | "HEALTH"
  | "GREEN";

export type BusinessLoanType =
  | "WORKING_CAPITAL"
  | "EQUIPMENT"
  | "EXPANSION"
  | "INVENTORY"
  | "SEED_DEBT"
  | "BRIDGE";

export type CombinedLoanType = RetailLoanType | BusinessLoanType;

export interface LoanConfig {
  minAmount: number;
  maxAmount: number;
  stepAmount: number;
  minYears: number;
  maxYears: number;
  baseAPR: number;
  label: string;
}
