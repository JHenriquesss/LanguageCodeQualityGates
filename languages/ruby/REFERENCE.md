# Ruby Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the Ruby language quality gate for implementation work. Its purpose is to
prevent low-quality Ruby code from being generated, accepted, copied into a project, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

Ruby gives teams expressive syntax, powerful metaprogramming, blocks, a huge gem ecosystem, fast
iteration, and mature web and testing tools. Ruby code can still be poor software. Ruby code can
still be architecturally wrong, dynamically fragile, `nil`-prone, exception-hostile, monkey-patch
heavy, metaprogramming-opaque, thread-unsafe, dependency-heavy, supply-chain risky, insecure by
default, hard to maintain, and business-incorrect even when it loads and the tests pass.

The implementation is complete only when the code runs on the project Ruby version, passes RuboCop
(style + lint + security + complexity), passes meaningful tests, preserves architectural boundaries,
validates untrusted input, models errors explicitly, controls metaprogramming and dependencies, is
secure by default, is auditable where required, and records measurable evidence in `PHASE-RESULT.md`.

Follow this together with project rules: `AGENTS.md`, `PHASE-PLAN*.md`, `architecture.md`,
`.rubocop.yml`, `Gemfile`, and CI workflow definitions. If this file conflicts with a phase-specific
rule, follow the stricter rule unless the deviation is documented in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary of the whole gate. Everything below it is rationale and
detail. At the end of any implementation, verify every item here. If time or context is limited,
obey this core and consult the numbered sections only when a check trips or needs detail.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Code loads and runs under the project Ruby version: `bundle install` clean, `ruby -c` on changed files.
2. RuboCop style/format passes: `bundle exec rubocop` (no offenses).
3. RuboCop lint + Security cops pass; new offenses fixed or justified with narrow inline disables.
4. Tests pass and are meaningful for changed behavior, including failure paths: `bundle exec rspec` (or `rake test`).
5. Coverage meets the risk tier (SimpleCov; see Default thresholds).
6. Complexity within limits (RuboCop Metrics; see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, model callbacks, serializers, and views.
8. Every untrusted boundary validated before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors raised/handled explicitly at the right layer; no swallowed `rescue`.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly disable RuboCop (`rubocop:disable all`, large disabled blocks) to pass.
- `eval`/`instance_eval`/`send` on untrusted input; `Marshal.load`/`YAML.load` on untrusted data; `Kernel#open`/`URI.open` with untrusted input.
- Empty or swallowing `rescue`, `rescue Exception`, monkey-patching core classes, or hiding business rules in `method_missing`/metaprogramming.

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and the review to its tier. Do not apply critical-tier rigor
to a throwaway script; do not ship business rules with only low-tier checks. When planning, list
which checks apply and state any intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (helpers, simple value objects, internal refactors, throwaway scripts): load, rubocop, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters, API endpoints): add failure-path tests, boundary validation, integration, coverage. Add MUST 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, legal/financial/compliance, audit, data integrity): add golden/contract tests, error/rejection paths, audit/traceability, concurrency/thread-safety tests, mutation tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

The implementation must not declare the phase complete merely because Ruby code was written. A phase
is complete only when the planned implementation exists, relevant automated tests exist, the code
loads, RuboCop ran, tests ran, applicable quality gates ran, failures were fixed or documented,
`PHASE-RESULT.md` was created, and the quality score is supported by evidence.

- Evidence must come from the exact repository state handed off, not a scratch directory or stale branch.
- A passing `rspec` alone is not enough when the phase changed gems, public API, persistence, serialization, concurrency, security behavior, or metaprogramming.
- Any skipped command must include the concrete blocker, not "tool unavailable".
- "It loads" / "the console works" is weak evidence; dynamic Ruby hides contract, type, and error-path problems until runtime.

## 2. Ruby Version, Bundler, and Gemfile Policy

Use the Ruby version and gem set defined by the project. Ruby behavior, syntax, standard-library
APIs, and gem compatibility vary by version.

