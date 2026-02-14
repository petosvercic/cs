import { NextResponse } from "next/server";
import { analogies } from "./analogies";
import { notes } from "./notes";
import { unknownItems } from "./unknownList";
import { unknownItems as blurredItems } from "./blurredFacts";
import { paywallCopy } from "./paywallCopy";
import famousBirthdays from "./famousBirthdays.json";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      analogies,
      notes,
      unknownItems,
      blurredItems,
      paywallCopy,
      famousBirthdays,
    },
    { status: 200 }
  );
}
