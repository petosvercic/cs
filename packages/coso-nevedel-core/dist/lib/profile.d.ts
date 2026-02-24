import type { RNG } from "./seed";
export type Profile = {
    intensity: number;
    openness: number;
    control: number;
    chaos: number;
    nameWeight: number;
};
export declare function buildProfile(rng: RNG, name: string, dobISO: string): Profile;
