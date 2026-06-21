# PHP Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the PHP language quality gate for implementation work. Its purpose is to prevent
low-quality PHP code from being generated, accepted, copied into a project, or treated as complete
without measurable evidence. It is an engineering control document, not a style preference.

PHP is dynamic, with loose type juggling, request-scoped global state, a large legacy surface, and a
history of injection and deserialization vulnerabilities. PHP code can load and render a page and
still be architecturally wrong, falsely typed, injection-prone, type-juggling-buggy, exception-hostile,
dependency-heavy, supply-chain risky, and business-incorrect. "It loads" is weak evidence.

The implementation is complete only when the code runs on the project PHP version with `strict_types`,
is formatted, passes static analysis (PHPStan/Psalm) at the project level, has meaningful tests,
validates and escapes untrusted input, models errors with typed exceptions, preserves architecture, is
secure by default, and records measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult the numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Code runs under the project PHP version: `php -l` clean on changed files, `composer install` clean. New files declare `strict_types=1`.
2. Formatting passes: PHP-CS-Fixer (or PHP_CodeSniffer / Pint) in dry-run/check mode.
3. Static analysis passes at the project level: `phpstan analyse` (or `psalm`); new findings fixed or justified, not dumped into a baseline.
4. Tests pass and are meaningful for changed behavior, including failure paths: `phpunit` (or Pest).
5. Coverage meets the risk tier (Xdebug/PCOV; see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, templates/views, and ORM models.
8. Untrusted input validated before use; output escaped at the boundary (HTML/SQL/shell/headers).
9. No secrets committed; sensitive data not logged.
10. Errors modeled with typed exceptions; no silenced errors (`@`); strict comparisons (`===`); no swallowed failures.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because the code loads or a page renders.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress static-analysis findings (mass-baseline) or use the `@` error-suppression operator to pass.
- `eval`, `assert` on a string, `unserialize` on untrusted data, `extract()` on request data, or variable variables (`$$x`) on untrusted input.
- Build SQL by string interpolation (use prepared statements / binding); use `==` where `===` is required (type juggling); put business rules in templates; rely on mutable global state.

### Score

Report 0-100. Apply Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. Untrusted-input and auth changes are
never low tier. When planning, list which checks apply and state any intentionally excluded and why.
Detail: "Test Types Required by Risk".

- Low (helpers, simple value objects, internal refactors, throwaway scripts): lint, format, static analysis, basic tests. MUST 1-3, 9-11.
- Medium (application services, validation, persistence/external adapters, controllers): add failure-path tests, input validation/output escaping, integration, coverage. Add MUST 4, 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, a higher static-analysis level. Add MUST 6.
- Critical (security, auth, crypto, payments, financial, audit, data integrity): add golden/contract tests, error/rejection paths, audit/traceability, injection/XSS tests, dependency audit, mutation tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code lints
and runs, formatting and static analysis ran, tests ran, applicable gates ran, failures were fixed or
documented, `PHASE-RESULT.md` was created, and the score is supported by evidence. A rendered page or
a passing happy-path test is not enough when the phase changed dependencies, public API, persistence,
serialization, security behavior, or authorization. "It loads" hides type-juggling, injection, and
error-path problems until runtime.

## 2. PHP Version, Runtime, and `strict_types`

Use the PHP version defined by the project, and make every file strict.

- Always: use the version in `composer.json` `require.php`/CI/Docker; document `php --version`; declare `declare(strict_types=1);` in every PHP file; run inside the project's Composer environment.
- Prefer: a current supported PHP release; typed properties, enums, readonly classes, constructor promotion, and first-class callables where they reduce complexity; explicit nullable types.
- Avoid: relying on the system PHP; using syntax newer than the project minimum; depending on deprecated/removed features; `ini` settings that change language behavior silently.
- Almost never: raise the minimum PHP version without documenting impact; run without `strict_types`; depend on type coercion for correctness.

## 3. Composer and Reproducibility

The build must be reproducible from a clean checkout using documented commands.

- Always: commit `composer.json` and `composer.lock`; install with `composer install` (not `update`) in CI; keep dependency versions intentional; run `composer audit` after dependency changes; use PSR-4 autoloading.
- Prefer: `composer install --no-dev` for production builds; minimal dependencies; the standard library/SPL before adding a package for a trivial helper; `composer validate --strict`.
- Avoid: running `composer update` in CI; floating version constraints without policy; packages with unclear ownership/maintenance; committing `vendor/`.
- Almost never: delete `composer.lock` to make resolution pass; add packages with install hooks/native code without review; accept a vulnerable transitive package without a documented compensating control.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
php --version
php -l src/SomeFile.php                       # lint each changed file
composer install --no-interaction
vendor/bin/php-cs-fixer fix --dry-run --diff
vendor/bin/phpstan analyse
vendor/bin/phpunit
```

Stronger (applications/critical code): `XDEBUG_MODE=coverage vendor/bin/phpunit --coverage-text`,
`vendor/bin/phpmd src text configs/phpmd.xml`, `composer audit`, `vendor/bin/psalm --taint-analysis`
for security-sensitive code, and Infection (`vendor/bin/infection`) for mutation testing of critical
rules. A command not run is not evidence; a command that failed and was ignored is negative evidence.

## 5. Formatting and Style

Automate formatting; do not debate it manually.

- Always: run PHP-CS-Fixer / PHP_CodeSniffer / Pint in check mode; follow PSR-12; enforce `declare_strict_types` and `strict_comparison` via the fixer; remove unused imports and dead code.
- Prefer: one fixer as the source of truth; pre-commit hooks mirroring CI; consistent import ordering.
- Avoid: hand-formatting against the fixer; reformatting unrelated files; mixing multiple fixers with conflicting rules.
- Almost never: disable formatting checks; leave `var_dump`/`print_r`/`dd()`/`dump()` debug output in production code.

## 6. Static Analysis and the Type System

PHP's strongest quality lever is a static analyzer (PHPStan or Psalm) run at a high level. Treat it as
a gate, not a suggestion.

- Always: run PHPStan/Psalm at the project level; raise the level over time and target the maximum for new and high-risk code; add precise type declarations (parameters, returns, properties) and array-shape/generic PHPDoc where it helps; fix findings or justify them narrowly.
- Prefer: typed properties and return types over PHPDoc-only typing; enums for closed sets; generics PHPDoc (`@param list<Foo>`) for collections; Psalm taint analysis for security-sensitive flows.
- Avoid: `mixed` as the default; mass baselines that hide real findings; `@phpstan-ignore`/`@psalm-suppress` without a reason; relying on PHPDoc the analyzer cannot trust.
- Almost never: lower the level to pass; dump a baseline to make a phase green; disable analysis on security/money/persistence code.

## 7. Naming, Namespaces, and Architecture

Names must reveal intent; namespaces follow PSR-4 and reflect architecture.

- Always: use domain language; PSR-4 namespaces mapping to directories; one class per file; keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport/view models separate from domain.
- Prefer: a `Domain`/`Application`/`Infrastructure`/`Http` layout; final classes by default; small interfaces (ports) for persistence/clock/mailer/external APIs; value objects for identifiers and constrained values.
- Avoid: `Helper`/`Util`/`Manager`/`Common`/`Service` grab-bag names; a giant `functions.php`; domain code depending on the framework, ORM, or HTTP; god classes.
- Almost never: business rules in controllers, Blade/Twig templates, ORM models/observers, or global functions; static mutable registries as application state.

## 8. Architectural Boundaries

Business rules must be explicit, isolated, and testable independent of the framework.

- Always: keep dependency direction inward; put business rules in domain/application classes; put side effects in adapters; keep controllers thin (validate, call use case, present); test domain logic without booting the framework.
- Prefer: plain PHP objects for domain logic; service/use-case classes for orchestration; repository interfaces with implementations in infrastructure; explicit DTOs/mappers at boundaries; constructor injection.
- Avoid: controllers calling the ORM for business workflows; business rules in Eloquent/Doctrine models or events; ORM entities reused as API responses; fat models mixing persistence and domain rules.
- Almost never: hide business decisions in SQL, ORM scopes, or templates; make domain correctness depend on a framework; put audit decisions in logging side effects.

## 9. Type System, `strict_types`, and Type Juggling

Use strict types and strict comparisons; PHP's loose comparison is a correctness and security hazard.

- Always: declare `strict_types=1`; type all parameters, returns, and properties; use `===`/`!==` (never `==`/`!=`) for comparisons; validate and cast external strings explicitly; use enums for closed sets.
- Prefer: readonly classes/properties for value objects; constructor promotion; union/nullable types over `mixed`; `match` (strict) over `switch` (loose); `hash_equals` for secret comparison.
- Avoid: `==`/`!=`/`in_array($x, $a)` without the strict flag; relying on `0 == "foo"`-style coercion; `mixed` parameters in domain code; implicit string/int juggling in keys.
- Almost never: compare secrets, tokens, or money with `==`; use `switch` (which compares loosely) on untrusted values; pass arbitrary arrays where a typed object belongs.

```php
<?php

declare(strict_types=1);

// Value object: invariants enforced at construction, immutable.
final readonly class EmployeeId
{
    public function __construct(public string $value)
    {
        if (preg_match('/^\d{8}$/', $value) !== 1) {
            throw new InvalidArgumentException("invalid employee id: {$value}");
        }
    }
}

// Closed set as a backed enum — invalid values cannot be constructed.
enum EventStatus: string
{
    case Draft = 'draft';
    case Signed = 'signed';
    case Sent = 'sent';
}
```

## 10. Null, Absence, Immutability, and Value Objects

- Null: type nullables explicitly (`?T`); avoid returning `null` for failure when callers need a reason; distinguish missing/null/empty/zero; use the null-coalescing operator deliberately, not to hide bugs.
- Immutability: prefer `readonly` properties and immutable value objects; return new instances rather than mutating; do not expose mutable internal arrays; avoid global/static mutable state.
- Value objects: wrap money, dates, identifiers, emails, and constrained values in small typed classes with construction-time validation, rather than passing raw strings/ints/arrays.
- Avoid: `mixed`/array bags as domain models; `null` to represent multiple states; setter-heavy mutable entities; `clone` that breaks invariants.

## 11. Error Handling and Exceptions

Model errors with typed exceptions; never silence them.

- Always: throw specific exception classes (extend `\Exception`/`\RuntimeException` or a domain base); preserve the cause via the `$previous` argument; catch the narrowest type you can handle; convert infrastructure exceptions to application/domain errors at boundaries; test failure paths.
- Prefer: a small domain exception hierarchy; result objects for expected business outcomes where they clarify flow; `finally` for cleanup; meaningful messages without sensitive data.
- Avoid: the `@` error-suppression operator; catching `\Throwable`/`\Exception` and swallowing it; returning `false`/`null` to signal failure when a reason matters; using exceptions for ordinary control flow in hot paths.
- Almost never: swallow security/persistence/payment failures; leak stack traces, SQL, tokens, or payloads to responses; suppress errors with `@` to make a phase pass.

```php
<?php

declare(strict_types=1);

abstract class DomainException extends \RuntimeException {}
final class ValidationException extends DomainException {}

function parse_event(array $payload): Event
{
    if (!isset($payload['id'])) {
        throw new ValidationException('missing field: id');
    }

    try {
        return Event::fromArray($payload);
    } catch (\JsonException $e) {
        // Preserve the cause; map infrastructure failure to a domain error.
        throw new ValidationException('malformed event payload', previous: $e);
    }
}
```

## 12. Serialization and Deserialization

Serialization is a boundary and a security concern; unsafe deserialization is remote code execution.

- Always: use `json_encode`/`json_decode` with `JSON_THROW_ON_ERROR` for interchange; validate decoded data before domain use; use DTOs/mappers at boundaries; treat unknown/missing fields deliberately.
- Prefer: typed objects hydrated through explicit mappers or a vetted serializer; golden tests for stable payloads; schema validation where applicable.
- Avoid: `unserialize()` on any data you did not produce; `serialize`/`unserialize` for cross-system payloads; using arrays as the contract; silent defaults for required fields.
- Almost never: `unserialize()` untrusted input (object-injection RCE); treat decode success as business validation; pass `$_POST`/`$_GET` arrays directly into domain objects.

## 13. Input Validation, Output Escaping, and Security

Treat all external input as untrusted; validate on input, escape on output, parameterize queries.

- Always: validate request input (type, length, range, format) before use; escape output for its context (HTML via `htmlspecialchars`/the template engine's auto-escaping, SQL via prepared statements, shell via `escapeshellarg`, headers/URLs appropriately); use prepared statements / parameter binding for every query; verify CSRF tokens; check authorization at the application boundary.
- Prefer: a validation library or framework form requests; PDO/ORM with bound parameters; `password_hash`/`password_verify`; `random_bytes`/`random_int` for tokens; `hash_equals` for comparisons; allow-lists for constrained values; output encoding by context.
- Avoid: string-interpolated SQL/shell/HTML; `eval`/`assert(string)`/`create_function`; `extract()` on request data; variable variables on user input; disabling TLS verification; mass-assignment of unfiltered input.
- Almost never: `unserialize` untrusted data; compare passwords/tokens with `==`; build queries by concatenation; trust `$_SERVER`/`$_REQUEST` without validation; log secrets or raw sensitive payloads.

```php
// Prepared statement — never interpolate user input into SQL.
$stmt = $pdo->prepare('SELECT id, email FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Strict, constant-time comparison avoids type-juggling auth bypass.
if ($user !== false && password_verify($password, $user['hash'])) {
    // authenticated
}
```

## 14. Persistence and the ORM

Keep persistence an adapter; keep business rules out of the ORM.

- Always: use prepared statements / bound parameters; keep transaction boundaries explicit; use migrations; test custom queries and mappings; handle the not-found and conflict cases; keep persistence code out of domain logic.
- Prefer: repository interfaces with Eloquent/Doctrine implementations in infrastructure; explicit DTO/read models for queries; pagination for large sets; database constraints plus domain validation.
- Avoid: business rules in model events/observers/scopes; N+1 queries; exposing ORM entities as API responses; auto-migration in production; mass assignment of unguarded attributes.
- Almost never: build SQL by concatenation; span a transaction across slow external calls without design; put authorization or money rules in ORM hooks.

## 15. Time, Money, and Numerics

Date/time and money bugs are business bugs.

- Always: use `DateTimeImmutable` with explicit timezones; inject a clock when current time affects behavior; test boundary dates; represent money as integer minor units or a decimal/money library (BCMath/`brick/money`); define rounding explicitly; test boundary/zero/negative values.
- Prefer: UTC internally; ISO-8601 at boundaries; value objects for money/measurements; `bcadd`/`bcmul` or a money library over floats; names that include units.
- Avoid: `DateTime` (mutable) shared across code; `date()`/`time()` in domain logic; float arithmetic for money; comparing dates as strings; magic numbers.
- Almost never: use server local time as business truth; use floats for auditable money; round financial values without tests.

## 16. Dependencies, Configuration, Secrets, and Logging

- Dependencies: justify each Composer package; keep the graph small; run `composer audit` after changes; review license, maintenance, and install hooks; prefer the standard library/SPL for trivial helpers.
- Configuration: validate required configuration at startup and fail fast; keep secrets out of source and logs; use environment variables / a secret manager; document required env vars; never commit `.env` with real secrets.
- Logging: use a PSR-3 logger (not `error_log`/`echo`); structured context; never log passwords, tokens, keys, or raw sensitive payloads; make background-job failures observable; keep audit trails separate from debug logs.
- Almost never: hardcode credentials/keys; default production security features to disabled; log secrets; ignore a critical advisory because it is transitive.

## 17. Testing Strategy

Tests must prove behavior, not just render a page or import a class.

- Always: add/update tests for changed behavior; test failure and boundary paths; test validation and authorization; keep tests deterministic; avoid real network/time/order/external dependence; use behavior-named tests.
- Prefer: PHPUnit or Pest; unit tests for domain rules; integration tests for adapters; HTTP/feature tests for controllers; contract tests for external APIs; golden tests for stable payloads; an injected clock; mutation testing (Infection) for critical rules.
- Avoid: tests that only assert a mock was called; tests that hit the real database/network without isolation; arbitrary sleeps; tests passing only in one timezone/order; risky tests without assertions.
- Almost never: claim completion for business logic without automated tests; rely only on happy paths; mock the unit under test; use production credentials.

## 18. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (helpers, simple value objects, internal refactors): lint, format, static analysis, basic tests.
- **Medium** (services, validation, adapters, controllers): unit + failure-path tests, input/validation/escaping tests, integration, coverage.
- **High** (core rules, state machines, authorization, money/time): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits, a higher static-analysis level.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, injection/XSS tests (e.g. Psalm taint analysis), dependency audit, mutation or documented readiness.

## 19. Coverage and Complexity Limits

Coverage is necessary but not sufficient; mutation testing is stronger evidence for critical rules.

### Default coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Controllers / HTTP glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

### Complexity limits

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Method cyclomatic complexity|<= 8|<= 10|PHPMD CyclomaticComplexity|
|Method NPath / cognitive complexity|<= 10|<= 15|PHPMD NPathComplexity|
|Method length|<= 30 lines|<= 50 lines|PHPMD ExcessiveMethodLength|
|Class length|<= 300 lines|<= 500 lines|PHPMD ExcessiveClassLength|
|File length|<= 400 lines|<= 600 lines|review|
|Method parameters|<= 4|<= 6|PHPMD ExcessiveParameterList|
|Nesting depth|<= 2|<= 3|review|
|Public methods per class|<= 10|<= 15|PHPMD ExcessivePublicCount|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded
only with reason.

## 20. Quality Score Model

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Runs with weak tests, no static-analysis evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and clean static analysis at a basic level|
|76-90|Strong implementation with good tests, high static-analysis level, low complexity, clean boundaries|
|91-100|Production-grade: strict_types, high PHPStan/Psalm level clean, strong tests, validated/escaped boundaries, no known security defects|

### Score caps

|Missing or Failed Evidence|Maximum Score|
|---|---|
|`php -l` fails or code does not run under the project PHP version|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Static analysis not run and not explained|65|
|Formatting not run and not explained|65|
|Business rules without unit tests|60|
|Untrusted input not validated / output not escaped|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|`@` error suppression or mass-baseline used to pass|75|
|Loose `==`/type juggling in security or money logic|80|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit (`composer audit`) missing where applicable|85|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|55|
|Known security issue (injection/XSS/auth) remains|45|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass (`php -l`, formatter, static analysis at a
high level, tests with coverage, `composer audit`), strict_types is on, untrusted input is validated
and output escaped, complexity is within limits, architecture is preserved, no known security defects
remain, and `PHASE-RESULT.md` contains evidence.

## 21. Definition of Done

Code lints and runs on the project PHP version with `strict_types`; formatting passes; static
analysis passes at the project level; tests pass and meaningful tests were added; coverage meets the
tier; complexity within limits or justified; architecture preserved; business rules out of
controllers/templates/ORM models; untrusted input validated and output escaped; typed exceptions used
and no `@` suppression; no secrets introduced; dependencies justified and `composer audit` clean (or
documented); `PHASE-RESULT.md` exists. For critical code, also golden/contract tests, injection/XSS
tests, audit/traceability, and mutation evidence.

## 22. PHASE-RESULT.md Template

```markdown
# PHASE RESULT

## What was implemented
## Files created or changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Lint / format results
## Static analysis results (PHPStan/Psalm level)
## Coverage results
## Security / dependency audit results (composer audit, taint analysis)
## Architecture boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

The score must be supported by command results and tests — not by confidence or a rendered page.

## 23. Final Checklist

Lints and runs with `strict_types`; formatter ran; static analysis ran at the project level; tests
pass, are meaningful, cover failure paths; coverage measured or documented; complexity within limits;
architecture preserved; business rules out of controllers/templates/ORM models; untrusted input
validated and output escaped; prepared statements for SQL; strict comparisons; no `@` suppression; no
secrets committed; `composer audit` clean or documented; `PHASE-RESULT.md` exists; quality score is
evidence-based; remaining work to reach 100 is documented.
