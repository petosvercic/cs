/**
 * COSO-SYSTEM — PROJECT AXIOM + CHECKLIST (source of truth)
 *
 * PURPOSE
 * - This file is the single canonical description of what we are building.
 * - It is also a living checklist: after each finished step, mark it DONE.
 * - Any new assistant window must follow this file as the top priority.
 *
 * HOW TO USE (for humans)
 * - When opening a new assistant/chat window, paste this file first and say:
 *   "Follow PROJECT_AXIOM_CHECKLIST.ts as source of truth. Do NOT improvise."
 *
 * HOW TO USE (for AI)
 * - Treat this as an AXIOM. If uncertain, ask based on this file ONLY.
 * - Output format requirements are below.
 */

/* =========================
   0) THE AXIOM (WHAT WE BUILD)
   =========================

COSO-SYSTEM is a monorepo platform for "factory web products".

There are two layers:

A) Platform (stable logic)
- packages/coso-contract: types + schemas (valid input/output, edition shape)
- packages/coso-engine: deterministic compute over input (seed/hash)

B) Product apps (runtime web products)
- apps/nevedelE: Next.js runtime app that:
  - lists published editions (/list)
  - renders an edition (/e/<slug>)
  - provides a builder UI (/builder)
  - already contains Stripe/paywall routes

Edition model:
- An "edition" is a product artifact belonging to ONE specific product app (nevedelE),
  not a global monorepo artifact.

Source of truth for editions (MUST NOT CHANGE):
- Index: apps/nevedelE/data/editions.json
- Single edition: apps/nevedelE/data/editions/<slug>.json

Routing that must work:
- /list -> reads editions index and shows list
- /e/<slug> -> reads edition file and renders it
- /builder -> UI to generate an edition:
  - calls POST /api/compute (compute result)
  - in DEV can persist to filesystem (optional)
  - in PROD (Vercel) MUST NOT persist (ephemeral FS), return JSON + message

API:
- POST /api/compute exists
- POST /api/builder must exist:
  - DEV: persist edition file + update index
  - PROD: no persist, return draft JSON + message

Non-negotiables:
- No cwd guessing for paths in code.
- All code paths must be deterministically anchored.
- PROD persist is forbidden until DB/KV/GitHub persistence is implemented.
*/

/* =========================
   1) OUTPUT RULES FOR AI ASSISTANT
   =========================

When proposing changes, AI MUST output in this exact structure:

1) One sentence: "What changes" (only 1 thing)
2) PATHS + full file contents (no partial snippets, no missing addresses)
3) PowerShell steps:
   - ALWAYS begin with: cd C:\Users\Slipo\coso-system
   - Use absolute paths for writes: $repo=(Resolve-Path .).Path; Join-Path
   - No here-strings for execution steps.
4) CHECK section:
   - exact commands + exact URLs to verify

AI MUST NOT:
- improvise project goals
- change engine logic
- propose "try both paths" hacks
- output blocks without file paths
*/

/* =========================
   2) CHECKLIST (mark DONE as we go)
   =========================

Legend:
[ ] TODO
[x] DONE
[-] PARTIAL

Milestone 1: Local DEV correctness
[x] /list reads apps/nevedelE/data/editions.json and shows editions
[x] /e/<slug> reads apps/nevedelE/data/editions/<slug>.json and renders it
[x] Slovak diacritics rendering fixed (UTF-8 no BOM issues handled)

Milestone 2: Builder integration
[ ] /builder UI uses POST /api/compute for compute-only mode
[ ] POST /api/builder exists (wrapper over compute)
[ ] DEV persist mode: /api/builder writes edition file + updates index
[ ] PROD mode: /api/builder returns draft only (persisted=false + message)
[ ] /builder UI shows result JSON in-page (no alert-only UX)
[ ] Optional: link to /e/<slug> after persist in DEV

Milestone 3: Deployment reality (Vercel)
[-] Vercel deploy works for viewing static editions
[ ] Ensure no FS writes are required in PROD runtime
[ ] Choose persistence backend for PROD:
    - (A) GitHub API commit editions
    - (B) DB/KV store (Upstash/Redis/DB)
    - (C) External storage (S3)
[ ] Implement selected persistence method
[ ] Add environment config + secrets handling

Milestone 4: Productization
[-] Stripe/paywall routes exist
[ ] Confirm paywall gating logic in UI
[ ] Add shareable certificate / result sharing flow
[ ] Add admin controls for edition publishing
*/

/* =========================
   3) CURRENT STATUS SNAPSHOT
   =========================

As of now:
- /list and /e/<slug> are working locally and on Vercel for existing JSON in repo.
- Builder page exists but shows TODO "napojit na /api/compute".
- /api/builder route does NOT exist yet.
*/
export {};
