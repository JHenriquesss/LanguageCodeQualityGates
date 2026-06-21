# C++ Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. C++ has manual lifetimes, pervasive undefined
behavior, and sharp edges (dangling references/views, iterator invalidation, slicing, data races) —
"it compiles" and "it ran once" are weak evidence. Implementation is complete only when the code
compiles clean with strict warnings, is formatted, passes static analysis (including the Core
Guidelines checks), passes tests under sanitizers, manages every resource with RAII, validates
untrusted input, avoids undefined behavior, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Compiles clean under the project C++ standard with `-Wall -Wextra -Werror -Wpedantic -Wconversion`.
2. Formatting passes: `clang-format --dry-run --Werror` on changed files.
3. Static analysis passes (clang-tidy with cppcoreguidelines/bugprone, cppcheck, and/or the clang analyzer); findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths; run under AddressSanitizer + UndefinedBehaviorSanitizer.
5. Coverage meets the risk tier (llvm-cov/gcov; see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; headers expose a minimal API; business logic stays out of I/O and glue code.
8. Untrusted input validated — length, bounds, and integer ranges — before use.
9. No secrets committed; sensitive data not logged; secrets zeroized after use.
10. Every resource owned by RAII; ownership explicit (smart pointers, not owning raw pointers); no leaks, use-after-free, double-free, or dangling references/views; rule of 0/3/5 honored.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Disable `-Werror` or suppress warnings to pass.
- Use owning raw pointers, `new`/`delete`, or manual memory management in application code; use C-style casts.
- Cause buffer overflow, out-of-bounds access, use-after-free, double-free, memory leak, uninitialized read, integer overflow, a dangling reference/`string_view`/`span`, iterator invalidation, object slicing, a data race, a throwing destructor, or a narrowing conversion.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Memory/lifetime and untrusted-input
changes are never low tier. In the plan, list which checks apply and state any intentionally excluded
and why.

- **Low** (pure helpers, simple value types, internal refactors, throwaway tools): compile `-Werror`, format, basic tests. MUST 1-4, 9-11.
- **Medium** (classes owning resources, parsers of trusted input, library APIs): + failure-path tests, sanitizer runs, static analysis, coverage. Add MUST 3, 5, 7, 8.
- **High** (core logic, templates, move-heavy types, anything handling sizes/indices/buffers, concurrency): + edge-case and regression tests, coverage thresholds, complexity limits, integer-overflow and lifetime tests. Add MUST 6.
- **Critical** (security, crypto, parsers of untrusted input, network/file-format handling, allocators, lock-free code): + fuzzing, golden/contract tests, error-path tests, ThreadSanitizer/MemorySanitizer where relevant, leak checks. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no sanitizer evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and sanitizer-clean happy paths|
|76-90|Strong implementation with good tests, sanitizer-clean failure paths, low complexity, clean boundaries|
|91-100|Production-grade: strict warnings clean, sanitizer + static-analysis clean, RAII throughout, strong tests, no known memory or UB defects|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
|---|---|
|Does not compile, or `-Werror` disabled to pass|30|
|Compiler warnings present and not justified|65|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Tests not run under AddressSanitizer/UBSan where applicable|70|
|Static analysis (clang-tidy/cppcheck) not run and not explained|70|
|Business/parsing rules without unit tests|60|
|Untrusted input not bounds/length/range validated|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Manual memory/ownership (raw `new`/`delete`, owning raw pointers) without leak/UAF checks|80|
|Critical/untrusted-input code without fuzzing or edge-case tests|85|
|Concurrency code without ThreadSanitizer/data-race evidence|85|
|Known critical bug (overflow/UAF/leak/UB/dangling) remains|50|
|Known security issue remains|45|
|Secrets committed|20|
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Mutation/Fuzz|
|---|---|---|---|
|Core logic / parsing rules|>= 90%|>= 85%|fuzz untrusted parsers|
|Critical security/crypto/format rules|>= 95%|>= 90%|fuzz required|
|Library/module functions|>= 85%|>= 80%|When practical|
|I/O and platform glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|lizard / clang-tidy|
|Function cognitive complexity|<= 10|<= 15|clang-tidy readability-function-cognitive-complexity|
|Function length|<= 30 lines|<= 50 lines|clang-tidy readability-function-size / lizard|
|Translation unit / class length|<= 400 lines|<= 600 lines|review|
|Function parameters|<= 4|<= 6|clang-tidy readability-function-size|
|Nesting depth|<= 2|<= 3|lizard / review|
|Public methods per class|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (RAII/ownership, move semantics, lifetimes/dangling,
templates, concurrency, undefined behavior, parsing untrusted input), open the matching section of
**REFERENCE.md** for detail.
