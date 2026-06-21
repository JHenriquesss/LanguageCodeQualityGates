# TypeScript Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score constraints, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the TypeScript language quality gate for implementation work. Its purpose is to
prevent low-quality TypeScript code from being generated, accepted, copied into a project, published,
deployed, or treated as complete without measurable evidence. It is an engineering control document,
not a style preference.

TypeScript erases types at runtime. Code can type-check and still be architecturally wrong,
`any`-infected, assertion-heavy, null/undefined-prone, promise-leaking, cancellation-unsafe,
runtime-invalid, under-tested, dependency-heavy, supply-chain risky, vulnerable (prototype pollution,
injection, SSRF, XSS, path traversal, deserialization, secret leakage), and business-incorrect even
when `tsc` passes. Anything crossing a boundary must be validated, decoded, authorized, and tested as
runtime JavaScript.

The implementation is complete only when the code type-checks, is formatted, passes ESLint, has
meaningful tests, preserves architecture, validates untrusted input at runtime, models failures,
avoids `any`/unsafe assertions, handles promises and cancellation deliberately, controls dependency
sprawl, is secure by default, and records measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score constraints)

1. Code typechecks: `tsc --noEmit` (or the project typecheck script).
2. Formatting passes: `prettier --check .`.
3. ESLint/static analysis passes; new findings fixed or justified: `eslint . --max-warnings=0`.
4. Tests pass and are meaningful for changed behavior, including failure paths.
5. Coverage meets the risk tier (see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of handlers, components, persistence, and serialization.
8. Every untrusted boundary validated at runtime (types do not validate at runtime).
9. No secrets committed or bundled into client code; sensitive data not logged.
10. Failures modeled explicitly; promises awaited/handled; no swallowed errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress ESLint/compiler diagnostics to pass.
- Use `any`, unsafe assertions, `@ts-ignore`, or `JSON.parse(...) as T` without justification; leave floating promises; trust unvalidated external data.

### Score

Report 0-100. Apply the Score constraints. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. When planning, list which checks apply
and state any intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (formatting helpers, simple display logic, internal non-critical refactors): typecheck, format, lint, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters, API handlers): add failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, financial, audit, data integrity, safety-critical): add golden/contract tests, error/rejection paths, audit/traceability, async cancellation/timeout tests, mutation or property tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code
type-checks, formatting and ESLint ran, applicable gates ran, failures were fixed or documented,
`PHASE-RESULT.md` was created, and the score is supported by evidence. A passing test run alone is not
enough when the phase changed type contracts, runtime validation, public API, dependencies, package
exports, bundling, serialization, authorization, or persistence.

## 2. Toolchain and `tsconfig` Policy

Use the TypeScript, Node/runtime, and package-manager versions defined by the project. `tsconfig.json`
is a language contract — treat it as source.

- Always: use the project TypeScript and runtime versions (`.nvmrc`/`engines`/`packageManager`); keep `strict: true`; run `tsc --noEmit`; keep include/exclude precise; document toolchain/`tsconfig` changes.
- Prefer (baseline): `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `isolatedModules`, `verbatimModuleSyntax`; `module`/`moduleResolution` that match the actual runtime/bundler; project references for monorepos.
- Avoid: `strict: false`; `allowJs`/`checkJs` drift without a migration plan; `skipLibCheck: true` as a permanent default in greenfield code; path aliases without runtime/bundler/test resolution; hiding broken files via exclude.
- Almost never: `// @ts-nocheck` in production; loosen global compiler settings to fix one weak file or dependency; change module target in a library without testing consumers.

## 3. Package Manager, Lockfile, and Reproducibility

The build must be reproducible from a clean checkout using documented commands.

