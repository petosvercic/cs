import { ReactNode } from "react";

type ScreenShellProps = {
  headerSlot?: ReactNode;
  bodySlot: ReactNode;
  footerSlot?: ReactNode;
  tone?: "quiet" | "neutral";
  isSilence?: boolean;
};

export function ScreenShell({ headerSlot, bodySlot, footerSlot, tone = "quiet", isSilence = false }: ScreenShellProps) {
  if (process.env.NODE_ENV !== "production" && isSilence && footerSlot) {
    throw new Error("[one-day] SILENCE invariant failed: footerSlot must be empty.");
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <section
          className={`min-h-[78vh] rounded-2xl border px-6 py-10 shadow-sm md:px-10 md:py-14 ${
            tone === "quiet" ? "border-neutral-300 bg-white text-neutral-900" : "border-neutral-300 bg-neutral-50 text-neutral-900"
          }`}
        >
          <div className="mx-auto flex min-h-[64vh] w-full max-w-lg flex-col justify-center gap-8">
            {headerSlot}
            {bodySlot}
            {footerSlot}
          </div>
        </section>
      </div>
    </main>
  );
}

type TitleBlockProps = {
  children: ReactNode;
};

export function TitleBlock({ children }: TitleBlockProps) {
  return <h1 className="text-3xl font-semibold lowercase">{children}</h1>;
}

type SentenceBlockProps = {
  children: ReactNode;
  align?: "left" | "center";
};

export function SentenceBlock({ children, align = "center" }: SentenceBlockProps) {
  return <p className={`whitespace-pre-line text-lg leading-relaxed ${align === "center" ? "text-center" : "text-left"}`}>{children}</p>;
}

type SpectrumSliderProps = {
  leftLabel: string;
  rightLabel: string;
  ariaLabel: string;
  onCommit: (value: number) => void;
  initialValue?: number;
};

export function SpectrumSlider({ leftLabel, rightLabel, ariaLabel, onCommit, initialValue = 50 }: SpectrumSliderProps) {
  return (
    <div className="space-y-8">
      <label htmlFor="one-day-spectrum" className="sr-only">
        {ariaLabel}
      </label>
      <input
        id="one-day-spectrum"
        type="range"
        min={0}
        max={100}
        defaultValue={initialValue}
        aria-label={ariaLabel}
        onPointerUp={(event) => onCommit(Number((event.currentTarget as HTMLInputElement).value))}
        className="slider h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
      />
      <div className="flex items-center justify-between text-base">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
