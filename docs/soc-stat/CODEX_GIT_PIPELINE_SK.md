# Codex Git Bash pipeline (lokálne): add → commit → push

Tento mini-pipeline je pripravený pre tvoj workflow „lokál repo + commit + push“.

## 1) Príkazy

### A) Iba commit (bez push)
```bash
scripts/codex-git-pipeline.sh -m "feat(soc-stat): moja zmena"
```

### B) Commit + push
```bash
scripts/codex-git-pipeline.sh -m "feat(soc-stat): moja zmena" --push
```

### C) Commit + push na iný remote
```bash
scripts/codex-git-pipeline.sh -m "feat: moja zmena" --push --remote origin
```

---

## 2) Čo pipeline robí
1. skontroluje, že si v git repozitári,
2. skontroluje branch (nie detached HEAD),
3. spraví `git add -A`,
4. ak sú zmeny, vytvorí commit,
5. voliteľne pushne branch na remote.

---

## 3) Odporúčaný flow pre soc.stat
1. Urob zmeny v kóde.
2. Spusť build/test check (`npm run build`).
3. Spusť pipeline s commit message.
4. Ak je všetko OK, spusti rovnaký príkaz s `--push`.

---

## 4) Poznámka
Týmto vieš commit/pushovať **aj všetky doterajšie soc.stat zmeny** v tomto repo konzistentne jedným príkazom.
