import { NextResponse } from "next/server";
import { loadEditionBySlug } from "../../../../lib/editions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackground(edition: any) {
  const theme = edition?.pack?.theme ?? {};
  return {
    backgroundImageUrl: typeof theme.backgroundImageUrl === "string" && theme.backgroundImageUrl.trim() ? theme.backgroundImageUrl : "/brand/bg.png",
    backgroundOverlay: theme.backgroundOverlay === "none" || theme.backgroundOverlay === "strong" ? theme.backgroundOverlay : "soft",
  };
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const slug = String(u.searchParams.get("slug") ?? "").trim();
  if (!slug) return NextResponse.json({ ok: false, error: "MISSING_SLUG" }, { status: 400 });

  const edition = loadEditionBySlug(slug);
  if (!edition) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    edition,
    resolvedBackground: resolveBackground(edition),
    stripeConfigured: Boolean((process.env.STRIPE_SECRET_KEY || "").trim()),
  });
}
