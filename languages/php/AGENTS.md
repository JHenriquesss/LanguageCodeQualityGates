# Agent instructions — PHP quality gate

When you implement or review PHP code in a project that uses this gate, follow this. Front-load
`CORE.md`; do **not** load the full `REFERENCE.md` by default.

## At planning time
- Load `CORE.md`. Parse `gate.yml` for the machine-readable commands, thresholds, tiers, and caps.
- Classify the change by risk tier (low / medium / high / critical) using CORE "Scope by risk tier".
- Emit the plan's check-list: which MUST items (by number) and which extra tests apply for the tier;
  state anything intentionally excluded and why. Untrusted-input and auth changes are never low tier.

## During implementation
- Obey the MUST NOT list. Declare `strict_types=1`, use `===` not `==`, validate input and escape
  output at boundaries, use prepared statements for SQL, and never silence errors with `@`.
- Open a specific section of `REFERENCE.md` only when a check trips or its topic is in scope
  (static analysis/types, type juggling, serialization, security/injection, persistence, Composer).

## At review / completion
- Run the commands from `gate.yml` / `configs/`; read the tool output. Run `php -l`, PHPStan/Psalm at
  the project level, the formatter, and the tests with coverage. Do not score by reading code alone.
- Apply `score_caps`. Write `PHASE-RESULT.md` with command evidence and residual risk. Report 0-100.
- If a tool is unavailable, document it as a concrete blocker — never silently skip a check.
