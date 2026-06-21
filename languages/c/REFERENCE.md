# C Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the C language quality gate for implementation work. Its purpose is to prevent
low-quality C code from being generated, accepted, copied into a project, or treated as complete
without measurable evidence. It is an engineering control document, not a style preference.

C gives direct control over memory and hardware and underpins operating systems, embedded systems,
and performance-critical software. It also has no memory safety, no bounds checking, manual resource
management, weak typing, and a large surface of undefined behavior (UB). C code can compile cleanly,
pass a happy-path test, and still contain buffer overflows, use-after-free, double-free, leaks,
integer overflows, uninitialized reads, data races, and UB that the optimizer turns into security
vulnerabilities. "It compiles" and "it ran once" are weak evidence.

The implementation is complete only when the code compiles clean under strict warnings, is formatted,
passes static analysis, passes meaningful tests under sanitizers, manages every allocation and
resource correctly on every path, validates untrusted input, controls undefined behavior, is secure
by default, and records measurable evidence in `PHASE-RESULT.md`.

Follow this together with project rules: `AGENTS.md`, `PHASE-PLAN*.md`, `architecture.md`,
`.clang-format`, `.clang-tidy`, the build files, and CI definitions. If this file conflicts with a
phase-specific rule, follow the stricter rule unless the deviation is documented in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary of the whole gate. Everything below it is rationale and
detail. At the end of any implementation, verify every item here. If time or context is limited,
obey this core and consult the numbered sections only when a check trips or needs detail.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Compiles clean under the project C standard with `-Wall -Wextra -Werror -Wpedantic -Wconversion`.
2. Formatting passes: `clang-format --dry-run --Werror` on changed files.
3. Static analysis passes (clang-tidy, cppcheck, and/or `-fanalyzer`/scan-build); findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths; run under AddressSanitizer + UndefinedBehaviorSanitizer.
5. Coverage meets the risk tier (gcov/lcov; see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; headers expose a minimal API; business logic stays out of I/O and glue code.
8. Untrusted input validated — length, bounds, and integer ranges — before use.
9. No secrets committed; sensitive data not logged; secrets zeroized after use.
10. Every return value checked; every allocation freed on all paths; no leaks, use-after-free, double-free, or out-of-bounds.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Disable `-Werror` or suppress warnings to pass.
- Use `gets`, `strcpy`/`strcat`/`sprintf`, `scanf("%s")`, or other unbounded copies; leave `malloc`/`realloc`/`calloc` or other return values unchecked.
- Cause buffer overflow, out-of-bounds access, use-after-free, double-free, memory leak, uninitialized read, integer overflow in size/index math, format string from untrusted input, or unchecked NULL dereference.

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. Memory-handling and untrusted-input
changes are never low tier. When planning, list which checks apply and state any intentionally
excluded and why. Detail: "Test Types Required by Risk".

- Low (pure helpers, simple math, internal refactors, throwaway tools): compile `-Werror`, format, basic tests. MUST 1-4, 9-11.
- Medium (modules with allocation/I/O, parsers of trusted input, library functions): add failure-path tests, sanitizer runs, static analysis, coverage. Add MUST 3, 5, 7, 8.
- High (core logic, state machines, size/index/buffer handling, concurrency): add edge-case and regression tests, coverage thresholds, complexity limits, integer-overflow tests. Add MUST 6.
- Critical (security, crypto, parsers of untrusted input, network/file-format handling, allocators): add fuzzing, golden/contract tests, error-path tests, MemorySanitizer/ThreadSanitizer where relevant, leak checks. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code
compiles clean with strict warnings, formatting and static analysis ran, tests ran under sanitizers,
failures were fixed or documented, `PHASE-RESULT.md` was created, and the score is supported by
evidence.

- A passing test alone is not enough: a memory bug or UB may pass a test and corrupt state elsewhere.
- Sanitizer-clean and analyzer-clean evidence is part of "done" for code that touches memory, indices, or untrusted input.
- Any skipped command must include the concrete blocker, not "tool unavailable".

## 2. Toolchain, C Standard, and Build Policy

Use the compiler, C standard, and build system defined by the project. Behavior, available APIs, and
UB rules vary by standard and compiler.

- Always: pin the C standard (`-std=c11`/`c17`/`c23`); document `cc --version`; build with the project's strict warning set; keep local and CI flags aligned.
- Prefer: building with both GCC and Clang where feasible (they catch different issues); `-Wall -Wextra -Werror -Wpedantic -Wconversion -Wshadow` as a baseline; reproducible builds.
- Avoid: relying on compiler extensions without documenting them; depending on implementation-defined behavior; lowering the warning set to compile.
- Almost never: disable `-Werror` to finish; use `-w`; depend on UB "working" under the current optimizer.

## 3. Build Reproducibility and Dependencies

The build must be reproducible from a clean checkout using documented commands.

- Always: commit build files (Makefile/CMakeLists); pin dependency versions; document build and test commands; keep build independent of IDE state.
- Prefer: a small, explicit dependency set; vendored or pinned third-party C with an update and audit policy; out-of-tree builds.
- Avoid: bundling unpinned third-party sources; build steps that fetch from the network silently; system-library assumptions without checks.
- Almost never: depend on a single developer's environment; commit generated objects/binaries.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

Baseline:

```bash
cc --version
cc -std=c17 -Wall -Wextra -Werror -Wpedantic -Wconversion -Wshadow -c src/*.c
clang-format --dry-run --Werror src/*.c src/*.h
clang-tidy src/*.c -- -std=c17
cc -std=c17 -Wall -Wextra -Werror -fsanitize=address,undefined -g src/*.c tests/*.c -o run_tests && ./run_tests
```

Stronger (high/critical):

```bash
cppcheck --error-exitcode=1 --enable=warning,style,performance,portability src
cc -std=c17 -fsanitize=memory ...        # MemorySanitizer (clang) for uninitialized reads
cc -std=c17 -fsanitize=thread ...        # ThreadSanitizer for data races
valgrind --leak-check=full --error-exitcode=1 ./run_tests
cc --coverage src/*.c tests/*.c -o cov && ./cov && gcov -b src/*.c
# Fuzzing for untrusted-input parsers:
clang -fsanitize=fuzzer,address,undefined fuzz/target.c src/parser.c -o fuzz && ./fuzz -max_total_time=60
```

A command not run is not evidence; a command that failed and was ignored is negative evidence.

## 5. Formatting and Style

Use `clang-format`. Do not debate formatting manually.

- Always: run `clang-format --dry-run --Werror`; keep `.clang-format` intentional; format new and changed files.
- Prefer: one project-wide style; consistent brace, pointer, and include ordering via config, not taste; short translation units organized by responsibility.
- Avoid: hand-formatting against the formatter; reformatting unrelated files; clever alignment.
- Almost never: disable formatting checks; commit unformatted code.

## 6. Static Analysis and Compiler Diagnostics

Compiler warnings and static analyzers are correctness signals, not noise. They catch a large share
of C defects before runtime.

- Always: treat warnings as errors; run clang-tidy and/or cppcheck; fix findings or justify them narrowly; run the GCC/Clang static analyzer (`-fanalyzer` / `scan-build`) for non-trivial code.
- Prefer: `bugprone-*`, `cert-*`, and `clang-analyzer-*` clang-tidy checks; cppcheck for additional flow analysis; analyzer runs in CI.
- Avoid: blanket `// NOLINT`; suppressing analyzer findings without a documented reason; assuming a warning is a false positive without proof.
- Almost never: disable diagnostics in security/parsing/memory code; ship code with unaddressed analyzer reports of null deref, overflow, or leak.

## 7. Naming

Names must reveal intent. C has no namespaces, so module prefixes matter.

- Always: prefix public symbols with the module (`http_parse_request`); use clear, consistent casing; name macros in `UPPER_CASE`; name tests by behavior.
- Prefer: domain names over generic ones; `static` for internal linkage; typedef'd opaque structs for public types.
- Avoid: `tmp`, `data`, `buf2`, `do_stuff`; single-letter names outside tiny loops; macros that hide control flow.
- Almost never: collide with standard-library or reserved identifiers (leading underscore + capital, `str*`, `mem*`); use macros where a `static inline` function or enum works.

## 8. Modules, Headers, and Architecture Structure

Structure must reflect architecture. Headers are the public contract; keep them minimal.

- Always: one responsibility per translation unit; expose the minimum in headers; use include guards or `#pragma once`; mark internal functions `static`; keep `#include` order clean.
- Prefer: opaque pointers for encapsulation; a clear separation of core logic, platform/IO, and entry points; headers that compile standalone.
- Avoid: god translation units; leaking internal types/functions through headers; circular includes; business logic in `main` or I/O glue.
- Almost never: put declarations in `.c` files that others depend on; rely on implicit declarations (illegal in modern C); expose mutable globals across modules.

## 9. Architectural Boundaries

Business and parsing logic must be explicit, isolated, and testable independent of I/O.

- Always: keep dependency direction inward; separate pure logic from syscalls/IO; pass buffers and lengths explicitly; test core logic without real I/O.
- Prefer: functions that take `(const uint8_t *data, size_t len, ...)` and return status codes; dependency seams via function pointers where useful; thin `main`.
- Avoid: parsing untrusted bytes directly inside network/file syscalls; global state coupling modules; mixing allocation policy across layers.
- Almost never: make core correctness depend on a specific platform; hide protocol/format decisions inside I/O wrappers.

## 10. Types, Integers, and Representation

Use precise types and treat integer math as a primary bug source.

- Always: use fixed-width types from `<stdint.h>` (`uint32_t`, `size_t` for sizes/indices); check for overflow before size/index arithmetic; be explicit about signedness; initialize variables.
- Prefer: `size_t` for object sizes and counts; `bool` from `<stdbool.h>`; `enum` for closed sets; checked arithmetic (e.g. `__builtin_add_overflow`, or explicit range checks) for size/index math.
- Avoid: mixing signed and unsigned in comparisons; `int` for sizes; implicit narrowing conversions (`-Wconversion` catches these); assuming `char` signedness or integer width.
- Almost never: compute an allocation size by multiplying untrusted values without an overflow check; cast away `const`; rely on signed-overflow wraparound (it is UB).

## 11. Memory Management

Every allocation has exactly one owner and one free, on every path. This is the highest-risk area in
C.

- Always: check the result of `malloc`/`calloc`/`realloc`; free on every path including error paths; set freed pointers to `NULL` where reuse is possible; document ownership at function boundaries.
- Prefer: `calloc` for zero-initialized memory; a single cleanup path (`goto cleanup;` pattern) for functions with multiple resources; arena/pool allocators where lifetimes are bulk; `realloc` into a temporary to avoid leaking the original on failure.
- Avoid: use-after-free, double-free, freeing non-owned pointers, leaking on error returns, returning pointers to stack memory, off-by-one buffer math.
- Almost never: ignore allocation failure; mix allocators (free what another module allocated without a documented contract); rely on the OS to "clean up" leaks in long-running processes.

## 12. Strings and Buffers

C strings are unmanaged byte arrays; nearly every classic CVE lives here.

- Always: track lengths explicitly; ensure NUL termination; bound every copy; validate indices before access.
- Prefer: `snprintf` (check the return), `memcpy` with verified lengths, `strncpy`/`strncat` only with correct sizing and manual termination, or safer wrappers; length-prefixed buffers over NUL-terminated where possible.
- Avoid: `gets` (removed in C11), `strcpy`, `strcat`, `sprintf`, `scanf("%s")`, unbounded `%s` formats; assuming input is NUL-terminated.
- Almost never: compute a destination size from the source without bounds; trust a length field from untrusted input without validating it against the actual buffer.

## 13. Error Handling and Return Values

C signals errors by return value and `errno`. Checking them is mandatory.

- Always: check return values of allocation, I/O, and library calls; propagate errors with clear status codes; clean up resources on error paths; preserve `errno` where relevant.
- Prefer: a consistent status/`enum` error type per module; `goto cleanup` for unified teardown; documenting which functions can fail and how.
- Avoid: ignoring return values (`(void)` only with a justified reason); partial cleanup on error; mixing error conventions within a module.
- Almost never: treat a failed `read`/`write`/`malloc` as success; return success with an uninitialized out-parameter; leak resources because the error path was untested.

## 14. Undefined Behavior

UB is not "works on my machine" — optimizers exploit it, producing security bugs. Avoid it
deliberately.

- Always: avoid signed integer overflow, out-of-bounds access, invalid pointer arithmetic, data races, strict-aliasing violations, and use of uninitialized values; run UBSan.
- Prefer: `memcpy` for type punning over pointer casts; `unsigned` for wraparound-intentional math; well-defined shifts (shift amount < width, non-negative).
- Avoid: dereferencing `NULL`/freed/invalid pointers; reading uninitialized memory; modifying a string literal; aliasing incompatible types.
- Almost never: rely on a specific UB outcome; assume null-deref "just crashes"; ignore a UBSan report.

## 15. Concurrency and Thread Safety

Concurrency must be explicit, bounded, and tested. C gives threads and atomics but no safety.

- Always: protect shared mutable state (`mtx_t`/pthreads mutex or `_Atomic`); define lock ownership and ordering; avoid blocking while holding a lock; run ThreadSanitizer for threaded code.
- Prefer: immutable or thread-local data; `_Atomic`/`<stdatomic.h>` for simple counters/flags; bounded thread pools; documented thread-safety contracts.
- Avoid: data races; lock ordering inversions (deadlock); `volatile` as a synchronization tool (it is not); unsynchronized access to shared structures.
- Almost never: fix a race with `sleep`; share non-thread-safe state across threads without review; ignore a TSan report.

## 16. Resource Management Beyond Memory

Files, sockets, locks, and handles also need deterministic release.

- Always: close every opened file/socket/handle on all paths; release locks in the reverse order of acquisition; check `close`/`fclose` results where data integrity matters.
- Prefer: the `goto cleanup` pattern; RAII-like wrapper helpers; setting handles to an invalid sentinel after release.
- Avoid: leaking descriptors in error paths; double-close; long-held locks across I/O.
- Almost never: rely on process exit to release resources in a long-running service; ignore failed flush/close on critical writes.

## 17. Parsing Untrusted Input

Parsing attacker-controlled bytes is the most security-critical C task.

- Always: validate length and bounds before every read; check integer fields against actual buffer size; reject malformed input explicitly; fuzz the parser.
- Prefer: a `(data, len)` interface with explicit cursor and remaining-bytes checks; table-driven or state-machine parsers; golden tests for valid and malformed inputs.
- Avoid: trusting length/offset fields from input; pointer arithmetic without remaining-length checks; recursive parsing without a depth bound.
- Almost never: parse untrusted input without fuzzing and sanitizer evidence; copy based on an untrusted length without bounds; assume input is well-formed.

## 18. Security Baseline

Security is a quality requirement. Memory-safety defects are security defects.

- Always: validate and bound all external input; use safe formatting; compute sizes with overflow checks; zeroize secrets after use (`explicit_bzero`/`memset_s`); use a CSPRNG for security tokens.
- Prefer: compiler hardening (`-D_FORTIFY_SOURCE=2 -fstack-protector-strong`), ASLR/PIE, RELRO at link; constant-time comparison for secrets; audited crypto libraries.
- Avoid: format strings from input (`printf(user)` → `printf("%s", user)`); `system()`/`popen()` with untrusted input; predictable temp files; integer-overflow-driven allocations.
- Almost never: implement custom crypto; leave secrets in freed memory or logs; use `rand()` for security; disable hardening to make something work.

## 19. Testing Strategy

Tests must prove behavior, run under sanitizers, and cover failure paths.

- Always: add/update tests for changed behavior; test error and boundary paths; run the test binary under ASan + UBSan; keep tests deterministic.
- Prefer: a unit framework (Unity, cmocka, Criterion) or a disciplined custom harness; golden tests for formats/protocols; fuzz targets for untrusted parsers; a fixed clock/seed for reproducibility.
- Avoid: happy-path-only tests; tests that leak or rely on undefined order; assertions without meaning.
- Almost never: claim done for memory/parsing code without sanitizer-clean tests; depend on real network/files where a fake suffices.

## 20. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

### Low-risk
Examples: pure helpers, simple math, internal non-critical refactors, throwaway tools.
Required: compile `-Werror`, clang-format, basic behavior tests.

### Medium-risk
Examples: modules with allocation/I/O, parsers of trusted input, library functions.
Required: unit + failure-path tests, ASan/UBSan test runs, static analysis, coverage.

### High-risk
Examples: core logic, state machines, size/index/buffer handling, concurrency.
Required: the above plus edge-case and regression tests, coverage thresholds, complexity within limits, integer-overflow tests, ThreadSanitizer for threaded code.

### Critical-risk
Examples: security, crypto, parsers of untrusted input, network/file-format handling, allocators.
Required: the above plus fuzzing, golden/contract tests, error/rejection-path tests, leak checks (ASan/valgrind), MemorySanitizer where relevant, security review.

## 21. Coverage and Fuzzing

Coverage is necessary but not sufficient; fuzzing is the strongest evidence for untrusted parsers.

### Default thresholds

|Area|Line|Branch|Mutation/Fuzz|
|---|---|---|---|
|Core logic / parsing rules|>= 90%|>= 85%|fuzz untrusted parsers|
|Critical security/crypto/format rules|>= 95%|>= 90%|fuzz required|
|Library/module functions|>= 85%|>= 80%|When practical|
|I/O and platform glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

- Measure with gcov/lcov. Document shortfalls.
- Fuzz untrusted-input parsers with libFuzzer/AFL under ASan+UBSan; a few seconds of fuzzing often finds bugs unit tests miss.
- Coverage by line alone is not proof — branch coverage and sanitizer-clean failure paths matter more.

## 22. Complexity Limits

Complexity must be actively reduced. If a function, file, or dependency relationship becomes hard to
understand, refactor before declaring completion.

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|lizard / pmccabe|
|Function cognitive complexity|<= 10|<= 15|clang-tidy readability-function-cognitive-complexity|
|Function length|<= 30 lines|<= 50 lines|clang-tidy readability-function-size / lizard|
|Translation unit length|<= 400 lines|<= 600 lines|review|
|Function parameters|<= 4|<= 6|clang-tidy readability-function-size|
|Nesting depth|<= 2|<= 3|lizard / review|
|Public functions per header|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with an explicit reason.

## 23. Quality Score Model

Use this scoring model (0-100):

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no sanitizer evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and sanitizer-clean happy paths|
|76-90|Strong implementation with good tests, sanitizer-clean failure paths, low complexity, clean boundaries|
|91-100|Production-grade: strict warnings clean, sanitizer + static-analysis clean, strong tests, no known memory or UB defects|

### Score caps

Apply these caps unless there is a documented and justified exception.

|Missing or Failed Evidence|Maximum Score|
|---|---|
|Does not compile, or `-Werror` disabled to pass|30|
|Compiler warnings present and not justified|65|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Tests not run under AddressSanitizer/UBSan where applicable|70|
|Static analysis not run and not explained|70|
|Business/parsing rules without unit tests|60|
|Untrusted input not bounds/length/range validated|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Manual memory without leak/UAF checks|80|
|Critical/untrusted-input code without fuzzing or edge-case tests|85|
|Concurrency code without ThreadSanitizer/data-race evidence|85|
|Known critical bug (overflow/UAF/leak/UB) remains|50|
|Known security issue remains|45|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass (compile clean with strict warnings,
format, static analysis, sanitizer-clean tests), critical paths are covered and fuzzed where
relevant, complexity is within limits, architecture is preserved, no known memory/UB/security defects
remain, and `PHASE-RESULT.md` contains evidence.

## 24. Definition of Done

A C phase is done only when: code compiles clean with strict warnings; clang-format passes; static
analysis ran (or is documented); tests pass and meaningful tests were added; tests ran under ASan +
UBSan; coverage meets the tier; complexity is within limits or justified; architecture boundaries
are preserved; every allocation/resource is freed on all paths; untrusted input is validated; no
secrets were introduced; and `PHASE-RESULT.md` exists. For critical code, also: fuzzing, leak checks,
golden/contract tests, error-path tests, and TSan/MSan where relevant.

## 25. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Compiler / warnings results
## Sanitizer results (ASan / UBSan / TSan / MSan)
## Static analysis results (clang-tidy / cppcheck / analyzer)
## Coverage results
## Fuzzing results (if applicable)
## Memory ownership notes
## Architecture boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results, sanitizer/analyzer output, and tests — not by
confidence or appearance.

## 26. Final Checklist

Before sending the final message, verify: compiles clean with strict warnings; clang-format ran;
static analysis ran; tests pass, are meaningful, and ran under ASan + UBSan; coverage measured or
documented; complexity within limits; architecture preserved; every allocation/resource freed on all
paths; untrusted input validated; integer/size math overflow-checked; no secrets committed;
`PHASE-RESULT.md` exists; quality score is evidence-based; remaining work to reach 100 is documented.
