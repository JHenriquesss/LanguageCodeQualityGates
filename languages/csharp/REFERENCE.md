# C# Code Quality Gate

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines a C# and .NET quality gate for implementation work.

Its purpose is to prevent low-quality C# code from being generated, accepted, copied into a project, merged, or treated as complete without measurable engineering evidence.

This is not a formatting preference document. This is an engineering control document.

C# and .NET give teams a powerful type system, generics, nullable reference types, async/await, LINQ, Roslyn analyzers, SDK-style projects, mature package management, fast test tooling, ASP.NET Core, Entity Framework Core, native interop, source generators, trimming, Native AOT, and a rich standard library. C# code can still be poor software. C# code can still be:

- architecturally wrong
- over-abstracted
- under-abstracted
- null-prone despite nullable reference types
- exception-prone
- async-deadlock-prone
- cancellation-unsafe
- thread-unsafe
- allocation-heavy
- reflection-heavy without reason
- dependency-injection-abusing
- Entity Framework query-fragile
- ASP.NET boundary-blurring
- untestable because of static time, static global state, or hidden service location
- package-heavy
- supply-chain risky
- trimming/AOT fragile
- platform-specific without documentation
- unauditable where auditability matters
- insecure despite passing unit tests
- hard to understand
- hard to maintain
- business-incorrect even when it compiles

The implementation is not complete when `.cs` files are created. The implementation is complete only when the code:

- builds from a clean restore
- targets an intentional .NET SDK, target framework, and C# language version
- uses nullable reference types deliberately
- passes compiler warnings, analyzers, and configured formatting checks or documents justified exceptions
- has meaningful automated tests
- preserves architectural boundaries
- handles errors and cancellation deliberately
- avoids `async void`, fire-and-forget work, service-locator design, and hidden global state
- controls NuGet dependency growth
- is secure by default
- is observable without leaking secrets or sensitive data
- is auditable where required
- has measurable evidence in `PHASE-RESULT.md`

This document must be followed together with project-specific rules such as:

- `AGENTS.md`
- `PHASE-PLAN*.md`
- `QUALITY-GATES.md`
- `LANGUAGE-QUALITY-GATE.md`
- `architecture.md`
- `Directory.Build.props`
- `.editorconfig`
- `global.json`
- `nuget.config`
- solution-level package management files
- CI workflow definitions
- repository-specific security and compliance policies

If this file conflicts with a phase-specific rule, follow the stricter rule unless the deviation is explicitly documented in `PHASE-RESULT.md`.

---

## Reference Baseline

Use the project-approved versions of these references when they exist. For new projects, use current stable .NET and official Microsoft guidance unless a stronger project policy exists.

Primary references:

- Microsoft C# language documentation: https://learn.microsoft.com/dotnet/csharp/
- C# coding conventions: https://learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions
- Nullable reference types: https://learn.microsoft.com/dotnet/csharp/nullable-references
- C# compiler warning/error options: https://learn.microsoft.com/dotnet/csharp/language-reference/compiler-options/errors-warnings
- .NET code analysis: https://learn.microsoft.com/dotnet/fundamentals/code-analysis/overview
- .NET code style rules and EditorConfig: https://learn.microsoft.com/dotnet/fundamentals/code-analysis/code-style-rule-options
- .NET unit testing best practices: https://learn.microsoft.com/dotnet/core/testing/unit-testing-best-practices
- ASP.NET Core security documentation: https://learn.microsoft.com/aspnet/core/security/
- ASP.NET Core best practices: https://learn.microsoft.com/aspnet/core/fundamentals/best-practices
- NuGet package management: https://learn.microsoft.com/nuget/
- NuGet Central Package Management: https://learn.microsoft.com/nuget/consume-packages/central-package-management
- NuGet lock files: https://learn.microsoft.com/nuget/consume-packages/package-references-in-project-files#locking-dependencies
- NuGet package source mapping: https://learn.microsoft.com/nuget/consume-packages/package-source-mapping
- .NET trimming and trim analysis: https://learn.microsoft.com/dotnet/core/deploying/trimming/
- Native AOT deployment: https://learn.microsoft.com/dotnet/core/deploying/native-aot/
- Secure coding and application security references appropriate to the project, including OWASP guidance for web software

Secondary references when applicable:

- Framework Design Guidelines for public .NET APIs
- Roslyn analyzer documentation
- Entity Framework Core documentation
- System.Text.Json documentation
- Microsoft.Extensions.DependencyInjection, Logging, Configuration, and Options documentation
- OpenTelemetry .NET documentation
- BenchmarkDotNet documentation for performance-sensitive code
- Test framework documentation for xUnit, NUnit, MSTest, Verify, FsCheck, or project-approved alternatives

A reference is not a substitute for judgment. The project architecture, domain correctness, security posture, and measurable evidence win.

---

# 0. Normative Core (read this first)

This section is the enforceable summary of the whole gate. Everything below it is rationale and detail. At the end of any implementation, the LLM or engineer MUST verify every item here. If time or context is limited, obey this core and consult the numbered sections only when a check trips or needs detail.

## MUST (hard gate — a failure caps the score; see Score caps)

1. Solution builds from a clean restore: `dotnet build --configuration Release`.
2. Formatting passes: `dotnet format --verify-no-changes`.
3. Nullable warnings, compiler warnings, and analyzers ran; new findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `dotnet test --configuration Release`.
5. Coverage meets the risk tier (see Default coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, EF mappings, and serialization.
8. Untrusted input is validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors and cancellation handled deliberately; no swallowed failures.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress analyzer/compiler/nullable warnings (`#pragma`, `NoWarn`, `!`) to pass.
- Use `async void` (outside event handlers), block on async (`.Result`/`.Wait()`), swallow exceptions, or rely on service-locator/hidden global state.

## Score

Report 0-100. Apply the Score caps. State the evidence for the score and the remaining work to reach 100. The detailed sections below expand each item with Always / Prefer / Avoid / Almost-never guidance.

## Scope by risk tier (read this when planning)

Before implementing, classify the change and scope the plan and the review to its tier. Do not apply critical-tier rigor to a throwaway script, and do not ship business rules with only low-tier checks. When planning, list which checks apply for the tier and state any intentionally excluded and why.

- Low (simple DTOs, mappers, config, non-critical utilities): build, format, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence adapters, API controllers): add failure-path and integration tests, coverage. Add MUST 5, 7, 8.
- High (core business rules, state transitions, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, legal/financial/compliance, audit, data integrity): add golden/contract tests, error/rejection paths, audit/traceability, async cancellation tests, mutation tests where applicable. Full gate, no skipped checks.

---

# 1. Non-Negotiable Completion Rule

The implementation LLM or engineer must not declare the phase complete merely because C# code was written.

A phase is complete only when:

1. The planned implementation exists.
2. Relevant automated tests exist.
3. The solution restores from the declared package sources.
4. The solution builds.
5. Nullable warnings, compiler warnings, analyzers, and configured style rules were executed.
6. Formatting was checked.
7. The applicable quality gates were executed.
8. Failures were fixed or documented with concrete blockers.
9. `PHASE-RESULT.md` was created.
10. The quality score is supported by evidence.

`PHASE-RESULT.md` must exist before the final implementation message is sent.

The final implementation message must be exactly:

```text
I finished the implementation
```

No extra words. No summary. No apology. No markdown.

## Completion hardening

- Completion requires evidence from the exact repository state that will be handed off, not a scratch directory, stale branch, copied snippet, or partial solution.
- Generated `.cs` files count as implementation and must satisfy the same gate unless explicitly excluded with a reason.
- A successful `dotnet test` alone is not enough when the phase changed dependencies, public API, persistence, async behavior, serialization contracts, security behavior, legal rules, observability, deployment, trimming, or background processing.
- Any skipped command must include the concrete blocker, not a vague statement such as `tool unavailable`.
- Any command run from the wrong directory is invalid evidence.
- Any command run before final code changes is stale evidence.
- Manual testing must be described as manual evidence and must not replace automated tests for business logic.
- `PHASE-RESULT.md` must explain residual risk in plain language.
- The implementation must not inflate the quality score for code that lacks failure-path tests.
- The final response rule is part of the gate because premature summaries often hide missing evidence.

---

# 2. .NET SDK, Target Framework, and Language Version Policy

## Recommendation

Use the .NET SDK, target framework, and C# language version defined by the project.

C# quality depends on a clear toolchain policy. Nullable behavior, compiler features, SDK analyzers, source generators, trimming warnings, and package restore behavior can change across SDKs and target frameworks.

## Always do

- Use the project-defined SDK from `global.json` when present.
- Use the target framework already defined by the project unless the phase explicitly changes it.
- Use the project-defined `LangVersion` policy.
- Use stable .NET SDKs for production code unless a preview SDK is explicitly required and documented.
- Document the SDK version in `PHASE-RESULT.md`.
- Document the target frameworks affected.
- Document whether nullable reference types are enabled.
- Document whether the build used Debug or Release.
- Document platform assumptions when code is platform-sensitive.
- Verify that dependency additions do not silently require a higher target framework.
- Verify behavior under intended runtime identifiers when deployment artifacts are affected.

## Prefer

- A checked-in `global.json` for repositories that need deterministic SDK behavior.
- `TargetFramework` for one target and `TargetFrameworks` only when multi-targeting is truly required.
- Current LTS or project-approved STS .NET versions.
- Explicit `Nullable` and `ImplicitUsings` settings.
- Solution-level policy through `Directory.Build.props` and `Directory.Build.targets`.
- Explicit CI-equivalent commands.
- Small, routine SDK upgrades with test evidence rather than large jumps.

## Avoid

- Relying on whatever SDK is installed locally.
- Changing `TargetFramework` without documenting API, runtime, deployment, and dependency impact.
- Depending on preview language features without project approval.
- Changing `LangVersion` casually.
- Treating a successful local build as evidence for all target platforms.
- Building with a different SDK than CI without documenting it.

## Almost never do

- Use preview SDKs for production business code without a documented reason.
- Hide required SDK information only in local developer notes.
- Disable analyzers globally to finish a phase.
- Use toolchain changes as a substitute for clean design.
- Raise target frameworks in a library without considering downstream consumers.

## C# hardening

- Treat `TargetFramework` as part of the compatibility contract.
- Treat `LangVersion` as part of the source contract.
- Treat `Nullable` as part of correctness, not style.
- Treat `AnalysisLevel` and analyzer settings as part of the quality gate.
- Document `RuntimeIdentifier`, self-contained publishing, trimming, Native AOT, single-file, ReadyToRun, and container assumptions when relevant.
- For reusable libraries, consider SemVer and downstream users before changing target frameworks.
- For long-lived services, record actual `dotnet --info` output, not only the intended SDK.
- For source generators and code-generation tooling, record generator versions separately from the SDK version.

---

# 3. Solution, Project, and Build Reproducibility

## Recommendation

The build must be reproducible from a clean checkout using documented .NET commands.

A C# implementation must keep restore, build, test, and publish behavior predictable across local machines and CI.

## Always do

- Use SDK-style projects for modern .NET unless maintaining legacy projects.
- Keep `.sln`, `.slnx`, project files, `Directory.Build.props`, `Directory.Build.targets`, `global.json`, `.editorconfig`, and `nuget.config` intentional.
- Keep project references aligned with architecture.
- Keep package references minimal.
- Restore from documented package sources.
- Use lock-file or central package management policy where the project requires it.
- Keep build behavior independent from IDE state.
- Keep build behavior independent from uncommitted local files.
- Make build commands documented in `PHASE-RESULT.md`.
- Verify command-line build, not only Visual Studio build.

## Prefer

- One solution containing coherent projects.
- `src/` and `tests/` separation when project scale justifies it.
- `Directory.Build.props` for shared warnings, nullable, analyzers, and language settings.
- `Directory.Packages.props` for central package management in multi-project repositories.
- Project references that reflect dependency direction.
- Thin entrypoint projects for composition.
- Dedicated test projects by boundary or component.
- Repeatable generation/build/test steps.

## Avoid

