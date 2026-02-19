# Roadmap (referenčná štruktúrna mapa úloh)

Toto je pracovná osnova pre dopracovanie CANON filozofie do konzistentného systému.
Keď príde nová opica, ide presne podľa tohto.

## Fáza A: CANON + guardrails (hotovo za hodinu)
- [ ] `docs/00-canon.md` existuje a je citovaný v `README.md`
- [ ] staré protirečivé docs vyhodené alebo v `_graveyard`
- [ ] guardrail skript existuje a failuje pri “factory v admin”
- [ ] `docs/audit-*.md` generovateľný

## Fáza B: Šablóna coso-nevedel ako referenčný kontrakt
Cieľ: “šablóna” nie je pocit, ale kontrakt.
- [ ] zafixovať **sekcie + layout** coso-nevedel ako `docs/template-contract.md`
- [ ] zafixovať **edition JSON schema** (čo builder musí produkovať)
- [ ] zafixovať mapping: `edition.json -> UI komponenty`

## Fáza C: nevedelE továreň (workflow komplet)
- [ ] `/builder` vie:
  - [ ] refresh slug list (anti-duplicita)
  - [ ] vygenerovať prompt (manual LLM krok)
  - [ ] prijať JSON
  - [ ] publish (PR alebo direct) do správneho miesta
- [ ] interné tools routey sú chránené a konzistentné
- [ ] end-user vidí len `/e/<slug>` (a to je výsledný produkt)

## Fáza D: Admin portfólio (len dohľad)
- [ ] admin má len `products + health + links`
- [ ] žiadne publish/builder/editions routey ani API
- [ ] pripravené na budúce systémy (mediálne, promo…) bez toho, aby to tlačilo do nevedelE
