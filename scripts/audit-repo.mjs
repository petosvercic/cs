#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist']);
const IGNORE_FILE_RE = /\.bak_.*/;

async function walk(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...(await walk(fullPath)));
        continue;
      }

      if (IGNORE_FILE_RE.test(entry.name)) continue;
      files.push(fullPath);
    }

    return files;
  } catch {
    return [];
  }
}

const toRel = (p) => path.relative(repoRoot, p).split(path.sep).join('/');
const isRouteTs = (relPath) => relPath.endsWith('/route.ts');
const publishLikeRe = /(factory|dispatch|publish|deploy|builder|editions|packs|stripe)/i;
const templateForbiddenRe = /(publish|deploy|factory|dispatch|builder|editions)/i;

const allFiles = [
  ...(await walk(path.join(repoRoot, 'apps'))),
  ...(await walk(path.join(repoRoot, 'packages'))),
];

const routeFiles = allFiles.map(toRel).filter(isRouteTs).sort();

const byPrefix = (prefix) => routeFiles.filter((p) => p.startsWith(prefix));
const adminRoutes = byPrefix('apps/admin/');
const nevedelERoutes = byPrefix('apps/nevedelE/');
const testNevedelWebRoutes = byPrefix('apps/test-nevedel-web/');
const templateAppRoutes = byPrefix('packages/coso-template/app/');
const templateRootRoutes = byPrefix('packages/coso-template/template-root/');

const known = new Set([
  ...adminRoutes,
  ...nevedelERoutes,
  ...testNevedelWebRoutes,
  ...templateAppRoutes,
  ...templateRootRoutes,
]);
const otherRoutes = routeFiles.filter((p) => !known.has(p));

const publishLikeEndpoints = routeFiles.filter((p) => publishLikeRe.test(p)).sort();
const templateForbidden = routeFiles
  .filter((p) => p.startsWith('packages/coso-template/template-root/'))
  .filter((p) => templateForbiddenRe.test(p))
  .sort();

const today = new Date().toISOString().slice(0, 10);
const outPath = path.join(repoRoot, 'docs', `audit-${today}.md`);
const list = (items) => (items.length === 0 ? '- _none_' : items.map((item) => `- \`${item}\``).join('\n'));

const body = `# Repo audit (${today})\n\n## route.ts inventory\n\n### apps/admin\n${list(adminRoutes)}\n\n### apps/nevedelE\n${list(nevedelERoutes)}\n\n### apps/test-nevedel-web\n${list(testNevedelWebRoutes)}\n\n### packages/coso-template/app\n${list(templateAppRoutes)}\n\n### packages/coso-template/template-root\n${list(templateRootRoutes)}\n\n### other\n${list(otherRoutes)}\n\n## Publish-like endpoints\n${list(publishLikeEndpoints)}\n\n## Template forbidden footprints\n${list(templateForbidden)}\n`;

await fs.writeFile(outPath, body, 'utf8');
console.log(`Audit written: ${toRel(outPath)}`);
