# Python Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

## Purpose

This document defines the Python language quality gate for implementation work. Its purpose is to
prevent low-quality Python code from being generated, accepted, copied into a project, or treated as
complete without measurable evidence. It is an engineering control document, not a style preference.

Python is dynamic and gradually typed, with packaging complexity, async sharp edges, and powerful
metaprogramming. Python code can compile, import, and pass a happy-path test and still be
architecturally wrong, falsely typed, `None`-prone, exception-hostile, import-time-side-effect heavy,
dependency-heavy, supply-chain risky, insecure by default, and business-incorrect. "It imports" is
weak evidence.

The implementation is complete only when the code runs on the project Python version, is formatted,
passes lint and (where expected) type checking, has meaningful tests, preserves architecture, models
errors explicitly, validates untrusted input, avoids unsafe deserialization and dangerous APIs,
handles async/concurrency/resources deliberately, controls dependencies, is secure by default, and
records measurable evidence in `PHASE-RESULT.md`.

## 0. Normative Core (read this first)

This section is the enforceable summary. Everything below it is rationale and detail. Verify every
item at the end of any implementation; consult numbered sections only when a check trips.

### MUST (hard gate — a failure caps the score; see Score caps)

1. Code imports and runs under the project-approved Python version.
2. Formatting passes: `ruff format --check .`.
3. Lint and static analysis pass; new findings fixed or justified: `ruff check .`, plus `mypy`/`pyright` where typing is expected.
4. Tests pass and are meaningful for changed behavior, including failure paths: `pytest`.
5. Coverage meets the risk tier (see Default thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of route/view/task functions, persistence, and serialization.
8. Every untrusted boundary validated at runtime (type hints do not validate input).
9. No secrets committed; sensitive data not logged.
10. Failures modeled with exceptions/typed errors; no swallowed failures; async tasks supervised.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

### MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress lint/type findings (`# noqa`, `# type: ignore`) to pass.
- Use `pickle`/`yaml.load`/`eval`/`exec` on untrusted input, `assert` for validation/security, mutable default arguments, or import-time side effects.

### Score

Report 0-100. Apply the Score caps. State the evidence for the score and the remaining work to reach 100.

### Scope by risk tier (read this when planning)

Classify the change and scope the plan and review to its tier. When planning, list which checks apply
and state any intentionally excluded and why. Detail: "Test Types Required by Risk".

- Low (helpers, simple data holders, internal refactors, throwaway scripts): run, format, lint, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters, API handlers): add failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, financial, audit, data integrity, safety-critical): add golden/contract tests, error/rejection paths, audit/traceability, async cancellation tests, mutation or property/fuzz tests where applicable. Full gate, no skipped checks.

## 1. Non-Negotiable Completion Rule

A phase is complete only when the planned implementation exists, relevant tests exist, the code runs
on the project Python version, formatting/lint/type checks ran where expected, applicable gates ran,
failures were fixed or documented, `PHASE-RESULT.md` was created, and the score is supported by
evidence. A passing `pytest` alone is not enough when the phase changed dependencies, public APIs,
serialization, persistence, packaging, CLI behavior, or async behavior.

## 2. Python Version and Runtime

Use the Python runtime defined by the project.

- Always: respect `.python-version`/`requires-python`/CI/Dockerfile; document `python -VV`; use virtual environments; keep local commands aligned with CI; verify dependency additions support the version range.
- Prefer: the latest project-approved stable Python; a narrow, explicit support matrix; reproducible interpreter selection (`uv`/`pyenv`/asdf/Docker).
- Avoid: using syntax/stdlib newer than the minimum version; assuming all interpreters/platforms behave identically; relying on user-site packages; running outside the project environment.
- Almost never: raise the minimum version without documenting impact; use beta/RC runtimes in production without approval; claim compatibility with an untested version.

## 3. Project Layout, Packaging, and Dependency Reproducibility

A Python build must be reproducible from a clean checkout using documented commands.

- Always: use `pyproject.toml` for build metadata; keep a `src/` layout for installable packages; use the project-approved dependency manager; keep lock files current; separate production and dev dependencies; run dependency checks after changes.
- Prefer: `uv sync --locked`/`poetry install --sync`/`pip-sync` per policy; a lock file for deployable artifacts; the standard library before adding a dependency for a trivial helper; `py.typed` for typed libraries.
- Avoid: flat layouts that pass only because the cwd is on `sys.path`; import-path hacks in tests; multiple packaging tools fighting; runtime logic in packaging scripts.
- Almost never: delete lock files to make resolution pass; depend on editable-install behavior for production; publish a package without testing the wheel; commit credentials in index URLs.

## 4. Mandatory Command Evidence

