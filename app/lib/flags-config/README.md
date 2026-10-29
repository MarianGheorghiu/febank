# Flags & Config

Admin route: `/dashboard/admin/config`. This workspace manages **global configuration**, isolated by production, staging and sandbox. Configuration is not scoped to the signed-in administrator or current customer's balances. Operator identity is used for authorization, audit and per-tab draft recovery, not for the configuration scope.

## UI and ownership

The shared PageHeader, ActionButton, MetricCard, CardSurface, SearchField, white DialogCloseButton and OperationNotification are reused. The duplicate title/subtitle, local-demo badge, redundant footer and sidebar “Admin mode” label were removed.

Views:

- **Overview:** stacked flag coverage by domain and 14-day published change activity. Both chart panels have a 512px height. Flag coverage separates full audience, targeted rollout and disabled/0% flags. It counts configured flags, not customers or service adoption. Release activity excludes drafts.
- **Configuration:** all 41 typed settings, searchable by label/key/description/domain, with critical/advanced/changed filters and optional collapsible domain grouping. Numeric values retain their explicit units; EUR cents are formatted as EUR for display, while editors and DTOs retain integer minor units.
- **Feature flags:** a continuous responsive grid of 24 flags, with readable audience names, availability switches, rollout meters and a rule editor. Switches only stage draft changes. Optional domain grouping uses compact rows for single flags, avoiding empty grid columns.
- **Release history:** search, release-type filter, UTC-day grouping, immutable diffs and reviewed restoration. Collections use a fixed, internally scrolling results region capped at 38rem or 70dvh. Filters stay outside it.
- **Simulator:** twelve explicitly fictional profiles and 100/1,000/5,000 generated examples per audience. A grouped bar chart compares published and draft eligibility; a plain-language customer result explains access. These are separate hypothetical cohorts, not real customer counts, and are never summed into a global population. Technical IDs/hash details are collapsed.

Changing the environment card uses the shared searchable selector. Unsaved changes block environment switching. The card remains blue and its dropdown is raised above following cards. Dialogs trap focus through native `dialog`, restore focus on close, scroll inside 90dvh, and block dismissal while publishing/exporting. X buttons stay white with a pointer and no hover color effects.

## Domain model

- Catalog: `catalog.ts` (41 settings, 24 flags, 12 domains), independent from fixtures.
- Persistence and immutable releases: `store.ts` and `engine.ts`.
- Transport DTOs: `types/admin/flags-config.ts`; runtime validation: `response.ts`.
- Shared global execution checks: `runtime.ts`.
- Mock history: `mock/admin/flags-config.ts`; simulation profiles: `mock/admin/config-simulator.ts`.

`ConfigState` storage schema v1 contains independent environment snapshots, complete release chains and optional private idempotency receipts. Receipts remain in storage and are excluded from admin snapshot DTOs. A release includes ID, revision, timestamp, actor, reason, optional request ID, restoration source and immutable before/after payloads. Canonical JSON comparison is independent of object-key order, matching Go map serialization.

Validation rejects missing/unknown payload keys, non-integer or unsafe numeric amounts, invalid units/enum choices, invalid rollout percentages, disabled parent dependencies, impossible transfer thresholds, broken release chains, duplicate release IDs and invalid receipt references. Production administrator MFA and KYC requirements cannot be disabled. Monetary settings retain their stated EUR-minor basis even when the reporting currency changes; changing reporting defaults does not convert balances or reprice transactions.

A publish uses an expected revision and complete payload. A restoration stages the full **pre-release** configuration as a new release; it does not delete history or selectively reverse only one key. Editing a restoration turns it into an ordinary draft. Review shows every resulting difference against the current baseline.

Drafts are stored in sessionStorage under an operator-specific key, with environment and base revision. They recover after reload in the same tab. Invalid drafts are preserved and editing is blocked until the operator explicitly discards them. Storage failures are visible. Configuration refreshes never silently rebase or discard a stale draft.

