"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getImpulseCopy, getValidatedContentPack } from "./copy.sk";
import { assertSilenceInvariants, hasInteractiveAffordances, transition, type FlowState } from "./flow.contract";
import { detectLanguage, createTranslator } from "./localization";
import { type MeaningZone, selectMeaningState, validateMeaningPool } from "./meaning-states";
import skin from "./skin.module.css";
import { getSessionConfig } from "./session";
import { createTelemetrySession } from "./telemetry";
import { ScreenShell, SentenceBlock, SpectrumSlider, TitleBlock } from "./ui";

function mapValueToZone(value: number): MeaningZone {
  if (value < 34) return "LOW";
  if (value < 67) return "MID";
  return "HIGH";
}

export default function OneDayPage() {
  const [status, setStatus] = useState<FlowState>("IMPULSE");
  const [zone, setZone] = useState<MeaningZone | null>(null);
  const [hasGold, setHasGold] = useState(false);
  const language = useMemo(() => detectLanguage(), []);
  const t = useMemo(() => createTranslator(language), [language]);
  const contentPack = useMemo(() => getValidatedContentPack(language, t), [language, t]);
  const session = useMemo(() => getSessionConfig(), []);
  const telemetry = useMemo(() => createTelemetrySession(), []);
  const spectrumLockedRef = useRef(false);
  const paymentsEnabled = (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED ?? "false").toLowerCase() === "true";

  const meaningValidation = useMemo(() => validateMeaningPool(contentPack.meaningStates), [contentPack.meaningStates]);
  if (!meaningValidation.ok && process.env.NODE_ENV !== "production") {
    throw new Error(`[one-day] Invalid meaning pool:\n${meaningValidation.errors.join("\n")}`);
  }

  const activeSpectrum = contentPack.spectrum[session.spectrumType];
  const impulse = getImpulseCopy(contentPack, session.dayType, session.impulseIndex);

  const transitionTo = (to: FlowState) => {
    setStatus((from) => transition(from, to));
  };

  const startGoldCheckout = async () => {
    if (!paymentsEnabled) return;
    const response = await fetch("/api/checkout/gold", { method: "POST" });
    if (!response.ok) return;
    const data = (await response.json()) as { url?: string };
    if (data.url) window.location.href = data.url;
  };

  useEffect(() => {
    telemetry.emit("session_started");
  }, [telemetry]);

  useEffect(() => {
    const loadGold = async () => {
      const response = await fetch("/api/gold/status", { method: "GET" });
      if (!response.ok) return;
      const data = (await response.json()) as { hasGold?: boolean };
      setHasGold(Boolean(data.hasGold));
    };

    loadGold();
  }, []);

  useEffect(() => {
    if (status === "IMPULSE") telemetry.emit("impulse_shown");
    if (status === "SPECTRUM") {
      spectrumLockedRef.current = false;
      telemetry.emit("spectrum_shown");
    }
    if (status === "RESULT") telemetry.emit("result_shown");
    if (status === "SILENCE") telemetry.emit("silence_entered");
  }, [status, telemetry]);

  useEffect(() => {
    if (status !== "RESULT") return;
    const timer = window.setTimeout(() => transitionTo("SILENCE"), 1200);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    assertSilenceInvariants(status, hasInteractiveAffordances(status), false);
  }, [status]);

  useEffect(() => {
    const closeSession = () => {
      transitionTo("CLOSED");
      telemetry.emit("session_closed");
      // Exit is success: no return logic, reminders, or confirmation prompts are ever triggered.
      // CLOSED is terminal by design.
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") closeSession();
    };

    window.addEventListener("pagehide", closeSession);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", closeSession);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [telemetry]);

  if (status === "CLOSED") return null;

  const result = zone !== null ? selectMeaningState(new Date(), session.spectrumType, zone, session.dayType, contentPack.meaningStates) : null;

  if (status === "IMPULSE") {
    return (
      <ScreenShell
        tone="quiet"
        bodySlot={
          <div
            role="button"
            tabIndex={0}
            aria-label={activeSpectrum.ariaLabel}
            onClick={() => transitionTo("SPECTRUM")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                transitionTo("SPECTRUM");
              }
            }}
            className={`w-full rounded-xl border border-transparent py-12 ${skin.tapSurface}`}
          >
            <SentenceBlock>{impulse}</SentenceBlock>
          </div>
        }
      />
    );
  }

  if (status === "SPECTRUM") {
    return (
      <ScreenShell
        tone="quiet"
        bodySlot={
          <div className={skin.shellBody}>
            <SpectrumSlider
              leftLabel={activeSpectrum.leftLabel}
              rightLabel={activeSpectrum.rightLabel}
              ariaLabel={activeSpectrum.ariaLabel}
              onCommit={(value) => {
                if (status !== "SPECTRUM" || spectrumLockedRef.current) return;
                spectrumLockedRef.current = true;
                setZone(mapValueToZone(value));
                telemetry.emit("spectrum_committed");
                transitionTo("RESULT");
              }}
            />
          </div>
        }
      />
    );
  }

  return (
    <ScreenShell
      tone="neutral"
      isSilence={status === "SILENCE"}
      bodySlot={
        result ? (
          <section className={`flex w-full flex-col text-center ${skin.resultBlock}`} aria-live="polite">
            <TitleBlock>{result.title}</TitleBlock>
            <div className="mt-5">
              <SentenceBlock>{result.body}</SentenceBlock>
            </div>
            {status === "RESULT" && hasGold ? (
              <div className="mt-3">
                <SentenceBlock>{t("gold.result.extra")}</SentenceBlock>
              </div>
            ) : null}
            {status === "RESULT" && paymentsEnabled ? (
              <button type="button" onClick={startGoldCheckout} className="mx-auto mt-6 text-sm text-neutral-500 underline">
                {t("gold.deepLink")}
              </button>
            ) : null}
            <div className="mx-auto mt-12 h-px w-24 bg-neutral-300" aria-hidden="true" />
            <div className="h-28" aria-hidden="true" />
          </section>
        ) : null
      }
    />
  );
}
