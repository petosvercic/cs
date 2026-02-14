# soc.stat – Úlohová mapa pre úspešnú výrobu a schválenie

## 1) Cieľ dokumentu
Táto úlohová mapa prekladá produktovú víziu **soc.stat** (mikro-sociálny statusový systém) do praktického realizačného plánu s jasnými výstupmi, zodpovednosťami, metrikami a schvaľovacími bránami.

---

## 2) Produktový kompas (nezameniteľné pravidlá)

1. **Produkt nie je kvíz o znalostiach**, ale denný „mentálny checkpoint“ (1–3 min).
2. **Denný rytmus > dĺžka používania** (rituál, nie feed).
3. **Výstup = symbolický stav + krátka interpretácia**, nie hodnotiace skóre.
4. **Etika pred rastom**: žiadne „pay-to-win“, minimum manipulácie, citlivý jazyk.
5. **Monetizácia je dvojvrstvová**:
   - predplatné (komfort a kontinuita),
   - interný kredit (hlbší kontext, nie výhoda nad inými).
6. **Najprv postaviť konkrétny produkt soc.stat**, až potom extrahovať opakovateľné časti do coso-system.

---

## 3) Fázy realizácie (Roadmapa)

## Fáza 0 — Strategické ukotvenie (1 týždeň)
**Cieľ:** Zjednotiť tím na jedinom význame produktu.

### Úlohy
- Definovať „One-liner produktu“ (max 20 slov).
- Schváliť taxonómiu spektier (6–8 oblastí) + pravidlá rotácie.
- Schváliť tón komunikácie (neutrálny, neezoterický, nehodnotiaci).
- Spísať „Do not build yet“ zoznam (čo vedome odkladáme).

### Výstupy
- Produktový manifest (1 strana).
- Slovník textov (mikrocopy guideline).
- Scope MVP v tabuľke „must / should / later“.

### Schvaľovacia brána G0
- ✅ Všetci decision-makri potvrdili rovnakú definíciu hodnoty.
- ✅ Existuje explicitne schválené MVP bez „scope creep“.

---

## Fáza 1 — UX a etický dizajn (1–2 týždne)
**Cieľ:** Overiť, že interakcia je bezpečná, zrozumiteľná a návyková bez toxicity.

### Úlohy
- Navrhnúť hlavný denný flow:
  1) vstup,
  2) 1 spektrum (5–7 otázok),
  3) symbolický výsledok,
  4) teaser sociálneho porovnania.
- Navrhnúť rozdiel Free vs Premium.
- Navrhnúť kreditové momenty (kde dáva použitie „zlata“ zmysel).
- Vytvoriť red-lines pre obsah:
  - žiadna diagnostika,
  - žiadne stigmatizujúce formulácie,
  - žiadne politicky polarizujúce otázky.

### Výstupy
- Wireflow + textový prototyp (Figma/Notion).
- Etický checklist pre každú otázku a výsledok.
- Notifikačná politika (max 1/deň, opt-in, ľahké vypnutie).

### Schvaľovacia brána G1
- ✅ UX test na malej vzorke preukázal pochopenie flow do 30 sekúnd.
- ✅ Etický audit bez kritických porušení.

---

## Fáza 2 — Obsahový systém (2 týždne)
**Cieľ:** Zaviesť predgenerovaný, auditovateľný a škálovateľný obsahový engine.

### Úlohy
- Definovať šablónu spektra:
  - meta (názov, typ, riziková úroveň),
  - 5–7 otázok,
  - mapovanie odpovedí na symbolický stav,
  - 1-vetná interpretácia.
- Zaviesť „content pipeline“:
  - generovanie dopredu,
  - automatická validácia,
  - manuálny sampling audit.
- Implementovať filtre:
  - vulgarizmy,
  - nenávistný obsah,
  - citlivé medicínske implikácie,
  - politická agitácia.
- Pripraviť minimálne 30 dní obsahu pre MVP.

### Výstupy
- Content schema + validačné pravidlá.
- Knižnica minimálne 30 denných balíkov.
- Interný QA report „content safety“.

### Schvaľovacia brána G2
- ✅ 95 %+ obsahu prejde validáciou bez manuálneho zásahu.
- ✅ 0 kritických etických incidentov v QA vzorke.

