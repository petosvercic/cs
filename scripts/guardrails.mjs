#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const adminRoot = path.join(repoRoot, 'apps', 'admin');

const bannedRouteSegmentRe = /\/(builder|publish|editions|deploy)(?:\/|$)/;
const apiKeywords = ['editions', 'publish', 'builder', 'factory'];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function asPosixRelative(fullPath) {
  return path.relative(repoRoot, fullPath).split(path.sep).join('/');
}

function hasBannedSegment(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return bannedRouteSegmentRe.test(normalized);
}

function isBannedApiPath(relativePath) {
  if (!relativePath.includes('/app/api/')) return false;
  return apiKeywords.some((keyword) => relativePath.includes(`/app/api/${keyword}`) || relativePath.includes(`/${keyword}/`));
}

const files = await walk(adminRoot);
const violations = files
  .map(asPosixRelative)
  .filter((relativePath) => hasBannedSegment(relativePath) || isBannedApiPath(relativePath));

if (violations.length > 0) {
  console.error('Guardrails FAILED: forbidden admin footprints detected:');
  for (const violation of violations.sort()) {
    console.error(` - ${violation}`);
  }
  process.exit(1);
}

console.log('Guardrails OK: no forbidden admin footprints detected.');
