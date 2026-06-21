# Rust Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the Rust language quality gate for implementation work. Its purpose is to
prevent low-quality Rust code from being generated, accepted, copied into a project, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

Rust gives strong compile-time guarantees, but Rust code can still be architecturally wrong,
over-abstracted, panic-prone, under-tested, dependency-heavy, supply-chain risky, cancellation-unsafe,
`unsafe`-heavy without justification, semver-breaking, and business-incorrect even when it compiles
and is memory-safe. "It compiles" is necessary, not sufficient.

The implementation is complete only when the code compiles, is formatted, passes Clippy, has
meaningful tests, preserves architectural boundaries, models errors explicitly, avoids unnecessary
panics and `unsafe`, handles async and concurrency deliberately, controls dependency and feature
sprawl, is secure by default, and records measurable evidence in `PHASE-RESULT.md`.

Follow this together with project rules (`AGENTS.md`, `architecture.md`, `Cargo.toml`,
`rust-toolchain.toml`, CI). If this file conflicts with a phase-specific rule, follow the stricter
rule unless the deviation is documented in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item here at the end of any implementation; consult the numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Code compiles from a clean checkout: `cargo check --workspace --all-targets --all-features`.
2. Formatting passes: `cargo fmt --all -- --check`.
3. Lint passes with no new warnings: `cargo clippy --workspace --all-targets --all-features -- -D warnings`; suppressions narrow and justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `cargo test --workspace --all-features`.
5. Coverage meets the risk tier (see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of handlers, persistence, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors modeled with `Result`/typed errors; no swallowed failures.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress Clippy/compiler warnings to pass.
- Use `unwrap`/`expect`/`panic!` for recoverable failures, or `unsafe` without isolation, `// SAFETY:` justification, and Miri/tests.

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway script; do not ship business rules with only low-tier checks. When planning, list which
checks apply and state any intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (helpers, simple data types, internal refactors, throwaway scripts): build, format, clippy, basic behavior tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters): add failure-path tests, integration at seams, coverage. Add MUST 5, 7, 8.
- High (core business rules, state transitions, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, financial, audit, data integrity, safety-critical, `unsafe`): add golden/contract tests, error/rejection paths, audit/traceability, Miri for `unsafe`, mutation or fuzz where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code
compiles, formatting and Clippy ran, tests ran, applicable gates ran, failures were fixed or
documented, `PHASE-RESULT.md` was created, and the score is supported by evidence. A passing
`cargo test` alone is not enough when the phase changed dependencies, public API, persistence,
serialization, concurrency, security behavior, or features. Any skipped command must include the
concrete blocker.

## 2. Toolchain, Edition, and MSRV

Use the toolchain, edition, and MSRV defined by the project.

- Always: use `rust-toolchain.toml`/the project edition/MSRV; document `rustc`/`cargo` versions; keep local and CI flags aligned; use stable Rust unless nightly is explicitly required.
- Prefer: a current stable compiler; `rust-version` in `Cargo.toml` for libraries; boring idiomatic Rust over clever Rust; documented migration notes when raising edition/MSRV.
- Avoid: relying on whatever toolchain is installed; using nightly features to bypass design problems; letting a dependency silently raise the MSRV.
- Almost never: ship nightly-only features in production without a documented reason; disable warnings globally to finish.

## 3. Cargo and Build Reproducibility

The build must be reproducible from a clean checkout using documented Cargo commands.

