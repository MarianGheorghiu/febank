// Package transfers defines the Go transport contract for the customer transfer API.
// Generated counterpart of app/lib/transfers/contracts.ts. Monetary values are exact decimal strings.
package transfers

import "time"

type TransferKind string

type TransferState string

type TransferAccount struct {
	ID        string       `json:"id"`
	Kind      TransferKind `json:"kind"`
	Asset     string       `json:"asset"`
	Name      string       `json:"name"`
	Decimals  int          `json:"decimals"`
	Available string       `json:"available"`
	Reserved  string       `json:"reserved"`
	USDPrice  string       `json:"usd_price"`
}

type TransferFeePolicy struct {
	Fixed          string  `json:"fixed"`
	RateBps        int     `json:"rate_bps"`
	Minimum        string  `json:"minimum"`
	Maximum        *string `json:"maximum,omitempty"`
	DebitAccountID string  `json:"debit_account_id"`
}

type TransferRoute struct {
	ID              string             `json:"id"`
	Asset           string             `json:"asset"`
	Name            string             `json:"name"`
	DestinationKind string             `json:"destination_kind"`
	Network         *string            `json:"network,omitempty"`
	Fee             string             `json:"fee"`
	FeePolicy       *TransferFeePolicy `json:"fee_policy,omitempty"`
	ETA             string             `json:"eta"`
	Enabled         bool               `json:"enabled"`
}

type TransferDraft struct {
	SourceAccountID string `json:"source_account_id"`
	RouteID         string `json:"route_id"`
	Amount          string `json:"amount"`
	RecipientName   string `json:"recipient_name"`
	Destination     string `json:"destination"`
	Reference       string `json:"reference"`
}

type TransferQuote struct {
	ID           string        `json:"id"`
	Draft        TransferDraft `json:"draft"`
	Asset        string        `json:"asset"`
	Fee          string        `json:"fee"`
	FeeAsset     *string       `json:"fee_asset,omitempty"`
	FeeAccountID *string       `json:"fee_account_id,omitempty"`
	Total        string        `json:"total"`
	ValueUSD     string        `json:"value_usd"`
	ExpiresAt    time.Time     `json:"expires_at"`
	ETA          string        `json:"eta"`
}

type CustomerTransfer struct {
	ID            string        `json:"id"`
	AccountID     string        `json:"account_id"`
	Kind          TransferKind  `json:"kind"`
	Asset         string        `json:"asset"`
	Amount        string        `json:"amount"`
	Fee           string        `json:"fee"`
	FeeAsset      *string       `json:"fee_asset,omitempty"`
	FeeAccountID  *string       `json:"fee_account_id,omitempty"`
	ValueUSD      string        `json:"value_usd"`
	Direction     string        `json:"direction"`
	RecipientName string        `json:"recipient_name"`
	Destination   string        `json:"destination"`
	RouteID       string        `json:"route_id"`
	Reference     string        `json:"reference"`
	Status        TransferState `json:"status"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	CanCancel     bool          `json:"can_cancel"`
}

type TransferSnapshot struct {
	SchemaVersion int                `json:"schema_version"`
	Mode          string             `json:"mode"`
	AsOf          time.Time          `json:"as_of"`
	Accounts      []TransferAccount  `json:"accounts"`
	Routes        []TransferRoute    `json:"routes"`
	Transfers     []CustomerTransfer `json:"transfers"`
	Limits        TransferLimits     `json:"limits"`
}

type TransferLimits struct {
	Currency          string    `json:"currency"`
	DailyLimit        string    `json:"daily_limit"`
	Used              string    `json:"used"`
	ResetsAt          time.Time `json:"resets_at"`
	VerificationLabel string    `json:"verification_label"`
}

type SubmitTransfer struct {
	QuoteID string `json:"quote_id"`
}
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}
type ErrorResponse struct {
	Error APIError `json:"error"`
}
