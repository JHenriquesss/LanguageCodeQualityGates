# TypeScript Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score constraints, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

> Master revision: this document is intentionally expansive. It is a TypeScript-native quality gate, not a mechanical Go-to-TypeScript translation. Go-only concepts were replaced with TypeScript compiler configuration, JavaScript runtime behavior, ESM/CJS module semantics, npm package management, async/concurrency, AbortSignal, browser/Node/edge runtimes, bundlers, decorators, generated types, type erasure, runtime validation, and JavaScript supply-chain controls.

## Purpose

This document defines the TypeScript language quality gate for implementation phases.

Its purpose is to prevent low-quality TypeScript code from being generated, accepted, copied into the project root, published, deployed, or treated as complete without measurable evidence.

This is not a style preference document. It is an engineering control document.

TypeScript gives teams a powerful type system, editor feedback, refactoring support, gradual typing, project references, declaration files, modern JavaScript syntax, and ecosystem reach across Node.js, browsers, workers, edge runtimes, CLIs, libraries, and build tools. TypeScript code can still be poor software. TypeScript code can still be:

- architecturally wrong
- over-abstracted
- under-abstracted
- falsely typed
- `any`-infected
- assertion-heavy
- null/undefined-prone
- promise-leaking
- cancellation-unsafe
- event-loop-blocking
- module-resolution fragile
- bundler-dependent without documentation
- runtime-invalid despite compiling
- under-tested
- unauditable
- dependency-heavy
- supply-chain risky
- vulnerable to prototype pollution, injection, SSRF, XSS, path traversal, deserialization, or secret leakage
- hard to understand
- hard to maintain
- legally/regulatorily wrong
- business-incorrect even when `tsc` passes

The implementation is not complete when files are created. The implementation is complete only when the code:

- type-checks under the project TypeScript configuration
- is formatted
- passes ESLint/static analysis or documents justified exceptions
- has meaningful automated tests
- preserves architectural boundaries
- validates untrusted input at runtime
- models failures explicitly
- avoids `any`, unsafe assertions, `@ts-ignore`, and unchecked casts unless justified
- handles promises, timeouts, retries, and cancellation deliberately
- controls module, package, workspace, and dependency sprawl
- is secure by default
- is auditable where required
- has measurable evidence in `PHASE-RESULT.md`

This document must be followed together with:

- `AGENTS.md`
- `PHASE-PLAN*.md`
- `QUALITY-GATES.md`
- `LANGUAGE-QUALITY-GATE.md`
- `architecture.md`
- `myrules.txt`
- framework-specific gates when present, such as React, Next.js, NestJS, Express, Fastify, Vite, Vitest, Playwright, Node, browser, worker, or library publishing gates

If this file conflicts with a phase-specific rule, follow the stricter rule unless the deviation is explicitly documented in `PHASE-RESULT.md`.

## 0. Reference Baseline

Use this document as the local rulebook, but align it with the authoritative references below when making technical decisions:

- TypeScript Handbook and TSConfig Reference: `https://www.typescriptlang.org/docs/` and `https://www.typescriptlang.org/tsconfig/`
- TypeScript release notes, especially when a project uses a recent compiler: `https://www.typescriptlang.org/docs/handbook/release-notes/`
- typescript-eslint typed linting and shared configurations: `https://typescript-eslint.io/`
- ESLint flat config and rule documentation: `https://eslint.org/docs/latest/`
- Node.js documentation for TypeScript execution, ESM/CJS packages, test runner, security, streams, workers, and runtime APIs: `https://nodejs.org/api/` and `https://nodejs.org/learn/`
- npm documentation for package scripts, lockfiles, audit, SBOM, publishing, provenance, and package metadata: `https://docs.npmjs.com/`
- package-manager documentation for the project-approved manager: npm, pnpm, Yarn, or Bun
- Prettier documentation for deterministic formatting: `https://prettier.io/docs/`
- OWASP ASVS, OWASP Top 10, OWASP API Security Top 10, and relevant cheat sheets: `https://owasp.org/`
- TC39 / ECMAScript specifications and MDN for JavaScript runtime behavior when TypeScript types disappear at runtime
- framework-specific official documentation when the project uses a framework

TypeScript is not a runtime safety system. The compiler erases types. Anything crossing a boundary must be validated, decoded, parsed, authorized, and tested as runtime JavaScript.

## 0. Normative Core (read this first)

This section is the enforceable summary of the whole gate. Everything below it is rationale and detail. At the end of any implementation, the LLM or engineer MUST verify every item here. If time or context is limited, obey this core and consult the numbered sections only when a check trips or needs detail.

### MUST (hard gate — a failure caps the score; see Score constraints)

1. Code typechecks: `tsc --noEmit` (or the project typecheck script).
2. Formatting passes: `prettier --check .` (or project script).
3. ESLint/static analysis passes; new findings fixed or justified: `eslint . --max-warnings=0`.
4. Tests pass and are meaningful for changed behavior, including failure paths (project test runner).
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

Report 0-100. Apply the Score constraints. State the evidence for the score and the remaining work to reach 100. The detailed sections below expand each item with Always / Prefer / Avoid / Almost-never guidance.

### Scope by risk tier (read this when planning)

Before implementing, classify the change and scope the plan and the review to its tier. Do not apply critical-tier rigor to a throwaway script, and do not ship business rules with only low-tier checks. When planning, list which checks apply for the tier and state any intentionally excluded and why. Detail: see the "Test Types Required by Risk" section below.

- Low (formatting helpers, simple display logic, internal non-critical refactors): typecheck, format, lint, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters, API handlers): add failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, legal/financial/compliance, audit, data integrity): add golden/contract tests, error/rejection paths, audit/traceability, async cancellation/timeout tests, mutation or property tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

The implementation LLM must not declare the phase complete merely because TypeScript code was written.

A phase is complete only when:

1. The planned implementation exists.
2. Relevant automated tests exist.
3. The code type-checks.
4. Formatting was checked.
5. ESLint and configured static-analysis tools were executed where available.
6. The applicable quality gates were executed.
7. Failures were fixed or documented.
8. `PHASE-RESULT.md` was created.
9. The quality score is supported by evidence.

`PHASE-RESULT.md` must exist before the final message is sent.

The final message must be exactly:

```text
I finished the implementation
```

No extra words. No summary. No apology. No markdown.

### TypeScript hardening

- Completion requires evidence from the exact repository state that will be handed off, not from a scratch directory, stale branch, partial copy, transpiled output only, or editor-only diagnostics.
- Generated TypeScript, generated declaration files, generated clients, generated validators, and generated schemas count as implementation and must satisfy this gate unless explicitly excluded with a reason.
- A successful test run alone is not enough when the phase changed type contracts, runtime validation, public API, dependency graph, package exports, bundling, serialization, authorization, persistence, security, or legal/audit behavior.
- Any skipped command must include the concrete blocker, not vague text such as “tool unavailable.”
- Any command run from the wrong package/workspace is invalid evidence.
- Any command run before final code changes is stale evidence.
- Any manual test must be described as manual evidence and must not replace automated tests for business logic.
- `PHASE-RESULT.md` must explain residual risk in plain language.
- The implementation LLM must not inflate the quality score for code that lacks failure-path tests.
- The final response rule is part of the gate because premature summaries often hide missing evidence.

## 2. TypeScript Toolchain Policy

### Recommendation

Use the TypeScript, Node.js, package manager, and runtime versions defined by the project.

Quality depends on a clear, explicit, documented toolchain policy. TypeScript behavior is affected by compiler version, `tsconfig`, package-manager resolution, runtime, module system, bundler, test runner, and framework.

For new TypeScript projects, prefer:

- the latest project-approved stable TypeScript release
- an active LTS Node.js version for production Node applications
- one project-approved package manager with an enforced lockfile
- `strict` compiler settings
- ESM/CJS strategy documented deliberately
- boring, explicit TypeScript over type gymnastics

### Always do

- Use the TypeScript version already defined by the project.
- Use the Node/runtime version already defined by `.nvmrc`, `.node-version`, `engines`, Volta, mise, Docker, CI, or project policy.
- Use the project-approved package manager and lockfile.
- Document `node --version`, package-manager version, `tsc --version`, and relevant runtime/bundler versions in `PHASE-RESULT.md`.
- Keep compiler, runtime, bundler, and test-runner assumptions consistent across packages unless intentionally mixed.
- Keep CI-equivalent commands runnable locally.
- Use stable TypeScript and stable runtime versions unless the project explicitly requires development, beta, nightly, or canary builds.
- Document any compiler, runtime, package-manager, transpiler, or bundler change.
- Verify that dependency additions do not silently require a higher Node, TypeScript, browser, or framework version.
- Verify behavior under the intended runtime target: Node, browser, worker, edge, serverless, Electron, React Native, Bun, Deno, or library consumers.

### Prefer

- Active LTS Node for production services unless the project has a documented reason to use Current.
- A pinned package-manager version through Corepack, Volta, mise, asdf, or project policy.
- `packageManager` in `package.json` for package-manager reproducibility.
- `engines` for runtime compatibility when publishing or deploying packages.
- Explicit TypeScript build mode for monorepos.
- Standard language features over build-tool magic.
- Stable runtime APIs over experimental APIs in production.

### Avoid

- Relying on whatever Node/TypeScript version is installed locally.
- Upgrading TypeScript only because a dependency forced it accidentally.
- Using new TypeScript syntax that the project’s compiler, runtime, bundler, or type stripper cannot support.
- Depending on global `ts-node`, global package managers, global linters, or IDE state.
- Depending on local package-manager cache state.
- Changing ESM/CJS assumptions without documenting runtime and publishing impact.
- Treating a successful local bundle as evidence for all targets.

### Almost never do

- Use TypeScript nightly in production business code without a documented architectural reason.
- Hide required versions only in developer notes.
- Disable `strict` globally to finish a phase.
- Use runtime/bundler changes as a substitute for clean design.
- Change Node, browser, edge, serverless, or bundler assumptions inside a phase without documenting why.

## 3. `tsconfig.json` Policy

### Recommendation

`tsconfig.json` is a language contract. Treat it as source code.

