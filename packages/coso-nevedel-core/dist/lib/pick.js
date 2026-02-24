export function pickOne(rng, arr) {
    if (!arr.length)
        throw new Error("pickOne: empty array");
    return arr[Math.floor(rng() * arr.length)];
}
export function pickManyUnique(rng, arr, count) {
    if (count <= 0)
        return [];
    if (arr.length === 0)
        return [];
    // ak chceš viac než je v poli, vráť všetko (bez duplicít)
    if (count >= arr.length)
        return [...arr];
    const copy = [...arr];
    const out = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(rng() * copy.length);
        out.push(copy[idx]);
        copy.splice(idx, 1);
    }
    return out;
}
/**
 * Zjemnená náhoda: priemer z 3 uniformných hodnôt => viac výsledkov okolo stredu.
 * Hodí sa na percentá a "uveriteľné" čísla.
 */
export function randomNormalish(rng) {
    return (rng() + rng() + rng()) / 3;
}
export function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
/**
 * Vráti celé číslo v rozsahu <min, max> (inclusive) s jemným biasom ku stredu.
 */
export function intBetween(rng, min, max) {
    if (max < min)
        [min, max] = [max, min];
    const t = randomNormalish(rng);
    return Math.round(min + t * (max - min));
}
/**
 * Formát "12 345" (medzera ako tisícový oddeľovač)
 */
export function formatInt(n) {
    const sign = n < 0 ? "-" : "";
    const s = Math.abs(Math.trunc(n)).toString();
    return sign + s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
/**
 * (Voliteľné) shuffle, keby si neskôr chcel miešať sekcie
 */
export function shuffle(rng, arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
