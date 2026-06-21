# C# / .NET Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. Implementation is complete only when the code
builds from clean restore, is formatted, passes nullable/compiler warnings and analyzers, has
meaningful tests, preserves architecture, handles errors and cancellation deliberately, is secure by
default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Solution builds from a clean restore: `dotnet build --configuration Release`.
2. Formatting passes: `dotnet format --verify-no-changes`.
3. Nullable warnings, compiler warnings, and analyzers ran; new findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `dotnet test --configuration Release`.
5. Coverage meets the risk tier (see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, EF mappings, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors and cancellation handled deliberately; no swallowed failures.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress analyzer/compiler/nullable warnings (`#pragma`, `NoWarn`, `!`) to pass.
- Use `async void` (outside event handlers), block on async (`.Result`/`.Wait()`), swallow exceptions, or rely on service-locator/hidden global state.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway utility; do not ship business rules with only low-tier checks. In the plan, list which
checks apply and state any intentionally excluded and why.

- **Low** (simple DTOs, mappers, config, non-critical utilities): build, format, basic tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence adapters, API controllers): + failure-path and integration tests, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state transitions, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- **Critical** (security, signing/crypto, financial, audit, data integrity, safety-critical): + golden/contract tests, error/rejection paths, audit/traceability, async cancellation tests, mutation tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|91-100|Builds, tests, analyzers, formatting, dependency checks, security, architecture, failure paths, and deployment all verified for the phase scope.|
|76-90|Strong evidence with minor documented limitations.|
|61-75|Useful implementation with meaningful gaps or partial evidence.|
|41-60|Compiles or partially works but has weak tests, weak analysis, or notable risk.|
|1-40|Mostly unverified, incomplete, or risky.|
|0|Does not build, breaks architecture, or cannot be evaluated.|

### Score caps (must not exceed)

|Missing or Failed Evidence|Max|
|---|---|
|Solution does not build from clean restore|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Formatting not verified and not explained|65|
|Nullable/compiler warnings or analyzers not run and not explained|65|
|Business rules without unit tests|60|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Async/cancellation code lacks failure/cancellation tests where relevant|80|
|Critical rules without edge-case/failure tests|80|
|Vulnerability/dependency check missing after dependency changes|85|
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
|API controllers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

|Item|Target|Maximum|
|---|---|---|
|Method cyclomatic complexity|<= 8|<= 10|
|Method cognitive complexity|<= 10|<= 15|
|Method length|<= 30 lines|<= 50 lines|
|Class length|<= 300 lines|<= 500 lines|
|File length|<= 400 lines|<= 600 lines|
|Constructor parameters|<= 5|<= 7|
|Method parameters|<= 4|<= 6|
|Nesting depth|<= 2|<= 3|
|Public methods per class|<= 10|<= 15|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (async/cancellation, EF Core/persistence, serialization,
ASP.NET boundaries, NuGet/supply chain, public API), open the matching numbered section in
**REFERENCE.md** for detail.
