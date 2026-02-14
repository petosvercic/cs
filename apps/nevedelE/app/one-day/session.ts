export type DayType = "LIGHT" | "NEUTRAL" | "HEAVY";
export type SpectrumType = "A" | "B";

export type SessionConfig = {
  dayType: DayType;
  spectrumType: SpectrumType;
  impulseIndex: number;
};

function dateSeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

function safeModulo(value: number, mod: number): number {
  return ((value % mod) + mod) % mod;
}

export function selectDayType(date: Date): DayType {
  const seed = dateSeed(date);
  const value = safeModulo(seed, 10);

  if (value === 0) return "HEAVY";
  if (value <= 3) return "LIGHT";
  return "NEUTRAL";
}

export function selectSpectrumType(date: Date): SpectrumType {
  const seed = dateSeed(date);
  return safeModulo(seed, 2) === 0 ? "A" : "B";
}

export function selectImpulseIndex(date: Date, poolSize: number): number {
  if (poolSize <= 0) return 0;
  return safeModulo(dateSeed(date), poolSize);
}

export function getSessionConfig(date = new Date(), impulsePoolSize = 5): SessionConfig {
  try {
    return {
      dayType: selectDayType(date),
      spectrumType: selectSpectrumType(date),
      impulseIndex: selectImpulseIndex(date, impulsePoolSize),
    };
  } catch {
    return {
      dayType: "NEUTRAL",
      spectrumType: "A",
      impulseIndex: 0,
    };
  }
}
