# Crystal Code Quality Gate

Self-contained quality gate for Crystal. Download **this folder** to use it on a Crystal project — it has everything.

## Files
- `CORE.md` — **always load this.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables.
- `REFERENCE.md` — the full document. Open a specific section only when a check trips or that topic is in scope.
- `gate.yml` — machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse deterministically.
- `configs/` — `.ameba.yml` (linter + complexity), a `shard.yml` snippet (deps incl. Ameba), and a CI workflow that **enforce** the gate. Copy into your repo and adjust versions/paths.
- `AGENTS.md` — instructions that tell an agent to load CORE.md, parse gate.yml, plan by risk tier, and review by running the gate.

## How an LLM (or engineer) uses it
1. **Plan** — read `CORE.md`; classify the change by risk tier (low/medium/high/critical); list which MUST items and extra tests apply, and note anything intentionally excluded and why. Untrusted-input, fiber/concurrency, and auth changes are never low tier.
2. **Implement** — follow MUST NOT. Handle `Nil` explicitly (no `.not_nil!` on nilable values), type-restrict public methods, bound/sync fibers, use parameterized crystal-db queries. When the change touches a topic (Nil safety/types, macros, fibers/channels, serialization, persistence, security, shards), open that section of `REFERENCE.md`.
3. **Review / score** — run the commands from `gate.yml` / `configs/`: `crystal tool format --check`, `crystal build` (type + Nil checks), `ameba`, `crystal spec`. Apply the score caps, write `PHASE-RESULT.md` with evidence, report 0-100.

Front-load `CORE.md`; lazy-load `REFERENCE.md`. The compiler (type + Nil safety), Ameba, and tests enforce what they can see; reserve judgment for architecture, audit, and business correctness.

> Note: Crystal's compiler gives strong compile-time guarantees (types, `Nil` unions), but compile success is not proof of behavior — tests and the rest of the gate still apply. Coverage tooling is limited; document gaps and compensate with thorough specs.
