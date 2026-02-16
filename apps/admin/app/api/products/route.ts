import { NextResponse } from "next/server";
import { listProducts } from "@/lib/repo-data";

export async function GET() {
  const products = await listProducts();
  return NextResponse.json({ items: products });
}
