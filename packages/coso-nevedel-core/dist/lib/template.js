export function fillTemplate(text, vars) {
    return text.replace(/\{(\w+)\}/g, (_, key) => {
        const v = vars[key];
        if (v === null || v === undefined)
            return "";
        return String(v);
    });
}
