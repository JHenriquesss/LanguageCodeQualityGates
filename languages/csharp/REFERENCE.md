# C# / .NET Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the C# and .NET quality gate for implementation work. Its purpose is to prevent
low-quality C# code from being generated, accepted, copied into a project, merged, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

C# code can compile and pass a happy-path test and still be architecturally wrong, null-prone despite
nullable reference types, exception-prone, async-deadlock-prone, cancellation-unsafe, thread-unsafe,
allocation-heavy, dependency-injection-abusing, EF-query-fragile, dependency-heavy, supply-chain
risky, insecure, and business-incorrect.

The implementation is complete only when the code builds from a clean restore, targets an intentional
SDK/target-framework/language version, uses nullable reference types deliberately, passes compiler
warnings/analyzers/formatting, has meaningful tests, preserves architectural boundaries, handles
errors and cancellation deliberately, controls NuGet dependency growth, is secure by default, is
observable without leaking secrets, and has measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Solution builds from a clean restore: `dotnet build --configuration Release`.
2. Formatting passes: `dotnet format --verify-no-changes`.
3. Nullable warnings, compiler warnings, and analyzers ran; new findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `dotnet test --configuration Release`.
5. Coverage meets the risk tier (see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, EF mappings, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors and cancellation handled deliberately; no swallowed failures.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress analyzer/compiler/nullable warnings (`#pragma`, `NoWarn`, `!`) to pass.
- Use `async void` (outside event handlers), block on async (`.Result`/`.Wait()`), swallow exceptions, or rely on service-locator/hidden global state.

### Score

Report 0-100. Apply the Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. When planning, list which checks apply
and state any intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (simple DTOs, mappers, config, non-critical utilities): build, format, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence adapters, API controllers): add failure-path and integration tests, coverage. Add MUST 5, 7, 8.
- High (core business rules, state transitions, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, financial, audit, data integrity, safety-critical): add golden/contract tests, error/rejection paths, audit/traceability, async cancellation tests, mutation tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the solution
restores and builds, nullable/compiler/analyzer and formatting checks ran, applicable gates ran,
failures were fixed or documented, `PHASE-RESULT.md` was created, and the score is supported by
evidence. A successful `dotnet test` alone is not enough when the phase changed dependencies, public
API, persistence, async behavior, serialization, security behavior, observability, or deployment.

## 2. SDK, Target Framework, and Language Version

Use the SDK, target framework, and language version defined by the project.

- Always: use the SDK from `global.json` when present; use the project target framework and `LangVersion`; use stable SDKs for production; document the SDK version and whether nullable is enabled and Debug/Release; verify dependency additions do not silently require a higher target framework.
- Prefer: a checked-in `global.json` for deterministic behavior; LTS/STS .NET versions; explicit `Nullable` and `ImplicitUsings`; solution-level policy via `Directory.Build.props`; document `RuntimeIdentifier`/trimming/AOT/single-file/container assumptions when relevant.
- Avoid: relying on whatever SDK is installed; changing the target framework without documenting API/runtime/deployment impact; preview language features without approval; treating a local build as evidence for all platforms.
- Almost never: use preview SDKs for production code without a documented reason; disable analyzers globally to finish; raise a library target framework without considering downstream consumers.

## 3. Solution, Build, and NuGet Supply Chain

The build must be reproducible from a clean checkout using documented .NET commands.