- Always: commit `Cargo.lock` for binaries/applications; follow project policy for libraries; keep features explicit; use `--locked` in verification where reproducibility matters; document build commands.
- Prefer: workspace-level dependency and lint configuration; a small dependency graph; `cargo tree` checks for non-trivial dependency changes.
- Avoid: path/git dependencies without pinned revisions; unnecessary default features; build scripts that perform network I/O or hide logic.
- Almost never: delete `Cargo.lock` to make resolution pass; use `build.rs` as an architecture escape hatch; make the build depend on uncommitted files.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
rustc --version && cargo --version
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo check --workspace --all-targets --all-features
cargo test --workspace --all-features
```

Stronger (applications/critical code): `--locked` builds; `cargo llvm-cov` for coverage;
`cargo nextest run`; `cargo miri test` for `unsafe`; `cargo audit` and `cargo deny check` for supply
chain; `cargo semver-checks` for public libraries; feature-matrix checks (`--no-default-features`,
`--all-features`). A command not run is not evidence; a command that failed and was ignored is
negative evidence.

## 5. Formatting and Clippy

`rustfmt` and Clippy are quality gates, not suggestions.

- Always: run `cargo fmt -- --check`; run Clippy with `-D warnings`; fix offenses or use narrow `#[allow(...)]` with a reason; keep imports and module order clean.
- Prefer: default rustfmt; strict Clippy lints for critical crates (`unwrap_used`, `expect_used`, `panic`, `indexing_slicing`, `todo`, `dbg_macro`); CI-equivalent commands.
- Avoid: `#![allow(clippy::all)]`; suppressing correctness/suspicious lints; leaving `dbg!`, `todo!`, `unimplemented!` in production.
- Almost never: disable Clippy in critical crates; suppress panic/unwrap lints in security, persistence, or signing code.

## 6. Naming

Names must reveal intent. A maintainer should understand a type, trait, function, or test without
reading the implementation.

- Always: use domain language; Rust conventions (snake_case fns/vars, CamelCase types/traits, SCREAMING_SNAKE_CASE consts); name tests by behavior; use newtypes for important domain values; distinguish raw vs validated data in names.
- Prefer: `EmployeeId(String)` over raw `String`; `validate_event_version` over `process_version`; `RawPayload`/`ValidatedPayload`.
- Avoid: `helper`, `utils`, `common`, `manager`, `processor`, `handler`, `data`; ambiguous traits like `Processor`/`Manager`; single-letter names outside tiny scopes.
- Almost never: placeholder names in production; let generated names define the domain vocabulary.

## 7. Modules, Crates, and Architecture Structure

Modules and crates reflect architecture; visibility makes invalid dependencies hard.

- Always: keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport models separate from domain; use `pub(crate)` over `pub` when external visibility is not needed; keep public surface small.
- Prefer: a clear layout (`domain`, `application`, `infrastructure`, `api`) and workspaces for larger systems; `internal`-style private modules; minimal re-exports.
- Avoid: a giant `lib.rs`/`main.rs`; a `mod utils` grab-bag; domain modules importing infrastructure; re-exporting everything from the crate root.
- Almost never: business rules in handlers, adapters, serializers, or CLI parsing; a `common` module that becomes a dumping ground.

## 8. Architectural Boundaries

Business rules must be explicit, isolated, and tested; use the module system to enforce boundaries.

- Always: keep dependency direction inward; put business rules in domain/application; put side effects in adapters; use traits/ports at boundaries; keep handlers thin; test boundary mappers.
- Prefer: domain types with invariants; application services for orchestration; adapters outside the core; domain errors separate from infrastructure errors.
- Avoid: domain depending on SQL/HTTP/serde/logging frameworks; handlers calling the database directly for workflows; provider payloads leaking into core logic; business rules in serde attributes.
- Almost never: hide business decisions in queries or serialization; change architecture in a phase without documenting it; put audit decisions in logging side effects.

## 9. Type System as a Quality Tool

Use the type system to make invalid states unrepresentable.

- Always: use newtypes for identifiers and constrained values; enums for closed state sets; structs for grouped data; enforce invariants at construction; use `TryFrom` for fallible conversion.
- Prefer: `EventVersion` with validation over raw `String`; `DateRange` over two unrelated dates; enum state machines; `NonZero*` where zero is invalid; `#[non_exhaustive]` on public enums where future variants are likely.
- Avoid: `HashMap<String, String>` or `serde_json::Value` as a domain model; boolean flags that change behavior; `Option<T>` for required fields; primitive obsession.
- Almost never: represent important state as arbitrary strings; use comments to describe invariants the type system could enforce.

## 10. Ownership, Borrowing, and Lifetimes

Ownership should make code safer and simpler, not cleverer.