- Local-only file references.
- Machine-specific package sources without documentation.
- Hidden dependence on Visual Studio design-time behavior.
- Build behavior hidden in pre-build/post-build scripts without documentation.
- Multiple solutions that drift without policy.
- Project references that bypass architectural layers.
- Generated code that changes every run because of timestamps, local paths, random ordering, or environment-specific data.

## Almost never do

- Add a project merely to hide a dependency cycle.
- Use build scripts to hide business logic.
- Fetch remote resources during normal build without explicit approval.
- Make build success depend on local secrets.
- Make build success depend on uncommitted files.

## Reproducibility hardening

- Reproducibility means a clean clone can run the documented commands without relying on local package caches, local secrets, IDE actions, or local project references outside the repository.
- If private feeds are used, document the feed policy without exposing credentials.
- Ensure generated imports/namespaces do not point to scratch projects.
- Verify command-line `dotnet build` after project or package refactors.
- Verify test-only dependencies do not leak into production projects.
- Keep central build props explainable.
- Keep `NoWarn`, `WarningsNotAsErrors`, and analyzer suppressions explainable.
- Avoid adding a second solution merely to avoid fixing project boundaries.

---

# 4. NuGet, Package Governance, and Supply Chain Policy

## Recommendation

NuGet dependencies are source-level risk. Treat package references, transitive dependencies, package sources, and restore behavior as quality artifacts.

## Always do

- Keep package additions intentional.
- Keep dependency graph changes small.
- Document new package references.
- Prefer project-approved package sources.
- Use `Directory.Packages.props` where central package management is project policy.
- Use lock files where deterministic restore is required.
- Check vulnerable packages after meaningful dependency changes.
- Check deprecated packages when applicable.
- Avoid unnecessary transitive exposure in library packages.
- Verify package license obligations when relevant.
- Do not commit credentials in `nuget.config`.

## Prefer

- First-party .NET libraries when they are sufficient.
- Mature, maintained packages with clear ownership.
- Package source mapping in repositories with multiple feeds.
- Lock-file restore in CI for applications/services when project policy supports it.
- Package version updates that are targeted and reviewed.
- `PrivateAssets="all"` for analyzer, source generator, and build-only packages where appropriate.
- `IncludeAssets` and `ExcludeAssets` only when the asset flow is understood.

## Avoid

- Adding dependencies for trivial helpers.
- Blind package upgrades across the whole repository inside a focused phase.
- Accepting vulnerable or deprecated packages without documentation.
- Using abandoned packages because they are convenient.
- Letting transitive dependencies become accidental public API.
- Relying on floating versions without policy.
- Using untrusted package sources.
- Restoring from multiple public/private sources without mapping where dependency confusion is possible.

## Almost never do

- Commit package source credentials.
- Add packages that execute build-time code without review.
- Suppress vulnerability warnings without a documented compensating control.
- Use a forked package without owner, version, reason, and exit plan.
- Treat `dotnet restore` success as evidence that the dependency graph is safe.

## Supply-chain hardening

- `PackageReference` changes must be reviewed like source changes.
- Central package version changes must be reviewed for every consuming project.
- Lock-file changes must be explained when large, unexpected, or unrelated.
- Use package source mapping where multiple feeds could create dependency-confusion risk.
- Review build-time packages, analyzers, generators, and MSBuild props/targets with extra care because they can affect the build process.
- For private packages, document feed configuration without exposing tokens.
- For libraries, decide whether transitive dependencies are acceptable for consumers.
- For security-sensitive services, document vulnerability scan results.

---

# 5. Mandatory Command Evidence

The implementation must run applicable commands and document the result in `PHASE-RESULT.md`.

A command that was not run is not evidence. A command that failed but was ignored is negative evidence.

## Baseline commands

Run from the repository root or documented solution directory:

```bash
dotnet --info
dotnet --list-sdks
dotnet restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet format --verify-no-changes
```

When the project uses lock files:

```bash
dotnet restore --locked-mode
```

When configured or available:

```bash
dotnet build --configuration Release --no-restore -warnaserror
dotnet test --configuration Release --collect:"XPlat Code Coverage"
dotnet list package --vulnerable --include-transitive
dotnet list package --deprecated
dotnet list package --outdated
dotnet workload restore
```

For projects with package creation:

```bash
dotnet pack --configuration Release --no-build
```

For deployable applications:

```bash
dotnet publish --configuration Release --no-build
```

For trimming or Native AOT affected projects:

```bash
dotnet publish --configuration Release -p:PublishTrimmed=true
dotnet publish --configuration Release -p:PublishAot=true
```

Run these only when they match the project target and deployment policy.

## Stronger baseline for services and libraries

- `dotnet build -warnaserror`
- analyzer warnings as errors for touched projects
- nullable warnings as errors for touched projects
- `dotnet test` with coverage
- integration tests for external boundaries
- contract tests for serialization and APIs
- package vulnerability/deprecation checks
- public API compatibility checks for libraries
- publish checks for deployable applications
- trim/AOT checks when the code is intended to support those modes

## Required evidence format

`PHASE-RESULT.md` must include:

```markdown
## Commands run

- `command here`

## Commands passed

- `command here`

## Commands failed

- `command here`
- Reason:
- Impact:
- Required fix:

## Commands not run

- `command here`
- Reason:
- Impact:
- Follow-up required:
```

## Evidence hardening

- For multi-targeted projects, verify every affected target framework.
- For platform-specific code, verify each intended platform or document unsupported platforms.
- For code that changes async, concurrency, cancellation, background workers, locks, channels, timers, or thread-safe collections, include targeted tests.
- For code that changes public API, include compatibility evidence.
- For code that changes dependencies, include vulnerability and dependency inspection evidence.
- For code that handles untrusted input, include security/static-analysis evidence where configured.
- For code that changes generated artifacts, run generation and verify deterministic diffs.
- For code that changes serialization, include encoding and decoding tests.
- For code that changes persistence, include migration/query/mapping tests.
- For legal, audit, signing, payroll, health, finance, or regulatory code, include golden, contract, error, authorization, and audit tests.

---

# 6. Formatting, Style, and EditorConfig

## Recommendation

Use `.editorconfig`, Roslyn formatters, and analyzers. Do not debate formatting in implementation work.

## Always do

- Keep formatting deterministic.
- Use project `.editorconfig` settings.
- Run `dotnet format --verify-no-changes` when available.
- Keep namespaces, file-scoped namespaces, braces, using directives, and newline style consistent with the project.
- Remove unused usings.
- Avoid formatting churn unrelated to the phase.
- Keep style enforcement in build when the project requires it.

## Prefer

- File-scoped namespaces for modern projects when consistent with project style.
- Explicit `var` policy through `.editorconfig`, not personal taste.
- Consistent ordering inside files:
  - license/header if required
  - using directives
  - namespace
  - public type
  - fields
  - constructors
  - properties
  - methods
  - nested types only when justified
- Small files organized around cohesive responsibilities.
- One primary type per file for domain/application code.

## Avoid

- Reformatting unrelated files.
- Clever alignment.
- Hiding long functions behind formatting.
- Mixing file-scoped and block-scoped namespaces without policy.
- Using style changes as a substitute for design.
- Depending on IDE-only cleanup.

## Almost never do

- Disable formatting checks to finish a phase.
- Leave generated formatting churn without reason.
- Suppress style rules globally because one file is inconvenient.

## Style hardening

- Formatting evidence should verify no files remain unformatted, not merely run formatting silently.
- Do not mix multiple unrelated types into one large file unless the project pattern justifies it.
- Keep generated file headers stable and clear.
- Keep code examples in XML docs formatted and compilable where possible.
- A style pass is not an architecture pass; good formatting cannot rescue poor boundaries.

---

# 7. Compiler Warnings, Nullable Warnings, Analyzers, and Suppressions

## Recommendation

Compiler warnings, nullable warnings, and analyzers are quality gates, not suggestions.

## Always do

- Treat new compiler warnings as failures.
- Treat new nullable warnings as failures where nullable is enabled.
- Run project-configured analyzers.
- Fix analyzer findings unless a narrow, documented reason exists.
- Keep suppressions local and justified.
- Avoid blanket `NoWarn` entries.
- Document new suppressions in `PHASE-RESULT.md`.

## Prefer

- `TreatWarningsAsErrors=true` for production projects when feasible.
- `WarningsAsErrors` for nullable and important analyzer rules when full strictness is being adopted gradually.
- `AnalysisLevel=latest` or project-approved analysis level.
- `EnforceCodeStyleInBuild=true` when code style must be enforced in CI.
- `.editorconfig` severity for analyzer rules.
- Roslyn analyzers for security, performance, API usage, globalization, async, and maintainability.
- Narrow `#pragma warning disable` with a reason and minimal scope.
- `SuppressMessage` only when a suppression must be visible to tooling.

## Avoid

- Using `!` null-forgiving operator to silence design problems.
- `#pragma warning disable` around large regions.
- Global `NoWarn` without policy.
- Hiding warnings in `Directory.Build.props` during implementation.
- Disabling nullable because warnings are inconvenient.
- Treating analyzers as cosmetic.

## Almost never do

- Suppress security, nullability, async, disposal, injection, or threading warnings in critical code without documented review.
- Disable analyzers globally to finish a phase.
- Use `dynamic` or reflection to evade compiler feedback.
- Accept generated code warnings without documenting generator limitations.

## Analyzer hardening

- Review nullable warnings as possible runtime `NullReferenceException` risks.
- Review disposal warnings as resource leak risks.
- Review async warnings as correctness and scalability risks.
- Review globalization warnings when parsing, formatting, casing, or comparing strings.
- Review security warnings as potential vulnerabilities, not noise.
- Review performance warnings in hot paths, but do not perform speculative micro-optimization without measurement.
- `dotnet format` and analyzers being unavailable is not a pass; it must be documented.

---

# 8. Naming Rules

## Recommendation

Names must reveal intent and domain meaning.

A maintainer should understand the purpose of a namespace, type, method, property, command, query, test, or package reference without reading the full implementation.

## Always do

- Use domain language.
- Use precise names.
- Name methods by behavior.
- Name tests by expected behavior.
- Use C# naming conventions.
- Keep abbreviations only when domain-standard.
- Distinguish raw data from validated data.
- Distinguish DTOs, commands, results, events, entities, value objects, and persistence records.

## Prefer

- `EmployeeExposurePeriod` over `PeriodData`.
- `SignedXmlDocument` over `XmlResult`.
- `OccupationalRiskAssessment` over `RiskInfo`.
- `EventTransmissionReceipt` over `ResponseData`.
- `ValidateEventVersion` over `ProcessVersion`.
- `CanBeCancelled` over `CheckStatus`.
- `RawEventPayload` for untrusted input.
- `ValidatedEventPayload` after validation.
- `UnsignedDocument` before signing.
- `SignedDocument` after signing.
- `Id`, `Url`, `Xml`, `Json`, `Http`, `Api`, `Sql` naming consistent with project convention.

## Avoid

- Names such as:
  - `Helper`
  - `Utils`
  - `Common`
  - `Processor`
  - `Manager`
  - `Handler`
  - `Data`
  - `Object`
  - `Thing`
- Technical-only names for domain concepts.
- Ambiguous interfaces such as `IProcessor`, `IManager`, or `IService`.
- Overloaded terms with multiple meanings.
- Boolean parameters whose meaning is unclear.
- Naming domain namespaces after frameworks.

## Almost never do

- Use placeholder names in production code.
- Use single-letter names outside tiny local scopes.
- Name domain types only after database tables or transport payloads.
- Let generated names define the domain language.
- Add `I` interfaces for every class when no abstraction exists.

## Naming hardening

- Avoid suffixes that hide responsibility. `PaymentService` may be fine at an application boundary, but `DataService`, `CommonService`, or `GenericManager` is usually a smell.
- Prefer behavior-rich names: `SubmitEventBatch`, `CalculateExposureWindow`, `CreateTransmissionReceipt`.
- Name tests as behavior statements: `ValidateEventRejectsExpiredCertificate`.
- Use `Async` suffix for methods returning `Task`, `Task<T>`, `ValueTask`, or `ValueTask<T>` when project convention follows .NET guidelines.
- Avoid names that encode implementation details when the concept is domain-level.

---

