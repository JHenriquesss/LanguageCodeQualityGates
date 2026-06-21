# C++ Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the C++ language quality gate for implementation work. Its purpose is to
prevent low-quality C++ code from being generated, accepted, copied into a project, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

C++ offers powerful abstractions — RAII, templates, move semantics, the STL — but it also has manual
object lifetimes, no bounds checking, and a vast surface of undefined behavior. C++ code can compile
and pass a happy-path test and still contain buffer overflows, use-after-free, double-free, leaks,
dangling references and views, iterator invalidation, object slicing, data races, integer overflow,
and UB the optimizer turns into security bugs. "It compiles" and "it ran once" are weak evidence.

The implementation is complete only when the code compiles clean under strict warnings, is formatted,
passes static analysis (including the Core Guidelines checks), passes meaningful tests under
sanitizers, manages every resource with RAII, validates untrusted input, avoids undefined behavior,
is secure by default, and records measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult the numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Compiles clean under the project C++ standard with `-Wall -Wextra -Werror -Wpedantic -Wconversion`.
2. Formatting passes: `clang-format --dry-run --Werror` on changed files.
3. Static analysis passes (clang-tidy with cppcoreguidelines/bugprone, cppcheck, and/or the clang analyzer); findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths; run under AddressSanitizer + UndefinedBehaviorSanitizer.
5. Coverage meets the risk tier (llvm-cov/gcov; see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; headers expose a minimal API; business logic stays out of I/O and glue code.
8. Untrusted input validated — length, bounds, and integer ranges — before use.
9. No secrets committed; sensitive data not logged; secrets zeroized after use.
10. Every resource owned by RAII; ownership explicit (smart pointers, not owning raw pointers); no leaks, use-after-free, double-free, or dangling references/views; rule of 0/3/5 honored.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Disable `-Werror` or suppress warnings to pass.
- Use owning raw pointers, `new`/`delete`, or manual memory management in application code; use C-style casts.
- Cause buffer overflow, out-of-bounds access, use-after-free, double-free, memory leak, uninitialized read, integer overflow, a dangling reference/`string_view`/`span`, iterator invalidation, object slicing, a data race, a throwing destructor, or a narrowing conversion.

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. Memory/lifetime and untrusted-input
changes are never low tier. When planning, list which checks apply and state any intentionally
excluded and why. Detail: "Test Types Required by Risk".

- Low (pure helpers, simple value types, internal refactors, throwaway tools): compile `-Werror`, format, basic tests. MUST 1-4, 9-11.
- Medium (classes owning resources, parsers of trusted input, library APIs): add failure-path tests, sanitizer runs, static analysis, coverage. Add MUST 3, 5, 7, 8.
- High (core logic, templates, move-heavy types, size/index/buffer handling, concurrency): add edge-case and regression tests, coverage thresholds, complexity limits, integer-overflow and lifetime tests. Add MUST 6.
- Critical (security, crypto, parsers of untrusted input, network/file-format handling, allocators, lock-free code): add fuzzing, golden/contract tests, error-path tests, ThreadSanitizer/MemorySanitizer where relevant, leak checks. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code
compiles clean with strict warnings, formatting and static analysis ran, tests ran under sanitizers,
failures were fixed or documented, `PHASE-RESULT.md` was created, and the score is supported by
evidence. A passing test alone is not enough: a lifetime or UB bug may pass a test and corrupt state
elsewhere. Sanitizer-clean and analyzer-clean evidence is part of "done" for code that touches memory,
ownership, lifetimes, indices, or untrusted input.

## 2. Toolchain, Standard, and Build

Use the compiler, C++ standard, and build system defined by the project.

- Always: pin the standard (`-std=c++17`/`c++20`/`c++23`); document `c++ --version`; build with the project strict warning set; keep local and CI flags aligned.
- Prefer: building with both GCC and Clang where feasible (they catch different issues); `-Wall -Wextra -Werror -Wpedantic -Wconversion -Wshadow -Wold-style-cast`; CMake with targets and `target_compile_options`; reproducible builds.
- Avoid: relying on compiler extensions without documenting them; depending on implementation-defined behavior; lowering the warning set to compile.
- Almost never: disable `-Werror` to finish; use `-w`; depend on UB "working" under the current optimizer.

## 3. Build Reproducibility and Dependencies

The build must be reproducible from a clean checkout using documented commands.

- Always: commit build files (CMakeLists); pin dependency versions (vcpkg/Conan manifests or pinned submodules); document build and test commands; keep the build independent of IDE state.
- Prefer: a small, explicit dependency set; package-manager manifests with lock/version pinning; out-of-tree builds; treating third-party headers as system includes to avoid their warnings polluting yours.
- Avoid: bundling unpinned third-party sources; build steps that fetch from the network silently; relying on system-library versions without checks.
- Almost never: depend on a single developer's environment; commit generated objects/binaries.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
c++ --version
c++ -std=c++20 -Wall -Wextra -Werror -Wpedantic -Wconversion -Wshadow -c src/*.cpp
clang-format --dry-run --Werror src/*.cpp src/*.hpp
clang-tidy src/*.cpp -- -std=c++20
c++ -std=c++20 -Wall -Wextra -Werror -fsanitize=address,undefined -g src/*.cpp tests/*.cpp -o run_tests && ./run_tests
```

Stronger (high/critical): `cppcheck --enable=warning,style,performance,portability --error-exitcode=1`,
`-fsanitize=thread` (ThreadSanitizer) for concurrency, `-fsanitize=memory` (clang MSan) for
uninitialized reads, `valgrind --leak-check=full`, `llvm-cov`/`gcov` for coverage, and libFuzzer/AFL
under ASan+UBSan for untrusted-input parsers. A command not run is not evidence; a command that failed
and was ignored is negative evidence.

## 5. Formatting and Style

Use `clang-format`. Do not debate formatting manually.

- Always: run `clang-format --dry-run --Werror`; keep `.clang-format` intentional; format new and changed files.
- Prefer: one project-wide style; consistent include ordering and grouping; short translation units organized by responsibility; declarations close to use.
- Avoid: hand-formatting against the formatter; reformatting unrelated files; clever alignment.
- Almost never: disable formatting checks; commit unformatted code.

## 6. Static Analysis and the Core Guidelines

Compiler warnings and static analyzers catch a large share of C++ defects before runtime; the
C++ Core Guidelines (via `clang-tidy cppcoreguidelines-*`) target ownership, lifetimes, and bounds.

- Always: treat warnings as errors; run clang-tidy with `cppcoreguidelines-*` and `bugprone-*`; run cppcheck; fix findings or justify them narrowly with a `// NOLINT(check) // reason`.
- Prefer: the clang static analyzer / `scan-build` for non-trivial code; the GSL (`gsl::not_null`, `gsl::span`) where it clarifies contracts; lifetime/ownership checks enabled.
- Avoid: blanket `// NOLINT`; suppressing analyzer findings without a documented reason; assuming a warning is a false positive without proof.
- Almost never: disable diagnostics in security/parsing/memory code; ship code with unaddressed reports of null deref, overflow, leak, or use-after-free.

## 7. Naming, Headers, and Architecture

Names must reveal intent; headers are the public contract — keep them minimal.

- Always: use domain language and a consistent casing/namespace convention; prefix or namespace public symbols; one responsibility per translation unit; expose the minimum in headers; use include guards or `#pragma once`; keep internal helpers in anonymous namespaces or `static`.
- Prefer: a `domain`/`application`/`infrastructure` separation; PIMPL or opaque types for ABI/encapsulation; headers that compile standalone; forward declarations to cut include coupling.
- Avoid: god headers/translation units; leaking internal types through public headers; circular includes; business logic in `main` or I/O glue; macros where `constexpr`/`inline`/templates work.
- Almost never: put definitions of externally used symbols in `.cpp` headers-style; rely on transitive includes; expose mutable globals across modules.

## 8. Types, Values, and Integers

Use the type system to make invalid states hard to represent, and treat integer math as a primary
bug source.

- Always: use fixed-width types (`<cstdint>`) and `std::size_t` for sizes/indices; check for overflow before size/index arithmetic; be explicit about signedness; initialize every variable (prefer `{}` to avoid narrowing); enforce class invariants in constructors.
- Prefer: strong types/`enum class` over bare primitives and ints; `std::optional`/`std::expected` for absence/failure; `constexpr` for compile-time constants; `gsl::narrow`/explicit checks for conversions.
- Avoid: mixing signed/unsigned in comparisons (`-Wconversion`/`-Wsign-conversion`); narrowing conversions; `int` for sizes; C-style casts; assuming `char` signedness or integer width.
- Almost never: compute an allocation size from untrusted values without an overflow check; `const_cast` away const to mutate; rely on signed-overflow wraparound (UB).

```cpp
// Strong type with an enforced invariant: an invalid EmployeeId cannot exist.
class EmployeeId {
public:
    static std::optional<EmployeeId> parse(std::string_view raw) {
        if (raw.size() != 8 || !std::ranges::all_of(raw, ::isdigit)) {
            return std::nullopt;
        }
        return EmployeeId{std::string{raw}};
    }
    const std::string& value() const noexcept { return value_; }

private:
    explicit EmployeeId(std::string v) : value_{std::move(v)} {}
    std::string value_;
};

// Closed state set: a std::variant makes illegal states unrepresentable.
struct Draft {};
struct Signed { std::string signature_id; };
struct Sent { std::string protocol; };
using Event = std::variant<Draft, Signed, Sent>;
```

## 9. RAII and Resource Management

Every resource (memory, file, socket, lock, handle) is owned by an object whose destructor releases
it. This is the central C++ discipline.

- Always: acquire resources in constructors and release in destructors; use `std::unique_ptr`/`std::shared_ptr` and standard containers instead of raw `new`/`delete`; make ownership explicit in signatures (`unique_ptr` = transfer, `T&`/`T*` = borrow, no ownership); follow the rule of 0 (or 3/5 when managing a resource directly).
- Prefer: the rule of zero — let members' destructors do the work; `std::make_unique`/`std::make_shared`; `std::lock_guard`/`std::scoped_lock` for mutexes; custom deleters for C handles; `std::span`/`std::string_view` for non-owning views (mind their lifetime).
- Avoid: owning raw pointers; manual `new`/`delete` in application code; `std::shared_ptr` where `unique_ptr` suffices; returning pointers/references to local or freed objects.
- Almost never: write a destructor that throws; manage the same resource in two places; rely on the OS to reclaim leaks in long-running processes.

```cpp
// Rule of zero: ownership via a smart pointer with a custom deleter; no manual cleanup.
class TempFile {
public:
    explicit TempFile(const char* path)
        : handle_{std::fopen(path, "w"), &std::fclose} {
        if (!handle_) throw std::runtime_error("cannot open temp file");
    }
    std::FILE* get() const noexcept { return handle_.get(); }

private:
    std::unique_ptr<std::FILE, decltype(&std::fclose)> handle_;
    // No destructor, copy, or move needed — the unique_ptr handles it (rule of 0).
};
```

## 10. Move Semantics, Copies, and the Rule of 0/3/5

Moves and copies must preserve invariants and never leak or double-free.

- Always: follow the rule of zero where possible; if you declare any of destructor/copy/move, declare the full set (rule of 3/5) consistently; leave moved-from objects valid (destructible and assignable); mark move operations `noexcept` when they are.
- Prefer: value semantics; `= default`/`= delete` to be explicit; passing by value + `std::move` for sink parameters; passing large read-only objects by `const&`.
- Avoid: shallow copies of owning types; copies in hot paths where a move or reference works; self-move/self-copy bugs; returning by `const` value (blocks moves).
- Almost never: hand-write copy/move that can double-free or leak on exception; leave a moved-from object in an invalid state; `std::move` a `const` object (silently copies).

## 11. References, Lifetimes, and Views

Dangling references and views are a top C++ defect class; non-owning types do not extend lifetime.

- Always: ensure a reference/pointer/`string_view`/`span` does not outlive the object it refers to; document and respect borrow lifetimes; return owning types when the callee's data must outlive the call.
- Prefer: returning by value or owning types from factory/accessor functions; `std::span`/`std::string_view` only for parameters whose argument clearly outlives the call; range-for over manual iterators.
- Avoid: returning references/views to locals or temporaries; storing a `string_view`/`span` that may outlive its backing store; capturing references in lambdas that escape the current scope; dangling iterators after container mutation.
- Almost never: bind a `string_view` to a temporary `std::string`; keep a `span` into a vector across operations that can reallocate it; return `c_str()` of a temporary.

## 12. Error Handling

Distinguish programmer bugs, recoverable failures, and exceptional conditions; choose exceptions or
`std::expected`/error codes per project policy, with stable semantics.

- Always: handle fallible operations deliberately; preserve context; provide the strong or basic exception-safety guarantee where it matters; keep destructors and move operations `noexcept`; mark functions that cannot throw `noexcept`; test failure paths.
- Prefer: exceptions for exceptional/unrecoverable failures and `std::expected<T, E>` (or a result type) for expected business outcomes; RAII so partial operations unwind cleanly; specific exception types over `std::runtime_error` everywhere.
- Avoid: throwing from destructors; using exceptions for ordinary control flow in hot paths; catching `...` and swallowing; error codes that callers ignore (mark `[[nodiscard]]`); leaking resources on the error path.
- Almost never: let an exception escape a `noexcept` function (it calls `std::terminate`); swallow security/persistence/parse failures; leak or corrupt state when an operation throws midway.

```cpp
enum class SendError { Invalid, Rejected, Transport };

// Expected models the recoverable outcome; the caller must handle it ([[nodiscard]]).
[[nodiscard]] std::expected<Receipt, SendError> send(const Request& req) {
    auto body = encode(req);
    if (!body) return std::unexpected(SendError::Invalid);
    if (auto rc = transport.post(*body); rc != 0) {
        return std::unexpected(SendError::Transport);
    }
    return Receipt{};
}
```

## 13. Undefined Behavior

UB is not "works on my machine" — optimizers exploit it, producing security bugs. Avoid it
deliberately and run UBSan.

- Always: avoid signed overflow, out-of-bounds access, invalid pointer/iterator use, data races, strict-aliasing violations, and reads of uninitialized values; run UBSan; prefer `.at()`/bounds-checked access at trust boundaries.
- Prefer: `std::bit_cast`/`memcpy` for type punning; `unsigned` for intentional wraparound; well-defined shifts; `std::launder` only when truly required and understood.
- Avoid: dereferencing null/dangling pointers; reading uninitialized memory; modifying objects through incompatible types; using an iterator after the container changed.
- Almost never: rely on a specific UB outcome; assume null-deref "just crashes"; ignore a UBSan or sanitizer report.

## 14. Templates and Generic Code

Templates are powerful but can hide complexity and produce unreadable errors.

- Always: keep template interfaces clear; constrain templates with concepts (C++20) or `static_assert`/SFINAE; document requirements on type parameters; test representative instantiations.
- Prefer: concepts for readable constraints and errors; `if constexpr` over tag dispatch where it clarifies; small, focused templates; standard algorithms over hand-rolled loops.
- Avoid: deep template metaprogramming that maintainers cannot follow; unconstrained templates that accept wrong types with cryptic errors; ODR violations across translation units.
- Almost never: hide business rules in template specializations; rely on undefined instantiation behavior; expose complex template APIs in application code without tests.

## 15. Concurrency and Thread Safety

Concurrency must be explicit, bounded, and tested; C++ gives threads and atomics but no safety.

- Always: protect shared mutable state with a mutex (`std::scoped_lock`) or use `std::atomic`; define lock ownership and ordering; avoid blocking while holding a lock; prefer immutable or thread-local data; run ThreadSanitizer for threaded code.
- Prefer: `std::jthread` with stop tokens; thread pools and bounded queues; `std::atomic` for simple counters/flags; structured ownership of shared state; `std::shared_mutex` for read-heavy data.
- Avoid: data races; lock-ordering inversions (deadlock); `volatile` as synchronization (it is not); unsynchronized access to shared containers; spawning unbounded threads.
- Almost never: fix a race with `sleep`; write lock-free code without TSan and expert review; ignore a TSan report; share a non-thread-safe object across threads without synchronization.

## 16. The STL, Containers, and Iterators

Use the standard library; misuse around iterators and views is a common defect source.

- Always: choose containers by behavior; reserve capacity when size is known; keep ordering explicit; respect iterator-invalidation rules (e.g. `push_back` may invalidate; `erase` returns the next iterator).
- Prefer: `std::vector` by default; `std::array` for fixed size; `std::string`/`std::string_view`; standard algorithms and ranges over manual loops; `.at()` at trust boundaries, `operator[]` only where the index is proven in range.
- Avoid: using an iterator after the container was modified; `operator[]` on untrusted indices; copying large containers in hot paths; depending on unordered-container iteration order.
- Almost never: hold iterators/pointers/references across operations that can reallocate; return iterators into a local container; mutate a container while iterating it in a way that invalidates the loop.

## 17. Parsing Untrusted Input and Security

Parsing attacker-controlled bytes is the most security-critical C++ task; memory-safety defects are
security defects.

- Always: validate length and bounds before every read; check integer fields against the actual buffer size; reject malformed input explicitly; fuzz the parser; treat all external input (files, network, env, args) as untrusted; use bounds-checked access at boundaries; zeroize secrets after use.
- Prefer: a `std::span<const std::byte>` interface with explicit cursor/remaining-length checks; state-machine or table-driven parsers; compiler/linker hardening (`-D_FORTIFY_SOURCE=2 -fstack-protector-strong`, PIE, RELRO); audited crypto libraries; constant-time comparison for secrets; a CSPRNG (`std::random_device` is not one for security — use a vetted library).
- Avoid: trusting length/offset fields; pointer/iterator arithmetic without remaining-length checks; recursive parsing without a depth bound; format strings from input; `system()`/`std::system` with untrusted input; predictable temp files.
- Almost never: parse untrusted input without fuzzing and sanitizer evidence; copy based on an untrusted length without bounds; implement custom crypto; store secrets in source control; disable hardening to make something work.

## 18. Dependencies and Supply Chain

- Always: justify each dependency; pin versions (vcpkg/Conan/submodules); review license, native code, and build-time behavior; run vulnerability checks where configured; keep third-party headers isolated from your warning set.
- Prefer: the standard library and well-maintained libraries; minimal dependency graphs; package-manager manifests with lock files; small, regular updates.
- Avoid: vendoring unpinned sources; header-only libraries that pull large transitive trees; abandoned dependencies for critical paths.
- Almost never: pull dependencies over the network during the normal build; accept a critical advisory without a compensating control; depend on unmaintained crypto/parsing libraries.

## 19. Testing Strategy

Tests must prove behavior, run under sanitizers, and cover failure paths.

- Always: add/update tests for changed behavior; test error and boundary paths; run the test binary under ASan + UBSan; keep tests deterministic; test lifetime/ownership behavior for resource-managing types.
- Prefer: a unit framework (GoogleTest, Catch2, doctest); golden tests for formats/protocols; fuzz targets for untrusted parsers; property tests for algorithms; a fixed clock/seed for reproducibility; TSan for threaded code.
- Avoid: happy-path-only tests; tests that leak or rely on undefined order; assertions without meaning.
- Almost never: claim done for memory/parsing/concurrency code without sanitizer-clean tests; depend on real network/files where a fake suffices.

## 20. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (pure helpers, simple value types, internal refactors, throwaway tools): compile `-Werror`, clang-format, basic behavior tests.
- **Medium** (classes owning resources, parsers of trusted input, library APIs): unit + failure-path tests, ASan/UBSan runs, static analysis, coverage.
- **High** (core logic, templates, move-heavy types, size/index/buffer handling, concurrency): the above plus edge-case and regression tests, coverage thresholds, complexity within limits, integer-overflow and lifetime tests, ThreadSanitizer for threaded code.
- **Critical** (security, crypto, parsers of untrusted input, network/file-format handling, allocators, lock-free code): the above plus fuzzing, golden/contract tests, error/rejection-path tests, leak checks (ASan/valgrind), MemorySanitizer where relevant, security review.

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

Measure with llvm-cov/gcov. Fuzz untrusted-input parsers with libFuzzer/AFL under ASan+UBSan. Branch
coverage and sanitizer-clean failure paths matter more than raw line percentage.

## 22. Complexity Limits

Complexity must be actively reduced. If a function, class, file, or dependency relationship becomes
hard to understand, refactor before declaring completion.

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|lizard / clang-tidy|
|Function cognitive complexity|<= 10|<= 15|clang-tidy readability-function-cognitive-complexity|
|Function length|<= 30 lines|<= 50 lines|clang-tidy readability-function-size / lizard|
|Translation unit / class length|<= 400 lines|<= 600 lines|review|
|Function parameters|<= 4|<= 6|clang-tidy readability-function-size|
|Nesting depth|<= 2|<= 3|lizard / review|
|Public methods per class|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with an explicit reason.

## 23. Quality Score Model

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no sanitizer evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and sanitizer-clean happy paths|
|76-90|Strong implementation with good tests, sanitizer-clean failure paths, low complexity, clean boundaries|
|91-100|Production-grade: strict warnings clean, sanitizer + static-analysis clean, RAII throughout, strong tests, no known memory or UB defects|

### Score caps

|Missing or Failed Evidence|Maximum Score|
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
|Manual memory/ownership without leak/UAF checks|80|
|Critical/untrusted-input code without fuzzing or edge-case tests|85|
|Concurrency code without ThreadSanitizer/data-race evidence|85|
|Known critical bug (overflow/UAF/leak/UB/dangling) remains|50|
|Known security issue remains|45|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass (compile clean with strict warnings,
format, static analysis, sanitizer-clean tests), resources are RAII-managed, critical paths are
covered and fuzzed where relevant, complexity is within limits, architecture is preserved, no known
memory/UB/security defects remain, and `PHASE-RESULT.md` contains evidence.

## 24. Definition of Done

Compiles clean with strict warnings; clang-format passes; static analysis ran (or documented); tests
pass and meaningful tests were added; tests ran under ASan + UBSan; coverage meets the tier;
complexity within limits or justified; architecture boundaries preserved; every resource is
RAII-managed with explicit ownership; untrusted input validated; no secrets introduced; and
`PHASE-RESULT.md` exists. For critical code, also fuzzing, leak checks, golden/contract tests,
error-path tests, and TSan/MSan where relevant.

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
## Ownership / lifetime notes
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

Compiles clean with strict warnings; clang-format ran; static analysis ran; tests pass, are
meaningful, and ran under ASan + UBSan; coverage measured or documented; complexity within limits;
architecture preserved; every resource RAII-managed with explicit ownership; no owning raw
pointers/`new`/`delete` in application code; no dangling references/views; untrusted input validated;
integer/size math overflow-checked; no secrets committed; `PHASE-RESULT.md` exists; quality score is
evidence-based; remaining work to reach 100 is documented.
