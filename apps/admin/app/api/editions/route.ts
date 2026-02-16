import { NextResponse } from "next/server";
import { listEditionsForProduct } from "@/lib/repo-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = (url.searchParams.get("product") ?? "nevedelE").trim();

  try {
    const editions = await listEditionsForProduct(product);

    return NextResponse.json({
      ok: true,
      product,
      editions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
