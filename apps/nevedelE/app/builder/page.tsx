import BuilderUi from "./ui";
import { listEditions } from "../../lib/editions-store";

export const dynamic = "force-dynamic";

export default function Page() {
  const editions = listEditions();
  return <BuilderUi editions={editions} />;
}
