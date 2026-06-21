# Java Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the Java language quality gate for implementation work. Its purpose is to
prevent low-quality Java code from being generated, accepted, copied into a project, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

The implementation is complete only when the code compiles, is tested, is readable with low
complexity, preserves architectural boundaries, handles errors explicitly, is secure by default, is
auditable where required, and has objective evidence in `PHASE-RESULT.md`. "It compiles" is necessary,
not sufficient.

Follow this together with project rules (`AGENTS.md`, `architecture.md`, build files, CI). If this
file conflicts with a phase-specific rule, follow the stricter rule unless the deviation is documented
in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Code compiles and tests run from a clean checkout: `./mvnw clean verify` or `./gradlew clean build`.
2. Formatting verified (google-java-format / Checkstyle) or documented.
3. Static analysis ran where configured (SpotBugs, PMD, Error Prone, ArchUnit); new findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths.
5. Coverage meets the risk tier (see Default thresholds); mutation testing for critical rules where available.
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, repositories, JPA entities, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors handled explicitly at the right layer; no swallowed exceptions.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Disable or broadly suppress quality gates/warnings to pass.
- Catch `Throwable`/`Exception` and swallow it, use `double`/`float` for money, put business logic in controllers/entities, use field injection, or `@Data` on domain objects.

### Score

Report 0-100. Apply the Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. When planning, list which checks apply
and state any intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (simple DTOs, straightforward mappers, simple config, non-critical utilities): compile, format, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence adapters, API endpoints): add error-path and integration tests, coverage. Add MUST 5, 7, 8.
- High (core business rules, state transitions, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, mutation where available. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, financial, audit, data integrity, safety-critical): add golden/contract tests, schema validation, error/rejection paths, audit/traceability, redaction, mutation tests. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, build/test
commands ran, quality gates ran where available, failures were fixed or documented, `PHASE-RESULT.md`
was created, and the evidence supports the score. A passing test run alone is not enough when the
phase changed dependencies, public API, persistence, serialization, concurrency, or security behavior.

## 2. Language Baseline

Use the Java version defined by the project.

- Always: use the build wrapper (`./mvnw` or `./gradlew`); keep source/target compatibility explicit; ensure tests run from the command line; document the Java version.
- Prefer: an LTS JDK (e.g. 25/21/17) consistent with the framework and deployment; records for immutable carriers; sealed types for closed hierarchies; pattern matching, text blocks, and `java.time` where they reduce complexity; explicit, boring Java over clever Java.
- Avoid: using a feature only because it is new; mixing Java versions across modules; depending on IDE-specific compiler settings; preview features unless the architecture accepts them.
- Almost never: use non-LTS Java in production without a documented reason; change the Java version inside a phase without documenting impact; disable compiler warnings globally.

## 3. Build Reproducibility

The build must be reproducible from a clean checkout using only documented commands.

