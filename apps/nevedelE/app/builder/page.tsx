import BuilderClient from "./ui";
import { listEditions } from "../../lib/editions-store";

export default function BuilderPage() {
  const editions = listEditions();
  return <BuilderClient editions={editions} />;
}