- Always: use the version in `.ruby-version`/`.tool-versions`/`Gemfile`; document the exact `ruby --version`; keep local and CI Ruby aligned; run inside Bundler (`bundle exec`).
- Prefer: a current maintained Ruby; a narrow supported-version range for libraries; `rbenv`/`asdf`/`chruby`/containers for reproducible interpreter selection.
- Avoid: relying on the system Ruby; using syntax newer than the project minimum; depending on JRuby/TruffleRuby behavior unless the project targets them.
- Almost never: raise the minimum Ruby version without documenting impact; use a preview Ruby in production code without a documented reason.

## 3. Bundler and Gemfile.lock Reproducibility

The build must be reproducible from a clean checkout using documented commands.

- Always: commit `Gemfile` and `Gemfile.lock`; keep gem versions intentional; run `bundle install`/`bundle exec`; pin or rely on the lock for applications; run security checks after dependency changes.
- Prefer: `bundle install --frozen` (or `bundle config set frozen true`) in CI; small dependency diffs; the standard library before adding a gem for a trivial helper; grouped dependencies (`:development`, `:test`).
- Avoid: deleting `Gemfile.lock` to make resolution pass; floating versions without policy; gems with unclear ownership/maintenance; vendoring without an update policy.
- Almost never: commit credentials in gem sources; add gems with native extensions or install hooks without review; accept a vulnerable transitive gem without a documented compensating control.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`. A command not run is not
evidence; a command that failed and was ignored is negative evidence.

Baseline:

```bash
ruby --version
bundle install
bundle exec rubocop
bundle exec rspec            # or bundle exec rake test
```

Stronger (applications/services/critical code):

```bash
COVERAGE=1 bundle exec rspec        # SimpleCov enforces the floor
bundle exec bundler-audit check --update
bundle exec brakeman                # Rails apps (SAST)
bundle exec srb tc                  # if Sorbet typing is used
bundle exec mutant run ...          # mutation testing for critical rules, where configured
```

Record commands run / passed / failed (with reason, impact, required fix) and commands not run (with
blocker, impact, follow-up).

## 5. Formatting, Style, and RuboCop

RuboCop is the single tool for formatting, style, lint, security, and complexity. Do not debate
formatting manually.

- Always: run `bundle exec rubocop`; keep `.rubocop.yml` intentional; fix offenses or use narrow, justified inline disables (`# rubocop:disable Cop/Name` with a reason, re-enabled right after).
- Prefer: `rubocop -a` (safe autocorrect) reviewed before commit; `rubocop-performance` and `rubocop-rspec` where useful; a consistent string-literal and hash-syntax policy via config, not taste; `standardrb` only if the project standardizes on it.
- Avoid: blanket `rubocop:disable` blocks; disabling whole departments to finish a phase; `# rubocop:todo` left permanently; reformatting unrelated files.
- Almost never: `rubocop:disable all`; disabling Security or Lint cops in critical code; treating RuboCop output as cosmetic when it flags real risk (unused variables, shadowed methods, ambiguous blocks).

## 6. Static Analysis and Optional Typing

RuboCop's Lint and Security departments are correctness signals. Ruby typing is optional and
gradual; use it as a design tool where the project adopts it.

- Always: treat Lint offenses (unreachable code, shadowed variables, useless assignments, ambiguous operators) as real findings; validate untrusted input at runtime regardless of types.
- Prefer: Sorbet (`sig`, `srb tc`) or RBS + Steep where the project uses them; `# typed: true`/`strict` for critical files; type signatures for public library APIs.
- Avoid: `T.unsafe`/`T.untyped` to silence the type checker without a reason; treating type signatures as runtime validation.
- Almost never: claim high quality for complex dynamic data flow with no tests and no typing; disable the type checker globally to finish a phase.

## 7. Naming

Names must reveal intent. A maintainer should understand a class, module, method, or test without
reading the full implementation.

- Always: use domain language; snake_case for methods/variables, CamelCase for classes/modules, SCREAMING_SNAKE_CASE for constants; predicate methods end in `?`, dangerous/mutating ones in `!`; name tests by behavior.
- Prefer: `EmployeeExposurePeriod` over `PeriodData`; `validate_event_version` over `process_version`; `RawPayload`/`ValidatedPayload` to distinguish trust state.
- Avoid: `Helper`, `Util`, `Manager`, `Processor`, `Handler`, `Data`, `Base`, `*Service` as a dumping ground; single-letter names outside tiny blocks; names that mimic database tables or transport payloads.
- Almost never: placeholder names in production code; letting generated or ORM names define domain vocabulary.

