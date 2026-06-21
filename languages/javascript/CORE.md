# JavaScript Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. JavaScript has **no compile-time type checking**
— there is no `tsc` to catch type errors, so ESLint, runtime validation, and tests carry the weight.
"It runs" is weak evidence. Implementation is complete only when the code is formatted, passes ESLint
clean, validates every untrusted boundary at runtime, has meaningful tests, models failures and
handles promises, preserves architecture, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code parses and runs under the project Node/runtime version: no syntax errors; `npm ci` (or the project install) clean. New code uses ESM/`const`/`let`, not `var`.
2. Formatting passes: `prettier --check .`.
3. ESLint passes with no warnings: `eslint . --max-warnings=0`; where the project type-checks JS via JSDoc, `tsc --checkJs --noEmit` passes too.
4. Tests pass and are meaningful for changed behavior, including failure paths.
5. Coverage meets the risk tier (c8/istanbul; see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of route handlers, UI components, persistence, and serialization.
8. Every untrusted boundary validated at runtime — there are no static types to rely on.
9. No secrets committed or bundled into client code; sensitive data not logged.
10. Failures modeled explicitly; promises awaited/handled; strict equality (`===`); no swallowed errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because the code runs.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress ESLint diagnostics (`/* eslint-disable */`) to pass.
- `eval`, `new Function`, or dynamic code from input; use `==`/`!=` where `===`/`!==` is required; use `var`; trust unvalidated external data.
- Leave floating (unhandled) promises; allow prototype pollution (merging untrusted data into objects); put business rules in handlers/components; ship secrets in client bundles.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Because JS has no compile-time types,
untrusted-input changes are never low tier. In the plan, list which checks apply and state any
intentionally excluded and why.

- **Low** (formatting helpers, simple display logic, internal non-critical refactors): lint, format, basic tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence/external adapters, API handlers): + failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state machines, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, JSDoc type-checking where used. Add MUST 6.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity): + golden/contract tests, error/rejection paths, audit/traceability, injection/XSS tests, async cancellation/timeout tests, dependency audit, mutation tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Runs with weak tests, no lint evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and ESLint clean|
|76-90|Strong implementation with good tests, runtime-validated boundaries, low complexity, clean boundaries|
|91-100|Production-grade: ESLint clean, every untrusted boundary validated, strong tests with failure paths, no known security defects|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
|---|---|
|Syntax error / does not run under the project Node version|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|ESLint not run and not explained|60|
|Formatting not run and not explained|65|
|Business rules without unit tests|60|
|Runtime validation missing for new untrusted input boundaries|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Floating promises / unhandled rejections in changed code|75|
|Loose `==`/type coercion in security or money logic|80|
|`var`, `eval`, or broad eslint-disable used to pass|75|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit (`npm audit`) missing where applicable|85|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|55|
|Known security issue (injection/XSS/prototype-pollution/auth) remains|45|
|Secrets committed or bundled to the client|20|
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Handlers / UI glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

|Item|Target|Maximum|ESLint rule|
|---|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|complexity|
|Function length|<= 30 lines|<= 50 lines|max-lines-per-function|
|File length|<= 400 lines|<= 600 lines|max-lines|
|Function parameters|<= 4|<= 6|max-params|
|Nesting depth|<= 2|<= 3|max-depth|
|Nested callbacks|<= 2|<= 3|max-nested-callbacks|
|Public exports per module|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (runtime validation, promises/async, prototype pollution,
modules/ESM-CJS, serialization, security, npm/supply chain), open the matching section of
**REFERENCE.md** for detail.
