export const controlMoney = (value: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value));
export const controlDate = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Europe/Bucharest", dateStyle: "medium", timeStyle: "short" });
