# AIO Docs

Single-tenant document preparation app (Quotations, Invoices, Waybills) with AI drafting.

## Setup

1. Install deps:
   ```
   npm install
   ```
2. Copy env:
   ```
   cp .env.example .env
   ```
   Fill in `DATABASE_URL` (PostgreSQL) and `ANTHROPIC_API_KEY`.
3. Push schema:
   ```
   npm run db:generate
   npm run db:push
   ```
4. Run:
   ```
   npm run dev
   ```
5. Open http://localhost:3000 → go to **Settings** first to enter company info + upload logo. Then **New Invoice**.

## Status (Phase 1)

- [x] Company settings + logo upload
- [x] Clients CRUD (basic)
- [x] Invoice: AI draft → edit → save → PDF
- [ ] Quotation (next)
- [ ] Waybill (next)
- [ ] Auth (next)
- [ ] Products catalog UI (next)
