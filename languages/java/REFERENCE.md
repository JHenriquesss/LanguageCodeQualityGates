# Java Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`. 

## Purpose 

This document defines the Java language quality gate for this implementation phase. 

Its purpose is to prevent low-quality Java code from being generated, accepted, copied into the project root, or treated as complete without measurable evidence. 

This file is not a style preference document. It is an engineering control document. 

The implementation is not complete when files are created. The implementation is complete only when the code: 

- compiles 

- is tested 

- is readable 

- has low complexity 

- preserves architectural boundaries 

- handles errors explicitly 

- is secure by default 

- is auditable where required 

- has objective evidence in PHASE-RESULT.md 

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

Report 0-100. Apply the Score caps. State the evidence for the score and the remaining work to reach 100. The detailed sections below expand each item with Always / Prefer / Avoid / Almost-never guidance. 

### Scope by risk tier (read this when planning) 

Before implementing, classify the change and scope the plan and the review to its tier. Do not apply critical-tier rigor to a throwaway script, and do not ship business rules with only low-tier checks. When planning, list which checks apply for the tier and state any intentionally excluded and why. Detail: see the "Test Types Required by Risk" section below. 

- Low (simple DTOs, straightforward mappers, simple config, non-critical utilities): compile, format, basic tests. MUST 1-4, 9-11. 
- Medium (application services, validation, persistence adapters, API endpoints): add error-path and integration tests, coverage. Add MUST 5, 7, 8. 
- High (core business rules, payroll/legal logic, state transitions, authorization): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, mutation where available. Add MUST 6; tighten 5. 
- Critical (security, signing/crypto, legal/financial/compliance, audit, data integrity): add golden/contract tests, schema validation, error/rejection paths, audit/traceability, redaction, mutation tests. Full gate, no skipped checks. 

## 1. Non-Negotiable Completion Rule 

The implementation LLM must not declare the phase complete merely because code was written. 

A phase is complete only when: 

1. The planned implementation exists. 

2. Relevant automated tests exist. 

3. The build/test commands were executed. 

4. Quality gates were executed where available. 

5. Failures were fixed or documented. 

6. PHASE-RESULT.md was created. 

7. The evidence supports the quality score. 

PHASE-RESULT.md must exist before the final message is sent. 

The final message must be exactly: 

I finished the implementation 

No extra words. No summary. No apology. No markdown. 

## 2. Language Baseline 

## Recommendation 

Use the Java version defined by the project. 

For new production Java applications, prefer: 

- JDK 25 LTS when the project, framework, build tools, and deployment platform support it. 

- JDK 21 LTS when JDK 25 is not yet compatible with the project ecosystem. 

- JDK 17 LTS only when required by legacy framework, runtime, vendor, or deployment constraints. 

The selected Java version must be consistent across: 

- build configuration 

- CI commands 

- local wrapper commands 

- Docker images, if any 

- documentation 

- IDE/toolchain configuration, if present 

## Always do 

- Use the project build wrapper: `./mvnw` or `./gradlew`. 

- Keep source and target compatibility explicit. 

- Ensure tests run from the command line. 

- Document the Java version used in PHASE-RESULT.md. 

- Prefer modern Java language features only when they reduce complexity. 

- Keep production code compatible with the configured Java version. 

## Prefer 

- Records for simple immutable data carriers. 

- Sealed classes/interfaces for closed domain hierarchies. 

- Pattern matching when it improves clarity. 

- Text blocks for readable multiline strings, especially test fixtures. 

- java.time for all date/time logic. 

- Virtual threads for I/O-heavy workloads only when the framework/runtime supports them safely. 

- Explicit, boring Java over clever Java. 

## Avoid 

- Using a Java feature just because it is new. 

- Mixing Java versions across modules. 

- Depending on IDE-specific compiler settings. 

- Allowing local machine configuration to decide the build behavior. 

- Adding preview features unless the architecture explicitly accepts them. 

## Almost never do 

- Use non-LTS Java in production business systems without a documented reason. 

- Change the Java version inside a phase without documenting the impact. 

- Disable compiler warnings globally. 

- Introduce language features that make the code harder for future maintainers. 

## 3. Build Reproducibility 

## Recommendation 

The build must be reproducible from a clean checkout using only documented commands. 

The implementation LLM must assume that the code will later be copied from the isolated dev/phase-* environment into the project root. Therefore, every phase must keep its build behavior predictable. 

## Always do 

- Use Maven Wrapper or Gradle Wrapper when available. 

- Pin plugin versions. 

- Pin dependency versions directly or through a controlled BOM. 

- Keep generated files out of source control unless intentionally tracked. 

- Avoid machine-specific paths. 

- Keep build commands documented in PHASE-RESULT.md. 

- Make sure clean verify or equivalent runs without relying on IDE state. 

- Keep test execution independent from execution order. 

## Prefer 

- Maven Enforcer for dependency convergence. 

- Gradle dependency locking when using Gradle. 

- Reproducible Docker images for integration tests where appropriate. 

- A single source of truth for versions. 

- CI-equivalent commands locally. 

## Avoid 

- Snapshot dependencies. 

- Dynamic dependency versions. 

- Multiple competing build systems in the same module. 

- Build behavior hidden inside IDE configuration. 

- Local-only scripts that are not committed. 

- Build profiles that silently skip tests. 

## Almost never do 

- Skip tests by default. 

- Disable quality gates to make a phase pass. 

- Add a dependency without a clear reason. 

- Allow dependency conflicts to remain unresolved. 

- Commit local secrets, certificates, tokens, or absolute file paths. 

## 4. Mandatory Command Evidence 

The implementation LLM must run the applicable commands and document the result in PHASE-RESULT.md. 

If a command cannot be run, the reason must be documented. 

## Maven baseline 

```bash
./mvnw -version
./mvnw clean verify
```

## Maven quality commands when configured 

```bash
./mvnw checkstyle:check
./mvnw pmd:check
./mvnw spotbugs:check
./mvnw test jacoco:report jacoco:check
./mvnw org.pitest:pitest-maven:mutationCoverage
./mvnw dependency-check:check
```

## Gradle baseline 

```bash
./gradlew --version
./gradlew clean build
```

## Gradle quality commands when configured 

