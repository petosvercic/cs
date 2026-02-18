import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;

  const product = getProduct(id);
  if (!product) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  const url = `${product.baseUrl}/api/editions/slugs`;

  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res) {
    return NextResponse.json(
      { ok: false, error: { status: "network", message: "Failed to connect." } },
      { status: 502 }
    );
  }

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: { status: res.status, message: text.slice(0, 220) } },
      { status: 502 }
    );
  }

  return new NextResponse(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
