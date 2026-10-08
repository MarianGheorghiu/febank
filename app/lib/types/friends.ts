export type Friend = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  status: "online" | "offline";
  financialStatus: "owed_to_you" | "you_owe" | "neutral";
  balance: number;
  asset: string;
  dateAdded: string;
  isMuted: boolean; // <- ADAUGATĂ PENTRU CORECTITUDINE TYPE-SAFE
};

export type PendingRequest = {
  id: string;
  name: string;
  username: string;
  date: string;
};
