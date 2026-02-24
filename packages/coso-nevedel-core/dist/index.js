import { buildFactBlocks } from "./lib/factLogic";
export function generateFacts(input) {
    const name = input.name?.trim() || input.subject;
    const rid = input.subject;
    const birthDate = input.birthDate;
    const birthTime = new Date(birthDate).getTime();
    const nowTime = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const daysAlive = Number.isFinite(birthTime) && birthTime > 0
        ? Math.max(1, Math.floor((nowTime - birthTime) / msInDay))
        : 1;
    return buildFactBlocks({
        name,
        dobISO: birthDate,
        rid,
        daysAlive,
        isPaid: input.isPaid,
    });
}
