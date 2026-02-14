# AI BRIEF (paste into any new assistant window)

You are working on repo: coso-system (monorepo).
Goal: factory system for generating and serving product “editions” inside a Next.js app.

Facts:
- packages/coso-engine = deterministic compute
- packages/coso-contract = types/schemas
- apps/nevedelE = Next.js runtime app (routes /list, /e/<slug>, /builder)

Editions source of truth (do not change):
- apps/nevedelE/data/editions.json (index)
- apps/nevedelE/data/editions/<slug>.json (single edition)

API:
- POST /api/compute exists
- POST /api/builder must exist: DEV persists to filesystem; PROD (Vercel) must NOT persist (ephemeral FS), only return JSON + message.

Rules:
- No ambiguous cwd-based paths. Use deterministic repo-root anchored paths in code.
- Provide steps as: (1) What changes (1 sentence), (2) PATH + full file content, (3) PowerShell commands starting with cd C:\Users\Slipo\coso-system, (4) CHECK commands/URLs.
- Never use PowerShell here-strings for execution steps.