- Always: use the Maven/Gradle wrapper; pin plugin and dependency versions (or a controlled BOM); keep generated files out of source control unless intentionally tracked; document build commands; run `clean verify`/`clean build` without relying on IDE state.
- Prefer: Maven Enforcer / Gradle dependency locking; a single source of truth for versions; CI-equivalent commands locally.
- Avoid: snapshot or dynamic dependency versions; multiple competing build systems in one module; build behavior hidden in IDE config; profiles that silently skip tests.
- Almost never: skip tests by default; disable quality gates to make a phase pass; commit secrets/certificates/absolute paths.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
./mvnw -version
./mvnw clean verify
# quality plugins when configured:
./mvnw checkstyle:check pmd:check spotbugs:check
./mvnw test jacoco:report jacoco:check
./mvnw org.pitest:pitest-maven:mutationCoverage
./mvnw dependency-check:check
```

(Gradle equivalents: `./gradlew clean build check test jacocoTestReport
jacocoTestCoverageVerification pitest dependencyCheckAnalyze`.) A command not run is not evidence; a
command that failed and was ignored is negative evidence.

## 5. Formatting and Style

Use one formatting standard and automate it.

- Always: format consistently; keep imports organized; remove unused imports; use the narrowest visibility (prefer package-private internals); one public top-level class per file.
- Prefer: google-java-format; Checkstyle with the project standard; names that describe business meaning; constants over magic values; small classes with obvious responsibility.
- Avoid: wildcard imports; formatting churn unrelated to the phase; non-domain abbreviations; `Helper`/`Util`/`Manager`/`Processor`/`Handler`/`Common`/`Data` names; commented-out code.
- Almost never: disable formatting/style checks globally; create generic utility classes for business rules.

## 6. Naming

Names must reveal intent.

- Always: use domain language; name booleans as predicates (`isValid`, `hasPendingEvents`); name commands as imperative actions; name use cases by business action; name exceptions by failure meaning.
- Prefer: `EmployeeExposurePeriod` over `PeriodData`; `EventTransmissionReceipt` over `ResponseData`; behavior-named tests.
- Avoid: technical-only names for domain concepts; `doWork`/`process`/`handle`/`execute` without context; overloaded terms.
- Almost never: single-letter names outside tiny scopes; `Foo`/`Bar`/placeholder names; classes named after frameworks, tables, or transport formats.

## 7. Packages, Modules, and Architecture Structure

Packages reflect architecture; a good structure makes invalid dependencies hard and obvious.

- Always: preserve `architecture.md`; keep domain separate from infrastructure; keep application/use-case code separate from controllers/adapters; keep external clients outside the core; keep tests close to the code; use architecture tests (ArchUnit) for layered/modular projects.
- Prefer: `domain` / `application` / `infrastructure` / `api` packages, or feature-based packages each with the same layers.
- Avoid: one giant service/util/dto package; mixed packages where controllers, entities, repositories, and business rules live together; cross-feature imports that bypass boundaries; cyclic dependencies.
- Almost never: business rules in controllers, repositories, JPA entities, builders, DTOs, integration clients, or message consumers; a `common` module that becomes a dumping ground.

## 8. Architectural Boundaries

Business rules must be explicit, isolated, and tested. Frameworks and databases are implementation
details.

- Always: keep dependency direction inward; use domain/application modules for business rules; use infrastructure adapters for external systems; use ports/interfaces at boundaries; keep controllers thin; keep repositories focused on persistence; test boundaries with ArchUnit where applicable.
- Prefer: a domain model for business concepts; application services for orchestration; ports for persistence/messaging/signing/storage/clock/external APIs; mappers between DTOs and domain models; explicit commands/results; package-private implementations.
- Avoid: controllers calling repositories directly for business flows; domain importing Spring/JPA/HTTP/JSON/XML/logging/DB APIs; infrastructure returning provider models into the core; API DTOs reused as domain objects; database entities reused as API responses; framework annotations in domain classes.
- Almost never: hide business rules in SQL, serialization, exception mappers, or message listeners; let infrastructure decide domain outcomes; change architecture in a phase without documenting it.

## 9. Object Design and Immutability

Model behavior, invariants, and intent; prefer immutability by default.

- Always: protect invariants; keep objects valid after construction; keep responsibilities focused; prefer composition over inheritance; make illegal states hard to represent; make fields `private final` unless mutation is required; defensively copy mutable inputs; do not expose mutable internal collections.
- Prefer: rich domain objects when behavior belongs to the model; application services when behavior coordinates dependencies; immutable value objects; records for simple carriers; `List.copyOf`/`Set.copyOf`/`Map.copyOf`; explicit state-transition methods.
- Avoid: anemic domain models for non-trivial rules; public setters by default; deep inheritance; boolean parameters that change behavior; primitive obsession; mutable DTOs leaking into domain logic; static mutable state.
- Almost never: inheritance before composition has failed; `Map<String, Object>` as a domain model; `Lombok @Data` on domain objects; returning internal collections directly.

```java
// Value object: invariants enforced at construction, immutable.
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount, "amount");
        Objects.requireNonNull(currency, "currency");
        if (amount.scale() > currency.getDefaultFractionDigits()) {
            throw new IllegalArgumentException("scale exceeds currency precision");
        }
    }
}

// Closed hierarchy with sealed types — the compiler enforces exhaustive handling.
public sealed interface Event permits Draft, Signed, Sent, Rejected {}
```

## 10. Null Safety, Error Handling, and Validation

- Null: validate required constructor arguments (`Objects.requireNonNull`); fail fast for missing mandatory values; return empty collections instead of null; use `Optional` as a return type for legitimate absence (never as a field or parameter); avoid `Optional.get()` without proving presence.
- Errors: use domain-specific exceptions for business invariant violations; preserve root causes when wrapping; convert technical failures to application outcomes at boundaries; make retryable vs non-retryable explicit; test failure paths.
- Validation: validate at boundaries and enforce invariants in the domain; do not rely only on UI/controller/DB validation; use Bean Validation for simple input constraints and explicit validators for complex rules.
- Avoid: returning null from public methods; catching broad `Exception` without reason; swallowing exceptions; logging-and-rethrowing at every layer; exposing stack traces to users.
- Almost never: catch `Throwable`/`Error`; use exceptions for normal control flow; ignore failed persistence/signing/transmission/audit operations.

```java
// Domain exception expresses failure meaning; cause preserved when wrapping.
public final class CertificateExpiredException extends DomainException {
    public CertificateExpiredException(String certificateId, Throwable cause) {
        super("certificate %s expired".formatted(certificateId), cause);
    }
}

