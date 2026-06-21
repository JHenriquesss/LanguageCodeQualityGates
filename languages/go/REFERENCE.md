# Go Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score constraints, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the Go language quality gate for implementation work. Its purpose is to prevent
low-quality Go code from being generated, accepted, copied into a project, or treated as complete
without measurable evidence. It is an engineering control document, not a style preference.

Go has a small language, strong standard library, fast builds, built-in formatting, and a mature
concurrency model. Go code can still be architecturally wrong, panic-prone, nil-prone, race-prone,
goroutine-leaking, cancellation-unsafe, dependency-heavy, supply-chain risky, `unsafe`/cgo-heavy
without justification, and business-incorrect even when it compiles.

The implementation is complete only when the code builds, is formatted, passes vet/static analysis,
has meaningful tests, preserves architectural boundaries, models errors explicitly, avoids
unnecessary panics, handles goroutines/context deliberately, controls dependency sprawl, is secure
by default, and records measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score constraints)

1. Code builds from a clean checkout: `go build ./...`.
2. Formatting passes: `test -z "$(gofmt -l .)"`.
3. Vet/static analysis passes; new findings fixed or justified: `go vet ./...` and `staticcheck`/`golangci-lint` where configured.
4. Tests pass and are meaningful for changed behavior, including failure paths: `go test ./...`; add `-race` for concurrency-sensitive code.
5. Coverage meets the risk tier (see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of handlers, persistence, and serialization.
8. Untrusted input validated at boundaries before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors returned and wrapped explicitly; no swallowed or ignored errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress vet/lint findings to pass.
- Use `panic` for recoverable failures, leak goroutines, ignore returned errors, or share state across goroutines without synchronization.

### Score

Report 0-100. Apply the Score constraints. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. When planning, list which checks apply
and state any intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (helpers, simple types, internal refactors, throwaway tools): build, gofmt, vet, basic behavior tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters): add failure-path tests, integration at seams, coverage. Add MUST 5, 7, 8.
- High (core business rules, state transitions, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, financial, audit, data integrity, safety-critical, concurrency): add golden/contract tests, error/rejection paths, audit/traceability, race/cancellation evidence, mutation or fuzz where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code
builds, formatting and vet ran, tests ran, applicable gates ran, failures were fixed or documented,
`PHASE-RESULT.md` was created, and the score is supported by evidence. A passing `go test` alone is
not enough when the phase changed dependencies, concurrency, public API, serialization, or
persistence. Any skipped command must include the concrete blocker.

## 2. Toolchain Policy

Use the Go toolchain defined by the project.

- Always: use the `go` directive and `toolchain` directive when present; document the Go version and relevant `go env` values; keep CI-equivalent commands runnable locally; use stable Go.
- Prefer: the latest project-approved stable Go; explicit `GOOS`/`GOARCH`/`CGO_ENABLED` assumptions for deployable binaries; small, routine upgrades with tests.
- Avoid: relying on whatever Go is installed; raising the `go` directive without documenting impact; depending on `GOWORK` state accidentally; changing `CGO_ENABLED` without documenting deployment impact.
- Almost never: use unreleased Go builds in production without a documented reason; disable vet/static checks globally to finish.

## 3. Modules and Build Reproducibility

The build must be reproducible from a clean checkout using documented commands.

- Always: use Go modules as the source of truth; commit `go.mod` and `go.sum`; keep dependency versions intentional; run `go mod tidy` after dependency changes; use `-mod=readonly` where reproducibility matters; document build commands.
- Prefer: one module per coherent boundary; minimal dependency graph; `internal/` packages; `cmd/<name>` for binaries; reproducible generate/build/test steps.
- Avoid: `replace` directives pointing to local paths; pseudo-versions without reason; unnecessary indirect dependencies; non-deterministic code generation.
- Almost never: delete `go.sum` to make resolution pass; use `go generate` to hide business logic; fetch remote resources during normal builds; use a `replace` directive as an architecture escape hatch.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
go version
test -z "$(gofmt -l .)"
go build ./...
go vet ./...
go test -race -count=1 ./...
```

Stronger (applications/critical code): `staticcheck ./...`, `golangci-lint run ./...`,
`go test -covermode=atomic -coverprofile=coverage.out ./...`, `govulncheck ./...`, build-tag and
`CGO_ENABLED` matrix checks, `go test -fuzz=...` for untrusted parsers. A command not run is not
evidence; a command that failed and was ignored is negative evidence.

## 5. Formatting, Vet, and Lint

`gofmt` is mandatory; `go vet` and configured linters are quality gates.

- Always: run `gofmt`/`goimports`; run `go vet`; run `staticcheck`/`golangci-lint` where configured; fix findings or justify narrowly with `//nolint:cop // reason`.
- Prefer: default gofmt; linters for `errcheck`, `staticcheck`, `ineffassign`, `unused`, `gosec`, `bodyclose`, `contextcheck`; CI-equivalent commands.
- Avoid: blanket `//nolint`; ignoring unchecked errors or lost cancellations; leaving `fmt.Println`/`log.Printf` debug statements in production.
- Almost never: disable `go vet` for critical packages; suppress race/security/unchecked-error findings in security, signing, or persistence code.

