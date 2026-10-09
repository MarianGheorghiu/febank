# Audit Logs admin

Route: `/dashboard/admin/audit-logs` (existing admin navigation).

## Architecture

- Contracts: `app/lib/types/admin/audit.ts`.
- Fixtures: `app/lib/mock/admin/audit.ts`; 126 deterministic security, access,
  financial, compliance, configuration and service events dated 03–09 Oct 2026.
- Pure querying, grouping, redaction, diffs and CSV: `app/lib/audit/engine.ts`.
- Source normalization: `app/lib/audit/adapters.ts`.
- Append-only local event/annotation journal: `app/lib/audit/store.ts`, key
  `mbank_audit_journal_v1`.
- Source composition: `app/lib/audit/use-audit-events.ts`.
- UI: `app/components/ui/admin/audit/`.

Source identifiers are namespaced. Existing Card Issuing, Markets and Risk
Control stores remain the authority for their own operations; adapters read
these histories without copying them into another journal. Card fixture IDs
are matched exactly to preserve correct LOCAL / DEMO provenance. The journal
records new user-management, transaction override, fee-rule and weekend-shield
changes, console access, export requests and investigation annotations.
Legacy user history is explicitly demo data. Its offset-free timestamps are
interpreted as UTC. Session/IP/request IDs not supplied by a source are null,
never invented. Risk policy/case domain is preserved where available.

The sources-and-coverage view shows local record counts and errors independently
of investigation filters. Corrupt sources are excluded instead of being
presented as successfully restored live data. No repair/reset/delete action
removes existing evidence. Existing source stores do not guarantee globally
atomic persistence, retention or ordering across browser tabs.

## Investigation workflow

Search by actor, action, target, reason, event/request/session/correlation ID or
IP. Filter source, severity, outcome, domain, actor, category and provenance.
Use rolling 24h/7d/30d, all history or inclusive custom UTC boundaries. Display
zone is independent: UTC or Europe/Bucharest. Tables support stable sorting,
pagination and page sizes. Invalid ranges produce no results and block exports.

All filtered indicators and charts share exactly the event registry predicate:
stacked activity by outcome with zero-filled intervals, source distribution,
outcome donut and privileged actor ranking. Text/data tables accompany charts
for nonvisual inspection. Source/outcome/actor controls drill into the registry.
Severity is event severity, not a count of incidents or a diagnosis of misconduct.

Pause freezes event results and rolling time at a snapshot while source stores
continue collecting. Resume or refresh restores current results. Annotations
remain a separate current journal so a successful note save is visible immediately.

Event details expose source metadata, redacted before/after field differences,
normalized payload, exact correlation matches and append-only notes. No trace
is inferred from matching targets. Note + annotation audit event commit in one
journal write, and failures do not publish partial state. Original source
events are never edited by this workspace.

## Export and privacy

CSV and JSON export every matching page. JSON includes a manifest with UTC
generation time, operator, purpose, filters, sort, display zone, provenance
counts, collection warnings and notes. CSV includes normalized records, redacted
payloads, annotations and the report manifest in each row. Formula prefixes are neutralized and fields quoted.
A SHA-256 digest covers the exact UTF-8 bytes downloaded; the export request,
filters, count, reason and digest are saved before triggering browser download.
The receipt displays that digest. EXPORT_REQUESTED is not proof that the browser
completed a download. Export requests are not retroactively included in their
own report snapshot.

Sensitive keys (passwords, tokens, authorization/cookies, private keys, recovery
codes, PAN/card number, CVV/CVC, contact phone and delivery address) are masked
before persistence in the journal and before source payload display or export.
This is key-based redaction, not a guarantee that free text is secret-free.
Never place secrets or unnecessary personal data in notes or operational reasons.

## Boundaries and backend requirements

This remains the existing browser-local demo, with client-side administrator
guards. Source logs, identity and storage are editable by the browser user.
There is no tamper-proof archive, server clock, retention enforcement, legal hold,
authentication-provider ingestion, or full failed-command feed. Market order
rows are **latest-state projections**, not immutable lifecycle events; only
market admin history is a retained history in that existing source. Old admin
user/transaction/rate business state itself still resets with those demo pages;
its newly recorded audit evidence persists independently. Alert-only legacy
export buttons and unimplemented FX/matrix edits are not claimed as executions.

Production needs server-side RBAC and operator identity, atomic business/audit
transactions or a reliable transactional outbox, full order-transition and
failure ingestion, correlation/request/session metadata, source watermarks,
server pagination and cursor streaming, retention policies and legal holds,
WORM or verifiable append-only storage, encryption, verified server time,
export authorization and jurisdiction-specific compliance review. Retention or
compliance status must come from those services rather than a frontend badge.

Validation: `npm run test:audit`, existing risk/market/card suites,
`npx tsc --noEmit`, ESLint on changed code, production build, desktop/mobile UI.
