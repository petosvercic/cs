export const ALLOWED_EVENT_NAMES = [
  "session_started",
  "impulse_shown",
  "spectrum_shown",
  "spectrum_committed",
  "result_shown",
  "silence_entered",
  "session_closed",
] as const;

export type TelemetryEventName = (typeof ALLOWED_EVENT_NAMES)[number];

export type TelemetryEvent = {
  name: TelemetryEventName;
  ts: string;
  session_id: string;
  build_version?: string;
  platform?: "web" | "ios" | "android";
};

function isEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_TELEMETRY_ENABLED ?? "false").toLowerCase() === "true";
}

function sanitizeEvent(event: TelemetryEvent): TelemetryEvent {
  const base: TelemetryEvent = {
    name: event.name,
    ts: event.ts,
    session_id: event.session_id,
  };

  if (event.build_version) base.build_version = event.build_version;
  if (event.platform) base.platform = event.platform;
  return base;
}

export function buildTelemetryEvent(name: TelemetryEventName, sessionId: string): TelemetryEvent {
  return sanitizeEvent({
    name,
    ts: new Date().toISOString(),
    session_id: sessionId,
    build_version: process.env.NEXT_PUBLIC_BUILD_VERSION,
    platform: "web",
  });
}

export function createTelemetrySession() {
  const sessionId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const enabled = isEnabled();

  const emit = async (name: TelemetryEventName) => {
    if (!enabled) return;
    const payload = buildTelemetryEvent(name, sessionId);

    if (process.env.NODE_ENV !== "production") {
      console.info("[telemetry]", payload);
      return;
    }

    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // intentionally quiet
    }
  };

  return { sessionId, emit, enabled };
}
