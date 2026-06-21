# Go Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. Implementation is complete only when the
code builds, is formatted, passes vet/lint, has meaningful tests, preserves architecture, models
errors, avoids unnecessary panics, handles goroutines/context deliberately, is secure by default,
and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code builds from a clean checkout: `go build ./...`.
2. Formatting passes: `test -z "$(gofmt -l .)"`.
3. Vet/static analysis passes; new findings fixed or justified: `go vet ./...` and `staticcheck`/`golangci-lint` where configured.
4. Tests pass and are meaningful for changed behavior, including failure paths: `go test ./...`; add `-race` for concurrency-sensitive code.
5. Coverage meets the risk tier (see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of handlers, persistence, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors returned and wrapped explicitly; no swallowed or ignored errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress vet/lint findings to pass.
- Use `panic` for recoverable failures, leak goroutines, ignore returned errors, or share state across goroutines without synchronization.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway tool; do not ship business rules with only low-tier checks. In the plan, list which
checks apply and state any intentionally excluded and why.

- **Low** (helpers, simple types, internal refactors, throwaway tools): build, gofmt, vet, basic behavior tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence/external adapters): + failure-path tests, integration at seams, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state transitions, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- **Critical** (security, signing/crypto, legal/financial/compliance, audit, data integrity, concurrency): + golden/contract tests, error/rejection paths, audit/traceability, race/cancellation evidence, mutation or fuzz where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-39|Not acceptable. Missing build/test/evidence or severe design flaws.|
|40-59|Weak. Some evidence exists, but important quality gates are missing.|
|60-74|Basic — acceptable for low-risk code only. Gaps must be documented.|
|75-84|Good. Most relevant gates pass with meaningful tests.|
|85-89|Strong. Good evidence, boundary discipline, failure tests, security checks.|
|90-94|Very strong. Suitable for high-risk code with coverage, static analysis, strong tests.|
|95-100|Exceptional. Critical-path evidence, mutation/fuzz/contract tests, audit/security proof.|

### Score constraints (max score when evidence is missing)

- Max 49 if the code does not build.
- Max 59 if gofmt was not checked.
- Max 64 if tests were not run.
- Max 69 if meaningful tests are missing for implemented behavior.
- Max 74 if go vet/static checks were skipped without reason.
- Max 79 if dependency/security checks were skipped after meaningful dependency changes.
- Max 84 if concurrency-sensitive code lacks race/cancellation evidence.
- Max 84 if error paths are not tested in medium/high-risk code.
- Max 89 if critical legal/security/signing code lacks golden/contract/error-path tests.
- Max 89 if coverage requirements were skipped without reason.
- Max 89 if unsafe/cgo is present without strong tests and documentation.
- Max 94 if critical code lacks mutation/fuzz evidence or documented readiness.

## Coverage thresholds

|Area|Line|Branch/Behavior|Mutation|
|---|---|---|---|
|Domain/business rules|>= 90%|>= 85%|>= 80%|
|Critical legal/regulatory rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

|Item|Target|Maximum|
|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|
|Function cognitive complexity|<= 10|<= 15|
|Function length|<= 30 lines|<= 50 lines|
|Type/method-set length|<= 300 lines|<= 500 lines|
|File length|<= 400 lines|<= 600 lines|
|Function parameters|<= 4|<= 6|
|Nesting depth|<= 2|<= 3|
|Exported items per package file|<= 10|<= 15|

Exceeding a maximum requires a documented justification in PHASE-RESULT.md. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (goroutines/context, serialization, persistence, cgo/unsafe,
supply chain, public API), open the matching numbered section in **REFERENCE.md** for detail.
