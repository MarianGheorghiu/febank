# Inventarul datelor mock

Contractele sunt modelele UI actuale. Pentru modulele cu tipuri inferate, forma
este vizibilă în export; nu există încă un DTO Go validat.

| Modul | Exporturi | Contracte |
| --- | --- | --- |
| [admin/flags-config.ts](./admin/flags-config.ts) | `CONFIG_SETTINGS`, `CONFIG_FLAGS`, `MOCK_FLAGS_CONFIG` | [DTO Flags & Config](../types/admin/flags-config.ts); [publicare, evaluare și integrare Go](../flags-config/README.md) |
| [admin/card-issuing.ts](./admin/card-issuing.ts) | `MOCK_CARD_CUSTOMERS`, `MOCK_CARD_ISSUING_STATE`, `MOCK_ISSUING_POLICY` | [admin/card-issuing.ts](../types/admin/card-issuing.ts); [flux și integrare Go](./admin/CARD_ISSUING.md) |
| [admin/business-analytics.ts](./admin/business-analytics.ts) | `MOCK_BUSINESS_ANALYTICS`, `BUSINESS_ANALYTICS_AS_OF` | [DTO Business Analytics](../types/admin/business-analytics.ts); [definiții și integrare Go](../business-analytics/README.md) |
| [admin/dashboard.ts](./admin/dashboard.ts) | `SYSTEM_LOGS`, `API_TRAFFIC_DATA`, `FLAGGED_ENTITIES` | [admin/business-analytics.ts](./admin/business-analytics.ts) | `MOCK_BUSINESS_ANALYTICS`, `BUSINESS_ANALYTICS_AS_OF` | [DTO Business Analytics](../types/admin/business-analytics.ts); [definiții și integrare Go](../business-analytics/README.md) |
| [admin/dashboard.ts](../types/admin/dashboard.ts) |
| [admin/markets.ts](./admin/markets.ts) | `MOCK_MARKET_DATE`, `MOCK_TRADING_FX`, `MOCK_TRADING_WALLET`, `MOCK_MARKETS_STATE` | [admin/markets.ts](../types/admin/markets.ts); [reguli și integrare Go](./admin/MARKETS.md) |
| [admin/rates.ts](./admin/rates.ts) | `mockFeeRules`, `mockFxPairs`, `mockWeekendShield`, `mockSubscriptionMatrix` | [admin/rates.ts](../types/admin/rates.ts) |
| [admin/simulation.ts](./admin/simulation.ts) | `MOCK_SIMULATION_FX_SPREAD_PERCENT`, `simulateMockFees` | [admin/simulation.ts](../types/admin/simulation.ts) |
| [admin/referrals.ts](./admin/referrals.ts) | `MOCK_REFERRAL_REPORT`, `REFERRALS_AS_OF` | [DTO referrals](../types/admin/referrals.ts); [raportare și integrare Go](../referrals/README.md) |
| [admin/subscriptions.ts](./admin/subscriptions.ts) | `MOCK_SUBSCRIPTIONS`, `SUBSCRIPTION_CUSTOMERS`, `SUBSCRIPTION_PLANS`, `SUBSCRIPTIONS_AS_OF` | [DTO subscriptions](../types/admin/subscriptions.ts); [integrare Go](../subscriptions/README.md) |
| [admin/system-logs.ts](./admin/system-logs.ts) | `MOCK_SYSTEM_LOGS` | Tipuri inferate / structură inline |
| [admin/telemetry.ts](./admin/telemetry.ts) | `MOCK_TELEMETRY_DATA` | [admin/telemetry.ts](../types/admin/telemetry.ts) |
| [admin/transaction-audit.ts](./admin/transaction-audit.ts) | `auditLogs` | Tipuri inferate / structură inline |
| [admin/transactions.ts](./admin/transactions.ts) | `mockAdminStats`, `mockTransactions` | [admin/transactions.ts](../types/admin/transactions.ts) |
| [admin/users.ts](./admin/users.ts) | `initialUsers`, `initialLogs`, `initialSessions` | [admin/users.ts](../types/admin/users.ts) |
| [analytics-ledger.ts](./analytics-ledger.ts) | `LEDGER_DATA`, `MOCK_LEDGER_LOGS` | [analytics-ledger.ts](../types/analytics-ledger.ts) |
| [analytics.ts](./analytics.ts) | `MOCK_MACRO_DATA`, `MOCK_ASSETS_DATA` | [analytics.ts](../types/analytics.ts) |
| [auth.ts](./auth.ts) | `determineRole`, `createMockSession` | [auth.ts](../types/auth.ts) |
| [balances.ts](./balances.ts) | `MOCK_BALANCES` | Tipuri inferate / structură inline |
| [card-analytics.ts](./card-analytics.ts) | `MOCK_ANALYTICS_DATA` | [card-analytics.ts](../types/card-analytics.ts) |
| [cards.ts](./cards.ts) | `MOCK_CARDS`, `MOCK_CARD_TRANSACTIONS`, `createMockCard`, `MOCK_CARD_LIMITS` | [cards.ts](../types/cards.ts); [cheltuieli](../types/card-analytics.ts) |
| [crypto-operations.ts](./crypto-operations.ts) | `ASSET_PRICES` | Tipuri inferate / structură inline |
| [crypto.ts](./crypto.ts) | `MOCK_MARKET`, `MOCK_DATA_STORE` | [crypto.ts](../types/crypto.ts) |
| [currencies.ts](./currencies.ts) | `MOCK_FIAT`, `MOCK_CRYPTO`, `MOCK_STOCKS` | [currencies.ts](../types/currencies.ts) |
| [currency-catalog.ts](./currency-catalog.ts) | `AVAILABLE_CURRENCIES`, `generateMockAccountRef` | Tipuri inferate / structură inline |
| [currency-history.ts](./currency-history.ts) | `generateMarketData` | [currency-history.ts](../types/currency-history.ts) |
| [dashboard.ts](./dashboard.ts) | `MOCK_OVERVIEW`, `OVERVIEW_AS_OF`, `cryptoHistory`, `stocksHistory`, `expensesHistory`, `marketAssetsData`, `transfersHistoryData` | [dashboard.ts](../types/dashboard.ts) |
| [dividends.ts](./dividends.ts) | `MOCK_DIVIDENDS` | [dividends.ts](../types/dividends.ts) |
| [exchange.ts](./exchange.ts) | `ASSET_PRICES`, `ASSET_TYPES` | Tipuri inferate / structură inline |
| [friends.ts](./friends.ts) | `mockFriendStats`, `MOCK_FRIENDS`, `MOCK_RECEIVED_REQUESTS`, `MOCK_SENT_REQUESTS` | [friends.ts](../types/friends.ts) |
| [ids.ts](./ids.ts) | `createMockId` | Tipuri inferate / structură inline |
| [landing-stats.ts](./landing-stats.ts) | `chartData`, `MOCK_LANDING_METRICS` | Tipuri inferate / structură inline |
| [landing-ticker.ts](./landing-ticker.ts) | `assets` | Tipuri inferate / structură inline |
| [loans/business-pricing.ts](./loans/business-pricing.ts) | `MOCK_BUSINESS_PRICING` | Tipuri inferate / structură inline |
| [loans/capital.ts](./loans/capital.ts) | `MOCK_VC_FUNDS` | [loans/capital.ts](../types/loans/capital.ts) |
| [loans/facilities.ts](./loans/facilities.ts) | `FACILITIES_DATA` | [loans/facilities.ts](../types/loans/facilities.ts) |
| [loans/invoices.ts](./loans/invoices.ts) | `MOCK_E_FAKTURA` | [loans/invoices.ts](../types/loans/invoices.ts) |
| [loans/products.ts](./loans/products.ts) | `RETAIL_CONFIGS`, `BUSINESS_CONFIGS` | [loans/products.ts](../types/loans/products.ts) |
| [loans/retail.ts](./loans/retail.ts) | `mockRetailLoans` | [loans/retail.ts](../types/loans/retail.ts) |
| [loans/revenue.ts](./loans/revenue.ts) | `MOCK_REVENUE_STREAMS` | [loans/revenue.ts](../types/loans/revenue.ts) |
| [messages.ts](./messages.ts) | `MOCK_MESSAGES`, `INITIAL_MESSAGES`, `MOCK_SPLIT_BILL_ALERT` | [messages.ts](../types/messages.ts) |
| [offer-conversions.ts](./offer-conversions.ts) | `MOCK_TARGETS` | [offer-conversions.ts](../types/offer-conversions.ts) |
| [offers.ts](./offers.ts) | `mockPremiumOffers` | [offers.ts](../types/offers.ts) |
| [overview-accounts.ts](./overview-accounts.ts) | `MOCK_OVERVIEW_ACCOUNTS` | [overview-accounts.ts](../types/overview-accounts.ts) |
| [page-dates.ts](./page-dates.ts) | `MOCK_PAGE_DATES`, `MOCK_HEADER_SESSION` | Tipuri inferate / structură inline |
| [recent-transfers.ts](./recent-transfers.ts) | `MOCK_RECENT_TRANSFERS` | Tipuri inferate / structură inline |
| [recurring-buys.ts](./recurring-buys.ts) | `MOCK_DCA`, `AVAILABLE_ASSETS` | [recurring-buys.ts](../types/recurring-buys.ts) |
| [security.ts](./security.ts) | `mockUserProfile`, `initialSecurityStatus`, `mockSessions`, `mockAuditLogs`, `createMockSecurityLog` | [security.ts](../types/security.ts) |
| [stock-catalog.ts](./stock-catalog.ts) | `STOCKS_CATALOG` | [stock-catalog.ts](../types/stock-catalog.ts) |
| [stocks.ts](./stocks.ts) | `MOCK_STOCK_HOLDINGS`, `MOCK_STOCK_ALLOCATION`, `MOCK_STOCK_HISTORY`, `MOCK_MARKET_ASSETS` | [stocks.ts](../types/stocks.ts) |
| [summaries.ts](./summaries.ts) | `MOCK_CLIENT_SUMMARY`, `MOCK_ADMIN_SUMMARY`, `MOCK_STOCK_SUMMARY`, `MOCK_CRYPTO_SUMMARY`, `MOCK_ANALYTICS_SUMMARY`, `MOCK_TRANSFER_SUMMARY`, `MOCK_BUSINESS_HEALTH`, `MOCK_LOAN_FLEXIBILITY`, `MOCK_ASSISTANT`, `MOCK_LANDING_SUMMARY`, `MOCK_LANDING_HERO`, `MOCK_LANDING_FEATURES`, `MOCK_LANDING_SECURITY` | Tipuri inferate / structură inline |
| [transfer-table.ts](./transfer-table.ts) | `MOCK_TRANSFERS` | [transfer-table.ts](../types/transfer-table.ts) |
| [transfers.ts](./transfers.ts) | `ASSETS_DB`, `INITIAL_TRANSFERS` | [transfers.ts](../types/transfers.ts) |

- `admin/system-health.ts`: platform, fiat, crypto and stock service probes, 24-hour API samples, incidents, infrastructure and maintenance. Fixed synthetic snapshot; no live monitoring.
