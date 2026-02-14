export type FlowState = "IMPULSE" | "SPECTRUM" | "RESULT" | "SILENCE" | "CLOSED";

const ALLOWED_TRANSITIONS: Record<FlowState, FlowState[]> = {
  IMPULSE: ["SPECTRUM"],
  SPECTRUM: ["RESULT"],
  RESULT: ["SILENCE"],
  SILENCE: ["CLOSED"],
  CLOSED: [], // CLOSED is terminal by design.
};

export function isAllowedTransition(from: FlowState, to: FlowState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transition(from: FlowState, to: FlowState): FlowState {
  if (isAllowedTransition(from, to)) return to;

  const message = `[one-day] Invalid transition: ${from} -> ${to}`;
  if (process.env.NODE_ENV !== "production") {
    throw new Error(message);
  }

  console.warn(message);
  return from;
}

export function hasInteractiveAffordances(state: FlowState): boolean {
  return state === "IMPULSE" || state === "SPECTRUM";
}

export function assertSilenceInvariants(state: FlowState, interactiveRendered: boolean, autoNavigationTriggered: boolean): void {
  if (process.env.NODE_ENV === "production") return;
  if (state !== "SILENCE") return;

  if (interactiveRendered) {
    throw new Error("[one-day] SILENCE invariant failed: interactive elements are rendered.");
  }

  if (autoNavigationTriggered) {
    throw new Error("[one-day] SILENCE invariant failed: auto-navigation was triggered.");
  }
}

export function nextStateAfterSpectrum(): FlowState {
  return transition("SPECTRUM", "RESULT");
}

export function nextStateAfterResult(): FlowState {
  return transition("RESULT", "SILENCE");
}