A project can compile and still be dangerously loose. Strong TypeScript requires strong compiler settings and a clear boundary between source, tests, generated files, declarations, and build output.

### Always do

- Preserve the project’s existing `tsconfig` hierarchy.
- Keep `strict: true` unless an existing legacy migration explicitly says otherwise.
- Run `tsc --noEmit` or the project’s equivalent typecheck command.
- Document any `tsconfig` changes.
- Keep include/exclude patterns precise.
- Do not hide broken files by excluding them unless the exclusion is intentional and documented.
- Use `noEmit` for typecheck-only configs.
- Use build configs for emitted output.
- Keep test and production configs separate when their environments differ.
- Keep generated-code configs explicit.

### Recommended strictness baseline

For new or high-quality TypeScript projects, prefer a baseline similar to this, adjusted to project runtime:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": false
  }
}
```

`skipLibCheck` may be temporarily accepted for legacy dependency conflicts, but it must be documented as technical debt because it suppresses checks in declaration files.

### Prefer

- `module` and `moduleResolution` that match the actual runtime and bundler.
- `nodenext`/`node16`/`node20` only when Node package semantics are intended.
- `bundler` resolution only when a bundler is truly the module resolver.
- project references for large monorepos and libraries.
- `composite` builds for package boundaries.
- environment-specific libs, such as not including `dom` in backend packages unless needed.
- separate `tsconfig.typecheck.json`, `tsconfig.build.json`, and `tsconfig.test.json` when this clarifies behavior.

### Avoid

- `strict: false`.
- `allowJs` by accident.
- `checkJs: false` in mixed JS/TS migration areas without a migration plan.
- `skipLibCheck: true` as a permanent default in greenfield code.
- `suppressImplicitAnyIndexErrors`.
- broad `include: ["**/*"]` that pulls in build output or config scripts unintentionally.
- allowing tests to loosen production type safety.
- adding path aliases without ensuring runtime/bundler/test resolution matches them.

### Almost never do

- Use `// @ts-nocheck` in production files.
- Loosen global compiler settings to fix one bad dependency or one weak file.
- Turn declaration emit on or off for public libraries without reviewing API impact.
- Change module target in a library without testing package consumers.

## 4. Package Manager, Lockfile, and Workspace Reproducibility

### Recommendation

The build must be reproducible from a clean checkout using documented commands.

TypeScript projects often fail because package manager, lockfile, workspace, peer dependency, and transitive dependency behavior differs between machines.

### Always do

- Use exactly one project-approved package manager unless the repository intentionally supports multiple.
- Commit the correct lockfile: `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`, or `bun.lock` according to policy.
- Keep dependency versions intentional.
- Keep dependency graph changes small.
- Use frozen/immutable lockfile installation in CI-equivalent verification.
- Avoid hidden dependence on global packages.
- Avoid hidden dependence on local linked packages unless the workspace explicitly defines them.
- Make build commands documented in `PHASE-RESULT.md`.
- Keep build behavior independent from IDE state.
- Keep build behavior independent from uncommitted local files.

### Prefer

- `npm ci` for npm CI installs.
- `pnpm install --frozen-lockfile` for pnpm CI installs.
- `yarn install --immutable` for Yarn Berry CI installs.
- Corepack-managed package-manager versions.
- workspaces for multi-package repositories with deliberate boundaries.
- minimal runtime dependencies.
- test/dev dependencies that do not leak into production bundles.
- package-manager audit/signature/provenance features where supported.

### Avoid

- committing multiple lockfiles accidentally.
- installing with a different package manager than CI.
- broad dependency upgrades unrelated to the phase.
- `npm install` churn that updates the lockfile accidentally.
- peer dependency warnings ignored without review.
- local `file:` dependencies that only work on one machine.
- git/tarball dependencies without a documented reason.

### Almost never do

- Delete the lockfile to make installation pass.
- Commit dependency changes unrelated to the phase.
- Add dependencies for trivial helpers.
- Use postinstall scripts as an architecture escape hatch.
- Fetch remote resources during normal generation/build without explicit approval.

## 5. Mandatory Command Evidence

The implementation LLM must run applicable commands and document the result in `PHASE-RESULT.md`.

If a command cannot be run, the reason must be documented.

### Baseline commands

Use project scripts when they exist. The names below are examples and must be adapted to the repository.

- `node --version`
- package manager version: `npm --version`, `pnpm --version`, `yarn --version`, or `bun --version`
- `npx tsc --version` or package-manager equivalent
- frozen install when dependencies changed, such as `npm ci`, `pnpm install --frozen-lockfile`, or `yarn install --immutable`
- `npm run typecheck` or `tsc --noEmit`
- `npm run lint` or `eslint . --max-warnings=0`
- `npm run format:check` or `prettier --check .`
- `npm test` or project test command
- `npm run build` when emitted artifacts, bundles, or package exports are affected

### Stronger baseline for applications/services

- `npm run test -- --runInBand` or equivalent deterministic mode when flakes are suspected
- `npm run test:coverage`
- `npm run test:e2e` when transport/API behavior changed
- `npm run test:integration` when external adapters or persistence changed
- `npm audit --audit-level=high` or project-approved vulnerability scan
- `npm sbom --sbom-format=cyclonedx` or project-approved SBOM generation when supply-chain evidence is required
- `npm run build && npm run start:prod` or equivalent smoke check when application packaging changed
- Docker/container build when deployment images changed

### Stronger baseline for packages/libraries

- `npm run build`
- declaration generation check
- API surface check, such as API Extractor or project equivalent when configured
- `npm pack --dry-run`
- consumer smoke test from packed artifact when exports/types changed
- package export/import tests for both ESM and CJS when dual-publishing
- provenance-ready publish workflow review when publishing is affected

### Optional but recommended when configured

- `eslint . --max-warnings=0`
- `tsc -b --verbose`
- `vitest run --coverage`, `jest --coverage`, or `node --test --experimental-test-coverage`
- `playwright test`
- `stryker run` for mutation testing
- `fast-check` property tests
- `knip` for unused files/dependencies/exports
- `depcheck` where suitable
- `madge` or dependency-cruiser for architecture/import cycles
- `npm audit signatures`
- SAST/secret scans: `semgrep`, `gitleaks`, `trufflehog`, project-approved scanners
- bundle-size analysis when frontend or serverless bundle changed
- performance profiling/benchmarks for performance-sensitive phases

### Required evidence format

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
```

### TypeScript hardening

- A command that was not run is not evidence.
- A command that failed but was ignored is negative evidence.
- A command that failed because a tool is unavailable must still be documented.
- A command run outside the correct workspace/package is invalid evidence.
- A typecheck that skips files through bad `include`/`exclude` patterns is weak evidence.
- A build that succeeds through transpile-only mode is not type-safety evidence.
- A test run without failure-path coverage is insufficient for business logic.

## 6. Formatting and Style

### Recommendation

Use the project formatter. Do not debate formatting. Automate it.

### Always do

- Run formatting checks.
- Keep formatting deterministic.
- Keep imports clean.
- Avoid formatting churn unrelated to the phase.
- Keep generated output stable.
- Respect project conventions for semicolons, quotes, trailing commas, line width, import ordering, and file naming.

### Prefer

- Prettier for general formatting.
- ESLint for correctness and maintainability rules, not broad formatting fights.
- automated import sorting only when project-approved.
- small cohesive files.
- clear top-level ordering: imports, constants, types, schemas, functions/classes, exports.
- explicit named exports over sprawling default-export habits when the project does not require defaults.

### Avoid

- hand-formatting fights against Prettier.
- reformatting unrelated files.
- mixing formatter ownership between Prettier, ESLint, IDE, and framework defaults.
- long functions hidden by formatting.
- giant barrel files that hide dependency direction.

### Almost never do

- Disable formatting checks.
- Leave code unformatted.
- Commit generated formatting churn without reason.
- Use formatting to hide overly complex code.

## 7. ESLint, Static Analysis, and Suppression Policy

### Recommendation

ESLint and configured static analysis must be treated as quality gates, not suggestions.

TypeScript compiler checks types. Linters catch different classes of problems: unsafe promises, unsafe `any`, floating promises, misuse of async callbacks, unused variables, restricted imports, dead code, complexity, and security patterns.

### Always do

- Run the configured linter.
- Use type-aware linting where the project supports it.
- Treat new warnings as failures unless explicitly justified.
- Keep suppressions narrow.
- Add a reason when suppressing a rule.
- Avoid blanket exclusions.
- Document new suppressions in `PHASE-RESULT.md`.

### Prefer

- `@typescript-eslint` strict type-checked configurations.
- rules that prevent:
  - `no-floating-promises`
  - `no-misused-promises`
  - `no-unsafe-assignment`
  - `no-unsafe-member-access`
  - `no-unsafe-call`
  - `no-unsafe-return`
  - `restrict-template-expressions`
  - `strict-boolean-expressions`
  - `consistent-type-imports`
  - `no-explicit-any`
  - `prefer-nullish-coalescing`
  - `prefer-optional-chain`
  - `switch-exhaustiveness-check`
- project-specific import restrictions to enforce architecture.
- local disable comments with exact rule names and human reasons.

### Avoid

- disabling rules because generated-looking code is easier to produce.
- broad `/* eslint-disable */` blocks.
- suppressing unsafe `any` propagation.
- ignoring promise-related findings.
- ignoring import-boundary findings.
- leaving `console.log` debug output in production unless policy allows it.

### Almost never do

- Disable ESLint for critical packages.
- Disable type-aware linting to finish a phase.
- Suppress security, promise, unsafe, or boundary findings in legal, financial, security, signing, persistence, or audit code.
- Treat linter output as cosmetic when it identifies real risk.

## 8. Naming Rules

### Recommendation

Names must reveal intent.

A maintainer should understand the purpose of a type, function, module, class, interface, schema, test, hook, component, or package without reading its full implementation.

### Always do

- Use domain language.
- Use precise names.
- Name functions by behavior.
- Name modules by responsibility.
- Name tests by expected behavior.
- Distinguish raw data from validated data.
- Distinguish DTOs from domain objects.
- Distinguish synchronous, asynchronous, cancellable, cached, persisted, signed, and validated states where relevant.

### Prefer

- `EmployeeExposurePeriod` over `PeriodData`.
- `PaymentEventBatch` over `Batch`.
- `SignedXmlDocument` over `XmlResult`.
- `OccupationalRiskAssessment` over `RiskInfo`.
- `EventTransmissionReceipt` over `ResponseData`.
- `validateEventVersion` over `processVersion`.
- `canBeCancelled` over `checkStatus`.
- `RawEventPayload` for untrusted input.
- `ValidatedEventPayload` after validation.
- `UnsignedXmlDocument` before signing.
- `SignedXmlDocument` after signing.
- `Id`, `Url`, `Xml`, `Json`, `Api` capitalization consistent with project convention.

### Avoid

- `helper`, `utils`, `common`, `misc`, `shared`, `manager`, `processor`, `handler`, `data`, `thing`, `object`, `item` without a domain reason.
- ambiguous booleans such as `flag`, `enabled`, `valid`, `state` without context.
- overloading one term with multiple meanings.
- naming domain concepts after database tables, framework artifacts, or provider payloads by default.
- allowing generated names to define the business vocabulary.

### Almost never do

- Use placeholder names in production code.
- Use single-letter names outside tiny local scopes or common generic parameters.
- Use `TData`, `TResult`, `Thing`, `Stuff`, or `Object` when a domain name exists.
- Let transport naming leak into domain rules without review.

## 9. Project, Module, and Package Structure

### Recommendation

TypeScript modules and packages must reflect architecture, not random grouping.

A good structure makes invalid dependencies visible and hard to introduce.

### Always do

- Preserve `architecture.md`.
- Keep domain logic separate from infrastructure.
- Keep application/use-case orchestration separate from adapters.
- Keep API/transport models separate from domain models.
- Keep external clients outside the domain.
- Keep module visibility narrow through exports.
- Keep public package surface small.
- Avoid exporting internals accidentally.
- Keep import cycles out of the design.

### Prefer

For a single service:

```text
src/
  domain/
    employee/
    regulatory/
    audit/
  application/
    send-event/
    cancel-event/
    ports/
  infrastructure/
    postgres/
    signer/
    regulatory-client/
    clock/
  transport/
    http-api/
    queue/
  config/
  main.ts
