import { type FactSectionKey } from "../data/factTitles";
export type FactValueKind = "percent" | "count" | "range";
export type FactRow = {
    id: string;
    title: string;
    kind: FactValueKind;
    value: string;
    note?: string;
    section: FactSectionKey;
};
export type FactBlock = {
    section: FactSectionKey;
    heading: string;
    rows: FactRow[];
};
export declare function buildFactBlocks(input: {
    name: string;
    dobISO: string;
    rid: string;
    daysAlive: number;
    isPaid?: boolean;
    rowsCore?: {
        min: number;
        max: number;
    };
    rowsExtra?: {
        min: number;
        max: number;
    };
}): FactBlock[];
