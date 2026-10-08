export const chartData: Record<
    string,
    { stroke: string; fill: string; dotX: number; dotY: number; peak: string }
  > = {
    "1H": {
      stroke: "M 0 150 Q 120 130 200 60 T 380 110 T 500 35 T 600 70",
      fill: "M 0 150 Q 120 130 200 60 T 380 110 T 500 35 T 600 70 L 600 200 L 0 200 Z",
      dotX: 500,
      dotY: 35,
      peak: "$168.4K/sec",
    },
    "24H": {
      stroke: "M 0 160 Q 100 120 180 140 T 360 80 T 480 50 T 600 20",
      fill: "M 0 160 Q 100 120 180 140 T 360 80 T 480 50 T 600 20 L 600 200 L 0 200 Z",
      dotX: 480,
      dotY: 50,
      peak: "$142.8K/sec",
    },
    "1W": {
      stroke: "M 0 110 Q 140 170 220 120 T 400 55 T 520 90 T 600 30",
      fill: "M 0 110 Q 140 170 220 120 T 400 55 T 520 90 T 600 30 L 600 200 L 0 200 Z",
      dotX: 400,
      dotY: 55,
      peak: "$195.1K/sec",
    },
    ALL: {
      stroke: "M 0 180 Q 90 140 200 100 T 350 130 T 490 65 T 600 45",
      fill: "M 0 180 Q 90 140 200 100 T 350 130 T 490 65 T 600 45 L 600 200 L 0 200 Z",
      dotX: 490,
      dotY: 65,
      peak: "$210.5K/sec",
    },
  };

export const MOCK_LANDING_METRICS = [
          {
            label: "Total Accounts",
            value: "148,290",
            sub: "+12.4% MoM",
            icon: "Users",
            color: "text-cyan-400",
          },
          {
            label: "Clearing Latency",
            value: "340 ms",
            sub: "Ultra-Fast Engine",
            icon: "Clock",
            color: "text-purple-400",
          },
          {
            label: "Liquidity Depth",
            value: "$1.2B",
            sub: "Tier-1 Backed",
            icon: "Coins",
            color: "text-amber-400",
          },
          {
            label: "System Audits",
            value: "Passed",
            sub: "100% Compliant",
            icon: "CheckCircle2",
            color: "text-emerald-400",
          },
        ] as const;