## 6. Naming

Names must reveal intent.

- Always: use domain language; Go conventions; keep package names short, lowercase, meaningful; preserve initialisms (`ID`, `URL`, `HTTP`, `XML`, `JSON`, `API`, `SQL`); name tests as behavior statements; distinguish raw vs validated data.
- Prefer: `EventTransmissionReceipt` over `ResponseData`; behavior-named tests like `TestValidateEventRejectsExpiredCertificate`.
- Avoid: `helper`, `utils`, `common`, `manager`, `processor`, `handler`, `data`; ambiguous interfaces like `Processor`/`Manager`; package names like `utils`/`models` as dumping grounds; stutter (`payment.PaymentInvoice`).
- Almost never: placeholder names in production; let generated payload names become business vocabulary.

## 7. Packages, Modules, and Architecture Structure

Packages reflect architecture; `internal/` prevents accidental external imports.

- Always: keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport models separate from domain; keep visibility narrow with unexported names; keep public surface small.
- Prefer: a `cmd/`, `internal/{domain,application,infrastructure,api}` layout; `pkg/` only for intentionally public packages; package names by responsibility.
- Avoid: a giant `main.go`; one giant `internal/common` package; domain packages importing infrastructure; exporting everything because tests were placed outside the package.
- Almost never: business rules in handlers, adapters, builders, consumers, or CLI parsing; a `common` package that becomes a dumping ground.

## 8. Architectural Boundaries

Business rules must be explicit, isolated, and tested.

- Always: keep dependency direction inward; put business rules in domain/application packages; put side effects in adapters; use interfaces/ports at boundaries; keep handlers thin; test boundary mappers.
- Prefer: domain types with invariants; application services for orchestration; interfaces for persistence/clock/signer/storage/external APIs; domain errors separate from infrastructure errors; `internal/` for hard boundaries.
- Avoid: domain depending on SQL/HTTP/serialization/logging frameworks; handlers calling the database directly for workflows; provider payloads leaking into core logic; business rules in struct tags; `context.Context` in pure domain logic unless cancellation is genuinely part of it.
- Almost never: hide business decisions in queries or serialization; change architecture in a phase without documenting it; put audit decisions in logging side effects.

## 9. Type System as a Quality Tool

Use defined types to make invalid states hard to represent.

- Always: use defined types for identifiers and constrained values; typed enum constants for closed sets; structs for grouped data; enforce invariants at construction; use constructors returning `(T, error)` for fallible construction.
- Prefer: `type EmployeeID string` over raw `string`; `DateRange` over two unrelated dates; enum-like state machines; validating external strings before converting to typed constants.
- Avoid: `map[string]string`/`map[string]any`/`any` as a domain model; boolean flags that change behavior; pointers for required fields just to express optionality; primitive obsession.
- Almost never: represent important state as arbitrary strings; use comments to describe invariants types could enforce.

```go
// Defined type + constructor returning (T, error): no invalid value escapes.
type EmployeeID string

func ParseEmployeeID(raw string) (EmployeeID, error) {
	if len(raw) != 8 || !allDigits(raw) {
		return "", fmt.Errorf("invalid employee id %q", raw)
	}
	return EmployeeID(raw), nil
}

// Closed set as typed constants; validate external strings before converting.
type EventStatus string

const (
	StatusDraft  EventStatus = "draft"
	StatusSigned EventStatus = "signed"
	StatusSent   EventStatus = "sent"
)
```

## 10. Pointers, Values, and Nil