## 8. Files, Modules, Namespaces, and Architecture Structure

Structure must reflect architecture, not random grouping; one class/module per file matching its
path, namespaced under the project.

- Always: keep domain logic separate from infrastructure; keep application/use-case orchestration separate from adapters; keep API/transport models separate from domain models; keep external clients out of the domain.
- Prefer: a clear layout (e.g. `app/domain`, `app/application`, `app/infrastructure`, `app/api`), `lib/` for reusable code, `spec/` mirroring source.
- Avoid: one giant file/module; a `lib/utils.rb` grab-bag; domain code requiring Rails, ActiveRecord, HTTP clients, or loggers; circular requires.
- Almost never: business rules in controllers, model callbacks, serializers, views, rake tasks, or initializers; a `Common`/`Shared` module that becomes a dumping ground.

## 9. Architectural Boundaries

Business rules must be explicit, isolated, and tested.

- Always: keep dependency direction inward; put business rules in domain/application objects; put side effects in adapters; keep controllers/jobs thin; test boundary mappers; keep framework types out of the domain.
- Prefer: plain Ruby objects (PORO) for domain logic; service/use-case objects for orchestration; ports (duck-typed interfaces) for persistence, clock, signing, storage, external APIs; explicit mappers between DTOs and domain types.
- Avoid: controllers calling the ORM for business workflows; infrastructure deciding domain outcomes; ORM records reused as API responses; business rules hidden in callbacks or concerns.
- Almost never: hide business decisions in SQL, callbacks, or serialization; make domain correctness depend on a web framework; put audit/legal decisions in logging side effects.

## 10. Domain Modeling and Data Structures

Use objects and value objects to make invalid states hard to represent. Do not pass hashes, strings,
booleans, or raw primitives where a meaningful domain type belongs.

- Always: validate invariants at construction; keep required values required; model closed sets with frozen constants, enums, or small classes; distinguish raw input from validated state.
- Prefer: immutable value objects (e.g. `Data.define`, frozen structs, or plain classes with readers); `Comparable`/value semantics where appropriate; factory methods that return a valid object or raise/return a meaningful error.
- Avoid: `Hash` (`{}`) and `OpenStruct` as domain models; boolean flags that change behavior; primitive obsession for money, dates, identifiers, and legal codes.
- Almost never: represent legal/financial/audit state as arbitrary strings; assemble domain objects through a long sequence of setters; use `OpenStruct` in hot or critical paths.

## 11. `nil` and Absence Semantics

Use `nil` only when absence is legitimate, explicit, and tested. `nil` is the most common source of
runtime errors in Ruby.

- Always: validate required values before constructing objects; distinguish missing, nil, empty, and zero when the contract cares; test nil/empty branches where behavior differs.
- Prefer: raising or returning a meaningful error when absence is exceptional; safe navigation (`&.`) only where nil is expected; `fetch` over `[]` when a missing key is an error; sensible defaults via `fetch(key, default)`.
- Avoid: returning `nil` for failure when callers need a reason; `value || default` when `false`/empty are valid; scattering `&.` to paper over unclear nil contracts.
- Almost never: use `nil` to represent multiple distinct business states; rely on `rescue NoMethodError` for control flow; let `nil` silently flow into persistence or external payloads.

## 12. Immutability, Freezing, and Mutation

Prefer immutable data and explicit mutation that preserves invariants.

- Always: freeze constants (especially mutable literals assigned to constants); avoid exposing mutable internal collections; make mutation methods explicit (`!`); keep mutation local.
- Prefer: `Data.define` / frozen value objects; returning new objects over in-place mutation in domain code; `dup`/`clone` at boundaries when ownership is unclear; `# frozen_string_literal: true` where the project adopts it.
- Avoid: mutating arguments passed by callers; returning internal arrays/hashes that callers can mutate; global mutable state (`$globals`, mutable class variables `@@`).
- Almost never: monkey-patch core classes to add mutable state; rely on object identity where value semantics would be clearer; mutate objects used as hash keys.

