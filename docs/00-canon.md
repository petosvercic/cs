# CANON (jediný zdroj pravdy)

## 1 veta (pre všetkých)
Coso-nevedel je šablóna. nevedelE je produkčný systém, ktorý podľa tejto šablóny vytvára finálne webové edície. Admin je vrstva na správu produkčných systémov.

## Pojmy (bez filozofie)
- **coso-nevedel**: referenčná šablóna (layout, sekcie, UI jazyk). Nie je to produkčný systém.
- **nevedelE**: samostatný produkčný systém (Vercel projekt), ktorý:
  - obsahuje interné nástroje (builder/publish/slug refresh)
  - vytvára a publikuje finálne edície ako slugy (napr. /e/<slug>)
  - negeneruje texty automaticky: texty vznikajú manuálnym krokom cez LLM prompt v builder workflow.
- **Admin**: portfólio vrstva pre firmu:
  - zoskupuje produkčné systémy (dnes len nevedelE, neskôr ďalšie)
  - slúži ako rozcestník + dohľad (health, linky do systémov)
  - nikdy nerobí publish ani builder logiku za nevedelE.

## Hard pravidlá
- Všetok builder/publish workflow žije v **apps/nevedelE**.
- **apps/admin** je len hub (zoznam systémov, health, linky).
- End-user vidí len výsledné edície (slugy), nie interné tools.
