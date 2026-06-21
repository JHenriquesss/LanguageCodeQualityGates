# Java Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. Implementation is complete only when the code
compiles, is tested, is readable with low complexity, preserves architecture, handles errors
explicitly, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code compiles and tests run from a clean checkout: `./mvnw clean verify` or `./gradlew clean build`.
2. Formatting verified (google-java-format / Checkstyle) or documented.
3. Static analysis ran where configured (SpotBugs, PMD, Error Prone, ArchUnit); new findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths.
5. Coverage meets the risk tier (see Coverage thresholds); mutation testing for critical rules where available.
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, repositories, JPA entities, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors handled explicitly at the right layer; no swallowed exceptions.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Disable or broadly suppress quality gates/warnings to pass.
- Catch `Throwable`/`Exception` and swallow it, use `double`/`float` for money, put business logic in controllers/entities, use field injection, or `@Data` on domain objects.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway utility; do not ship business rules with only low-tier checks. In the plan, list which
checks apply and state any intentionally excluded and why.

- **Low** (simple DTOs, straightforward mappers, simple config, non-critical utilities): compile, format, basic tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence adapters, API endpoints): + error-path and integration tests, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, payroll/legal logic, state transitions, authorization): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, mutation where available. Add MUST 6; tighten 5.
- **Critical** (security, signing/crypto, legal/financial/compliance, audit, data integrity): + golden/contract tests, schema validation, error/rejection paths, audit/traceability, redaction, mutation tests. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Basic implementation with weak tests or unclear structure|
|61-75|Working implementation with meaningful tests and acceptable structure|
|76-90|Strong implementation with good tests, low complexity, and clean boundaries|
|91-100|Production-grade implementation with strong evidence, clear boundaries, strong error handling, no known gaps|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
|---|---|
|Code does not compile|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Business rules without unit tests|60|
|Quality gates not run and not explained|65|
|Architecture boundaries unclear|70|
|No coverage evidence|75|
|Critical rules without edge-case tests|80|
|Security/dependency audit missing where applicable|85|
|Static analysis missing where applicable|85|
|Mutation testing missing for critical rules and not justified|85|
|Regulatory/legal payloads without golden/contract/schema tests|70|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical legal/regulatory rules|>= 95%|>= 90%|>= 85%|
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

Exceeding a maximum requires a documented justification in PHASE-RESULT.md. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (concurrency, persistence/JPA, serialization, framework
boundaries, dependencies, public API), open the matching numbered section in
**REFERENCE.md** for detail.
