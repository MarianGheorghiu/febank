import type { MarketActor } from '../types/admin/markets';
import type { MarketOperationsRepository } from './contracts';
import { marketWire, parseMarketSnapshot } from './response';
export function createMarketOperationsRepository(actor: MarketActor): MarketOperationsRepository {
  if (actor.role !== 'admin') throw new Error('Administrator access required.');
  const mode = process.env.NEXT_PUBLIC_TRANSFERS_MODE ?? 'demo';
  if (mode === 'demo') {
    const store = import('./store');
    return {
      async getSnapshot() { const local = await store; const {seedMarketDemo,seedStockMarketDemo}=await import('./demo'); const now=new Date().toISOString(); seedMarketDemo(now); seedStockMarketDemo(now); return {schema_version:1,mode:'demo',as_of:new Date().toISOString(),state:local.projectAllCustomers(local.readBaseMarketCatalog())}; },
      async execute(command) { const local = await store; local.executeMarketAdmin(command, actor); return this.getSnapshot(); },
    };
  }
  if (mode !== 'http') throw new Error('Unknown market operations mode.');
  const base = (process.env.NEXT_PUBLIC_TRANSFERS_API_URL ?? '').replace(/\/$/,'');
  async function request(path: string, init: RequestInit) {
    const response = await fetch(`${base}/v1/admin/markets${path}`, {...init,credentials:'include',cache:'no-store',headers:{Accept:'application/json',...init.headers}});
    if (!response.ok) {
      const error = await response.json().catch(()=>null);
      throw new Error(error?.error?.message ?? `Market service request failed (${response.status}).`);
    }
    return parseMarketSnapshot(await response.json());
  }
  return {
    getSnapshot: signal => request('/snapshot',{signal}),
    execute: (command,key) => {
      if (!key.trim()) throw new Error('Idempotency key required.');
      return request('/commands',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({schema_version:1,command:marketWire(command)})});
    },
  };
}
