# Agent instructions — Python quality gate

When you implement or review Python code in a project that uses this gate, follow this. Front-load
`CORE.md`; do **not** load the full `REFERENCE.md` by default.

## At planning time
- Load `CORE.md`. Parse `gate.yml` for the machine-readable commands, thresholds, tiers, and caps.
- Classify the change by risk tier (low / medium / high / critical) using CORE "Scope by risk tier".
- Emit the plan's check-list: which MUST items (by number) and which extra tests apply for the tier;
  state anything intentionally excluded and why.

## During implementation
- Obey the MUST NOT list.
- Open a specific section of `REFERENCE.md` only when a check trips or its topic is in scope
  (async, serialization, persistence, security, public API, etc.).

## At review / completion
- Run the commands from `gate.yml` / `configs/`; read the tool output. Do not score by reading code alone.
- Apply `score_caps`. Write `PHASE-RESULT.md` with command evidence and residual risk. Report 0-100.
- If a tool is unavailable, document it as a concrete blocker — never silently skip a check.
