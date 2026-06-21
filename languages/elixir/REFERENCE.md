# Elixir Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the Elixir language quality gate for implementation work. Its purpose is to
prevent low-quality Elixir code from being generated, accepted, copied into a project, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

Elixir runs on the BEAM with immutable data, message-passing processes, and supervision. It is
dynamically typed, and its strengths (concurrency, "let it crash") become liabilities when processes
are unsupervised, error tuples are ignored, untrusted input is turned into atoms, or business logic
leaks into controllers. "It compiles" and "it ran once" are weak evidence.

The implementation is complete only when the code compiles warning-free, is formatted, passes Credo
and Dialyzer, has meaningful tests, models failures with tagged tuples and supervision, validates
untrusted input (never converting it to atoms or deserializing it unsafely), respects context
boundaries, is secure by default, and records measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult the numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Compiles clean under the project Elixir/OTP version: `mix compile --warnings-as-errors`; `mix deps.get` clean.
2. Formatting passes: `mix format --check-formatted`.
3. Static analysis passes: `mix credo --strict` and `mix dialyzer`; new findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `mix test`.
5. Coverage meets the risk tier (`mix test --cover` / excoveralls; see Default thresholds).
6. Complexity within limits (Credo; see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, templates/views, and Ecto schemas; context boundaries are respected.
8. Untrusted input validated before use; never converted to atoms; deserialized safely.
9. No secrets committed; sensitive data not logged.
10. Errors modeled with tagged tuples (`{:ok, _}`/`{:error, _}`) and handled (`with`/`case`); processes supervised; `@spec` on public functions; no swallowed errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Ignore compiler warnings (build with `--warnings-as-errors`); broadly disable Credo checks to pass.
- `String.to_atom`/`List.to_atom` on untrusted input (atom-table exhaustion DoS); `Code.eval_string`/`eval_quoted` on untrusted input; `:erlang.binary_to_term` on untrusted data without `:safe` (remote code execution).
- Spawn unsupervised processes for work that must not be lost; `rescue`/`catch` everything and swallow it; ignore an `{:error, _}` return; put business rules in controllers/templates; build SQL with interpolated fragments (use parameterized Ecto queries).

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. Untrusted-input, process/supervision,
and auth changes are never low tier. When planning, list which checks apply and state any
intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (pure functions, simple structs, internal refactors, throwaway scripts): compile warning-free, format, Credo, basic tests. MUST 1-4, 9-11.
- Medium (context functions, validation, persistence/external adapters, GenServers): add failure-path tests, input validation, Dialyzer, integration, coverage. Add MUST 3, 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic, supervision trees): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, process/crash tests. Add MUST 6.
- Critical (security, auth, crypto, payments, financial, audit, data integrity, distributed state): add golden/contract tests, error/rejection paths, audit/traceability, property tests, dependency/SAST audit, mutation tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code
compiles warning-free, formatting and static analysis ran, tests ran, applicable gates ran, failures
were fixed or documented, `PHASE-RESULT.md` was created, and the score is supported by evidence. A
passing `mix test` alone is not enough when the phase changed dependencies, public API, persistence,
serialization, supervision/process behavior, or security behavior. Any skipped command must include
the concrete blocker.

## 2. Toolchain: Elixir, OTP, and Mix

Use the Elixir and Erlang/OTP versions and the Mix configuration defined by the project.

- Always: use the project Elixir/OTP versions (`.tool-versions`/CI/Docker); document `elixir --version`; build with `mix compile --warnings-as-errors`; keep local and CI commands aligned.
- Prefer: a current supported Elixir/OTP pair; `mix` aliases for the gate; explicit application configuration; releases (`mix release`) for deployment.
- Avoid: relying on whatever Elixir is installed; using features newer than the project minimum; ignoring deprecation warnings.
- Almost never: raise the minimum Elixir/OTP version without documenting impact; disable `--warnings-as-errors` to finish; depend on undocumented behavior of a dependency's internals.

## 3. Dependencies and Reproducibility

The build must be reproducible from a clean checkout using documented Mix commands.