```bash
./gradlew check
./gradlew test
./gradlew jacocoTestReport jacocoTestCoverageVerification
./gradlew pitest
./gradlew dependencyCheckAnalyze
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

A command that failed because the tool is not installed must still be documented. 

## 5. Formatting and Style 

## Recommendation 

Use one formatting standard and automate it. 

Prefer Google Java Style unless the project already has a different enforced style. 

Use a formatter and style checker so code style is not based on opinion. 

## Always do 

- Format code consistently. 

- Keep imports organized. 

- Remove unused imports. 

- Use clear names. 

- Use the narrowest visibility possible. 

- Prefer package-private for internal implementation details. 

- Keep one public top-level class per file. 

- Keep source files focused. 

- Let the formatter handle whitespace and wrapping. 

## Prefer 

- google-java-format. 

- Checkstyle with Google Java Style or the project standard. 

- Names that describe business meaning. 

- Method names that read like actions. 

- Test names that describe behavior. 

- Constants with meaningful names instead of magic values. 

- Small classes with obvious responsibility. 

## Avoid 

- Wildcard imports. 

- Formatting churn unrelated to the phase. 

- Abbreviations that are not domain-standard. 

- Names such as: 

   - Helper 

   - Util 

   - Manager 

   - Processor 

   - Handler 

   - Common 

   - Stuff 

   - Data 

- Excessive comments explaining confusing code instead of simplifying it. 

- Region markers. 

- Commented-out code. 

## Almost never do 

- Disable formatting rules. 

- Suppress style checks globally. 

- Use Hungarian notation. 

- Create generic utility classes for business rules. 

- Accept inconsistent formatting because “the code works”. 

## 6. Naming Rules 

## Recommendation 

Names must reveal intent. 

A maintainer should understand the purpose of a class, method, field, package, or test without reading its full implementation. 

## Always do 

- Use domain language. 

- Use precise names. 

- Name booleans as predicates: 

   - isValid 

   - hasPendingEvents 

   - canBeCancelled 

   - requiresSignature 

- Name commands as imperative actions: 

   - SendEventCommand 

   - RegisterEmployeeExposureCommand 

- Name use cases by business action: 

   - SendRegulatoryEventUseCase 

   - ValidateComplianceEventUseCase 

- Name exceptions by failure meaning: 

   - InvalidEventVersionException 

   - CertificateExpiredException 

## Prefer 

- EmployeeExposurePeriod over PeriodData. 

- PaymentEventBatch over BatchDto. 

- SignedXmlDocument over XmlResult. 

- OccupationalRiskAssessment over RiskInfo. 

- EventTransmissionReceipt over ResponseData. 

## Avoid 

- Technical-only names for domain concepts. 

- Names based on implementation details. 

- Names that hide business meaning. 

- Overloaded terms with multiple meanings. 

- doWork, process, handle, execute without context. 

## Almost never do 

- Use single-letter names outside tiny local scopes. 

- Use misleading names. 

- Use Foo, Bar, or placeholder names in production code. 

- Name business classes after frameworks, tables, or transport formats. 

## 7. Package and Module Structure 

## Recommendation 

Packages must reflect architecture, not random technical grouping. 

A good Java package structure makes invalid dependencies difficult and obvious. 

## Always do 

- Preserve the architecture from architecture.md. 

- Keep domain code separate from infrastructure code. 

- Keep application/use-case code separate from controllers and adapters. 

- Keep external system clients outside domain/application core. 

- Keep tests close to the code they verify. 

- Use architecture tests when the project has multiple layers/modules. 

## Prefer 

A structure similar to this when compatible with the project: 

```text
com.company.product
  domain
    model
    rules
    events
    exceptions
  application
    usecase
    port
    service
    command
    result
  infrastructure
    persistence
    regulatory
    xml
    messaging
    security
  api
    rest
    dto
    mapper
  config
```

For a feature-based architecture, prefer: 

```text
com.company.product.<feature>
  domain
  application
  infrastructure
  api
