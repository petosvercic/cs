// app/lib/factLogic.ts
import { makeRng } from "./seed";
import { buildProfile } from "./profile";
import { clamp, intBetween, pickManyUnique, randomNormalish, formatInt } from "./pick";
import { factTitles } from "../data/factTitles";
const SECTION_HEADINGS = {
    mind: "Hlava",
    body: "Telo",
    social: "Ľudia",
    time: "Čas",
    name: "Meno",
    meta: "Vzorce",
    weird: "Divné veci",
};
const NOTES_GENERIC = [
    "Odhad, nie rozsudok.",
    "Nie je to presné. Ale vie to trafiť smer.",
    "Nie je dôležité číslo. Dôležité je, že sa to opakuje.",
    "Znie to náhodne, kým si to nezačneš všímať.",
    "Nie je to výčitka. Je to stopa.",
];
function note(rng) {
    return NOTES_GENERIC[Math.floor(rng() * NOTES_GENERIC.length)];
}
function chooseCoreSections() {
    // Viditeľné pred platbou
    return ["social", "time", "name", "body"];
}
function chooseExtraSections(rng, profile) {
    // Pribudnú až po platbe
    const pool = ["mind", "meta", "weird"];
    const wantsWeird = profile.chaos + profile.intensity > 1.05;
    const wantsMeta = profile.control > 0.52 || profile.intensity > 0.6;
    const biased = [];
    if (wantsWeird)
        biased.push("weird");
    if (wantsMeta)
        biased.push("meta");
    biased.push("mind"); // vždy aspoň jedna “hlava”
    // vyber 2 z (biased + pool) deterministicky, bez duplicít
    const unique = [...new Set([...biased, ...pool])];
    return pickManyUnique(rng, unique, 2);
}
function pickTitlesForSection(rng, section, count) {
    const pool = factTitles[section];
    return pickManyUnique(rng, pool, count);
}
function decideKind(rng, section, profile) {
    const t = rng();
    if (section === "time")
        return t < 0.45 ? "percent" : t < 0.75 ? "count" : "range";
    if (section === "social")
        return t < 0.55 ? "count" : "range";
    if (section === "mind")
        return t < 0.60 ? "percent" : "count";
    if (section === "body")
        return t < 0.50 ? "count" : "percent";
    if (section === "name")
        return t < 0.40 ? "range" : "count";
    if (section === "meta")
        return t < 0.55 ? "count" : "percent";
    if (section === "weird")
        return t < 0.70 ? "count" : "range";
    return profile.intensity > 0.6 ? "percent" : "count";
}
function makePercent(rng, profile, section) {
    let base = 40 + 30 * randomNormalish(rng);
    base += (profile.control - 0.5) * 12;
    base += (profile.chaos - 0.5) * 10;
    if (section === "mind")
        base += 6 * (profile.intensity - 0.5);
    if (section === "body")
        base -= 4 * (profile.openness - 0.5);
    if (section === "meta")
        base += 3;
    if (section === "time")
        base += (rng() - 0.5) * 8;
    const p = Math.round(clamp(base, 18, 88));
    return `${p} %`;
}
function makeCount(rng, profile, section, daysAlive) {
    const lifeScale = clamp(daysAlive / 10_000, 0.6, 2.4);
    let min = 20;
    let max = 400;
    if (section === "social") {
        min = 40;
        max = 900;
    }
    if (section === "time") {
        min = 20;
        max = 420;
    }
    if (section === "mind") {
        min = 60;
        max = 1400;
    }
    if (section === "body") {
        min = 30;
        max = 800;
    }
    if (section === "name") {
        min = 2000;
        max = 220_000;
    }
    if (section === "meta") {
        min = 30;
        max = 650;
    }
    if (section === "weird") {
        min = 8;
        max = 220;
    }
    const widen = 1 + (profile.chaos * 0.9) + (profile.intensity * 0.6);
    const low = Math.round(min * lifeScale);
    const high = Math.round(max * lifeScale * widen);
    const n = intBetween(rng, low, high);
    if (section === "name") {
        const capped = clamp(n, 2500, 480_000);
        return `${formatInt(capped)}+`;
    }
    return formatInt(clamp(n, 1, 999_999));
}
function makeRange(rng, profile, section, daysAlive) {
    const midStr = makeCount(rng, profile, section, daysAlive);
    const mid = Number(midStr.replace(/\D/g, "")) || 120;
    const factorLow = clamp(0.55 + 0.25 * randomNormalish(rng), 0.35, 0.85);
    const factorHigh = clamp(2.2 + 1.4 * randomNormalish(rng) + profile.chaos * 0.6, 1.8, 4.8);
    const low = Math.max(1, Math.round(mid * factorLow));
    const high = Math.max(low + 2, Math.round(mid * factorHigh));
    return `${formatInt(low)}–${formatInt(high)}`;
}
function makeValue(rng, profile, section, kind, daysAlive) {
    if (kind === "percent")
        return makePercent(rng, profile, section);
    if (kind === "count")
        return makeCount(rng, profile, section, daysAlive);
    return makeRange(rng, profile, section, daysAlive);
}
function buildBlocksForSections(args) {
    const { rng, profile, daysAlive, sections, usedTitleIds, rowsMin, rowsMax } = args;
    const blocks = [];
    for (const section of sections) {
        const want = intBetween(rng, rowsMin, rowsMax);
        const pool = factTitles[section];
        const picked = [];
        for (const t of pickTitlesForSection(rng, section, want)) {
            if (!usedTitleIds.has(t.id))
                picked.push(t);
            if (picked.length >= want)
                break;
        }
        while (picked.length < want && picked.length < pool.length) {
            const candidate = pool[Math.floor(rng() * pool.length)];
            if (!usedTitleIds.has(candidate.id))
                picked.push(candidate);
        }
        const rows = picked.map((t) => {
            usedTitleIds.add(t.id);
            const kind = decideKind(rng, section, profile);
            const value = makeValue(rng, profile, section, kind, daysAlive);
            return {
                id: t.id,
                title: t.title,
                kind,
                value,
                note: note(rng),
                section,
            };
        });
        blocks.push({
            section,
            heading: SECTION_HEADINGS[section],
            rows,
        });
    }
    return blocks;
}
export function buildFactBlocks(input) {
    const seedStr = `${input.name}|${input.dobISO}|${input.rid}|facts`;
    const rng = makeRng(seedStr);
    const profile = buildProfile(rng, input.name, input.dobISO);
    const usedTitleIds = new Set();
    const core = chooseCoreSections();
    const extra = chooseExtraSections(rng, profile);
    const coreMin = input.rowsCore?.min ?? 5;
    const coreMax = input.rowsCore?.max ?? 7;
    const extraMin = input.rowsExtra?.min ?? 4;
    const extraMax = input.rowsExtra?.max ?? 6;
    const coreBlocks = buildBlocksForSections({
        rng,
        profile,
        daysAlive: input.daysAlive,
        sections: core,
        usedTitleIds,
        rowsMin: coreMin,
        rowsMax: coreMax,
    });
    if (!input.isPaid)
        return coreBlocks;
    const extraBlocks = buildBlocksForSections({
        rng,
        profile,
        daysAlive: input.daysAlive,
        sections: extra,
        usedTitleIds,
        rowsMin: extraMin,
        rowsMax: extraMax,
    });
    return [...coreBlocks, ...extraBlocks];
}