- Always: commit `mix.exs` and `mix.lock`; run `mix deps.get` (the lock pins versions); keep dependency versions intentional; run `mix deps.audit` after dependency changes; scope dev/test-only deps with `only:` and `runtime: false`.
- Prefer: a minimal dependency graph; the standard library and OTP before adding a hex package for a trivial helper; `mix hex.audit` for retired packages.
- Avoid: loose version requirements without policy; git dependencies without a pinned ref; packages with unclear ownership/maintenance.
- Almost never: delete `mix.lock` to make resolution pass; add a dependency with compile-time code execution without review; accept a vulnerable transitive dependency without a documented compensating control.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
elixir --version
mix deps.get
mix compile --warnings-as-errors
mix format --check-formatted
mix credo --strict
mix test
```

Stronger (applications/critical code): `mix dialyzer` (success-typing analysis), `mix test --cover`
(or `mix coveralls`), `mix deps.audit` (mix_audit), `mix sobelow` for Phoenix apps (SAST), and a
property-testing run (StreamData) or mutation testing (`muzak`) for critical rules. A command not run
is not evidence; a command that failed and was ignored is negative evidence.

## 5. Formatting

The Elixir formatter is built in and authoritative; do not debate formatting.

- Always: run `mix format --check-formatted` in CI; keep `.formatter.exs` intentional; format new and changed files.
- Prefer: the default formatter with a project line length; consistent import/alias ordering via Credo.
- Avoid: hand-formatting against the formatter; reformatting unrelated files.
- Almost never: skip the format check; leave `IO.inspect`/`IO.puts` debug output or `dbg/0` in production code.

## 6. Static Analysis: Credo and Dialyzer

Credo enforces style, readability, and complexity; Dialyzer finds type and contract errors via
success typing. Both are gates, not suggestions.

- Always: run `mix credo --strict`; run `mix dialyzer` where types/specs matter; add `@spec` to public functions; fix findings or justify them narrowly (a scoped `# credo:disable-for-next-line` with a reason).
- Prefer: `@spec`/`@type` on public APIs and complex data; building and caching the Dialyzer PLT in CI; Credo's refactoring checks for complexity and nesting.
- Avoid: broad Credo disables; ignoring Dialyzer warnings about impossible patterns or contract mismatches; `@spec` that lies about behavior.
- Almost never: disable Credo/Dialyzer to pass; ship security/persistence/money code without specs and analysis; suppress a Dialyzer error without understanding it.

## 7. Naming, Modules, and Contexts

Names must reveal intent; modules and contexts reflect architecture.

- Always: use domain language; module names in CamelCase mapping to file paths; functions/atoms in snake_case; group related functionality into well-named contexts that expose a clear public API.
- Prefer: a context per bounded area (e.g. `Accounts`, `Billing`) hiding its schemas and internals; small modules; `@moduledoc`/`@doc` on public modules and functions; behaviours for swappable adapters.
- Avoid: `Helpers`/`Utils`/`Common`/`Manager` grab-bag modules; god modules; leaking a context's schemas/Repo across context boundaries; one module reaching into another context's internals.
- Almost never: business rules in controllers, templates/LiveViews, or Ecto schema callbacks; cross-context calls that bypass the public context API.

## 8. Architectural Boundaries

Business rules must be explicit, isolated, and testable without the web layer.

- Always: keep dependency direction inward; put business rules in contexts/domain modules; keep side effects in adapters; keep controllers/LiveViews/channels thin (validate, call context, render); test contexts without booting the endpoint.
- Prefer: pure functions for domain logic; context modules as the public API; behaviours/ports for repositories, clocks, mailers, and external APIs; explicit structs/DTOs at boundaries.
- Avoid: controllers calling `Repo` directly for business workflows; business rules in schema `changeset`s beyond validation; provider payloads leaking into core logic; cross-context schema sharing.
- Almost never: hide business decisions in Ecto queries, templates, or process callbacks; make domain correctness depend on the web framework; put audit decisions in logging side effects.

## 9. Data Modeling and Typespecs

Model data with structs and typespecs so intent is explicit and Dialyzer can help.

