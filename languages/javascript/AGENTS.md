# Agent instructions — JavaScript quality gate

When you implement or review JavaScript code in a project that uses this gate, follow this. Front-load
`CORE.md`; do **not** load the full `REFERENCE.md` by default.

## At planning time
- Load `CORE.md`. Parse `gate.yml` for the machine-readable commands, thresholds, tiers, and caps.
- Classify the change by risk tier (low / medium / high / critical) using CORE "Scope by risk tier".
- Emit the plan's check-list: which MUST items (by number) and which extra tests apply for the tier;
  state anything intentionally excluded and why. JavaScript has no compile-time types, so
  untrusted-input changes are never low tier.

## During implementation
- Obey the MUST NOT list. Use `===`, `const`/`let` (never `var`), ESM, await/handle every promise,
  validate every untrusted boundary at runtime, and never `eval`/`new Function` or merge untrusted
  data into objects (prototype pollution).
- Open a specific section of `REFERENCE.md` only when a check trips or its topic is in scope
  (runtime validation, promises/async, prototype pollution, modules, serialization, security, npm).

## At review / completion
- Run the commands from `gate.yml` / `configs/`; read the tool output. Run `prettier --check`,
  `eslint . --max-warnings=0`, the tests with coverage, and `npm audit`. Do not score by reading code
  alone — there is no type checker to lean on.
- Apply `score_caps`. Write `PHASE-RESULT.md` with command evidence and residual risk. Report 0-100.
- If a tool is unavailable, document it as a concrete blocker — never silently skip a check.
