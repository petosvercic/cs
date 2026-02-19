import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import BuilderUi from "./ui";
import { listEditions } from "../../lib/editions-store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await cookies();
  const ok = c.get("factory")?.value === "1";
  if (!ok) redirect("/factory-login");

  const editions = listEditions();
  return <BuilderUi editions={editions} />;
}
