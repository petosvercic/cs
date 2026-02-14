#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const outDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(repoRoot, '..', 'soc-stat-standalone');

const socStatSource = path.join(repoRoot, 'apps', 'nevedelE', 'app', 'soc-stat', 'page.tsx');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function write(p, content) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, 'utf8');
}

async function main() {
  const socStatPage = await fs.readFile(socStatSource, 'utf8');
  await ensureDir(outDir);

  await write(
    path.join(outDir, 'package.json'),
    JSON.stringify(
      {
        name: 'soc-stat-standalone',
        private: true,
        version: '0.1.0',
        scripts: { dev: 'next dev --webpack', build: 'next build', start: 'next start' },
        dependencies: { next: '16.1.6', react: '19.0.0', 'react-dom': '19.0.0' },
        devDependencies: {
          typescript: '^5.5.4',
          '@types/node': '^20.12.12',
          '@types/react': '^19.0.10',
          '@types/react-dom': '^19.1.9',
        },
        engines: { node: '>=20' },
      },
      null,
      2,
    ) + '\n',
  );

  await write(
    path.join(outDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: false,
          noEmit: true,
          incremental: true,
          module: 'esnext',
          esModuleInterop: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'react-jsx',
          plugins: [{ name: 'next' }],
        },
        include: ['next-env.d.ts', '.next/types/**/*.ts', '**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      },
      null,
      2,
    ) + '\n',
  );

  await write(path.join(outDir, 'next.config.js'), '/** @type {import("next").NextConfig} */\nmodule.exports = {};\n');
  await write(path.join(outDir, '.gitignore'), '.next\nnode_modules\n.env\n.env.local\n');
  await write(path.join(outDir, 'next-env.d.ts'), '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n\n// NOTE: This file should not be edited\n');

  await write(path.join(outDir, 'app', 'globals.css'), 'html, body {\n  margin: 0;\n  padding: 0;\n}\n');

  await write(
    path.join(outDir, 'app', 'layout.tsx'),
    'import type { Metadata } from "next";\n'
      + 'import "./globals.css";\n\n'
      + 'export const metadata: Metadata = {\n'
      + '  title: "soc.stat",\n'
      + '  description: "Standalone soc.stat MVP",\n'
      + '};\n\n'
      + 'export default function RootLayout({ children }: { children: React.ReactNode }) {\n'
      + '  return (\n'
      + '    <html lang="sk">\n'
      + '      <body style={{ fontFamily: "Inter, system-ui, Arial, sans-serif", background: "#0a0a0a", color: "#f5f5f5" }}>\n'
      + '        {children}\n'
      + '      </body>\n'
      + '    </html>\n'
      + '  );\n'
      + '}\n',
  );

  await write(
    path.join(outDir, 'app', 'page.tsx'),
    'export default function Home() {\n'
      + '  return (\n'
      + '    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>\n'
      + '      <a href="/soc-stat" style={{ color: "#111", background: "#a7f3d0", padding: "10px 14px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>\n'
      + '        Otvoriť soc.stat\n'
      + '      </a>\n'
      + '    </main>\n'
      + '  );\n'
      + '}\n',
  );

  await write(path.join(outDir, 'app', 'soc-stat', 'page.tsx'), socStatPage);

  await write(
    path.join(outDir, 'README.md'),
    '# soc-stat-standalone\n\n'
      + 'Vygenerované zo `coso-system/apps/nevedelE/app/soc-stat/page.tsx`.\n\n'
      + '## Run\n\n'
      + '```bash\n'
      + 'npm install\n'
      + 'npm run dev -- --port 3000\n'
      + '```\n\n'
      + 'Otvor: http://localhost:3000/soc-stat\n',
  );

  console.log(`✅ Standalone project created at: ${outDir}`);
}

main().catch((err) => {
  console.error('❌ Failed to create standalone project:', err);
  process.exit(1);
});