# 9. Namespaces, Projects, and Architecture Structure

## Recommendation

C# namespaces and projects must reflect architecture, not random grouping.

A good .NET structure makes invalid dependencies visible and hard to introduce.

## Always do

- Preserve `architecture.md`.
- Keep domain logic separate from infrastructure.
- Keep application/use-case orchestration separate from adapters.
- Keep API/transport models separate from domain models.
- Keep external clients outside the domain.
- Keep project references directional.
- Keep public surface area small.
- Avoid exporting internals accidentally.
- Keep namespace dependencies clean.
- Use `internal` visibility when types do not need to be public.

## Prefer

For a service:

```text
src/
  Company.Product.Domain/
  Company.Product.Application/
  Company.Product.Infrastructure/
  Company.Product.Api/
  Company.Product.Worker/
  Company.Product.Contracts/        # only if intentionally public/shared
  Company.Product.Composition/      # optional composition root

tests/
  Company.Product.Domain.Tests/
  Company.Product.Application.Tests/
  Company.Product.Infrastructure.Tests/
  Company.Product.Api.Tests/
  Company.Product.Architecture.Tests/
```

For a library:

```text
src/
  Company.Product/
  Company.Product.Analyzers/        # if project ships analyzers
  Company.Product.SourceGeneration/ # if project ships generators

tests/
  Company.Product.Tests/
  Company.Product.CompatibilityTests/
```

## Avoid

- One giant `Program.cs`.
- One giant project with unrelated responsibilities.
- One `Common` project that becomes a dumping ground.
- Domain projects referencing infrastructure projects.
- API projects containing business rules.
- Infrastructure returning provider-specific models into the domain.
- Cyclic conceptual dependencies.
- Making everything public because tests are in another assembly.
- Creating many projects without architectural reason.

## Almost never do

- Put business rules in:
  - controllers
  - minimal API lambdas
  - EF Core mappings
  - database queries
  - JSON converters
  - XML builders
  - message consumers
  - external API clients
  - CLI argument parsing
- Create `Shared`, `Common`, or `Core` projects as dumping grounds.
- Let package or framework templates dictate the architecture.

## Structure hardening

- Use `InternalsVisibleTo` sparingly and deliberately.
- Do not make domain internals public only to test them.
- Use architecture tests when boundaries are critical.
- Keep generated DTOs separate from domain objects when invariants differ.
- Keep adapter packages/provider-specific implementations outside the core.
- Do not use a top-level `Contracts` project to share mutable internal models unless it is intentionally a stable external contract.

---

# 10. Architectural Boundaries

## Recommendation

Business rules must be explicit, isolated, and tested.

C# interfaces, access modifiers, projects, namespaces, dependency injection, and analyzers should enforce boundaries rather than bypass them.

## Always do

- Keep dependency direction inward.
- Put business rules in domain/application projects.
- Put side effects in infrastructure/adapters.
- Keep controllers, endpoints, queue consumers, and hosted services thin.
- Keep persistence code focused on persistence.
- Keep external clients focused on communication.
- Keep JSON/XML generation separate from business decisions.
- Test boundary mappers.
- Keep framework-specific types out of the domain.
- Keep transaction and unit-of-work handling in application/infrastructure boundaries, not pure domain logic.

## Prefer

- Domain types with invariants.
- Application use cases for orchestration.
- Interfaces for persistence, clocks, signing, storage, external APIs, messaging, and unit-of-work boundaries where useful.
- Adapter implementations outside the core.
- DTO-to-domain mappers at boundaries.
- Domain errors separate from infrastructure exceptions.
- Import/reference restriction checks when boundaries are critical.

## Avoid

- Domain depending on ASP.NET Core, EF Core, logging frameworks, JSON serializers, HTTP clients, queue clients, or generated external payload packages.
- Controllers calling EF Core directly for business workflows.
- Infrastructure deciding domain outcomes.
- API DTOs reused as domain objects.
- Database entities reused as API responses.
- Provider payloads leaking into core logic.
- Business rules hidden in attributes.
- Authorization or tenancy rules existing only in middleware when they affect domain correctness.

## Almost never do

- Hide business decisions inside SQL queries.
- Hide legal rules inside JSON/XML serialization.
- Hide validation inside model-binding attributes only.
- Change architecture inside a phase without documenting reason and risk.
- Make domain correctness depend on a web framework.
- Put audit/legal decisions in logging side effects.

## Boundary hardening

- Domain projects should not reference ASP.NET Core, EF Core, Dapper, HTTP client libraries, message brokers, logging implementations, or generated provider models unless the architecture explicitly allows it.
- Application projects may coordinate ports, transactions, clocks, and domain rules, but should not hide provider-specific behavior.
- Transport handlers should parse boundary shape, call use cases, map results, and return responses.
- Persistence adapters should map database records to domain/application types explicitly.
- Serialization builders should not decide whether a legal or business event is valid; they should serialize already validated state.
- Audit decisions should be part of the application/domain flow, not incidental logs.

---

# 11. C# Type System as a Quality Tool

## Recommendation

Use C#'s type system to make invalid states hard to represent.

Do not use strings, booleans, dictionaries, anonymous objects, or raw primitives when a meaningful domain type is needed.

## Always do

- Use domain-specific types for important identifiers and constrained values.
- Use enums, sealed hierarchies, records, value objects, or discriminated-union-like patterns for closed sets and state transitions.
- Keep invariants enforced at construction.
- Prefer compile-time guarantees over runtime comments.
- Avoid exposing setters or mutable collections that allow invalid state.
- Distinguish untrusted, validated, signed, sent, rejected, and persisted states in types where useful.
- Use parsing/validation functions for fallible construction.

## Prefer

- `EmployeeId` instead of raw `string`.
- `EventVersion` with validation instead of raw `string`.
- `SignedXmlDocument` instead of raw `byte[]`.
- `TransmissionProtocol` instead of raw protocol strings.
- `DateRange` instead of two unrelated dates.
- `Money` or `Amount` value objects instead of `decimal` everywhere.
- `Validated<T>` wrappers only when they clarify state.
- Constructors/factories returning validated objects or explicit failures.
- `required` members only when object initializers are appropriate and invariants remain enforceable.

## Avoid

- `Dictionary<string, object>` as a domain model.
- `dynamic` as business data.
- Boolean flags that change behavior.
- Primitive obsession for important concepts.
- Invalid intermediate states.
- Domain code accepting raw transport payloads.
- Business state represented by magic strings.
- Public mutable setters on domain objects.

## Almost never do

- Represent legal/event state as arbitrary strings.
- Represent money, dates, measurements, certificates, event IDs, or legal codes as unvalidated raw primitives in domain code.
- Use comments to describe invariants that types could enforce.
- Use `object`, `dynamic`, or weak dictionaries for regulatory or financial event structures.

## Type-system hardening

- C# does not have built-in discriminated unions; compensate with sealed types, private constructors, exhaustive tests, and pattern-matching defaults that fail safely.
- Use `readonly record struct` or immutable classes carefully for value objects.
- Keep fields/properties private or init-only when invariants must be protected.
- Validate external strings before converting to enums or domain-specific types.
- Expose behavior through methods instead of exposing mutable state.
- Use compile-time interface assertions through tests or analyzers only where they add clarity.

## Example expectation

```csharp
public sealed record EventStatus
{
    public static readonly EventStatus Draft = new("draft");
    public static readonly EventStatus Signed = new("signed");
    public static readonly EventStatus Sent = new("sent");
    public static readonly EventStatus Rejected = new("rejected");

    private static readonly IReadOnlyDictionary<string, EventStatus> Known =
        new Dictionary<string, EventStatus>(StringComparer.Ordinal)
        {
            [Draft.Value] = Draft,
            [Signed.Value] = Signed,
            [Sent.Value] = Sent,
            [Rejected.Value] = Rejected,
        };

    private EventStatus(string value) => Value = value;

    public string Value { get; }

    public static bool TryParse(string raw, out EventStatus status) =>
        Known.TryGetValue(raw, out status!);
}
```

Use the project's preferred result/error style. The important rule is that invalid state is not casually represented as an arbitrary string.

---

# 12. Nullable Reference Types and Null Semantics

## Recommendation

Nullable reference types must be treated as correctness tools, not annotation noise.

`null` is one of the most common causes of runtime failure in C#. The language can reduce the risk only when the team uses the feature honestly.

## Always do

- Enable nullable reference types for new modern C# code unless maintaining legacy code under a migration plan.
- Treat nullable warnings as real findings.
- Use `T?` only when absence is meaningful.
- Validate external inputs before constructing domain objects.
- Avoid returning `null` for failure when a reason matters.
- Test null inputs where null is accepted or possible from external boundaries.
- Avoid `default!` and `null!` except for narrow framework-required initialization with comments.
- Avoid `!` null-forgiving operator unless the invariant is obvious and documented.

## Prefer

- Non-nullable properties for required values.
- Constructor validation for required values.
- `TryGet` patterns for ordinary lookup absence.
- `Option`/`Maybe`-style domain types only when project-approved and clarity improves.
- `Result<T>` or domain errors when absence/failure needs explanation.
- Empty collections over null collections for public contracts unless the contract distinguishes null.
- `ArgumentNullException.ThrowIfNull` at public boundaries.

## Avoid

- Turning nullable off to avoid warnings.
- Using null to hide technical failure.
- Returning `null` from async methods instead of a meaningful result type.
- Using `string?` when an enum or value object would clarify absence/state.
- Using `!` after every service resolution, model binding, or JSON deserialization.
- Treating nullability annotations as a replacement for runtime validation of untrusted input.

## Almost never do

- Use `#nullable disable` in new production files.
- Use `null!` to satisfy the compiler for domain objects.
- Return null for validation, authorization, persistence, signing, or integration failures.
- Depend on serializers to enforce non-null domain invariants.

## Nullability hardening

- Nullable analysis is static and conservative; it does not validate external data.
- JSON/XML/model binding can create objects with missing required data; validate at boundaries.
- EF Core and serializers may require patterns that interact with nullability; isolate and document those patterns.
- Distinguish missing, empty, default, zero, and null when the contract cares.
- Avoid `FirstOrDefault` on value types when default value is ambiguous.
- Use `SingleOrDefault` only when the uniqueness assumption is valid and tested.
- Test deserialization with missing, null, empty, malformed, and extra fields.

---

# 13. Immutability, Mutation, Records, and State Transitions

## Recommendation

Prefer immutable data and explicit state transitions.

Mutation must preserve invariants.

## Always do

- Keep domain state immutable where practical.
- Make mutation explicit.
- Enforce invariants in constructors, factories, and mutation methods.
- Avoid exposing mutable internals.
- Avoid public setters on domain objects unless they are harmless and intentional.
- Test state transitions.
- Keep mutation local and obvious.
- Do not let unrelated layers mutate domain state.

## Prefer

- `record` and `record struct` for immutable values when equality semantics are desired.
- Classes for identity-bearing entities.
- `init` properties only when invariants can still be enforced.
- Private constructors plus factory methods for validated construction.
- Explicit methods such as:
  - `MarkAsSigned`
  - `MarkAsSent`
  - `MarkAsRejected`
  - `Cancel`
  - `Correct`
- Immutable command/result DTOs.
- State-specific types when transitions are critical:
  - `DraftEvent`
  - `ValidatedEvent`
  - `SignedEvent`
  - `SentEvent`
  - `RejectedEvent`

## Avoid

- Setter-heavy domain objects.
- Mutation through unrelated layers.
- Invalid temporary states.
- Global mutable dictionaries/lists.
- Static mutable registries.
- Exposing `List<T>` or mutable arrays from domain objects.
- Using records with `with` expressions that can bypass validation.

## Almost never do

- Use global mutable state for business behavior.
- Use static initialization to configure business rules from hidden environment state.
- Allow domain objects to be invalid between property assignments.
- Use record copying to create invalid domain objects.

## Immutability hardening

- C# records are not automatically domain-safe; public init properties can still allow invalid combinations.
- Return `IReadOnlyList<T>` or immutable collections when callers must not mutate state.
- Copy arrays, lists, dictionaries, spans, and byte buffers at boundaries when ownership is unclear.
- Avoid exposing mutable EF entities as domain models or API responses.
- Ensure transition methods validate current state and return explicit failures for illegal transitions.
- Test state transition matrices for critical workflows.

