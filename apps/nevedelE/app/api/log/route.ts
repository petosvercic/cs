import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type LogEvent = {
  name: string;
  ts: string;
  session_id: string;
  build_version?: string;
  platform?: "web" | "ios" | "android";
};

const LOG_FILE = path.join(process.cwd(), ".tmp", "one-day-events.jsonl");
const RETENTION_DAYS = 14;

function isTelemetryEnabled() {
  return (process.env.TELEMETRY_ENABLED ?? "false").toLowerCase() === "true";
}

function isValidPayload(body: unknown): body is LogEvent {
  if (!body || typeof body !== "object") return false;
  const keys = Object.keys(body as Record<string, unknown>);
  const allowed = ["name", "ts", "session_id", "build_version", "platform"];
  if (!keys.every((k) => allowed.includes(k))) return false;

  const e = body as Record<string, unknown>;
  return typeof e.name === "string" && typeof e.ts === "string" && typeof e.session_id === "string";
}

async function applyRetention(file: string): Promise<void> {
  try {
    const content = await fs.readFile(file, "utf8");
    const lines = content.split("\n").filter(Boolean);
    const threshold = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const kept = lines.filter((line) => {
      try {
        const parsed = JSON.parse(line) as LogEvent;
        return new Date(parsed.ts).getTime() >= threshold;
      } catch {
        return false;
      }
    });

    await fs.writeFile(file, `${kept.join("\n")}\n`, "utf8");
  } catch {
    // keep quiet
  }
}

export async function POST(req: Request) {
  if (!isTelemetryEnabled()) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!isValidPayload(body)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.appendFile(LOG_FILE, `${JSON.stringify(body)}\n`, "utf8");
  await applyRetention(LOG_FILE);

  return NextResponse.json({ ok: true });
}
