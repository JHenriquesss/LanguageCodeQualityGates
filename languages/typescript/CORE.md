# TypeScript Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. TypeScript erases types at runtime — anything
crossing a boundary must be validated at runtime, not just typed. Implementation is complete only
when the code typechecks, is formatted, passes lint, has meaningful tests, validates untrusted input,
models failures, preserves architecture, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code typechecks: `tsc --noEmit` (or the project typecheck script).
2. Formatting passes: `prettier --check .`.
3. ESLint/static analysis passes; new findings fixed or justified: `eslint . --max-warnings=0`.
4. Tests pass and are meaningful for changed behavior, including failure paths.
5. Coverage meets the risk tier (see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of handlers, components, persistence, and serialization.
8. Every untrusted boundary validated at runtime (types do not validate at runtime).
9. No secrets committed or bundled into client code; sensitive data not logged.
10. Failures modeled explicitly; promises awaited/handled; no swallowed errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress ESLint/compiler diagnostics to pass.
- Use `any`, unsafe assertions, `@ts-ignore`, or `JSON.parse(...) as T` without justification; leave floating promises; trust unvalidated external data.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway script; do not ship business rules with only low-tier checks. In the plan, list which
checks apply and state any intentionally excluded and why.

- **Low** (formatting helpers, simple display logic, internal non-critical refactors): typecheck, format, lint, basic tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence/external adapters, API handlers): + failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state machines, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- **Critical** (security, signing/crypto, legal/financial/compliance, audit, data integrity): + golden/contract tests, error/rejection paths, audit/traceability, async cancellation/timeout tests, mutation or property tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|95-100|Excellent. Strict typecheck, lint, formatting, meaningful tests, failure paths, security review, no unjustified unsafe escapes, no architecture erosion.|
|85-94|Good. Strong implementation with minor documented gaps that do not threaten correctness or safety.|
|70-84|Adequate but risky. Some gaps remain; acceptable only for lower-risk phases or approved residual risk.|
|50-69|Weak. Missing meaningful tests, static analysis, validation, or architecture evidence.|
|<50|Not acceptable. The phase should not be treated as complete.|

### Score constraints (must not exceed)

- 60 if `tsc --noEmit` or project typecheck did not pass.
- 65 if ESLint/static analysis was not run and no concrete blocker exists.
- 70 if tests were not run.
- 75 if only happy-path tests exist for changed business logic.
- 75 if runtime validation is missing for new untrusted input boundaries.
- 80 if dependency changes were not reviewed.
- 80 if package exports/public API changed without consumer/import tests.
- 85 if `any`, unsafe assertions, or suppressions were added without clear justification.
- 85 if async code lacks cancellation/timeout/error-path tests where relevant.
- 90 if high-risk legal/security/audit code lacks golden/contract/failure-path tests.

## Coverage thresholds

Quality of assertions matters more than raw percentage.

|Area|Line|Branch|
|---|---|---|
|Changed business-critical code|>= 85%|>= 80%|
|Critical domain/legal/security rules|~100% meaningful branch coverage|—|

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
|Public exports per module|<= 10|<= 15|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (async/promises, runtime validation, ESM/CJS packaging,
serialization, public API, supply chain), open the matching numbered section in
**REFERENCE.md** for detail.
