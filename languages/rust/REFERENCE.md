# Rust Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`. 

## Purpose 

This document defines the Rust language quality gate for this implementation phase. 

Its purpose is to prevent low-quality Rust code from being generated, accepted, copied into the project root, or treated as complete without measurable evidence. 

This is not a style preference document. It is an engineering control document. 

Rust provides strong compile-time safety guarantees, but Rust code can still be poor software. Rust code can still be: 

- architecturally wrong 

- over-abstracted 

- panic-prone 

- under-tested 

- unauditable 

- dependency-heavy 

- supply-chain risky 

- incorrectly asynchronous 

- cancellation-unsafe 

- semver-breaking 

- feature-flag fragile 

- unsafe without justification 

- hard to understand 

- hard to maintain 

- legally/regulatorily wrong 

- business-incorrect even when memory-safe 

The implementation is not complete when files are created. The implementation is complete only when the code: 

- compiles 

- is formatted 

- passes linting or documents justified exceptions 

- has meaningful automated tests 

- preserves architectural boundaries 

- models errors explicitly 

- avoids unnecessary panics 

- avoids unnecessary unsafe 

- handles async/concurrency deliberately 

- controls dependency and feature sprawl 

- is secure by default 

- is auditable where required 

- has measurable evidence in PHASE-RESULT.md 

This document must be followed together with: 

- AGENTS.md 

- PHASE-PLAN*.md 

- QUALITY-GATES.md 

- LANGUAGE-QUALITY-GATE.md 

- architecture.md 

- myrules.txt 

If this file conflicts with a phase-specific rule, follow the stricter rule unless the deviation is explicitly documented in PHASE-RESULT.md. 

## 0. Normative Core (read this first) 

This section is the enforceable summary of the whole gate. Everything below it is rationale and detail. At the end of any implementation, the LLM or engineer MUST verify every item here. If time or context is limited, obey this core and consult the numbered sections only when a check trips or needs detail. 

### MUST (hard gate — a failure caps the score; see Score caps) 

1. Code compiles from a clean checkout: `cargo check --workspace --all-targets --all-features`. 
2. Formatting passes: `cargo fmt --all -- --check`. 
3. Lint passes with no new warnings: `cargo clippy --workspace --all-targets --all-features -- -D warnings`; suppressions are narrow and justified. 
4. Tests pass and are meaningful for changed behavior, including failure paths: `cargo test --workspace --all-features`. 
5. Coverage meets the risk tier (see Default thresholds). 
6. Complexity within limits (see Complexity Limits) or justified. 
7. Architecture boundaries preserved; business rules stay out of handlers, persistence, and serialization. 
8. Untrusted input is validated at boundaries before domain use. 
9. No secrets committed; sensitive data not logged. 
10. Errors modeled with `Result`/typed errors; no swallowed failures. 
11. `PHASE-RESULT.md` created with command evidence and residual risk. 

### MUST NOT 

- Declare the phase complete merely because code was written. 
- Ignore a failed command or skip a relevant command without documenting the concrete blocker. 
- Broadly suppress Clippy/compiler warnings to pass. 
- Use `unwrap`/`expect`/`panic!` for recoverable failures, or `unsafe` without isolation, `// SAFETY:` justification, and Miri/tests. 

### Score 

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100. The detailed sections below expand each item with Always / Prefer / Avoid / Almost-never guidance. 

### Scope by risk tier (read this when planning) 

Before implementing, classify the change and scope the plan and the review to its tier. Do not apply critical-tier rigor to a throwaway script, and do not ship business rules with only low-tier checks. When planning, list which checks apply for the tier and state any intentionally excluded and why. Detail: see the "Required evidence by risk tier" section below. 

