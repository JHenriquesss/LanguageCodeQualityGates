# PHP Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. PHP is dynamic, with loose type juggling,
request-scoped global state, and a large legacy surface — "it loads" and "the page renders" are weak
evidence. Implementation is complete only when the code runs on the project PHP version with
`strict_types`, is formatted, passes static analysis (PHPStan/Psalm) at the project level, has
meaningful tests, validates and escapes untrusted input, models errors with typed exceptions,
preserves architecture, is secure by default, and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code runs under the project PHP version: `php -l` clean on changed files, `composer install` clean. New files declare `strict_types=1`.
2. Formatting passes: PHP-CS-Fixer (or PHP_CodeSniffer / Pint) in dry-run/check mode.
3. Static analysis passes at the project level: `phpstan analyse` (or `psalm`); new findings fixed or justified, not dumped into a baseline.
4. Tests pass and are meaningful for changed behavior, including failure paths: `phpunit` (or Pest).
5. Coverage meets the risk tier (Xdebug/PCOV; see Coverage thresholds).
6. Complexity within limits (see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, templates/views, and ORM models.
8. Untrusted input validated before use; output escaped at the boundary (HTML/SQL/shell/headers).
9. No secrets committed; sensitive data not logged.
10. Errors modeled with typed exceptions; no silenced errors (`@`); strict comparisons (`===`); no swallowed failures.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because the code loads or a page renders.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress static-analysis findings (mass-baseline) or use the `@` error-suppression operator to pass.
- `eval`, `assert` on a string, `unserialize` on untrusted data, `extract()` on request data, or variable variables (`$$x`) on untrusted input.
- Build SQL by string interpolation (use prepared statements / parameter binding); use `==` where `===` is required (type juggling); put business rules in templates; rely on mutable global state.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Untrusted-input and auth changes are
never low tier. In the plan, list which checks apply and state any intentionally excluded and why.

- **Low** (helpers, simple value objects, internal refactors, throwaway scripts): lint, format, static analysis, basic tests. MUST 1-3, 9-11.
- **Medium** (application services, validation, persistence/external adapters, controllers): + failure-path tests, input validation/output escaping, integration, coverage. Add MUST 4, 5, 7, 8.
- **High** (core business rules, state machines, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, higher static-analysis level. Add MUST 6.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity): + golden/contract tests, error/rejection paths, audit/traceability, injection/XSS tests, dependency audit, mutation tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Runs with weak tests, no static-analysis evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and clean static analysis at a basic level|
|76-90|Strong implementation with good tests, high static-analysis level, low complexity, clean boundaries|
|91-100|Production-grade: strict_types, high PHPStan/Psalm level clean, strong tests, validated/escaped boundaries, no known security defects|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
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
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Controllers / HTTP glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

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

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (type system/static analysis, type juggling, serialization,
security/injection, persistence, Composer/supply chain), open the matching section of
**REFERENCE.md** for detail.
