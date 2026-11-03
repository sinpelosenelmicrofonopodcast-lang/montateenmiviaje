# Móntate en Mi Viaje — direct Google Sheets API migration

Google Sheets: https://docs.google.com/spreadsheets/d/1BqfMqyvbDc_GboCrP6EIxXyfoUuHfQLS5xHTmdihRqs/edit

## State
- Google sheet has 13 initialized tabs; the main business tabs have only headers as of 2026-11-02.
- Apps Script /exec URL was returning a Google Drive error. The legacy Apps Script bridge was replaced in lib/hgm-google.ts with the official Sheets REST API.
- No data has been migrated. Payments, bookings, sign-in, proposals and raffle state remain on the legacy backend. Feature switches remain disabled.
- Do not disable Supabase or turn on any Google flags without reconciling existing records and business flows.

## Required Google Cloud access
1. In a Google Cloud project owned by HGM, enable **Google Sheets API**.
2. Create a dedicated service account with access only to the required spreadsheet. Create a JSON private key for the account; store this outside of source control.
3. Share the spreadsheet with the service account's `client_email` as **Editor**, not 'Anyone with link'.
4. In Vercel > montateenmiviaje > Settings > Environment Variables (production, preview, development), set:
   - `HGM_GOOGLE_SERVICE_ACCOUNT_EMAIL`: JSON `client_email`
   - `HGM_GOOGLE_PRIVATE_KEY`: JSON `private_key` (including newlines; \\n is supported)
   - `HGM_GOOGLE_SHEET_ID`: `1BqfMqyvbDc_GboCrP6EIxXyfoUuHfQLS5xHTmdihRqs`
5. Redeploy after env changes. Sign in as an admin and request `/api/admin/health/google`. Expected `ok: true`, `provider: google-sheets-api`.
6. Compare source data counts and totals to Google sheet destination before any cutover. Ensure trips, quotes, reservations, clients, refunds, balances, and PayPal workflows reconcile.
7. Keep `HGM_GOOGLE_CATALOG_ENABLED` and `HGM_GOOGLE_QUOTES_ENABLED` false until frontend and backend transaction/portal compatibility is tested. Google quote IDs currently don't match the Supabase proposal flow; do not activate this feature as-is.

## Security
- The new endpoint only uses server-side credentials; never prefix them NEXT_PUBLIC_.
- No public permission on the spreadsheet. No confidential keys in GitHub, chat or screenshots.
- Apps Script token and deployment URL are obsolete for the new direct client.
- Sheets is not an appropriate transactional ledger for concurrent reservations, raffle allocations, or payment settlement; those flows require a transactional data store or reliable payment backend.
