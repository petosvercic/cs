import { z } from "zod";
export type EngineInput = {
    subject: string;
    birthDate: string;
    name?: string;
    locale?: "sk" | "cz" | "en";
};
export type EngineResult = {
    subject: string;
    score: number;
    verdict: string;
    facts: string[];
    meta: {
        engineVersion: string;
        computedAt: string;
    };
};
export declare const EngineInputSchema: z.ZodObject<{
    subject: z.ZodString;
    birthDate: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodEnum<{
        sk: "sk";
        cz: "cz";
        en: "en";
    }>>;
}, z.core.$strict>;
export declare const EngineResultSchema: z.ZodObject<{
    subject: z.ZodString;
    score: z.ZodNumber;
    verdict: z.ZodString;
    facts: z.ZodArray<z.ZodString>;
    meta: z.ZodObject<{
        engineVersion: z.ZodString;
        computedAt: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>;
//# sourceMappingURL=engine.d.ts.map