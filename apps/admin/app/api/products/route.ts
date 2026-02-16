import { NextResponse } from "next/server";
import { listProducts } from "@/lib/repo-data";

export async function GET() {
  try {
    const products = await listProducts();

    return NextResponse.json({
      ok: true,
      products,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
