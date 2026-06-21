# Go Code Quality Gate

Self-contained quality gate for Go. Download **this folder** to use it on a Go project — it has everything.

## Files
- `CORE.md` — **always load this.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables.
- `REFERENCE.md` — the full document. Open a specific section only when a check trips or that topic is in scope.
- `gate.yml` — machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse deterministically.
- `configs/` — runnable lint/format/coverage/complexity configs plus a CI workflow that **enforce** the gate. Copy into your repo and adjust versions/paths.

## How an LLM (or engineer) uses it
1. **Plan** — read `CORE.md`; classify the change by risk tier (low/medium/high/critical); list which MUST items and extra tests apply, and note anything intentionally excluded and why.
2. **Implement** — follow MUST NOT. When the change touches a topic (async, serialization, persistence, security, public API), open that section of `REFERENCE.md`.
3. **Review / score** — run the commands from `gate.yml` / `configs/`, read the tool output, apply the score caps, write `PHASE-RESULT.md` with evidence, report 0-100.

Front-load `CORE.md`; lazy-load `REFERENCE.md`. Let tools enforce what they can see; reserve judgment for architecture, audit, and business correctness.