## 13. Error Handling and Exceptions

Ruby uses exceptions. Make them explicit, meaningful, and tested; distinguish programmer bugs,
validation failures, domain rejections, and infrastructure failures.

- Always: raise specific exception classes (subclass `StandardError`); preserve cause when re-raising (`raise NewError, msg` inside a `rescue` keeps `$!` as cause); rescue the narrowest class you can handle; test failure paths.
- Prefer: a small domain exception hierarchy; result objects for expected business outcomes where they clarify flow; `ensure` for cleanup; error codes for auditable/legal failures; mapping infrastructure errors to safe application/API errors at the boundary.
- Avoid: `rescue => e; end` (swallowing); `rescue nil`; rescuing and returning fake success; logging-and-re-raising at every layer; using exceptions for ordinary control flow in hot paths.
- Almost never: `rescue Exception` (catches `SignalException`, `NoMemoryError`, etc.); swallow security/persistence/signing failures; leak stack traces, SQL, tokens, or payloads to external clients.

## 14. `raise`, `exit`, `abort`, TODO, and Debug Policy

Production Ruby must not rely on stray exits or debug leftovers.

- Always: remove `TODO`/`FIXME` placeholders, `binding.pry`, `binding.irb`, `byebug`, `debugger`, `puts`/`p` debugging, and `pp` dumps before completion; raise meaningful errors instead of bare `raise "msg"`.
- Prefer: guard clauses; `raise SpecificError` over `raise RuntimeError`; `Kernel#exit`/`abort` only in CLI/entrypoint code, never in libraries.
- Avoid: `exit!`/`abort` in reusable code; `raise` after parsing external input when the caller can recover; `at_exit` for business-critical cleanup.
- Almost never: leave `binding.pry`/`debugger` in committed code; call `exit` from a library, job, or request path.

## 15. Metaprogramming, `method_missing`, and Monkey-Patching

Metaprogramming is powerful and opaque. Use it only when ordinary methods are clearly worse, and
keep it visible and tested.

- Always: prefer plain methods and composition first; if `method_missing` is used, implement `respond_to_missing?` and constrain it tightly; test generated behavior; keep refinements/monkey-patches isolated and documented.
- Prefer: `define_method` with a clear, bounded set; refinements over global monkey-patching when extending core classes; explicit `attr_reader`/delegation over dynamic accessors.
- Avoid: hiding business rules in `method_missing`, `const_missing`, or dynamic dispatch; `send`/`public_send` with method names derived from untrusted input; reopening core classes (`String`, `Hash`, `Object`) to add behavior.
- Almost never: monkey-patch standard-library or gem internals to change behavior; build legal/financial logic through metaprogramming that maintainers cannot follow; use `eval` to construct code.

## 16. Blocks, Procs, and Enumerables

Use the clearest enumerable construct, not the cleverest. Blocks can hide side effects and error
handling.

- Always: keep blocks short; make ordering explicit when output order matters; avoid hidden side effects (persistence, network) inside `map`/`each`/`reduce`.
- Prefer: `map`/`select`/`reduce`/`each_with_object` for clear transformations; lazy enumerators for large/streamed data; plain loops for complex branching or error handling; `sum`, `min_by`, `group_by` where they clarify intent.
- Avoid: long `reduce`/`inject` chains that obscure logic; mutating a collection while iterating; `each` used only for side effects when a clearer method exists.
- Almost never: perform network/DB/signing side effects inside enumerable blocks; depend on `Hash` iteration order as a contract beyond documented insertion order; load an entire large dataset into memory to simplify code.

## 17. Concurrency and Thread Safety

Concurrency must be explicit, bounded, observable, and tested. The GVL prevents some races but not
logical races, deadlocks, lost updates, or unsafe shared state.

- Always: minimize shared mutable state; protect shared state with `Mutex`; set timeouts on blocking I/O; bound thread/connection pools; make repeated/async processing idempotent; test concurrent behavior.
- Prefer: immutable data shared across threads; `Queue`/`Concurrent::*` (concurrent-ruby) for safe structures; `Ractor` for true parallelism where applicable; thread pools over unbounded `Thread.new`; explicit shutdown/drain.
- Avoid: global mutable state across threads; holding a `Mutex` across slow I/O; unbounded thread creation per request; sharing non-thread-safe clients/connections without review.
- Almost never: fix races with `sleep`; spawn detached threads that fail silently; run legal/financial/audit workflows on unsupervised background threads.