Pointer and value semantics should make code safer, not more fragile.

- Always: choose pointer vs value deliberately; use values for small immutable types; keep nil behavior explicit; copy slices/maps before storing when callers must not mutate; never copy a value containing a mutex.
- Prefer: immutable value objects; constructors returning concrete values and errors; defensive copies at boundaries; empty slices over nil slices in API responses where the contract expects arrays.
- Avoid: pointer fields everywhere because generated structs did it; nil maps that panic on assignment; returning internal slices/maps directly; the nil-interface trap (typed nil in an interface is not nil).
- Almost never: use `unsafe` pointers to bypass design; use nil to hide a technical failure; rely on nil interface behavior without tests.

## 11. Error Handling

Errors must be explicit and meaningful; reserve panic for programmer bugs.

- Always: return errors for fallible operations; define meaningful error values/types; wrap with `%w` when callers need `errors.Is`/`errors.As`; include context; convert infrastructure errors at boundaries; test failure paths.
- Prefer: `errors.Is`/`errors.As`-compatible design; sentinel errors only for stable comparison; custom error types for structured data; `fmt.Errorf("context: %w", err)`; separate error types per layer.
- Avoid: `errors.New("failed")`; stringly typed errors; `panic` in production paths; returning nil error with an invalid result; collapsing all failures into one error; comparing error strings in production logic.
- Almost never: panic for recoverable failures; swallow errors; ignore returned errors; handle deferred close/commit errors carelessly.

```go
var ErrNotFound = errors.New("event not found")

type ValidationError struct{ Field, Reason string }

func (e *ValidationError) Error() string { return e.Field + ": " + e.Reason }

// Wrap to preserve cause; callers use errors.Is / errors.As, not string matching.
func (s *Service) Save(ctx context.Context, ev Event) error {
	if err := s.repo.Save(ctx, ev); err != nil {
		return fmt.Errorf("save event %s: %w", ev.ID, err)
	}
	return nil
}
```

## 12. Panic, recover, and Process Exit

Production Go must not rely on panics for normal control flow.

- Always: avoid `panic` in production code; avoid `log.Fatal`/`os.Exit` in libraries and domain/application packages; remove `panic("TODO")` and debug prints; use `recover` only at process/goroutine boundaries.
- Prefer: returning errors with context; guard clauses; exhaustive switch with default error handling for external state; `must`-style helpers only in tests/package init.
- Avoid: panic after parsing external input, serialization, signing, database, or network operations; `recover` that hides failures; panicking while holding locks or in unsupervised goroutines.
- Almost never: use panic in security, signing, persistence, or audit code; use `recover` as normal control flow; call `os.Exit` from reusable packages.

## 13. Unsafe and cgo

`unsafe` and cgo are high-risk; isolate them behind safe Go APIs.

- Always: avoid `unsafe` unless documented; keep it minimal with a safety comment; expose a safe abstraction; keep cgo bindings out of domain logic; validate inputs/outputs across the boundary; document ownership, lifetime, thread-safety, and `CGO_ENABLED` deployment assumptions.
- Prefer: pure-Go alternatives; safe wrapper types; `C.CString`/`C.free` with clear cleanup; fuzz tests for `unsafe` parsers; build tags for platform-specific code.
- Avoid: `unsafe` to bypass type safety or for unmeasured micro-optimization; passing Go pointers across C unsafely; letting foreign pointers escape into domain code.
- Almost never: `unsafe.Pointer` arithmetic in business applications; cgo without safety documentation; let foreign code decide business outcomes without validation.

## 14. Concurrency, Goroutines, and Context

Concurrency must be explicit, bounded, observable, and tested. No data race does not mean correct.

- Always: minimize shared mutable state; prefer message passing/ownership transfer; define lock ownership and ordering; avoid holding locks across slow operations; pass `context.Context` through I/O where cancellation matters; always call `cancel` functions; set timeouts; bound concurrency; propagate goroutine errors; test cancellation/shutdown; run `-race`.
- Prefer: immutable data shared safely; channels for ownership transfer; `sync.Mutex`/`RWMutex` only when needed; `errgroup`; worker pools with explicit shutdown; bounded channels; `select` with explicit cancellation.
- Avoid: global mutable state; unbounded channels; detached goroutines with no supervision; goroutine-per-item with no limit; closing channels from the receiver side; `context.Context` stored in structs except documented lifecycle types.
- Almost never: fix races with sleeps; hold a lock while doing network/DB/signing/file work; retry non-idempotent operations without protection; leak goroutines after request completion.

