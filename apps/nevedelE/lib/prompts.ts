export type PromptId = "edition_generator" | "build_fix";

export const PROMPTS: Record<PromptId, { title: string; body: string }> = {
  edition_generator: {
    title: "Edition generator (JSON only)",
    body: [
      "ROLE: Si generator edícií pre COSO Factory.",
      "",
      "VÝSTUP:",
      "- Vráť presne 1 JSON objekt (bez markdown, bez komentárov).",
      "- Ak vstup vyzerá ako build log / error / technický výpis, NEGENERUJ edíciu.",
      '  Namiesto toho vráť JSON: {"error":"input_not_edition","hint":"Switch prompt mode to build_fix"}',
      "",
      "INPUT:",
      "{{INPUT}}",
    ].join("\n"),
  },

  build_fix: {
    title: "Build-fix engineer",
    body: [
      "ROLE: senior build+monorepo engineer",
      "TASK: diagnose and propose minimal code diffs (no feature changes)",
      "",
      "OUTPUT FORMAT:",
      "1) Root cause",
      "2) Exact file edits (path + full code blocks)",
      "3) Commands to apply via terminal (PowerShell)",
      "",
      "RULES:",
      "- DO NOT generate edition JSON.",
      "",
      "LOG:",
      "{{INPUT}}",
    ].join("\n"),
  },
};
