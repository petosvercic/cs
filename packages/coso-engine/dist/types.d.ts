export type EngineInput = {
    subject: string;
    locale?: "sk" | "cz" | "en" | string;
    name?: string;
    birthDate?: string;
};
export type EngineResult = {
    score: number;
    verdict: string;
    facts: unknown;
    subject?: string;
    meta?: {
        engineVersion: string;
        computedAt: string;
    };
};