- Always: choose ownership deliberately; borrow when data need not be owned; clone only when justified; keep lifetimes simple; make ownership transfer obvious in signatures.
- Prefer: owned data at boundaries; borrowed views internally where performance matters; `Arc<T>` only for genuine shared ownership across threads; `Cow` only where it clearly reduces allocation.
- Avoid: cloning to silence the borrow checker; lifetime-heavy public APIs; returning references to complex internal state; `Rc<RefCell<T>>`/`Arc<Mutex<T>>` to avoid better design.
- Almost never: use raw pointers or `Box::leak` to dodge ownership design; default to interior mutability.

## 11. Error Handling

Use `Result` for recoverable failures; reserve panic for programmer bugs and impossible states.

- Always: return `Result<T, E>`; define meaningful error types; preserve source errors; convert infrastructure errors at boundaries; test failure paths; distinguish business rejection from technical failure.
- Prefer: `thiserror` for library/domain errors; `anyhow` for binaries/top-level; `#[from]` only where conversion preserves meaning; user-safe messages plus internal traceability; separate error types per layer.
- Avoid: `anyhow::Error` in public library APIs; stringly typed errors; `.unwrap()`/`.expect("should work")`; returning `Option` when the failure reason matters; collapsing all failures into one error.
- Almost never: panic for recoverable I/O/parse/persistence/integration failures; swallow errors; convert every error to a `String` and lose structure.

## 12. Panic, `unwrap`, `expect`, `todo`, `unreachable`

Production Rust must not rely on panics for normal control flow.

- Always: avoid `unwrap`/`expect` in production paths (use `?`, `ok_or_else`, `let ... else`); remove `todo!`/`unimplemented!`/`dbg!`; document any intentional production panic.
- Prefer: `?` with meaningful conversion; exhaustive `match`; `debug_assert!` for internal invariants in debug builds.
- Avoid: `unwrap` after parsing/serialization/I/O/network; `unreachable!` for external state; `panic!` in library APIs; panicking in `Drop` or while holding a lock.
- Almost never: `unwrap_unchecked`/`unreachable_unchecked`; leave `todo!()` and call it complete.

## 13. Unsafe Rust

`unsafe` is forbidden by default unless the phase explicitly requires it.

- Always: use `#![forbid(unsafe_code)]` where it is not needed; keep `unsafe` blocks minimal; add a `// SAFETY:` comment stating the invariant; expose a safe abstraction; run Miri; document justification.
- Prefer: safe alternatives; audited crates with `unsafe` internals; small private `unsafe` modules; fuzz/property tests for `unsafe` parsers.
- Avoid: `unsafe` to bypass the borrow checker; `unsafe` for micro-optimization without measurement; large `unsafe` functions; `unsafe` in business logic.
- Almost never: raw pointer arithmetic in application code; `static mut`; `unsafe` in generated code without review; claim quality while `unsafe` invariants are undocumented.

## 14. FFI

FFI is unsafe integration code; isolate it behind safe Rust APIs.

- Always: keep bindings out of domain logic; validate inputs/outputs across the boundary; document ownership, lifetime, and thread-safety; handle null pointers and error codes; avoid panics crossing the boundary.
- Prefer: generated bindings where appropriate; `NonNull<T>`, `CStr`/`CString`; safe wrapper types; integration tests with fixtures.
- Avoid: passing Rust references unsafely; assuming C strings are UTF-8; mixing allocators; letting foreign pointers escape into domain code.
- Almost never: expose raw FFI in public application APIs; allow unwinding across FFI without explicit support.

## 15. Concurrency and Async

Concurrency must be explicit, bounded, observable, and tested. Rust prevents data races, not
deadlocks, leaks, lost updates, or broken cancellation.

- Always: minimize shared mutable state; prefer message passing/ownership transfer; define lock ownership and ordering; avoid holding locks across `.await`; set timeouts; bound concurrency; propagate task errors; test cancellation/shutdown.
- Prefer: `Arc` for shared immutable data; channels; `Mutex`/`RwLock` only when needed; `tokio`/`JoinSet`/`try_join`/`Semaphore`; structured task supervision; `tracing` for async flows; bounded channels.
- Avoid: global mutable state; unbounded channels/tasks; detached fire-and-forget tasks; blocking calls inside async runtimes; runtime types leaking into domain code; swallowing `JoinError`.
- Almost never: fix races with sleeps; retry non-idempotent operations without protection; hide failed async tasks; ignore timeout/cancellation in external integrations.