## Demo persistence and global effects

```dotenv
NEXT_PUBLIC_FLAGS_CONFIG_MODE=demo
```

Shared configuration remains at `mbank_flags_config_v1`. Publication re-reads it immediately before the synchronous write, verifies revision, validates the entire result, and persists configuration + release audit + idempotency receipt in one write. Storage failures do not publish. Repeating a request ID returns the original publication result; reusing it for different content is rejected. Authorization is checked before replaying a receipt. localStorage does not provide a multi-process database transaction; the Go implementation must provide an authoritative CAS transaction.

There are 46 labelled illustrative release examples across production and staging; sandbox starts without fabricated changes. Untouched legacy baseline snapshots may gain the labelled history **only when published values match exactly**. This read projection does not write storage or replace configured values. Existing non-baseline releases and custom values remain intact. Example release audit events retain DEMO provenance; operator publications are LOCAL. A new publication records its request ID in Audit Logs.

Production controls are read afresh at demo commit time:

| Consumer | Enforced controls |
| --- | --- |
| Shared wallet | Maintenance for new cash/transfer, trading, credit and reward writes |
| Crypto and stock trading | Module trading master checked against the executed instrument |
| Credit | New applications use the loan-application master |
| Cards Vault | Card-issuing master; virtual-card flag/audience/rollout using shared identity IDs and current subscription membership |
| Referrals | Published campaign flag, audience, rollout, maintenance and recorded reward/expiry terms |

Premium audiences use the actual shared subscription registry; internal audiences use managed administrator identity. Business audience eligibility is not invented for legacy demo identities without a business classification and remains denied. Live services must derive all audience claims from authenticated records.

Wallet replay and completed idempotent retries do not re-evaluate today's policy. Refunds/cancellations, loan repayment and card freeze/termination remain available for recovery. New writes fail closed when configuration storage is invalid. Mixed HTTP configuration with local demo money execution is rejected, rather than using stale local policy. Dedicated pricing/risk/issuing policy modules still own their additional rules.

`GlobalConfigNotice` is mounted in DashboardShell. It observes production maintenance across all pages, uses the shared operation notification for changed customer-side production revisions, and listens to config events, cross-tab storage and focus. Publishing staging/sandbox does not announce a production change. The admin publication/export/draft outcomes use the same global notification component. This demo does not send external email or push messages.

Session/MFA enforcement, reporting defaults, retention, delivery retries and other service-owned targets are versioned here but require their actual owning backend services. Publication alone is not proof those services have adopted a revision. The UI explicitly distinguishes configuration from service adoption.

## Go HTTP integration

```dotenv
NEXT_PUBLIC_FLAGS_CONFIG_MODE=http
NEXT_PUBLIC_FLAGS_CONFIG_API_URL=https://api.example.test
```

An empty base URL uses same-origin routes. HTTP mode uses credentialed, non-cached requests and cancellable snapshot reads. It never reads demo state or falls back to fixtures. Client role checks are for UX; Go derives the operator from its authenticated session, enforces permissions and handles CSRF/CORS as appropriate. No actor identity is trusted from a command body.

### GET /v1/admin/config/snapshot

Returns `ConfigSnapshot`:

```json
{
  "schema_version": 2,
  "catalog_version": 1,
  "scope": "GLOBAL",
  "mode": "live",
  "snapshot_id": "immutable-authorized-snapshot-id",
  "as_of": "2026-10-29T12:00:00Z",
  "permissions": { "publish": true, "export": true },
  "state": { "schema_version": 1, "environments": {} }
}
```

`environments` must contain production, staging and sandbox, each with `revision`, `published: {settings, flags}`, and its complete `releases` chain. The abbreviated JSON above omits those records; the exact TypeScript DTO defines their fields. Private persistence receipts are forbidden in the response. Catalog v1 keys and constraints must match `catalog.ts`. Introducing a different catalog requires a compatible client/catalog version, not silently accepting unknown controls.

