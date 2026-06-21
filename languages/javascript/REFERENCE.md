# JavaScript Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the JavaScript language quality gate for implementation work. Its purpose is to
prevent low-quality JavaScript from being generated, accepted, copied into a project, published,
deployed, or treated as complete without measurable evidence. It is an engineering control document,
not a style preference.

JavaScript has **no compile-time type checking** — there is no `tsc` step to catch type errors before
runtime, so ESLint, runtime validation, and tests carry the weight that a type system would in other
languages. JavaScript can run and still be architecturally wrong, coercion-buggy (`==`), promise-
leaking, null/undefined-prone, prototype-pollution-vulnerable, injection-prone, dependency-heavy,
supply-chain risky, and business-incorrect. "It runs" is weak evidence.

The implementation is complete only when the code is formatted, passes ESLint clean, validates every
untrusted boundary at runtime, has meaningful tests, models failures and handles promises, preserves
architecture, controls dependency sprawl, is secure by default, and records measurable evidence in
`PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult the numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Code parses and runs under the project Node/runtime version: no syntax errors; `npm ci` clean. New code uses ESM/`const`/`let`, not `var`.
2. Formatting passes: `prettier --check .`.
3. ESLint passes with no warnings: `eslint . --max-warnings=0`; where the project type-checks JS via JSDoc, `tsc --checkJs --noEmit` passes too.
4. Tests pass and are meaningful for changed behavior, including failure paths.
5. Coverage meets the risk tier (c8/istanbul; see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of route handlers, UI components, persistence, and serialization.
8. Every untrusted boundary validated at runtime — there are no static types to rely on.
9. No secrets committed or bundled into client code; sensitive data not logged.
10. Failures modeled explicitly; promises awaited/handled; strict equality (`===`); no swallowed errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because the code runs.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress ESLint diagnostics (`/* eslint-disable */`) to pass.
- `eval`, `new Function`, or dynamic code from input; use `==`/`!=` where `===`/`!==` is required; use `var`; trust unvalidated external data.
- Leave floating (unhandled) promises; allow prototype pollution (merging untrusted data into objects); put business rules in handlers/components; ship secrets in client bundles.

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. Because JS has no compile-time types,
untrusted-input changes are never low tier. When planning, list which checks apply and state any
intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (formatting helpers, simple display logic, internal non-critical refactors): lint, format, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters, API handlers): add failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, JSDoc type-checking where used. Add MUST 6.
- Critical (security, auth, crypto, payments, financial, audit, data integrity): add golden/contract tests, error/rejection paths, audit/traceability, injection/XSS tests, async cancellation/timeout tests, dependency audit, mutation tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code runs,
formatting and ESLint ran, applicable gates ran, failures were fixed or documented, `PHASE-RESULT.md`
was created, and the score is supported by evidence. A passing test run alone is not enough when the
phase changed runtime validation, public API, dependencies, package exports, bundling, serialization,
authorization, or persistence. Without a type checker, runtime validation and tests are the only
guards — weight them accordingly.

## 2. Toolchain and Runtime

Use the Node/runtime and package-manager versions defined by the project.

- Always: use the project Node version (`.nvmrc`/`engines`/CI); document `node --version`; keep local and CI commands aligned; target the intended runtime (Node, browser, worker, edge, serverless).
- Prefer: an active LTS Node for services; ESM (`"type": "module"`) for new code; standard language features over build-tool magic; `node --test`/Vitest/Jest per project.
- Avoid: relying on whatever Node is installed; syntax newer than the runtime supports; depending on global tooling or IDE state; mixing ESM and CJS accidentally.
- Almost never: ship code that only runs under one developer's setup; depend on transpile-only behavior without a lint/test gate.

## 3. Package Manager, Lockfile, and Reproducibility

The build must be reproducible from a clean checkout using documented commands.

- Always: use one project-approved package manager; commit the lockfile; install with `npm ci` (or `pnpm install --frozen-lockfile` / `yarn install --immutable`) in CI; keep dependency changes small; document build commands.
- Prefer: Corepack-managed versions; minimal runtime dependencies; dev/test dependencies kept out of production bundles; `engines` for runtime compatibility.
- Avoid: committing multiple lockfiles; installing with a different manager than CI; broad upgrades unrelated to the phase; `file:` dependencies that work on one machine; postinstall scripts as an escape hatch.
- Almost never: delete the lockfile to make installation pass; add dependencies for trivial helpers; fetch remote resources during normal build without approval.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
node --version
npm ci
prettier --check .
eslint . --max-warnings=0
npm test
```

