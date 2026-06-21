# Rust Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

This is an engineering control document, not a style preference. The implementation is complete
only when the code compiles, is formatted, passes lint, has meaningful tests, preserves
architecture, models errors, avoids unnecessary panics/unsafe, handles async/concurrency
deliberately, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code compiles from a clean checkout: `cargo check --workspace --all-targets --all-features`.
2. Formatting passes: `cargo fmt --all -- --check`.
3. Lint passes with no new warnings: `cargo clippy --workspace --all-targets --all-features -- -D warnings`; suppressions narrow and justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `cargo test --workspace --all-features`.
5. Coverage meets the risk tier (see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of handlers, persistence, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors modeled with `Result`/typed errors; no swallowed failures.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress Clippy/compiler warnings to pass.
- Use `unwrap`/`expect`/`panic!` for recoverable failures, or `unsafe` without isolation, `// SAFETY:` justification, and Miri/tests.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway script; do not ship business rules with only low-tier checks. In the plan, list which
checks apply and state any intentionally excluded and why.

- **Low** (helpers, simple data types, internal refactors, throwaway scripts): build, format, clippy, basic behavior tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence/external adapters): + failure-path tests, integration at seams, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state transitions, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- **Critical** (security, signing/crypto, financial, audit, data integrity, safety-critical, `unsafe`): + golden/contract tests, error/rejection paths, audit/traceability, Miri for `unsafe`, mutation or fuzz where applicable. Full gate, no skipped checks.

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
|cargo fmt not run|70|
|Clippy not run and not explained|75|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Business rules without unit tests|60|
|Quality gates not run and not explained|65|
|Architecture boundaries unclear|70|
|No coverage evidence|75|
|Critical rules without edge-case tests|80|
|Security/dependency audit missing where applicable|85|
|Mutation testing missing for critical rules and not justified|85|
|Unsafe code without safety documentation|70|
|Unsafe code without Miri or documented reason|80|
|Production code uses unwrap/expect in recoverable paths|80|
|Panic used for recoverable business/integration failures|75|
|Critical payloads without golden/contract/schema tests|70|
|Feature combinations untested where features matter|85|
|Public API changed without semver consideration|80|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch/Region|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
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
|Type/impl block length|<= 300 lines|<= 500 lines|
|File length|<= 400 lines|<= 600 lines|
|Function parameters|<= 4|<= 6|
|Nesting depth|<= 2|<= 3|
|Public items per module|<= 10|<= 15|

Exceeding a maximum requires a documented justification in PHASE-RESULT.md. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (async, serialization, persistence, unsafe, supply chain,
public API), open the matching numbered section in **REFERENCE.md** for detail.
