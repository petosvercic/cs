#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const adminRoot = path.join(repoRoot, 'apps', 'admin');
const templateRoot = path.join(repoRoot, 'packages', 'coso-template', 'template-root');

const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist']);
const IGNORE_FILE_RE = /\.bak_.*/;

const adminRouteRe = /\/app\/(builder|deploy|publish|editions)(?:\/|$)/;
const adminApiRe = /\/app\/api\/.*(factory|dispatch|publish|deploy|builder|editions|stripe)/;
const templateForbiddenRe = /(publish|deploy|factory|dispatch|builder|editions)/;

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

const adminFiles = (await walk(adminRoot)).map(toRel);
const templateFiles = (await walk(templateRoot)).map(toRel);

const adminViolations = adminFiles.filter((p) => adminRouteRe.test(p) || adminApiRe.test(p));
const templateViolations = templateFiles.filter((p) => templateForbiddenRe.test(p));

if (adminViolations.length > 0 || templateViolations.length > 0) {
  console.error('Guardrails FAILED: forbidden footprints detected.');

  if (adminViolations.length > 0) {
    console.error('apps/admin violations:');
    for (const violation of adminViolations.sort()) {
      console.error(` - ${violation}`);
    }
  }

  if (templateViolations.length > 0) {
    console.error('packages/coso-template/template-root violations:');
    for (const violation of templateViolations.sort()) {
      console.error(` - ${violation}`);
    }
  }

  process.exit(1);
}

console.log('Guardrails OK: no forbidden footprints detected.');
