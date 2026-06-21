# Ruby Code Quality Gate

Self-contained quality gate for Ruby. Download **this folder** to use it on a Ruby project — it has everything.

## Files
- `CORE.md` — **always load this.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables.
- `REFERENCE.md` — the full document. Open a specific section only when a check trips or that topic is in scope.
- `gate.yml` — machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse deterministically.
- `configs/` — RuboCop config (style + lint + security + complexity), SimpleCov setup, and a CI workflow that **enforce** the gate. Copy into your repo and adjust versions/paths.
- `AGENTS.md` — instructions that tell an agent to load CORE.md, parse gate.yml, plan by risk tier, and review by running the gate.

## How an LLM (or engineer) uses it
1. **Plan** — read `CORE.md`; classify the change by risk tier (low/medium/high/critical); list which MUST items and extra tests apply, and note anything intentionally excluded and why.
2. **Implement** — follow MUST NOT. When the change touches a topic (metaprogramming, concurrency, serialization, persistence, security), open that section of `REFERENCE.md`.
3. **Review / score** — run the commands from `gate.yml` / `configs/`, read the tool output, apply the score caps, write `PHASE-RESULT.md` with evidence, report 0-100.

Front-load `CORE.md`; lazy-load `REFERENCE.md`. Let tools enforce what they can see; reserve judgment for architecture, audit, and business correctness.
