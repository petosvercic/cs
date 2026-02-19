"use client";
import { useMemo, useState } from "react";
import { normalizeEditionJsonForBuilder, validateEditionJson } from "../../../apps/nevedelE/lib/edition-json";
import type { EditionIndexEntry } from "./types";

function buildPrompt(existingSlugs: string[]) {
  const deployed = existingSlugs.map((s) => `- ${s}`).join("\n");

  // Canonical production prompt (matches current validator/model).
  // Generates tasks as 5 categories with pool of task objects (id/title/metricKey/variants).
  const base = [
    "ROLE: Si generator edicii pre COSO Factory (Next.js app).",
    "",
    "VYSTUP:",
    "- Vrat presne 1 JSON objekt (ziadny markdown, ziadne komentare, ziadny dalsi text).",
    "- Musi to byt strict JSON (dvojite uvodzovky, ziadne trailing commas).",
    "",
    "CIEĽ:",
    "- Vymysli novu koherentnu ediciu (tema, nazov, texty, tasky).",
    "- Musi to byt prakticke, bezpecne, pouzitelne ako denny sebareflexny nastroj.",
    "",
    "KONTEXT PRODUKTU:",
    "- Edicia je stranka na /e/<slug>.",
    "- Pouzivatel moze zadat meno a birthDate (YYYY-MM-DD) ako volitelne vstupy.",
    "- Full vysledok je za paywallom; bez platby je len teaser.",
    "",
    "HARD REQUIREMENTS:",
    "1) slug: lowercase-hyphen, 3-64 znakov, musi byt unikatny a NESMIE byt v zozname uz nasadenych slugov nizsie.",
    "2) engine.locale = \"sk\"",
    "3) engine.subject: snake_case, 3-40 znakov, tematicky suvisiace s ediciou.",
    "4) content: vypln vsetky polia realnym textom (ziadne \"...\").",
    "5) tasks:",
    "- pickPerCategory musi byt 3",
    "- categories musi byt presne 5 poloziek",
    "- kazda kategoria musi mat pool presne 30 task objektov",
    "- kazdy task objekt musi mat: id, title, metricKey, variants",
    "- variants musi byt presne 3 prvky v tomto tvare:",
    "  (1) { when: { lte: 33 }, text: \"...\" }",
    "  (2) { when: { between: [34,66] }, text: \"...\" }",
    "  (3) { when: { gte: 67 }, text: \"...\" }",
    "",
    "AKO TO NAVRHNUT, ABY TO DAVALO ZMYSEL:",
    "- Zvol jednu jasnu temu (napr. fokus, hranice, komunikacia, regeneracia, rozhodovanie).",
    "- Navrhni 5 kategorii, ktore spolu tvoria model (napr. Fokus, Energia, Hranice, Komunikacia, Obnova).",
    "- Pre kazdu kategoriu vytvor 30 mikro-uloch (konkretne, vykonatelne, bezpecne).",
    "- Pre kazdu ulohu napis 3 varianty textu podla skore:",
    "  lte (nizke skore): jemny start, minimal effort.",
    "  between (stred): udrziavaci krok, male zlepsenie.",
    "  gte (vysoke): narocnejsi/preciznejsi krok bez tlaku.",
    "- metricKey rob konzistentne: m_catX_tYY (napr. m_cat3_t14).",
    "",
    "BEZPECNOST:",
    "- Bez medicinskych diagnoz, bez terapeutickych tvrdeni, bez nelegalnych navodov.",
    "",
    "JSON SCHEMA (MUSI SEDIT S KLUCAMI):",
    "{",
    "  \"slug\": \"...\",",
    "  \"title\": \"...\",",
    "  \"engine\": { \"subject\": \"...\", \"locale\": \"sk\" },",
    "  \"content\": {",
    "    \"heroTitle\": \"...\",",
    "    \"heroSubtitle\": \"...\",",
    "    \"intro\": { \"title\": \"...\", \"text\": \"...\" },",
    "    \"form\": {",
    "      \"title\": \"...\",",
    "      \"nameLabel\": \"Meno (volitelne)\",",
    "      \"birthDateLabel\": \"Datum narodenia (volitelne)\",",
    "      \"submitLabel\": \"Vyhodnotit\"",
    "    },",
    "    \"result\": {",
    "      \"teaserTitle\": \"...\",",
    "      \"teaserNote\": \"...\",",
    "      \"unlockHint\": \"...\"",
    "    },",
    "    \"paywall\": {",
    "      \"headline\": \"...\",",
    "      \"bullets\": [\"...\", \"...\", \"...\"],",
    "      \"cta\": \"Pokracovat na platbu\"",
    "    }",
    "  },",
    "  \"tasks\": {",
    "    \"pickPerCategory\": 3,",
    "    \"categories\": [",
    "      {",
    "        \"key\": \"cat-1\",",
    "        \"title\": \"...\",",
    "        \"pool\": [",
    "          {",
    "            \"id\": \"t1-01\",",
    "            \"title\": \"...\",",
    "            \"metricKey\": \"m_cat1_t01\",",
    "            \"variants\": [",
    "              { \"when\": { \"lte\": 33 }, \"text\": \"...\" },",
    "              { \"when\": { \"between\": [34, 66] }, \"text\": \"...\" },",
    "              { \"when\": { \"gte\": 67 }, \"text\": \"...\" }",
    "            ]",
    "          }",
    "        ]",
    "      },",
    "      { \"key\": \"cat-2\", \"title\": \"...\", \"pool\": [ /* 30 task objects */ ] },",
    "      { \"key\": \"cat-3\", \"title\": \"...\", \"pool\": [ /* 30 task objects */ ] },",
    "      { \"key\": \"cat-4\", \"title\": \"...\", \"pool\": [ /* 30 task objects */ ] },",
    "      { \"key\": \"cat-5\", \"title\": \"...\", \"pool\": [ /* 30 task objects */ ] }",
    "    ]",
    "  }",
    "}",
    "",
    "FINAL SELF-CHECK (sprav potichu pred vystupom):",
    "- slug je unikatny vs deployed list?",
    "- categories ma presne 5?",
    "- pickPerCategory je 3?",
    "- kazda kategoria ma pool presne 30?",
    "- kazdy task ma variants presne 3 s lte/between/gte?",
    "- ziaden placeholder \"...\" vo finalnom JSON?",
    "",
    "Already deployed editions (MUST AVOID):",
    deployed || "- (none)"
  ].join("\n");

  return base;
}

