# Crystal Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the Crystal language quality gate for implementation work. Its purpose is to
prevent low-quality Crystal code from being generated, accepted, copied into a project, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

Crystal is a compiled, statically typed language with type inference, Ruby-like syntax, compile-time
`Nil` safety, union types, macros, and fiber-based concurrency. The compiler catches type and nil
errors before runtime, which is a real strength — but compile success does not prove behavior, and
`.not_nil!`, opaque macros, and unsupervised fibers can still hide defects. "It compiles" is necessary,
not sufficient.

The implementation is complete only when the code compiles warning-free, is formatted, passes Ameba
and the compiler's type/nil checks, has meaningful tests, handles `Nil` and errors explicitly,
validates untrusted input, controls macros and concurrency, is secure by default, and records
measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult the numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Compiles clean under the project Crystal version: `crystal build` succeeds with warnings addressed; `shards install` clean.
2. Formatting passes: `crystal tool format --check`.
3. Static analysis passes: `ameba`; the compiler's type and `Nil` checks are part of the gate; findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `crystal spec`.
5. Coverage meets the risk tier (kcov where available; otherwise document the limitation).
6. Complexity within limits (Ameba; see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, views, and ORM models.
8. Untrusted input validated before use; `Nil` handled explicitly (no `.not_nil!` on values that can be nil).
9. No secrets committed; sensitive data not logged.
10. Errors modeled with exceptions or result unions and handled; `Nil` unions handled; type restrictions on public methods; no swallowed `rescue`.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Ignore compiler warnings; broadly disable Ameba checks to pass.
- `.not_nil!` to bypass `Nil` safety on values that can be nil; abuse macros to hide business logic; use `pointerof`/unsafe pointer operations or `lib`/C bindings without isolation and justification.
- Spawn unbounded fibers, or share mutable state across fibers without a `Channel`/`Mutex`; `rescue` and swallow everything; ignore an error return; put business rules in controllers/views; build SQL by string interpolation (use parameterized crystal-db queries).

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. Untrusted-input, fiber/concurrency, and
auth changes are never low tier. When planning, list which checks apply and state any intentionally
excluded and why. Detail: "Test Types Required by Risk".

- Low (pure functions, simple structs, internal refactors, throwaway scripts): compile warning-free, format, Ameba, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters, fiber workers): add failure-path tests, input/nil validation, integration, coverage. Add MUST 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, concurrency tests. Add MUST 6.
- Critical (security, auth, crypto, payments, financial, audit, data integrity): add golden/contract tests, error/rejection paths, audit/traceability, injection tests, dependency audit, property tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code
compiles warning-free, formatting and Ameba ran, tests ran, applicable gates ran, failures were fixed
or documented, `PHASE-RESULT.md` was created, and the score is supported by evidence. A passing
`crystal spec` alone is not enough when the phase changed dependencies, public API, persistence,
serialization, fiber/concurrency behavior, or security behavior. Any skipped command must include the
concrete blocker.

## 2. Toolchain: Crystal and Shards

Use the Crystal version and Shards configuration defined by the project.

- Always: use the project Crystal version (`.crystal-version`/CI/Docker); document `crystal --version`; build with warnings addressed; keep local and CI commands aligned.
- Prefer: a current stable Crystal; `shard.yml` targets for binaries; release builds (`--release`) only for production artifacts, debug builds for fast iteration.
- Avoid: relying on whatever Crystal is installed; using features newer than the project minimum; ignoring compiler warnings.
- Almost never: raise the minimum Crystal version without documenting impact; depend on undocumented compiler internals or unstable preview features in production.

## 3. Dependencies and Reproducibility

The build must be reproducible from a clean checkout using documented Shards commands.

