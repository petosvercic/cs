import { NextResponse } from "next/server";
import { listEditionsForProduct } from "@/lib/repo-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = (url.searchParams.get("product") ?? "nevedelE").trim() || "nevedelE";

  const editions = await listEditionsForProduct(product);
  return NextResponse.json(editions);
}