export default function BuilderClient({ editions }: { editions: EditionIndexEntry[] }) {
  const [existingSlugs, setExistingSlugs] = useState<string[]>(editions.map((e) => e.slug));
  const basePrompt = useMemo(() => buildPrompt(existingSlugs), [existingSlugs]);
  const [prompt, setPrompt] = useState(basePrompt);
  const [editionJson, setEditionJson] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; msg: string }>({ kind: "idle", msg: "" });

  async function onCopyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus({ kind: "ok", msg: "Prompt copied." });
    } catch {
      setStatus({ kind: "err", msg: "Copy failed." });
    }
  }

  async function onRefreshSlugs() {
    setStatus({ kind: "idle", msg: "Starting factory workflow..." });
    try {
      const res = await fetch("/api/editions/slugs", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !Array.isArray(data?.slugs)) {
        setStatus({ kind: "err", msg: `Refresh failed: ${data?.error ?? res.status}`.trim() });
        return;
      }

      const slugs = data.slugs.map((x: any) => String(x)).filter(Boolean);
      setExistingSlugs(slugs);
      setPrompt(buildPrompt(slugs));
      setStatus({ kind: "ok", msg: `Refresh OK. Slugs loaded: ${slugs.length}` });
    } catch {
      setStatus({ kind: "err", msg: "Refresh failed." });
    }
  }

  async function onDispatch() {
    const v = validateEditionJson(editionJson, existingSlugs);
    if (!v.ok) {
      const dbg = (v as any)?.debug ?? {};
      const keys = Array.isArray(dbg.foundRootKeys) ? dbg.foundRootKeys : [];
      const norm = String(dbg.normalizedStart ?? "").replace(/\s+/g, " ").trim();
      setStatus({
        kind: "err",
        msg: `Neplatny JSON: ${v.error}${v.details ? ` (${v.details})` : ""}; root keys: ${keys.join(", ") || "(none)"}; normalized head: ${norm}`,
      });
      return;
    }

    setStatus({ kind: "idle", msg: "Starting factory workflow..." });

    const res = await fetch("/api/factory/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ edition: v.obj, rawEditionJson: editionJson }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setStatus({ kind: "err", msg: `Dispatch zlyhal: ${data?.error ?? res.status} ${data?.message ?? ""}`.trim() });
      return;
    }

    const okMsg =
      typeof data?.message === "string" && data.message.trim()
        ? data.message.trim()
        : `OK. Edition saved to repo. slug=${String(data?.slug ?? "").trim()}`;

    setStatus({ kind: "ok", msg: okMsg });
    setEditionJson("");
  }

  return (
    <main
      className="min-h-screen px-4 py-10 text-neutral-100"
      style={{
        backgroundImage: "url(/brand/bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto w-full max-w-4xl translate-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-xl backdrop-blur">
        <div className="mb-6 flex justify-center">
          <img src="/brand/logo.png" alt="Brand" style={{ height: 120, width: "auto" }} />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Factory Builder</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-200/80">Prompt and list of editions (slugs) are used as input context.</p>

        <section className="mt-8 space-y-2">
          <h2 className="text-xl font-semibold">1) Prompt pre LLM</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={18}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-sm leading-6 outline-none focus:border-neutral-500"
          />
          <div className="mt-2 flex flex-wrap gap-3">
            <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={onCopyPrompt}>
              Copy prompt
            </button>
            <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={onRefreshSlugs}>
              Refresh
            </button>
            <button className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950" onClick={() => setPrompt(basePrompt)}>
              Reset prompt
            </button>
            <a href="/list" className="rounded-lg border border-neutral-200/40 bg-neutral-950/30 px-3 py-2 text-sm text-neutral-100">
              View deployed editions
            </a>
          </div>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-xl font-semibold">2) Paste LLM JSON and build the edition</h2>
          <textarea
            value={editionJson}
            onChange={(e) => setEditionJson(e.target.value)}
            rows={12}
            placeholder='You can paste plain JSON, a `json ... ` block, or text that contains a JSON object.'
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-sm leading-6 outline-none focus:border-neutral-500"
          />
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950"
              onClick={() => {
                const v = validateEditionJson(editionJson, existingSlugs);
                setStatus(v.ok ? { kind: "ok", msg: "JSON looks valid." } : { kind: "err", msg: `Invalid JSON: ${v.error}` });
              }}
            >
              Validate
            </button>
            <button className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950" onClick={onDispatch}>
              Dispatch build
            </button>
            <button
              className="rounded-lg border border-neutral-200/40 bg-neutral-950/30 px-3 py-2 text-sm text-neutral-100"
              onClick={() => {
                const n = normalizeEditionJsonForBuilder(editionJson);
                setEditionJson(n);
                setStatus({ kind: "ok", msg: `JSON normalized (${n.length} chars). Missing title/slug/content were auto-filled.` });
              }}
            >
              Normalize JSON
            </button>
          </div>

          {status.msg && (
            <p
              className={`mt-3 rounded-xl border p-3 text-sm ${
                status.kind === "err"
                  ? "border-red-500 text-red-200"
                  : status.kind === "ok"
                    ? "border-green-500 text-green-200"
                    : "border-neutral-200/40 text-neutral-100"
              } bg-neutral-950/40`}
            >
              <strong>{status.kind === "err" ? "Error" : status.kind === "ok" ? "OK" : "Info"}:</strong> {status.msg}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