---

# 14. Error Handling, Exceptions, and Result Semantics

## Recommendation

C# error handling must distinguish programmer bugs, validation failures, domain rejections, infrastructure failures, cancellations, conflicts, and unexpected faults.

Exceptions are appropriate for exceptional failures and many framework boundaries. Domain/application code may use exceptions, result types, or typed errors according to project policy. The key requirement is explicit, stable semantics.

## Always do

- Handle fallible operations deliberately.
- Preserve root causes with exception chaining.
- Include actionable context.
- Convert infrastructure failures at boundaries.
- Test failure paths.
- Distinguish business rejection from technical failure.
- Avoid leaking sensitive internals in external errors.
- Keep error semantics stable for important business behavior.
- Do not swallow exceptions.
- Do not log and rethrow at every layer.

## Prefer

- Domain-specific exceptions or result errors when callers need stable behavior.
- `InvalidOperationException` for invalid object state, not external validation failure.
- `ArgumentException`/`ArgumentNullException` for invalid caller input at public APIs.
- `OperationCanceledException` for cancellation.
- `TimeoutException` or explicit timeout result where timeout is distinct.
- Problem Details responses for HTTP APIs where project policy uses them.
- Error codes for auditable/legal failures.
- Separate error models per layer:
  - domain error
  - application error
  - infrastructure exception
  - API error

## Avoid

- Throwing `Exception` directly.
- Catching `Exception` and returning generic failure without preserving cause.
- Stringly typed error handling.
- Using exceptions for ordinary control flow in hot paths.
- Returning `null` to signal failure.
- Collapsing all failures into `BadRequest` or `500`.
- Treating business rejection as infrastructure failure.
- Treating infrastructure failure as business rejection.
- Catching `OperationCanceledException` and treating it as success unless explicitly intended.

## Almost never do

- Swallow exceptions silently.
- Catch all exceptions at low layers without rethrowing/wrapping.
- Leak stack traces, connection strings, tokens, SQL, certificate material, or sensitive payloads to external clients.
- Treat regulatory rejection as a generic technical error.
- Convert every error to a string and lose structure.

## Error hardening

- Preserve inner exceptions when wrapping.
- Do not compare exception messages in production logic.
- Avoid `throw ex;`; use `throw;` to preserve stack trace when rethrowing.
- Map errors once at the appropriate boundary.
- Handle errors from disposal/flush/commit operations when they matter.
- Distinguish retryable and non-retryable failures.
- Distinguish validation, authorization, conflict, timeout, cancellation, and infrastructure failures.
- Test representative failure branches, not only the happy path.

## Required error-review questions

- Can callers programmatically distinguish important outcomes?
- Is sensitive information hidden from external responses?
- Is root cause preserved for internal diagnostics?
- Are retryable and non-retryable failures distinguishable?
- Are cancellation and timeout handled intentionally?
- Is the HTTP/status/API mapping correct where applicable?

---

# 15. Throw, Debug, TODO, and Process Termination Policy

## Recommendation

Production C# must not rely on unfinished stubs, debug assertions, or process termination for normal control flow.

## Always do

- Remove `TODO`, `FIXME`, `NotImplementedException`, and placeholder code before completion unless explicitly tracked and excluded from the phase.
- Avoid `Environment.Exit` outside process entrypoints.
- Avoid `Console.WriteLine` debug leftovers in services and libraries.
- Replace stubs with real behavior or fail the phase.
- Document any intentional unsupported path.
- Use debug assertions only as developer diagnostics, not runtime validation.

## Prefer

- Returning errors with context.
- Guard clauses for invalid input.
- Tests proving invariants.
- Exhaustive switch behavior with default failure for external state.
- Throw helpers only where they improve clarity.

## Avoid

- `throw new NotImplementedException()` in production paths.
- `Debug.Assert` as the only protection for business invariants.
- `Environment.Exit` in libraries.
- `Task.Run` fire-and-forget with hidden exceptions.
- Unhandled exceptions from background services.

## Almost never do

- Terminate a process from domain/application/library code.
- Leave stubs and call the implementation complete.
- Use debug-only behavior for security, authorization, validation, or business correctness.
- Justify an unreachable path because “the AI knows this cannot happen.”

## Hardening

- Entry points may decide process exit codes; libraries must report errors.
- Background exceptions must be observed and logged through the project observability system.
- Switch expressions over external or future-versioned data should fail safely.
- Unreachable cases should be documented and tested where important.

---

# 16. Async/Await, Tasks, and Cancellation

## Recommendation

Asynchronous C# must be designed, not sprinkled.

`async`/`await` improves scalability and clarity when used correctly. It can also introduce deadlocks, hidden exceptions, cancellation leaks, thread pool starvation, unbounded concurrency, context-capture bugs, and resource leaks.

## Always do