- Always: commit `shard.yml` and `shard.lock`; run `shards install` (the lock pins versions); keep dependency versions intentional; review advisories on dependency changes; scope dev tools under `development_dependencies`.
- Prefer: a minimal dependency graph; the standard library before adding a shard for a trivial helper; `shards outdated` for inspection; pinned versions/refs.
- Avoid: loose version requirements without policy; git dependencies without a pinned ref/commit; shards with unclear ownership/maintenance.
- Almost never: delete `shard.lock` to make resolution pass; add a shard with compile-time macro execution without review; accept a vulnerable dependency without a documented compensating control.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
crystal --version
shards install
crystal tool format --check
crystal build src/main.cr -o /dev/null   # full type + Nil checking
bin/ameba
crystal spec
```

Stronger (applications/critical code): kcov-based coverage where it works, property-style specs for
parsers/validators, `shards outdated`/advisory review for supply chain, and `--release` build
verification for deployable artifacts. A command not run is not evidence; a command that failed and
was ignored is negative evidence; an unavailable tool (e.g. coverage) must still be documented.

## 5. Formatting

The Crystal formatter is built in and authoritative; do not debate formatting.

- Always: run `crystal tool format --check` in CI; format new and changed files.
- Prefer: the default formatter; consistent require/include ordering; small files organized by responsibility.
- Avoid: hand-formatting against the formatter; reformatting unrelated files.
- Almost never: skip the format check; leave `pp`/`p`/`puts` debug output or `debugger` in production code.

## 6. Static Analysis: Compiler and Ameba

Crystal's compiler is itself a strong static analyzer (types, `Nil` unions, exhaustiveness); Ameba
adds style, lint, and complexity checks. Both are gates.

- Always: run `ameba`; treat compiler warnings as findings; add type restrictions to public methods so the compiler and readers know the contract; fix Ameba findings or justify them narrowly (`# ameba:disable Rule` with a reason).
- Prefer: explicit return-type and parameter restrictions on public APIs; exhaustive `case ... in` over `case ... when` for unions/enums (the compiler checks coverage); Ameba's complexity and lint rules.
- Avoid: broad Ameba disables; relying on inference for public contracts where an explicit type is clearer; ignoring shadowed-variable or unused-argument warnings.
- Almost never: disable Ameba to pass; ship security/persistence/money code without type restrictions and analysis; suppress a compiler warning without understanding it.

## 7. Naming, Modules, and Architecture

Names must reveal intent; modules reflect architecture.

- Always: use domain language; CamelCase types/modules, snake_case methods; keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport/view models separate from domain.
- Prefer: a `domain`/`application`/`infrastructure`/`web` separation; modules as namespaces; small types; `private`/`protected` to keep internals hidden; abstract classes/modules as ports for adapters.
- Avoid: `Helper`/`Util`/`Common`/`Manager` grab-bag modules; god types; domain code depending on the web framework, ORM, or HTTP; cross-layer reach-ins.
- Almost never: business rules in controllers, views, or ORM model callbacks; let transport/DB shapes define the domain vocabulary.

## 8. Architectural Boundaries

Business rules must be explicit, isolated, and testable without the web layer.

- Always: keep dependency direction inward; put business rules in domain/application modules; keep side effects in adapters; keep controllers thin (validate, call use case, render); test domain logic without booting the server.
- Prefer: plain structs/classes for domain logic; service objects for orchestration; abstract types (ports) for repositories/clock/mailer/external APIs; explicit DTOs/mappers at boundaries.
- Avoid: controllers calling the DB directly for business workflows; business rules in ORM callbacks; provider payloads leaking into core logic; reusing DB models as API responses.
- Almost never: hide business decisions in SQL, views, or macro expansions; make domain correctness depend on a framework; put audit decisions in logging side effects.

## 9. Type System: Structs, Classes, and Unions

Use the type system to make invalid states hard to represent; choose struct vs class deliberately.

- Always: add type restrictions to public method parameters and returns; use `struct` for small immutable value types (value semantics) and `class` for identity/mutable entities; use `enum` for closed sets; enforce invariants in a constructor that returns the value or a clear failure.
- Prefer: union types and `case ... in` for closed variants; records (`record Point, x : Int32, y : Int32`) for simple value objects; private constructors plus a `parse`/`from` factory for validated construction.
- Avoid: `Hash`/`NamedTuple` as a domain model where a struct fits; boolean flags that change behavior; representing important state as free-form strings; mutable structs passed by value (surprising semantics).
- Almost never: build domain objects from untrusted hashes without validation; use comments to describe invariants a constructor could enforce.

```crystal
struct EmployeeId
  getter value : String

  # Returns the value object or nil; the caller must handle both (Nil safety).
  def self.parse(raw : String) : EmployeeId?
    raw.matches?(/\A\d{8}\z/) ? new(raw) : nil
  end

  private def initialize(@value : String)
  end
end

enum EventStatus
  Draft
  Signed
  Sent
end
```

## 10. Nil Safety

Crystal models absence as a `T?` (`T | Nil`) union and forces you to handle the `Nil` branch. Do not
defeat it with `.not_nil!`.

- Always: handle the `Nil` branch explicitly with `if x = expr`, `case ... in`, `try`, or a default; type-restrict so the compiler knows when a value is non-nil; validate before narrowing.
- Prefer: `value.try(&.method)`; `if x = optional` (narrows `x` to non-nil in the block); `||` for defaults; `case ... in T | Nil` for exhaustive handling.
- Avoid: `.not_nil!` on values that can genuinely be nil (it raises at runtime — the exact bug the type system prevents); reaching for `as(T)` to force a type without checking.
- Almost never: `.not_nil!` on untrusted/external input; suppress a nil-union compile error by forcing the type; let a nilable value flow into the database or an external payload unchecked.

