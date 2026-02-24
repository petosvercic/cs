// app/lib/seed.ts
export function hashStringToInt(str) {
    // jednoduchý, rýchly 32-bit hash (FNV-ish)
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
export function mulberry32(seed) {
    let a = seed >>> 0;
    return function rand() {
        a += 0x6D2B79F5;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function makeRng(seedStr) {
    return mulberry32(hashStringToInt(seedStr));
}
