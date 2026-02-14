export type EngineInput = {
  subject: string;
  locale?: "sk" | "cz" | "en" | string;

  // optional (template currently collects these; engine may ignore)
  name?: string;
  birthDate?: string;
};

export type EngineResult = {
  score: number;
  verdict: string;
  facts: unknown;

  // engine code mentions subject in output
  subject?: string;
  meta?: {
    engineVersion: string;
    computedAt: string;
  };
};