- Always: use structs (`defstruct` + `@enforce_keys`) for domain data; add `@type t` and `@spec`; validate invariants in a constructor function returning `{:ok, t} | {:error, reason}`; use atoms from a known, finite set for closed states.
- Prefer: opaque types (`@opaque`) where invariants must be protected; pattern matching on tagged tuples; small modules per concept.
- Avoid: bare maps as domain models where a struct fits; boolean flags that change behavior; representing important state as free-form strings; `nil`-filled structs that may be invalid.
- Almost never: build domain objects from untrusted maps without validation; use comments to describe invariants a constructor could enforce.

```elixir
defmodule EmployeeId do
  @enforce_keys [:value]
  defstruct [:value]
  @type t :: %__MODULE__{value: String.t()}

  # Construction validates the invariant and returns a tagged result.
  @spec new(String.t()) :: {:ok, t()} | {:error, :invalid}
  def new(value) when is_binary(value) do
    if Regex.match?(~r/^\d{8}$/, value),
      do: {:ok, %__MODULE__{value: value}},
      else: {:error, :invalid}
  end
end
```

## 10. Pattern Matching, Tagged Tuples, and `with`

Model success and failure as data; let the happy path read top-to-bottom and errors short-circuit.

- Always: return `{:ok, value}` / `{:error, reason}` from fallible functions; handle both with `case`/`with`; match expected shapes and let unexpected ones fail; use guards for input constraints.
- Prefer: `with` for chained fallible steps; specific error reasons (atoms or structs) over generic strings; a bang variant (`fetch!/1`) only where the caller wants a crash on absence.
- Avoid: ignoring an `{:error, _}` return; matching only `{:ok, _}` and letting an error crash unexpectedly; deeply nested `case`; returning bare `nil`/`false` where a reason matters.
- Almost never: `rescue`/`catch` broadly to convert all failures to success; swallow security/persistence/payment errors; pattern-match in a way that silently drops error branches.

```elixir
@spec send_event(map()) :: {:ok, Receipt.t()} | {:error, term()}
def send_event(payload) do
  # Each step returns {:ok, _} or {:error, reason}; the first error short-circuits.
  with {:ok, validated} <- validate(payload),
       {:ok, signed} <- sign(validated),
       {:ok, receipt} <- transmit(signed) do
    {:ok, receipt}
  end
end
```

## 11. Immutability and Transformations

Data is immutable; transformations produce new values.

- Always: build new data rather than expecting mutation; thread state explicitly (e.g. through `Enum.reduce`/`with`/pipelines); keep transformation functions pure.
- Prefer: the pipe operator for readable transformation chains; `Enum`/`Stream` for collections (`Stream` for large/lazy data); `Map.update`/`put_in`/`update_in` for nested updates.
- Avoid: hidden side effects inside `Enum.map`/`for`; relying on process dictionary (`Process.put`) for application state; long pipelines that obscure error handling.
- Almost never: use the process dictionary for business state; perform I/O (DB, network) inside a comprehension as a side effect; depend on map key ordering as a contract.

## 12. Atoms and Untrusted Input

Atoms are not garbage-collected; creating them from untrusted input can exhaust the atom table and
crash the node. This is a top Elixir-specific defect class.

- Always: validate and constrain untrusted input; convert external strings only to a known, finite set (explicit function clauses or `String.to_existing_atom/1` guarded by validation); reject unknown values.
- Prefer: pattern-matching strings to known atoms; enums modeled as a fixed set of clauses; `Ecto.Enum` for persisted enums.
- Avoid: `String.to_atom/1`/`List.to_atom/1` on request data, JSON keys, or any external value; building keyword/atom keys from user input.
- Almost never: `Code.eval_string`/`eval_quoted` on untrusted input; `:erlang.binary_to_term/1` on untrusted data without `:safe` (object-injection RCE); dynamic atom creation in a hot or request path.

```elixir
# Never String.to_atom/1 on user input. Map only to a finite, known set:
@spec parse_status(String.t()) :: {:ok, atom()} | {:error, :unknown_status}
def parse_status("draft"), do: {:ok, :draft}
def parse_status("signed"), do: {:ok, :signed}
def parse_status("sent"), do: {:ok, :sent}
def parse_status(_other), do: {:error, :unknown_status}
```

