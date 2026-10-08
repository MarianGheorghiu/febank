export type StockCatalog = Record<
  string,
  {
    name: string;
    exchange: string;
    price: number;
    change: number;
    changePercent: number;
    stats: Array<{
      label: string;
      value: string;
      unit: string;
      icon: "Globe" | "Activity" | "DollarSign" | "PieChart" | "Flame" | "ShieldCheck";
      highlight?: boolean;
    }>;
    news: Array<{
      id: number;
      source: string;
      time: string;
      title: string;
      sentiment: string;
    }>;
    chart: Record<
      string,
      Array<{
        name: string;
        open: number;
        high: number;
        low: number;
        close: number;
      }>
    >;
  }
>;
