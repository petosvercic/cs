# coso-factory (KROK C)

## CLI

Build:
- `npm run build`

Run:
- `node dist/cli.js init --product nevedel --edition nevedel --locale sk --title "coso-nevedel"`

Defaults:
- `--out apps`
- template: `packages/coso-factory/template`

## Contract (KROK C)

Output:
- `apps/<productSlug>/`
  - `product.config.json`
  - `package.json`
  - `app/layout.tsx`
  - `app/page.tsx`
  - `public/...`

Rules:
- if `apps/<productSlug>` exists => non-zero exit, no overwrite