## 18. Resource Management

Files, sockets, connections, and locks must have explicit ownership and cleanup.

- Always: use block forms that auto-close (`File.open(...) { ... }`, `db.transaction { ... }`); use `ensure` for cleanup on the non-block path; set network/subprocess timeouts; bound memory for large inputs.
- Prefer: connection pools with explicit lifecycle; streaming for large files; `Tempfile` with cleanup; `IO`/`Net::HTTP` with read/open timeouts.
- Avoid: opening files/connections without closing; reading huge untrusted inputs into memory; leaking subprocess output; relying on GC/finalizers for cleanup.
- Almost never: depend on object finalization for file/network/lock correctness; leave transaction commit/rollback outcomes unhandled.

## 19. Serialization and Deserialization

Serialization is a boundary concern and a security boundary. Do not let payloads define the domain
model, and never deserialize untrusted data unsafely.

- Always: use DTOs/explicit mappers at boundaries; validate decoded data before domain use; treat unknown/missing fields deliberately; test encode and decode, including malformed input.
- Prefer: `JSON.parse` for interchange; `YAML.safe_load` for YAML; explicit `to_h`/`as_json` for output; golden tests for stable payloads; schema validation where applicable.
- Avoid: `Marshal.load`, `YAML.load` (unsafe), or `JSON.load` on untrusted data; using ORM/records as API DTOs by default; silent defaults for required business fields.
- Almost never: unmarshal/`YAML.load` untrusted input (remote code execution risk); treat deserialization success as business validation; generate legal/financial payloads without golden/contract tests.

## 20. Date, Time, Time Zones, and Clock

Date/time bugs are business bugs. Use explicit types and freeze time in tests.

- Always: use timezone-aware times for instants; define a timezone policy; distinguish date-only from timestamp; inject a clock when current time affects behavior; test boundary dates.
- Prefer: `Time`/`DateTime` with explicit zone (or Rails `Time.zone`); UTC internally; ISO-8601 at boundaries; tests for end-of-month, leap year, DST, and invalid ranges.
- Avoid: `Time.now`/`Date.today` directly in domain logic; comparing dates as strings; relying on the machine's local timezone; re-parsing date strings throughout business rules.
- Almost never: use local machine time as business truth; ignore timezone requirements in legal/financial workflows; make tests depend on today's date.

## 21. Money, Decimals, and Numeric Rules

Use exact, domain-appropriate numeric types.

- Always: use `BigDecimal` (or integer minor units, or a money gem) for money and precise decimals; define rounding and scale explicitly; test boundary, zero, negative, and maximum values.
- Prefer: value objects for money/percentages/measurements; constants named for business meaning; names that include units (`amount_cents`, `duration_days`).
- Avoid: `Float` for money/legal/financial calculations; hidden unit conversion; magic numbers scattered through code; comparing floats directly.
- Almost never: round legal/payroll/financial values without tests; mix units in one field; use binary floating point for auditable calculations.

## 22. Security Baseline

Security is a quality requirement. Treat all external input as untrusted.

- Always: validate and sanitize input; use parameterized queries / ORM bindings; authorize at the application/domain boundary; keep secrets out of code, logs, and fixtures; use `SecureRandom` for tokens; verify TLS.
- Prefer: strong parameters / allowlists for mass assignment; safe command execution (`system([...])` array form, no shell) ; `URI`/host allowlists for outbound requests; `OpenSSL`/audited gems for crypto; Brakeman for Rails SAST.
- Avoid: `eval`/`instance_eval`/`class_eval` on input; string-interpolated SQL/shell; `system("... #{input}")`; `Kernel#open`/`URI.open` with untrusted input (pipe/SSRF); `Marshal`/unsafe `YAML` on untrusted data; logging secrets or raw sensitive payloads.
- Almost never: implement custom crypto; disable TLS verification to make tests pass; store credentials/keys in source control; use MD5/SHA-1 for security-sensitive hashing; accept Brakeman/audit findings in critical code without review.

