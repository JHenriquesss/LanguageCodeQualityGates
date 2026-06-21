# Crystal Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. Crystal is compiled and statically typed with
type inference and compile-time `Nil` safety — the compiler catches a lot, but "it compiles" still
does not prove behavior, and macros, fibers, and `.not_nil!` can hide real defects. Implementation is
complete only when the code compiles warning-free, is formatted, passes Ameba and the compiler's
type/nil checks, has meaningful tests, handles `Nil` and errors explicitly, validates untrusted input,
preserves architecture, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Compiles clean under the project Crystal version: `crystal build` succeeds with warnings addressed; `shards install` clean.
2. Formatting passes: `crystal tool format --check`.
3. Static analysis passes: `ameba`; the compiler's type and `Nil` checks are part of the gate; findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `crystal spec`.
5. Coverage meets the risk tier (kcov where available; otherwise document the limitation — see Coverage thresholds).
6. Complexity within limits (Ameba; see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, views, and ORM models.
8. Untrusted input validated before use; `Nil` handled explicitly (no `.not_nil!` on values that can be nil).
9. No secrets committed; sensitive data not logged.
10. Errors modeled with exceptions or result unions and handled; `Nil` unions handled (no `.not_nil!` to bypass); type restrictions on public methods; no swallowed `rescue`.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Ignore compiler warnings; broadly disable Ameba checks to pass.
- `.not_nil!` to bypass `Nil` safety on values that can be nil; abuse macros to hide business logic; use `pointerof`/unsafe pointer operations or `lib`/C bindings without isolation and justification.
- Spawn unbounded fibers, or share mutable state across fibers without a `Channel`/`Mutex`; `rescue` and swallow everything; ignore an error/`{nil, error}`-style return; put business rules in controllers/views; build SQL by string interpolation (use parameterized crystal-db queries).

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Untrusted-input, fiber/concurrency, and
auth changes are never low tier. In the plan, list which checks apply and state any intentionally
excluded and why.

- **Low** (pure functions, simple structs, internal refactors, throwaway scripts): compile warning-free, format, Ameba, basic tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence/external adapters, fiber workers): + failure-path tests, input/nil validation, integration, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state machines, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, concurrency tests. Add MUST 6.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity): + golden/contract tests, error/rejection paths, audit/traceability, injection tests, dependency audit, property tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no Ameba evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and clean Ameba|
|76-90|Strong implementation with good tests, explicit Nil/error handling, low complexity, clean boundaries|
|91-100|Production-grade: warning-free, Ameba clean, Nil-safe, strong tests with failure paths, no known security defects|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
|---|---|
|Does not compile, or warnings present and not addressed|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Ameba not run and not explained|65|
|Formatting not checked and not explained|65|
|Business rules without unit tests|60|
|Untrusted input not validated / `.not_nil!` on untrusted value|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required (or limitation not documented)|75|
|Fibers sharing mutable state without sync, or swallowed error in critical path|80|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit missing where applicable|85|
|Property/mutation evidence missing for critical rules and not justified|85|
|Known critical bug remains|55|
|Known security issue (injection/nil-deref/unsafe-pointer) remains|45|
|Secrets committed|20|
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Notes|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|kcov where available|
|Critical security/financial/audit rules|>= 95%|>= 90%|property tests for parsers|
|Application services / fiber workers|>= 85%|>= 80%|—|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Controllers / glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|—|

Crystal lacks first-class coverage tooling; use kcov where it works, otherwise document the gap in
`PHASE-RESULT.md` and compensate with thorough specs.

## Complexity limits

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Method cyclomatic complexity|<= 8|<= 10|Ameba Metrics/CyclomaticComplexity|
|Method length|<= 30 lines|<= 50 lines|review / Ameba|
|Class / struct length|<= 300 lines|<= 500 lines|review|
|File length|<= 400 lines|<= 600 lines|review|
|Method parameters|<= 4|<= 6|review|
|Nesting depth|<= 2|<= 3|review|
|Public methods per type|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (Nil safety/type system, macros, fibers/channels/concurrency,
serialization, persistence, security, shards/supply chain), open the matching section of
**REFERENCE.md** for detail.
