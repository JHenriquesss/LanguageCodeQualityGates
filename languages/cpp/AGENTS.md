# Agent instructions — C++ quality gate

When you implement or review C++ code in a project that uses this gate, follow this. Front-load
`CORE.md`; do **not** load the full `REFERENCE.md` by default.

## At planning time
- Load `CORE.md`. Parse `gate.yml` for the machine-readable commands, thresholds, tiers, and caps.
- Classify the change by risk tier (low / medium / high / critical) using CORE "Scope by risk tier".
- Emit the plan's check-list: which MUST items (by number) and which extra tests apply for the tier;
  state anything intentionally excluded and why. Memory/lifetime and untrusted-input changes are
  never low tier.

## During implementation
- Obey the MUST NOT list. Treat every owning pointer, lifetime, reference/view, array index, and
  integer size computation as a place a bug hides. Prefer RAII and smart pointers over manual memory.
- Open a specific section of `REFERENCE.md` only when a check trips or its topic is in scope
  (RAII/ownership, move semantics, lifetimes/dangling, templates, concurrency, undefined behavior,
  parsing untrusted input).

## At review / completion
- Run the commands from `gate.yml` / `configs/`; read the tool output. Build with `-Werror`, run
  tests under AddressSanitizer + UBSan, and run static analysis (clang-tidy with the Core Guidelines).
  Do not score by reading code alone.
- Apply `score_caps`. Write `PHASE-RESULT.md` with command evidence and residual risk. Report 0-100.
- If a tool is unavailable, document it as a concrete blocker — never silently skip a check.
