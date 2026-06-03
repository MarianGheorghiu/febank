// app/lib/mockFriends.ts

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

// Statistici globale pentru PageHeader
export const mockFriendStats = {
  online: 5,
  pending: 3,
};

export const MOCK_FRIENDS: Friend[] = [
  {
    id: "USR-901",
    name: "Alexandru Popescu",
    username: "@alexp",
    email: "alex.popescu@ledger.io",
    phone: "+40 722 123 456",
    status: "online",
    financialStatus: "owed_to_you",
    balance: 250.0,
    asset: "USD",
    dateAdded: "15 Jan 2026",
    isMuted: false,
  },
  {
    id: "USR-902",
    name: "Elena Vasilescu",
    username: "@elenav",
    email: "elena.v@vault.net",
    phone: "+40 731 987 654",
    status: "online",
    financialStatus: "you_owe",
    balance: 65.25,
    asset: "USD",
    dateAdded: "22 Mar 2026",
    isMuted: false,
  },
  {
    id: "USR-903",
    name: "Mihai Dumitru",
    username: "@mihaid",
    email: "mihai.dumitru@crypto.com",
    phone: "+40 745 555 444",
    status: "offline",
    financialStatus: "neutral",
    balance: 0.0,
    asset: "USD",
    dateAdded: "02 Nov 2025",
    isMuted: true, // Acesta va apărea estompat direct la încărcare
  },
  {
    id: "USR-904",
    name: "Andreea Stoica",
    username: "@andreeas",
    email: "andreea.s@prime.com",
    phone: "+40 766 111 222",
    status: "online",
    financialStatus: "owed_to_you",
    balance: 170.5,
    asset: "USD",
    dateAdded: "10 May 2026",
    isMuted: false,
  },
  {
    id: "USR-905",
    name: "Vlad Ionescu",
    username: "@vlad_i",
    email: "vlad.ionescu@quantum.ro",
    phone: "+40 723 444 888",
    status: "online",
    financialStatus: "you_owe",
    balance: 1200.0,
    asset: "USD",
    dateAdded: "18 Dec 2025",
    isMuted: false,
  },
  {
    id: "USR-906",
    name: "Diana Marinescu",
    username: "@dianam",
    email: "diana.m@apex-labs.io",
    phone: "+40 755 900 100",
    status: "offline",
    financialStatus: "owed_to_you",
    balance: 45.0,
    asset: "USD",
    dateAdded: "04 Apr 2026",
    isMuted: false,
  },
  {
    id: "USR-907",
    name: "Robert Sandu",
    username: "@roberts",
    email: "robert@sandu-design.com",
    phone: "+40 732 777 333",
    status: "online",
    financialStatus: "neutral",
    balance: 0.0,
    asset: "USD",
    dateAdded: "29 May 2026",
    isMuted: false,
  },
  {
    id: "USR-908",
    name: "Andra Teodorescu",
    username: "@andra_teo",
    email: "a.teodorescu@nexus.dev",
    phone: "+40 741 222 999",
    status: "offline",
    financialStatus: "you_owe",
    balance: 310.8,
    asset: "USD",
    dateAdded: "11 Feb 2026",
    isMuted: true, // Al doilea contact mutat implicit pentru test vizual
  },
];

export const MOCK_RECEIVED_REQUESTS: PendingRequest[] = [
  {
    id: "REQ-301",
    name: "Andrei Nistor",
    username: "@andreyn",
    date: "02 Jun 2026",
  },
  {
    id: "REQ-302",
    name: "Cătălina Radu",
    username: "@catar",
    date: "31 May 2026",
  },
];

export const MOCK_SENT_REQUESTS: PendingRequest[] = [
  {
    id: "REQ-401",
    name: "Ștefan Bălan",
    username: "@stefb",
    date: "03 Jun 2026",
  },
  {
    id: "REQ-402",
    name: "Laura Georgescu",
    username: "@laurag",
    date: "28 May 2026",
  },
];
