import { z } from "zod";
const LocaleSchema = z.enum(["sk", "cz", "en"]);
export const EngineInputSchema = z
    .object({
    subject: z.string().min(1),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "birthDate must be YYYY-MM-DD"),
    name: z.string().min(1).optional(),
    locale: LocaleSchema.optional(),
})
    .strict();
export const EngineResultSchema = z
    .object({
    subject: z.string().min(1),
    score: z.number().int().min(0).max(100),
    verdict: z.string().min(1),
    facts: z.array(z.string()),
    meta: z
        .object({
        engineVersion: z.string().min(1),
        computedAt: z.string().datetime(),
    })
        .strict(),
})
    .strict();
//# sourceMappingURL=engine.js.map