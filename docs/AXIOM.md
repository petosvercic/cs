# COSO-SYSTEM — AXIOM (source of truth)

## Čo staviame
COSO-SYSTEM je monorepo platforma pre “factory weby”:
- platforma (engine + contract)
- produktové appky (Next.js runtime weby)

## Platforma
- packages/coso-contract: typy + schémy (validný input/output, formát edície)
- packages/coso-engine: deterministický compute nad inputom

## Produktová appka (runtime)
- apps/nevedelE: Next.js produktová appka (UI) + edície + builder + paywall/Stripe

## Edícia (definícia)
Edícia je produktový artefakt jednej konkrétnej appky (apps/nevedelE), nie globálny artefakt monorepa.

### Uloženie dát (source of truth)
- Index edícií: apps/nevedelE/data/editions.json
- Konkrétna edícia: apps/nevedelE/data/editions/<slug>.json

## Routing (musí fungovať)
- /list: vypíše edície z indexu
- /e/<slug>: zobrazí konkrétnu edíciu podľa súboru
- /builder: UI na tvorbu edícií (generovanie + voliteľná persistencia)

## API
- POST /api/compute: compute výsledok (volá engine)
- POST /api/builder: wrapper nad compute:
  - DEV: uloží edíciu do apps/nevedelE/data/editions + doplní index
  - PROD (Vercel): neukladá nič (filesystem je ephemeral), vráti len JSON + message

## Neporušiteľné pravidlá
- Edície patria apps/nevedelE a sú v apps/nevedelE/data/...
- Žiadne hádanie cwd pri čítaní/zápise “data path”
- PROD persist je zakázaný bez DB/KV/GitHub persistencie