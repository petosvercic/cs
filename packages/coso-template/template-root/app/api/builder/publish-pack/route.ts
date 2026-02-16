import { NextResponse } from "next/server";

import { writePackToRepo } from "@/app/lib/packs/writePack";

type PublishPackBody = {
  packId?: unknown;
  setActive?: unknown;
  content?: {
    unknownList?: unknown;
    notes?: unknown;
    paywallCopy?: unknown;
  };
};

export async function POST(req: Request) {
  const expectedToken = process.env.BUILDER_TOKEN;
  const token = req.headers.get("x-builder-token");

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as PublishPackBody | null;
  const packId = typeof body?.packId === "string" ? body.packId : "";
  const setActive = body?.setActive === true;

  if (!packId) {
    return NextResponse.json({ ok: false, error: "invalid-pack-id" }, { status: 400 });
  }

  try {
    const result = await writePackToRepo(packId, body?.content ?? {}, { setActive });
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "invalid-pack-id") {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    if (message.startsWith("github-publish-failed")) {
      return NextResponse.json({ ok: false, code: "github-publish-failed", message }, { status: 500 });
    }

    const status = message === "git-not-available" ? 503 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
