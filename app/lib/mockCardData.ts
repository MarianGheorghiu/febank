// app/lib/mockCardData.ts

export type CardType = "physical" | "virtual" | "disposable";
export type CardStatus = "active" | "frozen" | "blocked";

export interface CardAllowedChannels {
  atm: boolean;
  online: boolean;
  contactless: boolean;
  international: boolean;
}

export interface BankCardData {
  id: string;
  type: CardType;
  status: CardStatus;
  holderName: string;
  pan: string;
  cvv: string;
  expiry: string;
  colorTheme: "cyan" | "magenta" | "amber" | "emerald";
  monthlyLimit: number;
  spentThisMonth: number;
  allowedChannels: CardAllowedChannels;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  merchant: string;
  category: "Food" | "Transport" | "Shopping" | "Utilities" | "Cyberware";
  amount: number;
  date: string;
  status: "Pending" | "Completed";
}

export const MOCK_CARDS: BankCardData[] = [
  {
    id: "card-1",
    type: "physical",
    status: "active",
    holderName: "NETRUNNER #0412",
    pan: "4532 7182 9301 4482",
    cvv: "382",
    expiry: "12/29",
    colorTheme: "cyan",
    monthlyLimit: 5000,
    spentThisMonth: 1240.5,
    allowedChannels: {
      atm: true,
      online: true,
      contactless: true,
      international: true,
    },
  },
  {
    id: "card-2",
    type: "virtual",
    status: "active",
    holderName: "NETRUNNER #0412",
    pan: "4102 9931 4421 8819",
    cvv: "901",
    expiry: "04/31",
    colorTheme: "amber",
    monthlyLimit: 3000,
    spentThisMonth: 2850.0,
    allowedChannels: {
      atm: false,
      online: true,
      contactless: true,
      international: false,
    },
  },
  {
    id: "card-3",
    type: "disposable",
    status: "active",
    holderName: "SINGLE USE MATRIX",
    pan: "4916 2201 5539 0012",
    cvv: "114",
    expiry: "09/26",
    colorTheme: "magenta",
    monthlyLimit: 500,
    spentThisMonth: 0,
    allowedChannels: {
      atm: false,
      online: true,
      contactless: false,
      international: true,
    },
  },
  {
    id: "card-4",
    type: "physical",
    status: "frozen",
    holderName: "NETRUNNER #0412",
    pan: "5214 8830 1192 3456",
    cvv: "773",
    expiry: "01/28",
    colorTheme: "emerald",
    monthlyLimit: 10000,
    spentThisMonth: 4500.25,
    allowedChannels: {
      atm: true,
      online: true,
      contactless: false,
      international: true,
    },
  },
];

export const MOCK_CARD_TRANSACTIONS: CardTransaction[] = [
  {
    id: "tx-1",
    cardId: "card-1",
    merchant: "Arasaka Cyberware Lab",
    category: "Cyberware",
    amount: -850.0,
    date: "Today, 14:20",
    status: "Completed",
  },
  {
    id: "tx-2",
    cardId: "card-1",
    merchant: "Night City Bento",
    category: "Food",
    amount: -35.5,
    date: "Today, 12:05",
    status: "Completed",
  },
  {
    id: "tx-3",
    cardId: "card-1",
    merchant: "Militech Ammunition",
    category: "Shopping",
    amount: -355.0,
    date: "Yesterday",
    status: "Completed",
  },
  {
    id: "tx-4",
    cardId: "card-2",
    merchant: "Grid Runner VPN",
    category: "Utilities",
    amount: -15.0,
    date: "05 Jun 2026",
    status: "Completed",
  },
  {
    id: "tx-5",
    cardId: "card-2",
    merchant: "Net Terminal Upgrade",
    category: "Cyberware",
    amount: -2835.0,
    date: "01 Jun 2026",
    status: "Completed",
  },
  {
    id: "tx-6",
    cardId: "card-4",
    merchant: "Orbital Air Flight 102",
    category: "Transport",
    amount: -4500.25,
    date: "28 May 2026",
    status: "Completed",
  },
];
