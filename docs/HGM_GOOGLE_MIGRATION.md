# HGM Google backend migration
Native Sheet: https://docs.google.com/spreadsheets/d/1BqfMqyvbDc_GboCrP6EIxXyfoUuHfQLS5xHTmdihRqs/edit
Data tabs are initialized but contain no migrated legacy records.

## Deploy Apps Script with HGM Google account
1. Open Sheet > Extensions > Apps Script.
2. Copy google-apps-script/Code.gs into the script editor.
3. Script Properties: HGM_API_TOKEN = 32+ byte random secret.
4. Deploy Web app: execute as owner; access Anyone. The endpoint only handles authorized POST actions.
5. Add server-only Vercel environment variables HGM_GOOGLE_APPS_SCRIPT_URL (the /exec URL), HGM_GOOGLE_API_TOKEN, and HGM_GOOGLE_CATALOG_ENABLED=true only after health+data checks.
6. Enable HGM_GOOGLE_QUOTES_ENABLED=true only after verifying real createQuote and proposal-status compatibility.
7. Retain Supabase authentication, payments, bookings, raffles, proposal histories until transactional migration and reconciliation. Never replace these with a public sheet.

Security: The Apps Script endpoint is not suitable for payment ledger, raffle assignment or concurrency-critical reservations. Do not make customer/payment sheets public. Keep the token server-only and rotate it if exposed.
