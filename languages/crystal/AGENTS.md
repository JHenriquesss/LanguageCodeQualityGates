# Agent instructions — Crystal quality gate

When you implement or review Crystal code in a project that uses this gate, follow this. Front-load
`CORE.md`; do **not** load the full `REFERENCE.md` by default.

## At planning time
- Load `CORE.md`. Parse `gate.yml` for the machine-readable commands, thresholds, tiers, and caps.
- Classify the change by risk tier (low / medium / high / critical) using CORE "Scope by risk tier".
- Emit the plan's check-list: which MUST items (by number) and which extra tests apply for the tier;
  state anything intentionally excluded and why. Untrusted-input, fiber/concurrency, and auth changes
  are never low tier.

## During implementation
- Obey the MUST NOT list. Handle `Nil` explicitly (never `.not_nil!` on a value that can be nil), add
  type restrictions to public methods, supervise/bound fibers and use `Channel`/`Mutex` for shared
  state, and use parameterized crystal-db queries.
- Open a specific section of `REFERENCE.md` only when a check trips or its topic is in scope (Nil
  safety/types, macros, fibers/channels, serialization, persistence, security, shards).

## At review / completion
- Run the commands from `gate.yml` / `configs/`; read the tool output. Run `crystal tool format
  --check`, `crystal build` (type + Nil checks), `ameba`, and `crystal spec`. Do not score by reading
  code alone.
- Apply `score_caps`. Write `PHASE-RESULT.md` with command evidence and residual risk. Report 0-100.
- If a tool is unavailable (e.g. coverage tooling), document it as a concrete blocker — never silently
  skip a check.
