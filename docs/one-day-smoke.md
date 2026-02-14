# One Day MVP smoke checks

Design note: this flow is intentionally quiet and neutral. No CTA reinforcement, no gamification, no retention cues.

## Environment
- App route: `/one-day`
- Build: `npm run build:nevedelE`
- Manual run: `npm run dev -w apps/nevedelE`

## Scenarios and results

| Scenario | Steps | Expected | Result |
|---|---|---|---|
| 1) Immediate Exit | Open `/one-day`, close tab immediately | No error, no follow-up, no persistence | PASS |
| 2) Partial Flow Exit | Open `/one-day` → enter spectrum → close without release | Clean exit, no reminder/prompt/saved progress | PASS |
| 3) Complete Flow | IMPULSE → SPECTRUM → RESULT → SILENCE, wait, then close | SILENCE static, no CTA, clean terminal exit | PASS |
| 4) Inactivity | Open `/one-day` and wait 60 seconds without input | No auto-progress and no prompts | PASS |
| 5) Rapid Interaction | Drag and release slider quickly/repeatedly | Single result shown, no flicker loop | PASS |
| 6) Reopen Same Day | Complete flow, close, reopen `/one-day` | Starts fresh from IMPULSE, no prior-session reference | PASS |
| 7) Accessibility Check | Verify screen reader labels and slider keyboard operation | Slider labeled `Spektrum Ľahké až Ťažké`, no hidden CTA text | PASS |

## Notes
- No persistence layer is used.
- CLOSED remains terminal and does not trigger follow-up logic.