---

## Fáza 3 — Technická implementácia MVP (2–4 týždne)
**Cieľ:** Spustiť plne funkčný, samostatný web soc.stat.

### Úlohy
- Implementovať základné moduly:
  - Auth (ľahký onboarding),
  - Daily delivery (1x denne),
  - Answer capture,
  - Result engine (symbol + text),
  - History (premium),
  - Notifications (email/push),
  - Payments (Stripe).
- Zabezpečiť anonymizované sociálne porovnania (percentá/agregácia).
- Doplniť audit log pre obsah a monetizačné eventy.
- Implementovať feature flags (Free/Premium/Gold experimenty).

### Výstupy
- Bežiaci MVP na produkčnej URL.
- Monitoring dashboard (technický + produktový).
- Incident runbook (obsah, výpadok platieb, notifikácie).

### Schvaľovacia brána G3
- ✅ E2E kritická cesta funguje bez blokera:
  registrácia → denný flow → výsledok → premium nákup.
- ✅ SLA: dostupnosť + error rate v dohodnutom limite.

---

## Fáza 4 — Monetizácia a behaviorálne ladenie (2 týždne)
**Cieľ:** Potvrdiť, že model „komfort + kontext“ je ziskový a eticky stabilný.

### Úlohy
- Spustiť cenník:
  - Premium 1 €/mesiac,
  - malé balíčky zlata (napr. 200–250).
- Otestovať 2–3 verzie paywall textov (bez manipulatívneho FOMO).
- Otestovať 2 verzie teasingu porovnania (bez hanby a tlaku).
- Nastaviť „gold sinks“:
  - odomknutie ďalšieho spektra,
  - hlbší pohľad do výsledku,
  - retrospektíva histórie.

### Výstupy
- Monetizačný experiment sheet (hypotéza → výsledok → rozhodnutie).
- Schválený paywall copybook.
- KPI report za prvých 14 dní.

### Schvaľovacia brána G4
- ✅ Konverzia na premium dosahuje cieľový baseline.
- ✅ Žiadny signál o „pay-to-win“ v spätnej väzbe.

---

## Fáza 5 — Stabilizácia, compliance a príprava škálovania (2 týždne)
**Cieľ:** Pripraviť produkt na rast bez reputačného a právneho dlhu.

### Úlohy
- GDPR minimum:
  - právny základ spracovania,
  - retention politika,
  - export + delete flow.
- Bezpečnosť:
  - prístupové práva,
  - rate limiting,
  - základná detekcia abuse.
- Etické guardrails:
  - periodický audit textov,
  - eskalačný postup pri škodlivom obsahu.
- Pripraviť rozhodnutie „čo extrahovať do coso-systemu“.

### Výstupy
- Compliance checklist s dôkazmi.
- Security baseline report.
- Architektonický návrh extrakcie z reusable modulov.

### Schvaľovacia brána G5
- ✅ Produkt je právne a prevádzkovo pripravený na širšie nasadenie.
- ✅ Jasný plán, čo sa extrahuje do platformy a čo ostáva produktovo špecifické.

---

## 4) Backlog podľa pracovných prúdov (Workstreams)

## WS-A Produkt & UX
- A1: Denný flow (1–3 min) – návrh a test.
- A2: Symbolický výsledok + interpretácia.
- A3: Free/Premium informačná architektúra.

## WS-B Obsah & bezpečnosť
- B1: Spektrá (6–8 kategórií) a rotačná logika.
- B2: Obsahový audit + scoring rizikovosti.
- B3: Knižnica textov s neutral tone pravidlami.

## WS-C Dáta & algoritmy
- C1: Mapovanie odpovedí na stavy.
- C2: Výpočet anonymných porovnaní.
- C3: História trendov pre premium.

## WS-D Monetizácia
- D1: Stripe subscription.
- D2: Zlatá ekonomika (earn/spend loops).
- D3: Paywall experimenty.

## WS-E Platforma & prevádzka
- E1: Deploy pipeline (Vercel/GitHub).
- E2: Monitoring, alerting, incident response.
- E3: Feature flags + experiment framework.

