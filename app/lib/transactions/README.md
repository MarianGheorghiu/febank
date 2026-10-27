# Global transaction operations

Workspace: `/dashboard/admin/transactions`, administrator only. Uses the customer overview's shared PageHeader, session metadata, surfaces, metric cards, action buttons and option selectors. It replaces the old in-memory transaction status overrides and separate read-only transfer monitor.

## Canonical sources and scope

The demo adapter projects all observed customer journals, market orders, cash deposits/withdrawals, credit drawdowns/repayments and cash reward redemptions into one namespaced registry. It excludes administrator preference wallets and opening transfer-history fixtures. Card activity fixtures are not ledger postings and are not included. Trading orders remain governed by Market Operations; their details link to that workspace.

On first open, 36 valid sample transfer requests are journaled once under three dedicated `transactions-demo-…@example.test` identities. Their holds, processing, settlements and rejections are genuine replayable demo events with reservations and audit. Existing journals are never overwritten. Subsequent refreshes preserve decisions and fixtures. Dates are captured when those sample journals are first created. The data scope is the current browser session, not a production-wide bank total.

Money stays in decimal strings; asset quantities preserve precision through 18 decimals. Summary arithmetic uses integer USD cents. Gross completed value is not net cash flow, revenue or treasury liquidity; trade followed by transfer is two operations. Fees count only on completed movements, in their USD equivalent. A fiat/crypto/stock grouping never adds raw asset quantities together.

Global metrics and seven-day UTC charts use all records, independent of local searches and ledger filters. The trailing 24-hour summary uses `(as_of - 24h, as_of]` decision timestamps. Ledger date filters use creation timestamps. Risk is derived from related active risk cases; an absent assessment is `UNASSESSED`, not an assumed low risk.

## Review workflow

- Pending → HOLD: preserve reserves; prevent processing and customer cancellation.
- Held → RELEASE: remove review hold; restore pending eligibility without releasing money.
- Pending → PROCESS: recheck current account access and Risk Control, then lock customer cancellation.
- Processing → SETTLE: recheck current controls, consume this transfer's reserved principal and fee, and record completed state. Available cash is not debited twice. The demo simulates external provider confirmation.
- Pending/held/processing → REJECT: release exactly the principal and fee reservations back to their original accounts. Other holds remain untouched. Refunds remain possible during a risk stop.
- Completed/rejected/cancelled records are read-only. Accounting corrections require separate compensating transactions; there is no arbitrary status editor.

Every command requires the captured transfer version, administrator identity, a 10–500 character reason and an idempotency key. Status, reserve changes and audit history are committed in the same wallet journal write. Duplicate same-key commands replay without another debit; changed payloads under the same key and stale versions fail. Storage failure preserves the original journal. Dynamic controls are checked on new commits, not historical replay. Customer Transfers displays the same status and an Under review badge. Both Admin Control and Audit Logs ingest the same decision history.

The global registry, attention queue and decision log each have independent searches. Search combines case-insensitive, accent-insensitive terms across reference, customer, source, domain, counterparty, destination, route, exact/raw and formatted amounts, fees, status, dates, risk-case IDs and operator notes. Decision-log searches inspect the specific displayed event rather than another event's note. Results remain inside capped scroll regions; ledger pagination and sorting combine with search. CSV exports include all filtered results across pages, or one selected record, and are audited before download. CSV formulas are neutralized.

## Go service contract

`contracts.ts` and `response.ts` define and validate the transport model: snake_case fields, RFC3339 UTC timestamps, decimal money strings and explicit versioned commands. Namespaced registry `id` is separate from the owning service's `source_id`.

Set `NEXT_PUBLIC_ADMIN_TRANSACTIONS_MODE=http` and `NEXT_PUBLIC_TRANSFERS_MODE=http` together. Optional origin: `NEXT_PUBLIC_ADMIN_TRANSACTIONS_API_URL`, falling back to `NEXT_PUBLIC_TRANSFERS_API_URL`, then same origin. Unknown/mismatched modes fail. HTTP responses must use `mode: live`; errors never fall back to demo data.

- `GET /v1/admin/transactions` → `TransactionSnapshot`, with authoritative global customer count, records, capabilities and decision history.
- `POST /v1/admin/customers/{customer_id}/transfers/{transfer_id}/decisions` with `Idempotency-Key` → `204` after atomic commit.
- `POST /v1/admin/transactions/exports` with `{ "transaction_ids": ["namespaced-id"] }` and `Idempotency-Key` → `text/csv`, after server-side access audit.

Decision example:

```json
{
  "action": "HOLD",
  "transfer_id": "trf-123",
  "expected_version": 3,
  "reason": "Review payment evidence for incident OPS-2418"
}
```

The Go service must derive operator identity and privileges from authenticated credentials, enforce customer scope and capabilities, validate requests, check optimistic concurrency and serialize wallet reservations, state and durable audit atomically. Use durable idempotency, `409` for conflicts and request-key reuse, and CSRF protection for cookie authentication. Fetch sends credentials and disables response caching. SETTLE must validate authoritative provider evidence and reconciliation state; a browser command or reason alone cannot establish external settlement. Live customer and admin endpoints must read the same backend ledger. Internal `admin_history` notes belong in authorized admin responses; omit them from public customer transfer DTOs. Opening-history fixtures must not become actionable reservations.

Validation: `npm run test:transactions-admin`, wallet, transfer, risk, market, audit and Admin Control regressions; TypeScript and scoped ESLint. Browser verification covers 320, 390, 768 and 1440px widths, three independent searches, bounded scroll, pagination and decision review. No screenshots are delivered.
