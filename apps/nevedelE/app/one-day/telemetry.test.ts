import { describe, expect, it, vi } from "vitest";
import { ALLOWED_EVENT_NAMES, buildTelemetryEvent } from "./telemetry";

describe("telemetry payload", () => {
  it("contains no extra fields", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T12:00:00.000Z"));

    const payload = buildTelemetryEvent("session_started", "session-123");
    const allowed = ["name", "ts", "session_id", "build_version", "platform"];

    expect(Object.keys(payload).every((key) => allowed.includes(key))).toBe(true);
    expect(payload).toMatchObject({
      name: "session_started",
      ts: "2026-02-10T12:00:00.000Z",
      session_id: "session-123",
      platform: "web",
    });

    vi.useRealTimers();
  });

  it("event names are limited to approved set", () => {
    expect(ALLOWED_EVENT_NAMES).toEqual([
      "session_started",
      "impulse_shown",
      "spectrum_shown",
      "spectrum_committed",
      "result_shown",
      "silence_entered",
      "session_closed",
    ]);
  });
});
