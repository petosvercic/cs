export type FactSectionKey = "mind" | "body" | "social" | "time" | "name" | "meta" | "weird";
export type FactTitle = {
    id: string;
    title: string;
};
export declare const factTitles: Record<FactSectionKey, readonly FactTitle[]>;
