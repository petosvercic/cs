#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();

async function walk(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walk(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  } catch {
    return [];
  }
}

const toRel = (p) => path.relative(repoRoot, p).split(path.sep).join('/');
const isRouteTs = (p) => p.endsWith('/route.ts');
const hasPublishFootprint = (p) => /(factory|dispatch|publish|builder|editions)/i.test(p);

const adminFiles = await walk(path.join(repoRoot, 'apps', 'admin'));
const nevedelEFiles = await walk(path.join(repoRoot, 'apps', 'nevedelE'));
const templateFiles = await walk(path.join(repoRoot, 'packages', 'coso-template', 'template-root'));

const adminRoutes = adminFiles.filter(isRouteTs).map(toRel).sort();
const nevedelERoutes = nevedelEFiles.filter(isRouteTs).map(toRel).sort();
const publishEndpoints = [...adminFiles, ...nevedelEFiles]
  .filter((file) => isRouteTs(file) && hasPublishFootprint(toRel(file)))
  .map(toRel)
  .sort();
const templateForbidden = templateFiles
  .map(toRel)
  .filter((file) => hasPublishFootprint(file))
  .sort();

const today = new Date().toISOString().slice(0, 10);
const outPath = path.join(repoRoot, 'docs', `audit-${today}.md`);

const list = (items) => (items.length === 0 ? '- _none_' : items.map((item) => `- \`${item}\``).join('\n'));

const body = `# Repo audit (${today})\n\n## route.ts inventory\n\n### apps/admin\n${list(adminRoutes)}\n\n### apps/nevedelE\n${list(nevedelERoutes)}\n\n## Publish endpoints (factory/dispatch/publish/builder/editions)\n${list(publishEndpoints)}\n\n## Template forbidden footprints (packages/coso-template/template-root)\n${list(templateForbidden)}\n`;

await fs.writeFile(outPath, body, 'utf8');
console.log(`Audit written: ${toRel(outPath)}`);
