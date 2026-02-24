import { modulesBySlug, type ModuleOptionLabel, type ModuleSlug } from "./modules";

type Level = "low" | "medium" | "high";

const toLevel = (value: number): Level => {
  if (value <= 2) return "low";
  if (value <= 4) return "medium";
  return "high";
};

export function scoreModuleAnswers(slug: ModuleSlug, answers: Record<number, ModuleOptionLabel>) {
  const selectedModule = modulesBySlug[slug];
  const raw: Record<string, number> = Object.fromEntries(selectedModule.subscores.map((key) => [key, 0]));

  for (const question of selectedModule.questions) {
    const selected = answers[question.id];
    const option = question.options.find((item) => item.label === selected);
    if (!option) continue;

    raw[option.scoring.primary.key] += option.scoring.primary.points;
    if (option.scoring.secondary) {
      raw[option.scoring.secondary.key] += option.scoring.secondary.points;
    }
  }

  const level: Record<string, Level> = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, toLevel(value)]),
  );

  return { raw, level };
}
