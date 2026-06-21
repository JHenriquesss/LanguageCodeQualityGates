# Elixir Quality Gate — CORE

Always-loaded summary. Self-contained for planning and review. Full rationale and per-topic
detail: **REFERENCE.md**. Machine enforcement: `configs/`.

Engineering control document, not a style preference. Elixir is dynamic and concurrent on the BEAM —
"it compiles" and "it ran once" are weak evidence for processes, error tuples, and supervision.
Implementation is complete only when the code compiles warning-free, is formatted, passes Credo and
Dialyzer, has meaningful tests, models failures with tagged tuples and supervision, validates
untrusted input (never converting it to atoms), preserves context boundaries, is secure by default,
and has evidence in PHASE-RESULT.md.

## MUST (hard gate — a failure caps the score)

1. Compiles clean under the project Elixir/OTP version: `mix compile --warnings-as-errors`; `mix deps.get` clean.
2. Formatting passes: `mix format --check-formatted`.
3. Static analysis passes: `mix credo --strict` and `mix dialyzer`; new findings fixed or justified.
4. Tests pass and are meaningful for changed behavior, including failure paths: `mix test`.
5. Coverage meets the risk tier (`mix test --cover` / excoveralls; see Coverage thresholds).
6. Complexity within limits (Credo; see Complexity limits) or justified.
7. Architecture boundaries preserved; business rules stay out of controllers, templates/views, and Ecto schemas; context boundaries are respected.
8. Untrusted input validated before use; never converted to atoms; deserialized safely.
9. No secrets committed; sensitive data not logged.
10. Errors modeled with tagged tuples (`{:ok, _}`/`{:error, _}`) and handled (`with`/`case`); processes supervised; `@spec` on public functions; no swallowed errors.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because the code compiles or ran once.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Ignore compiler warnings (build with `--warnings-as-errors`); broadly disable Credo checks to pass.
- `String.to_atom`/`List.to_atom` on untrusted input (atom-table exhaustion DoS); `Code.eval_string`/`eval_quoted` on untrusted input; `:erlang.binary_to_term` on untrusted data without `:safe` (remote code execution).
- Spawn unsupervised processes for work that must not be lost; `rescue`/`catch` everything and swallow it; ignore an `{:error, _}` return; put business rules in controllers/templates; build SQL with interpolated fragments (use parameterized Ecto queries).

## Scope by risk tier (use when planning)

Classify the change, scope the plan and review to its tier. Untrusted-input, process/supervision, and
auth changes are never low tier. In the plan, list which checks apply and state any intentionally
excluded and why.

- **Low** (pure functions, simple structs, internal refactors, throwaway scripts): compile warning-free, format, Credo, basic tests. MUST 1-4, 9-11.
- **Medium** (context functions, validation, persistence/external adapters, GenServers): + failure-path tests, input validation, Dialyzer, integration, coverage. Add MUST 3, 5, 7, 8.
- **High** (core business rules, state machines, authorization, money/time logic, supervision trees): + edge-case and regression tests, coverage thresholds, architecture checks, complexity limits, process/crash tests. Add MUST 6.
- **Critical** (security, auth, crypto, payments, financial, audit, data integrity, distributed state): + golden/contract tests, error/rejection paths, audit/traceability, property tests, dependency/SAST audit, mutation tests where applicable. Full gate, no skipped checks.

## Score (0-100)

|Score|Meaning|
|---|---|
|0-40|Code exists but is not safely verified|
|41-60|Compiles with weak tests, no Credo/Dialyzer evidence, or unclear structure|
|61-75|Working implementation with meaningful tests and clean Credo at a basic level|
|76-90|Strong implementation with good tests, Credo strict + Dialyzer clean, low complexity, clean context boundaries|
|91-100|Production-grade: warning-free, Credo strict + Dialyzer clean, supervised processes, strong tests, validated boundaries, no known security defects|

### Score caps (max score when evidence is missing/failed)

|Missing or Failed Evidence|Max|
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
|PHASE-RESULT.md missing|50|

## Coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules (contexts)|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services / GenServers|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|Controllers / channels / glue|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

## Complexity limits

|Item|Target|Maximum|Tool|
|---|---|---|---|
|Function cyclomatic complexity|<= 8|<= 10|Credo Refactor.CyclomaticComplexity|
|Function cognitive / nesting depth|<= 2|<= 3|Credo Refactor.Nesting|
|Function length|<= 30 lines|<= 50 lines|Credo Refactor.LongQuoteBlocks / review|
|Module length|<= 300 lines|<= 500 lines|review|
|File length|<= 400 lines|<= 600 lines|review|
|Function arity (parameters)|<= 4|<= 6|Credo Refactor.FunctionArity|
|Public functions per module|<= 10|<= 15|review|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

---

When a check trips or a topic is in scope (typespecs/Dialyzer, processes/OTP/supervision, atoms and
untrusted input, serialization, Ecto/persistence, security, hex/supply chain), open the matching
section of **REFERENCE.md** for detail.