```

## Avoid 

- One giant service package. 

- One giant utils package. 

- One giant dto package for the whole system. 

- Mixed packages where controllers, entities, repositories, and business rules live together. 

- Cross-feature imports that bypass application boundaries. 

- Cyclic dependencies. 

## Almost never do 

- Put business rules in: 

   - controllers 

   - repositories 

   - JPA entities 

   - XML builders 

   - API DTOs 

   - integration clients 

   - message consumers 

- Create a common module that becomes a dumping ground. 

- Let package structure contradict architecture.md. 

## 8. Architectural Boundaries 

## Recommendation 

Business rules must be explicit, isolated, and tested. 

Frameworks, databases, queues, HTTP clients, XML libraries, and external systems are implementation details. They must not own business decisions. 

## Always do 

- Keep dependency direction inward. 

- Use domain/application modules for business rules. 

- Use infrastructure adapters for external systems. 

- Use ports/interfaces at boundaries where useful. 

- Keep controllers thin. 

- Keep repositories focused on persistence. 

- Keep integration clients focused on communication. 

- Test architecture boundaries with ArchUnit when applicable. 

## Prefer 

- Domain model for business concepts. 

- Application services for use-case orchestration. 

- Ports for persistence, messaging, signing, storage, clock, external APIs. 

- Adapters for database, filesystem, HTTP, XML, regulatory, queues. 

- Mappers between DTOs and domain/application models. 

- Explicit commands/results for use cases. 

- Package-private implementation classes where possible. 

## Avoid 

- Controllers calling repositories directly for business flows. 

- Domain importing Spring, Jakarta Persistence, HTTP, JSON, XML, logging, or database APIs. 

- Infrastructure returning provider-specific models into the application core. 

- API DTOs being reused as domain objects. 

- Database entities being reused as API responses. 

- Framework annotations inside domain classes. 

- Circular dependencies. 

## Almost never do 

- Hide business rules inside SQL. 

- Hide business rules inside XML generation. 

- Hide business rules inside exception mappers. 

- Hide business rules inside message listeners. 

- Allow infrastructure to decide domain outcomes. 

- Change architecture inside a phase without documenting the reason. 

## 9. Object Design 

## Recommendation 

Good Java code models behavior, invariants, and intent. 

Avoid both extremes: 

- procedural code disguised as object-oriented code 

- over-engineered abstraction without real need 

## Always do 

- Protect invariants. 

- Keep objects valid after construction. 

- Keep responsibilities focused. 

- Prefer composition over inheritance. 

- Make illegal states hard or impossible to represent. 

- Keep state transitions explicit. 

- Use constructors/factories to validate required data. 

- Use value objects for domain-specific values. 

## Prefer 

- Rich domain objects when business behavior belongs to the model. 

- Application services when behavior coordinates multiple dependencies. 

- Domain services only when behavior does not naturally belong to an entity/value object. 

- Small interfaces at architectural boundaries. 

- Immutable value objects. 

- Explicit state transition methods: 

   - markAsSigned 

   - markAsSent 

   - markAsRejected 

   - cancel 

   - approve 

## Avoid 

- Anemic domain models for non-trivial business rules. 

- Public setters by default. 

- Generic mutable objects passed everywhere. 

- Deep inheritance trees. 

- Abstract base classes used only for code reuse. 

- Boolean parameters that change behavior. 

- Primitive obsession for important concepts. 

## Almost never do 

- Use inheritance before composition has failed. 

- Allow invalid domain objects to exist temporarily. 

- Use Map<String, Object> as a domain model. 

- Use Object to avoid modeling real types. 

- Create broad interfaces with only one implementation unless needed for a boundary or test seam. 

## 10. Immutability 

## Recommendation 

Prefer immutability by default. 

Mutable state must be justified, contained, and tested. 

## Always do 

- Make fields private final unless mutation is required. 

- Defensively copy mutable inputs. 

- Do not expose mutable internal collections. 

- Keep value objects immutable. 

- Use immutable collections for public return values where possible. 

- Make mutation methods enforce invariants. 

## Prefer 

- Records for simple immutable carriers. 

- Classes for domain objects with behavior and invariants. 

- List.copyOf, Set.copyOf, Map.copyOf. 

- Explicit methods for controlled mutation. 

- Immutable command/result objects. 

## Avoid 

- Public setters. 

- Mutable DTOs leaking into domain logic. 

- Sharing mutable collections. 

- Reusing the same mutable object across layers. 

- Static mutable state. 

## Almost never do 

- Use Lombok @Data on domain objects. 

- Use mutable public fields. 

- Return internal collections directly. 

- Allow unrelated layers to mutate domain state. 

## 11. Null Safety 

## Recommendation 

Null must be treated as a boundary hazard. 

Inside the domain/application core, absence should be explicit. 

## Always do 

- Validate required constructor arguments. 

- Fail fast for missing mandatory values. 

- Return empty collections instead of null collections. 

- Make nullable behavior explicit. 

- Use Objects.requireNonNull for required dependencies and values. 

- Test null/empty boundary cases when they are relevant. 

## Prefer 

- Optional as a return type for legitimate absence. 

- Domain-specific absence concepts when absence has business meaning. 

- Bean Validation or explicit validators at API/input boundaries. 

- Nullness static analysis if available. 

- Clear validation error messages. 

## Avoid 

- Returning null from public methods. 

- Accepting null silently. 

- Storing Optional in fields. 

- Using Optional as a method parameter. 

- Calling Optional.get() without proving presence. 

- Treating null and empty string as the same unless explicitly defined. 

## Almost never do 

- Catch NullPointerException as control flow. 

- Use null to represent multiple business states. 

- Suppress nullness warnings broadly. 

- Hide null problems behind generic exception handling. 

## 12. Error Handling 

## Recommendation 

Errors must be explicit, meaningful, and handled at the correct layer. 

The goal is not to catch everything. The goal is to preserve meaning and make failure safe. 

## Always do 

- Use domain-specific exceptions for business invariant violations. 

- Preserve root causes when wrapping technical exceptions. 

- Include useful context in error messages. 

- Convert technical failures to application-level outcomes at boundaries. 

- Test expected failure paths. 

- Avoid leaking internal details to external clients. 

- Make retryable vs non-retryable failures explicit. 

- Document known limitations. 

## Prefer 

- Domain exceptions for invalid business operations. 

- Application exceptions for use-case failures. 

- Infrastructure exceptions for adapter/client failures. 

- Centralized API exception mapping. 

- Error codes for external/auditable failures. 

- Result types where failures are expected business outcomes. 

- Clear rejection reasons for legal/regulatory events. 

## Avoid 

- Catching broad Exception without a specific reason. 

- Swallowing exceptions. 

- Logging and rethrowing at every layer. 

- Returning null on failure. 

- Returning partially initialized objects. 

- Hiding integration failures as success. 

- Losing original stack traces. 

## Almost never do 

- Catch Throwable. 

- Catch Error. 

- Use exceptions for normal loop control. 

- Expose stack traces to users. 

- Ignore failed persistence, signing, transmission, or audit operations. 

- Convert all failures to a generic "Something went wrong" without internal traceability. 

## 13. Validation 

## Recommendation 

Validate at boundaries and enforce invariants in the domain. 

Do not rely only on UI validation, controller validation, database constraints, or external system rejection. 

## Always do 

- Validate external input before use. 

- Validate required fields. 

- Validate ranges. 

- Validate formats. 

- Validate cross-field rules. 

- Validate business invariants. 

- Test validation success and failure cases. 

- Keep validation errors understandable. 

## Prefer 

- Bean Validation for simple DTO/input constraints. 

- Explicit validators for complex business rules. 

- Domain constructors/factories that prevent invalid values. 

- Value objects for constrained fields. 

- Error codes for stable external behavior. 

- Regression tests for previously incorrect validation. 

## Avoid 

- Duplicating validation inconsistently across layers. 

- Accepting malformed data and relying on later failure. 

- Hiding validation inside mappers. 

- Returning ambiguous validation messages. 

- Treating all validation failures as technical exceptions. 

## Almost never do 

- Let invalid legal/regulatory events be generated. 

- Let invalid data reach persistence because “the database will reject it.” 

- Put critical validation only in frontend code. 

- Use regex-only validation for complex legal/domain rules without tests. 

## 14. Date, Time, Time Zones, and Clock 

## Recommendation 

Date and time bugs are business bugs. 

Use explicit types and freeze time in tests. 

## Always do 

- Use java.time. 

- Use Instant for machine timestamps. 

- Use LocalDate for date-only business concepts. 

- Use OffsetDateTime when offset matters. 

- Use ZonedDateTime when timezone rules matter. 

- Inject Clock when current time affects behavior. 

- Test time-dependent logic with a fixed clock. 

- Define timezone policy. 

## Prefer 

- Domain value objects for deadlines, periods, event dates, validity ranges, and legal dates. 

- ISO-8601 at technical boundaries unless integration requires another format. 

- Explicit conversion at boundaries. 

- Clear handling of inclusive/exclusive date ranges. 

- Tests for boundary dates. 

## Avoid 

- new Date(). 

- Calendar. 

- System.currentTimeMillis() in domain/application logic. 

- Hidden default timezone assumptions. 

- Comparing dates as strings. 

- Mixing date-only and timestamp concepts. 

## Almost never do 

- Use local machine time as business truth. 

- Parse dates repeatedly inside business rules. 

- Ignore timezone requirements in legal/regulatory events. 

- Test time behavior using real current time. 

## 15. Money, Decimals, and Numeric Rules 

## Recommendation 

Use exact numeric types for money, measurements, and legal/business calculations. 

## Always do 

- Use BigDecimal for money and precise decimal values. 

- Define rounding rules explicitly. 

- Define scale rules explicitly. 

- Test boundary values. 

- Avoid magic numbers. 

- Name constants after business meaning. 

## Prefer 

- Value objects for money, rates, percentages, quantities, measurements, and thresholds. 

- Centralized rounding policies. 

- Tests for minimum, maximum, zero, negative, and fractional values. 

- Explicit units in names: 

   - amountInCents 

   - durationInDays 

   - exposureLevelDb 

   - ratePercent 

## Avoid 

- double or float for money. 

- Hidden rounding. 

- Implicit unit conversion. 

- Numeric literals spread through the code. 

- Silent overflow risk. 

## Almost never do 

- Round financial/legal values without tests. 

- Mix units in the same field. 

- Compare BigDecimal incorrectly when scale matters. 

- Use binary floating-point for legal, financial, or payroll calculations. 

## 16. Collections and Streams 

## Recommendation 

Use the clearest collection construct, not the cleverest. 

Streams are good for simple transformations. Loops are good when they are clearer. 

## Always do 

- Avoid side effects inside stream pipelines. 

- Keep stream chains readable. 

- Use immutable/unmodifiable collections at public boundaries where possible. 

- Choose the right collection type. 

- Make ordering explicit when output order matters. 

- Avoid repeated list scans when a map/set would be clearer and faster. 

## Prefer 

- Simple map/filter/reduce streams. 

- Plain loops for complex branching. 

- List.copyOf, Set.copyOf, Map.copyOf. 

- EnumMap for enum-keyed maps. 

- Set for membership checks. 

- Map for lookup by identifier. 

## Avoid 

- Nested streams that hide business logic. 

- Long lambda expressions. 

- parallelStream() without proof. 

- Mutating external variables inside streams. 

- Depending on accidental collection order. 

- Returning mutable internal collections. 

## Almost never do 

- Use streams for persistence side effects. 

- Use streams for HTTP calls. 

- Use streams for message publishing. 

- Use raw types. 

- Suppress unchecked warnings without a narrow documented reason. 

## 17. Functional Style 

## Recommendation 

Use functional style when it reduces accidental complexity. 

Do not force functional style where it makes business code harder to understand. 

## Always do 

- Keep lambdas short. 

- Keep functions pure when possible. 

- Avoid hidden side effects. 

- Use method references only when they remain obvious. 

- Name extracted functions after business meaning. 

## Prefer 

- Pure functions for calculations. 

- Pure functions for transformations. 

- Explicit input/output. 

- Small composable validators. 

- Deterministic mappers. 

## Avoid 

- Functional chains that obscure control flow. 

- Returning functions from functions unless the abstraction is useful. 

- Mixing mutation and functional style in the same flow. 

- Clever Optional chains that hide errors. 

## Almost never do 

- Use functional tricks to impress. 

- Replace clear imperative code with unreadable functional code. 

- Hide exception handling inside lambdas. 

- Use streams as a substitute for real domain modeling. 

## 18. Concurrency 

## Recommendation 

Concurrency must be boring, bounded, observable, and tested. 

## Always do 

- Keep shared state minimal. 

- Make shared state thread-safe or eliminate it. 

- Use bounded resources. 

- Handle cancellation. 

- Handle interruption correctly. 

- Set timeouts. 

- Test concurrency-sensitive code. 

- Make idempotency explicit for async/message handlers. 

## Prefer 

- Immutable objects passed between threads. 

- Framework-managed executors. 

- Virtual threads for blocking I/O workloads when supported. 

- Message queues for long-running/background work. 

- Explicit retry policies. 

- Backpressure-aware designs. 

- Correlation IDs for async flows. 

## Avoid 

- Raw thread creation. 

- Unbounded executors. 

- Shared mutable static state. 

- Blocking calls inside event loops. 

- Thread.sleep() for coordination. 

- parallelStream() for I/O. 

- Hidden global caches. 

- Silent retries. 

## Almost never do 

- Fix race conditions with arbitrary sleeps. 

- Ignore interrupted status. 

- Introduce async behavior without tests and observability. 

- Make transaction boundaries cross slow external network calls without explicit design. 

## 19. Resource Management 

## Recommendation 

Every resource must have clear ownership and deterministic cleanup. 

## Always do 

- Use try-with-resources. 

- Close streams, files, sockets, database resources, HTTP responses, and XML readers. 

- Set connection and read timeouts. 

- Avoid loading large payloads into memory without reason. 

- Keep resource ownership explicit. 

- Test resource-heavy adapters where practical. 

## Prefer 

- Framework-managed resources. 

- Streaming for large files. 

- Pagination for large data sets. 

- Backpressure for high-volume flows. 

- Adapter classes that isolate resource handling. 

## Avoid 

- Unbounded queues. 

- Unbounded caches. 

- Long-running transactions. 

- Large in-memory XML/JSON processing without limits. 

- Resource cleanup in finalizers. 

## Almost never do 

- Depend on garbage collection for cleanup. 

- Ignore failed close operations when they matter. 

- Process legal/audit payloads without durable error handling. 

- Keep database transactions open while waiting for external services unless explicitly designed. 

## 20. Logging 

## Recommendation 

Logs are operational evidence, not decoration. 

Logs must help diagnose failures without leaking sensitive data. 

## Always do 

- Use a logging framework. 

- Use parameterized logging. 

- Log meaningful events at appropriate levels. 

- Include correlation/request IDs where available. 

- Never log secrets. 

- Never log private keys. 

- Never log passwords. 

- Never log tokens. 

- Never log raw sensitive legal/personnel/health payloads without explicit redaction. 

- Log failures with useful context. 

- Keep logs deterministic enough for operations. 

## Prefer 

- Structured logs. 

- Stable event names. 

- Domain identifiers instead of raw payloads. 

- Redaction utilities. 

- Separate audit trail from debug logs. 

- Clear log levels: 

   - ERROR for failed operations requiring attention. 

   - WARN for degraded or unexpected recoverable states. 

   - INFO for important business/operational events. 

   - DEBUG for development diagnostics. 

## Avoid 

- System.out.println. 

- String concatenation in logs. 

- Logging the same exception repeatedly. 

- Logging full XML/JSON payloads. 

- Logging inside tight loops without rate control. 

- Vague messages like "error occurred". 

## Almost never do 

- Log sensitive regulatory XML unredacted. 

- Use logs as the only audit trail. 

- Hide failures because “they are already logged.” 

- Log and continue after an unrecoverable business failure. 

## 21. Auditability and Traceability 

## Recommendation 

For important business operations, especially legal/regulatory operations, auditability is part of correctness. 

## Always do 

- Record who/what initiated important actions when available. 

- Record when important actions occurred. 

- Record what business object was affected. 

- Record result status. 

- Preserve correlation IDs. 

- Preserve external protocol identifiers such as receipts, batch IDs, protocol numbers, or rejection codes where applicable. 

- Make audit events tamper-aware when required by the project. 

- Test audit behavior for critical flows. 

## Prefer 

- Explicit audit trail tables/events. 

- Stable audit event names. 

- Redacted payload references. 

- Hashes/checksums for sensitive generated documents when useful. 

- Append-only audit records for legal events. 

- Traceable state transitions. 

## Avoid 

- Audit data only in application logs. 

- Free-text-only audit records. 

- Missing failure audit records. 

- Inconsistent event names. 

- Storing more sensitive data than necessary. 

## Almost never do 

- Send, sign, cancel, correct, or interpret legal events without traceability. 

- Lose the connection between generated payload, transmission attempt, response, and final state. 

- Make audit optional for regulatory flows. 

## 22. Security Baseline 

## Recommendation 

Security must be default behavior, not cleanup work. 

The implementation LLM must assume inputs are untrusted unless proven otherwise. 

## Always do 

- Validate external input. 

- Encode output at boundaries. 

- Use parameterized queries. 

- Use secure XML parser settings. 

- Protect secrets. 

- Set network timeouts. 

- Keep TLS verification enabled. 

- Run dependency vulnerability checks when configured. 

- Avoid deserialization of untrusted data. 

- Keep cryptographic operations centralized and reviewed. 

- Use maintained libraries. 

## Prefer 

- OWASP Dependency-Check or equivalent. 

- Secret scanning if available. 

- Dependency convergence checks. 

- Minimal dependency scopes. 

- Allow-lists for constrained input values. 

- Safe defaults. 

- Secure configuration by environment. 

- Explicit permission checks at application boundaries. 

## Avoid 

- Hardcoded credentials. 

- Disabling TLS verification. 

- Dynamic SQL string concatenation. 

- Unsafe reflection. 

- Unsafe deserialization. 

- Default XML parser settings for untrusted XML. 

- Broad CORS/security relaxations. 

- Logging secrets or raw sensitive payloads. 

- Adding dependencies for trivial functionality. 

## Almost never do 

- Implement custom cryptography. 

- Store private keys or certificates in source control. 

- Use MD5/SHA-1 for security-sensitive hashing. 

- Suppress critical/high vulnerability findings without documented justification. 

- Disable security checks to finish the phase. 

- Treat security as optional because the environment is “only development.” 

## 23. XML Safety 

## Recommendation 

XML processing must be hardened. 

This is especially important for legal, regulatory, and compliance payloads. 

## Always do 

- Disable DOCTYPE when parsing untrusted XML. 

- Disable external entities. 

- Disable external DTD loading. 

- Enable secure processing. 

- Disable XInclude unless explicitly required and safe. 

- Limit entity expansion. 

- Validate XML against the expected schema where applicable. 

- Use deterministic XML generation. 

- Test generated XML with golden files. 

- Test malformed XML and rejection paths. 

## Prefer 

- JAXB or dedicated XML libraries configured safely. 

- Schema/version-specific XML models. 

- Golden files for generated XML. 

- Canonicalization tests when signatures are involved. 

- Contract tests for external XML payloads. 

- Redacted XML logging. 

## Avoid 

- XML string concatenation. 

- Parsing untrusted XML with default settings. 

- Mixing schema versions in one generic builder. 

- Ignoring namespace correctness. 

- Ignoring encoding requirements. 

- Comparing XML as raw strings when canonical comparison is needed. 

## Almost never do 

- Generate legal XML without tests. 

- Sign XML without deterministic canonicalization tests. 

- Send XML without validation when schema is available. 

- Log complete sensitive XML payloads. 

- Use unversioned XML builders for versioned legal layouts. 

## 24. Dependency Management 

## Recommendation 

Every dependency is a liability until justified. 

Dependencies affect security, startup time, build time, licensing, transitive vulnerabilities, and maintainability. 

## Always do 

- Add dependencies only with a clear purpose. 

- Keep scopes narrow. 

- Prefer mature, maintained libraries. 

- Avoid duplicate libraries with overlapping responsibilities. 

- Check transitive dependency conflicts. 

- Run dependency audits when available. 

- Document major dependency additions in PHASE-RESULT.md. 

## Prefer 

- Project-approved BOMs. 

- Maven Enforcer dependency convergence. 

- Gradle dependency locking. 

- Minimal adapters around third-party libraries. 

- Internal interfaces for external systems. 

- Regular dependency updates through controlled process. 

## Avoid 

- Adding a framework for one helper method. 

- Depending on abandoned libraries. 

- Pulling large dependency trees for small tasks. 

- Using snapshot versions. 

- Letting transitive dependencies define important versions accidentally. 

## Almost never do 

- Ignore known critical vulnerabilities. 

- Add dependencies with incompatible licenses. 

- Use unmaintained XML/security/crypto libraries. 

- Modify dependency versions randomly to make the build pass. 

## 25. Framework Usage 

## Recommendation 

Frameworks must support the architecture, not own it. 

Spring, Jakarta EE, Quarkus, Micronaut, Hibernate, messaging frameworks, and HTTP clients belong near the edges unless the architecture says otherwise. 

## Always do 

- Use constructor injection. 

- Keep framework annotations near boundaries. 

- Keep domain logic free of framework dependencies. 

- Keep configuration explicit. 

- Use framework features deliberately. 

- Test business logic without full framework startup when possible. 

## Prefer 

- Plain Java domain/application classes. 

- Thin controllers. 

- Explicit configuration classes. 

- Framework adapters around the core. 

- Small beans/components. 

- Integration tests for framework wiring where it matters. 

## Avoid 

- Field injection. 

- Static access to application context. 

- Large framework-managed god services. 

- Business logic hidden in annotations. 

- Business logic hidden in filters/interceptors/listeners unless that is the explicit architectural boundary. 

- Full application-context tests for simple domain rules. 

## Almost never do 

- Put domain logic in Spring controllers. 

- Put domain logic in JPA entity callbacks. 

- Put domain logic in framework event listeners without tests. 

- Make framework convenience override architecture. 

## 26. Persistence 

## Recommendation 

Persistence is an adapter, not the domain. 

Database shape and domain shape may be related, but they are not automatically the same thing. 

## Always do 

- Keep transaction boundaries explicit. 

- Keep persistence code outside domain logic. 

- Use migrations for schema changes. 

- Test custom queries. 

- Test important mappings. 

- Handle optimistic locking/concurrency where applicable. 

- Use pagination for potentially large result sets. 

- Keep persistence exceptions from leaking into domain logic. 

## Prefer 

- Application services controlling transactions. 

- Repository interfaces that express business intent. 

- Infrastructure repository implementations. 

- Flyway or Liquibase for migrations. 

- Testcontainers for realistic persistence tests when available. 

- Explicit query methods with business names. 

- DTO/projection queries for read models where appropriate. 

## Avoid 

- Exposing JPA entities in APIs. 

- Lazy-loading surprises across boundaries. 

- Open Session in View as hidden business behavior. 

- Automatic schema update in production. 

- Business rules implemented only in SQL. 

- N+1 query problems. 

- Repositories containing use-case orchestration. 

## Almost never do 

- Let database entities become the domain model accidentally. 

- Make transactions span slow external calls unless explicitly designed. 

- Store audit-critical events without traceability. 

- Use raw SQL for business-critical behavior without tests. 

## 27. API Design 

## Recommendation 

APIs are contracts. 

Treat public request/response models as compatibility-sensitive artifacts. 

## Always do 

- Use DTOs at API boundaries. 

- Validate input. 

- Return consistent error responses. 

- Avoid exposing internal exceptions. 

- Avoid exposing persistence entities. 

- Test serialization/deserialization when payload shape matters. 

- Version APIs when breaking changes are introduced. 

## Prefer 

- Clear request/response models. 

- Stable field names. 

- Explicit validation messages. 

- Problem Details or a project-approved error format. 

- Contract tests for public APIs. 

- Backward-compatible changes. 

- Idempotency keys for operations that may be retried. 

## Avoid 

- Letting framework defaults accidentally define the public contract. 

- Returning domain entities directly. 

- Returning database entities directly. 

- Mixing transport concerns into business logic. 

- Ambiguous HTTP status codes. 

- Accepting unknown malformed payloads silently. 

## Almost never do 

- Break API contracts without tests and documentation. 

- Expose stack traces or SQL errors. 

- Put business rules in controller methods. 

- Make legal/regulatory API behavior undocumented. 

## 28. External Integrations 

## Recommendation 

External integrations must be isolated, contract-tested, timeout-bounded, and failureaware. 

## Always do 

- Keep clients outside domain logic. 

- Define explicit request/response models. 

- Set connection/read/write timeouts. 

- Handle retries deliberately. 

- Make idempotency explicit. 

- Validate responses before using them. 

- Convert provider failures into application-level outcomes. 

- Add contract tests or fake-server tests where applicable. 

- Test error responses. 

## Prefer 

- Ports for external services. 

- Provider-specific adapters. 

- Versioned integration packages. 

- Contract tests for: 

   - payload shape 

   - headers 

   - status codes 

   - success responses 

   - error responses 

   - timeouts 

   - retries 

- Golden files for stable JSON/XML payloads. 

- WireMock, MockWebServer, Testcontainers, or project-approved equivalents. 

## Avoid 

- Live external systems in automated tests. 

- Infinite retries. 

- Retrying non-idempotent operations without idempotency protection. 

- Treating every HTTP 200 as business success. 

- Building payloads with string concatenation. 

- Provider DTOs leaking into domain models. 

## Almost never do 

- Hide failed integration calls as successful business operations. 

- Depend on production credentials for tests. 

- Skip contract tests for legal, financial, payroll, health, or regulatory integrations. 

- Let external systems define internal domain concepts directly. 

## 29. Regulatory and Legal Strict Gate 

## Recommendation 

Any Java code related to regulatory must be treated as high-risk legal/regulatory code. This includes code that: 

- generates regulatory data 

- validates regulatory data 

- signs XML 

- sends events 

- receives responses 

- stores receipts 

- interprets rejections 

- cancels events 

- corrects events 

- manages versions/layouts 

- handles regulatory business rules 

- stores audit evidence 

## Always do 

- Use version-aware structures. 

- Keep schemas/layout versions explicit. 

- Keep event types explicit. 

- Keep business/legal rules explicit. 

- Test required fields. 

- Test optional fields. 

- Test invalid values. 

- Test edge cases. 

- Test version differences. 

- Validate XML against schema when available. 

- Use golden tests for generated XML. 

- Preserve auditability. 

- Preserve traceability. 

- Redact sensitive logs. 

- Handle rejection responses explicitly. 

- Add regression tests for every fixed legal/business bug. 

## Prefer 

- Separate packages by regulatory layout/version. 

- Explicit event models. 

- Explicit mappers from domain/application to regulatory payloads. 

- Deterministic XML generation. 

- Golden files reviewed as contract artifacts. 

- Schema validation in automated tests. 

- Dedicated fixtures per event type. 

- Clear error codes. 

- User-safe error messages. 

- Internal technical error details with trace IDs. 

- Audit records with correlation IDs. 

- Checksums/hashes for generated payloads when useful. 

## Avoid 

- Generic map-based legal payloads. 

- String concatenation for XML. 

- Business rules hidden inside XML builders. 

- Business rules hidden inside signing/sending clients. 

- Silent fallback when schema versions mismatch. 

- Sending events without local validation. 

- Logging full sensitive payloads. 

- Using production certificates in tests. 

## Almost never do 

- Generate regulatory XML without golden tests. 

- Generate regulatory XML without schema/version awareness. 

- Sign XML without deterministic tests. 

- Send events without contract tests. 

- Interpret legal rejection responses with generic string matching only. 

- Mix multiple schema versions in one unstructured class. 

- Change legal interpretation without documenting source, reason, and impact. 

## Additional regulatory evidence required 

For regulatory phases, PHASE-RESULT.md must include: 

## Regulatory evidence 

- Event types affected: 

- Layout/schema versions affected: 

- Golden tests added: 

- Schema validation tests added: 

- Contract tests added: 

- Rejection/error tests added: 

- Audit/traceability behavior added: 

- Sensitive data redaction verified: 

- Known legal/regulatory uncertainty: 

## 30. Testing Strategy 

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

## Prefer 

- JUnit Jupiter/JUnit Platform. 

- AssertJ or another expressive assertion library. 

- Mockito only for boundaries and collaborators. 

- Testcontainers for realistic infrastructure integration tests. 

- WireMock/MockWebServer for HTTP clients. 

- Golden files for generated payloads. 

- Fixed Clock for time-dependent tests. 

- Fixture builders for readability. 

- Parameterized tests for rule matrices. 

- Contract tests for external integrations. 

## Avoid 

- Testing only happy paths. 

- Mocking domain objects. 

- Deep stubs. 

- Large Spring tests for pure domain logic. 

- Tests with no assertions. 

- Tests that duplicate production logic. 

- Tests depending on execution order. 

- Tests depending on current date/time. 

- Tests depending on real credentials. 

## Almost never do 

- Delete tests to make the phase pass. 

- Lower thresholds to make the phase pass. 

- Mock the class under test. 

- Write tests only for getters/setters. 

- Use sleeps in tests. 

- Depend on production external systems. 

- Leave flaky tests unresolved. 

## 31. Test Types Required by Risk 

## Low-risk code 

## Examples: 

- simple DTOs 

- straightforward mappers 

- simple configuration 

- non-critical utility code 

Required evidence: 

- compile 

- basic tests when behavior exists 

- formatting/static analysis 

## Medium-risk code 

Examples: 

- application services 

- validation logic 

- persistence adapters 

- API endpoints 

- non-critical integrations 

## Required evidence: 

- unit tests 

- integration tests where applicable 

- coverage 

- static analysis 

- error-path tests 

## High-risk code 

## Examples: 

- business rules 

- payroll/legal logic 

- health/compliance logic 

- event state transitions 

- authorization 

- persistence of audit-critical records 

## Required evidence: 

- unit tests 

- edge-case tests 

- regression tests 

- coverage thresholds 

- mutation testing where available 

- architecture tests where applicable 

## Critical-risk code 

## Examples: 

- regulatory XML generation 

- legal event validation 

- digital signing 

- event transmission 

- receipt interpretation 

- cancellation/correction flows 

- certificate handling 

- security-sensitive code 

Required evidence: 

- unit tests 

- contract tests 

- golden tests 

- schema validation tests where applicable 

- mutation testing or mutation-ready structure 

- error-path tests 

- audit tests 

- redaction tests 

- dependency/security audit 

## 32. Coverage and Mutation Testing 

## Recommendation 

Coverage is necessary but not sufficient. 

Mutation testing is stronger evidence for critical business rules because it checks whether tests detect behavioral changes. 

## Default thresholds 

|Area|Line Coverage|Branch Coverage|Mutation Score|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical legal/regulatory rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API controllers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|



## Always do 

- Measure coverage when tooling is available. 

- Mutation-test critical rules when tooling is available. 

- Document coverage results. 

- Document mutation results. 

- Document uncovered critical paths. 

- Add tests before increasing quality score. 

- Exclude generated code only with explicit reason. 

## Prefer 

- JaCoCo for coverage. 

- PIT for mutation testing. 

- Mutation testing focused on domain/application modules first. 

- Smaller mutation scopes per phase. 

- Regression tests that kill previously surviving mutants. 

## Avoid 

- Treating high line coverage as proof of correctness. 

- Assertion-free tests. 

- Excluding difficult classes without reason. 

- Measuring only framework/controller code. 

- Ignoring surviving mutants in critical rules. 

## Almost never do 

- Accept untested business rules. 

- Accept untested regulatory payload generation. 

- Claim production-grade quality without coverage evidence. 

- Claim production-grade quality for critical rules without mutation evidence or documented mutation-readiness. 

## 33. Static Analysis 

## Recommendation 

Static analysis must be part of the gate. 

The implementation LLM must not treat warnings as cosmetic if the tool is configured to detect bugs, security issues, complexity, or architecture violations. 

## Always do 

- Run configured static analysis. 

- Fix high-confidence findings. 

- Keep suppressions narrow. 

- Document suppressions. 

- Avoid broad exclusions. 

- Treat new warnings as phase failures unless justified. 

## Prefer 

- Checkstyle for style. 

- PMD for complexity/design issues. 

- SpotBugs for bug patterns. 

- Error Prone for compile-time bug detection where supported. 

- ArchUnit for architecture rules. 

- OWASP Dependency-Check or equivalent for vulnerable dependencies. 

## Avoid 

- Adding broad suppressions. 

- Ignoring nullness, equality, resource leak, concurrency, and security warnings. 

- Suppressing warnings without explaining why. 

- Allowing new warnings because old warnings already exist. 

- Running static analysis but ignoring its result. 

## Almost never do 

- Add @SuppressWarnings("all"). 

- Disable static analysis. 

- Exclude production packages globally. 

- Ignore static analysis in security/legal/regulatory code. 

- Modify tool configuration only to hide generated problems. 

## 34. Complexity Limits 

## Recommendation 

Complexity must be actively reduced. 

If a function, file, class, module, or dependency relationship becomes hard to understand, refactor before declaring completion. 

## Default limits 

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



## Always do 

- Refactor complex methods. 

- Use guard clauses when they improve readability. 

- Extract domain concepts. 

- Split responsibilities. 

- Keep modules cohesive. 

- Keep dependencies understandable. 

- Document exceptions in PHASE-RESULT.md. 

## Prefer 

- Small methods named after business rules. 

- Small classes with one reason to change. 

- Polymorphism or rule objects for meaningful variants. 

- Explicit validators for complex validation. 

- Tables/matrices in tests for complex rule combinations. 

## Avoid 

- Deep nesting. 

- Long parameter lists. 

- Boolean control parameters. 

- Large switch statements spread across modules. 

- Duplicated business rules. 

- God classes. 

- Static utility classes containing business logic. 

## Almost never do 

- Accept high complexity because generated code “works.” 

- Hide complexity behind reflection. 

- Add abstraction before there are real use cases. 

- Use inheritance to avoid extracting clear collaborators. 

- Keep complex legal rules without explicit tests. 

## 35. Refactoring Rule 

## Recommendation 

Refactoring is mandatory when quality gates reveal poor structure. 

The implementation LLM must not leave poor code in place just because tests pass. 

## Always refactor when 

- A method exceeds complexity maximums. 

- A class mixes multiple responsibilities. 

- Business rules are in the wrong layer. 

- Tests are hard to write because the design is coupled. 

- Duplicate business rules appear. 

- Error handling becomes generic and unclear. 

- Adding a feature requires modifying unrelated modules. 

- A module has circular dependencies. 

## Prefer 

- Extract method. 

- Extract class. 

- Extract value object. 

- Extract interface/port at external boundary. 

- Replace conditional with polymorphism/rule object when appropriate. 

- Move behavior to the correct layer. 

- Separate pure logic from side effects. 

## Avoid 

- Cosmetic refactoring that does not improve design. 

- Large unrelated rewrites inside a phase. 

- Renaming everything without benefit. 

- Refactoring that weakens tests. 

- Refactoring that changes behavior without regression tests. 

## Almost never do 

- Refactor and skip tests. 

- Refactor legal/regulatory behavior without golden/regression tests. 

- Use refactoring as an excuse to change architecture silently. 

## 36. Comments and Documentation in Code 

## Recommendation 

Comments should explain why, not restate what. 

Good code should explain most of the what through names and structure. 

## Always do 

- Keep comments accurate. 

- Remove obsolete comments. 

- Explain non-obvious business/legal decisions. 

- Explain non-obvious security decisions. 

- Explain deviations from normal patterns. 

- Link behavior to tests when useful through naming, not comments. 

## Prefer 

- Short comments near the relevant code. 

- Javadoc for public APIs where useful. 

- ADRs or markdown docs for architectural decisions. 

- Test names as living documentation. 

- Golden fixtures for payload contracts. 

## Avoid 

- Comments that paraphrase code. 

- Large comment blocks hiding bad design. 

- TODOs without owner/context. 

- Dead commented-out code. 

- Misleading comments. 

## Almost never do 

- Use comments to excuse unclear code. 

- Leave legal/regulatory assumptions undocumented. 

- Depend on comments instead of tests for business rules. 

## 37. Lombok and Code Generation 

## Recommendation 

Generated code and Lombok must not weaken invariants or hide behavior. 

## Always do 

- Keep generated code reproducible. 

- Keep generated code out of coverage only with explicit reason. 

- Ensure generated public contracts are tested. 

- Review generated API shape. 

- Keep domain invariants explicit. 

## Prefer 

- Java records over Lombok for simple immutable data. 

- Explicit constructors for domain objects. 

- Limited Lombok only in DTOs or infrastructure if project accepts it. 

- Annotation processors only when they provide clear value. 

## Avoid 

- Lombok @Data on domain objects. 

- Generated setters that bypass invariants. 

- Hidden constructors that allow invalid state. 

- Complex annotation magic. 

- Generated code that must be manually edited. 

## Almost never do 

- Hide critical business behavior in generated code. 

- Use code generation to avoid modeling the domain. 

- Depend on Lombok behavior that future maintainers cannot easily see. 

- Use Lombok to create mutable domain models by default. 

## 38. Performance 

## Recommendation 

Prefer simple code first, but do not ignore obvious performance risks. 

Performance-sensitive code must be measured. 

## Always do 

- Avoid obviously inefficient algorithms for expected data sizes. 

- Use pagination for large datasets. 

- Avoid repeated database calls in loops. 

- Avoid N+1 queries. 

- Set timeouts. 

- Avoid unnecessary object churn in hot paths. 

- Document performance assumptions when relevant. 

## Prefer 

- Simple algorithms with known complexity. 

- Maps/sets for repeated lookups. 

- Streaming large files/payloads. 

- Batch operations where safe. 

- Benchmarks only for truly performance-sensitive code. 

- Observability for production performance. 

## Avoid 

- Premature micro-optimization. 

- Loading huge datasets into memory. 

- Recomputing expensive values repeatedly. 

- Hidden synchronous calls inside loops. 

- Excessive reflection. 

- Large XML/JSON payload construction without memory consideration. 

## Almost never do 

- Sacrifice correctness for performance. 

- Optimize legal/business rules without regression tests. 

- Use caching without invalidation strategy. 

- Use global mutable caches for critical data. 

## 39. Configuration 

## Recommendation 

Configuration must be explicit, validated, and safe by default. 

## Always do 

- Keep secrets out of source code. 

- Validate required configuration on startup. 

- Use safe defaults. 

- Document required environment variables. 

- Avoid local-only configuration. 

- Keep test configuration separate from production configuration. 

## Prefer 

- Typed configuration objects. 

- Environment-specific profiles. 

- Explicit defaults. 

- Secret managers or environment injection. 

- Fail-fast startup for missing required config. 

- Tests for critical configuration mapping. 

## Avoid 

- Hardcoded credentials. 

- Hardcoded production endpoints. 

- Silent fallback to unsafe defaults. 

- Configuration scattered through code. 

- Magic strings for config keys everywhere. 

## Almost never do 

- Commit certificates/private keys. 

- Commit production secrets. 

- Disable security through default config. 

- Make production behavior depend on developer machine settings. 

## 40. Serialization and Deserialization 

## Recommendation 

Serialization is a boundary concern and must be explicit. 

## Always do 

- Use DTOs for serialized payloads. 

- Validate deserialized data. 

- Keep unknown field behavior deliberate. 

- Test payload shape. 

- Keep versioning strategy explicit. 

- Avoid arbitrary polymorphic deserialization. 

## Prefer 

- Explicit JSON/XML field names. 

- Contract tests. 

- Golden files for stable payloads. 

- Backward-compatible changes. 

- Mappers from serialized models to domain models. 

## Avoid 

- Deserializing directly into domain entities. 

- Exposing internal class names in serialized payloads. 

- Allowing arbitrary subtypes from untrusted input. 

- Silent data loss. 

- Accidental date/time format changes. 

## Almost never do 

- Deserialize untrusted data into arbitrary object graphs. 

- Use Java native serialization for untrusted data. 

- Treat serialization failures as business success. 

- Let serialization libraries define domain shape. 

## 41. Equality, Hashing, and Ordering 

## Recommendation 

Equality must match business meaning. 

## Always do 

- Implement equals and hashCode consistently. 

- Use records when structural equality is desired. 

- Be careful with mutable fields in equality. 

- Define ordering explicitly when sorting. 

- Test equality for important value objects. 

## Prefer 

- Value objects with structural equality. 

- Entities with identity-based equality when appropriate. 

- Comparators with clear business names. 

- Stable ordering for deterministic output. 

## Avoid 

- Equality based on mutable fields. 

- Comparing strings with ==. 

- Inconsistent compareTo and equals. 

- Accidental ordering from hash-based collections. 

## Almost never do 

- Use database IDs as equality before persistence if identity is not assigned yet and behavior becomes inconsistent. 

- Put mutable objects in hash-based collections and then mutate equality fields. 

- Leave equality ambiguous in important domain objects. 

## 42. LLM-Specific Anti-Patterns 

## Recommendation 

The implementation LLM must actively avoid common generated-code failure modes. 

## Always do 

- Prefer explicit, boring, testable code. 

- Verify with commands. 

- Add evidence. 

- Keep architecture boundaries. 

- Refactor generated complexity. 

- Remove unused abstractions. 

- Remove unused code. 

- Keep scope limited to the phase. 

## Avoid 

- Creating impressive-looking but unused abstractions. 

- Adding unnecessary patterns. 

- Adding fake extensibility. 

- Creating interfaces for everything. 

- Writing broad catch-all code. 

- Producing tests that only mirror implementation. 

- Producing huge files. 

- Creating generic helpers instead of modeling the domain. 

- Saying “production-ready” without evidence. 

## Almost never do 

- Invent architecture not present in architecture.md. 

- Skip tests because the code “seems simple.” 

- Add dependencies to compensate for unclear design. 

- Hide uncertainty. 

- Leave broken commands undocumented. 

- Create placeholder code and call it complete. 

- Return the final message before PHASE-RESULT.md exists. 

## 43. Recommended Tooling Matrix 

The project does not need every tool immediately, but each phase must use the tools already configured and document missing tools where relevant. 

|Quality Area|Recommended Tool|
|---|---|
|Formatting|google-java-format|
|Style|Checkstyle|
|Static bug detection|SpotBugs|
|Compile-time bug detection|Error Prone|
|Complexity/design|PMD|
|Architecture boundaries|ArchUnit|
|Unit tests|JUnit Platform/JUnit Jupiter|
|Assertions|AssertJ|
|Mocking|Mockito|
|Coverage|JaCoCo|



|Quality Area|Recommended Tool|
|---|---|
|Mutation testing|PIT|
|Integration tests|Testcontainers|
|HTTP contract tests|WireMock or MockWebServer|
|Dependency security|OWASP Dependency-Check|
|Build dependency convergence|Maven Enforcer or Gradle|
||equivalent|



## Recommendation 

Use fewer tools well rather than many tools badly. 

A tool only counts as a quality gate if it is run and its result is documented. 

## 44. Architecture Test Examples 

When the project has layered or hexagonal architecture, add ArchUnit tests where practical. 

## Example rules to enforce 

- Domain must not depend on infrastructure. 

- Domain must not depend on API/controllers. 

- Application must not depend on API/controllers. 

- Controllers must not access repositories directly. 

- Infrastructure must not be imported by domain. 

- No cycles between feature packages. 

- regulatory version packages must not depend on newer versions unless explicitly allowed. 

## Example intent 

Domain code must remain framework-independent. Application code may depend on domain and ports. Infrastructure code may implement application ports. API code may call application use cases. 

## Recommendation 

Architecture rules should be tested like business rules. 

If architecture is important enough to document, it is important enough to verify. 

## 45. Regression Tests 

## Recommendation 

Every fixed bug must create or update a regression test. 

## Always do 

- Add a test that fails before the fix. 

- Keep the regression test focused. 

- Name the test after the behavior. 

- Include edge cases related to the bug. 

- Document the regression in PHASE-RESULT.md. 

## Prefer 

- One regression test per bug behavior. 

- Golden regression fixtures for payload bugs. 

- Contract regression tests for external integration bugs. 

- Mutation testing after fixing critical logic. 

## Avoid 

- Fixing bugs without tests. 

- Tests that only check implementation details. 

- Broad tests that obscure the original bug. 

- Removing regression tests during refactor. 

## Almost never do 

- Close a legal/regulatory bug without a regression test. 

- Claim a bug is fixed because manual inspection says so. 

- Depend only on manual reproduction steps. 

## 46. Definition of Done 

A Java phase is done only when all applicable items are true. 

## Required 

- Code compiles. 

- Tests pass. 

- Meaningful tests were added or updated. 

- Build commands were run. 

- Quality commands were run or documented as unavailable. 

- Architecture boundaries were preserved. 

- Business rules are in domain/application modules. 

- Controllers are thin. 

- Repositories do not contain business decisions. 

- External clients are isolated. 

- Errors are handled explicitly. 

- Logs are safe. 

- Auditability exists where required. 

- Complexity is within limits or justified. 

- No secrets were introduced. 

- Dependencies are justified. 

- PHASE-RESULT.md exists. 

## For critical/regulatory code 

Also required: 

- Golden tests. 

- Contract tests. 

- Schema validation tests where applicable. 

- Version-aware layout handling. 

- Rejection/error tests. 

- Audit/traceability tests. 

- Redaction behavior. 

- Regression tests for fixed behavior. 

## 47. PHASE-RESULT.md Required Template 

At the end of the phase, create PHASE-RESULT.md with this structure: 

# PHASE RESULT 

## What was implemented 

## Files created or changed 

## What tests were added 

## Business rules covered by tests 

## Commands run 

## Commands passed 

## Commands failed 

## Coverage results 

## Mutation testing results 

## Static analysis results 

## Architecture boundary checks 

## Security/dependency audit results 

## Performance considerations 

## Logging/audit/traceability evidence 

## Regulatory evidence, if applicable 

## Known limitations 

## Deviations from architecture.md 

## Quality score: X/100 

## Evidence for score 

## Remaining work required to reach 100/100 

## Evidence rule 

The score must be supported by command results, tests, and documented checks. Do not assign high scores based on confidence, appearance, or subjective judgment. 

## 48. Quality Score Model 

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
|regulatory payloads without golden/contract/schema tests|70|
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

- PHASE-RESULT.md contains evidence 

## 49. Caveman Quality Review 

At the end of review, include a short simple evaluation. 

Use this style: 

## Caveman Review 

## Score: 82/100 

Good: 

- Code works. 

- Tests cover main rules. 

- Architecture mostly clean. 

## Bad: 

- Mutation testing not run. 

- One adapter has too much logic. 

- Error messages need improvement. 

Fix to reach 100: 

- Add mutation test evidence. 

- Move adapter rule to application service. 

- Add rejection-path tests. 

The Caveman Review must be simple, direct, and evidence-based. 

## 50. Final Checklist 

Before sending the final implementation message, verify: 

- ☐Code compiles. 

- ☐Tests pass. 

- ☐Tests are meaningful. 

- ☐Coverage was measured or documented as unavailable. 

- ☐Mutation testing was run for critical rules or documented as unavailable. 

- ☐Static analysis was run or documented as unavailable. 

- ☐Security/dependency audit was run or documented as unavailable. 

- ☐Architecture boundaries were preserved. 

- ☐Business rules are not in controllers. 

- ☐Business rules are not in repositories. 

- ☐Business rules are not in API DTOs. 

- ☐Business rules are not in XML builders. 

- ☐Business rules are not in integration clients. 

- ☐Complexity is within limits or justified. 

- ☐No broad suppressions were added. 

- ☐No secrets were committed. 

- ☐Logs are safe. 

- ☐Auditability exists where required. 

- ☐regulatory code has stricter evidence where applicable. 

- ☐ PHASE-RESULT.md exists. 

- ☐Quality score is evidence-based. 

- ☐Remaining work to reach 100/100 is documented. 

Only after this checklist is satisfied may the implementation LLM respond exactly: 

I finished the implementation 