## 15. Interfaces and Generics

Abstractions should model real variation or boundaries.

- Always: keep interfaces small; accept interfaces, return concrete types where idiomatic; put interfaces near consumers when they are ports; use generics only where they reduce duplication without reducing clarity.
- Prefer: interfaces for external boundaries (repository, clock, signer, storage); concrete domain types; generics for collections/algorithms with clear benefit; compile-time interface assertions for adapters.
- Avoid: an interface for every struct; single-implementation interfaces without boundary/testing value; `any` when concrete types are known; over-generic domain code.
- Almost never: use interfaces/generics to hide poor architecture or avoid modeling business concepts.

## 16. Serialization and Deserialization

Serialization is a boundary concern; do not let payloads define the domain model.

- Always: use DTOs at boundaries; validate decoded data before domain use; keep domain invariants independent from serialization; test encode/decode including malformed input; treat unknown/missing fields deliberately; keep versioning explicit.
- Prefer: dedicated request/response and event structs; explicit mappers; golden tests for stable payloads; schema validation where applicable; stable date/time formats.
- Avoid: using domain structs as DTOs by default; `map[string]any` as business data; silent defaults for required fields; untested custom marshalers.
- Almost never: deserialize untrusted payloads directly into domain objects; treat deserialization success as business validation.

## 17. Time, Money, and Numerics

Date/time and money bugs are business bugs.

- Always: use timezone-aware instants; inject a clock when time affects behavior; test boundary dates; use integer minor units or a decimal type for money; use checked arithmetic where overflow matters; test boundary/zero/negative values.
- Prefer: value objects for money/measurements; UTC internally; ISO-8601 at boundaries; names that include units (`amountCents`, `durationDays`).
- Avoid: `time.Now()` in domain logic; `float64` for money; comparing dates as strings; magic numbers.
- Almost never: use local machine time as business truth; use binary floating point for auditable money; round financial values without tests.

## 18. Collections, Logging, and Observability

- Collections: choose by behavior; make ordering explicit; avoid hidden side effects in loops; do not depend on map iteration order as a contract; copy collections at boundaries when ownership is unclear.
- Logging: use the project logger; structured fields; correlation IDs; never log secrets, keys, or raw sensitive payloads; make goroutine failures observable; keep audit trails separate from debug logs.
- Avoid `fmt.Println` in production services; logging whole payloads; vague messages without context.

## 19. Security Baseline

Security is a quality requirement; treat all external input as untrusted.

- Always: validate input; use parameterized queries; protect secrets; verify TLS; set network timeouts; use `crypto/rand` for tokens; run `govulncheck`/`gosec` where configured; redact sensitive logs.
- Prefer: maintained crypto libraries; centralized crypto/signing adapters; strong typed inputs before business use; fuzz/property tests for parsers; payload size limits; allow-lists for constrained values.
- Avoid: SQL by string concatenation; unsafe deserialization; logging secrets; shelling out with untrusted arguments; disabling TLS verification.
- Almost never: implement custom crypto; store keys/certs in source control; use `math/rand` for security; suppress critical vulnerability findings without justification.

## 20. Dependencies and Supply Chain

- Always: add dependencies only with a clear purpose; keep the module graph small; review license, native code, and `go` version impact; run `govulncheck` and supply-chain checks after dependency changes; document major additions.
- Prefer: the standard library for trivial helpers; mature, maintained modules; `go list -m all`/`go mod why` for inspection; small, regular updates.
- Avoid: blind `go get -u ./...`; abandoned modules; git dependencies without pinned revisions; modules with surprising build-time behavior.
- Almost never: ignore a critical advisory because it is transitive; bypass checksum verification without an explicit private-module policy.

## 21. Testing Strategy

Tests must prove behavior, not just execute lines.

- Always: add/update tests for changed behavior; test failure and boundary paths; keep tests deterministic and independent; avoid real network/time/order dependence; use behavior-named tests.
- Prefer: table tests; unit tests for domain rules; integration tests for adapters; contract/fake-server tests for external APIs; golden tests for stable payloads; fuzz tests for parsers; mutation tests for critical rules; a fixed clock/seed; `-race` for concurrency.
- Avoid: tests that only assert a mock was called; `sleep`-based synchronization; tests passing only in one timezone/order; assertion-free tests.
- Almost never: delete/skip tests to pass; rely only on happy paths; depend on live production services.