## 13. Processes, OTP, and Supervision

Concurrency is via processes; reliability is via supervision. "Let it crash" only works when crashes
are supervised.

- Always: run stateful/long-lived work under a supervisor; choose appropriate restart strategies; keep GenServer callbacks fast and non-blocking; set timeouts on `GenServer.call`; handle `{:stop, _}` and unexpected messages; make work idempotent where it may be retried.
- Prefer: `Task.Supervisor`/`DynamicSupervisor` for spawned work; `GenServer`/`Agent` only when state truly needs a process; `Registry` for process discovery; back-pressure (GenStage/Flow/bounded queues) for streaming.
- Avoid: bare `spawn`/`Task.async` for work that must not be lost; blocking calls inside a GenServer that serialize the whole process; unbounded mailbox growth; storing large state in a single process bottleneck.
- Almost never: do critical work in an unsupervised process; fix a race with `Process.sleep`; rely on process restart to paper over a logic bug; share mutable state via ETS without a clear ownership and concurrency model.

## 14. Serialization, Time, Money, and Ecto

- Serialization: use a vetted JSON library (`Jason`) with explicit encoding/decoding; validate decoded data before domain use; never `:erlang.binary_to_term` untrusted data without `:safe`; treat unknown/missing fields deliberately; golden tests for stable payloads.
- Time: use `DateTime`/`NaiveDateTime`/`Date` with explicit time zones (a `tzdata`-backed database); inject the current time when it affects behavior; UTC internally; test boundary dates.
- Money: represent money as integer minor units or a decimal library (`Decimal`/`Money`); never use floats for money; define rounding explicitly; test boundary/zero/negative values.
- Ecto/persistence: keep `Repo` in contexts/infrastructure; use changesets for validation/casting (not business workflows); use parameterized queries (never interpolate into `fragment`); use transactions (`Ecto.Multi`) for multi-step writes; avoid N+1 with `preload`; do not expose schemas as API responses.

## 15. Security Baseline

Security is a quality requirement; treat all external input as untrusted.

- Always: validate and constrain input; use Ecto parameter binding for queries; escape output for its context (Phoenix templates auto-escape — keep it on); use `Plug.CSRFProtection`; verify authorization in the context, not only the controller; use `:crypto`/`Plug.Crypto` and `Comeonin`/`Argon2` for hashing; use `crypto`-grade randomness for tokens; constant-time comparison (`Plug.Crypto.secure_compare`).
- Prefer: `mix sobelow` for Phoenix SAST; strong parameter handling via changesets; allow-lists for constrained values; safe defaults for cookies/sessions/headers.
- Avoid: `String.to_atom` on input; `Code.eval_*`; raw SQL with interpolation; `binary_to_term` on untrusted data; disabling CSRF/escaping; logging secrets or raw sensitive payloads.
- Almost never: implement custom crypto; compare secrets with `==`; store keys/certs in source control; build queries by string concatenation; trust headers without validation.

## 16. Dependencies, Configuration, Secrets, and Logging

- Dependencies: justify each hex package; keep the graph small; run `mix deps.audit`/`mix hex.audit`; review license, maintenance, and compile-time behavior.
- Configuration: use `config/runtime.exs` for runtime config; validate required configuration at boot and fail fast; keep secrets out of source and compiled config; use environment variables / a secret manager; never commit secrets.
- Logging: use `Logger` with metadata; never log secrets, tokens, or raw sensitive payloads; make supervised-process failures observable; keep audit trails separate from debug logs; set appropriate levels.
- Almost never: hardcode credentials/keys; read secrets at compile time into the release; log sensitive data; ignore a critical advisory because it is transitive.

## 17. Testing Strategy

Tests must prove behavior, including failure and process behavior.

- Always: add/update tests for changed behavior; test error tuples and failure paths; test validation and authorization; keep tests deterministic and async-safe; use `ExUnit` with clear, behavior-named tests.
- Prefer: unit tests for pure context functions; integration tests for adapters (Ecto sandbox); property tests (StreamData) for parsers/validators/state machines; tests for GenServer/supervisor behavior including crashes; an injected clock; `Mox` for behaviour-based mocking; mutation testing for critical rules.
- Avoid: tests that only assert a mock was called; `Process.sleep`-based synchronization; tests that depend on real external services without isolation; tests passing only in one timezone/order.
- Almost never: claim completion for business logic without automated tests; rely only on happy paths; mock the unit under test; use production credentials.

