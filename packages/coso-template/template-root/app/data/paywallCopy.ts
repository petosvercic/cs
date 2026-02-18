import { getActivePackId } from "./activePack";
import { paywallCopy as defaultPaywallCopy } from "./packs/default/paywallCopy";
import { paywallCopy as demoPaywallCopy } from "./packs/demo/paywallCopy";

const paywallCopyByPack = {
  default: defaultPaywallCopy,
  demo: demoPaywallCopy,
} as const;

const activePackId = getActivePackId();

export const paywallCopy = paywallCopyByPack[activePackId as keyof typeof paywallCopyByPack] ?? defaultPaywallCopy;
