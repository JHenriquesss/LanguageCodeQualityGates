# C++ Code Quality Gate

Self-contained quality gate for C++. Download **this folder** to use it on a C++ project — it has everything.

## Files
- `CORE.md` — **always load this.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables.
- `REFERENCE.md` — the full document. Open a specific section only when a check trips or that topic is in scope.
- `gate.yml` — machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse deterministically.
- `configs/` — `.clang-format`, `.clang-tidy` (Core Guidelines + complexity thresholds), a Makefile fragment with strict-warning/sanitizer/coverage targets, and a CI workflow that **enforce** the gate. Copy into your repo and adjust paths/standard.
- `AGENTS.md` — instructions that tell an agent to load CORE.md, parse gate.yml, plan by risk tier, and review by running the gate.

## How an LLM (or engineer) uses it
1. **Plan** — read `CORE.md`; classify the change by risk tier (low/medium/high/critical); list which MUST items and extra tests apply, and note anything intentionally excluded and why. Memory/lifetime and untrusted-input changes are never low tier.
2. **Implement** — follow MUST NOT. Prefer RAII and smart pointers over manual memory. When the change touches a topic (ownership, move semantics, lifetimes/dangling, templates, concurrency, undefined behavior, parsing untrusted input), open that section of `REFERENCE.md`.
3. **Review / score** — run the commands from `gate.yml` / `configs/`: build `-Werror`, run tests under AddressSanitizer + UBSan, run static analysis (clang-tidy with the Core Guidelines). Apply the score caps, write `PHASE-RESULT.md` with evidence, report 0-100.

Front-load `CORE.md`; lazy-load `REFERENCE.md`. The compiler, sanitizers, and analyzers enforce what they can see; reserve judgment for architecture, audit, and business correctness.