## 16. Traits, Generics, and Macros

Abstractions should model real variation or boundaries, not look sophisticated.

- Always: keep traits small and near consumers; use concrete types when there is no abstraction; use generics only where they reduce duplication without hiding meaning; document public traits.
- Prefer: traits for external boundaries (repository, clock, signer, storage); sealed traits for closed extension points; `impl Trait` for ergonomics; small declarative macros only when functions/traits are worse.
- Avoid: a trait for every struct; single-implementation traits without boundary/testing value; complex generic/lifetime bounds in public APIs; macros that hide business rules.
- Almost never: use traits/generics/macros to avoid modeling business concepts; generate `unsafe` code in macros without review.

## 17. Serialization and Deserialization

Serialization is a boundary concern; do not let serde or external payloads define the domain model.

- Always: use DTOs at boundaries; validate decoded data before domain use; keep domain invariants independent from serialization; test encode/decode including malformed input; treat unknown/missing fields deliberately; keep versioning explicit.
- Prefer: dedicated request/response and event structs; explicit mappers; golden tests for stable payloads; `deny_unknown_fields` for strict input; stable date/time formats.
- Avoid: deriving `Serialize`/`Deserialize` on domain types by default; `serde_json::Value` as business data; silent defaults for required fields; untested custom serializers.
- Almost never: deserialize untrusted payloads directly into domain objects; treat deserialization success as business validation; encode compatibility through undocumented serde aliases.

## 18. Time, Money, and Numerics

Date/time and money bugs are business bugs; use exact, explicit types.

- Always: use timezone-aware instants; inject a clock when time affects behavior; test boundary dates; use `BigDecimal`/integer minor units (or a decimal crate) for money; use checked arithmetic where overflow matters; test boundary/zero/negative values.
- Prefer: value objects for money/measurements; UTC internally; ISO-8601 at boundaries; `checked_add`/`checked_mul`; names that include units (`amount_cents`, `duration_days`).
- Avoid: `Time::now`/system clock in domain logic; `f32`/`f64` for money; comparing dates as strings; silent overflow; magic numbers.
- Almost never: use local machine time as business truth; use binary floating point for auditable money; round financial values without tests.

## 19. Collections, Logging, and Observability

- Collections: choose by behavior; keep iterator chains readable; avoid hidden side effects in `map`; make ordering explicit; use `BTreeMap`/`BTreeSet` when deterministic order matters; `collect::<Result<_, _>>()` for fallible transforms.
- Logging: use `tracing`/the project logger; structured fields; correlation IDs; never log secrets, keys, or raw sensitive payloads; make spawned-task failures observable; keep audit trails separate from debug logs.
- Avoid `println!`/`dbg!` in production; logging whole payloads; depending on `HashMap` iteration order as a contract.

## 20. Security Baseline

Security is a quality requirement; treat all external input as untrusted.

- Always: validate input; use parameterized queries; protect secrets; verify TLS; set network timeouts; use `SecureRandom`/a CSPRNG for tokens; run `cargo audit`/`cargo deny` where configured; redact sensitive logs.
- Prefer: `rustls` or project-approved TLS; centralized crypto/signing adapters; strong typed inputs before business use; fuzz/property tests for parsers; payload size limits.
- Avoid: building SQL by string concatenation; `Marshal`-style unsafe deserialization; logging secrets; abandoned/unmaintained crypto crates; shelling out with untrusted arguments.
- Almost never: implement custom crypto; disable TLS verification to pass tests; store keys/certs in source control; use `unsafe` to parse untrusted input without fuzzing/Miri.

## 21. Dependencies, Features, and Public API