This v2 snapshot contract contains complete release history; a server must not silently truncate it. A cursor-based history transport should be introduced with a separately versioned/paginated contract when retained history outgrows this complete-snapshot model. Current UI collection heights and searches already handle large result sets without extending the page.

Go mapping: booleans remain booleans; integer settings/counters use safe-range int64; enum/timezone values remain strings; dynamic setting values can decode via `json.RawMessage` and be validated against the catalog. Timestamps use RFC3339/time.Time. Rollout and audience are typed fields, not strings embedded in a description. Arrays serialize as `[]`, not `null`. No credentials, keys or customer records belong in configuration.

### POST /v1/admin/config/{environment}/releases

Header: `Idempotency-Key: <request_id>`.

```json
{
  "schema_version": 2,
  "catalog_version": 1,
  "request_id": "uuid",
  "environment": "production",
  "expected_revision": 31,
  "payload": { "settings": {}, "flags": {} },
  "reason": "Reviewed operational configuration change.",
  "restored_from": null
}
```

The payload must contain **all** catalog entries; empty objects above are placeholders. Go validates types, dependencies, production security invariants, reason (10–500 chars), environment authorization and expected revision. It must commit configuration + immutable release + durable audit + idempotency receipt atomically. If services consume release events, publish them through a durable outbox after that transaction. Duplicate identical request IDs return the committed result; payload reuse is rejected. Revision/snapshot conflicts return 409; validation 422; unauthorized 403.

Returns an authoritative live `ConfigSnapshot`. Its release history must include the matching request ID at expected_revision + 1, the reviewed payload, reason and restoration source. The frontend verifies these before clearing the draft. A response mismatch preserves the draft and requires refresh; it is never treated as success. Production review also asks the operator to type `production`; this UI confirmation is not authorization or a substitute for server policy.

### POST /v1/admin/config/exports

Header: `Idempotency-Key: <request_id>`.

Body: schema_version 2, request_id, snapshot_id, environment, revision, 10–500 character reason and lowercase content_sha256. Returns matching request_id, snapshot_id, environment, revision, checksum plus audit_event_id and RFC3339 recorded_at. Any mismatch blocks download.

The dialog pins the snapshot. UTF-8 JSON includes schema/catalog versions, scope, mode, snapshot ID, cutoff, environment, published revision/payload and trimmed reason. It excludes unpublished edits, UI filters, private receipts and release history. SHA-256 is audited before downloading the exact bytes. Browser hashing proves the downloaded payload's checksum, not authenticity of backend source data. Server snapshot retention must allow reviewed exports, or return 409 if expired.

### GET /v1/config/runtime

A separate public-to-the-authenticated-customer runtime endpoint, not the privileged admin snapshot. Returns `{schema_version: 1, environment: "production", revision: positive_integer, maintenance: boolean}`. DashboardShell polls it every 60 seconds and refreshes on focus/config events. Customer services must independently enforce current policy atomically with their operations. Hiding a button or showing a maintenance banner is not backend enforcement. Production publication must invalidate relevant service caches; this frontend does not claim cross-host SSE delivery.

### Stable rollout

FNV-1a 32-bit over UTF-8 bytes of `flag_key:stable_subject_id`, modulo 10000. Access is allowed when bucket < rollout_pct × 100, after maintenance, module master, enabled status, audience and parent checks. Use Go `hash/fnv.New32a()`. Subject IDs and audience must come from authenticated customer records. The simulator uses synthetic IDs and makes no real eligibility claim.

## Verification

`npm run test:flags-config` covers contract validation, immutable history, production invariants, concurrency, idempotency, state/receipt isolation, audited exports, storage failures, scoped drafts, deterministic audience simulations, 100-release histories and real wallet retry behavior after a maintenance change. Regression suites cover wallet, transfers, markets, cards, credit, offers, currencies, crypto, stocks, referrals and audit. TypeScript, scoped ESLint and browser checks cover selectors, searches, dialogs, bounded scrolling and responsive layout.
