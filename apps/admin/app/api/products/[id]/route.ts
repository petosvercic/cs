import { NextResponse } from "next/server";
import { getProductDetail } from "@/lib/repo-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const detail = await getProductDetail(id);

  if (!detail) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
