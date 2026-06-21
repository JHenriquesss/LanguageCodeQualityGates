# Agent instructions — Elixir quality gate

When you implement or review Elixir code in a project that uses this gate, follow this. Front-load
`CORE.md`; do **not** load the full `REFERENCE.md` by default.

## At planning time
- Load `CORE.md`. Parse `gate.yml` for the machine-readable commands, thresholds, tiers, and caps.
- Classify the change by risk tier (low / medium / high / critical) using CORE "Scope by risk tier".
- Emit the plan's check-list: which MUST items (by number) and which extra tests apply for the tier;
  state anything intentionally excluded and why. Untrusted-input, process/supervision, and auth
  changes are never low tier.

## During implementation
- Obey the MUST NOT list. Return tagged tuples (`{:ok, _}`/`{:error, _}`), handle them with `with`/
  `case`, supervise processes, add `@spec` to public functions, and never convert untrusted input to
  atoms or `unserialize`/`binary_to_term` it unsafely.
- Open a specific section of `REFERENCE.md` only when a check trips or its topic is in scope
  (typespecs/Dialyzer, processes/OTP/supervision, atoms and untrusted input, serialization, Ecto,
  security, hex/supply chain).

## At review / completion
- Run the commands from `gate.yml` / `configs/`; read the tool output. Run `mix compile
  --warnings-as-errors`, `mix format --check-formatted`, `mix credo --strict`, `mix dialyzer`, and the
  tests with coverage. Do not score by reading code alone.
- Apply `score_caps`. Write `PHASE-RESULT.md` with command evidence and residual risk. Report 0-100.
- If a tool is unavailable, document it as a concrete blocker — never silently skip a check.