- Use async only for naturally asynchronous work.
- Return `Task` or `Task<T>` from async methods.
- Avoid `async void` except event handlers.
- Accept `CancellationToken` for operations that can block, wait, perform I/O, or be canceled.
- Pass cancellation tokens through to I/O, EF Core, HTTP, and external calls.
- Handle cancellation deliberately.
- Await tasks or intentionally supervise them.
- Avoid sync-over-async.
- Avoid blocking on `Task.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in request/application code.
- Test success, failure, timeout, and cancellation paths.

## Prefer

- `Task` over `ValueTask` unless measurement or API contract justifies `ValueTask`.
- `await using` for async disposal.
- `IAsyncEnumerable<T>` for streaming only when cancellation, enumeration, and resource lifetime are clear.
- `ConfigureAwait(false)` in lower-level libraries when appropriate to avoid context capture.
- `CancellationTokenSource.CancelAfter` or timeouts around external waits.
- Bounded parallelism with `Parallel.ForEachAsync`, channels, semaphores, or project-approved patterns.
- Hosted-service lifecycle patterns for service-level background work.

## Avoid

- Fire-and-forget tasks.
- `async void` outside event handlers.
- Blocking on async work.
- Ignoring cancellation tokens.
- Creating `CancellationTokenSource` without disposing it when appropriate.
- Infinite retries that ignore cancellation.
- Unbounded `Task.WhenAll` over huge collections.
- Wrapping naturally async I/O in `Task.Run`.

## Almost never do

- Start background work from a request without durable queueing or supervised lifecycle.
- Use sleeps for synchronization.
- Ignore task exceptions.
- Make regulatory/legal transmission fire-and-forget.
- Retry non-idempotent operations without protection.

## Async hardening

- Every task that can fail must have an observed error path.
- Every long-running operation must have cancellation or a documented service lifetime.
- Cancellation is not an error in the same way as infrastructure failure; map it deliberately.
- Use `TaskCreationOptions.RunContinuationsAsynchronously` where continuation execution could cause reentrancy or lock issues.
- Beware of `TaskCompletionSource` misuse; always complete it in all code paths.
- Do not use `Thread.Sleep` in async code; use `Task.Delay` with cancellation.
- Test cancellation before work starts, during external waits, and during shutdown.

---

# 17. Concurrency and Thread Safety

## Recommendation

Concurrency must be explicit, bounded, observable, and tested.

C# gives many primitives: `lock`, `Monitor`, `SemaphoreSlim`, `ReaderWriterLockSlim`, `Interlocked`, `ConcurrentDictionary`, channels, TPL Dataflow, `Parallel`, and hosted services. None of them guarantee correctness by themselves.

## Always do

- Keep shared mutable state minimal.
- Define ownership of mutable state.
- Use synchronization primitives deliberately.
- Define lock ownership and lock ordering.
- Avoid holding locks across I/O, network, database, serialization, or long CPU work.
- Set timeouts where blocking/waiting occurs.
- Test concurrency-sensitive behavior.
- Make idempotency explicit for repeated/asynchronous processing.
- Keep critical sections small.
- Document thread-safety assumptions.

## Prefer

- Immutable data shared safely.
- Message passing or channels where ownership transfer is clearer.
- `lock` for simple mutual exclusion.
- `SemaphoreSlim` for async-compatible gates.
- `Interlocked` for simple atomic counters/flags.
- `ConcurrentDictionary` only when its semantics fit.
- Bounded queues.
- Deterministic tests for cancellation and shutdown behavior.

## Avoid

- Global shared mutable state.
- Locking on public objects, strings, `typeof(T)`, or externally visible instances.
- Holding locks while awaiting.
- Calling `.Result` or `.Wait()` while holding locks.
- Unbounded channels or queues.
- Detached tasks with no supervision.
- Assuming `ConcurrentDictionary` makes a multi-step operation atomic.
- Using `volatile` as a substitute for a correct concurrency design.

## Almost never do

- Fix races with sleeps.
- Hold a lock while performing network, database, signing, file, or message-broker operations.
- Use unsafe concurrency primitives without expert review.
- Let background work fail silently.
- Build legal/regulatory workflows on unsupervised background tasks.

## Concurrency hardening

- Race-free is not enough; check deadlocks, starvation, lost updates, ordering, cancellation, and shutdown.
- Define who produces, consumes, completes, and disposes every channel/queue.
- Avoid unbounded task creation from request handlers, queue consumers, and batch loops.
- Async locks require careful design; do not `await` inside a synchronous `lock`.
- Use `SemaphoreSlim.WaitAsync` with cancellation for async gates.
- Test repeated processing, duplicate messages, partial failures, and shutdown races.

---

# 18. Dependency Injection and Lifetime Management

## Recommendation

Dependency injection is a composition tool, not an architecture substitute.

Misused DI creates service locators, lifetime bugs, hidden coupling, and untestable graphs.

## Always do

- Keep the composition root explicit.
- Register services with correct lifetimes.
- Avoid resolving services manually in domain/application code.
- Avoid `IServiceProvider` outside composition, factories, middleware, hosted services, or framework-required boundaries.
- Validate options and service graph where project policy supports it.
- Avoid injecting unused dependencies.
- Keep constructors focused.
- Test critical service registration and lifetime behavior.

## Prefer

- Constructor injection for required dependencies.
- Small interfaces at external boundaries.
- `IOptions<T>`, `IOptionsSnapshot<T>`, or `IOptionsMonitor<T>` according to lifetime needs.
- Options validation at startup.
- `IHttpClientFactory` for HTTP clients.
- Typed clients for external services.
- Explicit factory abstractions when runtime creation is necessary.

## Avoid

- Service locator patterns.
- Injecting `IServiceProvider` into business services.
- Singleton services depending on scoped services.
- Capturing scoped services in background tasks.
- Massive constructors that indicate too many responsibilities.
- Registering everything as transient by default.
- Hidden side effects during service registration.

## Almost never do

- Build service providers manually inside registration except for narrowly documented framework patterns.
- Resolve scoped services from the root provider.
- Use DI to hide cyclic dependencies.
- Make domain logic depend on the container.

## DI hardening

- Validate singleton/scoped/transient lifetimes when changing registrations.
- Do not capture `DbContext`, scoped repositories, current user, tenant, or request context in singleton services.
- Use `IServiceScopeFactory` carefully in hosted services.
- Do not make every class an interface just because DI can inject interfaces.
- Test the real service graph for applications with complex composition.

---

# 19. LINQ, Deferred Execution, and Collections

## Recommendation

Use LINQ when it makes intent clearer. Use loops when they make behavior, errors, allocation, or side effects clearer.

## Always do

- Understand deferred execution.
- Avoid multiple enumeration unless the source is safe and small.
- Keep ordering explicit when output order matters.
- Avoid hidden side effects in LINQ queries.
- Avoid making database queries accidentally client-side.
- Protect mutable collections shared across threads.
- Copy collections at boundaries when ownership is unclear.

## Prefer

- LINQ for straightforward transformations and filters.
- Plain loops for complex branching, error handling, async work, or side effects.
- `ToArray`/`ToList` only when materialization is needed.
- `StringComparer.Ordinal` or `StringComparer.OrdinalIgnoreCase` for non-linguistic keys.
- Immutable or read-only collection contracts for domain objects.
- Sorting before deterministic JSON/XML/audit/signature output.

## Avoid

- Nested LINQ expressions that hide business logic.
- Repeated `Where(...).FirstOrDefault(...)` scans in performance-sensitive paths.
- `Count()` when `Any()` is intended.
- `Single()` unless uniqueness is guaranteed and failure should throw.
- `First()` when empty input is possible.
- LINQ with async lambdas that do not do what the code appears to do.
- Mutating collections while iterating unless carefully designed and tested.

## Almost never do

- Hide persistence, network, signing, or message publishing side effects inside LINQ.
- Depend on dictionary iteration order for contracts.
- Materialize huge data sets to simplify code.
- Turn business workflows into obscure query comprehensions.

## Collection hardening

- Dictionary order should not be used as a contract unless the type/runtime contract explicitly guarantees the behavior and tests cover it.
- Appending or modifying mutable collections owned by callers can create hidden side effects.
- Arrays are mutable even when referenced through `IReadOnlyList<T>`.
- `IEnumerable<T>` can represent expensive, one-time, remote, or deferred work; do not assume it is a cheap in-memory list.
- Test deterministic ordering for generated payloads and audit outputs.

---

# 20. Resource Management and Disposal

## Recommendation

Resource ownership must be explicit.

C# has `IDisposable`, `IAsyncDisposable`, `using`, `await using`, finalizers, streams, sockets, database connections, timers, cancellation-token registrations, and native handles. Leaks can pass tests and still break production.

## Always do

- Dispose owned disposable resources.
- Use `using` or `await using` where scope ownership is clear.
- Do not dispose dependencies that are owned by DI or callers.
- Avoid finalizers unless managing unmanaged resources directly.
- Dispose `CancellationTokenSource`, timers, streams, and registrations when appropriate.
- Avoid storing streams beyond their valid lifetime.
- Test disposal-sensitive code where resources are critical.

## Prefer

- Dependency injection for long-lived framework-managed resources.
- `IHttpClientFactory` instead of manually creating many `HttpClient` instances.
- `await using` for async disposables.
- `SafeHandle` for native resources.
- Explicit ownership documentation for streams, buffers, and handles.
- Pooling only when measured and safe.

## Avoid

- Leaking `Stream`, `DbContext`, `HttpResponseMessage`, `Timer`, or native handles.
- Disposing DI-managed services manually.
- Capturing disposed scoped services in background work.
- Returning streams whose lifetime is unclear.
- Using finalizers for business-critical cleanup.

## Almost never do

- Depend on GC finalization for file, network, database, lock, or native resource correctness.
- Dispose a resource from a layer that does not own it.
- Hide resource lifetimes inside static helpers.

## Disposal hardening

- `HttpResponseMessage` should be disposed when the response body is not handed off.
- Streams returned from methods must have clear ownership rules.
- Async enumerables over resources must dispose resources when enumeration stops early.
- Timers can keep objects alive; dispose them.
- `CancellationTokenRegistration` can keep references alive; dispose it when needed.

---

# 21. Serialization and Deserialization

## Recommendation

Serialization is a boundary concern.

Do not let `System.Text.Json`, XML serializers, attributes, generated clients, or external payload shapes define the domain model accidentally.

## Always do

- Use DTOs at boundaries.
- Validate decoded data before domain use.
- Keep domain invariants independent from serialization attributes.
- Test payload shape when it is part of the contract.
- Treat unknown fields deliberately.
- Treat missing fields deliberately.
- Keep versioning explicit.
- Avoid exposing internal types unintentionally.
- Make default values explicit and tested.
- Test serialization and deserialization errors.

## Prefer

- Dedicated request/response DTOs.
- Dedicated XML/event structs for legal payloads.
- Explicit mappers from DTOs to domain types.
- Golden tests for stable payloads.
- Schema validation where applicable.
- Source-generated serializers when performance, trimming, or AOT compatibility requires them.
- Stable date/time formats.
- Explicit enum string validation.

## Avoid

- Using domain entities as API DTOs by default.
- `Dictionary<string, object>` as business data.
- Silent default values for required business fields.
- Hiding validation in attributes only.
- Accidental field renames.
- Accidental date/time format changes.
- Untested custom converters.
- Leaking internal enum values into public contracts.

## Almost never do

- Deserialize untrusted payloads directly into mutable domain objects.
- Treat deserialization success as business validation.
- Use generic weak dictionaries for legal/regulatory payloads.
- Allow invalid business events to exist because JSON/XML accepted the shape.
- Encode legal/business compatibility through undocumented serializer behavior.

## Serialization hardening

- `required` members and nullable annotations do not replace validation of untrusted input.
- `JsonSerializerOptions` are part of the contract; changes must be tested.
- Be explicit about naming policy, enum conversion, case sensitivity, unknown properties, number handling, and null handling.
- Test required, optional, unknown, null, empty, malformed, and versioned payloads.
- Test time/date formats and timezone behavior.
- For public APIs, preserve backward compatibility intentionally.
- For trimming/AOT, avoid reflection-dependent serialization unless compatible and tested.

---

# 22. XML, Signing, and Canonical Payloads

## Recommendation

XML processing must be hardened.

This is especially important for legal, financial, health, payroll, identity, and regulatory payloads.

## Always do

- Use dedicated XML APIs or project-approved libraries.
- Avoid XML string concatenation.
- Validate XML against expected schema where applicable.
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

- Building XML with interpolated strings or concatenation.
- Mixing schema versions in one unstructured builder.
- Ignoring namespaces.
- Ignoring canonicalization when signatures matter.
- Comparing XML as raw strings when canonical comparison is required.
- Logging complete sensitive XML.
- Using transport XML classes as domain models.
- Letting XML builder code decide business validity.

## Almost never do

- Generate legal XML without golden tests.
- Sign XML without deterministic canonicalization evidence.
- Send XML without validation when schema is available.
- Put legal/business rules inside XML builder code.
- Use unversioned XML builders for versioned legal layouts.

## XML hardening

- XML is a legal/contract boundary, not a string-formatting exercise.
- Treat XML input as untrusted; test malformed, oversized, unexpected namespace, external entity, and missing-field cases.
- Do not log raw XML containing personal, health, payroll, certificate, or legal data without redaction policy.
- Keep canonicalization and signature requirements explicit.
- Keep XML DTOs separate from domain rules.
- Add golden fixtures for every critical generated XML variant.

---

# 23. ASP.NET Core and HTTP Boundary Rules

## Recommendation

ASP.NET Core endpoints are transport boundaries. Keep them thin, secure, validated, observable, and testable.

## Always do

- Keep controllers/minimal API handlers focused on HTTP concerns.
- Validate request shape and boundary constraints.
- Map DTOs to application commands/queries.
- Use explicit response models.
- Use correct HTTP status codes.
- Use authentication and authorization deliberately.
- Avoid leaking exception details.
- Avoid returning domain entities directly.
- Use cancellation tokens from the request.
- Apply anti-forgery, CORS, rate limiting, HTTPS, headers, and data protection policies where applicable.

## Prefer

- Problem Details for consistent error responses.
- Endpoint filters/middleware for cross-cutting transport concerns.
- Authorization policies instead of ad hoc role checks.
- Typed results where they improve clarity.
- Integration tests using in-memory or test server infrastructure.
- Contract tests for public APIs.
- Pagination for large collections.
- Streaming only when backpressure and cancellation are understood.

## Avoid

- Business rules in controllers or minimal API lambdas.
- Direct `DbContext` access from endpoints for workflows.
- Returning huge collections in one response.
- Blocking calls in request paths.
- Trusting client-provided user IDs, tenant IDs, or roles without authorization checks.
- Logging raw request bodies with sensitive data.
- Model binding directly into domain objects.

## Almost never do

- Disable authentication/authorization to make tests pass.
- Allow insecure CORS wildcards with credentials.
- Expose stack traces in production responses.
- Use hidden middleware as the only place where business authorization lives.
- Treat HTTP 200 with error text as a valid API error model.

## HTTP hardening

- Test unauthorized, forbidden, invalid, malformed, not found, conflict, timeout, cancellation, and success paths.
- Validate route/body/query consistency.
- Do not trust forwarded headers unless configured for known proxies.
- Be explicit about request-size limits.
- Use safe file upload handling.
- Use output caching/caching headers only when data sensitivity allows it.
- Include correlation IDs where project policy supports them.

---

# 24. Entity Framework Core and Persistence

## Recommendation

Persistence code must be explicit, tested, and isolated.

EF Core is powerful, but it can hide query bugs, N+1 behavior, tracking surprises, transaction issues, concurrency failures, migration risks, and accidental domain leakage.

## Always do

- Keep EF Core in infrastructure/persistence layers.
- Keep `DbContext` lifetime scoped and short.
- Use migrations intentionally.
- Test mappings and queries that carry business meaning.
- Use cancellation tokens for async database operations.
- Handle concurrency conflicts deliberately.
- Use transactions where consistency requires them.
- Avoid exposing EF entities as API models.
- Avoid provider-specific behavior leaking into domain logic.

## Prefer

- Explicit mappings using Fluent API for non-trivial models.
- Projection to DTO/read models for queries.
- `AsNoTracking` for read-only queries where appropriate.
- `Include` only when needed and understood.
- Pagination for large data sets.
- Optimistic concurrency tokens where updates can conflict.
- Integration tests against the real provider or a faithful test container when provider behavior matters.
- Raw SQL only when parameterized and reviewed.

## Avoid

- Lazy loading by default in services where query shape matters.
- N+1 queries.
- Loading entire tables into memory.
- Client-side evaluation surprises.
- Sharing `DbContext` across threads.
- Long-lived `DbContext` instances.
- Swallowing `DbUpdateConcurrencyException`.
- Running migrations automatically in production without policy.
- Building SQL with string concatenation.

## Almost never do

- Put business rules in EF entity configuration.
- Make domain correctness depend on EF tracking behavior.
- Use the in-memory provider as proof that relational behavior works.
- Ignore migration rollback/forward compatibility for critical systems.
- Execute raw SQL with untrusted string interpolation.

## Persistence hardening

- Test query filters, tenant filters, authorization filters, soft-delete filters, and time-based filters.
- Test migrations with realistic schema/data when persistence changes are critical.
- Test uniqueness, foreign keys, precision, scale, indexes, and constraints.
- Test transaction rollback and partial-failure paths.
- Use provider-specific tests for SQL behavior, collation, date/time, decimal precision, JSON columns, and concurrency.
- Document migration risk and deployment order in `PHASE-RESULT.md` when relevant.

---

# 25. Configuration, Options, Secrets, and Environment

## Recommendation

Configuration is an input boundary. Treat it as untrusted until validated.

## Always do

- Keep secrets out of source code.
- Validate required configuration at startup.
- Use strongly typed options for non-trivial configuration.
- Use environment-specific configuration deliberately.
- Document required settings.
- Avoid logging secret values.
- Fail fast for missing critical configuration.
- Test configuration binding and validation for critical services.

## Prefer

- `IOptions<T>` patterns with validation.
- Secret managers or platform secret stores for sensitive values.
- Managed identity or workload identity where available.
- Clear configuration naming.
- Startup validation for external endpoints, timeouts, feature flags, and credentials presence.
- Separate development/test/production configuration policy.

## Avoid

- Reading environment variables directly throughout domain/application code.
- Using magic configuration keys.
- Defaulting production-sensitive values silently.
- Keeping secrets in appsettings files.
- Logging full configuration objects.
- Using feature flags without tests for both states.

## Almost never do

- Commit credentials, private keys, tokens, connection strings, certificates, or passwords.
- Make security behavior depend on undocumented local environment variables.
- Disable TLS/certificate validation through configuration without strong controls.

## Configuration hardening

- Treat configuration changes as behavior changes.
- Validate numeric ranges, URI format, timeouts, allowed enum values, and required values.
- Make defaults safe; insecure behavior must be explicit and environment-limited.
- Document secret rotation and ownership when relevant.
- Test missing/invalid configuration for services that must fail fast.

---

# 26. Logging, Metrics, Tracing, and Auditability

## Recommendation

Observability is operational evidence, not decoration.

For services, integrations, background workers, and legal/regulatory operations, structured logging, metrics, tracing, and audit trails must be designed.

## Always do

- Use project-approved logging/tracing systems.
- Use structured logging fields.
- Include correlation IDs where available.
- Never log secrets.
- Never log private keys.
- Never log passwords.
- Never log tokens.
- Never log raw sensitive legal/personnel/health/financial payloads without explicit redaction.
- Log failures with useful context.
- Avoid logging the same error repeatedly at every layer.
- Make background failures observable.
- Ensure logs do not become the only audit trail when auditability is required.

## Prefer

- `ILogger<T>` abstractions in application/service code.
- OpenTelemetry where distributed tracing is required.
- Stable event names.
- Domain identifiers instead of raw payloads.
- Redaction utilities.
- Separate audit trail from operational logs.
- Clear log levels:
  - Error for failed operations requiring attention
  - Warning for degraded or unexpected recoverable states
  - Information for important operational/business milestones
  - Debug/Trace for development diagnostics
- Explicit safe fields:
  - request ID
  - correlation ID
  - event ID
  - batch ID
  - tenant/account ID where safe
  - external receipt/protocol where safe

## Avoid

- `Console.WriteLine` in production services.
- String interpolation logs that lose structured fields.
- Logging whole JSON/XML payloads.
- Logging inside tight loops without rate control.
- Vague messages such as `failed` without context.
- Logging sensitive values through object destructuring.
- Automatically logging full domain objects that may contain secrets or PII.

## Almost never do

- Log sensitive regulatory/health/payroll XML/JSON unredacted.
- Use logs as the only audit trail.
- Hide failures because they were logged.
- Let background tasks fail without traceability.
- Add `ToString` methods for secret-bearing types without redaction strategy.

## Observability hardening

- Observability must not change business outcomes.
- Logs must support diagnosis without leaking data.
- Metrics should have bounded cardinality.
- Traces should propagate context across service boundaries when needed.
- Audit records should be tamper-resistant where required.
- Test audit behavior for critical workflows.

---

# 27. Security Gate

## Recommendation

Security is not a final pass. It must be built into the design.

## Always do

- Validate untrusted input.
- Encode output for the target context.
- Use authentication and authorization deliberately.
- Enforce tenant/account/user boundaries.
- Protect secrets.
- Use secure defaults.
- Use TLS for network communication where applicable.
- Avoid logging sensitive data.
- Run package vulnerability checks when dependencies change.
- Test authorization and validation failures.
- Document residual security risk.

## Prefer

- Parameterized SQL and ORM parameters.
- Platform data protection APIs for protecting app data.
- Modern, approved cryptography libraries.
- Centralized authorization policies.
- Least privilege for credentials and identities.
- CSRF protection where browser-cookie authentication is used.
- Strict CORS policy.
- Security headers where applicable.
- Rate limiting for abuse-prone endpoints.
- Safe file upload policy.

## Avoid

- Building SQL, shell commands, HTML, XML, JSON, LDAP, or paths with untrusted string concatenation.
- Rolling custom cryptography.
- Disabling certificate validation.
- Trusting client-side validation.
- Relying on obscurity.
- Overbroad authorization checks.
- Exposing stack traces in production.
- Storing plaintext secrets.
- Using weak random number generation for security-sensitive values.

## Almost never do

- Use `Random` for tokens, passwords, keys, salts, or security identifiers.
- Disable TLS validation except in tightly controlled local tests.
- Accept raw file paths from users without normalization and allow-listing.
- Deserialize untrusted polymorphic payloads without strict controls.
- Use reflection/dynamic plugin loading from untrusted sources.

## Security hardening

- Authorization must be tested for owner, non-owner, unauthenticated, forbidden role, wrong tenant, disabled user, and expired credential cases where applicable.
- Validate both request shape and business meaning.
- Use allow-lists over block-lists where practical.
- Treat deserialization, uploads, redirects, path handling, and template rendering as high-risk boundaries.
- Do not expose internal exception messages in public responses.
- Review dependency vulnerabilities, transitive packages, and build-time packages.

---

# 28. Cryptography, Certificates, and Signing

## Recommendation

Cryptography and signing code must be boring, standard, and reviewed.

## Always do

- Use platform-approved cryptographic APIs.
- Avoid custom algorithms.
- Protect private keys.
- Validate certificate chains and expiration where applicable.
- Document key storage and rotation assumptions.
- Test success and failure paths.
- Avoid logging key material.
- Use secure random APIs for security-sensitive randomness.
- Keep signing/canonicalization deterministic.

## Prefer

- `RandomNumberGenerator` for security randomness.
- Managed identity, HSM, key vault, or platform key storage where applicable.
- Explicit algorithm choices.
- Certificate thumbprint/subject validation only as part of a reviewed policy.
- Golden tests for signatures when deterministic.
- Integration tests against signing providers when external.

## Avoid

- Hardcoded keys.
- Exportable private keys without reason.
- Weak algorithms.
- Disabling certificate validation.
- String comparisons for secrets without timing considerations where relevant.
- Hand-written canonicalization logic unless unavoidable and heavily tested.

## Almost never do

- Implement cryptographic primitives.
- Log private key, password, token, seed, or certificate private material.
- Accept expired or untrusted certificates in production.
- Sign mutable data without deterministic canonicalization.

## Crypto hardening

- Certificate and signing failures must be distinguishable from business rejection and infrastructure failure.
- Test expired, not-yet-valid, wrong chain, revoked/unknown, wrong key usage, wrong algorithm, corrupted input, and provider-unavailable cases when relevant.
- Document compliance requirements for algorithms, key sizes, storage, and audit records.

---

# 29. Date, Time, Time Zones, and Clocks

## Recommendation

Date/time bugs are business bugs.

Use explicit types and freeze time in tests.

## Always do

- Use date/time types deliberately.
- Use `DateOnly` for date-only concepts when target framework supports it and project policy allows it.
- Use `TimeOnly` for time-of-day concepts when appropriate.
- Prefer `DateTimeOffset` for instants crossing boundaries.
- Inject time providers when current time affects behavior.
- Test time-dependent logic with fixed time.
- Define timezone policy.
- Define inclusive/exclusive range semantics.
- Validate date ranges.
- Avoid relying on local machine timezone.

## Prefer

- `TimeProvider` in modern .NET for testable time.
- Domain value objects for legal dates, periods, deadlines, validity windows, and timestamps.
- ISO-8601/RFC3339 at technical boundaries unless integration requires another format.
- Explicit timezone conversion at boundaries.
- Tests for same-day boundaries, end-of-month, leap year, invalid ranges, timezone conversion, and daylight saving where relevant.

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
- Make tests depend on today's date.
- Use `DateTime.Now` directly in business rules.

## Time hardening

- Be explicit about `DateTimeKind` when using `DateTime`.
- Normalize instants at boundaries when needed.
- Do not use `DateTimeOffset` as a substitute for a business timezone policy.
- Validate default `DateTime`, `DateOnly`, and `TimeOnly` values if default is invalid.
- Test leap years, month boundaries, deadlines, daylight saving, and timezone conversions.

---

# 30. Money, Decimals, Measurements, and Numeric Rules

## Recommendation

Use exact and domain-appropriate numeric types.

C# primitive numeric types are not enough for all business/legal contexts.

## Always do

- Define numeric units explicitly.
- Avoid magic numbers.
- Test boundary values.
- Test rounding rules.
- Test minimum/maximum values.
- Avoid binary floating point for money.
- Use checked arithmetic where overflow matters.
- Validate measurements and legal thresholds.
- Document rounding policies.
- Test zero, negative, maximum, and fractional cases where applicable.

## Prefer

- Domain value objects for money, percentages, measurements, rates, quantities, thresholds, and exposure levels.
- `decimal` for base-10 financial calculations when suitable.
- Integer minor units when compatible with business rules.
- Explicit rounding policies.
- Constants named after business meaning.
- Types/names that include units:
  - `DurationDays`
  - `AmountCents`
  - `NoiseExposureDb`
  - `RatePercent`
- `checked` blocks for audit/legal/security calculations where overflow risk exists.

## Avoid

- `float`/`double` for money.
- Hidden unit conversion.
- Silent overflow.
- Numeric literals spread across code.
- Rounding inside unrelated functions.
- Comparing floating-point values directly.
- Unclear measurement units.
- Using `int` for all quantities without range consideration.

## Almost never do

- Round legal/payroll/financial values without tests.
- Mix units in the same field.
- Use binary floating point for legal, payroll, or financial calculations.
- Treat measurement units as comments instead of types/names.
- Ignore overflow risk in audit/legal calculations.

## Numeric hardening

- Validate precision and scale in persistence mappings.
- Test database round-trips for decimals and monetary values.
- Test serialization formatting for decimal values when external contracts care.
- Keep rounding policy in the domain, not mapper code.
- Avoid silent conversions between `double`, `decimal`, and integer types.

---

# 31. Globalization, Localization, and String Handling

## Recommendation

String behavior must be explicit.

Casing, comparison, formatting, parsing, collation, and culture can create subtle production bugs.

## Always do

- Use explicit `StringComparison` for non-trivial string comparisons.
- Use `StringComparer` for dictionaries/sets with string keys.
- Use invariant culture for machine-readable formatting/parsing.
- Use current culture for user-facing formatting when appropriate.
- Normalize external strings when contract requires it.
- Test case sensitivity where business rules care.

## Prefer

- `StringComparison.Ordinal` for identifiers, codes, protocols, enum-like values, and machine keys.
- `StringComparison.OrdinalIgnoreCase` only when case-insensitive machine comparison is intended.
- `CultureInfo.InvariantCulture` for stable logs, payloads, persistence, and protocols.
- Localized resources for user-facing messages in localized products.

## Avoid

- Default culture-sensitive comparisons for identifiers.
- `ToLower()`/`ToUpper()` for comparison when `StringComparison` is clearer.
- Localized messages as machine-readable error codes.
- String parsing without culture policy.
- Assuming database collation matches in-memory comparison.

## Almost never do

- Use culture-sensitive casing for security identifiers, tenant IDs, event codes, or protocol fields.
- Treat user-facing localized text as stable API contract.
- Ignore globalization analyzer warnings without reason.

## String hardening

- Test Turkish-I style casing risks where case-insensitive logic is security/business-critical.
- Keep stable error codes separate from localized messages.
- Align database collation, in-memory comparisons, and external contract expectations.

---

# 32. Testing Strategy

## Recommendation

Tests are design evidence and regression protection.

A C# phase is not complete without relevant automated tests.

## Always do

- Add or update tests for changed behavior.
- Test happy paths and failure paths.
- Test boundary conditions.
- Test null/empty/default cases where relevant.
- Test cancellation for async operations.
- Test authorization/security behavior where relevant.
- Keep tests deterministic.
- Avoid tests that depend on execution order.
- Avoid real time, real network, or real external services in unit tests.
- Run tests from the command line.

## Prefer

- Unit tests for domain rules.
- Integration tests for persistence, HTTP, messaging, and external boundaries.
- Contract tests for public APIs and external providers.
- Golden tests for stable JSON/XML/signature output.
- Property-based tests for rule-heavy transformations.
- Mutation testing for critical business rules where configured.
- Test data builders that preserve invariants.
- Fixed clocks and deterministic IDs.
- Testcontainers or provider-faithful test infrastructure where database behavior matters.

## Avoid

- Tests that only prove mocks were called.
- Brittle tests tied to internal implementation.
- Large end-to-end tests as the only coverage.
- Sleeping in tests.
- Random test data without seed control.
- Shared mutable state between tests.
- Ordered tests unless the framework feature is used for a documented reason.

## Almost never do

- Claim high quality with only smoke tests.
- Replace domain tests with controller tests.
- Replace persistence tests with EF in-memory tests when relational behavior matters.
- Disable failing tests to finish a phase.
- Assert only that code does not throw when business results matter.

## Test hardening

- Every bug fix should include a regression test when feasible.
- Every business rule should have direct tests.
- Every boundary mapper should have tests because mapping bugs are common.
- Every important error branch should have tests.
- For public API changes, test backward compatibility or document the break.
- For async code, test cancellation and timeout deterministically.
- For concurrency code, test repeated runs and race-prone interleavings where feasible.

---

# 33. Mocking, Fakes, and Test Design

## Recommendation

Mocking is a tool, not a testing strategy.

Use mocks at boundaries. Prefer real domain objects and simple fakes when behavior matters.

## Always do

- Mock external boundaries, not every class.
- Keep tests behavior-focused.
- Avoid over-specifying interactions.
- Use fakes/stubs when they communicate behavior better than mocks.
- Keep test data valid by default.
- Ensure test builders enforce domain invariants.

## Prefer

- In-memory fakes for ports with meaningful behavior.
- Contract tests that every adapter must pass.
- Real value objects and domain entities in tests.
- Mock verification only for meaningful side effects.
- Clear arrange/act/assert structure.

## Avoid

- Creating interfaces only so every class can be mocked.
- Tests that fail after harmless refactors.
- Mocking the system under test's internal collaborators when a domain test would be clearer.
- Mocking EF Core query providers unless the behavior is truly isolated.
- Mocking time instead of injecting a clock/time provider.

## Almost never do

- Treat mock coverage as business coverage.
- Mock authorization or persistence so heavily that critical behavior is never exercised.
- Assert an exact sequence of implementation calls unless order is the contract.

## Mocking hardening

- If a test has more mock setup than assertion meaning, reconsider the design.
- If mocking requires exposing internals, reconsider boundaries.
- Use adapter contract tests to avoid false confidence from mocks.

---

# 34. Performance and Allocation Discipline

## Recommendation

Performance-sensitive C# code must be measured, not guessed.

## Always do

- Identify hot paths before optimizing.
- Avoid obvious unnecessary allocations in hot paths.
- Avoid blocking calls in scalable server code.
- Avoid loading unbounded data into memory.
- Add benchmarks or profiling evidence for performance-sensitive changes.
- Test behavior under realistic sizes where performance matters.

## Prefer

- BenchmarkDotNet for microbenchmarks.
- Profiling for allocation/CPU investigations.
- Pagination and streaming for large data.
- `ArrayPool<T>` only when ownership and clearing requirements are understood.
- `Span<T>`/`Memory<T>` only when they improve measured performance and keep code understandable.
- Source generation for high-throughput serialization where useful.

## Avoid

- Premature micro-optimization.
- Complex low-allocation code in normal business logic without measurement.
- `Task.Run` to hide blocking I/O in ASP.NET.
- Repeated regex construction in hot paths.
- Large string concatenations in loops.
- Multiple enumeration of expensive sequences.
- N+1 database queries.

## Almost never do

- Trade correctness or security for unmeasured speed.
- Use unsafe code for performance without benchmarks and safety documentation.
- Optimize by disabling validation or authorization.
- Cache sensitive data without eviction and access policy.

## Performance hardening

- Document benchmark environment and inputs.
- Compare before/after where performance claims matter.
- Include memory allocation evidence for allocation-sensitive changes.
- Ensure caches have size, expiration, invalidation, and tenant/security boundaries.
- Avoid performance tricks that break trimming/AOT unless documented.

---

# 35. Trimming, Native AOT, Reflection, and Source Generation

## Recommendation

Reflection, dynamic loading, trimming, and Native AOT compatibility must be intentional.

Modern .NET supports smaller and faster deployments, but reflection-heavy code, dynamic serializers, dependency injection patterns, and runtime discovery can break when trimmed or AOT-compiled.

## Always do

- Know whether the project supports trimming or Native AOT.
- Treat trim/AOT warnings as correctness warnings for affected projects.
- Avoid reflection-heavy code without reason.
- Test published artifacts when deployment mode changes.
- Keep source generators deterministic.
- Mark generated code clearly.
- Document generation commands.

## Prefer

- Source-generated serializers for trim/AOT-sensitive applications.
- Explicit registration over runtime assembly scanning in trim/AOT-sensitive code.
- Analyzer warnings enabled for trim/AOT modes when relevant.
- Golden tests or snapshot tests for generated outputs.
- Small source generators with tests when generation is necessary.

## Avoid

- Reflection for normal business logic.
- Assembly scanning that silently misses types after trimming.
- Dynamic code generation in AOT-targeted apps.
- Generated code that depends on timestamps or local paths.
- Hiding business rules in source generators.

## Almost never do

- Claim trim/AOT support without publish and runtime evidence.
- Ignore trim warnings.
- Use reflection to bypass type modeling.
- Generate unreviewable business logic.

## Trim/AOT hardening

- Published output may behave differently from debug/JIT builds; test the published artifact when deployment mode matters.
- A trim warning means potential behavior change or crash in trimmed output.
- Document reflection roots and dynamic access requirements.
- Keep source-generated APIs stable and tested.
- Do not let generated mocks replace behavior tests.

---

# 36. Unsafe Code, Native Interop, and Platform-Specific Code

## Recommendation

Unsafe code, P/Invoke, COM, and native interop are high-risk and forbidden by default unless explicitly justified.

## Always do

- Avoid unsafe code unless there is a documented need.
- Keep unsafe/native interop isolated.
- Provide safety comments explaining invariants.
- Expose safe abstractions over unsafe internals.
- Validate inputs and outputs across native boundaries.
- Document ownership and lifetime rules.
- Document platform support.
- Test success and failure paths.
- Avoid leaking native handles.

## Prefer

- Safe managed alternatives.
- `SafeHandle` for native handles.
- Small private interop packages/classes.
- Explicit marshaling definitions.
- Platform guards and analyzers.
- Benchmarks proving performance-based unsafe usage.

## Avoid

- Unsafe code in domain/business logic.
- Pointer arithmetic for convenience.
- Native calls without error handling.
- Assuming string encoding.
- Assuming platform availability.
- Letting native pointers escape into application/domain code.

## Almost never do

- Use unsafe to bypass design issues.
- Add native dependencies to portable services without deployment review.
- Introduce unsafe code without tests and documentation.
- Use unsafe in legal/security/audit/signing logic without exceptional justification.

## Interop hardening

- Document native library versions, deployment requirements, architecture, OS support, and failure behavior.
- Test on every supported target platform or document unsupported combinations.
- Handle null pointers, error codes, partial failures, and resource cleanup explicitly.
- Avoid exceptions crossing unmanaged boundaries unexpectedly.

---

# 37. Public API, Libraries, and Versioning

## Recommendation

Public APIs are contracts.

C# libraries need strong compatibility discipline because names, nullability annotations, generic constraints, exceptions, packages, target frameworks, and assembly metadata affect consumers.

## Always do

- Know whether a type/member is public API.
- Keep public surface minimal.
- Document public APIs where project policy requires it.
- Preserve binary/source compatibility unless a breaking change is intended.
- Document breaking changes.
- Test public APIs.
- Avoid exposing internal domain/infrastructure types.
- Avoid leaking third-party types into public APIs unless intentional.

## Prefer

- API compatibility checks for reusable libraries.
- XML documentation for public packages.
- Nullable annotations as part of the public contract.
- Stable exception/result behavior.
- Strong SemVer discipline.
- `InternalsVisibleTo` over making internals public for tests, used sparingly.

## Avoid

- Public setters without need.
- Public concrete types that should be internal.
- Exposing mutable collections.
- Exposing EF Core entities or serializer DTOs as public domain API.
- Changing default behavior silently.
- Changing target frameworks without consumer impact analysis.

## Almost never do

- Break public API accidentally.
- Use public API to expose implementation details.
- Remove or rename public members without migration guidance.
- Change nullability annotations casually in libraries.

## API hardening

- Public nullability changes can be breaking for consumers that enforce warnings.
- Generic constraints are part of API compatibility.
- Exception behavior may be part of practical compatibility.
- Package dependency changes can affect consumers transitively.
- Test multi-targeted libraries on every target.

---

# 38. Background Services, Messaging, and Workers

## Recommendation

Background processing must be supervised, idempotent, cancellable, and observable.

## Always do

- Respect host shutdown cancellation.
- Avoid fire-and-forget work.
- Make retries explicit and bounded.
- Make idempotency explicit.
- Handle duplicate messages.
- Handle poison messages.
- Log and observe failures.
- Avoid capturing request-scoped services beyond request lifetime.
- Create scopes deliberately in hosted services.
- Test cancellation and shutdown.

## Prefer

- Durable queues for work that must survive process failure.
- Outbox/inbox patterns for message/database consistency where needed.
- Exponential backoff with jitter for transient failures.
- Dead-letter handling for unrecoverable messages.
- Explicit message contracts and versioning.
- Correlation IDs across message boundaries.

## Avoid

- Starting tasks from HTTP requests for critical work without durable persistence.
- Infinite retry loops.
- Swallowing message-processing exceptions.
- Unbounded concurrency.
- Processing non-idempotent messages without safeguards.
- Long-running work inside a scoped service without lifecycle clarity.

## Almost never do

- Treat legal/regulatory/financial transmission as best-effort fire-and-forget.
- Lose messages silently.
- Acknowledge messages before durable processing when correctness requires otherwise.
- Ignore cancellation during shutdown.

## Worker hardening

- Test duplicate, retry, poison, cancellation, shutdown, partial failure, and out-of-order cases.
- Document at-least-once, at-most-once, or exactly-once assumptions.
- Ensure metrics and logs reveal stuck queues and repeated failures.

---

# 39. File, Path, Process, and External I/O Safety

## Recommendation

External I/O is a security, reliability, and resource boundary.

## Always do

- Validate paths and filenames from untrusted sources.
- Avoid path traversal.
- Use timeouts for external processes and network calls.
- Capture and handle process exit codes.
- Avoid shell execution when direct APIs are available.
- Dispose streams and process resources.
- Test failure paths.

## Prefer

- Safe temporary file APIs.
- Allow-listed directories.
- Streaming for large files.
- Checksums/signatures where file integrity matters.
- Direct process invocation with argument lists, not shell strings.
- Backpressure for uploads/downloads.

## Avoid

- Combining untrusted paths with privileged directories.
- Building shell commands with string concatenation.
- Reading whole large files into memory without limits.
- Trusting file extensions.
- Leaving temporary files behind.
- Running external tools without timeout and output limits.

## Almost never do

- Execute user-provided commands.
- Write outside approved storage roots.
- Disable file validation for convenience.
- Treat external process success as business validation without checking outputs.

## I/O hardening

- Test oversized, missing, malformed, locked, permission-denied, slow, and interrupted I/O.
- Redact file contents and paths when they contain sensitive data.
- Use safe archive extraction patterns to prevent zip-slip style issues.

---

# 40. Build, Publish, Containers, and Deployment Behavior

## Recommendation

Deployable behavior must be tested as deployed, not only as built.

## Always do

- Know how the application is published.
- Verify publish output when deployment-related code changes.
- Keep environment assumptions documented.
- Avoid debug-only behavior in production.
- Use Release builds for evidence unless Debug is specifically relevant.
- Verify configuration, content files, runtime identifiers, and native dependencies.
- Document container assumptions when relevant.

## Prefer

- Repeatable `dotnet publish` commands.
- Minimal runtime images for containers where appropriate.
- Non-root container users where platform supports it.
- Health checks for services.
- Explicit readiness/liveness behavior.
- Startup validation.
- Deployment smoke tests.

## Avoid

- Relying on files that are not copied to publish output.
- Using local development certificates/secrets in production.
- Assuming Windows paths in cross-platform services.
- Ignoring case sensitivity differences between filesystems.
- Shipping debug symbols/settings unintentionally where policy forbids it.

## Almost never do

- Claim deployment readiness without publish evidence for deployable changes.
- Ignore trimming/AOT warnings for apps using those modes.
- Run containers as root without reason in hardened environments.
- Depend on mutable local machine state.

## Deployment hardening

- Test startup with missing/invalid configuration.
- Verify static/content files are included intentionally.
- Verify native dependencies and platform-specific files.
- Verify logs, health checks, and metrics work in deployment mode.
- Document any environment-specific behavior.

---

# 41. Documentation and Comments

## Recommendation

Documentation should explain intent, contracts, and risk. It must not compensate for unclear code.

## Always do

- Document public APIs where project policy requires it.
- Document non-obvious design decisions.
- Document invariants that cannot be expressed in types.
- Document security-sensitive behavior.
- Document operational commands and configuration.
- Keep comments accurate after code changes.
- Remove obsolete comments.

## Prefer

- XML docs for public libraries.
- README or architecture notes for major subsystems.
- ADRs for significant design choices.
- Comments explaining why, not what.
- Examples that compile where possible.

## Avoid

- Comments that restate the code.
- Stale comments.
- TODOs without issue IDs and ownership.
- Hiding incomplete behavior behind comments.
- Using comments instead of types/tests.

## Almost never do

- Claim behavior in docs that tests do not support.
- Leave misleading security or compliance comments.
- Document a workaround without explaining the removal condition.

## Documentation hardening

- Public docs are part of API quality.
- Security docs must be precise and conservative.
- Operational docs must match actual commands.
- Generated docs must be deterministic when checked in.

---

# 42. Generated Code

## Recommendation

Generated code must be deterministic, reviewable, and kept away from business decisions.

## Always do

- Mark generated files clearly.
- Keep generator inputs in source control where required.
- Document generation commands.
- Verify generated output compiles.
- Test generated behavior.
- Avoid hand-editing generated files.
- Keep generation deterministic.

## Prefer

- Source generators for compile-time generation when they improve safety/performance.
- Golden tests for generated JSON/XML/contracts.
- Generator tests for source generators.
- Separate generated DTOs from domain models.

## Avoid

- Generating business rules from accidental transport schemas.
- Generated code that includes timestamps, absolute paths, or nondeterministic order.
- Large unreviewable generated files without contract tests.
- Generator outputs that suppress all warnings without reason.

## Almost never do

- Hide legal/regulatory behavior in generated code without tests.
- Use generated mocks as the only tests.
- Introduce a generator casually.
- Accept generated unsafe code without review.

## Generation hardening

- Regenerate and verify no unexpected diff when generator inputs are unchanged.
- Record generator versions.
- Review generated public API before treating it as stable.
- Keep generated code out of domain language unless deliberately modeled.

---

# 43. Legal, Audit, Compliance, Finance, Health, and Regulated Code

## Recommendation

Regulated code must be treated as high-risk even when technically simple.

## Always do

- Keep rules explicit and traceable.
- Keep audit events separate from logs where auditability is required.
- Test legal/business rule boundaries.
- Test failure/rejection paths.
- Preserve evidence of decisions.
- Avoid hidden behavior in serializers, mappers, SQL, or logs.
- Redact sensitive data.
- Document residual risk.

## Prefer

- Golden fixtures for official payloads.
- Contract tests against schemas/providers.
- Domain-specific error codes.
- Rule tables or explicit policy objects where rules are complex.
- Fixed clocks in tests.
- Reviewer-friendly code over clever abstractions.

## Avoid

- Magic numbers or strings for legal thresholds.
- Silent rounding.
- Silent timezone assumptions.
- Generic exceptions for official rejection reasons.
- Logging raw sensitive payloads.
- Fire-and-forget official submissions.

## Almost never do

- Put legal rules only in SQL, XML, JSON attributes, or UI validation.
- Treat provider rejection as generic failure.
- Accept a phase without failure-path tests.
- Rely only on broad integration tests for rule-heavy code.

## Regulated-code hardening

- Include audit, authorization, golden, contract, boundary, and error tests.
- Make versioned rules explicit.
- Document source of truth for rules.
- Include migration/version compatibility evidence when rules or payload versions change.

---

# 44. LLM-Specific C# Quality Gate

## Recommendation

LLM-generated C# must be treated as untrusted until verified.

LLMs often produce plausible code that compiles but violates architecture, hides null problems, overuses abstractions, invents APIs, misses cancellation, adds unnecessary packages, and lacks failure-path tests.

## Always do

- Verify every generated API against actual project packages and target framework.
- Compile the code.
- Run tests.
- Run analyzers.
- Check nullable warnings.
- Inspect dependency additions.
- Remove unused abstractions.
- Remove placeholder code.
- Verify architecture boundaries.
- Verify security assumptions.
- Verify error and cancellation paths.

## Prefer

- Small, reviewable changes.
- Domain-first implementation.
- Existing project patterns over invented frameworks.
- Minimal dependencies.
- Explicit tests for generated behavior.
- Clear failure semantics.

## Avoid

- Accepting code because it “looks idiomatic.”
- Inventing package APIs.
- Creating interfaces for every class.
- Adding AutoMapper/MediatR/FluentValidation/Polly/etc. by default without project policy and justification.
- Adding reflection, dynamic, source generation, or unsafe code to avoid simple explicit code.
- Creating generic repository abstractions that hide useful persistence semantics.
- Silencing warnings with `!`, `#pragma`, `NoWarn`, or nullable disable.