Stronger (applications/libraries/critical code): coverage (`c8`/built-in), `tsc --checkJs --noEmit`
where JSDoc typing is used, e2e/integration tests, `npm audit --audit-level=high`, `npm pack
--dry-run` + consumer smoke tests for libraries, mutation (`stryker`) and property (`fast-check`)
tests, bundle-size checks for frontend/serverless. A command not run is not evidence; a command that
failed and was ignored is negative evidence.

## 5. Formatting

Use the project formatter; do not debate formatting manually.

- Always: run `prettier --check`; keep configuration intentional; format new and changed files.
- Prefer: Prettier for formatting; ESLint for correctness, not broad formatting fights; small cohesive files; clear top-level ordering (imports, constants, functions, exports).
- Avoid: hand-formatting against the formatter; reformatting unrelated files; giant barrel files that hide dependency direction.
- Almost never: disable formatting checks; commit unformatted code; leave `console.log`/`debugger` debug output in production unless policy allows.

## 6. ESLint and Static Analysis

With no type checker, ESLint is the primary automated guard. Treat it as a gate.

- Always: run `eslint . --max-warnings=0`; treat new warnings as failures; keep suppressions narrow with a reason; enable rules for the JS hazard classes.
- Prefer: `eslint:recommended` plus `eslint-plugin-promise`, `eslint-plugin-security`, and (for Node) `eslint-plugin-n`; rules such as `eqeqeq`, `no-var`, `prefer-const`, `no-eval`, `no-implied-eval`, `no-new-func`, `no-param-reassign`; complexity rules; optional JSDoc type-checking via `tsc --checkJs`.
- Avoid: broad `/* eslint-disable */`; suppressing security/promise findings; ignoring unused variables and unreachable code; `console.log` left in production.
- Almost never: disable ESLint for critical files; suppress security findings in auth, crypto, payment, or persistence code; rely on "it runs" instead of lint + tests.

## 7. Naming and Project Structure

Names must reveal intent; modules reflect architecture.

- Always: use domain language; distinguish raw vs validated data; keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport/UI models separate from domain; keep the public surface small.
- Prefer: a `domain`/`application`/`infrastructure`/`transport` layout (or feature folders); intentional entrypoints; named exports over sprawling default exports; small modules.
- Avoid: `helper`/`utils`/`common`/`manager`/`handler`/`data` grab-bag names; a giant `index.js`/`utils.js`; domain importing Express/React/DB clients/HTTP wrappers; barrels that create cycles.
- Almost never: business rules in route handlers, React/Vue components, DB adapters, builders, message consumers, or CLI parsing; let transport shapes define the domain vocabulary.

## 8. Modules, ESM/CJS, and Architecture

Module behavior must be explicit; Node, bundlers, and consumers can resolve differently.

- Always: document whether the package is ESM/CJS/dual; keep `package.json` `type`/`exports`/`main`/`module` consistent; verify runtime import paths, not only what the editor resolves; avoid import cycles.
- Prefer: ESM for new code; explicit file extensions where Node ESM requires them; named exports; export maps for package boundary control; thin entrypoints.
- Avoid: mixing `require` and `import` accidentally; default-export churn that breaks refactoring; deep imports into another module's internals; giant barrels.
- Almost never: ship a dual package without verifying both entrypoints; depend on bundler-only resolution in Node-runtime code.

## 9. No Static Types — Runtime Validation Is the Contract

Because there are no compile-time types, the only guarantee about a value's shape is what you check at
runtime. Validate at every untrusted boundary and convert to a known shape.

- Always: validate request bodies, query/params, CLI args, env vars, files, messages, DB rows, and third-party responses before use; reject malformed input with a clear error; convert validated input into a known internal shape; test valid/invalid/missing/extra/malformed cases.
- Prefer: a schema/validation library (e.g. Zod, Valibot, Ajv) or explicit hand-written validators; JSDoc types plus `tsc --checkJs` for editor/CI type feedback; `Number.isInteger`/`Number.isFinite` and explicit `typeof`/`Array.isArray` checks.
- Avoid: trusting `JSON.parse` output without validation; assuming a parameter is the shape you expect; relying on truthiness for presence checks where `0`/`""`/`false` are valid.
- Almost never: make business decisions from unvalidated external data; pass `req.body`/`req.query` straight into domain logic or the database; treat parse success as business validation.

```js
// No static types: validate the shape at runtime before trusting it.
function parseOrder(input) {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "not an object" };
  }
  const { id, amount } = input;
  if (typeof id !== "string" || !/^\d{8}$/.test(id)) {
    return { ok: false, error: "invalid id" };
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) {
    return { ok: false, error: "invalid amount" };
  }
  return { ok: true, value: { id, amount } };
}
```

## 10. Equality, Coercion, `var`, and Truthiness

JavaScript's implicit coercion is a correctness and security hazard.

