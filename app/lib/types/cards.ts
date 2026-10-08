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
