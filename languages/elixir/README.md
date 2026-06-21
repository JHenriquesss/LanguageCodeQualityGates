# Elixir Code Quality Gate

Self-contained quality gate for Elixir. Download **this folder** to use it on an Elixir project — it has everything.

## Files
- `CORE.md` — **always load this.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables.
- `REFERENCE.md` — the full document. Open a specific section only when a check trips or that topic is in scope.
- `gate.yml` — machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse deterministically.
- `configs/` — `.credo.exs` (strict + complexity), `.formatter.exs`, a `mix.exs` snippet (deps + `warnings_as_errors` + coverage + a `gate` alias), and a CI workflow that **enforce** the gate. Copy into your repo and adjust versions/paths.
- `AGENTS.md` — instructions that tell an agent to load CORE.md, parse gate.yml, plan by risk tier, and review by running the gate.

## How an LLM (or engineer) uses it
1. **Plan** — read `CORE.md`; classify the change by risk tier (low/medium/high/critical); list which MUST items and extra tests apply, and note anything intentionally excluded and why. Untrusted-input, process/supervision, and auth changes are never low tier.
2. **Implement** — follow MUST NOT. Return and handle tagged tuples, supervise processes, add `@spec`, never convert untrusted input to atoms. When the change touches a topic (typespecs/Dialyzer, processes/OTP, atoms/untrusted input, serialization, Ecto, security, hex), open that section of `REFERENCE.md`.
3. **Review / score** — run the commands from `gate.yml` / `configs/`: `mix compile --warnings-as-errors`, `mix format --check-formatted`, `mix credo --strict`, `mix dialyzer`, tests with coverage, `mix deps.audit`. Apply the score caps, write `PHASE-RESULT.md` with evidence, report 0-100.

Front-load `CORE.md`; lazy-load `REFERENCE.md`. The compiler, Credo, Dialyzer, and tests enforce what they can see; reserve judgment for architecture, audit, and business correctness.