- Always: use `===`/`!==` (never `==`/`!=`); use `const`/`let` (never `var`); be explicit about presence checks; use `Number.isNaN`/`Number.isFinite` rather than global `isNaN`/coercion.
- Prefer: `value === undefined`/`value === null`/`value == null` only as a deliberate null-or-undefined check with a comment; `??` for defaults where `0`/`""`/`false` are valid; `Array.isArray` for arrays.
- Avoid: `==` (type juggling: `0 == ""`, `"0" == false`); `var` (hoisting/scope bugs); `value || default` when falsy-but-valid values exist; relying on automatic string/number coercion in keys.
- Almost never: compare secrets, tokens, or money with `==`; switch behavior on truthiness of a value that can legitimately be `0`/`""`; use `with`.

## 11. Null, Undefined, Immutability, and Errors

- Null/undefined: distinguish missing/undefined/null/empty/zero when the contract cares; validate required fields before use; avoid ambiguous returns where `undefined` could mean not-found/invalid/unauthorized/failed; use `?.` and `??` deliberately, not to hide bugs.
- Immutability: prefer `const`; avoid mutating function arguments or shared objects; copy at boundaries (`structuredClone`/spread) when ownership is unclear; `Object.freeze` for true constants; avoid global mutable state.
- Errors: distinguish validation/business rejection/authorization/conflict/timeout/cancellation/dependency/internal failures; throw `Error` subclasses with useful messages; preserve root cause (`new Error(msg, { cause })`); handle every promise rejection; do not leak provider payloads, SQL, tokens, secrets, or stack traces to clients.
- Almost never: throw strings/plain objects; `catch {}` without a reason; ignore promise rejections; collapse all failures into a generic 500 or `Error`.

```js
class ValidationError extends Error {}

async function sendEvent(payload) {
  const parsed = parseOrder(payload);
  if (!parsed.ok) throw new ValidationError(parsed.error);

  try {
    return await transport.post(parsed.value); // awaited — not a floating promise
  } catch (cause) {
    throw new Error("transport failed", { cause }); // preserve the cause
  }
}
```

## 12. Async, Promises, and Cancellation

Async must be explicit, bounded, observable, and tested; unhandled rejections crash or corrupt state.

- Always: `await` or intentionally handle every promise; use `AbortSignal`/cancellation for I/O and long operations; set timeouts; bound concurrency; avoid blocking the event loop with CPU-heavy synchronous work in services; propagate errors; test success/failure/timeout/cancellation.
- Prefer: `Promise.all` for all-or-nothing, `Promise.allSettled` for partial success; concurrency limiters for batch work; queue/worker abstractions for long-running work; `AbortController` integrated with fetch/DB/queues.
- Avoid: `array.forEach(async ...)` when awaiting is required; unbounded `Promise.all` over user-controlled arrays; infinite retries; sleeps as synchronization; fire-and-forget business operations; ignoring `signal.aborted`/timeout errors.
- Almost never: retry non-idempotent operations without protection; swallow background-worker failures; leave `unhandledRejection` unhandled at the process level.

## 13. Objects, Prototype Pollution, and Serialization

Objects are mutable maps with a shared prototype; merging untrusted data is a known vulnerability.

- Always: validate decoded data before use; use `JSON.parse`/`JSON.stringify` with care; treat unknown/missing fields deliberately; guard against `__proto__`/`constructor`/`prototype` keys when merging or assigning untrusted data; prefer `Map` for untrusted keys.
- Prefer: `Object.create(null)` or `Map` for dictionaries of untrusted keys; allow-listing keys when copying request data; schema validation that strips unknown fields; `structuredClone` for deep copies.
- Avoid: `Object.assign({}, untrusted)` / deep-merge of untrusted data without prototype-pollution defenses; using `{}` as a dictionary for untrusted keys; depending on object key order as a contract.
- Almost never: `eval`/`new Function` to parse data; deserialize untrusted data into privileged objects; treat decode success as business validation; reflect untrusted input into the DOM without escaping (XSS).

## 14. Time, Money, Security, and Dependencies

- Time: use explicit, timezone-aware handling; inject the current time when it affects behavior; UTC internally; ISO-8601 at boundaries; test boundary dates; never use local machine time as business truth.
- Money: avoid binary floating `number` for money where exactness matters; use integer minor units, BigInt, or a decimal library; define rounding; test boundary/zero/negative values.
- Security: validate/sanitize untrusted input; authorize at the application boundary (not only UI/middleware); use parameterized queries; avoid SQL/command/template injection, path traversal, SSRF, XSS, CSRF, prototype pollution, and unsafe deserialization; keep secrets out of code/logs/client bundles; use secure cookie/CORS/header/JWT defaults; use `crypto`-grade randomness for tokens; run `npm audit` and security lint rules.
- Dependencies: justify new runtime dependencies; prefer standard/runtime APIs for trivial functionality; review package health (maintenance, license, size, transitive deps, install scripts, provenance); run vulnerability checks after meaningful changes; keep dev/test/build dependencies out of production bundles.
- Almost never: `eval`/`new Function`/dynamic template execution; serialize secrets into frontend bundles; broad CORS; trust JWT contents without verifying signature/issuer/audience/expiry; disable TLS verification; accept install scripts from unknown packages without review.

