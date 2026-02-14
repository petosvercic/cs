import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyGoldCookie } from "../../../../lib/gold-token";

export async function GET() {
  const store = await cookies();
  const token = store.get("GOLD")?.value;
  const hasGold = verifyGoldCookie(token);
  return NextResponse.json({ hasGold });
}
