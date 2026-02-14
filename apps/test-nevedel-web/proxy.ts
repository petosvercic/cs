import { NextResponse } from "next/server";

export default function proxy(_request: Request) {
  return NextResponse.next();
}
