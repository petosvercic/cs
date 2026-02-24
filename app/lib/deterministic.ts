export const hashToInt = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const pickDeterministic = <T>(arr: T[], key: string): T => {
  if (arr.length === 0) throw new Error("Cannot pick from empty array");
  const idx = hashToInt(key) % arr.length;
  return arr[idx];
};
