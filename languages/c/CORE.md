# C Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. C has no memory safety, no bounds checking,
and pervasive undefined behavior — "it compiles" and "it ran once" are weak evidence. Implementation
is complete only when the code compiles clean with strict warnings, is formatted, passes static
analysis, passes tests under sanitizers, manages memory and resources correctly on every path,
validates untrusted input, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Compiles clean under the project C standard with `-Wall -Wextra -Werror -Wpedantic -Wconversion`.
2. Formatting passes: `clang-format --dry-run --Werror` on changed files.
3. Static analysis passes (clang-tidy, cppcheck, and/or `-fanalyzer`/scan-build); findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths; run under AddressSanitizer + UndefinedBehaviorSanitizer.
5. Coverage meets the risk tier (gcov/lcov; see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; headers expose a minimal API; business logic stays out of I/O and glue code.
8. Untrusted input validated — length, bounds, and integer ranges — before use.
9. No secrets committed; sensitive data not logged; secrets zeroized after use.
10. Every return value checked; every allocation freed on all paths; no leaks, use-after-free, double-free, or out-of-bounds.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Disable `-Werror` or suppress warnings to pass.
- Use `gets`, `strcpy`/`strcat`/`sprintf`, `scanf("%s")`, or other unbounded copies; leave `malloc`/`realloc`/`calloc` or other return values unchecked.
- Cause buffer overflow, out-of-bounds access, use-after-free, double-free, memory leak, uninitialized read, integer overflow in size/index math, format string from untrusted input, or unchecked NULL dereference.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway tool; do not ship business or parsing logic with only low-tier checks. In the plan, list
which checks apply and state any intentionally excluded and why.

- **Low** (pure helpers, simple math, internal refactors, throwaway tools): compile `-Werror`, format, basic tests. MUST 1-4, 9-11.
- **Medium** (modules with allocation/I/O, parsers of trusted input, library functions): + failure-path tests, sanitizer runs, static analysis, coverage. Add MUST 3, 5, 7, 8.
- **High** (core logic, state machines, anything handling sizes/indices/buffers, concurrency): + edge-case and regression tests, coverage thresholds, complexity limits, integer-overflow tests. Add MUST 6.
- **Critical** (security, crypto, parsers of untrusted input, network/file format handling, memory allocators): + fuzzing, golden/contract tests, error-path tests, MemorySanitizer/ThreadSanitizer where relevant, leak checks. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no sanitizer evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and sanitizer-clean happy paths|
|76-90|Strong implementation with good tests, sanitizer-clean failure paths, low complexity, clean boundaries|
|91-100|Production-grade: strict warnings clean, sanitizer + static-analysis clean, strong tests, no known memory or UB defects|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
|---|---|
|Does not compile, or `-Werror` disabled to pass|30|
|Compiler warnings present and not justified|65|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Tests not run under AddressSanitizer/UBSan where applicable|70|
|Static analysis (clang-tidy/cppcheck/analyzer) not run and not explained|70|
|Business/parsing rules without unit tests|60|
|Untrusted input not bounds/length/range validated|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Memory managed manually without leak/UAF checks|80|
|Critical/untrusted-input code without fuzzing or edge-case tests|85|
|Concurrency code without ThreadSanitizer/data-race evidence|85|
|Known critical bug (overflow/UAF/leak/UB) remains|50|
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
|Function cyclomatic complexity|<= 8|<= 10|lizard / pmccabe|
|Function cognitive complexity|<= 10|<= 15|clang-tidy readability-function-cognitive-complexity|
|Function length|<= 30 lines|<= 50 lines|clang-tidy readability-function-size / lizard|
|Translation unit length|<= 400 lines|<= 600 lines|review|
|Function parameters|<= 4|<= 6|clang-tidy readability-function-size|
|Nesting depth|<= 2|<= 3|lizard / review|
|Public functions per header|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (memory management, integer overflow, concurrency,
parsing untrusted input, undefined behavior, the build/toolchain), open the matching section of
**REFERENCE.md** for detail.