## 23. Supply Chain, Gems, Vulnerabilities, and Licenses

Every gem is a liability until justified; dependency decisions are security decisions.

- Always: review new gems before adding (maintenance, license, native extensions, install hooks, transitive size); run `bundler-audit` after dependency changes; keep `Gemfile.lock` intentional; review license compatibility.
- Prefer: standard library for trivial helpers; mature, maintained gems; minimal dependency graph; small, regular updates over rare massive ones; `bundler-audit`, Dependabot/Renovate where configured.
- Avoid: gems with unclear ownership or suspicious recent transfers; duplicate gems solving the same problem; broad `bundle update` unrelated to the phase; gems with surprising postinstall behavior.
- Almost never: ignore a critical advisory because it is transitive; add an abandoned security-critical gem without an exit plan; commit gem-source credentials.

## 24. Configuration and Secrets

Configuration must be explicit, validated, and separated from secrets.

- Always: validate required config at startup and fail fast; keep secrets out of source, logs, and error messages; document required environment variables; test config loading.
- Prefer: a single typed config object/module at the composition root; encrypted credentials (`Rails.application.credentials`) or a secret manager; environment-specific config; redacted `inspect` for secret-bearing objects.
- Avoid: reading `ENV` scattered through domain code; silent fallback to insecure defaults; committed `.env` files with real secrets; passing secrets via CLI args.
- Almost never: hardcode credentials/keys/tokens; default production security features to disabled; let tests depend on developer-specific env without fixtures.

## 25. Logging, Observability, and Auditability

Logs are operational evidence, not decoration.

- Always: use the project logger (not `puts`); include useful context; never log secrets, tokens, keys, or raw sensitive payloads; make background-job failures observable; keep audit trails separate from debug logs when audit is required.
- Prefer: structured logging; stable event names; correlation/request IDs; domain identifiers instead of raw payloads; redaction utilities; clear levels (error/warn/info/debug).
- Avoid: `puts`/`p` in production code; logging full request bodies or payloads; duplicate noisy logging; vague messages like "error".
- Almost never: log sensitive data unredacted; use logs as the only audit trail; hide a failure because it was logged.

## 26. Web Framework and Persistence Boundaries

Rails, Sinatra, Hanami, ActiveRecord, Sequel, and ROM are infrastructure. Keep business rules out of
them.

- Always: keep controllers/actions thin (parse, authorize, call use case, render); validate boundary input; keep persistence in repositories/adapters; use migrations; test custom queries and mappings; handle N+1 deliberately.
- Prefer: PORO domain objects mapped to/from records; query objects/repositories with business-named methods; strong parameters; serializers for output; transactions at the application boundary.
- Avoid: business rules in ActiveRecord callbacks/validations only; fat models that mix persistence and domain rules; exposing records directly as API responses; lazy-loading surprises across boundaries.
- Almost never: put legal/financial decisions in callbacks; run schema auto-migration in production without policy; make transactions span slow external calls without explicit design.

## 27. Testing Strategy

Tests must prove behavior, not just execute lines.

- Always: add/update tests for changed behavior; test failure paths and boundary cases; keep tests deterministic and independent; avoid real network/time/order dependence; use clear behavior-named tests.
- Prefer: RSpec or Minitest per project; unit tests for domain rules; integration tests for adapters; contract tests for external APIs (e.g. WebMock/VCR); golden tests for stable payloads; a fixed clock for time-dependent logic; property/mutation tests for critical rules.
- Avoid: tests that only assert a stub was called; broad mocking of the unit under test; `sleep`-based synchronization; tests passing only in one timezone/order; assertion-free tests.
- Almost never: delete or skip tests to make a phase pass; rely only on happy-path tests; depend on live production credentials or services.

## 28. Test Types Required by Risk

This ladder is the planning selector. Classify the change, then include exactly this evidence.

### Low-risk
Examples: helpers, simple value objects, internal non-critical refactors, throwaway scripts.
Required: load (`ruby -c`), RuboCop, basic behavior tests.

### Medium-risk
Examples: application services, validation, persistence/external adapters, API endpoints.
Required: unit tests, failure-path tests, boundary/input validation tests, integration at seams, coverage.