```

For a library/package:

```text
src/
  index.ts              # intentional public API
  public-feature/
  internal/             # not exported through package exports
  generated/            # isolated generated code
  testing/              # exported only if intentionally public
```

For a monorepo:

```text
packages/
  domain/
  application/
  infrastructure-postgres/
  api-http/
  app-service/
  config-eslint/
  config-tsconfig/
```

### Avoid

- one huge `index.ts`.
- one giant `types.ts` containing unrelated concepts.
- one giant `utils/` directory.
- domain importing infrastructure, HTTP frameworks, SQL clients, loggers, queue clients, or generated external payloads.
- API handlers containing business rules.
- infrastructure returning provider-specific models into the domain.
- barrels that create import cycles or hide architecture.
- exporting everything because tests were placed poorly.

### Almost never do

- Put business rules in:
  - HTTP handlers
  - React components
  - database adapters
  - XML/JSON builders
  - generated API clients
  - message consumers
  - CLI argument parsing
  - framework decorators
- Create a shared package that becomes a dumping ground.
- Let package structure be dictated by a generator.

## 10. Architectural Boundaries

### Recommendation

Business rules must be explicit, isolated, and tested.

TypeScript modules, package exports, import rules, interfaces, dependency direction, and runtime validation should enforce boundaries rather than bypass them.

### Always do

- Keep dependency direction inward.
- Put business rules in domain/application modules.
- Put side effects in infrastructure/adapters.
- Use ports/interfaces at boundaries where useful.
- Keep handlers thin.
- Keep persistence code focused on persistence.
- Keep external clients focused on communication.
- Keep serialization separate from business decisions.
- Test boundary mappers.
- Keep framework-specific types out of the domain.

### Prefer

- domain value objects with invariants.
- application services/use cases for orchestration.
- interfaces for persistence, clocks, signing, storage, external APIs, messaging.
- adapter implementations outside the core.
- DTO-to-domain mappers at boundaries.
- domain errors separate from infrastructure errors.
- package export maps to enforce public API boundaries.
- lint/import restrictions for critical boundaries.

### Avoid

- domain depending on Express, Fastify, NestJS, React, Prisma, TypeORM, SQL drivers, Redis clients, Axios/fetch wrappers, logging frameworks, or generated provider payloads unless architecture explicitly allows it.
- handlers calling database code directly for business workflows.
- infrastructure deciding domain outcomes.
- API DTOs reused as domain objects.
- database records reused as API responses.
- business rules hidden in decorators or schema annotations only.
- letting `Request`, `Response`, `NextFunction`, framework context, or transaction types leak into domain logic.

### Almost never do

- Hide business decisions inside SQL queries.
- Hide legal rules inside XML/JSON serialization.
- Hide validation only inside UI forms or transport schemas.
- Change architecture inside a phase without documenting the reason.
- Make domain correctness depend on a framework.
- Put audit/legal decisions in logging side effects.

## 11. Type System as a Quality Tool

### Recommendation

Use TypeScript’s type system to make invalid states hard to represent, while remembering that TypeScript types disappear at runtime.

Do not use strings, booleans, objects, arrays, maps, `any`, or raw primitives when a meaningful domain type is needed.

### Always do

- Use domain types for important identifiers and constrained values.
- Use discriminated unions for closed state sets.
- Use branded/opaque types when raw primitives are too ambiguous.
- Use readonly data where mutation is not intended.
- Keep invariants enforced at construction or parsing.
- Distinguish untrusted, validated, signed, sent, rejected, and persisted states in types where useful.
- Use parsing/validation functions for fallible construction.
- Pair static types with runtime validation at boundaries.

### Prefer

```ts
type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type EmployeeId = Brand<string, "EmployeeId">;
export type EventVersion = "S-2210" | "S-2220" | "S-2240";

export type EventStatus =
  | { readonly kind: "draft" }
  | { readonly kind: "validated" }
  | { readonly kind: "signed"; readonly signatureId: string }
  | { readonly kind: "sent"; readonly protocol: string }
  | { readonly kind: "rejected"; readonly reasonCode: string };
```

### Avoid

- `Record<string, any>` as a domain model.
- `Record<string, unknown>` as a permanent business model without decoding.
- `any` in domain APIs.
- `as SomeType` after parsing untrusted input without validation.
- Boolean flags that change behavior.
- primitive obsession for important concepts.
- invalid intermediate states.
- domain code that accepts raw transport payloads.
- business state represented by magic strings.

### Almost never do

- Represent legal/event state as arbitrary strings.
- Represent money, dates, measurements, certificates, event IDs, or legal codes as unvalidated raw primitives in domain code.
- Use comments to describe invariants that types could enforce.
- Use generic objects for regulatory event structures.

## 12. `any`, `unknown`, Assertions, and Suppression Gate

### Recommendation

`any` is a type-safety escape hatch. Treat it as unsafe.

`unknown` is the correct type for untrusted data until it is decoded or narrowed.

### Always do

- Prefer `unknown` for untrusted input.
- Validate and narrow `unknown` before use.
- Keep `any` out of domain, application, persistence, signing, security, legal, and audit code unless explicitly justified.
- Keep type assertions local and justified.
- Avoid double assertions like `value as unknown as T`.
- Avoid non-null assertions unless the invariant is obvious and tested.
- Avoid `@ts-ignore`; use `@ts-expect-error` only in tests or narrow compatibility cases with a reason.
- Document every production `@ts-expect-error`, `@ts-ignore`, and `@ts-nocheck` in `PHASE-RESULT.md`.

### Prefer

- runtime schemas such as project-approved validators.
- explicit type guards.
- parser functions returning typed results.
- `satisfies` to validate literal conformance without widening.
- `as const` for safe literal narrowing.
- exhaustive switches with `never` checks.

### Avoid

- assertions immediately after JSON parsing.
- `JSON.parse(...) as T`.
- `fetch(...).then(r => r.json() as Promise<T>)` without validation.
- `as any` to call private internals.
- using `!` to silence null checks from DOM, maps, configs, or dependency lookups.
- changing types to `any` because tests are hard.

### Almost never do

- Add `// @ts-nocheck` to production code.
- Use `any` as a bridge across architecture boundaries.
- Use unsafe assertions in regulatory, signing, persistence, security, or audit code.
- Treat generated declarations as trustworthy without contract tests.

## 13. Null, Undefined, Optionality, and Absence Semantics

### Recommendation

Use `null`, `undefined`, optional properties, empty arrays, and missing fields only when their semantics are deliberate and tested.

### Always do

- Distinguish missing, undefined, null, empty, zero, and invalid values when the contract cares.
- Use `exactOptionalPropertyTypes` in strict projects.
- Validate required fields before constructing domain objects.
- Avoid ambiguous return types where `undefined` could mean not found, invalid, unauthorized, or failed.
- Test absent, null, empty, zero, and invalid values separately when behavior differs.

### Prefer

- `Result<T, E>` style or typed errors where failure reason matters.
- `T | undefined` for ordinary lookup absence.
- domain-specific absence states when absence has business meaning.
- discriminated unions instead of optional fields spread across a large object.
- explicit `null` only when an external contract uses it or business meaning requires it.

### Avoid

- optional fields everywhere because generated DTOs use them.
- `null` and `undefined` interchangeably.
- returning `undefined` for technical failures.
- `value || fallback` when `0`, `false`, or empty string are valid.
- `Partial<T>` as a business object.
- `DeepPartial<T>` outside patch/update boundaries.

### Almost never do

- Hide a technical failure as `undefined`.
- Use non-null assertions to bypass real absence.
- Collapse validation failures into empty objects.
- Let `undefined` serialize accidentally into omitted JSON fields when the API contract requires explicit null or field presence.

## 14. Immutability and Mutation

### Recommendation

Prefer immutable data and explicit state transitions.

Mutation must preserve invariants and be local, visible, and tested.

### Always do

- Use `readonly` fields/properties where mutation is not intended.
- Avoid exposing mutable arrays/maps from domain objects.
- Copy arrays, maps, sets, buffers, and objects at boundaries when ownership is unclear.
- Make state transitions explicit.
- Test transition matrices for critical workflows.
- Avoid global mutable state.

