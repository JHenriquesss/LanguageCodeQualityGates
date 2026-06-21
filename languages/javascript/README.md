# JavaScript Code Quality Gate

Self-contained quality gate for JavaScript. Download **this folder** to use it on a JS project — it has everything.

## Files
- `CORE.md` — **always load this.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables.
- `REFERENCE.md` — the full document. Open a specific section only when a check trips or that topic is in scope.
- `gate.yml` — machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse deterministically.
- `configs/` — ESLint flat config (`eslint.config.mjs`, with promise + security plugins and complexity rules), `.prettierrc.json`, an optional `jsconfig.json` for JSDoc type-checking, and a CI workflow that **enforce** the gate. Copy into your repo and adjust paths/version.
- `AGENTS.md` — instructions that tell an agent to load CORE.md, parse gate.yml, plan by risk tier, and review by running the gate.

## How an LLM (or engineer) uses it
1. **Plan** — read `CORE.md`; classify the change by risk tier (low/medium/high/critical); list which MUST items and extra tests apply, and note anything intentionally excluded and why. JavaScript has no compile-time types, so untrusted-input changes are never low tier.
2. **Implement** — follow MUST NOT. Use `===`, `const`/`let`, ESM, await/handle every promise, validate every untrusted boundary at runtime, never `eval`/`new Function`. When the change touches a topic (runtime validation, promises/async, prototype pollution, modules, serialization, security, npm), open that section of `REFERENCE.md`.
3. **Review / score** — run the commands from `gate.yml` / `configs/`: `prettier --check`, `eslint . --max-warnings=0`, tests with coverage, `npm audit`. Apply the score caps, write `PHASE-RESULT.md` with evidence, report 0-100.

Front-load `CORE.md`; lazy-load `REFERENCE.md`. ESLint, tests, and runtime validation enforce what they can see — there is no type checker, so runtime validation and tests matter more. Reserve judgment for architecture, audit, and business correctness.

> Working in TypeScript instead? Use the `typescript` gate — it adds compile-time type checking on top of this.