- Dependencies: justify each gem/crate; keep features minimal; disable default features when unnecessary; run supply-chain checks (`cargo audit`/`deny`/`tree -d`); review license, native code, and MSRV impact.
- Features: keep features additive; test the feature matrix; never let an optional feature silently change core behavior.
- Public API/semver: keep public exports intentional; preserve backward compatibility unless the phase is a breaking change; run `cargo semver-checks` and consumer smoke tests for libraries; use `#[non_exhaustive]` deliberately.

## 22. Testing Strategy

Tests must prove behavior, not just execute lines.

- Always: add/update tests for changed behavior; test failure and boundary paths; keep tests deterministic; avoid real network/time/order dependence; use behavior-named tests.
- Prefer: unit tests for domain rules; integration tests for adapters; contract tests for external APIs; golden tests for stable payloads; property tests (`proptest`/`quickcheck`) for parsers and state machines; mutation tests (`cargo-mutants`) for critical rules; a fixed clock/seed.
- Avoid: tests that only assert a mock was called; broad snapshots that hide data; `sleep`-based synchronization; tests passing only in one timezone/order.
- Almost never: delete/skip tests to pass; rely only on happy paths; mock the unit under test.

## 23. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (helpers, simple types, internal refactors): build `-D warnings`, format, clippy, basic behavior tests.
- **Medium** (services, validation, adapters): unit + failure-path tests, integration at seams, static checks, coverage.
- **High** (core rules, state machines, authorization, money/time): the above plus edge-case and regression tests, coverage thresholds, complexity within limits, architecture checks.
- **Critical** (security, crypto, financial, audit, data integrity, safety-critical, `unsafe`): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, Miri for `unsafe`, mutation or fuzz, security/dependency audit.

## 24. Coverage and Mutation Testing

### Default thresholds

|Area|Line|Branch/Region|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

Measure with `cargo llvm-cov`. Use `cargo-mutants` for critical rules. Branch coverage and
sanitizer-/Miri-clean failure paths matter more than raw line percentage.

## 25. Complexity Limits

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

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with an explicit reason.

## 26. Quality Score Model

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Basic implementation with weak tests or unclear structure|
|61-75|Working implementation with meaningful tests and acceptable structure|
|76-90|Strong implementation with good tests, low complexity, and clean boundaries|
|91-100|Production-grade implementation with strong evidence, clear boundaries, strong error handling, no known gaps|

### Score caps

|Missing or Failed Evidence|Maximum Score|
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
|Panic used for recoverable failures|75|
|Feature combinations untested where features matter|85|
|Public API changed without semver consideration|80|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass, tests are meaningful, critical paths are
covered, complexity is within limits, architecture is preserved, no unjustified `unsafe` exists, no
recoverable failures panic, no critical `unwrap`/`expect` remains, dependency/security checks are
clean or justified, feature behavior is verified, and `PHASE-RESULT.md` contains evidence.

## 27. Definition of Done

Code compiles; `cargo fmt` passes; Clippy passes or failures are documented; tests pass and
meaningful tests were added; coverage meets the tier; complexity within limits or justified;
architecture preserved; errors handled explicitly; panics not used for recoverable failures;
`unsafe` absent or justified/isolated/documented/tested; no secrets introduced; dependencies and
features justified; `PHASE-RESULT.md` exists. For critical code, also golden/contract/error-path
tests, audit/traceability, Miri where `unsafe` is present, security/dependency audit, and mutation or
fuzz evidence.

## 28. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Formatting / Clippy results
## Coverage results
## Mutation / property / fuzz results (if applicable)
## Miri results (if unsafe)
## Dependency / security audit results
## Architecture boundary checks
## Public API / semver impact (if applicable)
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results and tests, not confidence or memory safety alone.

## 29. Final Checklist

Compiles; `cargo fmt` ran; Clippy ran; tests pass, meaningful, cover failure paths; coverage measured
or documented; complexity within limits; architecture preserved; business rules out of
handlers/adapters/serialization; no swallowed errors; no unjustified `unsafe`/`unwrap`/panic; no
secrets committed; dependencies/features justified; `PHASE-RESULT.md` exists; score is evidence-based;
remaining work to reach 100 documented.