### Prefer

- immutable value objects.
- pure functions for domain calculations.
- explicit methods such as `sign`, `send`, `reject`, `cancel`, `correct`.
- reducers/state machines for complex state transitions.
- `ReadonlyArray<T>`, `ReadonlyMap<K, V>`, and `ReadonlySet<T>` for read-only contracts.
- patch/update command types rather than mutating DTOs.

### Avoid

- exported mutable domain objects.
- mutation through unrelated layers.
- setter-heavy domain objects that can exist in invalid intermediate states.
- mutating DTOs received from callers.
- mutating shared module-level arrays/objects.
- assuming `readonly` creates runtime immutability.

### Almost never do

- Use global mutable registries for business behavior.
- Use initialization side effects to configure domain rules.
- Mutate imported singleton objects during tests or runtime.
- Depend on object identity where value semantics would be clearer.

## 15. Error Handling and Result Modeling

### Recommendation

TypeScript errors must be explicit, meaningful, and safe.

Throwing exceptions is sometimes appropriate, but business outcomes and recoverable failures should be modeled so callers can handle them deliberately.

### Always do

- Distinguish validation failure, business rejection, authorization failure, conflict, timeout, cancellation, dependency failure, and internal bug.
- Preserve root cause where safe.
- Avoid leaking sensitive internals to external responses.
- Test failure paths.
- Keep error semantics stable for important business behavior.
- Use `Error` subclasses or structured error objects where callers need programmatic handling.
- Handle promise rejections.

### Prefer

