import { createElement } from "react";

import BuilderUI from "./builder-ui";
import { listEditions } from "../../../apps/nevedelE/lib/editions-store";

export function FactoryBuilder() {
  const editions = listEditions();
  return createElement(BuilderUI, { editions });
}