Run the applicable commands and record results in `PHASE-RESULT.md`.

```bash
python -VV
ruff format --check .
ruff check .
mypy .            # or pyright, where typing is expected
pytest
coverage run --branch -m pytest && coverage report
```

Stronger (applications/critical code): `pip-audit`, `bandit -r src`, property tests (Hypothesis),
mutation testing (`mutmut`), `python -m build` + `twine check`. A command not run is not evidence; a
command that failed and was ignored is negative evidence; a tool that is unavailable must still be
documented.

## 5. Formatting, Lint, and Typing

Automate formatting and linting; use the gradual type system as a design tool.

- Always: run the project formatter and linter; treat new lint warnings as failures unless documented; remove unused imports, debug prints, and dead code; add type hints for public APIs and non-trivial functions; run the configured type checker where typing is expected.
- Prefer: Ruff as formatter + linter; lint rules that catch correctness (mutable defaults, broad excepts, unsafe calls, shadowing, complexity); `mypy --strict` or Pyright strict for serious projects; `Protocol`/`TypedDict`/`NewType`/`Literal`/`Final` for clear contracts.
- Avoid: blanket `# noqa`/`# type: ignore`; `Any` as the default escape hatch; `cast` to hide unknown types; `print`/`breakpoint`/`pdb` leftovers in production.
- Almost never: disable linting/type checking to finish; use `Any` in domain models; use `type: ignore` in security/financial/audit/serialization/persistence code without documented risk.

## 6. Naming, Modules, and Architecture

Names must reveal intent; packages reflect architecture.

- Always: use domain language; Python conventions; distinguish raw input from validated values; keep domain logic separate from infrastructure; keep application orchestration separate from adapters; keep transport models separate from domain; keep import-time behavior minimal; avoid circular imports by design.
- Prefer: a `domain`/`application`/`infrastructure`/`api` layout; lightweight `__init__.py`; adapters that map framework/DB/provider shapes into domain types; import-linter/deptry for boundary enforcement on critical projects.
- Avoid: `helper`/`utils`/`common`/`manager`/`processor`/`handler`/`data` names; a giant `main.py`/`utils.py`; domain importing FastAPI/Django ORM/SQLAlchemy/HTTP clients/provider SDKs; business rules in routes, views, DI functions, ORM models, schemas, Celery tasks, or CLI parsing.
- Almost never: placeholder names in production; import-time code execution for business behavior; let ORM/schema names define the domain vocabulary.

## 7. Domain Modeling, None, and Mutability

- Modeling: use dataclasses/attrs/Pydantic/enums/value objects where they improve correctness; validate invariants at construction or boundary mapping; keep required fields required; model closed sets with enums/literals; avoid `dict[str, Any]`/tuples/boolean flags as domain models.
- None: use `None` only when absence is legitimate and tested; annotate optional values explicitly; validate required values before constructing objects; avoid returning `None` for failure when callers need a reason; distinguish missing/null/empty/zero where they differ; avoid `x or default` when `0`/`False`/empty are valid.
- Mutability: avoid mutable default arguments; do not expose internal mutable collections; copy/freeze at boundaries when ownership is unclear; make mutation methods explicit; avoid global mutable state; use frozen dataclasses/tuples for value objects.

```python
from dataclasses import dataclass
from enum import StrEnum

@dataclass(frozen=True)
class EmployeeId:
    value: str

    def __post_init__(self) -> None:
        if not (len(self.value) == 8 and self.value.isdigit()):
            raise ValueError(f"invalid employee id: {self.value!r}")

class EventStatus(StrEnum):   # closed set; reject unknown strings at the boundary
    DRAFT = "draft"
    SIGNED = "signed"
    SENT = "sent"
```

## 8. Error Handling, Assertions, and Imports

- Errors: raise meaningful exceptions; use custom exception classes for failures callers must distinguish; preserve causal chains with `raise ... from ...`; avoid leaking sensitive details; test failure paths; avoid bare `except:`/`except Exception` outside a boundary; use `finally`/context managers for cleanup.
- Assertions: `assert` is not validation (disabled under `-O`); never use `assert` for external input, permissions, security, or business rules; remove `TODO`/`FIXME`/placeholders/`breakpoint()`/`print` before completion; `sys.exit` only at CLI/process entrypoints.
- Imports: keep top-level module code lightweight; avoid network/filesystem/DB/logging-config/thread/task creation at import time; avoid circular imports; do not shadow standard-library modules (`json.py`, `logging.py`, etc.); libraries must not configure root logging on import.

```python
class DomainError(Exception): ...
class ValidationError(DomainError): ...

def parse_event(payload: Mapping[str, object]) -> Event:
    try:
        return Event.from_mapping(payload)
    except KeyError as exc:                       # preserve cause
        raise ValidationError(f"missing field: {exc}") from exc
```

