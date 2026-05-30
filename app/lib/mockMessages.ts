import { Message } from "../components/ui/types";

export const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-1",
    type: "bank",
    folder: "inbox",
    senderName: "LIQUID CORE SECURITY",
    title: "Quantum Biometric Override Blocked",
    previewText:
      "An unauthorized neural-link handshake was attempted from an unrecognized node in Tokyo. Liquid Shield automatically deployed cryptographic countermeasures. Vault parameters remain nominal.",
    timestamp: "14:32",
    isUnread: true,
  },
  {
    id: "msg-2",
    type: "friend",
    folder: "inbox",
    senderName: "Tudor Miron",
    title: "OTC Liquidity Pool Share",
    previewText:
      "Just dropped my part for the commercial real-estate smart contract. Verify the ledger on your end and let me know when you execute the swap.",
    timestamp: "11:15",
    isUnread: true,
    meta: { amount: "+$12,500.00 USDT" },
  },
  {
    id: "msg-3",
    type: "bank",
    folder: "inbox",
    senderName: "ASSET ROUTING DEPT",
    title: "Cross-Border Wire Dispatched Successfully",
    previewText:
      "Your corporate routing to London SW1 has cleared compliance. SWIFT-GPT token verification attached to your monthly statement.",
    timestamp: "Yesterday",
    isUnread: false,
    meta: { amount: "-$4,200.00 EUR" },
  },
  {
    id: "msg-4",
    type: "friend",
    folder: "inbox",
    senderName: "Elena Rostova",
    title: "P2P Node Access Granted",
    previewText:
      "Hey, I added you as a trusted node in my high-frequency vault. You can now pull short-term micro-loans without protocol validation.",
    timestamp: "28 May",
    isUnread: false,
  },
  {
    id: "msg-5",
    type: "bank",
    folder: "deleted",
    senderName: "LIQUID AUTOMATION",
    title: "Recurrent Gas Fee Optimization Report",
    previewText:
      "Archived telemetry data regarding automated layer-2 gas refuel cycles executed during low-congestion windows.",
    timestamp: "25 May",
    isUnread: false,
  },
  {
    id: "msg-6",
    type: "bank",
    folder: "replied",
    senderName: "LIQUID LOAN ENGINE",
    title: "Collateralized Debt Position Margin Call Warning",
    previewText:
      "LTV ratio reached 74.2%. Automatically requesting an additional buffer injection to prevent algorithmic liquidation modules from execution.",
    timestamp: "24 May",
    isUnread: false,
    meta: { amount: "Required: 2.50 ETH" },
    replyPayload: {
      body: "Liquidity buffer successfully refueled from Cold Storage Vault Alpha. Re-verify collateral index.",
      timestamp: "24 May, 18:05",
    },
  },
  {
    id: "msg-7",
    type: "friend",
    folder: "inbox",
    senderName: "Marc Andreessen",
    title: "Seed Round Cap Table Finalization",
    previewText:
      "The zero-knowledge compliant cap table is locked. We need your cryptographic signature to deploy the automated venture distribution tokens.",
    timestamp: "24 May",
    isUnread: true,
  },
  {
    id: "msg-8",
    type: "bank",
    folder: "inbox",
    senderName: "COMPLIANCE AI",
    title: "EU MiCA Regulation Validation",
    previewText:
      "Your algorithmic yielding strategies have been fully validated under the latest digital assets framework. No compliance modifications required.",
    timestamp: "22 May",
    isUnread: false,
  },
  {
    id: "msg-9",
    type: "friend",
    folder: "inbox",
    senderName: "Satoshi Legacy Node",
    title: "Relay Node Ping Request",
    previewText:
      "Encrypted broadcast packet received via localized mesh network. Confirm node uptime statistics for institutional cross-routing integrity.",
    timestamp: "20 May",
    isUnread: false,
  },
  {
    id: "msg-10",
    type: "bank",
    folder: "deleted",
    senderName: "MARKETING CORE",
    title: "Premium Titanium Glass Card Perks",
    previewText:
      "Unlock absolute airport terminal privileges across 40 private planetary hubs. Disregard if premium quantum routing tier is already active.",
    timestamp: "19 May",
    isUnread: false,
  },
  {
    id: "msg-11",
    type: "bank",
    folder: "inbox",
    senderName: "FRAUD ENGINE DISPATCH",
    title: "High-Frequency Trading Lock Activated",
    previewText:
      "Detected 450 concurrent transaction requests within a 12ms window from an offshore proxy. Stream temporarily throttled for security audit.",
    timestamp: "18 May",
    isUnread: true,
  },
  {
    id: "msg-12",
    type: "friend",
    folder: "replied",
    senderName: "Alex CryptoKnight",
    title: "DeFi Yield Farm Migration Strategy",
    previewText:
      "Smart contracts on Pool v4 are experiencing liquidity drain. Recommend instant bridge routing to Liquid Protocol Layer-3.",
    timestamp: "15 May",
    isUnread: false,
    replyPayload: {
      body: "All dynamic assets bridged smoothly using automated gas optimization channels. Total cost saved: $45.20.",
      timestamp: "15 May, 12:40",
    },
  },
  {
    id: "msg-13",
    type: "bank",
    folder: "inbox",
    senderName: "VALUATION & RISK",
    title: "Quarterly Asset Attestation Report",
    previewText:
      "Independent on-chain proof of reserves compiled successfully. 1:1 asset backing mathematically proven via zero-knowledge verification proofs.",
    timestamp: "14 May",
    isUnread: false,
  },
  {
    id: "msg-14",
    type: "friend",
    folder: "deleted",
    senderName: "Spam Broker Bot",
    title: "Instant Micro-leverage Options Available",
    previewText:
      "Maximize trading output with 1000x artificial intelligence-powered liquidity vectors. Click here to bypass core authorization controls.",
    timestamp: "10 May",
    isUnread: false,
  },
  {
    id: "msg-15",
    type: "bank",
    folder: "inbox",
    senderName: "SYSTEM KERNEL",
    title: "Scheduled Encryption Key Rotation Completed",
    previewText:
      "Every dynamic private key mapping across multi-signature nodes has been shifted automatically. Quantum computational resistance score: 100%.",
    timestamp: "09 May",
    isUnread: false,
  },
];
