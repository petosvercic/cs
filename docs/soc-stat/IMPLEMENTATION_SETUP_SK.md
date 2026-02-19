# soc.stat – Implementačný setup (podľa návrhu)

Tento dokument prekladá stratégiu do dennej operatívy: čo založiť, čo merať a ako riadiť schvaľovanie.

## 1. Setup projektu (deň 0)
- Založiť epiky:
  - EPIC-01 Produktový kompas a UX
  - EPIC-02 Obsahový pipeline a safety
  - EPIC-03 MVP technická implementácia
  - EPIC-04 Monetizácia (Premium + Gold)
  - EPIC-05 Compliance a stabilizácia
- Založiť stavy ticketov: `Backlog`, `Ready`, `In Progress`, `Review`, `Done`, `Blocked`.
- Nastaviť štítky: `ws-a` až `ws-f`, `gate-g0` až `gate-g5`, `risk`, `ethics`, `kpi`.

## 2. Povinné artefakty (Definition of Ready)
Každý ticket musí mať:
1. Biznis dôvod (prečo to robíme).
2. Akceptačné kritériá (testovateľné body).
3. Vplyv na etiku/psychologickú bezpečnosť (ak relevantné).
4. KPI väzbu (ktorú metriku mení).

## 3. Týždenný rytmus (operating cadence)
- **Pondelok (30 min):** plánovanie priorít podľa KPI a rizík.
- **Streda (20 min):** checkpoint Gx (ktorá gate je najbližšie).
- **Piatok (30 min):** demo + rozhodnutie: pokračovať / stop / upraviť hypotézu.

## 4. Go/No-Go governance
- Každá gate (G0–G5) má ownera.
- Gate sa považuje za `PASS` iba ak:
  - sú splnené všetky kritériá,
  - je priložený dôkaz (link na report/dashboard/test).
- Ak nie je PASS, povinne vzniká „Recovery ticket“ s termínom.

## 5. KPI dashboard minimum
- Aktivácia: completion rate denného flow.
- Retencia: D7, D30.
- Monetizácia: Free→Premium conversion, MRR baseline.
- Safety: počet etických incidentov, počet obsahových eskalácií.
- Prevádzka: error rate, uptime, payment failures.

## 6. MVP launch checklist (skrátka)
- [ ] Daily flow funguje end-to-end.
- [ ] Výstup je symbolický stav + neutrálna interpretácia.
- [ ] Free/Premium hranica je zrozumiteľná a transparentná.
- [ ] Gold nedáva výhodu nad inými (iba kontext).
- [ ] GDPR minimum: export/delete/retention.
- [ ] Incident runbook je dostupný tímu.

## 7. Pravidlo extrakcie do coso-system
Extrakciu spustiť až po splnení:
- 14 dní stabilnej prevádzky bez kritického incidentu.
- potvrdený baseline pre retenciu aj monetizáciu.
- aspoň 3 opakujúce sa moduly jasne oddeliteľné od produktovej logiky.

## 8. Deploy odkaz
Praktický deploy návod je v: `docs/soc-stat/DEPLOYMENT_SK.md`.
