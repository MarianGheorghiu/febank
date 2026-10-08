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