```ts
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

- typed domain errors for business outcomes.
- thrown exceptions for unrecoverable or truly exceptional failures at infrastructure boundaries.
- `cause` for wrapping errors where supported.
- error codes for auditable/legal failures.
- user-safe messages plus internal traceability.
- one layer responsible for logging a failure with useful context.

### Avoid

- throwing strings or plain objects.
- vague errors such as `new Error("failed")`.
- parsing error messages in production logic.
- swallowing errors.
- `catch {}` without a reason.
- catching and returning fake success.
- logging and rethrowing at every layer.
- treating business rejection as infrastructure failure.
- treating infrastructure failure as business rejection.

### Almost never do

- Ignore promise rejections.
- Use exceptions for expected validation control flow in hot code where explicit results would be clearer.
- Collapse all failures into HTTP 500 or generic `Error`.
- Leak provider payloads, SQL errors, secrets, tokens, XML, certificate material, or stack traces to external clients.

## 16. Exceptions, Process Exit, TODO, and Debug Policy

### Recommendation

Production TypeScript must not rely on crashes or debug leftovers for normal control flow.

### Always do

- Remove TODO stubs, `throw new Error("not implemented")`, and debug prints before completion.
- Avoid `process.exit` outside CLI/main composition code.
- Avoid `console.log` debug statements in production paths unless project policy allows it.
- Avoid unhandled rejections and uncaught exceptions.
- Document intentional crash behavior in `PHASE-RESULT.md`.
- Use top-level error boundaries for services, CLIs, jobs, workers, and request handlers.

### Prefer

- returning typed errors for recoverable failures.
- explicit crash-on-startup for invalid mandatory configuration.
- framework error middleware/filters that map errors safely.
- supervision for background jobs and message consumers.
- `AbortSignal` and shutdown hooks for graceful termination.

### Avoid

- `throw` after parsing external input when callers can recover.
- `process.exit` in reusable modules.
- `console.error` as the only failure handling.
- debug-only sleeps/timeouts.
- `TODO`, `FIXME`, `HACK`, and commented-out code in completed phase output.

### Almost never do

- Crash a worker/service for ordinary business rejection.
- Use uncaught exceptions as retry control flow.
- Leave `debugger` statements in production code.
- Hide failed background work because it was logged.

## 17. Async, Promises, Event Loop, and Cancellation

### Recommendation

Async TypeScript must be explicit, bounded, observable, and tested.

Promises make it easy to create hidden concurrency, unhandled rejections, race conditions, memory leaks, partial failures, retry storms, and event-loop blocking.

### Always do

- `await` or intentionally handle every promise.
- Use lint rules to reject floating promises.
- Use `AbortSignal`/cancellation where supported for I/O and long-running operations.
- Set timeouts for external I/O.
- Bound concurrency.
- Avoid blocking the event loop with CPU-heavy synchronous code in services.
- Propagate errors from async work.
- Test success, failure, timeout, cancellation, and retry behavior.
- Document retry and idempotency semantics.

### Prefer

- `Promise.all` for independent all-or-nothing work.
- `Promise.allSettled` for independent partial-success workflows.
- concurrency limiters for batch work.
- queue/worker abstractions for long-running work.
- structured task supervision for background jobs.
- `AbortController` integrated with fetch, database clients, queues, and application operations where possible.
- fake timers for deterministic tests.

### Avoid

- `array.forEach(async () => ...)` when awaiting is required.
- unbounded `Promise.all` over large or user-controlled arrays.
- infinite retries.
- sleeps as synchronization.
- fire-and-forget business operations.
- ignoring `signal.aborted` or timeout errors.
- doing CPU-heavy JSON/XML/crypto/compression/transformation work on the event loop without reviewing impact.

### Almost never do

- Send legal/regulatory events fire-and-forget.
- Retry non-idempotent operations without protection.
- Swallow background-worker failures.
- Use promise chains to hide complex business flows.
- Depend on runtime scheduling for correctness.

## 18. Runtime Validation and Boundary Decoding

### Recommendation

Every untrusted boundary must validate at runtime.

TypeScript types do not validate JSON, form data, URL params, headers, database records, queue messages, environment variables, generated clients, XML, files, or third-party responses.

### Always do

- Validate all external input before domain use.
- Validate all external service responses before trusting them.
- Validate environment variables at startup.
- Validate database records where schema drift or nullable columns can violate assumptions.
- Keep schemas/parsers near boundaries.
- Map validated data into domain types.
- Test valid, invalid, missing, null, extra, malformed, and boundary cases.

### Prefer

- project-approved schema libraries.
- hand-written parsers for critical domains where custom error semantics matter.
- strict object parsing for APIs that reject unknown fields.
- versioned schemas for public APIs and legal payloads.
- safe parsing results rather than throwing inside bulk operations when partial failure is required.

### Avoid

- `JSON.parse(...) as DomainType`.
- trusting generated OpenAPI/GraphQL/gRPC clients without response validation where the provider is untrusted or legally critical.
- using UI validation as the only validation.
- relying only on database constraints for domain invariants.
- letting validation libraries define domain language accidentally.

### Almost never do

- Make business decisions from unvalidated `unknown`/`any`.
- Accept legal/financial/security payloads because they match a loose interface.
- Treat deserialization success as business validation.
- Allow validation errors to omit field path, rule, and safe diagnostic information.

## 19. Interfaces, Classes, Functions, and Generics

### Recommendation

Abstractions should model real variation, public contracts, or architectural boundaries.

Do not create abstractions only because generated code looks sophisticated.

### Always do

- Keep interfaces small and behavior-focused.
- Define interfaces near consumers when they represent ports.
- Use concrete types when there is no meaningful abstraction.
- Use generics only when they reduce duplication without hiding business meaning.
- Keep type parameters readable.
- Document public interfaces.
- Avoid exposing unnecessary type parameters.

### Prefer

- ports for repository, clock, signer, event sender, storage, message publisher, and external client boundaries.
- concrete domain types inside domain logic.
- discriminated unions for variant business states.
- classes only when identity, encapsulated invariants, lifecycle, or polymorphism helps.
- functions and plain objects for stateless transformations.
- generic helpers for infrastructure-level reusable mechanics, not domain shortcuts.

### Avoid

- creating interfaces for every class.
- single-implementation interfaces without boundary/testing value.
- mock-driven abstractions that do not reflect real design.
- `T extends object` everywhere.
- complex conditional/mapped type machinery for business code that maintainers cannot understand.
- inheritance hierarchies where unions/composition would be simpler.

### Almost never do

- Use generics to avoid modeling business concepts.
- Create package cycles and then add interfaces merely to hide them.
- Expose complex generic public APIs without consumer tests.
- Depend on runtime class names for business behavior after bundling/minification.

## 20. Modules, Imports, ESM/CJS, and Package Exports

### Recommendation

Module behavior must be explicit and tested. TypeScript, Node, bundlers, test runners, and package consumers can resolve modules differently.

### Always do

- Document whether the package/application is ESM, CJS, dual, or bundler-only.
- Keep `package.json` `type`, `exports`, `imports`, `main`, `module`, and `types` consistent.
- Verify runtime import paths, not only TypeScript compile paths.
- Ensure path aliases work in typecheck, test, runtime, and bundling.
- Keep type-only imports explicit where required.
- Avoid import cycles.
- Test package exports when public API changes.

### Prefer

- explicit file extensions where Node ESM requires them.
- `verbatimModuleSyntax` for clear import/export behavior.
- `import type` for type-only imports.
- export maps for package boundary control.
- small intentional public API entrypoints.
- consumer fixtures for published packages.

### Avoid

- relying on `tsconfig.paths` without runtime support.
- mixing CJS and ESM accidentally.
- default-export churn that breaks tree-shaking or refactoring.
- giant barrel files that create cycles.
- importing from `dist/`, private internals, or deep paths unless public exports allow it.
- changing package exports without testing downstream import patterns.

### Almost never do

- Publish a package with untested declarations.
- Ship dual ESM/CJS packages without verifying both entrypoints.
- Use bundler-only import semantics in Node-runtime code.
- Depend on transpile-only loaders in production without a typecheck gate.

## 21. Code Generation, Reflection, Decorators, and Metadata

### Recommendation

Code generation, reflection, decorators, and metadata must be deterministic, reviewed, and justified.

They can remove repetition, but they can also hide business rules and create runtime behavior that the type system does not prove.

### Always do

- Prefer ordinary TypeScript before generation/reflection.
- Keep generated code deterministic.
- Mark generated files clearly.
- Commit generated code when project policy requires it.
- Document generation commands.
- Test generated behavior.
- Keep generated code separate from domain logic.
- Keep decorator side effects explicit.
- Avoid relying on experimental metadata without a project policy.

### Prefer

- schema-driven clients/DTOs isolated from domain objects.
- generated types plus hand-written validated mappers.
- golden tests for generated payloads.
- deterministic templates with stable ordering.
- explicit decorator usage at framework boundaries only.

### Avoid

- hiding business validation in generated code.
- using decorators as invisible business logic.
- reflection for normal control flow.
- generators that output timestamps, absolute paths, machine-specific metadata, or nondeterministic order.
- hand-editing generated files.

### Almost never do

- Hide legal/regulatory behavior in template expansion.
- Use decorator metadata as the only source of authorization, validation, or audit rules.
- Generate unsafe `any`-heavy clients and pass them into domain logic directly.
- Add a generator casually to avoid writing clear code.

## 22. Serialization, JSON, XML, and External Payloads

### Recommendation

Serialization is a boundary concern.

Do not let JSON/XML tags, provider payloads, generated schemas, or database rows define the domain model accidentally.

### Always do

- Use DTOs at boundaries.
- Validate decoded data before domain use.
- Keep domain invariants independent from serialization.
- Test payload shape when it is part of the contract.
- Treat unknown fields deliberately.
- Treat missing fields deliberately.
- Keep versioning explicit.
- Avoid exposing internal types unintentionally.
- Make default values explicit and tested.
- Test serialization and deserialization errors.

### Prefer

- dedicated request/response DTOs.
- dedicated XML/event models for legal payloads.
- explicit mappers from DTOs to domain types.
- golden tests for stable payloads.
- schema validation where applicable.
- backward-compatible decoding where required by API versioning.
- stable date/time formats.
- explicit enum validation.

### Avoid

- using domain types as API DTOs by default.
- `Record<string, any>` as business data.
- silent defaults for required business fields.
- hiding validation in decorators/tags only.
- accidental field renames.
- accidental date/time format changes.
- untested custom serializers.
- leaking internal enum values into public contracts.

### Almost never do

- Decode untrusted payloads directly into domain objects.
- Treat decoding success as business validation.
- Use generic maps for legal/regulatory payloads.
- Generate legal XML without golden tests.
- Compare XML as raw strings when canonical comparison is required.
- Log sensitive XML/JSON unredacted.

## 23. Date, Time, Time Zones, and Clock

### Recommendation

Date/time bugs are business bugs.

Use explicit types and freeze time in tests.

### Always do

- Distinguish instants, local date-times, date-only values, periods, durations, and deadlines.
- Inject a clock/time provider when current time affects behavior.
- Test time-dependent logic with fixed time.
- Define timezone policy.
- Define inclusive/exclusive range semantics.
- Validate date ranges.
- Test boundary dates.
- Avoid relying on local machine timezone.

### Prefer

- domain value objects for legal dates, event periods, deadlines, validity windows, and transmission timestamps.
- ISO-8601/RFC3339 at technical boundaries unless integration requires another format.
- explicit timezone conversion at boundaries.
- tests for end-of-month, leap year, DST where relevant, midnight boundaries, and invalid ranges.
- fake timers for JavaScript timer behavior.

### Avoid

- comparing dates as localized strings.
- parsing dates repeatedly inside business rules.
- mixing date-only and timestamp concepts.
- using current real time in deterministic tests.
- silent fallback on invalid dates.
- storing external date strings directly in domain objects.

### Almost never do

- Use local machine time as business truth.
- Ignore timezone requirements in legal/regulatory events.
- Let external payload date strings leak into domain logic.
- Make tests depend on today’s date.

## 24. Money, Decimals, Measurements, and Numeric Rules

### Recommendation

Use exact and domain-appropriate numeric types.

JavaScript `number` is binary floating point and is not safe for all business/legal contexts.

### Always do

- Define numeric units explicitly.
- Avoid magic numbers.
- Test boundary values.
- Test rounding rules.
- Test minimum/maximum values.
- Avoid floating point for money unless the domain explicitly accepts it.
- Use BigInt, integer minor units, or approved decimal libraries where exactness matters.
- Validate measurements and legal thresholds.
- Document rounding policies.
- Test zero, negative, maximum, and fractional cases where applicable.

### Prefer

- domain value objects for money, percentages, measurements, rates, quantities, thresholds, and exposure levels.
- integer minor units for money when compatible.
- decimal libraries for exact decimal arithmetic when project-approved.
- constants named after business meaning.
- names that include units: `durationDays`, `amountCents`, `noiseExposureDb`, `ratePercent`.
- overflow/range checks for audit/legal/security calculations.

### Avoid

- `number` for money/payroll/legal calculations without review.
- hidden unit conversion.
- silent precision loss.
- numeric literals spread across code.
- rounding inside unrelated functions.
- comparing floating point values directly.
- using `parseFloat` for money.

### Almost never do

- Round legal/payroll/financial values without tests.
- Mix units in the same field.
- Use binary floating point for exact decimal legal/payroll/financial calculations.
- Treat measurement units as comments instead of types/names.

## 25. Collections, Records, Maps, and Iteration

### Recommendation

Use the clearest collection construct, not the cleverest.

JavaScript collections have runtime behavior that TypeScript types cannot fully protect.

### Always do

- Choose collection types by behavior.
- Make ordering explicit.
- Use arrays for ordered collections.
- Use `Map` for arbitrary keys or insertion-order semantics.
- Use plain objects carefully for JSON-like records.
- Avoid unnecessary allocation.
- Preserve deterministic output when tests/contracts depend on ordering.
- Copy mutable collections at boundaries when ownership is unclear.

### Prefer

- `ReadonlyArray<T>` for read-only inputs.
- `Map<K, V>` for non-string keys or when key collision/prototype concerns matter.
- `Set<T>` for membership.
- sorting keys before deterministic output.
- plain loops for complex branching and error handling.
- preallocation only when it improves clarity or measured performance.

### Avoid

- depending on object property order for legal/signature output without tests.
- using `{}` as a dictionary for untrusted keys without prototype-pollution awareness.
- hidden side effects inside `map`, `filter`, or `reduce`.
- `reduce` chains that obscure business logic.
- mutating arrays while iterating in confusing ways.
- appending/mutating caller-owned collections without documenting ownership.

### Almost never do

- Hide persistence, network, signing, or message publishing side effects inside collection helpers.
- Use `Object.assign`/deep merge on untrusted objects without pollution defenses.
- Clone entire payloads just to avoid designing ownership.

## 26. Logging, Observability, and Diagnostics

### Recommendation

Logs are operational evidence, not decoration.

For concurrent services, external integrations, and legal/regulatory operations, structured logging and tracing are strongly preferred.

### Always do

- Use the project-approved logging/tracing system.
- Use structured fields.
- Include request/correlation IDs where available.
- Never log secrets, private keys, passwords, tokens, session cookies, or certificate material.
- Never log raw sensitive legal/personnel/health payloads without explicit redaction policy.
- Log failures with useful context.
- Avoid logging the same error repeatedly.
- Make background-job failures observable.
- Ensure logs do not become the only audit trail.

### Prefer

- project-approved structured loggers.
- OpenTelemetry or project-approved tracing where distributed tracing is required.
- stable event names.
- domain identifiers instead of raw payloads.
- redaction utilities.
- separate audit trail from debug logs.
- clear log levels.

### Avoid

- `console.log` in production services unless policy allows it.
- string-only logs with no structured fields.
- logging whole XML/JSON payloads.
- logging inside tight loops without rate control.
- vague messages like `failed` without context.
- logging sensitive values through object spread or `%o`.
- automatically logging full request bodies.

### Almost never do

- Log sensitive regulatory XML unredacted.
- Use logs as the only audit trail.
- Hide failures because they were logged.
- Let async/background tasks fail without traceability.

## 27. Auditability and Traceability

### Recommendation

Audit behavior is product behavior.

If an action affects legal, financial, security, user, tenant, employment, medical, payroll, or compliance state, the code must produce trustworthy evidence.

### Always do

- Define audit events deliberately.
- Include who/what/when/where/why/result where applicable.
- Use stable identifiers.
- Make audit writes part of the business transaction when required.
- Avoid raw sensitive payloads unless policy requires secure storage.
- Test audit records for success and failure paths.
- Preserve traceability across retries, queues, and external integrations.

### Prefer

- append-only audit records.
- explicit audit event types.
- correlation between command ID, domain entity ID, external receipt/protocol, and user/service identity.
- tamper-evident audit strategy for high-risk domains when required.
- redaction and retention policies.

### Avoid

- treating logs as audit records.
- audit events hidden in infrastructure side effects.
- missing audit records for rejected/failed operations.
- overwriting audit history.
- using local time without timezone policy.

### Almost never do

- Implement legal/audit workflows without golden/contract/error-path tests.
- Store private keys, tokens, or raw health/personnel data in audit records without explicit security policy.
- Make audit correctness depend on best-effort async fire-and-forget behavior.

## 28. Security Baseline

### Recommendation

Security is a quality requirement, not an optional pass.

TypeScript applications inherit JavaScript, browser, Node, package ecosystem, web, serialization, and deployment risks.

### Always do

- Validate and sanitize untrusted input.
- Authorize at the application/domain boundary, not only UI or middleware.
- Use parameterized database queries.
- Avoid command injection, SQL injection, NoSQL injection, LDAP injection, template injection, path traversal, SSRF, open redirects, XSS, CSRF, prototype pollution, unsafe deserialization, and insecure direct object references.
- Keep secrets out of code, logs, tests, snapshots, fixtures, and client bundles.
- Use secure defaults for cookies, CORS, headers, sessions, JWTs, OAuth/OIDC, and API tokens.
- Rate limit and bound resource usage for public endpoints.
- Review dependency and transitive dependency risk.
- Run security tools where configured.

### Prefer

- OWASP ASVS/API Security Top 10/cheat sheets as security design references.
- security headers through project-approved middleware.
- least privilege for credentials and tokens.
- explicit tenant isolation checks.
- server-side validation for all client-controlled fields.
- safe URL parsing and allowlists for outbound requests.
- constant-time comparison for sensitive token/hash comparisons.
- crypto through platform APIs or audited libraries.

### Avoid

- `eval`, `new Function`, dynamic template execution, unsafe regexes, shelling out with user-controlled input.
- serializing secrets into frontend bundles.
- broad CORS.
- trusting `X-Forwarded-*` headers without proxy policy.
- trusting JWT contents without verifying signature, issuer, audience, expiry, and algorithm policy.
- using regex-only validation for complex legal/security formats.
- using client-side checks as authorization.

### Almost never do

- Store passwords without a modern password hashing policy.
- Implement custom crypto protocols.
- Disable TLS verification.
- Accept all certificates to make integration tests pass.
- Log authentication tokens or raw authorization headers.
- Deploy admin/debug endpoints without authentication and audit.

## 29. Dependency and Supply-Chain Hygiene

### Recommendation

The npm ecosystem is powerful and high-risk. Dependencies must be intentional, minimal, reviewed, and reproducible.

### Always do

- Justify new runtime dependencies.
- Prefer standard library/runtime APIs for trivial functionality.
- Review package health before adding dependencies: maintenance, license, size, transitive dependencies, install scripts, native code, security history, ownership, provenance/signatures where available.
- Keep lockfile changes intentional.
- Run vulnerability checks after meaningful dependency changes.
- Review peer dependency warnings.
- Avoid dependencies with surprising postinstall scripts unless justified.
- Document dependency changes in `PHASE-RESULT.md`.

### Prefer

- small, well-maintained, widely reviewed packages.
- project-approved shared utilities over one-off dependencies.
- exact or controlled dependency update policy.
- dependency pruning with tools like `knip` where configured.
- SBOM generation for deployable artifacts or published packages.
- package provenance for published npm packages.
- separate dev/test/build dependencies from runtime dependencies.

### Avoid

- adding dependencies for one-line helpers.
- packages with unclear ownership or recent suspicious transfers.
- broad update commands unrelated to the phase.
- duplicate libraries that solve the same problem.
- bundling server-only dependencies into client code.
- allowing devDependencies to leak into production containers/functions.

### Almost never do

- Ignore a critical advisory because it is transitive.
- Accept install scripts from unknown packages without review.
- Publish packages without reviewing files included in `npm pack --dry-run`.
- Ship code that depends on abandoned security-critical packages without an exit plan.

## 30. Public API and Library Design

### Recommendation

Public APIs are contracts. Treat exported TypeScript types, runtime behavior, package exports, declaration files, errors, and semver as product surfaces.

### Always do

- Keep public exports intentional.
- Preserve backwards compatibility unless the phase is a breaking change.
- Generate and inspect declarations for libraries.
- Test public entrypoints as consumers use them.
- Document supported runtimes.
- Keep runtime and type exports aligned.
- Avoid exposing internal implementation types.
- Use semver deliberately.

### Prefer

- small public API surfaces.
- stable named exports.
- explicit deprecation paths.
- `exports` maps that expose only supported entrypoints.
- API report tooling where configured.
- examples compiled/tested as part of CI.

### Avoid

- accidental exports from barrels.
- public types that mention internal/generated/private modules.
- breaking import paths without migration notes.
- exposing framework-specific types from domain libraries.
- publishing source that requires a consumer’s bundler to understand private project aliases.

### Almost never do

- Publish declarations that do not match runtime output.
- Publish packages without package-consumer smoke tests after export changes.
- Treat TypeScript types as the only public contract when runtime behavior differs.

## 31. Documentation and Examples

### Recommendation

Documentation must help maintainers use and change the code safely.

### Always do

- Document public APIs.
- Document non-obvious decisions.
- Document architectural boundaries.
- Document runtime assumptions.
- Keep examples current.
- Update README or usage docs when behavior changes.
- Document migration notes for breaking changes.

### Prefer

- executable examples or docs tests where possible.
- concise comments explaining why, not what.
- ADRs for major architectural decisions.
- typed examples that compile.
- diagrams only when they clarify boundaries.

### Avoid

- comments that repeat code.
- stale docs.
- examples that bypass validation/error handling.
- documenting unsafe behavior as if it were normal.
- hiding important behavior only in tests.

### Almost never do

- Leave misleading documentation after changing behavior.
- Document a public API but omit error/cancellation/security semantics.
- Use examples that encourage `any`, unchecked assertions, or insecure defaults.

## 32. Testing Strategy

### Recommendation

Tests must prove behavior, not only exercise lines.

TypeScript needs both static and runtime evidence because type safety does not prove that JavaScript behavior, external inputs, async timing, packaging, or integration contracts are correct.

### Always do

- Add or update tests for changed behavior.
- Test failure paths.
- Test boundary mappers.
- Test runtime validation.
- Test async timeout/cancellation where relevant.
- Keep tests deterministic.
- Avoid depending on real current time, network, random ordering, or external services unless integration tests are explicitly configured.
- Use meaningful test names.

### Prefer

- unit tests for pure domain rules.
- integration tests for persistence/adapters.
- contract tests for external APIs.
- fake servers for HTTP integrations.
- golden tests for stable JSON/XML/legal payloads.
- e2e tests for user-critical workflows.
- property tests for validators, parsers, transformations, and state machines.
- mutation testing for critical business rules.

### Avoid

- tests that only assert mocks were called.
- snapshot tests for complex behavior without focused assertions.
- broad snapshots that hide sensitive data.
- tests with arbitrary sleeps.
- tests that pass only in one timezone/locale/order.
- skipping tests without documenting why.

### Almost never do

- Claim completion for business logic without automated tests.
- Rely only on happy-path tests.
- Mock the unit under test.
- Replace contract tests with type assertions.
- Use tests that require live production credentials.

## 33. Test Types Required by Risk

### Low-risk code

Examples: pure formatting helpers, simple UI display logic, internal non-critical refactors.

Required evidence:

- typecheck
- lint
- formatting
- targeted unit tests or documented reason why existing tests cover it

### Medium-risk code

Examples: API handlers, application services, validation, async orchestration, non-critical persistence.

Required evidence:

- all low-risk evidence
- success and failure tests
- runtime validation tests
- boundary mapper tests
- relevant integration tests

### High-risk code

Examples: auth, authorization, payments, payroll, legal reports, regulatory, signing, persistence migrations, external transmission, tenant isolation.

Required evidence:

- all medium-risk evidence
- golden/contract tests
- authorization/tenant tests
- error/retry/idempotency tests
- audit tests
- security review evidence
- dependency/supply-chain review if dependencies changed

### Critical-risk code

Examples: cryptography, certificates, legal submissions, health/personnel data, irreversible financial/legal actions, public package publishing infrastructure.

Required evidence:

- all high-risk evidence
- deterministic fixtures
- negative/failure-path matrix
- mutation/property/fuzz evidence where useful
- manual review checklist
- residual risk documented in plain language

## 34. Coverage and Mutation Testing

### Recommendation

Coverage is evidence, not proof. Low coverage is a warning. High coverage without meaningful assertions is false confidence.

### Default thresholds

Use project thresholds. If none exist, new or changed business-critical code should target:

- line coverage: at least 85%
- branch coverage: at least 80%
- critical domain/legal/security rules: near 100% meaningful branch coverage

These are not excuses to write weak tests. Quality of assertions matters more than raw percentage.

### Always do

- Measure coverage when configured.
- Review uncovered branches in changed code.
- Add tests for failure paths.
- Avoid lowering thresholds without justification.
- Document coverage gaps in `PHASE-RESULT.md`.

### Prefer

- mutation testing for critical rule sets.
- branch coverage over line-only coverage.
- focused tests for each business rule.
- coverage reports scoped to changed packages when full repo coverage is expensive.

### Avoid

- chasing coverage with tests that assert implementation details.
- excluding files without reason.
- ignoring uncovered error paths.
- treating generated code coverage the same as hand-written business code without policy.

### Almost never do

- Claim high quality for legal/security/business code without failure-path tests.
- Lower coverage thresholds to finish a phase.
- Use snapshots to inflate coverage without proving behavior.

## 35. Property, Fuzz, and Edge-Case Testing

### Recommendation

Use property-style tests and fuzz-like generators when inputs have many combinations or parser/validator behavior is critical.

### Always do

- Add boundary tests for parsers, validators, serializers, and state machines.
- Test invalid and malformed input.
- Test oversized input when resource use matters.
- Test Unicode, encoding, whitespace, and locale issues where relevant.

### Prefer

- `fast-check` or project-approved property-testing tools.
- generated inputs for date ranges, numeric thresholds, identifiers, URLs, and payloads.
- shrinking/minimization when tests fail.
- corpus fixtures for known real-world edge cases.

### Avoid

- only testing one “normal” input.
- assuming generated payloads are valid because TypeScript compiles.
- property tests with vague invariants.
- flaky random tests without deterministic seeds on failure.

### Almost never do

- Ship parsers for legal/security formats without malformed-input tests.
- Treat fuzz/property tests as a replacement for explicit business examples.
- Ignore resource-exhaustion cases for public inputs.

## 36. Persistence and Data Access

### Recommendation

Persistence code must map external storage state into validated application/domain state deliberately.

### Always do

- Keep persistence adapters outside domain logic.
- Use parameterized queries or ORM-safe mechanisms.
- Test mappings from database records to domain/application types.
- Handle nullable columns explicitly.
- Handle transaction boundaries explicitly.
- Test commit/rollback behavior where relevant.
- Validate migration behavior.
- Preserve tenant and authorization constraints.

### Prefer

- repository/port interfaces owned by application/domain consumers.
- explicit mappers.
- migration tests.
- query tests for important filters and ordering.
- transaction helpers that do not leak ORM/driver types into domain logic.
- optimistic locking/idempotency keys where repeated processing matters.

### Avoid

- using database rows as domain objects.
- hiding business rules only in SQL.
- N+1 queries in performance-sensitive paths.
- returning ORM entities directly from APIs.
- relying on implicit transactions.
- ignoring timezone/decimal/nullability conversions.

### Almost never do

- Build SQL with string concatenation from untrusted input.
- Store secrets unencrypted when policy requires protection.
- Change migrations without rollback/compatibility review.
- Treat local in-memory tests as full persistence evidence for critical queries.

## 37. API and Transport Layers

### Recommendation

Transport code should translate between external protocols and application behavior. It should not own business rules.

### Always do

- Parse and validate request input.
- Authorize before performing protected actions.
- Map domain/application results to safe responses.
- Use consistent error response shape.
- Avoid leaking stack traces or internals.
- Test success and failure responses.
- Test authentication/authorization/tenant boundaries where relevant.
- Handle timeouts and cancellation where supported.

### Prefer

- DTOs separate from domain types.
- explicit mappers.
- typed route contracts or OpenAPI generation where project-approved.
- contract tests for public APIs.
- request IDs and structured error logging.
- schema validation for parameters, body, headers, and responses.

### Avoid

- business rules in controllers/components/resolvers.
- trusting client-provided IDs, tenant IDs, roles, or prices.
- returning raw provider/database errors.
- accepting unknown fields unintentionally.
- using global middleware as the only authorization check.
- writing transport tests that bypass real validation.

### Almost never do

- Expose legal/financial/security operations without authorization and audit tests.
- Trust frontend TypeScript types as API validation.
- Let GraphQL/OpenAPI generated types replace runtime checks in high-risk boundaries.

## 38. External Integrations

### Recommendation

External integrations are failure-prone and must be isolated, typed, validated, timed out, retried deliberately, and contract-tested.

### Always do

- Keep external clients outside domain logic.
- Validate outgoing payloads when contracts matter.
- Validate incoming responses.
- Set timeouts.
- Handle cancellation.
- Distinguish retryable and non-retryable failures.
- Preserve provider correlation IDs/receipts where safe.
- Test success, rejection, timeout, malformed response, network failure, and retry behavior.

### Prefer

- fake servers instead of mocking low-level HTTP clients.
- contract fixtures from provider documentation.
- idempotency keys for retried operations.
- circuit breakers/backoff where appropriate.
- explicit mappers from provider DTOs to application/domain results.

### Avoid

- provider payloads leaking into domain logic.
- infinite retries.
- silent partial failures.
- treating every provider error as HTTP 500.
- ignoring response schema/version changes.
- logging full sensitive request/response bodies.

### Almost never do

- Fire-and-forget legal/financial transmissions.
- Treat external acceptance/rejection codes as generic strings.
- Depend on live provider services for normal unit tests.
- Accept TLS/certificate failures to make tests pass.

## 39. Regulatory and Legal Strict Gate

### Recommendation

Legal/regulatory code must be more strict than ordinary application code.

For regulatory or similar legal payload domains, correctness includes domain rules, schema versions, XML/JSON shape, signing, transmission, rejection handling, auditability, and traceability.

### Always do

- Model legal concepts explicitly.
- Validate raw input before creating legal event state.
- Keep legal rules outside transport and XML builders.
- Keep schema/event versions explicit.
- Generate deterministic payloads.
- Use golden fixtures for every critical event variant.
- Test rejection codes and provider error mapping.
- Test signing/canonicalization where applicable.
- Redact sensitive data in logs.
- Produce audit records for submissions, corrections, cancellations, rejections, and retries.

### Prefer

- state-specific types: draft, validated, signed, transmitted, accepted, rejected, cancelled, corrected.
- contract tests with official/provider fixtures where available.
- legal rule matrices in tests.
- stable identifiers and correlation across commands, payloads, signatures, transmissions, and receipts.
- review by domain experts for legal rule changes.

### Avoid

- generic `Record<string, any>` payloads.
- magic strings for event codes.
- legal decisions in XML/JSON builders.
- raw date strings in domain logic.
- floating point for legal measurements/money.
- unvalidated generated DTOs as domain state.

### Almost never do

- Complete regulatory code without golden, contract, error, audit, and failure-path tests.
- Log raw health/personnel/legal XML.
- Treat provider rejection as a generic technical error.
- Use fire-and-forget transmission.
- Hide legal rules in frontend-only validation.

## 40. Cryptography, Certificates, and Signing

### Recommendation

Crypto and signing code must use vetted primitives and explicit policies.

### Always do

- Use platform crypto or project-approved audited libraries.
- Keep private keys and certificates protected.
- Validate certificate chains, validity periods, key usage, revocation policy where required, and subject/issuer requirements where relevant.
- Keep algorithms explicit.
- Test success and failure paths.
- Test expired, not-yet-valid, wrong-key, malformed, and invalid-signature cases.
- Avoid leaking secrets in logs, errors, fixtures, or snapshots.

### Prefer

- Web Crypto or Node `crypto` APIs where suitable.
- deterministic signing fixtures where possible.
- secure key storage integrations.
- constant-time comparison for sensitive values.
- documented algorithm agility/migration plan.

### Avoid

- custom crypto protocols.
- hardcoded secrets.
- disabling verification.
- accepting all certificates.
- insecure hashes/signatures unless required for legacy integration and documented.
- using random test keys in committed fixtures without clear test-only marking.

### Almost never do

- Implement signing without canonicalization tests when canonicalization matters.
- Store production private keys in repository/config files.
- Log certificate private material.
- Change crypto algorithms without compatibility/security review.

## 41. Configuration and Environment

### Recommendation

Configuration must be explicit, validated, safe, and environment-aware.

### Always do

- Validate environment variables at startup.
- Fail fast for missing mandatory config.
- Distinguish public client config from server secrets.
- Keep secrets out of source control and frontend bundles.
- Document config changes.
- Test config parsing.
- Avoid reading process environment deep inside domain logic.

### Prefer

- typed config objects created at composition root.
- schema-validated config.
- secure defaults.
- explicit environment names.
- config redaction in logs.
- test fixtures for config scenarios.

### Avoid

- stringly typed config spread across code.
- defaulting production secrets to development values.
- mutating `process.env` in shared tests without cleanup.
- client-side exposure of server-only values.
- config hidden in package scripts only.

### Almost never do

- Continue startup after critical config validation failure.
- Log full environment variables.
- Depend on machine-local config not represented in docs/CI.

## 42. Performance and Bundle Quality

### Recommendation

Performance must be designed and measured where it matters.

TypeScript can hide runtime costs behind elegant types. Bundlers can hide large dependency and polyfill costs.

### Always do

- Avoid blocking the event loop in services.
- Avoid unnecessary client bundle growth.
- Avoid repeated expensive parsing/validation in hot paths unless required.
- Use streaming for large files/payloads when appropriate.
- Measure before optimizing complex code.
- Add benchmarks/profiling for performance-sensitive changes.
- Document performance assumptions.

### Prefer

- lazy loading where it improves startup/bundle behavior.
- tree-shakeable imports.
- explicit caching with invalidation policy.
- bounded memory use.
- profiling with Node/browser tools where relevant.
- bundle analysis for frontend/serverless code.

### Avoid

- importing whole utility libraries for one function.
- JSON/XML stringify/parse loops in hot paths.
- large synchronous operations in request handlers.
- unbounded in-memory caches.
- deep cloning as a default strategy.
- type-level complexity that slows editors/CI without value.

### Almost never do

- Optimize by weakening correctness.
- Hide slow operations behind fire-and-forget behavior.
- Ship major bundle-size regressions without documentation.
- Accept event-loop blocking in high-throughput services without evidence.

## 43. Resource Management

### Recommendation

Resources must have explicit ownership and lifecycle.

### Always do

- Close files, streams, database connections, HTTP clients, workers, timers, intervals, subscriptions, and watchers when their lifecycle ends.
- Clear timers/intervals in tests and shutdown paths.
- Handle stream errors.
- Use backpressure-aware stream pipelines.
- Bound queues and caches.
- Test shutdown behavior for services/workers.

### Prefer

- composition-root lifecycle management.
- `try/finally` for cleanup.
- `AbortSignal` for cancellation.
- async disposers/resource wrappers when project policy supports them.
- health checks that reflect critical dependency state.

### Avoid

- orphaned intervals/timeouts.
- unclosed file descriptors.
- unbounded queues.
- unhandled stream errors.
- global singleton clients created implicitly by importing modules.
- tests that leave handles open.

### Almost never do

- Leak resources after request/job completion.
- Use process exit as cleanup.
- Ignore backpressure for large legal/XML/file payloads.

## 44. Browser, Node, Edge, Serverless, and Platform Boundaries

### Recommendation

TypeScript source can target many runtimes. Runtime assumptions must be explicit.

### Always do

- Document target runtime.
- Use the correct `lib` types.
- Avoid Node APIs in browser/client code unless bundled/polyfilled intentionally.
- Avoid browser-only APIs in backend code unless available in runtime.
- Test serverless/edge constraints when affected.
- Keep secrets out of client bundles.
- Verify environment-specific exports and conditions.

### Prefer

- package exports conditions for runtime-specific builds.
- runtime smoke tests for deployable artifacts.
- explicit browser/server boundaries in framework projects.
- separate configs for server/client/test/build when needed.

### Avoid

- assuming `fetch`, `crypto`, `Buffer`, `process`, `window`, `document`, `localStorage`, `fs`, or `path` exist everywhere.
- relying on bundler polyfills accidentally.
- using long-lived in-memory state in serverless functions without review.
- using Node-specific packages in edge runtimes.

### Almost never do

- Ship runtime-specific code without target runtime tests.
- Put secrets in files that can be imported by client code.
- Depend on local filesystem in environments where it is ephemeral or read-only.

## 45. Native Addons, WASM, FFI, and Unsafe Runtime Features

### Recommendation

Native addons, WASM, dynamic evaluation, worker isolation, and process spawning are high-risk integration areas.

### Always do

- Isolate native/WASM/FFI code behind safe TypeScript APIs.
- Validate inputs and outputs across the boundary.
- Document platform support.
- Document memory, lifetime, and thread-safety assumptions.
- Test success and failure paths.
- Handle loading failures gracefully.
- Review supply-chain and deployment implications.

### Prefer

- pure TypeScript/JavaScript alternatives when practical.
- small adapter packages.
- explicit capability restrictions.
- benchmarks proving native/WASM is justified for performance.
- sandboxing or permission controls where available.

### Avoid

- dynamic `require`/import of arbitrary user-controlled paths.
- `child_process.exec` with interpolated user input.
- `eval`/`new Function`.
- assuming native binaries exist on every platform.
- exposing raw native handles into domain logic.

### Almost never do

- Add native code for convenience.
- Use dynamic execution in business/security/legal code.
- Disable sandbox/permissions to make native code work without review.

## 46. Regression Tests

### Recommendation

Every fixed bug should become a test when practical.

### Always do

- Add regression tests for bug fixes.
- Name tests after the behavior that must not regress.
- Include the minimal failing case.
- Test adjacent edge cases when the bug suggests a class of failures.
- Link issue/incident identifiers when useful.

### Prefer

- fixtures copied from sanitized real-world failures.
- property tests when one bug reveals a broad input class.
- negative tests for rejected invalid behavior.

### Avoid

- fixing bugs only by changing implementation.
- tests that assert the old broken implementation detail.
- broad snapshots that obscure the regression.

### Almost never do

- Close a legal/security/data-loss bug without a regression test or documented impossibility.
- Delete a regression test because it is inconvenient.

## 47. LLM-Specific TypeScript Anti-Patterns

### Recommendation

LLM-generated TypeScript must be reviewed for recurring failure modes.

### Always do

- Search for and remove fake completeness markers.
- Search for unsafe type escapes.
- Search for unawaited promises.
- Search for generated-looking placeholder code.
- Search for domain rules hidden in UI/transport code.
- Search for tests that assert mocks instead of behavior.
- Search for dependencies added casually.
- Search for runtime validation gaps.

### High-risk LLM patterns

- `JSON.parse(...) as T`
- `as any`
- `as unknown as T`
- `!` non-null assertions on boundary data
- `// @ts-ignore`
- `// @ts-nocheck`
- `Promise<void>` functions that swallow failures
- `array.forEach(async ...)`
- fake validators that only check `typeof value === "object"`
- catch blocks that return success defaults
- TODO stubs dressed as implementation
- broad interfaces such as `Manager`, `Processor`, `Handler`, `Service`
- generic `Record<string, any>` domain models
- business rules in controllers/components
- snapshots without meaningful assertions
- dependency installation for trivial utilities