## Almost never do

- Trust generated code without command evidence.
- Let an LLM change target frameworks, package versions, or architecture silently.
- Let an LLM add authentication/authorization/security code without tests and review.
- Accept generated business rules without domain fixtures.

## LLM hardening

- LLM output is a draft, not evidence.
- Build/test/analyzer results are evidence only if run on final code.
- The more confident the generated code sounds, the more important verification becomes.
- Prefer boring, explicit C# over impressive-looking abstractions.

---

# 45. Phase Result Requirements

Every implementation phase must create `PHASE-RESULT.md` with enough evidence for another engineer to understand what changed, what was verified, what failed, and what risk remains.

## Required sections

```markdown
# Phase Result

## Summary

- What was implemented:
- What was intentionally not implemented:

## Repository state

- Branch/commit if available:
- Working directory status:
- Solution/project path:

## Toolchain

- `dotnet --info` summary:
- SDK version:
- Target framework(s):
- C# language version policy:
- Nullable policy:
- Runtime identifier(s), if relevant:

## Files changed

- List important source files:
- List important test files:
- List project/package/config files:

## Commands run

- `command`

## Commands passed

- `command`

## Commands failed

- `command`
- Reason:
- Impact:
- Required fix:

## Commands not run

- `command`
- Reason:
- Impact:
- Follow-up required:

## Tests added or changed

- Test name:
- Behavior covered:
- Failure paths covered:

## Quality gates

- Build:
- Formatting:
- Nullable:
- Analyzers:
- Tests:
- Coverage if available:
- Vulnerability/dependency checks:
- Architecture checks:
- Security checks:
- Publish/deployment checks if relevant:

## Dependency changes

- Added:
- Removed:
- Updated:
- Reason:
- Vulnerability/deprecation/license notes:

## Architecture notes

- Boundaries preserved:
- Boundary changes:
- Alternatives considered:

## Security and privacy notes

- Sensitive data handling:
- Authorization/validation changes:
- Residual security risk:

## Performance notes

- Expected impact:
- Evidence if measured:

## Residual risk

- Risk:
- Why acceptable now:
- Follow-up required:

## Quality score

- Score:
- Evidence supporting score:
- Reasons score is not higher:
```

