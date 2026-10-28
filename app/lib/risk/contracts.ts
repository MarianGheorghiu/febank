import type { RiskActor, RiskCommand, RiskDomain, RiskState } from '../types/admin/risk';
export interface RiskExposure { symbol: string; name: string; domain: RiskDomain; valueUsd: number; reserveUsd: number; low: boolean; source: 'TREASURY_FIXTURE' | 'SHARED_INVENTORY' | 'SERVICE' }
export interface RiskCustomer { email: string; name: string; status: string; kyc: string }
export interface RiskSnapshot { schema_version: 1; mode: 'demo' | 'live'; as_of: string; state: RiskState; exposures: RiskExposure[]; customers: RiskCustomer[] }
export interface RiskRepository { getSnapshot(signal?: AbortSignal): Promise<RiskSnapshot>; execute(command: RiskCommand, idempotencyKey: string): Promise<RiskSnapshot> }
export type { RiskActor };