- Always: use one project-approved package manager; commit the correct lockfile; use frozen/immutable installs in CI (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`); keep dependency changes small; document build commands.
- Prefer: Corepack-managed versions; workspaces with deliberate boundaries; minimal runtime dependencies; dev/test dependencies kept out of production bundles.
- Avoid: committing multiple lockfiles; installing with a different manager than CI; broad upgrades unrelated to the phase; `file:` dependencies that work on one machine; postinstall scripts as an architecture escape hatch.
- Almost never: delete the lockfile to make installation pass; add dependencies for trivial helpers; fetch remote resources during normal build without approval.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
node --version && npx tsc --version
prettier --check .
tsc --noEmit
eslint . --max-warnings=0
npm test          # project test runner
npm run build     # when artifacts/exports/bundling are affected
```

Stronger (applications/libraries/critical code): coverage, e2e/integration tests,
`npm audit --audit-level=high`, SBOM where required, `npm pack --dry-run` + consumer smoke tests for
libraries, dual ESM/CJS export checks, mutation (`stryker`) and property (`fast-check`) tests,
`knip`/`depcheck`, dependency-cruiser/madge for import cycles. A command not run is not evidence; a
command that failed and was ignored is negative evidence; a transpile-only build is not type-safety
evidence.

## 5. Formatting, ESLint, and Static Analysis

Use the project formatter; treat ESLint (type-aware where supported) as a quality gate.

- Always: run formatting and lint checks; use type-aware linting where supported; treat new warnings as failures unless justified; keep suppressions narrow with a reason.
- Prefer: Prettier for formatting; `@typescript-eslint` strict type-checked config; rules that prevent `no-floating-promises`, `no-misused-promises`, `no-unsafe-*`, `restrict-template-expressions`, `strict-boolean-expressions`, `no-explicit-any`, `switch-exhaustiveness-check`, `consistent-type-imports`; import restrictions for architecture.
- Avoid: hand-formatting fights; broad `/* eslint-disable */`; suppressing unsafe-`any`/promise/import-boundary findings; `console.log` debug output in production unless policy allows.
- Almost never: disable ESLint for critical packages; disable type-aware linting to finish; suppress security/promise/unsafe findings in security, signing, persistence, or audit code.

## 6. Naming and Project Structure

Names must reveal intent; modules and packages reflect architecture.

- Always: use domain language; distinguish raw vs validated data and DTOs vs domain objects; keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport models separate from domain; keep public package surface small; avoid import cycles.
- Prefer: a `domain`/`application`/`infrastructure`/`transport` layout (or feature folders); intentional `index.ts` public entrypoints; export maps for package boundary control; ports/interfaces for persistence/clock/signer/storage/external APIs.
- Avoid: `helper`/`utils`/`common`/`manager`/`processor`/`handler`/`data` names; a giant `index.ts`/`types.ts`/`utils/`; domain importing Express/Nest/React/Prisma/SQL/HTTP/logging/generated payloads; barrels that create cycles or hide architecture.
- Almost never: business rules in HTTP handlers, React components, DB adapters, builders, generated clients, message consumers, CLI parsing, or framework decorators; `TData`/`Thing`/`Stuff` when a domain name exists.

## 7. Type System, `any`, and Assertions

Use the type system to make invalid states hard to represent, remembering types vanish at runtime.

- Always: use domain types for identifiers and constrained values; discriminated unions for closed state sets; branded/opaque types where raw primitives are ambiguous; `readonly` where mutation is unintended; prefer `unknown` for untrusted input and narrow it; pair static types with runtime validation at boundaries.
- Prefer: `satisfies` for literal conformance; `as const`; exhaustive switches with `never` checks; type guards and parser functions returning typed results.
- Avoid: `Record<string, any>`/`any` as a domain model; `as SomeType` after parsing untrusted input; double assertions (`as unknown as T`); non-null `!` to silence real absence; `@ts-ignore` (use `@ts-expect-error` with a reason in tests/narrow cases).
- Almost never: `// @ts-nocheck` in production; `any` as a bridge across boundaries; unsafe assertions in security/financial/persistence/audit code; trust generated declarations without contract tests.

```ts
// Branded type: a raw string cannot be used where an EmployeeId is required.
type EmployeeId = string & { readonly __brand: "EmployeeId" };

function parseEmployeeId(raw: string): EmployeeId {
  if (!/^\d{8}$/.test(raw)) throw new ValidationError(`invalid id: ${raw}`);
  return raw as EmployeeId;
}

// Discriminated union: invalid combinations are unrepresentable.
type Event =
  | { kind: "draft" }
  | { kind: "signed"; signatureId: string }
  | { kind: "sent"; protocol: string };
```

## 8. Null, Undefined, Immutability, and Errors

- Null/undefined: distinguish missing/undefined/null/empty/zero when the contract cares; validate required fields before constructing domain objects; avoid ambiguous returns where `undefined` could mean not-found/invalid/unauthorized/failed; avoid `value || fallback` when `0`/`false`/empty are valid.
- Immutability: use `readonly`/`ReadonlyArray`/`ReadonlyMap`; avoid exposing mutable collections from domain objects; copy at boundaries when ownership is unclear; make state transitions explicit; avoid global mutable state.
- Errors: distinguish validation/business rejection/authorization/conflict/timeout/cancellation/dependency/internal failures; use `Error` subclasses or a `Result<T, E>` for programmatic handling; preserve root cause (`cause`) where safe; handle promise rejections; do not leak provider payloads, SQL, tokens, secrets, or stack traces to external clients.
- Almost never: throw strings/plain objects; `catch {}` without a reason; ignore promise rejections; collapse all failures into HTTP 500 or a generic `Error`.

```ts
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// Decode + validate at the boundary; callers handle the typed error explicitly.
function decodeRequest(input: unknown): Result<Request, ValidationError> {
  const parsed = RequestSchema.safeParse(input); // runtime validation, not just types
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: new ValidationError(parsed.error.message) };
}
```

## 9. Async, Promises, and Cancellation

Async must be explicit, bounded, observable, and tested.

- Always: `await` or intentionally handle every promise; use lint rules against floating promises; use `AbortSignal`/cancellation for I/O and long operations; set timeouts; bound concurrency; avoid blocking the event loop with CPU-heavy synchronous work in services; propagate errors; test success/failure/timeout/cancellation/retry.
- Prefer: `Promise.all` for all-or-nothing, `Promise.allSettled` for partial success; concurrency limiters; queue/worker abstractions; `AbortController` integrated with fetch/DB/queues; fake timers in tests.
- Avoid: `array.forEach(async ...)` when awaiting is required; unbounded `Promise.all` over user-controlled arrays; infinite retries; sleeps as synchronization; fire-and-forget business operations; ignoring `signal.aborted`/timeout errors.
- Almost never: retry non-idempotent operations without protection; swallow background-worker failures; depend on runtime scheduling for correctness.

## 10. Runtime Validation and Serialization

Every untrusted boundary must validate at runtime; serialization is a boundary concern.

- Always: validate all external input and external service responses before trusting them; validate environment variables at startup; validate database records where schema drift can violate assumptions; keep schemas/parsers near boundaries; map validated data into domain types; test valid/invalid/missing/null/extra/malformed/boundary cases; treat unknown/missing fields deliberately.
- Prefer: project-approved schema libraries or hand-written parsers; strict object parsing for APIs that reject unknown fields; versioned schemas; safe parse results rather than throwing inside bulk operations; golden tests for stable payloads.
- Avoid: `JSON.parse(...) as DomainType`; trusting generated OpenAPI/GraphQL/gRPC clients without response validation for untrusted/critical providers; UI validation as the only validation; relying only on database constraints for domain invariants.
- Almost never: make business decisions from unvalidated `unknown`/`any`; treat deserialization success as business validation; decode untrusted payloads directly into domain objects.

## 11. Modules, Packaging, Generation, and Decorators

- Modules: document whether the package is ESM/CJS/dual/bundler-only; keep `type`/`exports`/`imports`/`main`/`module`/`types` consistent; verify runtime import paths, not only compile paths; ensure path aliases work in typecheck/test/runtime/bundling; use `import type`; avoid import cycles; test package exports when the public API changes.
- Generation/decorators/metadata: prefer ordinary TypeScript before generation/reflection; keep generated code deterministic, marked, and separate from domain logic; test generated behavior; keep decorator side effects explicit; do not hide business rules in generated code, decorators, or `method_missing`-style metadata.
- Public API/library: keep exports intentional; preserve backward compatibility unless the phase is a breaking change; generate and inspect declarations; test public entrypoints as consumers use them; align runtime and type exports; use semver deliberately.

## 12. Time, Money, Collections, and Logging

- Time: distinguish instants/local date-times/date-only/durations/deadlines; inject a clock when time affects behavior; test boundary dates; use ISO-8601/RFC3339 at boundaries; never use local machine time as business truth.
- Money: avoid binary `number` for money where exactness matters; use BigInt, integer minor units, or an approved decimal library; define rounding; test boundary/zero/negative/fractional values; names that include units (`amountCents`, `ratePercent`).
- Collections: choose by behavior; make ordering explicit; use `ReadonlyArray`/`Map`/`Set` appropriately; avoid prototype pollution with untrusted keys; avoid hidden side effects in `map`/`filter`/`reduce`; sort keys before deterministic output.
- Logging: use the project structured logger; include correlation IDs; never log secrets, keys, tokens, cookies, or raw sensitive payloads; make background-job failures observable; keep audit trails separate from debug logs.

## 13. Security and Dependencies

- Security: validate/sanitize untrusted input; authorize at the application/domain boundary (not only UI/middleware); use parameterized queries; avoid command/SQL/NoSQL/template injection, path traversal, SSRF, open redirects, XSS, CSRF, prototype pollution, unsafe deserialization, and IDOR; keep secrets out of code/logs/tests/snapshots/client bundles; use secure defaults for cookies/CORS/headers/sessions/JWT/OAuth; rate-limit public endpoints; run security tools where configured.
- Dependencies: justify new runtime dependencies; prefer standard/runtime APIs for trivial functionality; review package health (maintenance, license, size, transitive deps, install scripts, native code, provenance); run vulnerability checks after meaningful changes; keep dev/test/build dependencies out of production bundles.
- Almost never: `eval`/`new Function`/dynamic template execution; serialize secrets into frontend bundles; broad CORS; trust JWT contents without verifying signature/issuer/audience/expiry/algorithm; store passwords without a modern hashing policy; disable TLS verification; accept install scripts from unknown packages without review.

## 14. Testing Strategy

Tests must prove behavior; TypeScript needs both static and runtime evidence.

- Always: add/update tests for changed behavior; test failure paths, boundary mappers, runtime validation, and async timeout/cancellation; keep tests deterministic; avoid real time/network/random/order/external dependence; use meaningful test names.
- Prefer: unit tests for pure domain rules; integration tests for persistence/adapters; contract tests with fake servers for HTTP; golden tests for stable payloads; e2e for user-critical flows; property tests (fast-check) for validators/parsers/state machines; mutation testing for critical rules.
- Avoid: tests that only assert mocks were called; broad/sensitive snapshots; arbitrary sleeps; tests passing only in one timezone/locale/order; skipping tests without documenting why.
- Almost never: claim completion for business logic without automated tests; rely only on happy paths; mock the unit under test; replace contract tests with type assertions; use live production credentials.

## 15. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (formatting helpers, simple display logic, internal refactors): typecheck, format, lint, basic tests.
- **Medium** (services, validation, adapters, API handlers): unit + failure-path tests, runtime boundary validation, integration, coverage.
- **High** (core rules, state machines, authorization, money/time): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits.
- **Critical** (security, crypto, financial, audit, data integrity, safety-critical): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, async cancellation/timeout tests, security/dependency audit, mutation or property tests.

## 16. Coverage and Complexity Limits

Quality of assertions matters more than raw percentage.

### Default coverage thresholds

|Area|Line|Branch|
|---|---|---|
|Changed business-critical code|>= 85%|>= 80%|
|Critical security/financial/audit rules|~100% meaningful branch coverage|—|

### Complexity limits

|Item|Target|Maximum|
|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|
|Function cognitive complexity|<= 10|<= 15|
|Function length|<= 30 lines|<= 50 lines|
|Class/module length|<= 300 lines|<= 500 lines|
|File length|<= 400 lines|<= 600 lines|
|Function parameters|<= 4|<= 6|
|Nesting depth|<= 2|<= 3|
|Public exports per module|<= 10|<= 15|

Enforced by ESLint (`complexity`, `max-lines-per-function`, `max-lines`, `max-params`, `max-depth`).
Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with reason.

## 17. Quality Score Model

### Scoring bands (0-100)

|Score|Meaning|
|---|---|
|95-100|Excellent. Strict typecheck, lint, formatting, meaningful tests, failure paths, security review, no unjustified unsafe escapes, no architecture erosion.|
|85-94|Good. Strong implementation with minor documented gaps that do not threaten correctness or safety.|
|70-84|Adequate but risky. Some gaps remain; acceptable only for lower-risk phases or approved residual risk.|
|50-69|Weak. Missing meaningful tests, static analysis, validation, or architecture evidence.|
|<50|Not acceptable. The phase should not be treated as complete.|

### Score constraints (must not exceed)

- 60 if `tsc --noEmit` or project typecheck did not pass.
- 65 if ESLint/static analysis was not run and no concrete blocker exists.
- 70 if tests were not run.
- 75 if only happy-path tests exist for changed business logic.
- 75 if runtime validation is missing for new untrusted input boundaries.
- 80 if dependency changes were not reviewed.
- 80 if package exports/public API changed without consumer/import tests.
- 85 if `any`, unsafe assertions, or suppressions were added without clear justification.
- 85 if async code lacks cancellation/timeout/error-path tests where relevant.
- 90 if high-risk security/financial/audit code lacks golden/contract/failure-path tests.

## 18. Definition of Done

Code typechecks; formatting passes; ESLint passes or findings are documented; tests pass and
meaningful tests were added; coverage meets the tier; complexity within limits or justified;
architecture preserved; business rules out of handlers/components/persistence/serialization; untrusted
input validated at runtime; promises awaited/handled; no secrets committed or bundled to the client;
dependencies justified; `PHASE-RESULT.md` exists. For critical code, also golden/contract/error-path
tests, audit/traceability, async cancellation tests, security/dependency audit, and mutation or
property evidence.

## 19. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Typecheck / lint / format results
## Coverage results
## Runtime validation evidence
## Async cancellation / timeout evidence (if applicable)
## Dependency / security audit results
## Public API / package export impact (if applicable)
## Architecture boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

## 20. Final Checklist

Typechecks; format ran; ESLint ran; tests pass, meaningful, cover failure paths; coverage measured or
documented; complexity within limits; architecture preserved; business rules out of
handlers/components/persistence/serialization; untrusted input validated at runtime; no floating
promises; no `any`/unsafe assertions without justification; no secrets committed or bundled to the
client; dependencies justified; `PHASE-RESULT.md` exists; score is evidence-based; remaining work to
reach 100 documented.
