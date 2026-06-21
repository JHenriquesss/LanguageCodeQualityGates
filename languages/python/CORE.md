# Python Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. Python is dynamic — "it imports" is weak
evidence. Type hints do not validate runtime input. Implementation is complete only when the code
runs on the project Python version, is formatted, passes lint/typing, has meaningful tests,
validates untrusted input, models errors, preserves architecture, is secure by default, and has
evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code imports and runs under the project-approved Python version.
2. Formatting passes: `ruff format --check .`.
3. Lint and static analysis pass; new findings fixed or justified: `ruff check .`, plus `mypy`/`pyright` where typing is expected.
4. Tests pass and are meaningful for changed behavior, including failure paths: `pytest`.
5. Coverage meets the risk tier (see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of route/view/task functions, persistence, and serialization.
8. Every untrusted boundary validated at runtime (type hints do not validate input).
9. No secrets committed; sensitive data not logged.
10. Failures modeled with exceptions/typed errors; no swallowed failures; async tasks supervised.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress lint/type findings (`# noqa`, `# type: ignore`) to pass.
- Use `pickle`/`yaml.load`/`eval`/`exec` on untrusted input, `assert` for validation/security, mutable default arguments, or import-time side effects.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway script; do not ship business rules with only low-tier checks. In the plan, list which
checks apply and state any intentionally excluded and why.

- **Low** (helpers, simple data holders, internal refactors, throwaway scripts): run, format, lint, basic tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence/external adapters, API handlers): + failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state machines, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- **Critical** (security, signing/crypto, financial, audit, data integrity, safety-critical): + golden/contract tests, error/rejection paths, audit/traceability, async cancellation tests, mutation or property/fuzz tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Prototype-level. May import or pass a narrow happy-path test but lacks engineering evidence.|
|41-60|Code exists but evidence is weak. Failure paths, typing, security, or packaging under-tested.|
|61-75|Works for main paths. Some tests or gates incomplete. Not production-complete without follow-up.|
|76-90|Complete and most gates pass. Minor documented residual risk.|
|91-100|Complete with full evidence: happy/failure/boundary/edge tests, format/lint/typing/security pass, architecture preserved.|

### Score caps (must not exceed)

|Missing or Failed Evidence|Max|
|---|---|
|Code does not import/run under the project Python version|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Formatting/lint not run and not explained|65|
|Type checking missing where expected and not explained|65|
|Business rules without unit tests|60|
|Runtime validation missing for new untrusted input boundaries|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Async code lacks cancellation/timeout/error-path tests where relevant|80|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit missing where applicable|85|
|Unsafe deserialization or `assert`-based validation in critical code|80|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/route handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

|Item|Target|Maximum|
|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|
|Function cognitive complexity|<= 10|<= 15|
|Function length|<= 30 lines|<= 50 lines|
|Class/module length|<= 300 lines|<= 500 lines|
|File length|<= 400 lines|<= 600 lines|
|Function parameters|<= 4|<= 6|
|Nesting depth|<= 2|<= 3|
|Public symbols per module|<= 10|<= 15|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. `ruff` (mccabe), `radon`, or `xenon` can enforce these. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (async, runtime validation, serialization, packaging,
imports/side effects, supply chain), open the matching numbered section in
**REFERENCE.md** for detail.
