import type { RNG } from "./seed";
import type { Profile } from "./profile";
export type FakeFact = {
    kind: "range";
    label: string;
    value: string;
    note?: string;
} | {
    kind: "count";
    label: string;
    value: string;
    note?: string;
} | {
    kind: "percent";
    label: string;
    value: string;
    note?: string;
};
export declare function generateNameFacts(rng: RNG, profile: Profile, name: string, dobISO: string): FakeFact[];
export declare function generateLifeFacts(rng: RNG, profile: Profile, daysAlive: number): FakeFact[];
