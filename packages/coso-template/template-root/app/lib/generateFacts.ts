import { createHash } from "node:crypto";

import { buildFactBlocks } from "./factLogic";

type GenerateFactsInput = {
  name?: string;
  birthDate: string;
  subject?: string;
  isPaid?: boolean;
};

function getDaysAlive(birthDate: string): number {
  const now = new Date();
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const ms = now.getTime() - birth.getTime();
  return Math.max(1, Math.floor(ms / 86_400_000));
}

function getResultId(name: string, birthDate: string, subject: string): string {
  return createHash("sha256")
    .update(`${name}|${birthDate}|${subject}`)
    .digest("hex")
    .slice(0, 24);
}

export function generateFacts(input: GenerateFactsInput) {
  const cleanName = (input.name ?? "Neznámy").trim() || "Neznámy";
  const subject = input.subject ?? "default_subject";
  const resultId = getResultId(cleanName, input.birthDate, subject);
  const daysAlive = getDaysAlive(input.birthDate);

  const blocks = buildFactBlocks({
    name: cleanName,
    dobISO: input.birthDate,
    rid: resultId,
    daysAlive,
    isPaid: Boolean(input.isPaid),
  });

  return {
    resultId,
    subject,
    name: cleanName,
    birthDate: input.birthDate,
    daysAlive,
    blocks,
  };
}