## 9. Runtime Validation and Serialization

Type hints are not validation; every untrusted boundary needs runtime validation, and serialization
is a boundary and security concern.

- Always: validate request bodies, CLI args, env vars, files, messages, DB rows, and provider responses before domain use; map validated boundary models to domain types; test valid/invalid/missing/null/malformed/oversized/versioned inputs; treat unknown/missing fields deliberately.
- Prefer: Pydantic/attrs validators/explicit parsers; dedicated DTOs/schemas per boundary; strict JSON parsing where unknown fields should be rejected; `yaml.safe_load`; golden tests for stable payloads.
- Avoid: `dict[str, Any]` flowing through layers; blind `**payload` construction; relying only on type hints for correctness; building JSON/XML/YAML by string concatenation; silent defaults for required fields.
- Almost never: `pickle`/`marshal`/`shelve` or `yaml.load` on untrusted data; deserialize untrusted data into privileged objects without validation; treat parsing success as business validation.

## 10. Time, Money, and Numerics

Date/time and money bugs are business bugs.

- Always: use timezone-aware datetimes for instants; inject a clock when time affects behavior; test boundary dates (end-of-month, leap year, DST); use `Decimal` or integer minor units for money with explicit rounding; test boundary/zero/negative/fractional values.
- Prefer: `zoneinfo`; UTC internally; ISO-8601/RFC3339 at boundaries; value objects for money/measurements; names that include units.
- Avoid: naive datetimes in business logic; `datetime.now()` in domain code; comparing dates as strings; `float` for money; magic numbers; comparing floats without tolerance.
- Almost never: use local machine time as business truth; use binary floating point for auditable money; round financial values without tests.

## 11. Async, Threads, Processes, and Resources

- Async: use async only for I/O concurrency; never block the event loop; await coroutines deliberately; supervise background tasks; use timeouts and respect cancellation; bound concurrency; test success/failure/timeout/cancellation/shutdown.
- Threads/processes: keep shared mutable state minimal; the GIL does not make code race-free; use locks/queues/immutability/process isolation deliberately; avoid holding locks across slow operations; propagate worker errors; review multiprocessing serialization and platform behavior.
- Resources: use context managers (`with`/`async with`); close files/HTTP responses/DB sessions/sockets; handle cleanup on exceptions; use timeouts for network/subprocess; avoid leaking temp files; do not depend on GC for critical cleanup.
- Almost never: fire-and-forget business operations; fix races with sleeps; hide failed tasks; depend on `__del__`/finalizers for resource correctness.

## 12. Security, Configuration, and Logging

- Security: treat external input as untrusted; validate and encode at boundaries; avoid unsafe deserialization, shell injection, SQL injection, and path traversal; use parameterized queries; use `secrets`/a CSPRNG for tokens; keep TLS verification on; run `bandit`/security tools where configured; do not log secrets or sensitive payloads.
- Configuration: validate config at startup and fail fast; keep secrets out of source/logs; document required env vars; use a single typed config module at the composition root; redact secret-bearing reprs.
- Logging: use module-level loggers (not root in libraries); structured fields; correlation IDs; never log sensitive data; make background-task failures observable; keep audit trails separate from debug logs.
- Almost never: `eval`/`exec`/dynamic code from untrusted input; disable certificate verification to pass tests; hardcode credentials/keys; default production security features to disabled.

## 13. Dependencies and Supply Chain

- Always: review new dependencies (maintenance, license, transitive size, install hooks); run vulnerability scanning when dependencies change; keep lock files updated; avoid unmaintained packages in critical paths; avoid typosquatting/dependency-confusion risks.
- Prefer: pip-audit/Safety/OSV/Dependabot/Renovate; SBOM for deployable artifacts; hash-checked installs for high-assurance; minimal dependency graph; small, regular upgrades.
- Avoid: `pip install` from a blog snippet without review; dependencies with unclear ownership or no license; adding a dependency for a one-line helper; ignoring transitive vulnerabilities.
- Almost never: disable vulnerability scanning to finish; accept a critical CVE without compensating controls and a risk owner.

## 14. Testing Strategy

Tests must prove behavior, not just import or execute lines.

- Always: add/update tests for changed behavior; test failure and boundary paths; test boundary mappers and runtime validation; keep tests deterministic; avoid real network/time/order/external dependence; use behavior-named tests.
- Prefer: pytest; unit tests for domain rules; integration tests for adapters; contract tests for external APIs; golden tests for stable payloads; Hypothesis property tests for validators/parsers/state machines; a fixed clock; mutation testing for critical rules.
- Avoid: tests that only prove a mock was called; broad snapshots that hide data; arbitrary sleeps; tests passing only in one timezone/locale/order; skipping tests without documenting why.
- Almost never: claim completion for business logic without automated tests; rely only on happy paths; mock the unit under test; use live production credentials.