- Low (helpers, simple data types, internal refactors, throwaway scripts): build, format, clippy, basic behavior tests. MUST 1-4, 9-11. 
- Medium (application services, validation, persistence/external adapters): add failure-path tests, integration at seams, coverage. Add MUST 5, 7, 8. 
- High (core business rules, state transitions, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5. 
- Critical (security, signing/crypto, legal/financial/compliance, audit, data integrity, `unsafe`): add golden/contract tests, error/rejection paths, audit/traceability, Miri for `unsafe`, mutation or fuzz where applicable. Full gate, no skipped checks. 

## 1. Non-Negotiable Completion Rule 

The implementation LLM must not declare the phase complete merely because Rust code was written. 

A phase is complete only when: 

1. The planned implementation exists. 

2. Relevant automated tests exist. 

3. The code compiles. 

4. Formatting was checked. 

5. Clippy was executed where available. 

6. The applicable quality gates were executed. 

7. Failures were fixed or documented. 

8. PHASE-RESULT.md was created. 

9. The quality score is supported by evidence. 

PHASE-RESULT.md must exist before the final message is sent. 

The final message must be exactly: 

I finished the implementation 

No extra words. No summary. No apology. No markdown. 

## 2. Rust Toolchain Policy 

## Recommendation 

Use the Rust toolchain defined by the project. 

Rust does not use the same LTS model as Java. Therefore, quality depends on a clear, explicit, documented toolchain policy. 

For new Rust projects, prefer: 

- stable Rust 

- Rust 2024 Edition when the project, dependencies, MSRV policy, and tooling support it 

- Rust 2021 Edition when ecosystem constraints require it 

- explicit MSRV when the crate is a library, SDK, CLI, reusable internal crate, embedded crate, or public API dependency 

## Always do 

- Use rust-toolchain.toml when present. 

- Use the edition already defined by the project. 

- Use the MSRV already defined by the project. 

- Document the Rust version used in PHASE-RESULT.md. 

- Document the Cargo version used in PHASE-RESULT.md. 

- Keep Cargo.toml edition consistent across the workspace unless intentionally mixed. 

- Keep CI-equivalent commands runnable locally. 

- Use stable Rust unless the project explicitly requires nightly. 

- Document any nightly requirement. 

- Document any MSRV change. 

- Verify that dependency additions do not silently raise MSRV. 

## Prefer 

- edition = "2024" for new crates when compatible. 

- edition = "2021" when Rust 2024 is not yet compatible with the project/toolchain. 

- rust-version in Cargo.toml for crates with an MSRV policy. 

- rust-toolchain.toml for workspace-level toolchain pinning. 

- Stable compiler features over nightly features. 

- Boring, idiomatic Rust over clever Rust. 

- Explicit migration notes when upgrading editions. 

- cargo fix --edition only as part of a reviewed edition migration. 

## Avoid 

- Relying on whatever Rust version is installed locally. 

- Mixing editions without a documented reason. 

- Using nightly because generated code happened to need it. 

- Adding unstable features to bypass design problems. 

- Changing MSRV without documenting impact. 

- Letting dependencies silently raise MSRV. 

- Using new standard-library APIs that violate the project MSRV. 

- Assuming Rust 2024 is automatically correct for all projects. 

## Almost never do 

- Use nightly-only features in production business code without a documented architectural reason. 

- Hide a required Rust version in local developer instructions only. 

- Change edition/MSRV inside a phase without documenting why. 

- Disable compiler warnings globally to finish a phase. 

- Use unstable features as a substitute for clean design. 

## 3. Cargo and Build Reproducibility 

## Recommendation 

The build must be reproducible from a clean checkout using documented Cargo commands. 

The implementation LLM must assume that isolated phase code will later be copied into the project root. Therefore, every phase must keep its build behavior predictable. 

## Always do 

- Use Cargo as the source of truth. 

- Keep Cargo.toml clean and minimal. 

- Keep Cargo.lock committed for applications, CLIs, services, and binaries. 

- Follow the project policy for Cargo.lock in libraries. 

- Use --locked in verification when lockfile reproducibility matters. 

- Keep features explicit. 

- Keep dependency versions intentional. 

- Avoid local-only paths. 

- Avoid machine-specific configuration. 

- Make build commands documented in PHASE-RESULT.md. 

- Keep build behavior independent from IDE state. 

- Keep build behavior independent from uncommitted local files. 

## Prefer 

- Workspace-level dependency management. 

- Workspace-level lint configuration when appropriate. 

- Workspace-level package metadata when appropriate. 

- Explicit workspace resolver. 

- resolver = "3" for Rust 2024 workspaces when compatible. 

- resolver = "2" for Rust 2021 workspaces when compatible. 

- Separate crates for clear architectural boundaries when the project is large enough. 

- Small dependency graph. 

- cargo tree checks when dependency changes are non-trivial. 

- cargo metadata-based checks for custom validation scripts if the project grows. 

## Avoid 

- Path dependencies that only work on one machine. 

- Git dependencies without pinned revisions. 

- Wild dependency version ranges. 

- Unnecessary default features. 

- Multiple crates with duplicate dependency declarations that drift. 

- Mixing build scripts, generated code, and runtime behavior without tests. 

- Build scripts that perform network I/O. 

- Hidden code generation that is not reproducible. 

## Almost never do 

- Add dependencies just because they are convenient. 

- Use build.rs to hide business logic. 

- Use build scripts to fetch remote resources during normal builds. 

- Modify Cargo.lock without understanding why it changed. 

- Make build success depend on uncommitted local files. 

- Use a build script as an architecture escape hatch. 

## 4. Cargo.lock Policy 

## Recommendation 

Cargo.lock policy depends on what is being built. 

Applications and binaries need reproducible lockfiles. Libraries need a deliberate policy because downstream users resolve their own dependency graph. 

## Always do 

- Commit Cargo.lock for: 

   - applications 

   - services 

   - CLIs 

   - binaries 

   - deployable workers 

   - internal products 

- Follow the project’s established policy for reusable libraries. 

- Document lockfile changes when dependencies are modified. 

- Run tests after lockfile changes. 

- Run dependency audits after meaningful lockfile changes. 

## Prefer 

- cargo test --locked in application/service verification. 

- cargo update -p crate_name for targeted updates. 

- Small, intentional lockfile diffs. 

- Reviewing transitive dependency changes. 

- Checking duplicate dependency versions after major additions. 

## Avoid 

- Large accidental lockfile churn. 

- Blind cargo update. 

- Committing lockfile changes unrelated to the phase. 

- Ignoring yanked or vulnerable versions. 

- Assuming lockfile update means safety. 

## Almost never do 

- Delete Cargo.lock from an application to make dependency resolution pass. 

- Modify lockfile manually. 

- Accept a critical advisory because “it is transitive.” 

- Let dependency resolution changes go undocumented in critical phases. 

## 5. Mandatory Command Evidence 

The implementation LLM must run the applicable commands and document the result in PHASE-RESULT.md. 

If a command cannot be run, the reason must be documented. 

## Baseline commands 

```bash
rustc --version
cargo --version
cargo fmt --all -- --check
cargo check --workspace --all-targets --all-features
cargo test --workspace --all-features
cargo clippy --workspace --all-targets --all-features -- -D warnings
```

## Stronger baseline for applications/services 

```bash
cargo check --workspace --all-targets --all-features --locked
cargo test --workspace --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
```

## Feature compatibility commands when features exist 

```bash
cargo check --workspace --no-default-features
cargo test --workspace --no-default-features
cargo check --workspace --all-features
cargo test --workspace --all-features
```

## Optional but recommended when configured 

```bash
cargo nextest run --workspace --all-features
cargo llvm-cov --workspace --all-features --summary-only
cargo llvm-cov --workspace --all-features --fail-under-lines 85
cargo mutants
cargo miri test
cargo audit
cargo deny check
cargo tree -d
cargo semver-checks
cargo doc --workspace --all-features --no-deps
```

## Required evidence format 

PHASE-RESULT.md must include: 

## Commands run 

- _**`command here`**_ 

## Commands passed 

- _**`command here`**_ 

## Commands failed 

- _**`command here`**_ 

- Reason: 

- Impact: 

- Required fix: 

## Recommendation 

A command that was not run is not evidence. 

A command that failed but was ignored is negative evidence. 

A command that failed because a tool is unavailable must still be documented. 

## 6. Formatting and Style 

## Recommendation 

Use rustfmt. 

Do not debate formatting. Automate it. 

## Always do 

- Run cargo fmt --all -- --check. 

- Keep formatting deterministic. 

- Keep imports clean. 

- Keep modules organized. 

- Use idiomatic Rust naming: 

   - snake_case for functions, variables, modules 

   - CamelCase for types, traits, enum variants 

   - SCREAMING_SNAKE_CASE for constants/statics 

- Keep code readable after formatting. 

- Prefer simple formatting over clever alignment. 

- Keep line breaks meaningful. 

- Remove unused imports. 

## Prefer 

- Default rustfmt style. 

- Project-level rustfmt.toml only when necessary. 

- Minimal rustfmt customization. 

- Small modules. 

- Clear public API layout. 

- Consistent ordering inside modules: 

   - module docs 

   - imports 

   - constants 

   - public types 

   - private types 

   - implementations 

   - tests 

## Avoid 

- Manual formatting fights against rustfmt. 

- Formatting churn unrelated to the phase. 

- Large custom rustfmt configuration. 

- Weird alignment that rustfmt will undo. 

- Long lines caused by over-complex expressions. 

- Import noise. 

- Reformatting files unrelated to the phase. 

## Almost never do 

- Disable formatting checks. 

- Leave code unformatted. 

- Commit code that only works because rustfmt was skipped. 

- Use formatting to hide overly complex code. 

## 7. Clippy and Lint Policy 

## Recommendation 

Clippy must be treated as a quality gate, not a suggestion. 

Use Clippy to detect suspicious code, unnecessary complexity, poor idioms, panic-prone patterns, and maintainability issues. 

## Always do 

- Run Clippy when available. 

- Treat warnings as failures in phase verification. 

- Fix Clippy warnings unless there is a documented reason. 

- Keep allow attributes narrow. 

- Add a reason when suppressing a lint. 

- Prefer local #[allow(...)] over crate-wide suppression. 

- Avoid new warnings. 

- Document any new suppression in PHASE-RESULT.md. 

## Prefer 

- cargo clippy --workspace --all-targets --all-features -- -D warnings. 

- Additional strict lints for critical crates: 

   - clippy::unwrap_used 

   - clippy::expect_used 

   - clippy::panic 

   - clippy::todo 

   - clippy::unimplemented 

   - clippy::dbg_macro 

   - clippy::print_stdout 

   - clippy::print_stderr 

   - clippy::indexing_slicing 

   - clippy::arithmetic_side_effects for security/legal/financial code when practical 

- Crate-level lint policies for domain, legal, security, and regulatory code. 

- CI-equivalent lint commands. 

- #![deny(warnings)] only when project policy accepts it and generated code will not make it brittle. 

- Explicit lint configuration in Cargo.toml or crate attributes where appropriate. 

## Avoid 

- Suppressing Clippy to avoid refactoring. 

- Adding broad #![allow(clippy::all)]. 

- Ignoring correctness and suspicious-code lints. 

- Ignoring must_use warnings. 

- Leaving dbg!, todo!, or unimplemented! in production code. 

- Using .unwrap() because “it should not fail”. 

- Adding allow attributes without comments. 

## Almost never do 

- Allow all Clippy warnings. 

- Disable Clippy in critical crates. 

- Suppress panic/unwrap lints in regulatory, security, signing, persistence, or audit code. 

- Treat Clippy output as cosmetic when it identifies real risk. 

- Hide poor code by adding broad lint exceptions. 

## 8. Naming Rules 

## Recommendation 

Names must reveal intent. 

A maintainer should understand the purpose of a type, trait, function, module, or test without reading its full implementation. 

## Always do 

- Use domain language. 

- Use precise names. 

- Name functions by behavior. 

- Name modules by responsibility. 

- Name tests by expected behavior. 

- Use Rust naming conventions. 

- Keep abbreviations only when domain-standard. 

- Use newtypes for important domain concepts. 

- Use names that distinguish raw data from validated data. 

## Prefer 

- EmployeeExposurePeriod over PeriodData. 

- PaymentEventBatch over Batch. 

- SignedXmlDocument over XmlResult. 

- OccupationalRiskAssessment over RiskInfo. 

- EventTransmissionReceipt over ResponseData. 

- validate_event_version over process_version. 

- can_be_cancelled over check_status. 

- RawEventPayload for untrusted input. 

- ValidatedEventPayload after validation. 

- UnsignedXmlDocument before signing. 

- SignedXmlDocument after signing. 

## Avoid 

- Names such as: 

   - helper 

   - utils 

   - common 

   - processor 

   - manager 

   - handler 

   - data 

   - stuff 

- Technical-only names for domain concepts. 

- Ambiguous traits such as Processor or Manager. 

- Overloaded terms with multiple meanings. 

- Boolean parameters whose meaning is unclear. 

- Naming types after framework concepts when they represent domain concepts. 

## Almost never do 

- Use placeholder names in production code. 

- Use single-letter names outside tiny local scopes. 

- Name domain types after database tables or transport payloads only. 

- Let generated names define the domain language. 

- Use Thing, Object, Item, or Entry when a domain name exists. 

## 9. Module and Crate Structure 

## Recommendation 

Rust modules and crates must reflect architecture, not random grouping. 

A good Rust structure makes invalid dependencies hard and visible. 

## Always do 

- Preserve architecture.md. 

- Keep domain logic separate from infrastructure. 

- Keep application/use-case orchestration separate from adapters. 

- Keep API/transport models separate from domain models. 

- Keep external clients outside the domain. 

- Keep module visibility narrow. 

- Use pub(crate) instead of pub when external visibility is not required. 

- Make invalid access impossible through visibility where practical. 

- Keep public module surface small. 

- Avoid exporting internal modules accidentally. 

## Prefer 

For a single-crate application: 

```text
src/
  domain/
    mod.rs
    model/
    rules/
    events/
    errors.rs
  application/
    mod.rs
    use_cases/
    ports/
    commands.rs
    results.rs
  infrastructure/
    mod.rs
    persistence/
    regulatory/
    xml/
    signing/
    messaging/
  api/
    mod.rs
    http/
    dto/
    mapper/
  config/
  main.rs
  lib.rs
```

For a larger workspace: 

```text
crates/
  domain/
  application/
  infrastructure/
  api/
  app/
```

## Avoid 

- One huge lib.rs. 

- One huge main.rs. 

- One giant mod utils. 

- Domain modules importing infrastructure modules. 

- API modules containing business rules. 

- Infrastructure modules returning provider-specific models into the domain. 

- Cyclic conceptual dependencies. 

- Public modules by default. 

- Re-exporting everything from the crate root. 

- Creating a crate for every tiny concept. 

## Almost never do 

- Put business rules in: 

   - HTTP handlers 

   - database adapters 

   - XML builders 

   - generated payload structs 

   - message consumers 

   - external API clients 

   - CLI argument parsing 

- Create a common module that becomes a dumping ground. 

- Use visibility as an afterthought. 

- Let pub leak internals because it was easier than fixing module design. 

## 10. Architectural Boundaries 

## Recommendation 

Business rules must be explicit, isolated, and tested. 

Rust’s module system should be used to enforce boundaries, not bypass them. 

## Always do 

- Keep dependency direction inward. 

- Put business rules in domain/application modules. 

- Put side effects in infrastructure/adapters. 

- Use traits/ports at boundaries where useful. 

- Keep handlers thin. 

- Keep persistence code focused on persistence. 

- Keep external clients focused on communication. 

- Keep XML/JSON generation separate from business decisions. 

- Test boundary rules. 

- Make boundary crossing explicit with mappers. 

- Keep framework-specific types out of the domain. 

## Prefer 

- Domain types with invariants. 

- Application services/use cases for orchestration. 

- Traits for persistence, clocks, signing, storage, external APIs, messaging. 

- Adapter implementations outside the core. 

- DTO-to-domain mappers at boundaries. 

- Domain errors separate from infrastructure errors. 

- pub(crate) for internal boundaries. 

- Feature/crate boundaries when module boundaries are insufficient. 

- Compile-time dependency boundaries through workspace crate structure. 

## Avoid 

- Domain depending on SQL, HTTP, XML, JSON, logging, or framework-specific APIs. 

- Handlers calling database code directly for business workflows. 

- Infrastructure deciding domain outcomes. 

- API DTOs reused as domain objects. 

- Database records reused as API responses. 

- Provider payloads leaking into core logic. 

- Business rules hidden in serde attributes. 

- Letting async runtime types leak into domain logic. 

- Letting database transaction types leak into domain logic. 

## Almost never do 

- Hide business decisions inside SQL queries. 

- Hide legal rules inside XML serialization. 

- Hide validation inside transport mappers only. 

- Change architecture inside a phase without documenting the reason. 

- Make domain correctness depend on a framework. 

- Put audit/legal decisions in tracing/logging side effects. 

## 11. Rust Type System as a Quality Tool 

## Recommendation 

Use Rust’s type system to make invalid states hard or impossible to represent. 

Do not use strings, booleans, maps, or raw primitives when a meaningful domain type is needed. 

## Always do 

- Use newtypes for important domain identifiers and constrained values. 

- Use enums for closed sets of states. 

- Use structs for meaningful grouped data. 

- Keep invariants enforced at construction. 

- Prefer compile-time guarantees over runtime comments. 

- Avoid exposing constructors that allow invalid state. 

- Distinguish untrusted, validated, signed, sent, rejected, and persisted states in types where useful. 

- Use TryFrom for fallible conversions. 

## Prefer 

- EmployeeId(String) instead of raw String. 

- EventVersion instead of raw String. 

- SignedXmlDocument instead of raw Vec<u8>. 

- TransmissionProtocol instead of raw protocol string. 

- NonEmptyString-style value objects where important. 

- DateRange instead of two unrelated dates. 

- Enum state machines for legal event lifecycle. 

- Validated<T> wrappers where input validation is a first-class state. 

- NonZero* types when zero is invalid. 

- Phantom types only when they clearly improve state safety without making APIs obscure. 

## Avoid 

- HashMap<String, String> as a domain model. 

- serde_json::Value as a domain model. 

- Boolean flags that change behavior. 

- Option<T> for required fields. 

- Primitive obsession for important concepts. 

- Invalid intermediate states. 

- Domain code that accepts raw transport payloads. 

- Business state represented by magic strings. 

## Almost never do 

- Represent legal/event state as arbitrary strings. 

- Represent money, dates, measurements, certificates, event IDs, or legal codes as unvalidated raw primitives in domain code. 

- Use comments to describe invariants that types could enforce. 

- Use generic maps for regulatory event structures. 

## 12. Ownership, Borrowing, and Lifetimes 

## Recommendation 

Ownership should make code safer and simpler, not more clever. 

Avoid fighting the borrow checker by overcomplicating design. 

## Always do 

- Choose ownership deliberately. 

- Borrow when data does not need to be owned. 

- Own data when it must outlive the caller or cross async/thread boundaries. 

- Keep lifetimes simple. 

- Clone only when justified. 

- Prefer clear data flow over lifetime gymnastics. 

- Use references in internal APIs where appropriate. 

- Use owned values at boundaries where lifetime clarity matters. 

- Avoid unnecessary heap allocation. 

- Make ownership transfer obvious in function signatures. 

## Prefer 

- Simple structs with owned data for domain objects. 

- Borrowed views for parsing/validation internals when performance matters. 

- Explicit conversion between borrowed and owned models. 

- Small functions that avoid complicated borrow scopes. 

- Arc<T> for shared ownership across threads/tasks only when needed. 

- Cow<'a, str> only when it clearly reduces allocation without harming readability. 

- &str for borrowed string inputs. 

- String for owned domain values. 

- Arc<str> only when shared immutable strings have a real benefit. 

## Avoid 

- Overusing clone() to silence borrow checker problems. 

- Overusing lifetimes in public APIs. 

- Returning references to overly complex internal state. 

- Self-referential structs. 

- Shared mutable state. 

- Using Rc<RefCell<T>> or Arc<Mutex<T>> to avoid better design. 

- Cloning large XML/JSON payloads repeatedly. 

- Borrowing across async boundaries in ways that make cancellation or lifetimes unclear. 

## Almost never do 

- Use unsafe raw pointers to bypass the borrow checker. 

- Use interior mutability as a default design. 

- Create lifetime-heavy public APIs without strong need. 

- Clone large payloads repeatedly without measurement or reason. 

- Use Box::leak or 'static tricks to avoid correct ownership design. 

## 13. Immutability and Mutation 

## Recommendation 

Prefer immutable data and explicit state transitions. 

Mutation must preserve invariants. 

## Always do 

- Keep fields private unless direct access is harmless and intentional. 

- Make mutation explicit. 

- Enforce invariants in constructors and mutation methods. 

- Avoid exposing mutable internals. 

- Prefer immutable value objects. 

- Use &mut self methods to represent controlled mutation. 

- Test state transitions. 

- Keep mutation local and obvious. 

- Do not let unrelated layers mutate domain state. 

## Prefer 

- Constructor/factory functions returning Result. 

- Explicit methods such as: 

   - mark_as_signed 

   - mark_as_sent 

   - mark_as_rejected 

   - cancel 

   - correct 

- Enum-based states. 

- Builder pattern for complex construction. 

- Immutable command/result structs. 

- State-specific types when transitions are critical: 

   - DraftEvent 

   - ValidatedEvent 

   - SignedEvent 

   - SentEvent 

   - RejectedEvent 

## Avoid 

- Public mutable fields in domain objects. 

- Mutation through unrelated layers. 

- Interior mutability without clear reason. 

- Cell, RefCell, Mutex, RwLock as default design tools. 

- Invalid temporary states. 

- Builder APIs that allow required fields to be forgotten without validation. 

## Almost never do 

- Use global mutable state. 

- Use static mut. 

- Use interior mutability to hide poor ownership design. 

- Allow domain objects to be invalid between setter calls. 

- Depend on drop order for business-critical state transitions. 

## 14. Error Handling 

## Recommendation 

Rust errors must be explicit and meaningful. 

Use Result for recoverable failures. Use panic only for programmer bugs or truly impossible internal states. 

## Always do 

- Return Result<T, E> for fallible operations. 

- Define meaningful error types. 

- Preserve source errors. 

- Include actionable context. 

- Convert infrastructure errors at boundaries. 

- Test failure paths. 

- Distinguish business rejection from technical failure. 

- Avoid leaking sensitive internals in external errors. 

- Keep error variants stable for important business behavior. 

- Avoid losing root causes through string conversion. 

## Prefer 

- thiserror for library/domain/application error enums. 

- anyhow for binaries, CLIs, test helpers, and top-level application composition. 

- Domain-specific errors for business rule violations. 

- Error enums with stable variants for important behavior. 

- #[from] only when conversion preserves meaning. 

- User-safe messages plus internal traceability. 

- Error codes for auditable/legal failures. 

- Separate error types per layer: 

   - domain error 

   - application error 

   - infrastructure error 

   - API error 

- #[non_exhaustive] on public error enums when future variants are likely. 

## Avoid 

- Public library APIs returning anyhow::Error. 

- Stringly typed errors. 

- .unwrap() in production paths. 

- .expect() without a clear invariant message. 

- Returning Option when failure reason matters. 

- Collapsing all failures into one generic error. 

- Losing root cause information. 

- Treating business rejection as infrastructure failure. 

- Treating infrastructure failure as business rejection. 

## Almost never do 

- Panic for recoverable business, validation, I/O, XML, signing, persistence, or integration failures. 

- Use Box<dyn Error> in domain APIs when variants matter. 

- Swallow errors. 

- Log and discard critical failures. 

- Treat regulatory rejection as a generic technical error. 

- Convert every error into String at the boundary and lose structure. 

## 15. Panic, unwrap, expect, todo, and unreachable Policy 

## Recommendation 

Production Rust must not rely on panics for normal control flow. 

Panics are acceptable in tests, prototypes, and truly impossible internal invariants, but must be rare and justified. 

## Always do 

- Avoid .unwrap() in production code. 

- Avoid .expect() in production code unless the invariant is obvious and documented. 

- Avoid panic!() for recoverable failures. 

- Remove todo!(), unimplemented!(), and dbg!() before completion. 

- Use Clippy lints to enforce stricter rules in critical crates. 

- Replace panics with typed errors when callers can recover. 

- Document any intentional production panic in PHASE-RESULT.md. 

## Prefer 

- ? with meaningful error conversion. 

- ok_or_else. 

- map_err with context. 

- debug_assert! for internal assumptions in debug builds. 

- Tests proving invariants instead of panics. 

- Exhaustive enum matching. 

- let Some(value) = option else { ... }; for clear absence handling. 

- match when error handling needs explicit branches. 

## Avoid 

- unwrap() after parsing external input. 

- unwrap() after XML/JSON serialization/deserialization. 

- unwrap() after signing, hashing, database, or network operations. 

- expect("should work"). 

- unreachable!() for external state. 

- panic!() in library APIs. 

- Panicking in Drop. 

- Panicking while holding locks. 

## Almost never do 

- Use panic in regulatory, legal, security, audit, signing, persistence, or integration code. 

- Use unwrap_unchecked. 

- Use unreachable_unchecked. 

- Justify panic because “the AI knows this cannot happen.” 

- Leave todo!() in phase code and call it complete. 

- Catch unwind as normal business control flow. 

## 16. Option and Result Semantics 

## Recommendation 

Use Option only for legitimate absence. Use Result when failure reason matters. 

## Always do 

- Use Option<T> for absence. 

- Use Result<T, E> for fallible operations. 

- Convert Option to Result when absence is an error. 

- Keep semantics clear. 

- Test None and error cases. 

- Avoid nested Option<Result<T, E>> unless strongly justified. 

- Avoid Option<bool>. 

## Prefer 

- ok_or_else for missing required values. 

- Domain-specific absence types when absence has business meaning. 

- Clear enum variants for stateful absence. 

- NonZero* types where zero is invalid. 

- Typed validation errors. 

- Result<Option<T>, E> when lookup absence and lookup failure are different. 

## Avoid 

- Returning None for invalid input when caller needs a reason. 

- Returning Err for ordinary absence. 

- Using Option<bool>. 

- Using Option<String> when an enum would clarify meaning. 

- Chaining combinators until code becomes unreadable. 

- Using Result<(), String> in important APIs. 

## Almost never do 

- Use None to hide a technical failure. 

- Use Result<(), String> in public/domain APIs. 

- Call .unwrap() on Option or Result in production logic. 

- Collapse validation failures into absence. 

## 17. Unsafe Rust Gate 

## Recommendation 

Unsafe Rust is forbidden by default unless the phase explicitly requires it. 

If unsafe is required, it must be isolated, documented, tested, and justified. 

## Always do 

- Use #![forbid(unsafe_code)] in crates/modules where unsafe is not required. 

- Keep unsafe blocks as small as possible. 

- Provide a // SAFETY: comment for every unsafe block. 

- Explain the invariant that makes the unsafe operation valid. 

- Expose safe abstractions over unsafe internals. 

- Add tests around unsafe boundaries. 

- Run Miri when unsafe code is present and Miri is applicable. 

- Document unsafe justification in PHASE-RESULT.md. 

- Document why safe Rust was insufficient. 

- Keep unsafe out of domain/business logic. 

## Prefer 

- Safe Rust alternatives. 

- Existing well-maintained crates with audited unsafe internals. 

- Small private unsafe modules. 

- Fuzz/property tests for unsafe parsers or boundary code. 

- Sanitizers/Miri/loom where applicable. 

- Explicit invariants in type design. 

- unsafe_op_in_unsafe_fn discipline. 

- # Safety documentation on every public unsafe function. 

- Independent tests for boundary invariants. 

## Avoid 

- Unsafe to bypass the borrow checker. 

- Unsafe for micro-optimizations without measurement. 

- Unsafe in domain/business logic. 

- Unsafe in legal/regulatory logic. 

- Large unsafe functions. 

- Unsafe public APIs without clear safety contracts. 

- unsafe fn without a # Safety docs section. 

- Unsafe code mixed with unrelated safe code. 

- Unsafe hidden in macros. 

## Almost never do 

- Use unwrap_unchecked. 

- Use unreachable_unchecked. 

- Use raw pointer arithmetic in business applications. 

- Use static mut. 

- Use unsafe to share mutable state across threads. 

- Introduce unsafe without Miri or a documented reason why Miri cannot run. 

- Claim high quality while unsafe invariants are undocumented. 

- Use unsafe in generated code without explicit review. 

## 18. FFI Gate 

## Recommendation 

FFI is unsafe integration code and must be treated as high risk. 

FFI code must be isolated behind safe Rust APIs. 

## Always do 

- Keep FFI bindings outside domain logic. 

- Keep unsafe FFI calls in small adapter modules. 

- Validate inputs and outputs across the boundary. 

- Document ownership rules. 

- Document lifetime rules. 

- Document thread-safety assumptions. 

- Test success and failure paths. 

- Handle null pointers safely. 

- Preserve error information from foreign code. 

- Define who allocates and who frees memory. 

- Avoid panics crossing FFI boundaries. 

## Prefer 

- Generated bindings when appropriate. 

- Safe wrapper types. 

- Explicit ownership transfer functions. 

- NonNull<T> where null is invalid. 

- CStr/CString for C strings. 

- Integration tests with controlled fixtures. 

- Miri where applicable, with awareness of its FFI limitations. 

- repr(C) only when required and documented. 

- Clear conversion layer from FFI types to domain/application types. 

## Avoid 

- Passing Rust references across FFI boundaries unsafely. 

- Assuming C strings are valid UTF-8. 

- Ignoring foreign error codes. 

- Mixing allocation/deallocation across runtimes incorrectly. 

- Letting foreign pointers escape into domain code. 

- Exposing raw FFI in public application APIs. 

- Unclear ownership of buffers. 

## Almost never do 

- Expose raw FFI directly to application/domain modules. 

- Use FFI without safety documentation. 

- Treat FFI code as normal low-risk Rust. 

- Let foreign code decide business outcomes without validation. 

- Allow unwinding across FFI boundaries without explicit support. 

## 19. Concurrency and Thread Safety 

## Recommendation 

Concurrency must be explicit, bounded, observable, and tested. 

Rust prevents many data races, but it does not prevent deadlocks, starvation, cancellation bugs, logical races, unbounded task growth, lost updates, or broken invariants. 

## Always do 

- Keep shared mutable state minimal. 

- Prefer message passing or ownership transfer. 

- Use synchronization primitives deliberately. 

- Define lock ownership and lock ordering. 

- Avoid holding locks across slow operations. 

- Avoid holding locks across .await. 

- Set timeouts where blocking/waiting occurs. 

- Test concurrency-sensitive behavior. 

- Make idempotency explicit for repeated/asynchronous processing. 

- Keep critical sections small. 

- Document concurrency assumptions. 

## Prefer 

- Immutable data shared through Arc. 

- Message channels for ownership transfer. 

- Mutex/RwLock only when shared mutation is necessary. 

- parking_lot only when project accepts it and behavior is understood. 

- loom tests for low-level concurrency primitives when applicable. 

- Bounded queues. 

- Structured task supervision. 

- Atomic types only for simple, well-understood state. 

- Dedicated state machine for concurrent workflows. 

## Avoid 

- Global shared mutable state. 

- Unbounded channels. 

- Detached tasks with no supervision. 

- Blocking operations in async runtimes. 

- Locking multiple mutexes without ordering. 

- Long critical sections. 

- Ignoring poisoned locks without thinking. 

- Assuming Send + Sync means logic is correct. 

- Using Arc<Mutex<T>> everywhere. 

## Almost never do 

- Fix races with sleeps. 

- Hold a lock while performing network, database, signing, XML, or filesystem operations. 

- Use unsafe concurrency primitives. 

- Spawn background tasks that can fail silently. 

- Ignore cancellation in critical workflows. 

- Build legal/regulatory workflows on unsupervised background tasks. 

## 20. Async Rust 

## Recommendation 

Async Rust must be designed, not sprinkled. 

Async code has failure modes: cancellation, blocking, task leaks, unbounded concurrency, hidden panics, runtime coupling, non-idempotent retries, and lost errors. 

## Always do 

- Use async only when it solves an I/O/concurrency problem. 

- Avoid blocking calls inside async tasks. 

- Use timeouts around external I/O. 

- Handle cancellation deliberately. 

- Bound concurrency. 

- Propagate errors from spawned tasks. 

- Avoid detached fire-and-forget tasks. 

- Test async success and failure paths. 

- Use runtime-specific APIs only in infrastructure/application boundaries. 

- Document retry and cancellation semantics. 

- Avoid holding lock guards across .await. 

## Prefer 

- tokio or the project-approved runtime. 

- JoinSet or structured task management for multiple tasks. 

- try_join patterns when failure should cancel the group. 

- Semaphore for concurrency limits. 

- select! with explicit cancellation behavior. 

- Retry policies with idempotency. 

- tracing spans for async flows. 

- Dedicated workers with explicit shutdown. 

- Cancellation-safe operations. 

- Bounded channels. 

## Avoid 

- Blocking filesystem/network/database calls inside async runtime threads. 

- spawn without awaiting or supervising. 

- Infinite retries. 

- Unbounded task creation. 

- Holding mutex guards across .await. 

- Runtime-specific types in domain code. 

- Async traits everywhere without need. 

- Swallowing JoinError. 

- Ignoring task panics. 

## Almost never do 

- Hide failed async tasks. 

- Use sleeps for synchronization. 

- Retry non-idempotent operations without protection. 

- Make legal/regulatory sending fire-and-forget. 

- Ignore timeout/cancellation behavior in external integrations. 

- Mix multiple async runtimes without a documented reason. 

## 21. Traits and Generics 

## Recommendation 

Traits and generics should model real variation or boundaries. 

Do not create abstractions only because generated code looks more sophisticated. 

## Always do 

- Keep traits small. 

- Put traits near the code that consumes them when they are ports. 

- Use concrete types when there is no meaningful abstraction. 

- Use generics when they reduce duplication without reducing clarity. 

- Document public traits. 

- Keep trait bounds readable. 

- Avoid exposing unnecessary generic parameters. 

- Prefer domain-specific traits over vague generic traits. 

## Prefer 

- Traits for external boundaries: 

   - repository 

   - clock 

   - signer 

   - event sender 

   - storage 

   - message publisher 

- Concrete domain types. 

- Associated types when they clarify trait relationships. 

- impl Trait for ergonomic return/argument positions when appropriate. 

- Sealed traits for closed public extension points. 

- Trait objects at runtime plugin boundaries. 

- Generics for compile-time polymorphism with clear benefit. 

## Avoid 

- Creating traits for every struct. 

- Single-implementation traits without boundary/testing value. 

- Overly generic domain code. 

- Complex lifetime/generic bounds in public APIs. 

- Trait objects when generics would be clearer. 

- Generics when an enum would model closed variants better. 

- Blanket implementations that make behavior hard to reason about. 

- Trait names ending in able when a clearer domain word exists. 

## Almost never do 

- Use traits to hide poor architecture. 

- Use generics to avoid modeling business concepts. 

- Expose complex generic APIs in application code without a real need. 

- Make domain logic depend on dynamic dispatch by accident. 

- Create object-safety problems in public traits without tests. 

## 22. Macros 

## Recommendation 

Macros must be rare, simple, and justified. 

Use macros to remove genuine repetition only when functions, traits, builders, or code generation are worse. 

## Always do 

- Prefer ordinary Rust before macros. 

- Keep macros small. 

- Test macro output behavior. 

- Document public macros. 

- Avoid hiding business rules in macros. 

- Keep error messages understandable. 

- Keep macro-generated code reviewable. 

- Avoid macros that make stack traces or compile errors impossible to understand. 

## Prefer 

- Declarative macros for small repetitive patterns. 

- Procedural macros only when project-approved and high value. 

- Tests that compile typical macro usage. 

- trybuild or equivalent compile-fail tests for public/proc macros when applicable. 

- Code generation that produces visible, deterministic artifacts when practical. 

## Avoid 

- Macros for normal control flow. 

- Macros that hide side effects. 

- Macros that generate large unreviewable code. 

- Procedural macros for simple boilerplate. 

- Macro magic in legal/regulatory rules. 

- Unsafe code generated by macros without explicit safety review. 

## Almost never do 

- Hide business validation inside macros. 

- Use macros to bypass type modeling. 

- Generate unsafe code without explicit review and tests. 

- Add a proc-macro crate casually. 

- Hide legal/regulatory behavior in macro expansion. 

## 23. Serialization and Deserialization 

## Recommendation 

Serialization is a boundary concern. 

Do not let serde , XML libraries, or external payload shapes define the domain model accidentally. 

## Always do 

- Use DTOs at boundaries. 

- Validate deserialized data before domain use. 

- Keep domain invariants independent from serialization. 

- Test payload shape when it is part of the contract. 

- Treat unknown fields deliberately. 

- Treat missing fields deliberately. 

- Keep versioning explicit. 

- Avoid exposing internal types unintentionally. 

- Make default values explicit and tested. 

- Test serialization and deserialization errors. 

## Prefer 

- Dedicated request/response structs. 

- Dedicated XML/event structs for legal payloads. 

- Explicit mappers from DTOs to domain types. 

- Golden tests for stable payloads. 

- Schema validation where applicable. 

- deny_unknown_fields when strict input is required. 

- Backward-compatible deserialization where required by API versioning. 

- Stable date/time formats. 

- Explicit enum representation. 

## Avoid 

- Deriving Serialize/Deserialize on domain types by default. 

- Using serde_json::Value as business data. 

- Silent default values for required business fields. 

- Hiding validation in serde attributes only. 

- Accidental field renames. 

- Accidental date/time format changes. 

- Untested custom serializers. 

- Leaking internal enum variants into public contracts. 

## Almost never do 

- Deserialize untrusted payloads directly into domain objects. 

- Treat deserialization success as business validation. 

- Use generic maps for legal/regulatory payloads. 

- Allow invalid legal events to exist because serde accepted the shape. 

- Encode legal/business compatibility through undocumented serde aliases. 

## 24. XML Safety 

## Recommendation 

XML processing must be hardened. 

This is especially important for legal, regulatory, and compliance payloads. 

## Always do 

- Use a dedicated XML library. 

- Avoid XML string concatenation. 

- Validate XML against the expected schema where applicable. 

- Keep XML generation deterministic. 

- Test namespaces. 

- Test encoding. 

- Test required and optional fields. 

- Test malformed XML. 

- Test external rejection paths. 

- Redact sensitive XML in logs. 

- Keep layout/schema version explicit. 

- Keep canonicalization requirements explicit when signatures are involved. 

## Prefer 

- Version-specific XML models. 

- Golden tests for generated XML. 

- Schema validation tests. 

- Canonicalization tests when signatures are involved. 

- Contract tests for external XML payloads. 

- Dedicated fixtures per event type. 

- Safe parser settings. 

- Streaming parsing for large payloads. 

- XML comparison helpers that understand namespaces/canonicalization. 

## Avoid 

- Building XML with format! and string concatenation. 

- Mixing schema versions in one unstructured builder. 

- Ignoring namespaces. 

- Ignoring canonicalization when signatures matter. 

- Comparing XML as raw strings when canonical comparison is required. 

- Logging complete sensitive XML. 

- Using transport XML structs as domain models. 

- Letting XML builder code decide business validity. 

## Almost never do 

- Generate legal XML without golden tests. 

- Sign XML without deterministic canonicalization evidence. 

- Send XML without validation when schema is available. 

- Put legal/business rules inside XML builder code. 

- Use unversioned XML builders for versioned legal layouts. 

- Treat XML generation as a string formatting problem. 

## 25. Date, Time, Time Zones, and Clock 

## Recommendation 

Date/time bugs are business bugs. 

Use explicit types and freeze time in tests. 

## Always do 

- Use a well-maintained time/date crate approved by the project. 

- Use SystemTime or equivalent only at technical boundaries when appropriate. 

- Use date-only types for date-only business concepts. 

- Inject a clock/time provider when current time affects behavior. 

- Test time-dependent logic with fixed time. 

- Define timezone policy. 

- Define inclusive/exclusive date range semantics. 

- Validate date ranges. 

- Test boundary dates. 

- Avoid relying on local machine timezone. 

## Prefer 

- time or chrono according to project standard. 

- Domain value objects for: 

   - legal dates 

   - event periods 

   - deadlines 

   - validity windows 

   - transmission timestamps 

- ISO-8601 at technical boundaries unless integration requires another format. 

- Explicit timezone conversion at boundaries. 

- Tests for: 

   - same-day boundaries 

   - end-of-month 

   - leap year 

   - invalid ranges 

   - timezone conversion 

   - daylight saving behavior when relevant 

## Avoid 

- Hidden local timezone assumptions. 

- Comparing dates as strings. 

- Parsing dates repeatedly inside business rules. 

- Mixing date-only and timestamp concepts. 

- Using current real time in deterministic tests. 

- Silent fallback on invalid dates. 

- Storing external date strings directly in domain objects. 

## Almost never do 

- Use local machine time as business truth. 

- Ignore timezone requirements in legal/regulatory events. 

- Let external payload date strings leak into domain logic. 

- Make tests depend on today’s date. 

- Use system clock directly in business rules. 

## 26. Money, Decimals, Measurements, and Numeric Rules 

## Recommendation 

Use exact and domain-appropriate numeric types. 

Rust’s primitive numeric types are not enough for all business/legal contexts. 

## Always do 

- Define numeric units explicitly. 

- Avoid magic numbers. 

- Test boundary values. 

- Test rounding rules. 

- Test minimum/maximum values. 

- Avoid floating point for money. 

- Use checked arithmetic when overflow matters. 

- Validate measurements and legal thresholds. 

- Document rounding policies. 

- Test zero, negative, maximum, and fractional cases where applicable. 

## Prefer 

- Domain value objects for: 

   - money 

   - percentages 

   - measurements 

   - rates 

   - quantities 

   - thresholds 

   - exposure levels 

- Decimal crates for money/precise decimals when needed. 

- Integer minor units for money when compatible with business rules. 

- Explicit rounding policies. 

- Constants named after business meaning. 

- Types/names that include units: 

   - duration_days 

   - amount_cents 

   - noise_exposure_db 

   - rate_percent 

- checked_add, checked_mul, or domain-safe arithmetic where overflow matters. 

## Avoid 

- f32/f64 for money. 

- Hidden unit conversion. 

- Silent overflow. 

- Numeric literals spread across code. 

- Rounding inside unrelated functions. 

- Comparing floats directly. 

- Unclear measurement units. 

- Using usize for domain quantities that are not memory sizes/indexes. 

## Almost never do 

- Round legal/payroll/financial values without tests. 

- Mix units in the same field. 

- Use binary floating-point for legal, payroll, or financial calculations. 

- Treat measurement units as comments instead of types/names. 

- Ignore overflow risk in audit/legal calculations. 

## 27. Collections and Iterators 

## Recommendation 

Use the clearest collection construct, not the cleverest. 

Iterators are excellent when they remain readable. 

## Always do 

- Keep iterator chains understandable. 

- Avoid hidden side effects in iterator chains. 

- Choose collection types by behavior. 

- Make ordering explicit. 

- Use maps/sets for repeated lookup. 

- Avoid unnecessary allocation. 

- Avoid cloning large collections without reason. 

- Preserve deterministic output when tests/contracts depend on ordering. 

## Prefer 

- Vec for ordered collections. 

- HashMap/BTreeMap for keyed lookups. 

- HashSet/BTreeSet for membership. 

- BTreeMap/BTreeSet when deterministic ordering matters. 

- Iterators for simple transformations. 

- Plain loops for complex branching. 

- collect::<Result<Vec<_>, _>>() for fallible transformations. 

- filter_map when absence is expected. 

- try_fold only when it remains clear. 

- retain for in-place filtering when mutation is intended. 

## Avoid 

- Long iterator chains with complex closures. 

- Nested iterators hiding business logic. 

- Side-effectful map. 

- Unclear fold. 

- Accidental nondeterministic ordering. 

- Repeated Vec scans in performance-sensitive paths. 

- Cloning because ownership was not designed. 

- Chaining combinators to impress rather than clarify. 

## Almost never do 

- Use iterators to hide persistence, network, signing, or message publishing side effects. 

- Depend on HashMap iteration order. 

- Clone entire payloads just to satisfy a chain. 

- Use clever combinators when a loop is clearer. 

- Turn business workflows into unreadable iterator pipelines. 

## 28. Logging and Observability 

## Recommendation 

Logs are operational evidence, not decoration. 

For async Rust, distributed systems, external integrations, and legal/regulatory operations, structured tracing is strongly preferred. 

## Always do 

- Use the project-approved logging/tracing system. 

- Prefer tracing for async/services when available. 

- Use structured fields. 

- Include correlation IDs where available. 

- Never log secrets. 

- Never log private keys. 

- Never log passwords. 

- Never log tokens. 

- Never log raw sensitive legal/personnel/health payloads without explicit redaction. 

- Log failures with useful context. 

- Avoid logging the same error repeatedly. 

- Make spawned task failures observable. 

- Ensure logs do not become the only audit trail. 

## Prefer 

- tracing spans for request/use-case/integration flows. 

- Stable event names. 

- Domain identifiers instead of raw payloads. 

- Redaction utilities. 

- Separate audit trail from debug logs. 

- Clear log levels: 

   - ERROR for failed operations requiring attention 

   - WARN for degraded or unexpected recoverable states 

   - INFO for important business/operational events 

   - DEBUG for development diagnostics 

   - TRACE only for very detailed diagnostics 

- instrument only when parameters are safe or explicitly skipped/redacted. 

- Explicit span fields for: 

   - request ID 

   - correlation ID 

   - event ID 

   - batch ID 

   - tenant/account ID where safe 

   - external protocol/receipt where safe 

## Avoid 

- println! and eprintln! in production services. 

- dbg! outside local debugging. 

- Stringly logs with no structured fields. 

- Logging whole XML/JSON payloads. 

- Logging inside tight loops without rate control. 

- Vague messages like "failed" without context. 

- Logging sensitive values through Debug derives. 

- Automatically logging full structs that may contain secrets. 

## Almost never do 

- Log sensitive regulatory XML unredacted. 

- Use logs as the only audit trail. 

- Hide failures because they were logged. 

- Let spawned async tasks fail without traceability. 

- Derive Debug for secret-bearing types without redaction strategy. 

## 29. Auditability and Traceability 

## Recommendation 

For important business operations, especially legal/regulatory operations, auditability is part of correctness. 

## Always do 

- Record who/what initiated important actions when available. 

- Record when important actions occurred. 

- Record what business object was affected. 

- Record result status. 

- Preserve correlation IDs. 

- Preserve external identifiers such as: 

   - receipts 

   - batch IDs 

   - protocol numbers 

   - rejection codes 

   - signatures 

   - certificate identifiers where safe 

- Make audit events queryable. 

- Test audit behavior for critical flows. 

- Record failure paths, not only success paths. 

- Keep audit records stable enough for support/investigation. 

## Prefer 

- Explicit audit records. 

- Append-only audit history for legal events. 

- Stable audit event names. 

- Redacted payload references. 

- Hashes/checksums for generated documents when useful. 

- Traceable state transitions. 

- Separate audit data from debug logs. 

- Typed audit event enums. 

- Audit event builders that enforce required fields. 

- Tests for audit completeness. 

## Avoid 

- Audit data only in logs. 

- Free-text-only audit records. 

- Missing failure audit records. 

- Inconsistent event names. 

- Storing more sensitive data than necessary. 

- Losing the link between request, generated payload, sent payload, response, and final state. 

- Making audit optional for critical flows. 

## Almost never do 

- Send, sign, cancel, correct, or interpret legal events without traceability. 

- Make audit optional for regulatory flows. 

- Lose the connection between generated payload and transmission result. 

- Store sensitive payloads without redaction/encryption policy. 

- Treat audit trail as post-release polish. 

## 30. Security Baseline 

## Recommendation 

Security must be default behavior, not cleanup work. 

The implementation LLM must assume inputs are untrusted unless proven otherwise. 

## Always do 

- Validate external input. 

- Avoid injection vulnerabilities. 

- Use parameterized database queries. 

- Protect secrets. 

- Use TLS verification. 

- Set network timeouts. 

- Avoid unsafe deserialization patterns. 

- Use maintained cryptographic libraries. 

- Run dependency/security checks when configured. 

- Keep permissions narrow. 

- Redact sensitive logs. 

- Avoid unnecessary dependencies. 

- Treat file paths, XML, JSON, CLI args, environment variables, and network responses as untrusted inputs. 

## Prefer 

- cargo audit. 

- cargo deny check. 

- cargo vet if the project uses it. 

- Minimal dependency graph. 

- rustls or project-approved TLS configuration. 

- Explicit secret loading from environment/secret manager. 

- Centralized crypto/signing adapters. 

- Strong typed inputs before business use. 

- Fuzz/property tests for parsers. 

- Allow-lists for constrained values. 

- Explicit limits on payload sizes. 

## Avoid 

- Hardcoded secrets. 

- Disabling TLS verification. 

- Building SQL with string concatenation. 

- Parsing untrusted data into overly permissive structures. 

- Logging secrets. 

- Adding abandoned crates. 

- Using unmaintained crypto crates. 

- Ignoring security advisories. 

- Accepting arbitrary file paths without validation. 

- Shelling out with untrusted arguments. 

- Unbounded decompression/parsing. 

## Almost never do 

- Implement custom cryptography. 

- Store private keys/certificates in source control. 

- Use weak hashing for security-sensitive purposes. 

- Suppress critical/high vulnerability findings without documented justification. 

- Disable security checks to finish the phase. 

- Treat development environments as permission to write insecure code. 

- Use unsafe code to parse untrusted input without fuzzing/Miri/safety review. 

## 31. Dependency and Supply Chain Hygiene 

## Recommendation 

Every Rust crate dependency is a liability until justified. 

Dependencies affect security, compile time, binary size, MSRV, licensing, transitive risk, auditability, and maintenance burden. 

## Always do 

- Add dependencies only with a clear purpose. 

- Prefer mature, maintained crates. 

- Keep feature flags minimal. 

- Disable default features when unnecessary. 

- Check duplicate dependencies when dependency changes are significant. 

- Run supply-chain checks when configured. 

- Document major dependency additions in PHASE-RESULT.md. 

- Review license compatibility when adding dependencies. 

- Review whether the dependency brings unsafe, native code, or build scripts. 

- Review whether the dependency affects MSRV. 

## Prefer 

- cargo audit for RustSec advisories. 

- cargo deny for advisories, licenses, bans, duplicate dependencies, and source policies. 

- cargo tree -d for duplicate dependency inspection. 

- cargo machete or equivalent for unused dependencies when configured. 

- cargo udeps when available and compatible. 

- cargo vet for audited supply chains in mature projects. 

- Workspace dependency declarations. 

- Minimal feature sets. 

- Dependency wrappers/adapters for external systems. 

## Avoid 

- Adding a crate for trivial code. 

- Enabling broad default features. 

- Pulling async runtimes into domain crates. 

- Pulling HTTP/database/XML dependencies into domain crates. 

- Git dependencies without pinned revisions. 

- Abandoned crates. 

- Multiple crates solving the same problem. 

- Native dependencies when a safe pure-Rust option is sufficient. 

- Unknown proc-macro dependencies without reason. 

## Almost never do 

- Ignore known security advisories. 

- Add dependencies with incompatible licenses. 

- Add a dependency that requires nightly without documentation. 

- Add a dependency that raises MSRV without documentation. 

- Modify supply-chain configuration only to hide a problem. 

- Depend on unmaintained crypto, XML, parsing, or TLS crates for critical code. 

## 32. Feature Flags 

## Recommendation 

Cargo features are part of the public build contract. 

Poor feature design creates fragile builds and hidden behavior differences. 

## Always do 

- Keep features additive when possible. 

- Document non-obvious features. 

- Test important feature combinations. 

- Keep default features minimal. 

- Avoid hidden business behavior changes through features. 

- Ensure --all-features works unless impossible and documented. 

- Ensure default feature set works. 

- Ensure --no-default-features works for libraries when project policy expects it. 

- Keep feature names stable for public crates. 

## Prefer 

- Feature names based on capability. 

- Optional dependencies behind explicit features. 

- Small, orthogonal features. 

- default = [] for libraries unless defaults are intentionally useful. 

- CI checks for: 

   - default features 

   - no default features 

   - all features 

   - important combinations 

- dep: syntax for optional dependency exposure control. 

- Avoid exposing internal dependency names as feature names unless intended. 

## Avoid 

- Mutually exclusive features unless unavoidable. 

- Feature flags that silently change legal/business rules. 

- Feature flags that change public API unexpectedly. 

- Large default feature sets. 

- Feature names based on implementation details. 

- Features that compile but are not tested. 

- Feature combinations that are impossible but undocumented. 

## Almost never do 

- Use features to hide broken code. 

- Require all features to compile if normal users should not. 

- Make regulatory layout behavior ambiguous through features. 

- Use features instead of explicit versioned modules for legal schemas. 

- Break semver through feature changes without documenting impact. 

## 33. Public API Design 

## Recommendation 

Public Rust APIs should be clear, type-safe, documented, and semver-aware. 

Use the Rust API Guidelines as the baseline for public crates and reusable internal crates. 

## Always do 

- Keep public API minimal. 

- Use meaningful types. 

- Avoid exposing implementation details. 

- Document public types/functions when they are part of a reusable crate. 

- Preserve semver compatibility for published/reused crates. 

- Test public API behavior. 

- Avoid public fields unless they are intentionally stable. 

- Mark important return values with #[must_use]. 

- Keep public error semantics clear. 

- Avoid exposing framework-specific types unless the crate is specifically a framework adapter. 

## Prefer 

- Newtypes for meaningful distinctions. 

- Builders for complex construction. 

- Error enums with meaningful variants. 

- Trait object safety where trait objects are expected. 

- From/TryFrom for clear conversions. 

- AsRef/Borrow only when idiomatic and useful. 

- #[non_exhaustive] for public enums/structs when future expansion is expected. 

- cargo semver-checks for public crates. 

- #[doc(hidden)] only for intentional internal implementation details. 

- #[must_use] for builders, validation results, commands, receipts, and important state transitions. 

## Avoid 

- Public API exposing internal modules. 

- Public structs with many mutable fields. 

- Public APIs returning vague strings. 

- Boolean parameters in public APIs. 

- Breaking changes without documentation. 

- Exposing anyhow::Error in library APIs. 

- Exposing framework/database/client types in domain APIs. 

- Re-exporting dependencies as part of the public API accidentally. 

- Making generated code the public API without review. 

## Almost never do 

- Publish or reuse a crate with undocumented critical public APIs. 

- Break semver silently. 

- Expose legal/regulatory internals as arbitrary maps. 

- Use public API shape generated by accident. 

- Change public error variants without documenting compatibility impact. 

## 34. Documentation and Doctests 

## Recommendation 

Documentation must help future maintainers use and verify the code. 

For public APIs, examples should compile when practical. 

## Always do 

- Update documentation when behavior changes. 

- Document public APIs in reusable crates. 

- Document important invariants. 

- Document error semantics. 

- Document safety requirements for unsafe APIs. 

- Keep command examples accurate. 

- Document skipped quality gates. 

- Document deviations from architecture. 

- Keep docs close to the code they explain. 

## Prefer 

- Doctests for public examples. 

- Module-level docs for important modules. 

- # Errors sections for fallible public functions. 

- # Panics sections for functions that can panic. 

- # Safety sections for unsafe functions. 

- ADRs for architectural decisions. 

- Golden fixtures as contract documentation. 

- Short examples that show correct use. 

- Rustdoc links for public API relationships. 

## Avoid 

- Documentation that restates obvious code. 

- Outdated examples. 

- Vague claims such as “secure” or “robust” without evidence. 

- Large docs not connected to tests. 

- Comments that excuse poor design. 

- Public APIs with hidden invariants. 

- Doctests that require real external services. 

## Almost never do 

- Leave unsafe code undocumented. 

- Leave legal/regulatory assumptions undocumented. 

- Change architecture without documenting why. 

- Depend on comments instead of tests for business rules. 

- Claim behavior in docs that tests do not verify. 

## 35. Testing Strategy 

## Recommendation 

Tests must verify behavior, not implementation. 

A generated test suite that only executes code without meaningful assertions is not quality evidence. 

## Always do 

- Add automated tests for every implemented business rule. 

- Test success paths. 

- Test failure paths. 

- Test edge cases. 

- Test boundary values. 

- Test regression cases. 

- Keep tests deterministic. 

- Keep tests independent. 

- Keep tests runnable from command line. 

- Use clear test names. 

- Avoid real external services in tests. 

- Avoid real credentials in tests. 

- Keep test fixtures understandable. 

## Prefer 

- Unit tests for domain logic. 

- Integration tests for adapters. 

- Contract tests for external APIs. 

- Golden tests for generated payloads. 

- Property tests for rule-heavy validation/parsing. 

- Fuzz tests for parsers and unsafe boundaries when applicable. 

- Fixed clock/time provider for time-dependent tests. 

- Fixture builders for readability. 

- cargo nextest for faster/reliable test execution when configured. 

- insta or project-approved snapshot tooling for stable golden assertions. 

- testcontainers or equivalent for real infrastructure tests when useful. 

- One test module per domain concept. 

- Parameterized tests through test-case helpers when rule matrices are large. 

## Avoid 

- Testing only happy paths. 

- Assertion-free tests. 

- Tests that duplicate production logic. 

- Tests depending on execution order. 

- Tests depending on current date/time. 

- Tests depending on real credentials. 

- Live external systems in automated tests. 

- Flaky timing-based tests. 

- Excessive snapshot tests that approve bad output. 

- Mocking everything until no real behavior is tested. 

## Almost never do 

- Delete tests to make the phase pass. 

- Lower thresholds to make the phase pass. 

- Use sleeps in tests as synchronization. 

- Leave flaky tests unresolved. 

- Close a legal/regulatory bug without a regression test. 

- Claim quality because “Rust compiled.” 

## 36. Test Types Required by Risk 

## Low-risk code 

Examples: 

- simple DTOs 

- straightforward mappers 

- simple configuration 

- non-critical helper functions 

## Required evidence: 

- compile 

- formatting 

- Clippy 

- basic tests when behavior exists 

## Medium-risk code 

## Examples: 

- application services 

- validation logic 

- persistence adapters 

- API endpoints 

- non-critical integrations 

## Required evidence: 

- unit tests 

- integration tests where applicable 

- coverage 

- Clippy/static checks 

- error-path tests 

- boundary tests 

## High-risk code 

## Examples: 

- business rules 

- payroll/legal logic 

- health/compliance logic 

- event state transitions 

- authorization 

- audit-critical persistence 

- async workflows with retries 

- important parsers 

## Required evidence: 

- unit tests 

- edge-case tests 

- regression tests 

- coverage thresholds 

- mutation testing where available 

- property tests where useful 

- architecture/boundary checks where applicable 

- failure/retry/cancellation tests where applicable 

## Critical-risk code 

## Examples: 

- regulatory XML generation 

- legal event validation 

- digital signing 

- event transmission 

- receipt interpretation 

- cancellation/correction flows 

- certificate handling 

- unsafe code 

- FFI code 

- security-sensitive code 

- parsers for untrusted input 

## Required evidence: 

- unit tests 

- contract tests 

- golden tests 

- schema validation tests where applicable 

- mutation testing or mutation-ready structure 

- property/fuzz tests where applicable 

- error-path tests 

- audit tests 

- redaction tests 

- dependency/security audit 

- Miri for unsafe code where applicable 

- explicit panic/unwrap review 

## 37. Coverage and Mutation Testing 

## Recommendation 

Coverage is necessary but not sufficient. 

Mutation testing is stronger evidence for critical business rules because it checks whether tests detect behavioral changes. 

## Default thresholds 

|Area|Line Coverage|Branch/Region Coverage|Mutation Score|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical legal/regulatory rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|



## Always do 

- Measure coverage when tooling is available. 

- Mutation-test critical rules when tooling is available. 

- Document coverage results. 

- Document mutation results. 

- Document uncovered critical paths. 

- Add tests before increasing quality score. 

- Exclude generated code only with explicit reason. 

- Avoid writing tests only to increase coverage numbers. 

## Prefer 

- cargo llvm-cov for coverage. 

- cargo tarpaulin when project standard prefers it. 

- cargo-mutants for mutation testing. 

- Mutation testing focused on domain/application modules first. 

- Smaller mutation scopes per phase. 

- Regression tests that kill previously surviving mutants. 

- Coverage reports attached or summarized in PHASE-RESULT.md. 

## Avoid 

- Treating high line coverage as proof of correctness. 

- Assertion-free tests. 

- Excluding difficult code without reason. 

- Measuring only handler/framework code. 

- Ignoring surviving mutants in critical rules. 

- Counting generated code as meaningful coverage. 

- Chasing 100% coverage in low-risk glue while ignoring critical logic. 

## Almost never do 

- Accept untested business rules. 

- Accept untested regulatory payload generation. 

- Claim production-grade quality without coverage evidence. 

- Claim production-grade quality for critical rules without mutation evidence or documented mutation-readiness. 

- Score 90+ with critical surviving mutants unexplained. 

## 38. Property-Based Testing and Fuzzing 

## Recommendation 

Use property-based tests and fuzzing where example-based tests are insufficient. 

They are especially useful for parsers, validators, state machines, legal rules, encoding/decoding, numeric rules, and unsafe boundaries. 

## Always do 

- Use deterministic seeds/configuration where possible. 

- Minimize failing cases. 

- Save regression cases discovered by property/fuzz tests. 

- Keep generators constrained to meaningful input. 

- Test invariants, not implementation details. 

- Keep fuzz targets focused. 

- Document fuzz/property evidence for critical code. 

## Prefer 

- proptest for property-based tests. 

- quickcheck if project already uses it. 

- cargo fuzz for parsers, binary formats, XML/JSON boundaries, and unsafe code. 

- Property tests for: 

   - validation invariants 

   - round-trip serialization 

   - date ranges 

   - state machines 

   - numeric boundaries 

   - event lifecycle transitions 

   - canonicalization rules 

   - parse/serialize consistency 

- Corpus files for important discovered cases. 

## Avoid 

- Random tests without reproducibility. 

- Overly broad generators producing mostly meaningless input. 

- Property tests with weak assertions. 

- Treating fuzzing as a replacement for unit/contract/golden tests. 

- Fuzz targets that require live services. 

- Fuzzing huge workflows instead of focused parsers/validators. 

## Almost never do 

- Ignore a fuzz/property failure. 

- Fail to convert discovered bugs into regression tests. 

- Use fuzzing on sensitive production data. 

- Claim parser/unsafe robustness without adversarial tests when risk is high. 

- Use random sleeps or nondeterministic timing as “property testing.” 

## 39. Static and Dynamic Analysis 

## Recommendation 

Rust quality gates should combine compiler checks, Clippy, tests, coverage, mutation testing, Miri, and supply-chain analysis. 

## Always do 

- Run configured static/dynamic analysis. 

- Fix high-confidence findings. 

- Keep suppressions narrow. 

- Document suppressions. 

- Avoid broad exclusions. 

- Treat new warnings as phase failures unless justified. 

- Document unavailable tools. 

- Prioritize findings in unsafe, legal, security, and audit code. 

## Prefer 

- cargo fmt. 

- cargo clippy. 

- cargo check. 

- cargo test. 

- cargo nextest. 

- cargo llvm-cov. 

- cargo-mutants. 

- cargo miri test for unsafe/interior mutability-heavy code where applicable. 

- cargo audit. 

- cargo deny. 

- cargo semver-checks for public crates. 

- cargo doc --no-deps for public API documentation checks. 

- cargo tree -d for duplicate dependencies. 

- cargo machete for unused dependencies when configured. 

## Avoid 

- Suppressing warnings to avoid refactoring. 

- Ignoring must_use warnings. 

- Allowing new warnings because old warnings already exist. 

- Running tools but ignoring their results. 

- Treating Miri as optional when unsafe code was introduced and Miri is applicable. 

- Running only cargo check and claiming quality. 

## Almost never do 

- Disable Clippy globally. 

- Add broad allow attributes. 

- Ignore dynamic analysis findings in unsafe code. 

- Modify tool configuration only to hide generated problems. 

 Score 90+ without static analysis evidence for non-trivial code. 

## 40. Persistence 

## Recommendation 

Persistence is an adapter, not the domain. 

Database shape and domain shape may be related, but they are not automatically the same thing. 

## Always do 

- Keep persistence details outside domain logic. 

- Make transaction boundaries explicit. 

- Use repository/port abstractions where appropriate. 

- Test custom queries. 

- Test important mappings. 

- Handle concurrency/locking deliberately. 

- Use migrations for schema changes. 

- Use parameterized queries. 

- Avoid leaking database errors into domain APIs. 

- Keep database models separate from domain models when invariants differ. 

- Make persistence failure behavior explicit. 

## Prefer 

- Application services controlling transactions. 

- Repository traits in application/domain boundary when useful. 

- Infrastructure implementations using project-approved database crate. 

- SQLx compile-time checked queries where project accepts SQLx. 

- Diesel or SeaORM only when project architecture accepts ORM-style modeling. 

- Testcontainers or integration database tests for non-trivial persistence. 

- Explicit pagination. 

- Optimistic concurrency/version fields where applicable. 

- Migration tests where database schema changes are important. 

- Separate read models when query shape differs from domain shape. 

## Avoid 

- Database rows as domain objects by accident. 

- Business rules only in SQL. 

- Hidden transactions. 

- Long transactions. 

- N+1 query patterns. 

- Persistence code calling external services. 

- Mapping code that silently drops fields. 

- Starting transactions in handlers without application-level intent. 

- Returning raw database client errors through public APIs. 

## Almost never do 

- Store audit-critical records without traceability. 

- Make transactions span slow external calls unless explicitly designed. 

- Depend on production databases for tests. 

- Use raw SQL for business-critical behavior without tests. 

- Place legal/regulatory decisions in query strings. 

## 41. API and Transport Layers 

## Recommendation 

APIs are contracts. 

HTTP, GraphQL, CLI, queue, and file interfaces must be explicit boundaries. 

## Always do 

- Use DTOs at external boundaries. 

- Validate input. 

- Return consistent errors. 

- Avoid exposing internal error/debug details. 

- Avoid exposing persistence records. 

- Test serialization/deserialization. 

- Version public APIs when breaking changes are introduced. 

- Keep handlers thin. 

- Keep use-case logic outside handlers. 

- Keep framework-specific extractors out of domain logic. 

- Make idempotency explicit for retryable operations. 

## Prefer 

- Clear request/response structs. 

- Stable field names. 

- Contract tests. 

- Backward-compatible changes. 

- Explicit idempotency for retryable operations. 

- Problem Details or project-approved error format. 

- Mappers from DTOs to domain/application types. 

- User-safe error messages. 

- Internal trace IDs for support. 

- Dedicated validation layer before use-case execution. 

## Avoid 

- Framework extractors flowing directly into domain logic. 

- Domain types serialized directly by default. 

- Transport errors replacing domain errors too early. 

- Ambiguous status codes. 

- Silent acceptance of malformed payloads. 

- Business logic inside route handlers. 

- Exposing raw Debug output in API errors. 

- Treating CLI parsing as business validation. 

## Almost never do 

- Break public contracts without tests and documentation. 

- Expose stack traces or SQL errors. 

- Put legal/regulatory decisions inside HTTP handlers. 

- Make API behavior depend on undocumented serde defaults. 

- Treat external API shape as internal domain shape. 

## 42. External Integrations 

## Recommendation 

External integrations must be isolated, contract-tested, timeout-bounded, retry-aware, and failure-aware. 

## Always do 

- Keep clients outside domain logic. 

- Define explicit request/response models. 

- Set timeouts. 

- Handle retries deliberately. 

- Make idempotency explicit. 

- Validate responses before using them. 

- Convert provider failures into application-level outcomes. 

- Add contract tests or fake-server tests where applicable. 

- Test error responses. 

- Preserve correlation IDs. 

- Keep credentials out of tests and logs. 

- Test timeouts and malformed responses where practical. 

## Prefer 

- Traits/ports for external services. 

- Provider-specific adapters. 

- Versioned integration modules. 

- Contract tests for: 

   - payload shape 

   - headers 

   - status codes 

   - success responses 

   - error responses 

   - timeouts 

   - retries 

- Golden files for stable JSON/XML payloads. 

- Mock servers or project-approved test doubles. 

- Typed responses instead of unstructured JSON. 

- Explicit retry/backoff policy. 

- Circuit breaker/bulkhead only when justified. 

## Avoid 

- Live external systems in automated tests. 

- Infinite retries. 

- Retrying non-idempotent operations without idempotency protection. 

- Treating every HTTP 200 as business success. 

- Building payloads with string concatenation. 

- Provider DTOs leaking into domain models. 

- Swallowing provider rejection details. 

- Using provider-specific errors as domain errors. 

## Almost never do 

- Hide failed integration calls as successful business operations. 

- Depend on production credentials for tests. 

- Skip contract tests for legal, financial, payroll, health, or regulatory integrations. 

- Let external systems define internal domain concepts directly. 

- Make legal event sending fire-and-forget. 

## 43. Regulatory and Legal Strict Gate

Code that generates, validates, signs, transmits, stores, or interprets legal, regulatory,
financial, audit, or compliance data is **critical-risk** (see "Scope by risk tier"). It carries the
full gate plus the evidence below — no shortcuts, no happy-path-only tests.

- Keep layout/schema/version explicit and version-aware; never mix versions in one unstructured builder.
- Validate against the schema where one exists; validate business rules before producing output.
- Golden tests for every generated payload variant; contract tests for external endpoints.
- Test required, optional, invalid, malformed, and version-difference cases, plus rejection/error responses.
- Preserve auditability and traceability: correlate request, generated payload, transmission, response, and final state with stable IDs; append-only audit for legal events.
- Redact sensitive data in logs; never log secrets, keys, or raw legal/personal/financial payloads.
- Add a regression test for every fixed legal/business bug; document the source, reason, and impact of any rule change.
- Keep business/legal decisions out of serializers, signing/transport code, and I/O glue.

### Required evidence (record in PHASE-RESULT.md)

Event/payload types affected; schema/layout versions; golden tests added; schema-validation tests;
contract tests; rejection/error tests; audit/traceability behavior; redaction verified; residual
legal/regulatory uncertainty.

## 44. Cryptography, Certificates, and Signing 

## Recommendation 

Cryptographic code must be isolated, dependency-reviewed, and tested with fixtures. Do not implement cryptography yourself. 

## Always do 

- Use maintained, project-approved crypto/signing crates. 

- Keep signing code outside domain rules. 

- Keep private keys out of source control. 

- Keep certificates out of source control unless they are explicit test fixtures. 

- Use separate test certificates. 

- Validate certificate expiry where relevant. 

- Handle signing failures explicitly. 

- Test success and failure cases. 

- Avoid logging sensitive material. 

- Avoid exposing raw key material beyond the signing adapter. 

- Ensure signing output is deterministic where the standard requires it. 

- Keep algorithm choice explicit. 

## Prefer 

- Dedicated signing adapter. 

- Dedicated certificate loader. 

- Typed signed payload. 

- Deterministic test fixtures. 

- Clear error variants: 

   - missing certificate 

   - expired certificate 

   - invalid password 

   - unsupported algorithm 

   - signing failure 

   - canonicalization failure 

- Audit event for signing attempts where legally relevant. 

- Redacted certificate metadata where needed. 

- Golden tests for signed payload structure where practical. 

## Avoid 

- Custom crypto. 

- Raw key bytes flowing through business code. 

- Production certificates in tests. 

- Silent fallback to unsigned payloads. 

- Treating signing as XML formatting. 

- Logging certificate passwords or private key material. 

- Accepting any certificate without validation. 

- Algorithm selection hidden in config strings without validation. 

## Almost never do 

- Commit private keys. 

- Disable certificate validation. 

- Use weak algorithms without explicit legal/integration requirement. 

- Panic on signing failure. 

- Send legal events after signing failed. 

- Treat signing errors as retryable without understanding the cause. 

## 45. Configuration 

## Recommendation 

Configuration must be explicit, validated, and safe by default. 

## Always do 

- Keep secrets out of source code. 

- Validate required configuration on startup. 

- Use safe defaults. 

- Document required environment variables. 

- Avoid local-only configuration. 

- Keep test configuration separate from production configuration. 

- Fail fast for missing critical configuration. 

- Redact secrets in debug output. 

- Avoid implicit production endpoints. 

## Prefer 

- Typed configuration structs. 

- Environment-specific configuration. 

- Secret managers or environment injection. 

- Explicit defaults. 

- Tests for critical configuration mapping. 

- Redacted debug output for configuration. 

- serde validation plus explicit domain/application validation. 

- Separate config for: 

   - HTTP clients 

   - database 

   - signing/certificates 

   - external integrations 

- audit 

- logging/tracing 

## Avoid 

- Hardcoded credentials. 

- Hardcoded production endpoints. 

- Silent fallback to unsafe defaults. 

- Configuration scattered through code. 

- Magic strings for config keys everywhere. 

- Printing full configuration with secrets. 

- Using default timeouts accidentally. 

- Ignoring invalid configuration until first runtime failure. 

## Almost never do 

- Commit production secrets. 

- Commit private keys/certificates. 

- Disable security through default config. 

- Make production behavior depend on developer machine settings. 

- Allow legal/regulatory transmission without explicit environment configuration. 

## 46. Performance 

## Recommendation 

Prefer simple code first, but do not ignore obvious performance risks. 

Performance-sensitive code must be measured. 

## Always do 

- Avoid obviously inefficient algorithms for expected data sizes. 

- Avoid unnecessary allocation in hot paths. 

- Avoid repeated cloning of large payloads. 

- Use pagination/streaming for large data. 

- Avoid N+1 database queries. 

- Set network timeouts. 

- Document performance assumptions when relevant. 

- Avoid unbounded memory growth. 

- Consider binary size and compile time when adding dependencies. 

## Prefer 

- Simple algorithms with known complexity. 

- Maps/sets for repeated lookup. 

- Streaming XML/JSON processing for large payloads. 

- Batching where safe. 

- criterion benchmarks for performance-sensitive code. 

- Profiling before optimization. 

- Observability for production performance. 

- Measuring before adding unsafe. 

- Avoiding unnecessary async if synchronous code is simpler and sufficient. 

## Avoid 

- Premature micro-optimization. 

- Overusing lifetimes to avoid tiny allocations in non-hot code. 

- Loading huge payloads into memory without reason. 

- Hidden synchronous calls inside loops. 

- Global caches without invalidation. 

- Unsafe for performance without measurement. 

- Excessive generic monomorphization in public APIs without benefit. 

## Almost never do 

- Sacrifice correctness for speed. 

- Optimize legal/business rules without regression tests. 

- Use unsafe micro-optimizations in business code. 

- Cache legal/regulatory decisions without invalidation/versioning strategy. 

- Claim performance improvement without measurement. 

## 47. Resource Management 

## Recommendation 

Every resource must have clear ownership and deterministic cleanup. 

Rust helps with RAII, but design still matters. 

## Always do 

- Let ownership control resource lifetime. 

- Keep resource ownership clear. 

- Close/flush resources explicitly when failure matters. 

- Set I/O timeouts. 

- Avoid unbounded memory usage. 

- Avoid unbounded queues. 

- Avoid long-held locks/resources. 

- Test resource-heavy adapters where practical. 

- Handle shutdown paths for workers. 

- Ensure durable writes are acknowledged where durability matters. 

## Prefer 

- RAII wrappers. 

- Streaming for large files. 

- Pagination for large datasets. 

- Bounded channels. 

- Adapter modules that isolate resources. 

- Explicit shutdown paths for background workers. 

- Backpressure for high-volume workflows. 

- Dedicated resource pools configured with limits. 

## Avoid 

- Leaking tasks. 

- Leaking file handles or network connections. 

- Ignoring flush errors when data durability matters. 

- Loading large legal payload batches fully into memory without reason. 

- Resource cleanup hidden behind process exit. 

- Long-running transactions with external calls. 

- Unbounded caches. 

## Almost never do 

- Ignore failed writes for audit-critical data. 

- Process legal/audit payloads without durable error handling. 

- Keep database transactions open while waiting for external services unless explicitly designed. 

- Depend on Drop for business-critical confirmation semantics without explicit handling. 

- Treat process exit as normal cleanup for critical workflows. 

## 48. Build Scripts and Generated Code 

## Recommendation 

Build scripts and generated code are high-risk because they can hide complexity and make builds less reproducible. 

## Always do 

- Keep build scripts minimal. 

- Keep build scripts deterministic. 

- Document why a build script exists. 

- Avoid network access in build scripts. 

- Avoid business logic in build scripts. 

- Ensure generated code is reproducible. 

- Test generated behavior. 

- Keep generated code out of coverage only with explicit reason. 

- Review generated public APIs. 

## Prefer 

- Generating code at development time when practical. 

- Checking in generated legal/schema artifacts only when the project policy requires it. 

- Clear source-of-truth schema files. 

- Build script tests where build behavior matters. 

- Small wrappers around generated code. 

- Mappers from generated payload structs to domain/application types. 

## Avoid 

- Build scripts that inspect local machine state. 

- Build scripts that fetch remote schemas. 

- Build scripts that write outside the build directory. 

- Generated code that must be manually edited. 

- Generated code that exposes unstable public APIs. 

- Business rules hidden in code generation templates. 

## Almost never do 

- Use build scripts to bypass architecture. 

- Generate legal/regulatory rules without golden/contract tests. 

- Hide unsafe code in generated output without review. 

- Make build output depend on current date/time or network state. 

## 49. no_std, Embedded, and WASM Considerations 

## Recommendation 

If the project targets no_std, embedded, WASM, or constrained environments, the normal Rust gate still applies, but dependency, allocation, panic, and platform assumptions are stricter. 

## Always do 

- Document target platforms. 

- Document allocator assumptions. 

- Document panic strategy. 

- Keep platform-specific code isolated. 

- Test target-specific builds when possible. 

- Avoid dependencies that assume OS/thread/filesystem/network when target does not support them. 

- Keep feature flags explicit for target support. 

## Prefer 

- no_std support only when required. 

- Target-specific modules behind clear features. 

- Cross-compilation checks in phase evidence. 

- Small dependency graph. 

- Panic-free recoverable behavior. 

- Explicit serialization formats for WASM/embedded boundaries. 

## Avoid 

- Accidentally pulling in std. 

- Hidden allocation in constrained environments. 

- Assuming threading, filesystem, or wall-clock availability. 

- Treating WASM/embedded as normal server Rust. 

- Unclear panic behavior. 

## Almost never do 

- Claim target support without building for the target. 

- Add target-specific unsafe code without safety documentation. 

- Use platform-specific dependencies in domain crates. 

- Hide unsupported behavior behind feature flags. 

## 50. Regression Tests 

## Recommendation 

Every fixed bug must create or update a regression test. 

## Always do 

- Add a test that fails before the fix. 

- Keep the regression test focused. 

- Name the test after the behavior. 

- Include edge cases related to the bug. 

- Document the regression in PHASE-RESULT.md. 

- Preserve discovered fuzz/property cases as deterministic tests where useful. 

## Prefer 

- One regression test per bug behavior. 

- Golden regression fixtures for payload bugs. 

- Contract regression tests for external integration bugs. 

- Mutation testing after fixing critical logic. 

- Property test cases saved as deterministic regressions. 

## Avoid 

- Fixing bugs without tests. 

- Tests that only check implementation details. 

- Broad tests that obscure the original bug. 

- Removing regression tests during refactor. 

- Relying on manual reproduction only. 

## Almost never do 

- Close a legal/regulatory bug without a regression test. 

- Claim a bug is fixed because manual inspection says so. 

- Depend only on manual reproduction steps. 

- Remove failing tests instead of fixing behavior. 

## 51. LLM-Specific Rust Anti-Patterns 

## Recommendation 

The implementation LLM must actively avoid common generated-Rust failure modes. 

## Always do 

- Prefer explicit, boring, testable Rust. 

- Verify with commands. 

- Add evidence. 

- Keep architecture boundaries. 

- Refactor generated complexity. 

- Remove unused abstractions. 

- Remove unused code. 

- Keep scope limited to the phase. 

- Use the type system to model the domain. 

- Use errors instead of panics. 

- Keep dependency additions minimal. 

- Explain skipped gates in PHASE-RESULT.md. 

## Avoid 

- Excessive traits. 

- Excessive generics. 

- Lifetime-heavy APIs without need. 

- Arc<Mutex<T>> everywhere. 

- Cloning everything to appease the borrow checker. 

- unwrap everywhere. 

- Huge match blocks containing business workflows. 

- Giant modules. 

- Generic helpers instead of domain types. 

- Adding dependencies for trivial tasks. 

- Hiding uncertainty. 

- Creating impressive but unused abstractions. 

- Writing tests that only mirror implementation. 

## Almost never do 

- Invent architecture not present in architecture.md. 

- Use unsafe to bypass compiler errors. 

- Skip tests because Rust compiled. 

- Claim “memory safe” as proof of business correctness. 

- Leave broken commands undocumented. 

- Create placeholder code and call it complete. 

- Return the final message before PHASE-RESULT.md exists. 

- Claim 100/100 without objective evidence. 

## 52. Recommended Tooling Matrix 

The project does not need every tool immediately, but each phase must use the tools already configured and document missing tools where relevant. 

|Quality Area|Recommended Tool|
|---|---|
|Formatting|cargo fmt / rustfmt|
|Linting|cargo clippy|
|Compilation check|cargo check|
|Unit/integration tests|cargo test|
|Faster test runner|cargo nextest|
|Coverage|cargo llvm-cov or cargo tarpaulin|
|Mutation testing|cargo-mutants|
|Undefined behavior detection|cargo miri test|
|Dependency vulnerabilities|cargo audit|
|Dependency/license/policy checks|cargo deny|
|Public API compatibility|cargo semver-checks|
|Duplicate dependency inspection|cargo tree -d|
|Unused dependencies|cargo machete or cargo udeps|
|Property-based testing|proptest or quickcheck|
|Fuzzing|cargo fuzz|
|Benchmarks|criterion|
|Async/concurrency model testing|loom|
|HTTP contract tests|mock server / project-approved fake|
|Snapshot/golden tests|insta or project-approved equivalent|
|Observability|tracing|
|SQL/database integration tests|project-approved database test tooling|
|Containerized integration tests|testcontainers or project-approved equivalent|

## Recommendation 

Use fewer tools well rather than many tools badly. 

A tool only counts as a quality gate if it is run and its result is documented. 

## 53. Architecture Test Ideas 

Rust does not have a single universal equivalent to ArchUnit, so enforce architecture with a combination of: 

- crate boundaries 

- module visibility 

- dependency direction 

- compile-time visibility restrictions 

- dependency graph review 

- tests 

- code review checklist 

- optional custom scripts 

## Example rules to enforce 

- Domain crate/module must not depend on infrastructure. 

- Domain crate/module must not depend on API/transport. 

- Application crate/module may depend on domain and ports. 

- Infrastructure may implement application ports. 

- API/transport may call application use cases. 

- XML builders must not contain business rules. 

- regulatory version modules must not depend on newer versions unless explicitly allowed. 

- Signing adapters must not expose private key material to domain/application logic. 

- Domain crate must not depend on async runtime crates unless explicitly architectural. 

- Domain crate must not depend on HTTP/database/XML implementation crates unless architecture explicitly allows it. 

- API DTOs must not be used as domain models. 

## Evidence options 

- cargo tree review. 

- Workspace crate dependency layout. 

- Visibility restrictions. 

- Custom tests/scripts that scan forbidden imports. 

- Code review checklist in PHASE-RESULT.md. 

- Module-level compile-time access restrictions. 

## Recommendation 

Architecture rules should be tested or mechanically enforced where practical. 

If architecture is important enough to document, it is important enough to verify. 

## 54. Definition of Done 

A Rust phase is done only when all applicable items are true. 

## Required 

- Code compiles. 

- cargo fmt passes. 

- Clippy passes or failures are documented. 

- Tests pass. 

- Meaningful tests were added or updated. 

- Build commands were run. 

- Quality commands were run or documented as unavailable. 

- Architecture boundaries were preserved. 

- Business rules are in domain/application modules. 

- Handlers are thin. 

- Persistence does not contain business decisions. 

- External clients are isolated. 

- Errors are handled explicitly. 

- Panics are not used for recoverable failures. 

- unsafe is absent or justified, isolated, documented, and tested. 

- Logs are safe. 

- Auditability exists where required. 

- Complexity is within limits or justified. 

- No secrets were introduced. 

- Dependencies are justified. 

- Feature flags are controlled. 

- PHASE-RESULT.md exists. 

## For critical/regulatory/unsafe/security code 

## Also required: 

- Golden tests. 

- Contract tests. 

- Schema validation tests where applicable. 

- Version-aware layout handling. 

- Rejection/error tests. 

- Audit/traceability tests. 

- Redaction behavior. 

- Regression tests for fixed behavior. 

- Miri where unsafe is present and applicable. 

- Security/dependency audit. 

- Panic/unwrap review. 

- Property/fuzz testing where parsers or unsafe boundaries are involved. 

## 55. PHASE-RESULT.md Required Template 

At the end of the phase, create PHASE-RESULT.md with this structure: 

# PHASE RESULT 

## What was implemented 

## Files created or changed 

## What tests were added 

## Business rules covered by tests 

## Commands run 

## Commands passed 

## Commands failed 

## Rust toolchain used 

## Cargo features tested 

## Formatting result 

## Clippy result 

## Coverage results 

## Mutation testing results 

## Property/fuzz testing results, if applicable 

## Miri results, if applicable 

## Static/dynamic analysis results 

## Dependency/security audit results 

## Architecture boundary checks 

## Public API / semver impact, if applicable 

## Performance considerations 

## Logging/audit/traceability evidence 

## Unsafe Rust evidence, if applicable 

## Regulatory evidence, if applicable 

## Known limitations 

## Deviations from architecture.md 

## Quality score: X/100 

## Evidence for score 

## Remaining work required to reach 100/100 

## Evidence rule 

The score must be supported by command results, tests, and documented checks. 

Do not assign high scores based on confidence, appearance, memory safety, or subjective judgment. 

## 55b. Complexity Limits 

Complexity must be actively reduced. If a function, file, type, module, or dependency relationship becomes hard to understand, refactor before declaring completion. 

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

These are defaults. Exceeding a maximum requires a documented justification in PHASE-RESULT.md, not silent acceptance. Generated code may be excluded only with an explicit reason. 

## 56. Quality Score Model 

Use this scoring model: 

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Basic implementation with weak tests or unclear structure|
|61-75|Working implementation with meaningful tests and acceptable structure|
|76-90|Strong implementation with good tests, low complexity, and clean boundaries|
|91-100|Production-grade implementation with strong automated evidence, clear boundaries, strong error handling, and no known quality gaps|

## Score caps 

Apply these caps unless there is a documented and justified exception. 

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
|Panic used for recoverable business/integration failures|75|
|regulatory payloads without golden/contract/schema tests|70|
|Feature combinations untested where features matter|85|
|Public API changed without semver consideration|80|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|Final result file missing|50|

## 100/100 requirement 

A phase may score 100 only if: 

- all applicable commands pass 

- tests are meaningful 

- critical paths are covered 

- complexity is low 

- architecture is preserved 

- no known quality gaps remain 

- no unexplained skipped gates exist 

- no unjustified unsafe exists 

- no recoverable failures panic 

- no critical unwrap/expect remains 

- dependency/security checks are clean or justified 

- feature behavior is verified where features exist 

- PHASE-RESULT.md contains evidence 

## 57. Caveman Quality Review 

At the end of review, include a short simple evaluation. 

Use this style: 

## Caveman Review 

Score: 82/100 

Good: 

- Code compiles. 

- Tests cover main rules. 

- Architecture mostly clean. 

Bad: 

- Mutation testing not run. 

- One adapter has too much logic. 

- Clippy strict unwrap lint not enabled. 

- Error messages need improvement. 

Fix to reach 100: 

- Add mutation test evidence. 

- Move adapter rule to application module. 

- Add rejection-path tests. 

- Remove unwrap from production flow. 

The Caveman Review must be simple, direct, and evidence-based. 

## 58. Final Checklist 

Before sending the final implementation message, verify: 

- ☐Code compiles. 

- ☐ cargo fmt --all -- --check passes. 

- ☐Clippy passes or failures are documented. 

- ☐Tests pass. 

- ☐Tests are meaningful. 

- ☐Relevant feature combinations were checked or documented as unavailable. 

- ☐Coverage was measured or documented as unavailable. 

- ☐Mutation testing was run for critical rules or documented as unavailable. 

- ☐Property/fuzz tests were used where applicable or documented as not applicable. 

- ☐Miri was run for unsafe code or documented as unavailable/not applicable. 

- ☐Dependency/security audit was run or documented as unavailable. 

- ☐Architecture boundaries were preserved. 

- ☐Business rules are not in handlers. 

- ☐Business rules are not in persistence adapters. 

- ☐Business rules are not in API DTOs. 

- ☐Business rules are not in XML builders. 

- ☐Business rules are not in integration clients. 

- ☐Recoverable failures do not panic. 

- ☐ unwrap/expect are absent from production recoverable paths. 

- ☐Unsafe code is absent or justified, documented, isolated, and tested. 

- ☐Complexity is within limits or justified. 

- ☐No broad lint suppressions were added. 

- ☐No secrets were committed. 

- ☐Logs are safe. 

- ☐Auditability exists where required. 

- ☐regulatory code has stricter evidence where applicable. 

- ☐ PHASE-RESULT.md exists. 

- ☐Quality score is evidence-based. 

- ☐Remaining work to reach 100/100 is documented. 

Only after this checklist is satisfied may the implementation LLM respond exactly: 

I finished the implementation 

