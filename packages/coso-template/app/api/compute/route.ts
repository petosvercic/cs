import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EngineInputSchema, EngineResultSchema } from "coso-contract";
import { compute } from "coso-engine";

type ProductConfig = {
  productSlug: string;
  editionSlug: string;
  locale: string;
  title: string;
};

async function readProductConfig(): Promise<ProductConfig> {
  const here = path.dirname(fileURLToPath(import.meta.url)); // .../app/api/compute
  const projectRoot = path.resolve(here, "..", "..", "..", ".."); // .../coso-template

  const candidates = [
    path.join(projectRoot, "product.config.json"),
    path.join(projectRoot, "template-root", "product.config.json")
  ];

  let lastErr: unknown = null;

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      return JSON.parse(raw) as ProductConfig;
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(`product.config.json not found. Last error: ${String(lastErr)}`);
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function POST(req: Request) {
  try {
    const cfg = await readProductConfig();
    const raw = await req.json().catch(() => null);

    const mapped =
      raw && typeof raw === "object"
        ? {
            subject: (raw as any).name,
            locale: cfg.locale ?? "sk",
            name: (raw as any).name,
            birthDate: (raw as any).birthDate
          }
        : raw;

    const parsedIn = EngineInputSchema.safeParse(mapped);

    if (!parsedIn.success) {
      return json(400, {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid request body",
          issues: parsedIn.error.issues
        }
      });
    }

    const result = await compute(parsedIn.data as any);

    const parsedOut = EngineResultSchema.safeParse(result);
    if (!parsedOut.success) {
      return json(500, {
        error: {
          code: "INVALID_OUTPUT",
          message: "Engine returned invalid output",
          issues: parsedOut.error.issues
        }
      });
    }

    return json(200, parsedOut.data);
  } catch (err: any) {
    return json(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: String(err?.message ?? err)
      }
    });
  }
}
