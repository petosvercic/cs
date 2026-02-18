import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";

type RouteContext = { params: Promise<{ id: string; slug: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  const { id, slug } = await params;
  const product = getProduct(id);

  if (!product) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  const upstream = await fetch(`${product.baseUrl}/api/editions/${encodeURIComponent(slug)}`, { cache: "no-store" }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ ok: false, error: "upstream-unreachable" }, { status: 502 });
  }

  const text = await upstream.text();

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed, { status: upstream.status });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-upstream-json" }, { status: 502 });
  }
}
