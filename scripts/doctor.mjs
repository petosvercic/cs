#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const postbuild = args.has("--postbuild");
const fixBom = args.has("--fix-bom");

const ROOT = process.cwd();

const LOCKFILES = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"];
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const JSON_EXT = new Set([".json"]);
const IGNORED_DIRS = new Set(["node_modules",".git",".next","dist",".turbo","out","coverage"]);

let failed = false;
const ok = (m)=>console.log(`OK   ${m}`);
const warn = (m)=>console.warn(`WARN ${m}`);
const fail = (m)=>{ failed=true; console.error(`FAIL ${m}`); };

function exists(p){ try{ fs.accessSync(p); return true; } catch { return false; } }
function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }

function walk(dir, out=[]){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if (IGNORED_DIRS.has(e.name)) continue;
    const p = path.join(dir,e.name);
    if (e.isDirectory()) walk(p,out); else out.push(p);
  }
  return out;
}

function detectRootLockfile(){
  const present = LOCKFILES.filter(f=>exists(path.join(ROOT,f)));
  if (present.length===0){ fail(`Missing root lockfile. Add exactly one of: ${LOCKFILES.join(", ")}`); return null; }
  if (present.length>1){ fail(`Multiple root lockfiles: ${present.join(", ")}. Keep only one.`); return null; }
  ok(`Root lockfile: ${present[0]}`);
  return present[0];
}

function checkNoNestedLockfiles(rootLockfile){
  const files = walk(ROOT);
  const rootLockPath = path.join(ROOT, rootLockfile);
  for (const f of files){
    const base = path.basename(f);
    if (!LOCKFILES.includes(base)) continue;
    if (path.resolve(f)===path.resolve(rootLockPath)) continue;
    fail(`Nested lockfile found: ${path.relative(ROOT,f)} (must not exist)`);
  }
  if (!failed) ok("No nested lockfiles");
}

function checkRootPackageJson(){
  const p = path.join(ROOT,"package.json");
  if (!exists(p)){ fail("Missing root package.json"); return; }
  const pkg = readJson(p);
  if (pkg.private!==true) fail('Root package.json must have `"private": true`');
  if (!Array.isArray(pkg.workspaces) || pkg.workspaces.length===0) fail('Root package.json must have `"workspaces": [...]`');
  else if (!pkg.workspaces.some(w=>w==="packages/*"||w==="packages/**"||w.startsWith("apps/"))) {
    fail('Root workspaces must include at least "packages/*"');
  }
  ok("Root package.json OK");
}

function checkJsonBom(files){
  const jsonFiles = files.filter(f=>JSON_EXT.has(path.extname(f)));
  let bomCount=0;
  for (const f of jsonFiles){
    const buf = fs.readFileSync(f);
    const hasBom = buf.length>=3 && buf[0]===0xef && buf[1]===0xbb && buf[2]===0xbf;
    if (!hasBom) continue;
    bomCount++;
    const rel = path.relative(ROOT,f);
    if (!fixBom){ fail(`JSON BOM found: ${rel} (run: node scripts/doctor.mjs --fix-bom)`); continue; }
    fs.writeFileSync(f, Buffer.from(buf.slice(3)));
    console.log(`FIX  BOM removed: ${rel}`);
  }
  if (bomCount===0) ok("No JSON BOM");
}

function scanBannedRelativeImports(files){
  const codeFiles = files.filter(f=>CODE_EXT.has(path.extname(f)));
  const banned = /(['"])(\.\.(?:\/|\\).*)(?:\/|\\)packages(?:\/|\\)([^'"]+)\1/g;
  for (const f of codeFiles){
    const content = fs.readFileSync(f,"utf8");
    let m;
    while ((m=banned.exec(content))!==null){
      fail(`BANNED relative import into packages/* in ${path.relative(ROOT,f)}: "${m[2]}/packages/${m[3]}"`);
    }
  }
  if (!failed) ok("No banned relative imports into packages/*");
}

function scanNextExternalDir(files){
  const nextCfg = files.filter(f => /next\.config\.(js|cjs|mjs|ts)$/i.test(path.basename(f)));
  for (const f of nextCfg){
    const txt = fs.readFileSync(f,"utf8");
    if (txt.includes("externalDir")) {
      fail(`Next externalDir hack found: ${path.relative(ROOT,f)} (remove experimental.externalDir)`);
    }
  }
  if (!failed) ok("No Next externalDir hacks");
}

function checkPackagePublishReady(pkgDir,pkgName){
  const pjPath = path.join(ROOT,pkgDir,"package.json");
  if (!exists(pjPath)){ fail(`Missing ${pkgDir}/package.json`); return; }
  const pj = readJson(pjPath);
  if (pj.name!==pkgName) fail(`${pkgDir}: name="${pj.name}" expected="${pkgName}"`);
  if (!pj.types) fail(`${pkgDir}: missing "types"`);
  if (!pj.files || !Array.isArray(pj.files) || !pj.files.includes("dist")) fail(`${pkgDir}: must have "files": ["dist"]`);
  if (!pj.exports && !pj.main) fail(`${pkgDir}: must have at least "exports" or "main"`);
  if (pj.scripts?.prepare) fail(`${pkgDir}: DO NOT use scripts.prepare`);
  if (!pj.scripts?.build) fail(`${pkgDir}: missing scripts.build`);
  ok(`${pkgDir}: publish-ready baseline OK`);

  if (postbuild){
    const distJs = path.join(ROOT,pkgDir,"dist","index.js");
    const distDts = path.join(ROOT,pkgDir,"dist","index.d.ts");
    if (!exists(distJs)) fail(`${pkgDir}: missing dist/index.js`);
    if (!exists(distDts)) fail(`${pkgDir}: missing dist/index.d.ts`);

    // IMPORTANT FIX: use --json so we get a real file list (no stderr parsing, no "npm notice" issues)
    try{
      const raw = execFileSync("npm",["pack","--dry-run","--json"],{cwd:path.join(ROOT,pkgDir),encoding:"utf8"});
      const arr = JSON.parse(raw);
      const entry = Array.isArray(arr) ? arr[0] : arr;
      const files = (entry?.files || []).map(f => (typeof f === "string" ? f : (f.path || f.file || "")));
      for (const want of ["dist/index.js","dist/index.d.ts"]) {
        if (!files.includes(want)) fail(`${pkgDir}: npm pack --dry-run --json missing ${want}`);
      }
      if (!failed) ok(`${pkgDir}: npm pack --dry-run --json OK`);
    } catch(e){
      fail(`${pkgDir}: npm pack --dry-run --json failed (${String(e.message || e)})`);
    }
  }
}

function main(){
  const rootLock = detectRootLockfile();
  checkRootPackageJson();
  const files = walk(ROOT);
  if (rootLock) checkNoNestedLockfiles(rootLock);
  checkJsonBom(files);
  scanBannedRelativeImports(files);
  scanNextExternalDir(files);
  checkPackagePublishReady("packages/coso-contract","coso-contract");
  checkPackagePublishReady("packages/coso-engine","coso-engine");
  if (failed){ console.error("\nDoctor: FAILED"); process.exit(1); }
  console.log("\nDoctor: OK");
}
main();