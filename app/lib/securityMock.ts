export interface UserProfileData {
  firstName: string;
  lastName: string;
  residenceNode: string;
  clearanceLevel: string;
  email: string;
  accountStatus: string;
}

export interface SecurityStatus {
  quantumEncryption: boolean;
  twoFactorAuth: boolean;
  biometricRetina: boolean;
  ipWhitelisting: boolean;
  securityScore: number;
}

export interface ActiveSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  activeNow: boolean;
  lastActive: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  status: "SUCCESS" | "FAILED" | "CRITICAL";
  ipAddress: string;
  subSystem: string;
}

export const mockUserProfile: UserProfileData = {
  firstName: "NEO",
  lastName: "ANDERSON",
  residenceNode: "SECTOR-7-BUCHAREST-GRID",
  clearanceLevel: "LEVEL-5-ADMIN",
  email: "n.anderson@matrixbank.cyber",
  accountStatus: "OVERCLOCK_ACTIVE",
};

export const initialSecurityStatus: SecurityStatus = {
  quantumEncryption: true,
  twoFactorAuth: true,
  biometricRetina: false,
  ipWhitelisting: true,
  securityScore: 88,
};

export const mockSessions: ActiveSession[] = [
  {
    id: "sess_01",
    device: "NeuralLink Terminal v4.2 (MacOs)",
    ip: "192.168.42.101",
    location: "Neo-Bucharest, Sector 7",
    activeNow: true,
    lastActive: "JUST NOW",
  },
  {
    id: "sess_02",
    device: "CyberDeck Deckard-80 (Linux)",
    ip: "10.0.8.24",
    location: "Chiba City, Japan",
    activeNow: false,
    lastActive: "2 HOURS AGO",
  },
  {
    id: "sess_03",
    device: "Mobile Implant v12 (Android)",
    ip: "185.23.4.112",
    location: "Night City, Lower Marina",
    activeNow: false,
    lastActive: "3 DAYS AGO",
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "log_01",
    timestamp: "2026-06-12 12:44:11",
    event: "QUANTUM DECRYPTION KEY ROTATED",
    status: "SUCCESS",
    ipAddress: "CORE_SYSTEM",
    subSystem: "CRYPTO_CORE",
  },
  {
    id: "log_02",
    timestamp: "2026-06-12 11:20:05",
    event: "UNAUTHORIZED ACCESS ATTEMPT REJECTED",
    status: "CRITICAL",
    ipAddress: "45.122.3.99",
    subSystem: "GATEWAY_FIREWALL",
  },
  {
    id: "log_03",
    timestamp: "2026-06-12 09:15:32",
    event: "2FA BIOMETRIC RE-VERIFICATION REQUESTED",
    status: "SUCCESS",
    ipAddress: "192.168.42.101",
    subSystem: "AUTH_NET",
  },
];
