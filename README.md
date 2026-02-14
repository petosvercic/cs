# coso-system

Monorepo:

- packages/coso-engine - deterministický výpočet (compute) nad vstupom (seed/hash)
- packages/coso-contract - typy + schémy (validný input/output)
- apps/nevedelE - Next.js produktová appka (UI skeleton) + render edícií

## One Day MVP flow

### Web build and run
- Dev: `npm run dev`
- Build: `npm run build:nevedelE`
- Open: `http://localhost:3000/one-day`

### Notes
- Flow: `IMPULSE -> SPECTRUM -> RESULT -> SILENCE -> CLOSED`
- Copy guardrail: all One Day copy is centrally validated.
- Design is intentionally neutral; do not add CTA styling.
- Multiple spectra exist, but only one is shown per session.
- Content packs are swappable JSON files.

### Localization
- Supported languages: `sk` (default), `en`.
- Selection: browser/platform locale (`sk`, `en`), fallback to `sk`.
- Locale chrome: `apps/nevedelE/app/one-day/locales/sk.json`, `apps/nevedelE/app/one-day/locales/en.json`.
- Content packs: `apps/nevedelE/app/one-day/content/packs/pack-*.{sk,en}.json`.

### Content packs
- Build-time selection: `NEXT_PUBLIC_CONTENT_PACK=pack-a|pack-b` (default `pack-a`).
- Validate one pack: `npm run validate:content -- apps/nevedelE/app/one-day/content/packs/pack-a.sk.json`.
- Validate all packs: `npm run validate:content:all`.

## Release checklist

- `npm run validate:env`
- `npm run release:check`
- `npm run validate:content:all`

## Telemetry privacy

- Telemetry is off by default.
- Client flag: `NEXT_PUBLIC_TELEMETRY_ENABLED=true|false`.
- Server flag: `TELEMETRY_ENABLED=true|false`.
- Allowed payload fields only: `name`, `ts`, `session_id`, optional `build_version`, optional `platform`.
- No user ids, no slider values, no content text, no profiling fields.

## Env setup

> Never commit secrets. Commit only variable names in `.env.example`.

### Local setup
1. Copy `.env.example` to `.env.local`.
2. Fill real values only in `.env.local`.
3. Run `npm run validate:env`.
4. Start app: `npm run dev`.

`.env.local` is git-ignored and must stay local.

### Required validation rules
- Always required: `NEXT_PUBLIC_APP_URL`
- If `PAYMENTS_ENABLED=true`, all of these are required:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID`
  - `STRIPE_PUBLISHABLE_KEY`
- If `TELEMETRY_ENABLED=true`, validation allows no-op (no extra required endpoint env).

### Vercel setup

#### Preview environment
- Add non-production values in **Project Settings → Environment Variables → Preview**.
- Recommended: keep `PAYMENTS_ENABLED=false` unless preview Stripe/webhook is fully configured.
- Run `npm run validate:env` in CI for preview branches.

#### Production environment
- Add production values in **Project Settings → Environment Variables → Production**.
- If `PAYMENTS_ENABLED=true`, Stripe keys and `NEXT_PUBLIC_APP_URL` must be set or startup fails.
- Configure Stripe webhook target: `https://<prod-domain>/api/webhooks/stripe`.

### Payments / Stripe
- Checkout endpoint: `POST /api/checkout/gold`
- Quiet pages: `/gold/success`, `/gold/cancel`
- Webhook endpoint: `POST /api/webhooks/stripe`
- Local webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Edície (source of truth)

Edície sú uložené ako dáta v repozitári:

- Index: apps/nevedelE/data/editions.json
- Konkrétna edícia: apps/nevedelE/data/editions/<slug>.json

Príklad edície:

```json
{
  "slug": "test-002",
  "title": "Test 002",
  "content": { "hello": "again" },
  "createdAt": "2026-02-02T10:28:37.149Z"
}
```
