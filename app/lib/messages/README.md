# Message Center / Go contract

`app/lib/types/messages.ts` defines the JSON contract; `MOCK_MESSAGES` contains deterministic, fictional conversations. `MessageRepository` separates the UI from persistence. Replace `createMessageRepository` with an authenticated Go HTTP adapter. This module currently uses localStorage and makes no network requests.

## Data and behavior

- `schema_version` and `revision` are integers. The response contains `as_of`, `messages` and `drafts`.
- IDs are opaque strings. `created_at`, `read_at`, reply `created_at` and `as_of` are RFC 3339 UTC timestamps. `read_at: null` means unread. The UI formats dates for Europe/Bucharest.
- Senders are `{id, name}`. Subject and body are plain text, rendered as text rather than HTML. List previews derive from body; do not send separate, conflicting preview text.
- Physical folders: `inbox`, `archived`, `deleted`. `replied` is a derived view of conversations with replies, excluding Trash. Replying never moves a conversation out of Inbox.
- Moving to Trash preserves `previous_folder`, replies and drafts. Restore returns to the original folder. Permanently deleting a conversation is available only in Trash and requires a UI confirmation; it removes the complete thread and draft.
- Replies are an append-only list with unique IDs and timestamps. A reply ID is an idempotency key. Reusing it with different content fails. Replying requires `can_reply: true`, a non-deleted conversation and 1–4000 characters after trimming.
- `amount` is null or `{value, currency, direction, label}`. `value` is an exact, unformatted decimal string; currency is a separate three-letter code. Monetary context is informational. Messages never initiate transfers or payments.
- `action` is null or an allowlisted destination (`settings`, `transfers`, `friends`, `cards`, `loans`, `offers`) plus label. The frontend resolves the internal route. No arbitrary URL or executable action is accepted.
- `drafts` maps conversation IDs to plain-text bodies of at most 4000 characters. The composer saves after a short pause, preserves edits on close/navigation and clears the draft after a successful send. A final draft write is allowed in Trash so closing an active editor during a move does not lose its latest text.

Search includes sender, subject, body and replies. Folder, bank/friend category and unread filters intersect. Category counts reflect the current folder/search/unread scope; summary counters reflect the full Inbox. Sorting uses latest reply time, then original message time. Lists use eight conversations per page; bulk selection and operations apply only to the visible page and clear when filters or pages change.

The local repository validates stored snapshots, isolates storage by customer, returns independent copies and reads the latest state before every atomic mutation. Browser storage changes refresh the other open tabs. Storage-write failures remain visible and do not produce successful confirmations. The mock is not an authorization boundary; Go must authorize every operation using the authenticated customer.

## Proposed API boundary

These routes are recommendations, not implemented endpoints:

- `GET /v1/me/messages`: return a snapshot (or filtered/paginated response with the same message DTOs).
- `POST /v1/me/messages/actions`: accept `{kind, ids}` for `mark_read`, `mark_unread`, `archive`, `unarchive`, `trash`, `restore`, `purge`; validate all IDs before committing the batch.
- `POST /v1/me/messages/{id}/replies`: accept `{reply_id, body}` and enforce idempotency, ownership and reply permission.
- `PUT /v1/me/messages/{id}/draft`: save `{body}`; an empty body discards the draft.

Return the updated snapshot after mutation. For server pagination, include totals/counts and do not treat the currently loaded page as the whole mailbox. Use revision/ETag conflict checks when edits can race. The server creates and validates timestamps; never trust browser time for production ordering.

Example Go DTOs (import `time`):

```go
type Reply struct {
    ID        string    `json:"id"`
    Body      string    `json:"body"`
    CreatedAt time.Time `json:"created_at"`
}
type Sender struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}
type Amount struct {
    Value     string `json:"value"`
    Currency  string `json:"currency"`
    Direction string `json:"direction"`
    Label     string `json:"label"`
}
type Action struct {
    Target string `json:"target"`
    Label  string `json:"label"`
}
type Message struct {
    ID             string     `json:"id"`
    Type           string     `json:"type"`
    Folder         string     `json:"folder"`
    PreviousFolder *string    `json:"previous_folder"`
    Sender         Sender     `json:"sender"`
    Subject        string     `json:"subject"`
    Body           string     `json:"body"`
    CreatedAt      time.Time  `json:"created_at"`
    ReadAt         *time.Time `json:"read_at"`
    CanReply       bool       `json:"can_reply"`
    Replies        []Reply    `json:"replies"`
    Amount         *Amount    `json:"amount"`
    Action         *Action    `json:"action"`
}
type Snapshot struct {
    SchemaVersion int               `json:"schema_version"`
    Revision      int               `json:"revision"`
    AsOf          time.Time         `json:"as_of"`
    Messages      []Message         `json:"messages"`
    Drafts        map[string]string `json:"drafts"`
}
```

Initialize empty arrays/maps so Go returns `[]` and `{}`, not `null`. Nullable fields above use explicit JSON null. Decimal values remain strings; use validated decimal arithmetic for any future financial operation.

## Shared UI and session metadata

The mailbox fills the available viewport. The list and reading pane scroll independently; the document itself does not scroll on this route. Selection shares the category toolbar and pagination uses compact icon controls.

Cards and buttons reuse `CardSurface`, `MetricCard` and `ActionButton`; successful operations reuse `OperationNotification`. The header now says **Last login**. Overview and Message Center share `useSessionMetadata`: one fixed demo entry time per user/document, refreshed only when the document reloads, with no polling/live clock. When authentication is implemented in Go, replace this demo value with the server's actual session ID and `last_login_at`.

Run `npm run test:messages`, `npx tsc --noEmit` and scoped ESLint. The domain tests cover fixture validation, filters, atomic batches, reply idempotency, restore/purge semantics, customer isolation, concurrent local changes and storage failure recovery.
