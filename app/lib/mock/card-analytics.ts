import type { Timeframe } from "@/app/lib/types/card-analytics";

export const MOCK_ANALYTICS_DATA: Record<
  Timeframe,
  Array<{ date: string; spent: number }>
> = {
  "1D": [
    { date: "04:00", spent: 400 },
    { date: "08:00", spent: 1200 },
    { date: "12:00", spent: 4800 },
    { date: "16:00", spent: 5400 }, // Over limit
    { date: "20:00", spent: 5900 }, // Over limit
  ],
  "1W": [
    { date: "MON", spent: 1200 },
    { date: "TUE", spent: 3400 },
    { date: "WED", spent: 4900 },
    { date: "THU", spent: 5800 }, // Over limit
    { date: "FRI", spent: 6200 }, // Over limit
    { date: "SAT", spent: 4100 },
    { date: "SUN", spent: 5100 }, // Over limit
  ],
  "1M": [
    { date: "WK 01", spent: 1200 },
    { date: "WK 02", spent: 3800 },
    { date: "WK 03", spent: 5400 }, // Over limit
    { date: "WK 04", spent: 6100 }, // Over limit
  ],
  "1Y": [
    { date: "JAN-MAR", spent: 3400 },
    { date: "APR-JUN", spent: 5800 }, // Over limit
    { date: "JUL-SEP", spent: 4200 },
    { date: "OCT-DEC", spent: 6300 }, // Over limit
  ],
  ALL: [
    { date: "CYBER_24", spent: 3100 },
    { date: "CYBER_25", spent: 4950 },
    { date: "CYBER_26", spent: 6400 }, // Over limit
  ],
};
