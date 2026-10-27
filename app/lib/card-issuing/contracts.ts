import type { CardCommand, CardCustomer, CardIssuingPolicy, CardIssuingState } from '../types/admin/card-issuing';
export interface IssuingPolicy extends CardIssuingPolicy {
  defaultLimits: { daily:number; monthly:number; atmDaily:number };
  currencies: readonly string[]; networks: readonly string[];
}
export interface IssuingSnapshot extends CardIssuingState {
  schema_version:1; mode:'demo'|'live'; as_of:string; customers:CardCustomer[]; policy:IssuingPolicy;
}
export type IssuingCommand=CardCommand & { expected_revision:number };
export interface IssuingRepository {
  getSnapshot(signal?:AbortSignal):Promise<IssuingSnapshot>;
  execute(command:IssuingCommand,key:string):Promise<IssuingSnapshot>;
}