## WS-F Právo & etika
- F1: GDPR + ToS + Privacy policy.
- F2: Etické red-lines a review komisia.
- F3: Nahlasovanie rizikového obsahu.

---

## 5) KPI mapa (čo musí byť „zelené“ pred schválením)

### Aktivácia a návratnosť
- D1 completion rate (dokončenie denného flow).
- D7 retention, D30 retention.
- Priemerný čas dennej relácie (cieľ: krátky, stabilný).

### Kvalita psychologickej skúsenosti
- „Cítil som sa hodnotený/á“ (musí byť nízke).
- „Pomohlo mi to reflektovať deň“ (musí rásť).
- Počet negatívnych ticketov na citlivosť obsahu.

### Monetizácia
- Free → Premium conversion.
- ARPU / MRR baseline.
- Percento nákupov „gold“ bez refund incidentov.

### Etika a compliance
- Počet etických incidentov (kritické = 0).
- Počet GDPR requestov vybavených v SLA.
- Transparentnosť paywallu (interný audit pass/fail).

---

## 6) RACI (kto za čo zodpovedá)

- **Founder/Product Owner (A):** vízia, scope, final approval.
- **Product Designer (R):** UX flow, texty, prototypy.
- **Content Lead (R):** spektrá, interpretačné texty, bezpečnosť.
- **Tech Lead (R):** architektúra, kvalita release, incidenty.
- **Data/ML Analyst (R):** mapovanie stavov, porovnania, metriky.
- **Compliance/Ethics (C):** GDPR, etické guardrails.
- **Community/Support (C):** spätná väzba, eskalácie od userov.

Legenda: R = Responsible, A = Accountable, C = Consulted.

---

## 7) Risk register (hlavné riziká + mitigácia)

1. **Toxické sociálne porovnávanie**
   - Mitigácia: anonymizácia, percentily bez mien, bezpečný copywriting.
2. **Obsahový prešľap (citlivé formulácie)**
   - Mitigácia: viacvrstvový audit + kill-switch na konkrétne spektrum.
3. **Monetizácia pôsobí manipulatívne**
   - Mitigácia: transparentný paywall, bez časových pascí, etický review.
4. **Nízka denná návratnosť**
   - Mitigácia: lepšia rotácia tém, kratší flow, šetrné notifikácie.
5. **Právny/privátny incident**
   - Mitigácia: data minimization, retention limity, audit log + procesy.

---

## 8) Definícia „Schválené na výrobu“ (Go/No-Go)

Projekt je pripravený na schválenie iba ak sú splnené naraz:

- G0–G5 všetky v stave **PASS**.
- MVP beží stabilne minimálne 14 dní bez kritického incidentu.
- Etický audit + GDPR checklist sú podpísané zodpovednými osobami.
- Monetizácia preukazuje prvotný fit bez reputačných varovaní.
- Existuje plán ďalších 60 dní (iterácie + príprava extrakcie do coso-system).

---

## 9) Praktický 30-dňový execution plán (minimum)

### Týždeň 1
- Finalizácia manifestu, UX flow, etických pravidiel (G0, časť G1).

### Týždeň 2
- Content schema, prvé spektrá, validačný pipeline (G2 draft).

### Týždeň 3
- MVP build: daily flow, výsledok, porovnanie, premium platby (G3 draft).

### Týždeň 4
- Soft launch (malá skupina), meranie KPI, úpravy paywallu, compliance finalizácia (G4/G5).

---

## 10) Poznámka k stratégii coso-system
soc.stat sa má stavať ako **samostatný produkt first**. Až po validácii reálneho používania sa odporúča extrahovať opakované moduly (content pipeline, scoring, anonymizované porovnania, billing orchestration) do coso-system jadra.


---

## 11) Implementačné artefakty (pripravené na použitie)
- Operatívny setup: `docs/soc-stat/IMPLEMENTATION_SETUP_SK.md`
- MVP backlog: `docs/soc-stat/MVP_BACKLOG_SK.md`
- Schvaľovacie checklisty G0–G5: `docs/soc-stat/GATE_CHECKLIST_SK.md`

Tieto artefakty môžeš priamo prekopírovať do project management nástroja (Jira/Linear/Trello) a spustiť realizáciu bez ďalšieho prepisovania.