## Scoring guidance

A high score requires evidence, not confidence. The score is reported on a 0-100 scale.

|Score|Meaning|
|---|---|
|91-100|Builds, tests, analyzers, formatting, dependency checks, security considerations, architecture, failure paths, and deployment concerns are all verified for the phase scope.|
|76-90|Strong evidence with minor documented limitations.|
|61-75|Useful implementation with meaningful gaps or partial evidence.|
|41-60|Compiles or partially works but has weak tests, weak analysis, or notable risk.|
|1-40|Mostly unverified, incomplete, or risky.|
|0|Does not build, breaks architecture, or cannot be evaluated.|

Do not assign a high score when failure-path tests are missing.

## Score caps

Apply these caps unless there is a documented and justified exception. The score must not exceed:

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

## Default coverage thresholds

Coverage is necessary but not sufficient. Mutation testing is stronger evidence for critical rules. Use these defaults; document any shortfall.

|Area|Line Coverage|Branch Coverage|Mutation Score|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical legal/financial/audit/security rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API controllers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

Complexity must be actively reduced. If a method, file, class, namespace, or dependency relationship becomes hard to understand, refactor before declaring completion.

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

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`, not silent acceptance. Generated code may be excluded only with an explicit reason.

---

# 46. Review Checklist

Use this checklist before declaring implementation complete.

## Correctness

- Does the code implement the planned behavior?
- Are edge cases tested?
- Are failure paths tested?
- Are null/default/empty cases handled deliberately?
- Are time, numeric, and string rules explicit?

## Build and tooling

- Does restore work?
- Does build pass?
- Do tests pass?
- Does formatting pass?
- Do nullable warnings pass?
- Do analyzers pass?
- Are warnings treated appropriately?

## Architecture

- Are domain/application/infrastructure/API boundaries preserved?
- Are project references directional?
- Are controllers/endpoints thin?
- Are persistence details isolated?
- Are DTO/domain mappings explicit?

## Async and concurrency

- Are async methods awaited?
- Is `async void` avoided?
- Are cancellation tokens accepted and propagated?
- Is concurrency bounded?
- Are background failures observed?
- Are shared mutable states protected?

## Security

- Is input validated?
- Is authorization correct?
- Are secrets protected?
- Is sensitive data redacted?
- Are dependency vulnerabilities checked?
- Are injection risks avoided?

## Persistence and integration

- Are queries tested?
- Are migrations safe?
- Are external clients tested with fakes/contracts?
- Are retries/idempotency explicit?
- Are timeouts configured?

## Deployment

- Does publish work where relevant?
- Are runtime identifiers/platform assumptions documented?
- Are trimming/AOT warnings handled where relevant?
- Is configuration validated?
- Are health/observability behaviors present where required?

## Maintainability

- Are names clear?
- Are abstractions justified?
- Are dependencies minimal?
- Is documentation accurate?
- Are generated files deterministic?
- Is `PHASE-RESULT.md` complete?

---

# 47. Minimum Project Defaults for New C# Work

These defaults apply to new modern C# projects unless the project has stronger or different policy.

## Recommended `Directory.Build.props` direction

```xml
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <AnalysisLevel>latest</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <Deterministic>true</Deterministic>
  </PropertyGroup>
