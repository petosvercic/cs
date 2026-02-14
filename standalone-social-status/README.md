# Standalone Social Status System

Samostatný systém vytvorený mimo existujúcich častí repozitára.

## Čo obsahuje

- jednoduchý Node.js HTTP server (`src/server.js`),
- front-end bez frameworku (`public/index.html`, `public/app.js`, `public/styles.css`),
- denné spektrá, free/premium gating, gold earn/spend loop,
- status vyhodnotenie po 5 otázkach,
- simulovaný gold shop a premium social insights.

## Spustenie

```bash
cd standalone-social-status
npm start
```

Potom otvor:

- http://localhost:4310

## Poznámka

Je to MVP/koncept implementácia pripravená na ďalšie rozšírenie (DB, auth, push notifikácie, real payments, produkčné security pravidlá).
