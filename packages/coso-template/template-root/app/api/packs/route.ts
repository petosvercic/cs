import { NextResponse } from "next/server";

import { getActivePackId } from "@/app/data/activePack";
import { getAvailablePackIds } from "@/app/data/availablePacks";

export async function GET() {
  return NextResponse.json(
    {
      activePackId: getActivePackId(),
      availablePackIds: getAvailablePackIds(),
    },
    { status: 200 }
  );
}