</Project>
```

Adapt this to the project. Do not paste it blindly into legacy repositories without migration review.

## Recommended new-project posture

- Stable current .NET SDK.
- Explicit `global.json` when team/CI determinism matters.
- Nullable enabled.
- Analyzer warnings enforced.
- `.editorconfig` checked in.
- Central package management for multi-project repositories.
- Lock-file restore for applications/services where deterministic restore is required.
- Unit tests from the first business rule.
- Integration tests from the first external boundary.
- No `Common` dumping-ground project.
- No unnecessary packages.
- No `async void` except event handlers.
- No service locator.
- No domain dependency on infrastructure/frameworks.

---

# 48. Absolute Rejection Conditions

The phase must not be accepted as complete if any of these are true and not explicitly out of scope with documented risk:

- The solution does not build.
- Relevant tests do not pass.
- `PHASE-RESULT.md` is missing.
- New compiler/nullable/analyzer warnings are ignored.
- New `#nullable disable`, broad `NoWarn`, or broad `#pragma warning disable` appears without justification.
- `async void` is introduced outside event handlers.
- Fire-and-forget critical work is introduced.
- Domain code depends on ASP.NET Core, EF Core, logging implementation, JSON serializer, or provider DTOs without architecture approval.
- Authentication/authorization is weakened.
- Secrets are committed or logged.
- SQL/XML/HTML/shell/path construction uses untrusted concatenated input.
- Business-critical behavior has no tests.
- Failure paths are untested for high-risk logic.
- Dependency additions are unexplained.
- Vulnerable/deprecated packages are accepted without review.
- Persistence changes lack migration/query evidence.
- Public API breaking changes are undocumented.
- Trimming/AOT support is claimed without evidence.
- Generated code is nondeterministic or hides business rules.
- Unsafe/native interop is introduced without isolation, safety documentation, and tests.

---

# 49. Final Principle

Good C# is not merely code that compiles.

Good C# is clear, typed, nullable-aware, cancellable, testable, observable, secure, dependency-conscious, architecture-preserving, and honest about evidence.

The standard is not “average GitHub project.”

The standard is production-grade engineering that another competent maintainer can trust.
