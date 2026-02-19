# Publish flow reality (as of 2026-02-19)

This document describes the current (real) publish/login/dispatch flow implemented in `apps/nevedelE`.

## Primary product surface
- `apps/nevedelE` (Next.js App Router)

## Entry points (UI)
These pages exist in the product surface (see Next build output):
- `/builder` (UI)
- `/publish` (UI)
- `/deploy` (UI)
- `/editions` (UI listing)
- `/e/[slug]` (edition runtime page)

(Actual UI behavior is not documented here, only the underlying publish endpoints.)

## API entry points (factory)
### POST /api/factory/login
File: `apps/nevedelE/app/api/factory/login/route.ts`

Purpose:
- Simple token login that sets a cookie for subsequent UI use.

Auth:
- Reads `FACTORY_TOKEN` from env (required).
- Expects request JSON body `{ "token": "<value>" }`.
- If missing env -> `401 { ok:false, error:"FACTORY_TOKEN_MISSING" }`
- If token mismatch -> `401 { ok:false, error:"LOGIN_FAILED" }`

Side effects:
- On success sets cookie:
  - name: `factory`
  - value: `"1"`
  - httpOnly: true
  - sameSite: lax
  - secure: true
  - path: `/`
  - maxAge: 30 days

Response:
- `200 { ok:true }` on success

Notes:
- Cookie presence is not checked by `/api/factory/dispatch` (dispatch uses GitHub env token, not this cookie).

### POST /api/factory/dispatch
File: `apps/nevedelE/app/api/factory/dispatch/route.ts`

Purpose:
- Accept an edition JSON payload, validate it against existing slugs, then persist it:
  - either directly into GitHub via Contents API (preferred when `GITHUB_TOKEN` is present)
  - or locally into repo filesystem (fallback when no `GITHUB_TOKEN`)

Input:
- Accepts JSON body in either form:
  - `{ rawEditionJson: "<stringified JSON>" }`
  - or `{ rawEditionJson: <object> }` (will be JSON.stringified)
  - or `{ edition: <object> }` (fallback)
- Uses `validateEditionJson(inputJson, existingSlugs)` where `existingSlugs` comes from `listEditions()`.

Validation:
- Gets existing slugs via `listEditions().map(e => e.slug)`
- Calls `validateEditionJson(...)`
- If invalid -> `400 { ok:false, error, details?, debug? }`

Persist modes:

#### Mode A: GitHub Contents API (when `GITHUB_TOKEN` is set)
Env:
- `GITHUB_TOKEN` (required to enable this mode)
- Repo resolution:
  - If `GITHUB_REPO` contains `<owner>/<repo>`, it uses that.
  - Else it requires both `GITHUB_OWNER` and `GITHUB_REPO`.
  - If missing -> throws error "Missing env: GITHUB_REPO (use <owner>/<repo> or set GITHUB_OWNER + GITHUB_REPO)"
- `GITHUB_REF` branch name (defaults to `"main"`)

Writes:
- Index path: `apps/nevedelE/data/editions.json`
- Edition path: `apps/nevedelE/data/editions/<slug>.json`

Behavior:
- Reads existing index JSON if present, ensures `idx.editions` is an array.
- Upserts the slug entry (title + createdAt/updatedAt), newest first.
- Writes index via `PUT /repos/{owner}/{repo}/contents/{path}` with `branch: ref`.
- Writes edition JSON similarly (upsert by providing existing sha when present).

Response:
- `200` JSON with:
  - `ok: true`
  - `slug`
  - `mode: "github-contents-only"`
  - `indexUrl`, `editionUrl` pointing to GitHub blob URLs
  - message: `"Edition persisted directly to GitHub (no Actions)."`

Important implication:
- This mode does not trigger GitHub Actions by itself; it only updates files on a branch.

#### Mode B: Local filesystem (when `GITHUB_TOKEN` is NOT set)
Behavior:
- Calls `persistEditionLocally(withDates)` where `withDates` adds `createdAt` and `updatedAt`.
- Returns `200 { ok:true, slug, mode:"local", message:"Edition persisted to local repo data." }`

Errors:
- Any unhandled error -> `500 { ok:false, error:"INTERNAL_ERROR", message:<error message> }`

## Current source of truth for editions
- In GitHub mode: `apps/nevedelE/data/editions.json` + `apps/nevedelE/data/editions/<slug>.json` on the configured branch.
- In local mode: whatever `persistEditionLocally()` writes to (see `apps/nevedelE/lib/editions-store`).

## Canon constraints (guardrails context)
- `apps/admin` must not contain: builder/publish/deploy/editions/factory/stripe logic.
- `packages/coso-template/template-root` must not contain: publish/deploy/factory/dispatch/builder/editions endpoints.

## Risks / notes (reality)
- `/api/factory/dispatch` does not check the `factory` cookie. It relies on presence of `GITHUB_TOKEN` (and repo env config) for GitHub writes.
- Concurrent publishes can race on `apps/nevedelE/data/editions.json` if multiple updates happen close together (last write wins).