### Extra LLM review prompts

Ask these before completion:

- What runtime inputs can violate these TypeScript types?
- Where does untrusted data become trusted?
- Which promises can reject after this function returns?
- Which operations need cancellation or timeout?
- Which values are optional because of business meaning versus implementation laziness?
- Which imports violate architecture?
- Which tests would fail if the main business rule were inverted?
- Which dependency could be removed by writing simple code?
- Which errors can callers distinguish programmatically?
- Which fields might leak secrets or sensitive personal/legal data?

## 48. Recommended Tooling Matrix

The exact toolset is project-specific. Use configured tools first. Add tools only with project approval.

### Compiler and type safety

- TypeScript compiler: `tsc --noEmit`, `tsc -b`
- type-aware ESLint with typescript-eslint
- API Extractor or equivalent for public API reports
- declaration tests or package-consumer fixtures

### Formatting and linting

- Prettier
- ESLint flat config or project-approved config
- import-boundary tools: dependency-cruiser, madge, eslint-plugin-boundaries, eslint-plugin-import-x

### Testing

- Node test runner, Vitest, Jest, or project-approved runner
- Testing Library for UI behavior tests
- Playwright/Cypress for browser e2e
- Supertest/undici/fake server tools for HTTP APIs
- fast-check for property tests
- Stryker for mutation tests