## 22. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (helpers, simple types, internal refactors): build, gofmt, vet, basic behavior tests.
- **Medium** (services, validation, adapters): unit + failure-path tests, integration at seams, coverage.
- **High** (core rules, state machines, authorization, money/time, concurrency): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits, race/cancellation evidence.
- **Critical** (security, crypto, financial, audit, data integrity, safety-critical): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, fuzz where relevant, security/dependency audit, mutation or documented readiness.

## 23. Coverage and Mutation Testing

### Default thresholds

|Area|Line|Branch/Behavior|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

Measure with `go test -coverprofile`. Fuzz untrusted parsers. Branch coverage and race/cancellation
evidence matter more than raw line percentage.

## 24. Complexity Limits

|Item|Target|Maximum|
|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|
|Function cognitive complexity|<= 10|<= 15|
|Function length|<= 30 lines|<= 50 lines|
|Type/method-set length|<= 300 lines|<= 500 lines|
|File length|<= 400 lines|<= 600 lines|
|Function parameters|<= 4|<= 6|
|Nesting depth|<= 2|<= 3|
|Exported items per package file|<= 10|<= 15|

Enforced by `golangci-lint` (gocyclo, gocognit, funlen, nestif). Exceeding a maximum requires a
documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

## 25. Quality Score Model

### Scoring bands (0-100)

|Score|Meaning|
|---|---|
|0-39|Not acceptable. Missing build/test/evidence or severe design flaws.|
|40-59|Weak. Some evidence, but important quality gates missing.|
|60-74|Basic — acceptable for low-risk code only. Gaps documented.|
|75-84|Good. Most relevant gates pass with meaningful tests.|
|85-89|Strong. Good evidence, boundary discipline, failure tests, security checks.|
|90-94|Very strong. Suitable for high-risk code with coverage, static analysis, strong tests.|
|95-100|Exceptional. Critical-path evidence, mutation/fuzz/contract tests, audit/security proof.|

### Score constraints (max score when evidence is missing)

- Max 49 if the code does not build.
- Max 59 if gofmt was not checked.
- Max 64 if tests were not run.
- Max 69 if meaningful tests are missing for implemented behavior.
- Max 74 if go vet/static checks were skipped without reason.
- Max 79 if dependency/security checks were skipped after meaningful dependency changes.
- Max 84 if concurrency-sensitive code lacks race/cancellation evidence.
- Max 84 if error paths are not tested in medium/high-risk code.
- Max 89 if critical security/signing code lacks golden/contract/error-path tests.
- Max 89 if coverage requirements were skipped without reason.
- Max 89 if unsafe/cgo is present without strong tests and documentation.
- Max 94 if critical code lacks mutation/fuzz evidence or documented readiness.

A phase may score 95+ only with critical-path evidence, mutation/fuzz/contract tests where relevant,
clean security/dependency results, and `PHASE-RESULT.md` evidence.

## 26. Definition of Done

Code builds; gofmt passes; vet/static analysis ran (or documented); tests pass and meaningful tests
were added; coverage meets the tier; complexity within limits or justified; architecture preserved;
business rules out of handlers/adapters/serialization; errors handled explicitly; panics not used for
recoverable failures; `unsafe`/cgo absent or justified/isolated/documented/tested; no secrets
introduced; dependencies justified; `PHASE-RESULT.md` exists. For critical code, also golden/contract/
error-path tests, audit/traceability, race/cancellation and fuzz evidence, security/dependency audit.

## 27. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Formatting / vet / lint results
## Coverage results
## Race / cancellation evidence (if applicable)
## Fuzz / mutation results (if applicable)
## Dependency / security audit results
## Architecture boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

## 28. Final Checklist

Builds; gofmt ran; vet/lint ran; tests pass, meaningful, cover failure paths; `-race` for concurrency;
coverage measured or documented; complexity within limits; architecture preserved; business rules out
of handlers/adapters/serialization; no swallowed errors; no unjustified panic/unsafe/cgo; no secrets
committed; dependencies justified; `PHASE-RESULT.md` exists; score is evidence-based; remaining work
to reach 100 documented.
