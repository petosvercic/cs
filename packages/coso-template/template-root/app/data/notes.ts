import { getActivePackId } from "./activePack";
import { notes as defaultNotes } from "./packs/default/notes";
import { notes as demoNotes } from "./packs/demo/notes";

const notesByPack = {
  default: defaultNotes,
  demo: demoNotes,
} as const;

const activePackId = getActivePackId();

export const notes = notesByPack[activePackId as keyof typeof notesByPack] ?? defaultNotes;