## 15. Test Types Required by Risk

The planning selector. Classify the change, then include exactly this evidence.

- **Low** (helpers, simple data holders, internal refactors): run, format, lint, basic tests.
- **Medium** (services, validation, adapters, API handlers): unit + failure-path tests, runtime boundary validation, integration, coverage.
- **High** (core rules, state machines, authorization, money/time): the above plus edge-case and regression tests, coverage thresholds, architecture checks, complexity within limits.
- **Critical** (security, crypto, financial, audit, data integrity, safety-critical): the above plus golden/contract tests, error/rejection-path tests, audit/traceability, async cancellation tests, property/fuzz tests, security/dependency audit, mutation or documented readiness.

## 16. Coverage and Complexity Limits

Coverage is necessary but not sufficient; assertion quality and branch coverage matter more.

### Default coverage thresholds

|Area|Line|Branch|Mutation|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical security/financial/audit rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/route handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

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
|Public symbols per module|<= 10|<= 15|

Enforced by `ruff` (mccabe), `radon`, or `xenon`. Exceeding a maximum requires a documented
justification in `PHASE-RESULT.md`. Generated code excluded only with reason.

## 17. Quality Score Model

|Score|Meaning|
|---|---|
|0-40|Prototype-level. May import or pass a narrow happy-path test but lacks engineering evidence.|
|41-60|Code exists but evidence is weak. Failure paths, typing, security, or packaging under-tested.|
|61-75|Works for main paths. Some tests or gates incomplete. Not production-complete without follow-up.|
|76-90|Complete and most gates pass. Minor documented residual risk.|
|91-100|Complete with full evidence: happy/failure/boundary/edge tests, format/lint/typing/security pass, architecture preserved.|

### Score caps

|Missing or Failed Evidence|Maximum Score|
|---|---|
|Code does not import/run under the project Python version|30|
|Main tests were not run|40|
|No meaningful automated tests|55|
|Formatting/lint not run and not explained|65|
|Type checking missing where expected and not explained|65|
|Business rules without unit tests|60|
|Runtime validation missing for new untrusted input boundaries|70|
|Architecture boundaries unclear|70|
|No coverage evidence where required|75|
|Async code lacks cancellation/timeout/error-path tests where relevant|80|
|Critical rules without edge-case/failure tests|80|
|Security/dependency audit missing where applicable|85|
|Unsafe deserialization or `assert`-based validation in critical code|80|
|Mutation testing missing for critical rules and not justified|85|
|Known critical bug remains|60|
|Known security issue remains|50|
|Secrets committed|20|
|`PHASE-RESULT.md` missing|50|

### 100/100 requirement

A phase may score 100 only if all applicable commands pass, tests are meaningful, critical paths are
covered, complexity is within limits, architecture is preserved, no known quality gaps remain, no
unexplained skipped gates exist, and `PHASE-RESULT.md` contains evidence.

## 18. Definition of Done

Code runs on the project Python version; formatting and lint pass; type checking ran where expected;
tests pass and meaningful tests were added; coverage meets the tier; complexity within limits or
justified; architecture preserved; business rules out of routes/views/tasks/persistence/serialization;
untrusted input validated; no swallowed failures; async tasks supervised; no secrets introduced;
dependencies justified; `PHASE-RESULT.md` exists. For critical code, also golden/contract/error-path
tests, audit/traceability, async cancellation tests, security/dependency audit, and mutation or
property/fuzz evidence.

## 19. PHASE-RESULT.md Template

```markdown
# PHASE-RESULT.md

## Summary (planned vs completed change, Python version, dependency manager, runtime assumptions)
## Files changed
## Tests added (behavior covered, failure paths covered)
## Commands run
## Commands passed
## Commands failed (reason, impact, required fix)
## Commands not run (reason, impact, follow-up)
## Coverage results
## Lint / type-check results
## Security / dependency audit results
## Architecture boundary checks
## Known limitations
## Deviations from architecture.md
## Quality score: X/100
## Evidence for score
## Remaining work required to reach 100/100
```

## 20. Final Checklist

Runs on the project Python version; format and lint ran; type checking ran where expected; tests pass,
meaningful, cover failure paths; coverage measured or documented; complexity within limits;
architecture preserved; business rules out of routes/views/tasks/persistence/serialization; untrusted
input validated; no unsafe deserialization or `assert`-based validation; no secrets committed;
dependencies justified; `PHASE-RESULT.md` exists; score is evidence-based; remaining work to reach 100
documented.
