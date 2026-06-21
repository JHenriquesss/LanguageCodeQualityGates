# Ruby Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. Ruby is dynamic and metaprogramming-heavy —
"it loads" is weak evidence. Implementation is complete only when the code runs on the project Ruby
version, passes RuboCop (style + lint + security + complexity), has meaningful tests, validates
untrusted input, raises/handles errors explicitly, preserves architecture, is secure by default, and
has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Code loads and runs under the project Ruby version: `bundle install` clean, `ruby -c` on changed files.
2. RuboCop style/format passes: `bundle exec rubocop` (no offenses).
3. RuboCop lint + Security cops pass; new offenses fixed or justified with narrow inline disables.
4. Tests pass and are meaningful for changed behavior, including failure paths: `bundle exec rspec` (or `rake test`).
5. Coverage meets the risk tier (SimpleCov; see Coverage thresholds).
6. Complexity within limits (RuboCop Metrics; see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, model callbacks, serializers, and views.
8. Every untrusted boundary validated before domain use.
9. No secrets committed; sensitive data not logged.
10. Errors raised/handled explicitly at the right layer; no swallowed `rescue`.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly disable RuboCop (`rubocop:disable all`, large disabled blocks) to pass.
- `eval`/`instance_eval`/`send` on untrusted input; `Marshal.load`/`YAML.load` on untrusted data; `Kernel#open`/`URI.open` with untrusted input.
- Empty or swallowing `rescue` (`rescue nil`, `rescue => e; end`), `rescue Exception`, monkey-patching core classes, or hiding business rules in `method_missing`/metaprogramming.

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Do not apply critical-tier rigor to a
throwaway script; do not ship business rules with only low-tier checks. In the plan, list which
checks apply and state any intentionally excluded and why.

- **Low** (helpers, simple value objects, internal refactors, throwaway scripts): load, rubocop, basic tests. MUST 1-4, 9-11.
- **Medium** (application services, validation, persistence/external adapters, API endpoints): + failure-path tests, boundary validation, integration, coverage. Add MUST 5, 7, 8.
- **High** (core business rules, state machines, authorization, money/time logic): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- **Critical** (security, signing/crypto, financial, audit, data integrity, safety-critical): + golden/contract tests, error/rejection paths, audit/traceability, concurrency/thread-safety tests, mutation tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Basic implementation with weak tests or unclear structure|
|61-75|Working implementation with meaningful tests and acceptable structure|
|76-90|Strong implementation with good tests, low complexity, and clean boundaries|
|91-100|Production-grade implementation with strong evidence, clear boundaries, strong error handling, no known gaps|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
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
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/route handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

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

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (metaprogramming, concurrency, serialization, persistence,
security, gems/supply chain), open the matching section of **REFERENCE.md** for detail.
