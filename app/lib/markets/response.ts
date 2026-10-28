import { validateMarketState } from './store';
import type { MarketOperationsSnapshot, MarketWireValue } from './contracts';
const decimals = new Set(['priceUsd','minOrderUsd','maxOrderUsd','reserveUnits','reserveUsd','lowLiquidityUsd','quantity','targetPrice','price','feeUsd','totalUsd','reservedCash','unitsDelta','usdDelta']);
const decimalMaps = new Set(['cash','units','costBasis']);
function transform(value: unknown, decode: boolean, key = '', decimalMap = false): unknown {
  if (Array.isArray(value)) return value.map(entry => transform(entry, decode));
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([field, entry]) => [field, transform(entry, decode, field, decimalMaps.has(key))]));
  if (value === null || (!decimals.has(key) && !decimalMap)) return value;
  if (!decode) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid decimal field: ${key}.`);
    return value.toLocaleString('en-US', {useGrouping:false,maximumFractionDigits:20});
  }
  if (typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 1e12) throw new Error(`Invalid service decimal: ${key}.`);
  return Number(value);
}
export function marketWire(value: unknown): MarketWireValue { return transform(value, false) as MarketWireValue; }
export function parseMarketSnapshot(value: unknown): MarketOperationsSnapshot {
  if (!value || typeof value !== 'object' || !('schema_version' in value) || value.schema_version !== 1 || !('as_of' in value) || typeof value.as_of !== 'string' || !Number.isFinite(Date.parse(value.as_of)) || !('state' in value)) throw new Error('Unsupported market operations response.');
  const state = transform(value.state, true);
  if (!validateMarketState(state) || state.instruments.some(item => item.reserveUsd < 0 || item.reserveUnits < 0)) throw new Error('Invalid market operations snapshot.');
  return {schema_version:1,mode:'http',as_of:value.as_of,state};
}
