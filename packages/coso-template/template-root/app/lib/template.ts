export function fillTemplate(text: string, vars: Record<string, string | number | null | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    if (v === null || v === undefined) return "";
    return String(v);
  });
}
