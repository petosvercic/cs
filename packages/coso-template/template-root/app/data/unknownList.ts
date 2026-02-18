import { getActivePackId } from "./activePack";
import { unknownItems as defaultUnknownItems } from "./packs/default/unknownList";
import { unknownItems as demoUnknownItems } from "./packs/demo/unknownList";

const unknownItemsByPack = {
  default: defaultUnknownItems,
  demo: demoUnknownItems,
} as const;

const activePackId = getActivePackId();

export const unknownItems = unknownItemsByPack[activePackId as keyof typeof unknownItemsByPack] ?? defaultUnknownItems;
