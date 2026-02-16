New-Item -ItemType Directory -Force .\apps\admin\app\api\health | Out-Null
@'
import { NextResponse } from "next/server";

export function GET() {
  const hasAdminToken = Boolean(process.env.ADMIN_TOKEN);
  const hasBaseUrl = Boolean(process.env.NEVEDEL_BASE_URL);
  return NextResponse.json({ ok: true, hasAdminToken, hasBaseUrl });
}
'@ | Set-Content -Encoding utf8 .\apps\admin\app\api\health\route.ts