```crystal
# The compiler forces handling the Nil branch — never .not_nil! on a nilable value.
case EmployeeId.parse(input)
in EmployeeId then process(employee_id)
in Nil        then handle_invalid("invalid id")
end

# or, narrowing with a binding:
if id = EmployeeId.parse(input)
  process(id) # `id` is EmployeeId (non-nil) here
end
```

## 11. Immutability and Error Handling

- Immutability: prefer `struct` value types and immutable data; expose `getter` not `property` unless mutation is intended; avoid mutating arguments or shared globals; copy at boundaries when ownership is unclear; avoid class variables (`@@`) as mutable application state.
- Errors: raise specific exception subclasses (`class ValidationError < Exception`); preserve the cause (`raise NewError.new("msg", cause: ex)`); rescue the narrowest type you can handle; convert infrastructure exceptions to domain errors at boundaries; for expected outcomes, a union return (`Result | Error`) or tuple can be clearer than exceptions; test failure paths.
- Avoid: bare `rescue` that swallows everything; rescuing `Exception` broadly; returning `nil` to signal failure when a reason matters; using exceptions for ordinary control flow in hot paths.
- Almost never: swallow security/persistence/payment failures; leak stack traces, SQL, tokens, or payloads to responses; `.not_nil!` as error handling.

```crystal
class ValidationError < Exception; end
class SendError < Exception; end

def send_event(payload : Hash(String, JSON::Any)) : Receipt
  id = payload["id"]?.try(&.as_s) || raise ValidationError.new("missing id")
  transmit(id)
rescue ex : IO::Error
  raise SendError.new("transport failed", cause: ex) # narrow rescue, cause preserved
end
```

## 12. Macros and Metaprogramming

Macros run at compile time and are powerful but opaque; keep business logic out of them.

- Always: prefer ordinary methods before macros; keep macros small and well-named; document what a macro generates; test the generated behavior.
- Prefer: macros for boilerplate reduction (defining accessors, mapping) — not business rules; `record` and standard macros over hand-rolled metaprogramming.
- Avoid: hiding validation or business decisions inside macro expansions; deeply nested macro logic that maintainers cannot follow; macro-generated APIs without tests.
- Almost never: encode security/financial rules in macros; generate code whose behavior the type checker cannot meaningfully verify; rely on macro side effects that are hard to trace.

## 13. Fibers, Channels, and Concurrency

Concurrency is via fibers and channels (CSP). Fibers are cooperative; shared mutable state still needs
care, especially under multi-threading.

- Always: bound fiber creation; communicate via `Channel` rather than shared mutable state; use a `Mutex` when shared state is unavoidable (and under the multi-threading runtime); handle errors raised inside fibers (they do not propagate to the spawner automatically); set timeouts on blocking operations.
- Prefer: `Channel` for ownership transfer and coordination; worker patterns with bounded concurrency; `select` for multiple channels; structured shutdown.
- Avoid: unbounded `spawn` in request/loop paths; sharing mutable arrays/hashes across fibers without sync; blocking the event loop with long CPU work; fire-and-forget fibers whose failures are lost.
- Almost never: fix a race with `sleep`; do critical work in a fiber whose failure is swallowed; share non-thread-safe state across threads under the MT runtime without synchronization.

## 14. Serialization, Time, Money, and Persistence

- Serialization: use `JSON`/`YAML` with typed mappings (`JSON::Serializable`) and validate before domain use; never deserialize untrusted YAML/forms into privileged objects without validation; treat unknown/missing fields deliberately; golden tests for stable payloads.
- Time: use `Time` with explicit locations/zones; inject the current time when it affects behavior; UTC internally; ISO-8601 at boundaries; test boundary dates.
- Money: represent money as integer minor units or a decimal type; never use `Float` for money; define rounding explicitly; test boundary/zero/negative values.
- Persistence (crystal-db / ORM): keep DB access in adapters; use parameterized queries (`db.query "... WHERE id = ?", id`) — never interpolate input into SQL; use transactions for multi-step writes; keep business rules out of model callbacks; do not expose DB models as API responses.

## 15. Security Baseline

Security is a quality requirement; treat all external input as untrusted.

- Always: validate and constrain input; use parameterized DB queries; escape output for its context; verify authorization in the application layer, not only the controller; use the stdlib `Crypto`/`OpenSSL` and a vetted password-hashing approach (bcrypt); use `Random::Secure` for tokens; constant-time comparison for secrets (`Crypto::Subtle.constant_time_compare`).
- Prefer: allow-lists for constrained values; safe defaults for cookies/sessions/headers; typed deserialization that rejects unknown shapes.
- Avoid: SQL string interpolation; `.not_nil!` on attacker-controlled values; unsafe pointer operations on untrusted data; disabling TLS verification; logging secrets or raw sensitive payloads.
- Almost never: implement custom crypto; compare secrets with `==`; store keys/certs in source control; pass untrusted input into `system`/shell without escaping.

