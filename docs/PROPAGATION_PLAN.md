# Propagačný systém – navrhované bloky úloh (pracovný návrh)

Tento dokument sumarizuje dohodnuté bloky úloh pre upratanie repozitára, definície pojmov,
architektúru a postup implementácie prepojenia medzi produkčnými systémami a propagačným
systémom.

## 1) Upratanie repo štruktúry + úplné vyčistenie

**Cieľ:** zjednodušiť štruktúru a odstrániť duplicity/artefakty.

**Potrebujeme ponechať:**
- `apps/` – produkčné aplikácie (napr. `nevedelE`).
- `packages/` – engine/contract knižnice.
- `docs/` – dokumentácia k architektúre a procesom.
- `scripts/` – pomocné skripty pre build/compute.

**Odstránené alebo určené na odstránenie:**
- `coso-system-main/` – duplicita klonu hlavného repozitára (aktuálne udržiavaný omylom).
- Dočasné alebo historické artefakty, ktoré nie sú súčasťou bežného build/deploy flow.

**Výstup:** čistá a zrozumiteľná štruktúra + zoznam čo ostáva.

## 2) Definícia produkčného systému („čo som nevedel, E“)

**Upresnenie:**
- Produkčný systém je **interná súčasť** celého riešenia.
- Hotový výstup = **edície** (škálovateľný výsledný web/app).
- Kľúčový vstup: **prompt/LLM okno** na generovanie textov a vlastností pre produkčné prostredie.

**Výstup tejto časti:** jasná definícia scope a zodpovedností „čo som nevedel, E“.

## 3) Jednotné pojmy + architektúra modulov

**Stav:**
- Produkčné systémy budú pribúdať – každý má vlastné tvorivé rozhranie.
- Propagačný systém je **samostatné rozhranie (web)** na nastavovanie a pridávanie publikácií/nástrojov.

**Cieľ:**
- Zadefinovať spoločné pojmy a rozhranie pre prepojenie medzi produkciou a propagáciou.
- Udržať modulárnosť (propagácia nie je napevno súčasťou produkčných webov).

## 4) Prepojenie produkcie → propagácia

**Dátový kontrakt:**
- Každá edícia musí obsahovať minimálny balík údajov pre propagáciu:
  - identifikátor, typ obsahu, cieľové publikačné kategórie, assety, metadáta.
- „Tunel“/prepojovací modul v produkčných systémoch:
  - export edícií do propagácie (jednorazovo alebo periodicky).

## 5) Minimálna verzia propagácie (manuálny režim)

**Funkcie:**
- Ručné pridávanie propagačných prostredí a nástrojov.
- Ručné priraďovanie edícií k prostrediam/nástrojom.
- Základné UI pre prehľadné mapovanie „edícia → publikačné prostredie“.

## 6) Automatizácia a rozšírenia (neskoršia fáza)

**Budúcnosť:**
- Detekcia nových publikačných možností/nástrojov.
- Regeneračný publikačný subprogram (periodické publikovanie podľa pravidiel).
- Automatické publikovanie vhodných edícií podľa typu obsahu.

---

## Potvrdenia (odsúhlasené)

- Súhlas s odstránením `coso-system-main/` z repozitára.
- Propagácia bude **samostatný web/rozhranie** (modulárne), bez pevného UI
  v produkčných weboch (len prepojovací „tunel“).
- Minimálny **dátový kontrakt edície** bude definovaný v minimálnej verzii (povinné polia).
