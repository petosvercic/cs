export declare function hashStringToInt(str: string): number;
export declare function mulberry32(seed: number): () => number;
export type RNG = () => number;
export declare function makeRng(seedStr: string): RNG;
