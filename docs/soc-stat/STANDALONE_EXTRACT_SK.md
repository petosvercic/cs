# soc.stat – ako z tohto repa urobiť samostatný projekt

Ak chceš **samostatné repo/appku**, použi skript:

```bash
node scripts/extract-soc-stat-standalone.mjs ../soc-stat-standalone
```

To vytvorí úplne nový Next.js projekt s route `/soc-stat` mimo tohto monorepa.

## Čo sa vytvorí
- nový priečinok (napr. `../soc-stat-standalone`)
- vlastný `package.json`, `tsconfig.json`, `next.config.js`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- skopírovaný `app/soc-stat/page.tsx` (tvoj MVP flow)

## Spustenie standalone appky
```bash
cd ../soc-stat-standalone
npm install
npm run dev -- --port 3000
```

Otvoriť:
- `http://localhost:3000/soc-stat`

## Deploy standalone appky na Vercel
- importni nový priečinok/repo ako nový Vercel projekt
- build command nechaj default (`next build`)
- root directory bude root standalone projektu (nie `apps/nevedelE`)