- Always: use SDK-style projects; keep `.sln`/project files/`Directory.Build.props`/`global.json`/`nuget.config` intentional; restore from documented sources; keep package references minimal and intentional; verify command-line build, not only IDE build; check vulnerable/deprecated packages after dependency changes.
- Prefer: `Directory.Build.props` for shared warnings/nullable/analyzers; `Directory.Packages.props` for central package management; lock-file restore in CI where policy supports it; `PrivateAssets="all"` for analyzer/build-only packages; first-party libraries when sufficient.
- Avoid: local-only references; machine-specific package sources without documentation; dependence on IDE design-time behavior; blind package upgrades across the repo in a focused phase; floating versions without policy.
- Almost never: commit package-source credentials; add packages that execute build-time code without review; suppress vulnerability warnings without a documented compensating control; treat `dotnet restore` success as proof the dependency graph is safe.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
dotnet --info
dotnet restore
dotnet format --verify-no-changes
dotnet build --configuration Release --no-restore -warnaserror
dotnet test --configuration Release --no-build
```

Stronger (services/libraries/critical code): `dotnet test --collect:"XPlat Code Coverage"`,
`dotnet list package --vulnerable --include-transitive`, `dotnet list package --deprecated`,
nullable/analyzer warnings as errors for touched projects, public-API compatibility checks for
libraries, publish/trim/AOT checks where the code targets those modes. A command not run is not
evidence; a command that failed and was ignored is negative evidence.

## 5. Formatting, Warnings, Nullable, and Analyzers

Compiler warnings, nullable warnings, and analyzers are quality gates, not suggestions.

- Always: keep formatting deterministic (`.editorconfig`, `dotnet format --verify-no-changes`); treat new compiler/nullable warnings as failures; run project-configured analyzers; keep suppressions local and justified; avoid blanket `NoWarn`.
- Prefer: `TreatWarningsAsErrors=true` for production projects; `AnalysisLevel=latest`; `EnforceCodeStyleInBuild=true`; analyzers for security/performance/async/disposal/globalization; narrow `#pragma warning disable` with a reason.
- Avoid: the `!` null-forgiving operator to silence design problems; `#pragma` around large regions; global `NoWarn`; disabling nullable because warnings are inconvenient; `dynamic`/reflection to evade compiler feedback.
- Almost never: suppress security, nullability, async, disposal, or threading warnings in critical code without documented review; disable analyzers globally to finish.

## 6. Naming, Namespaces, and Architecture

Names must reveal intent; namespaces and projects reflect architecture.

- Always: use domain language; C# conventions; `Async` suffix for `Task`-returning methods; keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport models separate from domain; use `internal` when types need not be public; keep public surface small.
- Prefer: a `Domain`/`Application`/`Infrastructure`/`Api` project layout; thin entrypoint/composition projects; dedicated test projects by boundary; `InternalsVisibleTo` sparingly; architecture tests when boundaries are critical.
- Avoid: `Helper`/`Utils`/`Common`/`Manager`/`Processor`/`Handler`/`Data` names; ambiguous `IProcessor`/`IManager`/`IService`; a giant `Program.cs`; a `Common`/`Core` project as a dumping ground; making everything public for tests.
- Almost never: business rules in controllers, minimal-API lambdas, EF mappings, queries, JSON converters, message consumers, external clients, or CLI parsing; let framework templates dictate architecture.

## 7. Architectural Boundaries

Business rules must be explicit, isolated, and tested.

- Always: keep dependency direction inward; put business rules in domain/application projects; put side effects in infrastructure/adapters; keep controllers/endpoints/consumers/hosted services thin; keep persistence focused on persistence; test boundary mappers; keep framework types out of the domain.
- Prefer: domain types with invariants; application use cases for orchestration; interfaces for persistence/clock/signing/storage/external APIs/messaging; adapters outside the core; domain errors separate from infrastructure exceptions.
- Avoid: domain depending on ASP.NET Core/EF Core/serializers/HTTP/queue clients/logging implementations; controllers calling EF Core directly for workflows; infrastructure deciding domain outcomes; API DTOs reused as domain objects; database entities reused as API responses; business rules in attributes.
- Almost never: hide business decisions in SQL/serialization/model-binding; change architecture in a phase without documenting it; make domain correctness depend on a web framework; put audit decisions in logging side effects.

## 8. Type System and Nullable Reference Types

Use the type system and nullable reference types to make invalid states hard to represent.

- Always: use domain-specific types for important identifiers and constrained values; enums/sealed hierarchies/records/value objects for closed sets and transitions; enforce invariants at construction; enable nullable reference types and treat nullable warnings as real findings; validate external inputs before constructing domain objects.
- Prefer: `EmployeeId` over raw `string`; `Money`/`DateRange` value objects; `readonly record struct`/immutable classes for value objects; `required` members only where invariants remain enforceable; `ArgumentNullException.ThrowIfNull` at public boundaries; `TryGet`/`Result`/domain errors for absence/failure.
- Avoid: `Dictionary<string, object>`/`dynamic` as a domain model; boolean flags that change behavior; primitive obsession; `default!`/`null!`/`!` to satisfy the compiler for domain objects; returning `null` from async methods instead of a meaningful result.
- Almost never: represent important state as arbitrary strings; depend on serializers to enforce non-null domain invariants; use comments to describe invariants the type system could enforce.

