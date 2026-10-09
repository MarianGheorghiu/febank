import { buttonClass, primaryButtonClass } from "../cards/presentation";
export const analyticsButton = `${buttonClass} min-h-9 leading-none [&>svg]:shrink-0`;
export const analyticsPrimaryButton = `${primaryButtonClass} min-h-9 leading-none [&>svg]:shrink-0`;
export const productLabels: Record<string, string> = { PAYMENTS: "Payments", CARDS: "Cards", FX: "Foreign exchange", INVESTMENTS: "Investments", LENDING: "Lending", SUBSCRIPTIONS: "Subscriptions" };
export const channelLabels: Record<string, string> = { ORGANIC: "Organic", REFERRAL: "Referrals", PAID: "Paid acquisition", PARTNER: "Partners" };
export const costLabels: Record<string, string> = { direct: "Direct product costs", payroll: "People & payroll", infrastructure: "Infrastructure", compliance: "Compliance", acquisition: "Acquisition", provisions: "Credit provisions" };
export const percent = (value: number | null) => value === null ? "N/A" : `${value.toFixed(1)}%`;
export const reportDate = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
