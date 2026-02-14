import type { DayType, SpectrumType } from "./session";
import type { MeaningState, MeaningZone } from "./meaning-states";

export type JsonMeaningState = {
  id: string;
  title: string;
  body: string[];
  spectra: SpectrumType[];
  zones: MeaningZone[];
};

export type JsonContentPack = {
  impulses: Record<DayType, string[]>;
  meaningStates: JsonMeaningState[];
};

export type OneDayContentPack = {
  impulses: Record<DayType, string[]>;
  spectrum: Record<SpectrumType, { leftLabel: string; rightLabel: string; ariaLabel: string }>;
  meaningStates: MeaningState[];
};