## 18. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (pure functions, simple structs, internal refactors): compile warning-free, format, Credo, basic tests.
- **Medium** (context functions, validation, adapters, GenServers): unit + failure-path tests, input validation tests, Dialyzer, integration (Ecto sandbox), coverage.
- **High** (core rules, state machines, authorization, money/time, supervision trees): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits, process/crash and restart tests.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity, distributed state): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, property tests, dependency/SAST audit (sobelow/mix_audit), mutation or documented readiness.

## 19. Coverage and Complexity Limits

Coverage is necessary but not sufficient; property and mutation testing are stronger for critical
rules.

### Default coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules (contexts)|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services / GenServers|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Controllers / channels / glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

### Complexity limits

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|Credo Refactor.CyclomaticComplexity|
|Function nesting depth|<= 2|<= 3|Credo Refactor.Nesting|
|Function length|<= 30 lines|<= 50 lines|Credo / review|
|Module length|<= 300 lines|<= 500 lines|review|
|File length|<= 400 lines|<= 600 lines|review|
|Function arity (parameters)|<= 4|<= 6|Credo Refactor.FunctionArity|
|Public functions per module|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with reason.

## 20. Quality Score Model

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no Credo/Dialyzer evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and clean Credo at a basic level|
|76-90|Strong implementation with good tests, Credo strict + Dialyzer clean, low complexity, clean context boundaries|
|91-100|Production-grade: warning-free, Credo strict + Dialyzer clean, supervised processes, strong tests, validated boundaries, no known security defects|

### Score caps

|Missing or Failed Evidence|Maximum Score|
|---|---|
|Does not compile, or warnings present and not justified|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Formatting not checked and not explained|65|
|Credo not run and not explained|65|
|Dialyzer not run where types/specs matter and not explained|70|
|Business rules without unit tests|60|
|Untrusted input not validated / converted to atoms|70|
|Context/architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Unsupervised process or swallowed error in critical path|80|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit (mix_audit/sobelow) missing where applicable|85|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|55|
|Known security issue (injection/atom-exhaustion/unsafe-deserialization) remains|45|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass (compile warning-free, format, Credo
strict, Dialyzer, tests with coverage, dependency/SAST audit), processes are supervised, untrusted
input is validated and never turned into atoms, complexity is within limits, context boundaries are
preserved, no known security defects remain, and `PHASE-RESULT.md` contains evidence.

## 21. Definition of Done

Compiles warning-free on the project Elixir/OTP; formatting passes; Credo strict and Dialyzer pass (or
are documented); tests pass and meaningful tests were added; coverage meets the tier; complexity
within limits or justified; context/architecture boundaries preserved; business rules out of
controllers/templates/schemas; errors modeled as tagged tuples and handled; processes supervised;
`@spec` on public functions; untrusted input validated and never converted to atoms; no secrets
introduced; dependencies justified and audited; `PHASE-RESULT.md` exists. For critical code, also
golden/contract tests, property tests, audit/traceability, and mutation evidence.

## 22. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Format / Credo / Dialyzer results
## Coverage results
## Process / supervision evidence (if applicable)
## Security / dependency audit results (mix_audit / sobelow)
## Architecture / context boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results and tests — not by confidence or a single run.

## 23. Final Checklist

Compiles warning-free; format check ran; Credo strict ran; Dialyzer ran where types matter; tests
pass, are meaningful, cover failure paths and process behavior; coverage measured or documented;
complexity within limits; context boundaries preserved; business rules out of controllers/templates/
schemas; errors as tagged tuples and handled; processes supervised; `@spec` on public functions;
untrusted input validated and never converted to atoms; no secrets committed; dependency/SAST audit
clean or documented; `PHASE-RESULT.md` exists; quality score is evidence-based; remaining work to
reach 100 is documented.