### High-risk
Examples: core business rules, state machines, authorization, money/time logic.
Required: the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits.

### Critical-risk
Examples: security, signing/crypto, legal/financial/compliance, audit, data integrity.
Required: the above plus golden/contract tests, error/rejection-path tests, audit/traceability tests, concurrency/thread-safety tests, mutation tests where available, security/dependency audit.

## 29. Coverage and Mutation Testing

Coverage is necessary but not sufficient; mutation testing is stronger evidence for critical rules.

### Default thresholds

|Area|Line Coverage|Branch Coverage|Mutation Score|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical legal/financial/audit/security rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/route handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

- Measure with SimpleCov (`enable_coverage :branch`, `minimum_coverage`). Document shortfalls.
- Use `mutant` (mutation testing) for critical rule engines where configured; do not claim production-grade quality for critical rules without mutation evidence or documented readiness.
- Coverage by line alone is not proof; assertion quality matters more than raw percentage.

## 30. Complexity Limits

Complexity must be actively reduced. If a method, file, class, module, or dependency relationship
becomes hard to understand, refactor before declaring completion.

|Item|Target|Maximum|RuboCop cop|
|---|---|---|---|
|Method cyclomatic complexity|<= 8|<= 10|Metrics/CyclomaticComplexity|
|Method perceived/cognitive complexity|<= 10|<= 15|Metrics/PerceivedComplexity|
|Method length|<= 30 lines|<= 50 lines|Metrics/MethodLength|
|Class / module length|<= 300 lines|<= 500 lines|Metrics/ClassLength, Metrics/ModuleLength|
|Method parameters|<= 4|<= 6|Metrics/ParameterLists|
|Block / conditional nesting|<= 2|<= 3|Metrics/BlockNesting|
|File length|<= 400 lines|<= 600 lines|review (no default cop)|
|Public methods per class|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with an explicit reason.

## 31. Quality Score Model

Use this scoring model (0-100):

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Basic implementation with weak tests or unclear structure|
|61-75|Working implementation with meaningful tests and acceptable structure|
|76-90|Strong implementation with good tests, low complexity, and clean boundaries|
|91-100|Production-grade implementation with strong automated evidence, clear boundaries, strong error handling, and no known quality gaps|

### Score caps

Apply these caps unless there is a documented and justified exception.

|Missing or Failed Evidence|Maximum Score|
|---|---|
|Code does not load/run under the project Ruby version|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|RuboCop not run and not explained|65|
|Business rules without unit tests|60|
|Boundary validation missing for new untrusted input|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Concurrency code lacks thread-safety/failure tests where relevant|80|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit missing where applicable|85|
|Unsafe eval/deserialization or swallowed rescue in critical code|80|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass, tests are meaningful, critical paths are
covered, complexity is within limits, architecture is preserved, no known quality gaps remain, no
unexplained skipped gates exist, and `PHASE-RESULT.md` contains evidence.

## 32. Definition of Done

A Ruby phase is done only when: code loads; RuboCop passes (or offenses are documented); tests pass
and meaningful tests were added; coverage meets the risk tier; complexity is within limits or
justified; architecture boundaries are preserved; business rules are out of controllers/callbacks/
serializers; errors are handled explicitly; no secrets were introduced; dependencies are justified;
and `PHASE-RESULT.md` exists. For critical code, also: golden/contract tests, error/rejection tests,
audit/traceability, security/dependency audit, and mutation tests or documented readiness.

## 33. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Coverage results
## RuboCop results
## Security/dependency audit results
## Architecture boundary checks
## Concurrency/thread-safety evidence (if applicable)
## Logging/audit/traceability evidence
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results, tests, and documented checks — not by confidence or
appearance.

## 34. Final Checklist

Before sending the final message, verify: code loads; RuboCop ran; tests pass and are meaningful;
coverage measured or documented; complexity within limits; architecture preserved; business rules
not in controllers/callbacks/serializers; no swallowed rescues; no secrets committed; logs safe;
auditability where required; dependencies justified; `PHASE-RESULT.md` exists; quality score is
evidence-based; remaining work to reach 100 is documented.
