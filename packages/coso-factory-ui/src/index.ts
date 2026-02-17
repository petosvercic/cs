import { createElement } from "react";
import BuilderUI from "./builder-ui";
import type { EditionIndexEntry } from "../../../apps/nevedelE/lib/editions-store";

export default BuilderUI;

export function FactoryBuilder({ editions }: { editions: EditionIndexEntry[] }) {
  return createElement(BuilderUI, { editions });
}
