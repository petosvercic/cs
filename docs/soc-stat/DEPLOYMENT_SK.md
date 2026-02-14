# soc.stat – Ako to nasadiť a skontrolovať (krok za krokom)

Toto je praktický návod „od nuly“ bez domýšľania.

## 1) Je to už nasadené?
Krátka odpoveď: **v tomto repozitári to nie je automaticky nasadené samo od seba**.
Nasadenie vznikne až keď:
1. repo je pripojené na Vercel,
2. je vytvorený deploy (Production/Preview),
3. deploy prejde buildom.

---

## 2) Lokálna kontrola (najjednoduchšie overenie)
V root priečinku repa:

```bash
npm run dev -w apps/nevedelE -- --port 3000
```

Potom otvor v prehliadači:
- `http://localhost:3000/`
- `http://localhost:3000/soc-stat`

### Čo máš vidieť na `/soc-stat`
- 5 otázok (výber 1 z 2 možností),
- počítadlo „Vyplnené: X/5“,
- po zodpovedaní všetkých otázok symbolický výsledok (🌑/🟠/🟢).

Ak toto funguje, web je funkčný lokálne.

---

## 3) Nasadenie na Vercel (odporúčaný postup)

## A. Príprava
- Repo musí byť pushnuté na GitHub/GitLab/Bitbucket.
- Musíš mať Vercel účet.

## B. Import projektu
1. Vo Vercel klikni **Add New Project**.
2. Vyber tento repo.
3. **Root Directory nastav na `apps/nevedelE`**.
4. Framework by mal byť rozpoznaný ako **Next.js**.

## C. Build nastavenia
V projekte použi tieto hodnoty (zodpovedajú repo nastaveniu):
- Install Command: `cd ../.. && npm ci`
- Build Command: `cd ../.. && npm run build`

(Alternatívne sa to berie z `apps/nevedelE/vercel.json`.)

## D. Environment premenné (ak používaš platenie/DB)
- Pridaj iba tie, ktoré reálne používaš (napr. Stripe, Redis).
- Pre samotnú stránku `/soc-stat` demo nie sú nutné špeciálne premenné.

## E. Deploy
- Klikni **Deploy**.
- Po úspechu dostaneš URL (napr. `https://tvoj-projekt.vercel.app`).

---

## 4) Ako overiť, že je nasadené správne
Po deploye skontroluj:
1. `https://<deploy-url>/` sa načíta.
2. `https://<deploy-url>/soc-stat` sa načíta.
3. Po kliknutí odpovedí sa zobrazí výsledková karta.
4. V Vercel → **Deployments** je status **Ready**.

Rýchly smoke test URL:
- Home: `GET /` = HTTP 200
- Soc-stat: `GET /soc-stat` = HTTP 200

---

## 5) Najčastejšie problémy (a čo s nimi)

## Problém A: build padá na Google Fonts (Geist)
- Symptóm: chyba pri fetchi `fonts.googleapis.com`.
- Riešenie: vo firemnej sieti povoľ outbound prístup, alebo prejsť na lokálne/self-hosted fonty.

## Problém B: build padá na `coso-engine` / `coso-contract`
- Symptóm: module not found.
- Riešenie:
  1. nasadzuj monorepo build (`cd ../.. && npm run build`),
  2. over, že workspace balíky sa správne nainštalovali (`npm ci` v root),
  3. neprepínaj root na nesprávny priečinok mimo workspace kontextu.

## Problém C: nevidíš `/soc-stat`
- Symptóm: 404 alebo redirect inam.
- Riešenie: skontroluj, že deploy je z aktuálnej vetvy/commitu a že route je v `apps/nevedelE/app/soc-stat/page.tsx`.

---

## 6) Rýchly checklist pre teba (copy/paste)
- [ ] Spustil som lokálne `npm run dev -w apps/nevedelE -- --port 3000`
- [ ] Overil som `http://localhost:3000/soc-stat`
- [ ] Vercel project root je `apps/nevedelE`
- [ ] Install command je `cd ../.. && npm ci`
- [ ] Build command je `cd ../.. && npm run build`
- [ ] Deploy status je `Ready`
- [ ] Produkčná URL `/soc-stat` vracia 200

Ak chceš, v ďalšom kroku ti môžem pripraviť aj **presný Vercel setup screenshot-by-screenshot** podľa tvojho providera (GitHub/GitLab).


## 7) Chcem to mimo monorepa (samostatný projekt)
Použi extrakčný skript:

```bash
node scripts/extract-soc-stat-standalone.mjs ../soc-stat-standalone
```

Potom pokračuj podľa `docs/soc-stat/STANDALONE_EXTRACT_SK.md`.