```csharp
// Value object: invariants enforced at construction, immutable.
public readonly record struct EmployeeId
{
    public string Value { get; }

    public EmployeeId(string value)
    {
        if (value is not { Length: 8 } || !value.All(char.IsAsciiDigit))
            throw new ArgumentException($"invalid employee id: {value}", nameof(value));
        Value = value;
    }
}

// Closed set as a sealed hierarchy — switch expressions are exhaustive.
public abstract record Event
{
    public sealed record Draft : Event;
    public sealed record Signed(string SignatureId) : Event;
    public sealed record Sent(string Protocol) : Event;
}
```

## 9. Immutability, Errors, and Process Termination

- Immutability: keep domain state immutable where practical; make mutation explicit; enforce invariants in constructors/factories/mutation methods; avoid public setters and exposing mutable collections (`IReadOnlyList<T>`); use records carefully (init properties can still allow invalid combinations); avoid global mutable/static state.
- Errors: distinguish programmer bugs, validation failures, domain rejections, infrastructure failures, cancellation, conflicts, and faults; preserve root causes (`throw;` not `throw ex;`); convert infrastructure failures at boundaries; do not leak stack traces, connection strings, tokens, SQL, or sensitive payloads to external clients; test failure branches.
- Termination/stubs: remove `TODO`/`NotImplementedException`/placeholders/`Console.WriteLine` debug leftovers; avoid `Environment.Exit` outside process entrypoints; use debug assertions only as developer diagnostics, not runtime validation; observe background-service exceptions.
- Almost never: catch `Exception` and return generic failure without preserving cause; swallow exceptions; terminate the process from domain/application/library code.

```csharp
// Domain exception expresses failure meaning; cause preserved.
public sealed class CertificateExpiredException(string certificateId, Exception? inner)
    : DomainException($"certificate {certificateId} expired", inner);

// Or model expected business outcomes as a result the caller must handle.
public abstract record SendResult
{
    public sealed record Ok(Receipt Receipt) : SendResult;
    public sealed record Rejected(string Code) : SendResult;
}
```

## 10. Async, Concurrency, and Dependency Injection

- Async: use async only for naturally asynchronous work; return `Task`/`Task<T>`; avoid `async void` except event handlers; accept and pass `CancellationToken` through I/O/EF/HTTP; avoid sync-over-async (`.Result`/`.Wait()`/`.GetAwaiter().GetResult()`) in request/application code; `ConfigureAwait(false)` in lower-level libraries; test success/failure/timeout/cancellation.
- Concurrency: keep shared mutable state minimal; define lock ownership and ordering; avoid holding locks across I/O/`await`; use `lock`/`SemaphoreSlim`/`Interlocked`/`ConcurrentDictionary`/channels deliberately; bound queues; make repeated processing idempotent; test cancellation/shutdown/duplicate handling.
- DI: keep the composition root explicit; use constructor injection; register correct lifetimes; avoid resolving services manually in domain/application code; avoid `IServiceProvider` outside composition/factories/middleware/hosted services; do not capture scoped services (DbContext, current user) in singletons; validate options at startup.
- Almost never: fire-and-forget `Task.Run` with hidden exceptions; hold a lock across network/DB/signing operations; build service providers manually except for documented framework patterns; use DI to hide cyclic dependencies.

## 11. Resources, LINQ, Serialization, and Boundaries

- Disposal/resources: dispose owned disposables (`using`/`await using`); do not dispose DI/caller-owned resources; use `IHttpClientFactory`; dispose `CancellationTokenSource`/timers/streams/registrations; do not depend on finalization for file/network/DB/lock correctness.
- LINQ/collections: understand deferred execution; avoid multiple enumeration of expensive sources; keep ordering explicit; avoid hidden side effects in queries; avoid accidentally client-side EF evaluation; use `StringComparer.Ordinal` for non-linguistic keys; return read-only/immutable collections from domain objects.
- Serialization: use DTOs at boundaries; validate decoded data before domain use; keep domain invariants independent from serialization attributes; treat unknown/missing fields deliberately; keep versioning explicit; test required/optional/null/malformed/versioned payloads; `JsonSerializerOptions` are part of the contract.
- ASP.NET/EF Core: keep endpoints thin (validate, map to use case, return); use Problem Details; authorize deliberately; keep EF Core in infrastructure with short-lived `DbContext`; use migrations; project to DTOs; use `AsNoTracking` for reads; handle concurrency conflicts; avoid N+1 and exposing EF entities as API models.

## 12. Time, Money, Security, and Dependencies