### Security and supply chain

- npm audit / pnpm audit / yarn npm audit
- npm SBOM / CycloneDX tools
- npm provenance/signature checks where relevant
- gitleaks/trufflehog for secret scanning
- Semgrep or project SAST
- OWASP ZAP or DAST where configured
- license scanners where configured

### Performance and packaging

- Node profiler, heap snapshots, flamegraphs
- bundle analyzers
- `npm pack --dry-run`
- package export tests
- Docker build/smoke tests

## 49. Architecture Test Ideas

### Recommendation

Architecture must be tested when boundaries matter.

### Always do

- Enforce forbidden imports where critical.
- Test that domain modules do not import infrastructure/framework modules.
- Test that public package exports do not expose internal modules.
- Test dependency cycles when the repository has grown enough to risk them.

### Prefer

- static import-boundary checks in CI.
- package-level fixtures that import only supported public API.
- dependency-cruiser/madge rules.
- ESLint restricted imports.
- type-level public API checks.

### Avoid

- relying on code review alone for recurring boundary violations.
- hiding architecture through barrels.
- allowing test-only imports to normalize production boundary violations.

### Almost never do

- Let domain import transport/infrastructure because it is convenient.
- Break package boundaries to avoid writing mappers.

## 50. Definition of Done

A TypeScript implementation phase is done only when all applicable items are true:

- Planned files and behavior exist.
- TypeScript typecheck passes.
- Formatting check passes.
- ESLint/static analysis passes or justified exceptions are documented.
- Tests cover success and failure paths.
- Runtime validation exists for untrusted input.
- Async work has handled promises, timeouts, cancellation, and bounded concurrency where relevant.
- Architecture boundaries are preserved.
- Dependency changes are intentional and reviewed.
- Security implications are reviewed.
- Public API/package exports are tested when affected.
- Generated code is deterministic when affected.
- Documentation is updated when behavior or usage changed.
- `PHASE-RESULT.md` exists with evidence.
- Quality score is supported by facts.

## 51. `PHASE-RESULT.md` Required Template

```markdown
# PHASE-RESULT.md

## Summary

- What changed:
- Why it changed:
- Scope:

## Toolchain

- Node version:
- Package manager and version:
- TypeScript version:
- Runtime target:
- Bundler/transpiler/test runner versions when relevant:

## Files changed

- File/path:
  - Reason:
  - Risk:

## Architecture

- Boundary decisions:
- Import/dependency direction:
- Deviations from architecture.md:
- Residual risk:

## Types and Runtime Validation

- Important domain types added/changed:
- `any`/assertion/suppression review:
- Runtime validators/parsers:
- Boundary validation tests:

## Dependencies

- Added:
- Removed:
- Updated:
- Lockfile impact:
- Supply-chain/security review:

## Commands run

- `command`

## Commands passed

- `command`

## Commands failed

- `command`
- Reason:
- Impact:
- Required fix:

## Tests

- Unit:
- Integration:
- Contract:
- E2E:
- Failure-path tests:
- Regression tests:

## Coverage

- Tool:
- Result:
- Gaps:

## Property/Fuzz/Mutation Evidence

- Tool:
- Result:
- Gaps:

## Security and Supply Chain

- Input validation:
- Auth/authz:
- Secrets/logging:
- Dependency audit:
- SBOM/provenance when relevant:
- Residual risk:

## Async/Cancellation/Resource Review

- Unawaited promise review:
- Timeout/cancellation behavior:
- Background jobs/workers:
- Resource cleanup:

## Public API / Package Review

- Exports changed:
- Declaration output:
- Consumer smoke tests:
- Semver impact:

## Observability and Audit

- Logs/traces:
- Audit records:
- Redaction:

## Quality Score

- Score:
- Evidence supporting score:
- Score constraints triggered:
- Residual risk in plain language:
```

## 51b. Complexity Limits

Complexity must be actively reduced. If a function, file, class, module, or dependency relationship becomes hard to understand, refactor before declaring completion.

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

These are defaults. Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`, not silent acceptance. Generated code may be excluded only with an explicit reason.

## 52. Quality Score Model

### Scoring bands

- `95-100`: Excellent. Strict typecheck, lint, formatting, meaningful tests, failure paths, security review, no unjustified unsafe escapes, no architecture erosion, strong evidence.
- `85-94`: Good. Strong implementation with minor documented gaps that do not threaten correctness or safety.
- `70-84`: Adequate but risky. Some gaps remain; acceptable only for lower-risk phases or explicitly approved residual risk.
- `50-69`: Weak. Missing meaningful tests, static analysis, validation, or architecture evidence.
- `<50`: Not acceptable. The phase should not be treated as complete.

### Score constraints

The quality score must not exceed:

- `60` if `tsc --noEmit` or project typecheck did not pass.
- `65` if ESLint/static analysis was not run and no concrete blocker exists.
- `70` if tests were not run.
- `75` if only happy-path tests exist for changed business logic.
- `75` if runtime validation is missing for new untrusted input boundaries.
- `80` if dependency changes were not reviewed.
- `80` if package exports/public API changed without consumer/import tests.
- `85` if `any`, unsafe assertions, or suppressions were added without clear justification.
- `85` if async code lacks cancellation/timeout/error-path tests where relevant.
- `90` if high-risk legal/security/audit code lacks golden/contract/failure-path tests.

### Required scoring evidence

A score must cite concrete evidence:

- commands passed
- tests added/updated
- risks reviewed
- files changed
- residual gaps
- why the selected score is justified

## 53. Caveman Quality Review

Before declaring completion, perform this blunt review:

- Does it typecheck?
- Does it run where it will actually run?
- Does it validate real input?
- Does it fail safely?
- Does it handle rejected promises?
- Does it avoid lying types?
- Does it avoid `any` infection?
- Does it preserve architecture?
- Does it avoid accidental dependency bloat?
- Does it avoid leaking secrets or sensitive data?
- Does it have tests that would catch broken business behavior?
- Does it prove failure paths?
- Does it document evidence?

If the answer to any critical question is no, the phase is not complete.

## 54. Final Checklist

- [ ] Planned implementation exists.
- [ ] `tsc --noEmit` or project typecheck passed.
- [ ] Formatting check passed.
- [ ] ESLint/static analysis passed or documented.
- [ ] Tests passed.
- [ ] Failure paths tested.
- [ ] Runtime validation added/updated for untrusted boundaries.
- [ ] Async promises/timeouts/cancellation reviewed.
- [ ] Architecture boundaries preserved.
- [ ] Public API/package exports reviewed when affected.
- [ ] Dependency/lockfile changes intentional.
- [ ] Security risks reviewed.
- [ ] Sensitive logging reviewed.
- [ ] Audit behavior reviewed when applicable.
- [ ] Generated code deterministic when applicable.
- [ ] Documentation updated when applicable.
- [ ] `PHASE-RESULT.md` created.
- [ ] Quality score supported by evidence.
- [ ] Final response is exactly `I finished the implementation`.
