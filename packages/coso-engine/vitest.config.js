import { defineConfig } from "vitest/config";
export default defineConfig({
    // FIX: zabráni Vitestu/Vite načítavať PostCSS config z parentu (C:\Users\Slipo\postcss.config.cjs)
    // a tým pádom to nebude vyžadovať tailwindcss.
    css: {
        postcss: {
            plugins: []
        }
    },
    test: {
        environment: "node",
        include: ["test/**/*.test.ts"]
    }
});
//# sourceMappingURL=vitest.config.js.map