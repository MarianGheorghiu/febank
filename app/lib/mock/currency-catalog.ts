export const AVAILABLE_CURRENCIES = [
  {
    code: "RON",
    name: "Romanian Leu",
    flag: "🇷🇴",
    region: "RO",
    symbol: "RON",
  },
  { code: "EUR", name: "Euro", flag: "🇪🇺", region: "EU", symbol: "€" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", region: "US", symbol: "$" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", region: "UK", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", region: "JP", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭", region: "EU", symbol: "CHF" },
  {
    code: "AUD",
    name: "Australian Dollar",
    flag: "🇦🇺",
    region: "AU",
    symbol: "A$",
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    flag: "🇨🇦",
    region: "CA",
    symbol: "C$",
  },
] as const;

export const generateMockAccountRef = (region: string) => {
  const randomDigits = (len: number) =>
    Math.random()
      .toString()
      .slice(2, 2 + len);
  switch (region) {
    case "RO":
      return `RO${randomDigits(2)} REVO ${randomDigits(16)}`;
    case "EU":
      return `LT${randomDigits(2)} 1010 0${randomDigits(11)}`;
    case "US":
      return `US Acc: ${randomDigits(12)}`;
    case "UK":
      return `Sort: 20-45-${randomDigits(2)} | Acc: ${randomDigits(8)}`;
    default:
      return `${region}${randomDigits(2)} XXXX ${randomDigits(10)}`;
  }
};
