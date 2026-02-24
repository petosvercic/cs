import type { RNG } from "./seed";
export declare function pickOne<T>(rng: RNG, arr: readonly T[]): T;
export declare function pickManyUnique<T>(rng: RNG, arr: readonly T[], count: number): T[];
/**
 * Zjemnená náhoda: priemer z 3 uniformných hodnôt => viac výsledkov okolo stredu.
 * Hodí sa na percentá a "uveriteľné" čísla.
 */
export declare function randomNormalish(rng: RNG): number;
export declare function clamp(n: number, min: number, max: number): number;
/**
 * Vráti celé číslo v rozsahu <min, max> (inclusive) s jemným biasom ku stredu.
 */
export declare function intBetween(rng: RNG, min: number, max: number): number;
/**
 * Formát "12 345" (medzera ako tisícový oddeľovač)
 */
export declare function formatInt(n: number): string;
/**
 * (Voliteľné) shuffle, keby si neskôr chcel miešať sekcie
 */
export declare function shuffle<T>(rng: RNG, arr: readonly T[]): T[];
