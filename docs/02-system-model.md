# 02 — Target system model

Tento dokument je krátky cieľový model podľa CANON (`docs/00-canon.md`) a roadmapy (`docs/01-roadmap.md`).

## Components
- `apps/nevedelE`: jediný autonómny produkčný systém; drží interné tools (`/builder`, publish flow) aj výsledné edície (`/e/<slug>`).
- `apps/admin`: dohľadový hub/rozcestník pre produkčné systémy (products, health, links), bez builder/publish/editions/deploy logiky.
- `packages/coso-template`: referenčný UI kontrakt šablóny; nie je to produkčný publish systém.

## Source of truth
- CANON pravidlá: `docs/00-canon.md`.
- Implementačná osnova a guardrails ciele: `docs/01-roadmap.md`.
- Runtime pravda pre edície nevedelE: `apps/nevedelE/data/editions.json` + `apps/nevedelE/data/editions/*.json`.

## Forbidden footprints
- V `apps/admin` sú zakázané route segmenty a API footprinty:
  - `/builder`, `/publish`, `/editions`, `/deploy`
  - API cesty obsahujúce `editions`, `publish`, `builder`, `factory`
- V `packages/coso-template` sú zakázané publish endpointy (template je kontrakt, nie továreň).

## Auth model
- Interné tools v nevedelE sú server-side a token-gated podľa konkrétnych route požiadaviek.
- Admin je read-only dohľadová vrstva; nemá interný publish auth model, lebo publish nevykonáva.
- End-user vstupuje na verejné slugy (`/e/<slug>`) bez prístupu k interným tools route.

## Publish flow
1. Builder workflow žije výhradne v `apps/nevedelE`.
2. JSON obsah edície sa pripraví manuálnym LLM krokom v rámci builder flow.
3. Publikácia zapíše/aktualizuje edíciu v dátových zdrojoch nevedelE.
4. Výsledok je dostupný ako end-user slug route (`/e/<slug>`).

## Data locations
- nevedelE editions index: `apps/nevedelE/data/editions.json`
- nevedelE editions payloads: `apps/nevedelE/data/editions/*.json`
- Legacy snapshots (ak treba migráciu/forenziku): `apps/nevedelE/data/editions.legacy*`
- Template content packs (len šablónové dáta): `packages/coso-template/template-root/app/data/packs/*`