// Convert infrastructure failures to application outcomes at the boundary.
try {
    return signer.sign(document);
} catch (KeyStoreException cause) {
    throw new SigningFailedException(document.id(), cause); // keep the cause
}
```

## 11. Time, Money, and Numerics

Date/time and money bugs are business bugs.

- Always: use `java.time` (`Instant`, `LocalDate`, `OffsetDateTime`, `ZonedDateTime`); inject `Clock` when current time affects behavior; test time-dependent logic with a fixed clock; use `BigDecimal` for money with explicit rounding and scale; test boundary/zero/negative/fractional values.
- Prefer: value objects for money/rates/measurements; UTC/ISO-8601 at boundaries; constants named for business meaning; names that include units (`amountInCents`, `durationInDays`).
- Avoid: `new Date()`/`Calendar`/`System.currentTimeMillis()` in domain logic; `double`/`float` for money; comparing dates as strings; hidden timezone assumptions; comparing `BigDecimal` incorrectly when scale matters.
- Almost never: use local machine time as business truth; use binary floating point for auditable money; round financial values without tests.

## 12. Collections, Streams, and Concurrency

- Collections/streams: avoid side effects inside stream pipelines; keep chains readable; use immutable/unmodifiable collections at boundaries; choose the right collection type; avoid `parallelStream()` without proof; prefer plain loops for complex branching.
- Concurrency: keep shared state minimal and thread-safe (or eliminate it); use bounded resources; handle cancellation and interruption correctly; set timeouts; test concurrency-sensitive code; make idempotency explicit for async/message handlers; prefer framework-managed executors and immutable objects passed between threads; use virtual threads for blocking I/O where supported.
- Avoid: raw thread creation; unbounded executors; shared mutable static state; `Thread.sleep()` for coordination; hidden global caches.
- Almost never: fix races with arbitrary sleeps; ignore interrupted status; introduce async behavior without tests and observability; span transactions across slow external calls without explicit design.

## 13. Resource Management, Logging, and Auditability

- Resources: use try-with-resources; close streams/files/sockets/DB resources/HTTP responses/XML readers; set connection and read timeouts; stream large payloads; keep ownership explicit.
- Logging: use a logging framework with parameterized logging; include correlation/request IDs; never log secrets, keys, passwords, tokens, or raw sensitive payloads; use clear levels; keep audit trails separate from debug logs.
- Auditability: for important actions, record who/what/when, the affected object, and the result; preserve correlation and external protocol identifiers; make audit append-only where required; test audit behavior for critical flows.
- Avoid: `System.out.println`; logging full payloads; resource cleanup in finalizers; using logs as the only audit trail.

## 14. Serialization and XML/JSON Safety

Serialization is a boundary concern; harden parsers for untrusted input.

- Always: use DTOs for serialized payloads; validate deserialized data; keep unknown-field behavior deliberate; test payload shape; keep versioning explicit; for untrusted XML disable DOCTYPE/external entities/external DTDs and enable secure processing; validate against schema where available.
- Prefer: explicit field names; contract tests; golden files for stable payloads; mappers from serialized models to domain models; safe parser configuration.
- Avoid: deserializing directly into domain entities; exposing internal class names in payloads; arbitrary polymorphic deserialization; XML/JSON by string concatenation.
- Almost never: deserialize untrusted data into arbitrary object graphs; use Java native serialization for untrusted data; treat serialization failures as business success.

## 15. Frameworks, Persistence, and APIs

- Frameworks: use constructor injection; keep framework annotations near boundaries; keep domain logic framework-free; test business logic without full framework startup where possible; avoid field injection and static context access.
- Persistence: keep transaction boundaries explicit; keep persistence outside domain logic; use migrations (Flyway/Liquibase); test custom queries and important mappings; handle optimistic locking; use pagination; avoid exposing JPA entities in APIs, N+1 queries, and auto-migration in production.
- APIs: use DTOs at boundaries; validate input; return consistent error responses (Problem Details or a project format); version on breaking changes; test serialization when payload shape matters; never expose stack traces, SQL errors, or domain entities directly.

## 16. Security and Dependencies

- Security: validate external input; encode output at boundaries; use parameterized queries; use secure XML parser settings; protect secrets; set network timeouts; keep TLS verification on; avoid unsafe deserialization; centralize cryptographic operations; use maintained libraries; run dependency vulnerability checks where configured.
- Dependencies: add only with a clear purpose; keep scopes narrow; prefer mature, maintained libraries; avoid duplicate/abandoned libraries; check transitive conflicts; run audits; document major additions.
- Almost never: implement custom cryptography; store keys/certs in source control; use MD5/SHA-1 for security; suppress critical/high vulnerability findings without justification; disable security checks to finish.

## 17. Testing Strategy

Tests must verify behavior, not implementation. A suite that only executes code without meaningful
assertions is not evidence.

- Always: add tests for every implemented business rule; test success, failure, edge, boundary, and regression cases; keep tests deterministic, independent, command-line runnable; use clear test names; avoid real external services.
- Prefer: JUnit Jupiter; AssertJ; Mockito for boundaries/collaborators; Testcontainers for realistic integration; WireMock/MockWebServer for HTTP; golden files for payloads; a fixed `Clock`; fixture builders; parameterized tests for rule matrices; contract tests for integrations.
- Avoid: happy-path-only tests; mocking domain objects; deep stubs; large Spring tests for pure domain logic; assertion-free tests; tests depending on order/time/credentials.
- Almost never: delete tests or lower thresholds to pass; mock the class under test; test only getters/setters; use sleeps in tests; leave flaky tests unresolved.

## 18. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (simple DTOs, mappers, config, non-critical utilities): compile, basic tests, formatting/static analysis.
- **Medium** (application services, validation, persistence adapters, API endpoints): unit + integration tests, coverage, static analysis, error-path tests.
- **High** (business rules, payroll/financial logic, state transitions, authorization, audit-critical persistence): the above plus edge-case and regression tests, coverage thresholds, mutation where available, architecture tests.
- **Critical** (security, signing/crypto, financial, audit, data integrity, safety-critical): the above plus golden/contract tests, schema validation where applicable, error/rejection tests, audit/traceability tests, redaction tests, dependency/security audit, mutation or mutation-ready structure.

## 19. Coverage and Mutation Testing

Coverage is necessary but not sufficient; mutation testing is stronger evidence for critical rules.

### Default thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API controllers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

Measure with JaCoCo; mutation-test critical rules with PIT. Exclude generated code only with reason.

## 20. Static Analysis and Complexity Limits

Static analysis is part of the gate; treat warnings as findings, not noise.

- Run Checkstyle (style), PMD (complexity/design), SpotBugs (bug patterns), Error Prone (compile-time bugs), ArchUnit (architecture), and a dependency vulnerability checker. Keep suppressions narrow and documented. Treat new warnings as phase failures unless justified. Never add `@SuppressWarnings("all")`.

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

Refactor when a maximum is exceeded; document any justified exception in `PHASE-RESULT.md`.

## 21. Quality Score Model

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
|Main tests were not run|40|
|No meaningful automated tests|55|
|Business rules without unit tests|60|
|Quality gates not run and not explained|65|
|Architecture boundaries unclear|70|
|No coverage evidence|75|
|Critical rules without edge-case tests|80|
|Security/dependency audit missing where applicable|85|
|Static analysis missing where applicable|85|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass, tests are meaningful, critical paths are
covered, complexity is low, architecture is preserved, no known quality gaps remain, no unexplained
skipped gates exist, and `PHASE-RESULT.md` contains evidence.

## 22. Definition of Done

Code compiles; tests pass and meaningful tests were added; build commands ran; quality commands ran
or are documented as unavailable; architecture boundaries preserved; business rules in
domain/application modules; controllers thin; repositories free of business decisions; external
clients isolated; errors handled explicitly; logs safe; auditability where required; complexity
within limits or justified; no secrets introduced; dependencies justified; `PHASE-RESULT.md` exists.
For critical code, also golden/contract tests, schema validation where applicable, error/rejection
tests, audit/traceability, redaction, and mutation evidence.

## 23. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (business rules covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Coverage results
## Mutation testing results
## Static analysis results
## Architecture boundary checks
## Security / dependency audit results
## Logging / audit / traceability evidence
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results, tests, and documented checks — not by confidence or
appearance.

## 24. Final Checklist

Compiles; tests pass and are meaningful; coverage measured or documented; mutation testing for
critical rules or documented; static analysis ran or documented; security/dependency audit ran or
documented; architecture preserved; business rules not in controllers/repositories/entities/DTOs/
builders/clients; complexity within limits or justified; no broad suppressions; no secrets committed;
logs safe; auditability where required; `PHASE-RESULT.md` exists; score is evidence-based; remaining
work to reach 100 documented.
