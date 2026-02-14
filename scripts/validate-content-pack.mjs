import fs from 'node:fs';
import path from 'node:path';

const MAX_COPY_WORDS = 20;
const RESULT_TITLE_MAX_WORDS = 2;
const RESULT_TEXT_MAX_CHARS = 72;
const FORBIDDEN_CTA_PHRASES = ["pokračuj", "klikni", "ťukni", "ďalej", "skús", "mal by si", "urob", "sprav"];
const FORBIDDEN_FUTURE_BINDING = ["zajtra", "nabudúce", "každý deň", "denne", "vráť sa"];

function countWords(copy) {
  return copy.trim().split(/\s+/).filter(Boolean).length;
}

function validateCopy(copy) {
  const text = copy.trim();
  const normalized = ` ${text.toLowerCase()} `;
  const errors = [];

  if (countWords(text) > MAX_COPY_WORDS) errors.push(`exceeds MAX_COPY_WORDS (${MAX_COPY_WORDS})`);
  if (text.includes('?')) errors.push('contains question mark');
  if (text.includes('!')) errors.push('contains exclamation mark');
  if (FORBIDDEN_CTA_PHRASES.some((phrase) => normalized.includes(phrase))) errors.push('contains CTA language');
  if (FORBIDDEN_FUTURE_BINDING.some((phrase) => normalized.includes(phrase))) errors.push('contains future-binding language');
  if (normalized.includes(' ty si') || normalized.includes(' si tak') || normalized.includes(' si vždy') || normalized.includes(' tvoj typ')) {
    errors.push('contains identity language');
  }

  return errors;
}

function validateShape(pack) {
  const errs = [];
  const dayTypes = ['LIGHT', 'NEUTRAL', 'HEAVY'];
  const zones = ['LOW', 'MID', 'HIGH'];
  const spectra = ['A', 'B'];

  if (!pack || typeof pack !== 'object') errs.push('pack is not an object');
  if (!pack?.impulses || typeof pack.impulses !== 'object') errs.push('missing impulses object');
  dayTypes.forEach((d) => {
    if (!Array.isArray(pack?.impulses?.[d])) errs.push(`impulses.${d} must be an array`);
  });

  if (!Array.isArray(pack?.meaningStates)) errs.push('meaningStates must be an array');

  for (const state of pack?.meaningStates ?? []) {
    if (!state.id) errs.push('meaningState missing id');
    if (typeof state.title !== 'string') errs.push(`${state.id || 'state'}.title must be string`);
    if (!Array.isArray(state.body)) errs.push(`${state.id || 'state'}.body must be string[]`);
    if (!Array.isArray(state.spectra) || !state.spectra.every((x) => spectra.includes(x))) errs.push(`${state.id || 'state'}.spectra invalid`);
    if (!Array.isArray(state.zones) || !state.zones.every((x) => zones.includes(x))) errs.push(`${state.id || 'state'}.zones invalid`);
  }

  return errs;
}

function validatePack(pack) {
  const errors = validateShape(pack);

  ['LIGHT', 'NEUTRAL', 'HEAVY'].forEach((d) => {
    (pack?.impulses?.[d] ?? []).forEach((line, i) => {
      validateCopy(line).forEach((e) => errors.push(`impulses.${d}[${i}]: ${e}`));
    });
  });

  (pack?.meaningStates ?? []).forEach((state) => {
    validateCopy(state.title).forEach((e) => errors.push(`${state.id}.title: ${e}`));
    const bodyText = (state.body ?? []).join(' ');
    validateCopy(bodyText).forEach((e) => errors.push(`${state.id}.body: ${e}`));

    if (countWords(state.title ?? '') > RESULT_TITLE_MAX_WORDS) {
      errors.push(`${state.id}.title exceeds ${RESULT_TITLE_MAX_WORDS} words`);
    }

    if ((state.body ?? []).join('\n').length > RESULT_TEXT_MAX_CHARS) {
      errors.push(`${state.id}.body exceeds ${RESULT_TEXT_MAX_CHARS} chars`);
    }
  });

  return errors;
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: npm run validate:content -- <path/to/pack.json>');
  process.exit(1);
}

const full = path.resolve(process.cwd(), target);
const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
const errors = validatePack(raw);

if (errors.length) {
  console.error('[content-pack] invalid');
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}

console.log('[content-pack] valid');