- Time/money: use `DateTimeOffset`/`TimeProvider` (inject a clock) for time-dependent behavior; UTC internally; ISO-8601 at boundaries; `decimal` for money with explicit rounding; value objects for money/measurements; never use local machine time as business truth or binary floating point for auditable money.
- Security: treat external input as untrusted; validate and encode at boundaries; authorize at the application/domain boundary; use parameterized queries/EF parameters; protect secrets and zeroize where relevant; verify TLS; use `RandomNumberGenerator` for tokens; avoid unsafe deserialization; run vulnerability checks; never implement custom crypto, disable TLS verification, store keys/certs in source, or use weak hashes.
- Dependencies: review `PackageReference` changes like source changes; keep the dependency graph small; use package source mapping where multiple feeds risk confusion; review build-time packages/analyzers/generators with extra care; document vulnerability scan results for security-sensitive services.

## 13. Testing Strategy

Tests must prove behavior, not just exercise lines.

- Always: add/update tests for changed behavior; test failure, edge, and boundary paths; test boundary mappers and validation; keep tests deterministic; avoid real time/network/order/external dependence; use behavior-named tests.
- Prefer: xUnit/NUnit/MSTest; FluentAssertions or expressive assertions; mocks only for boundaries; Testcontainers/WebApplicationFactory for integration; WireMock/MockHttp for HTTP; golden tests for payloads; injected `TimeProvider`; property tests; mutation testing for critical rules.
- Avoid: happy-path-only tests; mocking the unit under test; deep stubs; assertion-free tests; tests depending on order/time/credentials.
- Almost never: delete tests or lower thresholds to pass; rely only on happy paths; use live production credentials.

## 14. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (simple DTOs, mappers, config, non-critical utilities): build, format, basic tests.
- **Medium** (services, validation, persistence adapters, API controllers): unit + integration tests, coverage, error-path tests.
- **High** (core rules, state transitions, authorization, money/time): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits.
- **Critical** (security, signing/crypto, financial, audit, data integrity, safety-critical): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, async cancellation tests, security/dependency audit, mutation or documented readiness.

## 15. Coverage and Complexity Limits

Coverage is necessary but not sufficient; mutation testing is stronger evidence for critical rules.

### Default coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API controllers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

### Complexity limits

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

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with reason.

## 16. Quality Score Model

|Score|Meaning|
|---|---|
|91-100|Builds, tests, analyzers, formatting, dependency checks, security, architecture, failure paths, and deployment all verified for the phase scope.|
|76-90|Strong evidence with minor documented limitations.|
|61-75|Useful implementation with meaningful gaps or partial evidence.|
|41-60|Compiles or partially works but has weak tests, weak analysis, or notable risk.|
|1-40|Mostly unverified, incomplete, or risky.|
|0|Does not build, breaks architecture, or cannot be evaluated.|

### Score caps

|Missing or Failed Evidence|Maximum Score|
|---|---|
|Solution does not build from clean restore|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Formatting not verified and not explained|65|
|Nullable/compiler warnings or analyzers not run and not explained|65|
|Business rules without unit tests|60|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Async/cancellation code lacks failure/cancellation tests where relevant|80|
|Critical rules without edge-case/failure tests|80|
|Vulnerability/dependency check missing after dependency changes|85|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass, tests are meaningful, critical paths are
covered, complexity is within limits, architecture is preserved, no known quality gaps remain, no
unexplained skipped gates exist, and `PHASE-RESULT.md` contains evidence.

## 17. Definition of Done

Solution builds from clean restore; formatting verified; nullable/compiler warnings and analyzers ran
(or documented); tests pass and meaningful tests were added; coverage meets the tier; complexity
within limits or justified; architecture preserved; business rules out of controllers/EF
mappings/serialization; errors and cancellation handled deliberately; no secrets introduced;
dependencies justified; `PHASE-RESULT.md` exists. For critical code, also golden/contract/error-path
tests, audit/traceability, async cancellation tests, vulnerability/dependency audit, and mutation
evidence.

## 18. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Build / format / analyzer / nullable results
## Coverage results
## Async / cancellation evidence (if applicable)
## Vulnerability / dependency check results
## Architecture boundary checks
## Public API impact (if applicable)
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

## 19. Final Checklist

Builds from clean restore; format verified; warnings/nullable/analyzers ran; tests pass, meaningful,
cover failure paths; coverage measured or documented; complexity within limits; architecture
preserved; business rules out of controllers/EF mappings/serialization; errors and cancellation
handled; no `async void`/sync-over-async/swallowed exceptions; no secrets committed; dependencies
justified; `PHASE-RESULT.md` exists; score is evidence-based; remaining work to reach 100 documented.
