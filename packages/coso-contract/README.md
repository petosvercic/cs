# coso-contract

Single source of truth pre dátový kontrakt medzi:

Engine ↔ Factory ↔ Web Template

---

## Obsah

- TS typy:
  - EngineInput
  - EngineResult

- Runtime validácia (Zod):
  - EngineInputSchema
  - EngineResultSchema

- Referenčné „golden“ príklady:
  - examples/engine-input.nevedel.json
  - examples/engine-result.nevedel.json

- Testy:
  - overujú, že referenčné JSON prejdú cez Zod schémy

---

## Zámerne neobsahuje

- implementáciu engine
- Next.js
- Stripe alebo platby
- čítanie configov
- produktové / marketingové texty

Tento balík **iba definuje kontrakt**.  
Všetka logika je mimo neho.

---

## Použitie

```ts
import {
  EngineInputSchema,
  EngineResultSchema,
  type EngineInput,
  type EngineResult
} from "coso-contract";