## 15. Testing Strategy

Tests must prove behavior; without a type checker, they and runtime validation are the safety net.

- Always: add/update tests for changed behavior; test failure paths, boundary mappers, runtime validation, and async timeout/cancellation; keep tests deterministic; avoid real time/network/random/order/external dependence; use meaningful test names.
- Prefer: `node --test`/Vitest/Jest; unit tests for pure domain logic; integration tests for persistence/adapters; contract tests with fake servers for HTTP; golden tests for stable payloads; e2e for user-critical flows; property tests (fast-check) for validators/parsers; mutation testing for critical rules.
- Avoid: tests that only assert mocks were called; broad/sensitive snapshots; arbitrary sleeps; tests passing only in one timezone/locale/order; skipping tests without documenting why.
- Almost never: claim completion for business logic without automated tests; rely only on happy paths; mock the unit under test; use live production credentials.

## 16. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (formatting helpers, simple display logic, internal refactors): lint, format, basic tests.
- **Medium** (services, validation, adapters, API handlers): unit + failure-path tests, runtime boundary validation, integration, coverage.
- **High** (core rules, state machines, authorization, money/time): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, injection/XSS tests, async cancellation/timeout tests, security/dependency audit, mutation or property tests.

## 17. Coverage and Complexity Limits

Coverage is necessary but not sufficient; without types, branch coverage and failure-path tests matter
even more.

### Default coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Handlers / UI glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

### Complexity limits

|Item|Target|Maximum|ESLint rule|
|---|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|complexity|
|Function length|<= 30 lines|<= 50 lines|max-lines-per-function|
|File length|<= 400 lines|<= 600 lines|max-lines|
|Function parameters|<= 4|<= 6|max-params|
|Nesting depth|<= 2|<= 3|max-depth|
|Nested callbacks|<= 2|<= 3|max-nested-callbacks|
|Public exports per module|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with reason.

## 18. Quality Score Model

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Runs with weak tests, no lint evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and ESLint clean|
|76-90|Strong implementation with good tests, runtime-validated boundaries, low complexity, clean boundaries|
|91-100|Production-grade: ESLint clean, every untrusted boundary validated, strong tests with failure paths, no known security defects|

### Score caps

|Missing or Failed Evidence|Maximum Score|
|---|---|
|Syntax error / does not run under the project Node version|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|ESLint not run and not explained|60|
|Formatting not run and not explained|65|
|Business rules without unit tests|60|
|Runtime validation missing for new untrusted input boundaries|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Floating promises / unhandled rejections in changed code|75|
|Loose `==`/type coercion in security or money logic|80|
|`var`, `eval`, or broad eslint-disable used to pass|75|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit (`npm audit`) missing where applicable|85|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|55|
|Known security issue (injection/XSS/prototype-pollution/auth) remains|45|
|Secrets committed or bundled to the client|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass (format, ESLint clean, tests with coverage,
`npm audit`), every untrusted boundary is validated at runtime, promises are handled, complexity is
within limits, architecture is preserved, no known security defects remain, and `PHASE-RESULT.md`
contains evidence.

## 19. Definition of Done

Code runs on the project Node version; formatting passes; ESLint passes or findings are documented;
tests pass and meaningful tests were added; coverage meets the tier; complexity within limits or
justified; architecture preserved; business rules out of handlers/components/persistence/serialization;
every untrusted boundary validated at runtime; promises awaited/handled; strict equality used; no
secrets committed or bundled to the client; dependencies justified and `npm audit` clean (or
documented); `PHASE-RESULT.md` exists. For critical code, also golden/contract/error-path tests,
injection/XSS tests, audit/traceability, and mutation or property evidence.

## 20. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Lint / format results
## Coverage results
## Runtime validation evidence
## Async / rejection handling evidence (if applicable)
## Security / dependency audit results
## Architecture boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results and tests — not by confidence or a single run.

## 21. Final Checklist

Runs on the project Node version; format ran; ESLint ran with no warnings; tests pass, are meaningful,
cover failure paths; coverage measured or documented; complexity within limits; architecture preserved;
business rules out of handlers/components/persistence/serialization; every untrusted boundary validated
at runtime; no floating promises; strict equality; no `var`/`eval`; no secrets committed or bundled to
the client; `npm audit` clean or documented; `PHASE-RESULT.md` exists; quality score is evidence-based;
remaining work to reach 100 is documented.