## 16. Dependencies, Configuration, and Logging

- Dependencies: justify each shard; keep the graph small; review license, maintenance, and compile-time macro behavior; check advisories on changes.
- Configuration: validate required configuration at startup and fail fast; keep secrets out of source; use environment variables / a secret manager; document required env vars; never commit secrets.
- Logging: use the stdlib `Log` with structured data; never log secrets, tokens, or raw sensitive payloads; make fiber/worker failures observable; keep audit trails separate from debug logs.
- Almost never: hardcode credentials/keys; default production security features to disabled; log sensitive data; ignore a critical advisory.

## 17. Testing Strategy

Tests must prove behavior, including failure and nil/error paths.

- Always: add/update tests for changed behavior; test error and boundary paths; test nil handling and validation; keep tests deterministic; avoid real network/time/order/external dependence; use Crystal's `spec` with clear, behavior-named examples.
- Prefer: unit tests for pure domain logic; integration tests for adapters; contract tests for external APIs; golden tests for stable payloads; an injected clock; property-style tests for parsers/validators; tests for fiber/channel behavior including failures.
- Avoid: tests that only assert a stub was called; tests that hit real services without isolation; arbitrary sleeps; tests passing only in one timezone/order; assertion-free examples.
- Almost never: claim completion for business logic without automated tests; rely only on happy paths; use production credentials.

## 18. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (pure functions, simple structs, internal refactors): compile warning-free, format, Ameba, basic specs.
- **Medium** (services, validation, adapters, fiber workers): unit + failure-path specs, nil/validation tests, integration, coverage (or documented gap).
- **High** (core rules, state machines, authorization, money/time): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits, concurrency tests.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, injection tests, dependency audit, property tests.

## 19. Coverage and Complexity Limits

Coverage tooling is limited in Crystal; use kcov where it works and compensate with thorough specs.

### Default coverage thresholds

|Area|Line|Branch|Notes|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|kcov where available|
|Critical security/financial/audit rules|>= 95%|>= 90%|property tests for parsers|
|Application services / fiber workers|>= 85%|>= 80%|—|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Controllers / glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|—|

### Complexity limits

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Method cyclomatic complexity|<= 8|<= 10|Ameba Metrics/CyclomaticComplexity|
|Method length|<= 30 lines|<= 50 lines|review / Ameba|
|Class / struct length|<= 300 lines|<= 500 lines|review|
|File length|<= 400 lines|<= 600 lines|review|
|Method parameters|<= 4|<= 6|review|
|Nesting depth|<= 2|<= 3|review|
|Public methods per type|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with reason.

## 20. Quality Score Model

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no Ameba evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and clean Ameba|
|76-90|Strong implementation with good tests, explicit Nil/error handling, low complexity, clean boundaries|
|91-100|Production-grade: warning-free, Ameba clean, Nil-safe, strong tests with failure paths, no known security defects|

### Score caps

|Missing or Failed Evidence|Maximum Score|
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
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass (compile warning-free, format, Ameba,
specs, coverage where available), `Nil` and errors are handled explicitly, untrusted input is
validated, complexity is within limits, architecture is preserved, no known security defects remain,
and `PHASE-RESULT.md` contains evidence.

## 21. Definition of Done

Compiles warning-free on the project Crystal version; formatting passes; Ameba passes (or documented);
specs pass and meaningful tests were added; coverage meets the tier or the gap is documented;
complexity within limits or justified; architecture preserved; business rules out of
controllers/views/models; `Nil` and errors handled explicitly (no `.not_nil!` on nilable values); type
restrictions on public methods; untrusted input validated; no secrets introduced; dependencies
justified; `PHASE-RESULT.md` exists. For critical code, also golden/contract tests, injection tests,
audit/traceability, and property evidence.

## 22. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Format / Ameba / compiler results
## Coverage results (or documented tooling gap)
## Concurrency / fiber evidence (if applicable)
## Security / dependency audit results
## Architecture boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results and tests — not by confidence or compile success alone.

## 23. Final Checklist

Compiles warning-free; format check ran; Ameba ran; specs pass, are meaningful, cover failure paths;
coverage measured or the gap documented; complexity within limits; architecture preserved; business
rules out of controllers/views/models; `Nil` and errors handled explicitly with no `.not_nil!` on
nilable values; type restrictions on public methods; untrusted input validated; no secrets committed;
dependency audit clean or documented; `PHASE-RESULT.md` exists; quality score is evidence-based;
remaining work to reach 100 is documented.
