# Python Code Quality Gate — REFERENCE

> **Using this gate:** load **CORE.md** at planning and review time — it is the always-on, self-contained summary (MUST list, risk tiers, score caps, coverage and complexity tables). Open this full document only when a check trips or a listed topic is in scope. Machine enforcement: `configs/`.

> Master guide: this document is intentionally expansive. It is a Python-native quality gate, not a mechanical translation from another language. It treats Python as a production engineering language with dynamic runtime behavior, gradual typing, packaging complexity, async/concurrency sharp edges, dependency supply-chain risk, and powerful metaprogramming features that must be controlled.

## Purpose

This document defines the Python language quality gate for implementation work.

Its purpose is to prevent low-quality Python code from being generated, accepted, copied into the project root, or treated as complete without measurable evidence.

This is not a style preference document. It is an engineering control document.

Python gives teams expressive syntax, an enormous standard library, first-class packaging, mature testing tools, gradual typing, excellent data and web ecosystems, and rapid iteration. Python code can still be poor software. Python code can still be:

- architecturally wrong
- untyped or falsely typed
- import-time side-effect heavy
- runtime-error prone despite passing tests
- `None`-prone
- exception-hostile
- over-dynamic
- dependency-heavy
- supply-chain risky
- async-cancellation unsafe
- thread/process unsafe
- resource-leaking
- serialization unsafe
- insecure by default
- packaging-fragile
- difficult to deploy reproducibly
- hard to audit
- hard to maintain
- business-incorrect even when tests pass

The implementation is not complete when Python files are created. The implementation is complete only when the code:

- runs on the project-approved Python version
- uses the project-approved package/dependency workflow
- is formatted
- passes lint/static analysis or documents justified exceptions
- passes meaningful automated tests
- has type-checking evidence where typing is expected
- preserves architectural boundaries
- models errors explicitly
- avoids unnecessary dynamic behavior
- avoids unsafe deserialization and dangerous standard-library APIs
- handles async, threads, processes, files, sockets, transactions, and subprocesses deliberately
- controls dependency, environment, and packaging reproducibility
- is secure by default
- is auditable where required
- records measurable evidence in `PHASE-RESULT.md`

This document must be followed together with:

- `AGENTS.md`
- `PHASE-PLAN*.md`
- `QUALITY-GATES.md`
- `LANGUAGE-QUALITY-GATE.md`
- `architecture.md`
- `myrules.txt`

If this file conflicts with a phase-specific rule, follow the stricter rule unless the deviation is explicitly documented in `PHASE-RESULT.md`.

---

## Major references this gate aligns with

Use the current project-approved versions of these references, not stale local memory:

- Python documentation: language reference, library reference, typing, asyncio, logging, security considerations
- PEP 8: Style Guide for Python Code
- PEP 257: Docstring Conventions
- Python Packaging User Guide
- PyPA specifications for `pyproject.toml`, project metadata, dependency specifiers, wheels, sdists, and lock-file/reproducible-environment guidance
- `typing` module documentation and the static typing guide
- mypy, Pyright, or the project-approved type checker
- Ruff, Black, isort, or the project-approved formatter/linter policy
- pytest, unittest, coverage.py, Hypothesis, or the project-approved testing stack
- pip, pip-tools, uv, Poetry, PDM, Hatch, tox, nox, or the project-approved environment/build workflow
- pip-audit, Safety, Bandit, Semgrep, or the project-approved security tooling
- OWASP secure coding guidance for web/API/security-sensitive applications

Project policy wins over generic advice, but project policy must be explicit.

---

# 0. Normative Core (read this first)

This section is the enforceable summary of the whole gate. Everything below it is rationale and detail. At the end of any implementation, the LLM or engineer MUST verify every item here. If time or context is limited, obey this core and consult the numbered sections only when a check trips or needs detail.

## MUST (hard gate — a failure caps the score; see Score caps)

1. Code imports and runs under the project-approved Python version.
2. Formatting passes: `ruff format --check .` (or project formatter).
3. Lint and static analysis pass; new findings fixed or justified: `ruff check .`, plus `mypy`/`pyright` where typing is expected.
4. Tests pass and are meaningful for changed behavior, including failure paths: `pytest`.
5. Coverage meets the risk tier (see Default coverage thresholds).
6. Complexity within limits (see Complexity Limits) or justified.
7. Architecture boundaries preserved; business rules stay out of route/view/task functions, persistence, and serialization.
8. Every untrusted boundary validated at runtime (type hints do not validate input).
9. No secrets committed; sensitive data not logged.
10. Failures modeled with exceptions/typed errors; no swallowed failures; async tasks supervised.
11. `PHASE-RESULT.md` created with command evidence and residual risk.

## MUST NOT

- Declare the phase complete merely because code was written.
- Ignore a failed command or skip a relevant command without documenting the concrete blocker.
- Broadly suppress lint/type findings (`# noqa`, `# type: ignore`) to pass.
- Use `pickle`/`yaml.load`/`eval`/`exec` on untrusted input, `assert` for validation/security, mutable default arguments, or import-time side effects.

## Score

Report 0-100. Apply the Score caps. State the evidence for the score and the remaining work to reach 100. The detailed sections below expand each item with Always / Prefer / Avoid / Almost-never guidance.

## Scope by risk tier (read this when planning)

Before implementing, classify the change and scope the plan and the review to its tier. Do not apply critical-tier rigor to a throwaway script, and do not ship business rules with only low-tier checks. When planning, list which checks apply for the tier and state any intentionally excluded and why.

- Low (helpers, simple data holders, internal refactors, throwaway scripts): run, format, lint, basic tests. MUST 1-4, 9-11.
- Medium (application services, validation, persistence/external adapters, API handlers): add failure-path tests, runtime boundary validation, integration, coverage. Add MUST 5, 7, 8.
- High (core business rules, state machines, authorization, money/time logic): add edge-case and regression tests, coverage thresholds, architecture checks, complexity limits. Add MUST 6; tighten 5.
- Critical (security, signing/crypto, legal/financial/compliance, audit, data integrity): add golden/contract tests, error/rejection paths, audit/traceability, async cancellation tests, mutation or property/fuzz tests where applicable. Full gate, no skipped checks.

---

# 1. Non-Negotiable Completion Rule

The implementation LLM must not declare the phase complete merely because Python code was written.

A phase is complete only when:

1. The planned implementation exists.
2. Relevant automated tests exist.
3. The code runs under the project-approved Python version.
4. Formatting was checked.
5. Lint/static analysis was executed where available.
6. Type checking was executed where expected or the lack of type checking was documented.
7. The applicable quality gates were executed.
8. Failures were fixed or documented.
9. `PHASE-RESULT.md` was created.
10. The quality score is supported by evidence.

`PHASE-RESULT.md` must exist before the final message is sent.

The final message must be exactly:

```text
I finished the implementation
```

No extra words. No summary. No apology. No markdown.

## Python hardening

- Completion requires evidence from the exact repository state that will be handed off, not from a scratch directory, stale virtual environment, stale branch, or partial copy.
- Generated Python files count as implementation and must satisfy the same quality gate unless explicitly excluded with a reason.
- A successful `pytest` run alone is not enough when the phase changed dependencies, public APIs, serialization contracts, persistence, legal rules, security behavior, packaging metadata, CLI behavior, or async/concurrency behavior.
- Any skipped command must include the concrete blocker, not a vague statement such as “tool unavailable”.
- Any command run from the wrong directory is invalid evidence.
- Any command run before the final code changes is stale evidence.
- Any manual test must be described as manual evidence and must not replace automated tests for business logic.
- `PHASE-RESULT.md` must explain residual risk in plain language.
- The implementation LLM must not inflate the quality score for code that lacks failure-path tests.
- Python’s dynamic runtime means “it imports” is weak evidence. Import success does not prove contracts, types, error paths, serialization, or security behavior.

---

# 2. Python Version, Runtime, and Interpreter Policy

## Recommendation

Use the Python runtime defined by the project.

Python quality depends on a clear, explicit runtime policy because language features, typing behavior, standard-library APIs, binary wheels, dependency resolution, and deployment images vary by Python version.

## Always do

- Use the Python version already defined by the project.
- Respect `.python-version`, `requires-python`, CI matrix, Dockerfile, runtime image, `tox.ini`, `noxfile.py`, `pyproject.toml`, and deployment configuration.
- Document the exact runtime used in `PHASE-RESULT.md` with `python --version` or `python -VV`.
- Document the package manager/tool workflow used.
- Verify that dependency additions support the project’s Python version range.
- Keep local commands aligned with CI-equivalent commands.
- Avoid relying on whatever `python` happens to point to locally.
- Use virtual environments or project-approved environment isolation.
- Treat implementation support for multiple Python versions as a contract.

## Prefer

- The latest project-approved stable Python release.
- A narrow, explicit support matrix.
- Consistent tool versions in CI and local development.
- Clear upgrade notes when raising the minimum Python version.
- Standard-library features when they are compatible with the support matrix.
- Reproducible interpreter selection through `.python-version`, `uv`, `pyenv`, Docker, asdf, tox, nox, or project-approved tooling.

## Avoid

- Using syntax or standard-library features newer than the project’s minimum Python version.
- Depending on CPython-only behavior unless the project only supports CPython.
- Assuming PyPy, CPython, musl, glibc, Windows, macOS, and Linux all behave identically.
- Hidden reliance on user-site packages.
- Running commands outside the activated project environment.
- Letting Jupyter/kernel state masquerade as repository evidence.

## Almost never do

- Raise the minimum Python version without documenting impact.
- Use development, beta, or release-candidate runtimes in production business code without approval.
- Use global site-packages for implementation evidence.
- Claim compatibility with a Python version that was not tested or type-checked.

## Python hardening

- `requires-python` is part of the public compatibility contract.
- New syntax, such as pattern matching, type parameter syntax, or newer typing features, must match the declared support matrix.
- For reusable libraries, downstream users matter. Do not casually raise the minimum Python version.
- For services and CLIs, verify the runtime inside the deployable image or environment, not only the host machine.
- When optional C extensions or binary wheels are involved, verify platform compatibility.
- Document whether commands used CPython, PyPy, or another interpreter when relevant.

---

# 3. Project Layout, `pyproject.toml`, and Build Metadata

## Recommendation

A Python project must have explicit, standardized project metadata and a layout that prevents accidental imports, packaging bugs, and architecture drift.

## Always do

- Use `pyproject.toml` as the source of project build metadata when the project has packaging/build configuration.
- Keep `project.name`, `project.version` or dynamic versioning, `requires-python`, dependencies, optional dependencies, entry points, and build backend intentional.
- Preserve the project’s existing build backend unless changing it is part of the phase.
- Keep source layout explicit.
- Prefer `src/` layout for packages intended to be installed and tested as installed artifacts.
- Test the installed package behavior when packaging changes matter.
- Keep import paths stable.
- Avoid accidental imports from the working directory that would fail after installation.
- Document packaging metadata changes in `PHASE-RESULT.md`.

## Prefer

```text
pyproject.toml
README.md
LICENSE
src/
  company_project/
    __init__.py
    py.typed
    domain/
    application/
    infrastructure/
    api/
tests/
  unit/
  integration/
  contract/
scripts/
docs/
```

For applications that are not published as libraries, still keep configuration and runtime boundaries explicit:

```text
app/
  main.py
  domain/
  application/
  infrastructure/
  api/
tests/
pyproject.toml
```

## Avoid

- Flat layouts that accidentally pass because the current directory is on `sys.path`.
- Import path hacks inside tests.
- Hidden package data not included in wheels/sdists.
- Multiple packaging tools fighting each other.
- `setup.py`, `setup.cfg`, `requirements.txt`, `Pipfile`, `poetry.lock`, `uv.lock`, and `pyproject.toml` all drifting without a clear policy.
- Putting runtime business logic in packaging scripts.

## Almost never do

- Change the build backend casually.
- Publish a package without testing the wheel.
- Depend on editable-install behavior for production runtime.
- Hide environment setup in undocumented shell scripts.

## Python hardening

- Build metadata is code. Review it as carefully as `.py` files.
- For libraries, include `py.typed` when type information is part of the package contract.
- For applications, package metadata still matters when CI, containers, CLIs, or deployment tooling use it.
- Entry points must be tested because they often break even when imports and unit tests pass.
- Dynamic versioning must be deterministic in CI and source distributions.
- Package data inclusion must be tested when templates, migrations, schemas, certificates, or fixture files are required at runtime.

---

# 4. Dependency and Environment Reproducibility

## Recommendation

A Python build must be reproducible from a clean checkout using documented commands.

Python dependency management is powerful but fragmented. Quality requires a project-approved workflow and evidence that dependency resolution is intentional.

## Always do

- Use the project-approved dependency manager.
- Keep dependency declarations minimal and intentional.
- Keep lock files current when the project uses lock files.
- Keep production and development dependencies separated.
- Pin or lock application dependencies according to project policy.
- Use compatible dependency specifiers for libraries.
- Verify no accidental dependency remains after cleanup.
- Run dependency checks when dependencies change.
- Run tests after dependency graph changes.
- Document dependency additions, removals, upgrades, and security exceptions.
- Avoid machine-specific paths and indexes unless documented.

## Prefer

- `uv sync --locked`, `poetry install --sync`, `pdm sync`, `pip-sync`, `tox`, or `nox` according to project policy.
- A lock file for deployable applications, services, CLIs, jobs, and notebooks that must be reproducible.
- Hash-checked installs for high-assurance requirements workflows.
- Exact reproducible installs in CI.
- Small dependency diffs.
- Standard library before adding a dependency for trivial helpers.
- Optional dependency groups for extras such as `dev`, `test`, `docs`, `security`, and `typing`.
- Dependency review for transitive package count, maintainership, license, release cadence, and security posture.

## Avoid

- Blind `pip install` during implementation without recording it in project metadata.
- Floating production dependency resolution for deployable artifacts.
- Large accidental lock-file churn.
- Adding dependencies to fix design problems.
- Depending on globally installed packages.
- Relying on private package indexes without documenting access requirements.
- Committing credentials in index URLs.
- Vendoring third-party code without license and update policy.

## Almost never do

- Delete lock files to make resolution pass.
- Disable dependency verification to finish a phase.
- Accept a vulnerable dependency because it is “only transitive” without risk review.
- Add abandoned packages to critical production paths.
- Depend on a package with no clear license in commercial or regulated code.

## Python hardening

- For applications, reproducibility means a clean clone can recreate the environment without relying on local caches, user site-packages, hidden indexes, or interactive prompts.
- For libraries, overly strict pins can harm downstream users; use compatible ranges deliberately.
- For compiled dependencies, verify wheel availability for supported platforms.
- For security-sensitive projects, prefer hash-checking, SBOM generation, provenance where supported, and vulnerability scanning.
- Document whether the lock file was updated intentionally.
- Document dependency tools and versions when dependency behavior changed.

---

# 5. Mandatory Command Evidence

The implementation LLM must run the applicable commands and document the result in `PHASE-RESULT.md`.

If a command cannot be run, the reason must be documented.

## Baseline command examples

Use the project’s exact commands when they exist. The following are examples, not replacements for project policy.

```bash
python -VV
python -m pip --version
python -m pip check
python -m pytest
python -m pytest -q
ruff format --check .
ruff check .
python -m mypy .
python -m pyright
python -m coverage run -m pytest
python -m coverage report --fail-under=<threshold>
python -m pip_audit
bandit -r src app tests
python -m build
python -m twine check dist/*
```

## Stronger baseline for applications/services

```bash
python -VV
python -m pip --version
python -m pip check
python -m pytest -q --maxfail=1
python -m pytest -q --strict-markers --strict-config
python -m coverage run --branch -m pytest
python -m coverage report
ruff format --check .
ruff check .
python -m mypy .
python -m pyright
python -m pip_audit
bandit -r src app
python -m build
python -m twine check dist/*
```

## Dependency-manager-specific examples

```bash
uv sync --locked
uv run pytest
uv run ruff format --check .
uv run ruff check .
uv run mypy .
uv run pyright
uv run pip-audit
```

```bash
poetry install --sync
poetry run pytest
poetry run ruff check .
poetry run mypy .
poetry check
```

```bash
pdm sync
pdm run pytest
pdm run ruff check .
pdm run mypy .
```

```bash
tox
nox
```

## Optional but recommended when configured

```bash
python -m pytest -n auto
python -m pytest --random-order
python -m pytest --durations=20
python -m pytest -k <target> --count=50
python -m hypothesis write <module>
mutmut run
cosmic-ray run
semgrep scan
safety scan
pip-licenses
reuse lint
```

## Required evidence format

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

## Commands not run

- `command here`
- Reason:
- Impact:
- Required follow-up:
```

## Python hardening

- A command that was not run is not evidence.
- A command that failed but was ignored is negative evidence.
- A command that failed because a tool is unavailable must still be documented.
- Run commands after final code changes.
- Run commands from the repository root or documented project root.
- If tests require services, document fakes, containers, fixtures, or skipped integration coverage.
- For code touching async/concurrency, include cancellation/race/deadlock-oriented evidence where practical.
- For serialization, include encode/decode/golden/compatibility evidence.
- For persistence, include migration/query/transaction evidence.
- For security-sensitive code, include SAST/dependency/security evidence where configured.

---

# 6. Formatting, Linting, and Style

## Recommendation

Formatting and linting must be automated. Do not debate formatting manually.

## Always do

- Run the project-approved formatter.
- Run the project-approved linter.
- Keep imports sorted according to project policy.
- Keep formatting deterministic.
- Avoid unrelated formatting churn.
- Treat new lint warnings as failures unless documented.
- Keep suppressions narrow and justified.
- Remove unused imports, unused variables, debug prints, and dead code.

## Prefer

- Ruff formatter and linter when the project has standardized on Ruff.
- Black/isort/flake8/pylint only when project policy uses them.
- One formatter as the source of truth.
- Lint rules that catch correctness and maintainability issues, not only cosmetic issues.
- `per-file-ignores` only for narrow, documented cases.
- Pre-commit hooks that mirror CI.

## Avoid

- Mixing formatters with incompatible opinions.
- Blanket `# noqa` comments.
- Suppressing entire rule families because one file is messy.
- Formatting only changed snippets while leaving generated invalid formatting.
- Treating style as a substitute for architecture.
- Leaving `print`, `pprint`, `breakpoint`, `ipdb`, `pdb.set_trace`, or notebook leftovers in production paths.

## Almost never do

- Disable linting to complete a phase.
- Add broad lint ignores without a documented reason.
- Commit unformatted code.
- Reformat the whole repository as part of an unrelated feature phase.

## Python hardening

- Python formatting affects readability, but Python quality goes far beyond formatting.
- Lint findings about mutable defaults, broad exceptions, unused awaits, shadowing, unsafe calls, and complexity are correctness signals.
- Suppressions must explain why the warning is not a real issue.
- Generated files must be formatted/linted unless explicitly excluded with a reason.
- Auto-fixes must be reviewed; they can change semantics.

---

# 7. Static Typing and Type Checker Policy

## Recommendation

Use Python’s gradual type system as a design tool, not decorative syntax.

Type hints should improve correctness, maintainability, IDE support, refactoring safety, public API clarity, and testability.

## Always do

- Follow the project-approved type checker policy.
- Add type hints for public APIs, domain/application code, and non-trivial functions.
- Keep type annotations truthful.
- Avoid `Any` unless there is a boundary or documented reason.
- Avoid `cast` unless the runtime proof is obvious and documented.
- Avoid `# type: ignore` without a specific error code and reason.
- Keep typed and untyped boundaries explicit.
- Use runtime validation for untrusted input; type hints do not validate external data.
- Run the configured type checker.
- Document type-checker failures or skipped type checking.

## Prefer

- `mypy --strict` or a staged strict profile for serious projects.
- Pyright strict mode when the project uses Pyright.
- `Protocol` for structural interfaces.
- `TypedDict` or dataclass/Pydantic models for structured dictionaries at boundaries.
- `NewType` or small domain classes for IDs and constrained values.
- `Literal`, enums, and value objects for closed sets.
- `Final` for constants that must not be reassigned.
- `Self`, `ParamSpec`, and generics when they clarify APIs.
- `typing_extensions` only when needed for supported older Python versions.
- Narrow return types and explicit error/absence semantics.

## Avoid

- Annotating everything as `dict`, `list`, `Any`, `object`, or `Callable[..., Any]`.
- Treating `Optional[T]` as harmless.
- Hiding unknown types behind `cast`.
- Using `type: ignore` as a broom.
- Allowing untyped functions in critical domain code.
- Using runtime `isinstance` chains as a substitute for modeling types.
- Making public APIs depend on private implementation types.

## Almost never do

- Use `Any` in domain models.
- Use `type: ignore` in security, legal, financial, audit, serialization, or persistence code without explicit risk documentation.
- Claim high quality while the project has no type checking and complex dynamic data flows.
- Treat type checker success as proof that runtime input is valid.

## Python hardening

- Python type checking is optional and gradual; teams must choose discipline deliberately.
- Type checkers differ. Do not assume mypy and Pyright behave identically.
- Type hints are not runtime enforcement unless a library explicitly validates them.
- Public libraries must consider type compatibility for downstream users.
- Avoid exposing over-specific concrete types when a protocol or abstract collection type would better express the contract.
- Avoid overly broad `Mapping[str, Any]` payloads in business code.
- Test type-heavy public APIs with representative usage, not only checker configuration.

---

# 8. Naming Rules

## Recommendation

Names must reveal intent.

A maintainer should understand the purpose of a module, class, function, variable, exception, test, or fixture without reading the full implementation.

## Always do

- Use domain language.
- Use precise names.
- Name functions by behavior.
- Name classes by responsibility or domain concept.
- Name exceptions by failure semantics.
- Name tests by expected behavior.
- Use Python naming conventions.
- Keep abbreviations only when domain-standard.
- Distinguish raw input from validated domain values.
- Distinguish DTOs, commands, results, entities, value objects, and persistence records.

## Prefer

- `employee_exposure_period` over `period_data`
- `EventTransmissionReceipt` over `ResponseData`
- `SignedXMLDocument` over `XMLResult`
- `validate_event_version` over `process_version`
- `RawEventPayload` for untrusted input
- `ValidatedEventPayload` after validation
- `UnsignedDocument` before signing
- `SignedDocument` after signing
- `test_validate_event_rejects_expired_certificate` for behavior tests

## Avoid

- Names such as:
  - `helper`
  - `utils`
  - `common`
  - `manager`
  - `processor`
  - `handler`
  - `data`
  - `stuff`
  - `misc`
- Technical-only names for domain concepts.
- Ambiguous service names.
- Boolean parameters whose meaning is unclear.
- Modules named after frameworks instead of responsibilities.
- Shadowing builtins such as `id`, `list`, `dict`, `type`, `file`, and `input` in confusing scopes.

## Almost never do

- Use placeholder names in production code.
- Use single-letter names outside tiny local scopes.
- Let ORM table names or API payload names define the domain vocabulary.
- Use `Thing`, `Object`, `Item`, or `Entry` when a domain name exists.

## Python hardening

- Python modules are importable API surfaces. Name them intentionally.
- Avoid module names that collide with standard-library modules or popular packages.
- Test names should read as behavior specifications.
- Fixtures should be named after the role they play, not their construction details.
- Exception names should help callers distinguish failure categories.

---

# 9. Modules, Packages, and Architectural Boundaries

## Recommendation

Python packages must reflect architecture, not random grouping.

A good Python structure makes invalid dependencies visible and hard to introduce.

## Always do

- Preserve `architecture.md`.
- Keep domain logic separate from infrastructure.
- Keep application/use-case orchestration separate from adapters.
- Keep API/transport models separate from domain models.
- Keep external clients outside the domain.
- Keep persistence models outside the domain unless explicitly approved.
- Keep framework types out of pure domain logic.
- Keep import direction controlled.
- Avoid circular imports by design.
- Keep import-time behavior minimal.
- Use package boundaries and dependency checks where critical.

## Prefer

For a service:

```text
src/project_name/
  __init__.py
  domain/
    employee.py
    event.py
    errors.py
    rules.py
  application/
    commands.py
    results.py
    use_cases.py
    ports.py
  infrastructure/
    postgres.py
    signer.py
    external_client.py
    clock.py
  api/
    http.py
    schemas.py
    mappers.py
  config.py
  main.py
```

For a library:

```text
src/project_name/
  __init__.py
  py.typed
  public_api.py
  _internal/
    implementation.py
```

## Avoid

- One huge `main.py`.
- One giant `utils.py`.
- Domain importing FastAPI, Django ORM, SQLAlchemy sessions, HTTP clients, logging frameworks, or provider SDKs by accident.
- API schemas reused as domain objects.
- ORM models reused as API responses.
- Circular imports fixed with local imports instead of better boundaries.
- Business rules hidden in decorators, middleware, model validators, or database triggers.

## Almost never do

- Put business rules in:
  - HTTP route functions
  - Django views
  - FastAPI dependency injection functions
  - SQLAlchemy models
  - Pydantic schemas
  - Celery tasks
  - CLI argument parsing
  - provider clients
  - Jupyter notebooks
- Use import-time code execution for business behavior.
- Change architecture inside a phase without documenting the reason.

## Python hardening

- Python import cycles are often architectural smell, not just technical inconvenience.
- Import-time side effects make tests, CLIs, workers, and server startup fragile.
- Keep `__init__.py` lightweight; avoid loading the world at import time.
- Use adapters to map framework, database, and provider shapes into application/domain types.
- Boundary mappers must be tested because they frequently contain business bugs.
- Dependency direction should be enforceable through import-linter, deptry, custom lint rules, or code review for critical projects.

---

# 10. Domain Modeling and Data Structures

## Recommendation

Use Python’s data modeling tools to make invalid states hard to represent.

Do not use dictionaries, strings, booleans, tuples, or raw primitives when a meaningful domain type is needed.

## Always do

- Use domain-specific classes, dataclasses, attrs classes, Pydantic models, enums, or value objects where they improve correctness.
- Validate invariants at construction or boundary mapping.
- Keep domain invariants independent from transport, ORM, or serialization tags.
- Distinguish raw input from validated domain state.
- Keep required fields required.
- Avoid invalid intermediate states.
- Model meaningful absence explicitly.
- Use enums or literals for closed sets.
- Test domain invariants.

## Prefer

- Frozen dataclasses or attrs classes for immutable value objects.
- Pydantic models for validated external/API settings where project-approved.
- Domain constructors/factories that return valid objects or raise/return meaningful errors.
- `Enum`, `StrEnum`, or `Literal` for controlled states.
- Small types for identifiers, money, measurements, dates, and legal codes.
- Explicit state transitions such as `mark_as_signed`, `mark_as_sent`, `reject`, `cancel`, and `correct`.

## Avoid

- `dict[str, Any]` as a domain model.
- `tuple` or positional lists for business records.
- Boolean flags that change behavior ambiguously.
- Mutable default values.
- Optional fields for required domain data.
- Letting generated schemas become business vocabulary without review.
- Validation only in UI/API layers when domain correctness depends on it.

## Almost never do

- Represent legal, financial, audit, signing, or workflow state as arbitrary strings.
- Store raw external payloads as domain objects.
- Use comments to describe invariants that types could enforce.
- Allow domain objects to be assembled through a long sequence of setters.

## Python hardening

- `@dataclass` does not automatically validate values.
- `frozen=True` reduces accidental mutation but does not make nested data immutable.
- Pydantic validates model construction but should not replace domain modeling by default.
- ORM models are persistence concerns and often have lifecycle behaviors unsuitable for pure domain logic.
- Named tuples and tuples are useful for small immutable records but become unreadable when fields grow.
- Be explicit about equality, ordering, hashing, and representation for domain objects.

---

# 11. `None`, Optionality, and Absence Semantics

## Recommendation

Use `None` only when absence is legitimate, explicit, and tested.

Python’s `None` is simple but frequently hides invalid state, missing data, failed lookups, and partial initialization.

## Always do

- Use `None` deliberately.
- Annotate optional values explicitly.
- Validate required values before constructing domain objects.
- Avoid returning `None` for failure when callers need a reason.
- Avoid ambiguous return values where absence and failure collapse.
- Test missing, null, empty, zero, and invalid values separately when they differ.
- Avoid defaulting missing external data silently.

## Prefer

- Exceptions or result objects for failure.
- `Optional[T]` only when absence is normal.
- Sentinel objects when `None` is a valid value and omission must be distinguished.
- `Mapping.get` only when missing-key behavior is clear.
- Domain-specific absence states when absence has business meaning.
- Explicit `NotFound` errors where absence is exceptional.

## Avoid

- `return None` from complex operations without a documented contract.
- `Optional` fields everywhere because external JSON may omit fields.
- `x or default` when empty string, zero, false, and empty collection have distinct meanings.
- `assert x is not None` to silence a type checker without runtime proof.
- `None` as a substitute for error handling.

## Almost never do

- Hide technical failures by returning `None`.
- Store partially initialized domain objects.
- Use `None` to represent multiple distinct business states.
- Ignore `Optional` type-checker warnings in critical code.

## Python hardening

- `None`, empty string, empty list, zero, and missing key are different states.
- External JSON `null` may not mean the same thing as missing field.
- Database `NULL` may not mean the same thing as domain absence.
- Public APIs must document whether `None` is accepted and what it means.

---

# 12. Mutability, Aliasing, and Object Ownership

## Recommendation

Prefer immutable data and explicit mutation.

Mutation must preserve invariants and ownership boundaries.

## Always do

- Avoid mutable default arguments.
- Avoid exposing internal mutable collections unless mutation is intended.
- Copy or freeze data at boundaries when ownership is unclear.
- Make mutation methods explicit.
- Preserve invariants after mutation.
- Keep mutation local and obvious.
- Test state transitions.
- Avoid global mutable state.

## Prefer

- Frozen dataclasses/attrs classes for value objects.
- Tuples instead of lists for immutable sequences.
- `Mapping`/`Sequence` abstractions for read-only APIs.
- `copy.copy`/`copy.deepcopy` only when semantics are understood.
- Explicit methods such as `add_line_item`, `mark_sent`, and `record_failure`.
- `contextvars` for request-local state when appropriate, rather than global variables.

## Avoid

- Mutating caller-owned lists or dictionaries without documenting it.
- Returning internal lists/dicts that callers can mutate.
- Shared mutable module-level registries.
- Dataclass fields with mutable defaults.
- In-place mutation in mappers that surprises callers.
- Setter-heavy domain objects that can be invalid between calls.

## Almost never do

- Use global mutable state for business behavior.
- Use caches without invalidation, size limits, and thread-safety review.
- Rely on import-time mutation for runtime configuration.
- Mutate objects used as dictionary keys or set members.

## Python hardening

- Python passes object references. Mutation through aliases is common and often invisible.
- `frozen=True` does not freeze nested lists/dicts.
- Default factories prevent one class of mutable-default bugs but do not solve ownership.
- Caches must be bounded, observable, and safe for the concurrency model.

---

# 13. Error Handling and Exceptions

## Recommendation

Python exceptions must be explicit, meaningful, typed where useful, and tested.

Use exceptions for exceptional failure paths and domain-specific error types for stable semantics.

## Always do

- Raise meaningful exceptions.
- Use custom exception classes for domain/application failures that callers must distinguish.
- Preserve causal chains with `raise ... from ...` when wrapping.
- Avoid leaking sensitive details in external errors.
- Test failure paths.
- Distinguish validation failure, business rejection, authorization failure, conflict, not found, timeout, cancellation, and infrastructure failure.
- Avoid swallowing exceptions.
- Avoid broad `except Exception` unless at a boundary with clear handling.
- Use `finally` or context managers for cleanup.

## Prefer

- Domain exception hierarchy for business failures.
- Infrastructure exceptions mapped to safe application/API errors at boundaries.
- `ExceptionGroup`/`except*` when handling concurrent failures on supported Python versions.
- `contextlib` utilities for clean resource management.
- Error codes or structured fields for auditable legal/business failures.
- Logging exceptions at the layer with useful context, not every layer.

## Avoid

- `except: pass`.
- Catching `BaseException` outside process boundaries.
- Raising generic `Exception` for domain outcomes.
- Comparing exception message strings in production logic.
- Logging and returning/raising the same failure at every layer.
- Using exceptions for ordinary control flow in hot paths.
- Losing root cause by raising a new exception without chaining.

## Almost never do

- Hide data loss, security failures, persistence failures, signing failures, or external rejection paths.
- Catch and suppress `KeyboardInterrupt`, `SystemExit`, or cancellation errors accidentally.
- Treat all external provider errors as retryable.
- Let async task exceptions disappear.

## Python hardening

- Exception messages are not stable contracts; exception types and structured attributes are better.
- `assert` is not validation. Assertions can be disabled with optimization flags.
- Avoid `assert` for checking external input, permissions, security conditions, or business rules.
- Catch the narrowest exception you can handle correctly.
- Preserve traceback and context for internal diagnostics while exposing safe messages externally.

---

# 14. Assertions, TODOs, Debugging Leftovers, and Process Exit

## Recommendation

Production Python must not rely on assertions, debug leftovers, or process termination for normal control flow.

## Always do

- Remove `TODO`, `FIXME`, placeholder implementations, and debug leftovers before completion unless explicitly tracked.
- Avoid `assert` for runtime validation of external data.
- Avoid `sys.exit` outside CLI/process entrypoints.
- Avoid `os._exit` except in extreme low-level process management with documented reason.
- Avoid `print` debugging in production code.
- Replace placeholders with real behavior or documented failure.
- Document intentional stubs or unsupported paths.

## Prefer

- Explicit validation exceptions.
- Logging through project-approved logging.
- CLI functions that return exit codes instead of exiting deep inside libraries.
- `pytest.fail` or normal assertions in tests.
- Feature flags only with clear ownership and cleanup plan.

## Avoid

- `assert user.is_admin` for authorization.
- `raise NotImplementedError` in code paths declared complete.
- `pass` in non-trivial functions.
- `...` as implementation.
- `breakpoint()`, `pdb`, `ipdb`, `rich.print`, `pprint`, and ad hoc dumps.

## Almost never do

- Terminate the process from a library, domain, or application service.
- Leave mock behavior in production paths.
- Use assertions to enforce legal, security, financial, or persistence invariants.

## Python hardening

- `python -O` removes assert statements.
- `sys.exit` raises `SystemExit`; it can be caught and may interact badly with tests and embedding.
- `os._exit` bypasses cleanup and should be treated as dangerous.

---

# 15. Imports, Module Initialization, and Dynamic Loading

## Recommendation

Imports must be deterministic, lightweight, and safe.

Python executes module top-level code at import time. Import-time behavior is runtime behavior.

## Always do

- Keep top-level module code lightweight.
- Avoid network, filesystem, database, environment mutation, logging setup, thread/task creation, or expensive computation at import time.
- Avoid circular imports by design.
- Keep optional imports behind clear boundaries.
- Handle optional dependencies explicitly.
- Use lazy imports only with a documented reason.
- Avoid modifying `sys.path` in application code.
- Avoid import side effects that change global behavior.

## Prefer

- Composition roots for wiring dependencies.
- Explicit plugin registration functions instead of import-time registries.
- `importlib.metadata` for package metadata and entry points.
- Dependency injection at application boundaries.
- Startup functions for services and CLIs.
- Tests that import packages from installed artifacts when packaging matters.

## Avoid

- Importing modules only for side effects.
- Local imports used to hide architecture cycles.
- Monkeypatching modules globally at import time.
- Shadowing standard-library modules with local filenames such as `json.py`, `typing.py`, `email.py`, `logging.py`, or `asyncio.py`.
- Environment-variable reads scattered across modules.

## Almost never do

- Start background threads/tasks during import.
- Connect to databases during import.
- Load secrets during import except through explicit configuration startup.
- Mutate global logging configuration in a library import.

## Python hardening

- Import-time side effects make testing, CLI startup, workers, and packaging fragile.
- Circular imports usually indicate boundary confusion.
- `if __name__ == "__main__"` code should be thin and call tested functions.
- Libraries must not configure root logging on import.

---

# 16. Runtime Validation and Boundary Models

## Recommendation

Type hints are not validation. Every untrusted boundary needs runtime validation.

## Always do

- Treat external input as untrusted.
- Validate request bodies, CLI arguments, environment variables, files, messages, database rows, and provider responses before domain use.
- Keep validation close to the boundary.
- Map validated boundary models to domain types explicitly.
- Test valid, invalid, missing, null, empty, malformed, oversized, and versioned inputs.
- Avoid using domain models directly as untrusted decoding targets unless the domain constructor validates everything.

## Prefer

- Pydantic, attrs validators, dataclass constructors, or explicit parser functions according to project policy.
- Dedicated DTOs/schemas for API, persistence, queue, and provider boundaries.
- Strict JSON parsing when unknown fields should be rejected.
- Explicit enum validation.
- Size limits and shape limits for untrusted payloads.
- Normalized internal representations after validation.

## Avoid

- `dict[str, Any]` moving through application layers.
- Blind `**payload` construction.
- Relying only on type hints for API correctness.
- Trusting provider payloads because they came from “our integration”.
- Silent coercion when exact input semantics matter.
- Validation hidden in unrelated framework magic.

## Almost never do

- Deserialize untrusted data directly into privileged domain objects without validation.
- Treat successful JSON/YAML parsing as business validation.
- Let invalid legal, financial, audit, or security events exist because the transport schema accepted the shape.

## Python hardening

- Pydantic coercion can be helpful or dangerous depending on the contract. Use strict modes/types where coercion would hide bad data.
- Boundary validation must be tested, not assumed.
- Mappers are business-critical code and need tests.

---

# 17. Serialization and Deserialization

## Recommendation

Serialization is a boundary concern.

Do not let JSON, YAML, XML, ORM, pickle, or message payload shapes define the domain model accidentally.

## Always do

- Use DTOs at boundaries.
- Validate decoded data before domain use.
- Test serialization and deserialization.
- Treat unknown fields deliberately.
- Treat missing fields deliberately.
- Keep versioning explicit.
- Avoid exposing internal types unintentionally.
- Make default values explicit and tested.
- Avoid unsafe deserialization.
- Preserve backward compatibility intentionally for public APIs.

## Prefer

- JSON for interoperable APIs when appropriate.
- Safe YAML loaders when YAML is required.
- Explicit XML libraries/builders for XML contracts.
- Golden tests for stable payloads.
- Schema validation where applicable.
- Stable date/time formats.
- Explicit enum string validation.
- Redaction before logging serialized payloads.

## Avoid

- `pickle`, `marshal`, or `shelve` for untrusted data.
- `yaml.load` without a safe loader.
- Building JSON/XML/YAML with string concatenation.
- Silent zero/default values for required business fields.
- Untested custom encoders/decoders.
- Leaking internal enum values into public contracts.
- Raw string comparison for XML when canonicalization/namespaces matter.

## Almost never do

- Unpickle untrusted input.
- Generate legal XML without golden/schema tests.
- Sign serialized payloads without deterministic canonicalization evidence.
- Use generic maps for legal, audit, financial, or security payloads.

## Python hardening

- The standard library documents security warnings for modules such as `pickle`, `shelve`, `subprocess`, `ssl`, `logging.config`, and random-number generation.
- Serialization libraries often have coercion and default behaviors that must be reviewed.
- `datetime`, `Decimal`, bytes, enums, and custom classes require explicit serialization policy.
- API compatibility tests should catch accidental field renames and omitted fields.

---

# 18. Date, Time, Time Zones, and Clocks

## Recommendation

Date/time bugs are business bugs.

Use explicit temporal types and freeze time in tests.

## Always do

- Use timezone-aware datetimes for instants.
- Avoid relying on local machine timezone.
- Define timezone policy.
- Define date-only versus timestamp semantics.
- Define inclusive/exclusive date range semantics.
- Inject a clock/time provider when current time affects business behavior.
- Test time-dependent logic with fixed time.
- Validate date ranges.
- Test boundary dates.

## Prefer

- `datetime` with explicit `tzinfo` for instants.
- `date` for date-only business concepts.
- UTC internally for instants unless the domain requires otherwise.
- `zoneinfo` for IANA time zones where supported.
- ISO-8601/RFC3339 at technical boundaries unless integration requires another format.
- Tests for end-of-month, leap year, DST, timezone conversion, deadline boundaries, and invalid ranges.

## Avoid

- Naive datetimes in business logic involving real-world instants.
- `datetime.now()` directly in domain code.
- Comparing dates as strings.
- Silent timezone conversion.
- Re-parsing date strings throughout business logic.
- Tests that depend on today’s date.

## Almost never do

- Use local machine time as business truth.
- Ignore timezone requirements in legal, payroll, healthcare, audit, or financial workflows.
- Store external date strings directly in domain objects.

## Python hardening

- Naive datetimes are ambiguous.
- DST transitions can create nonexistent or repeated local times.
- Date-only values should not be modeled as midnight datetimes unless the domain explicitly wants that.
- Freeze clocks in tests through dependency injection or project-approved time-freezing tools.

---

# 19. Money, Decimals, Measurements, and Numeric Rules

## Recommendation

Use exact and domain-appropriate numeric types.

Python’s numeric types are powerful, but careless use still creates rounding, overflow-like, precision, and unit bugs.

## Always do

- Define numeric units explicitly.
- Avoid magic numbers.
- Test boundary values.
- Test rounding rules.
- Test minimum/maximum values.
- Avoid binary floating point for money.
- Validate measurements and legal thresholds.
- Document rounding policies.
- Test zero, negative, maximum, fractional, and invalid values where applicable.

## Prefer

- `Decimal` for money/precise decimal calculations when business rules require exact decimals.
- Integer minor units for money when compatible with the domain.
- Domain value objects for money, percentages, rates, quantities, thresholds, and measurements.
- Constants named after business meaning.
- Types/names that include units.
- Explicit rounding modes.
- Property-based tests for numeric invariants.

## Avoid

- `float` for money, payroll, tax, legal, or financial calculations.
- Hidden unit conversions.
- Numeric literals scattered across code.
- Comparing floats directly when tolerance is required.
- Rounding inside unrelated functions.
- Mixing units in the same field.

## Almost never do

- Round legal/payroll/financial values without tests.
- Use binary floating-point for auditable money calculations.
- Treat measurement units as comments instead of names/types.
- Ignore extreme external inputs just because Python integers are arbitrary precision.

## Python hardening

- Python integers avoid fixed-width overflow but can still cause performance/memory problems with unbounded external input.
- `Decimal` context, precision, and rounding must be controlled.
- JSON numeric parsing may lose precision depending on decoder settings and downstream systems.

---

# 20. Collections and Iteration

## Recommendation

Use the clearest collection construct, not the cleverest.

Python comprehensions and iterators are powerful. They can also hide side effects and error handling.

## Always do

- Choose collection types by behavior.
- Make ordering explicit.
- Avoid hidden side effects in comprehensions.
- Preserve deterministic output where tests/contracts require ordering.
- Avoid unnecessary allocation.
- Copy collections at boundaries when ownership is unclear.
- Protect shared mutable collections under concurrency.
- Test empty, singleton, duplicate, large, and unordered cases.

## Prefer

- Lists for ordered mutable sequences.
- Tuples for fixed immutable sequences.
- Sets for membership.
- Dictionaries for keyed lookup.
- `collections` types when they express intent.
- `itertools` for streaming transformations when readable.
- Sorting keys before deterministic output.
- Plain loops for complex branching or error handling.

## Avoid

- Depending on set ordering.
- Relying on dictionary order for semantic behavior unless the contract explicitly states insertion order.
- Nested comprehensions that hide business logic.
- Repeated O(n) scans in performance-sensitive paths.
- Mutating collections while iterating without a deliberate pattern.
- Using `list(...)` on unbounded iterators.

## Almost never do

- Hide persistence, network, signing, or message publishing side effects inside comprehensions.
- Convert whole streams to lists just to simplify control flow.
- Depend on incidental ordering for signatures, hashes, audit records, or serialized payloads.

## Python hardening

- Python dictionaries preserve insertion order in modern Python, but deterministic business output still requires explicit ordering when input order is not controlled.
- Iterators can be consumed once; tests should catch accidental reuse.
- Generators must be closed or exhausted when they own resources.

---

# 21. Async, Await, and Cancellation

## Recommendation

Async Python must be designed, not sprinkled.

Async code has failure modes: swallowed cancellation, orphaned tasks, blocking calls inside event loops, lost exceptions, unbounded concurrency, partial shutdown, timeout confusion, and context leaks.

## Always do

- Use async only when it solves an I/O concurrency problem.
- Never call blocking I/O inside the event loop without an executor or async-compatible library.
- Await coroutines deliberately.
- Supervise background tasks.
- Propagate task errors.
- Use timeouts around external I/O.
- Respect cancellation.
- Do not swallow cancellation exceptions unless deliberately converting them at a boundary.
- Bound concurrency.
- Test success, failure, timeout, cancellation, and shutdown paths.

## Prefer

- `asyncio.TaskGroup` for structured concurrency when the support matrix allows it.
- AnyIO/Trio structured-concurrency patterns when project-approved.
- `asyncio.timeout` or project-approved timeout primitives.
- Async-compatible DB, HTTP, queue, and file libraries only when needed.
- Semaphores or worker pools for concurrency limits.
- Dedicated lifecycle management for workers.
- Context managers for async resources.

## Avoid

- Fire-and-forget `create_task` without ownership.
- `asyncio.gather` without failure/cancellation semantics review.
- Infinite retries.
- Blocking `requests`, file I/O, CPU-heavy loops, or sleeps inside async functions.
- Catching broad exceptions that swallow cancellation.
- Mixing sync and async APIs casually.
- Using sleeps for synchronization.

## Almost never do

- Hide failed async tasks.
- Ignore timeout/cancellation behavior in external integrations.
- Make legal, financial, audit, or external send workflows fire-and-forget.
- Start event loops inside libraries.
- Call `asyncio.run` from code that may already run in an event loop.

## Python hardening

- Structured concurrency features such as `TaskGroup` and timeout scopes use cancellation internally; swallowing cancellation can break them.
- Async cancellation is cooperative. Code must reach await points and cleanup correctly.
- Async resource cleanup requires `async with` or `try/finally` patterns.
- Tests must verify tasks do not leak after cancellation or failure.

---

# 22. Threads, Processes, and Shared State

## Recommendation

Concurrency must be explicit, bounded, observable, and tested.

Python’s GIL does not make code race-free or logically safe.

## Always do

- Keep shared mutable state minimal.
- Define ownership for shared objects.
- Use locks, queues, immutability, or process isolation deliberately.
- Avoid holding locks across slow operations.
- Set timeouts where blocking occurs.
- Propagate worker errors.
- Make shutdown behavior explicit.
- Test concurrency-sensitive behavior.
- Document thread/process assumptions.

## Prefer

- `queue.Queue` for producer/consumer thread communication.
- `concurrent.futures` for bounded pools.
- `multiprocessing` only with serialization, startup, and platform behavior reviewed.
- Immutable data sharing where possible.
- Context managers for locks and resources.
- Idempotent jobs for retries.

## Avoid

- Global mutable state accessed by multiple threads.
- Unbounded thread/process creation.
- Daemon threads as lifecycle management.
- Sharing non-thread-safe clients/sessions without review.
- Forking after threads have started unless the runtime model is reviewed.
- Assuming dict/list operations make compound workflows safe.

## Almost never do

- Fix race conditions with sleeps.
- Hide worker exceptions.
- Use multiprocessing for business logic without serialization and deployment review.
- Hold locks while doing network, database, filesystem, signing, or slow operations.

## Python hardening

- The GIL does not prevent lost updates, deadlocks, logical races, or unsafe external resource use.
- Multiprocessing behavior differs across platforms and start methods.
- Pickling constraints affect process pools and worker payloads.
- Signal handling and shutdown must be tested in services and workers.

---

# 23. Resource Management

## Recommendation

Files, sockets, transactions, locks, subprocesses, temporary directories, and clients must have explicit ownership and cleanup.

## Always do

- Use context managers for resources.
- Close files, HTTP responses, DB cursors/sessions, sockets, and clients.
- Handle cleanup on exceptions.
- Use timeouts for network calls and subprocesses.
- Avoid leaking temporary files/directories.
- Handle partial writes and flush/close errors when they matter.
- Test failure and cleanup paths.

## Prefer

- `with` and `async with`.
- `contextlib.ExitStack`/`AsyncExitStack` for dynamic resource sets.
- Dependency-injected clients with explicit lifecycle.
- Transaction context managers.
- Temporary directories/files from `tempfile`.
- Bounded streams for large data.

## Avoid

- Opening files without closing them.
- Reading entire untrusted files into memory without limits.
- Leaving HTTP responses unclosed.
- Long-lived global clients without lifecycle policy.
- Unbounded subprocess output capture.
- Cleanup hidden in `__del__` or finalizers.

## Almost never do

- Depend on garbage collection for critical cleanup.
- Ignore transaction commit/rollback outcomes.
- Leave resource cleanup untested in workers, async tasks, or batch jobs.

## Python hardening

- CPython reference counting may close some resources sooner than other interpreters, but relying on that is not portable or robust.
- Finalizers are not deterministic cleanup.
- Resource leaks often only appear under load or failure paths.

---

# 24. External I/O, HTTP, Databases, and Transactions

## Recommendation

External I/O must be timeout-aware, retry-aware, idempotency-aware, and testable.

## Always do

- Set timeouts for HTTP, database, queue, cache, and subprocess calls.
- Validate external responses.
- Distinguish retryable and non-retryable failures.
- Make idempotency explicit for retries.
- Use transactions deliberately.
- Test failure, timeout, cancellation, retry, and partial-success paths.
- Avoid provider-specific payloads leaking into domain code.
- Use fakes/contract tests for external integrations.

## Prefer

- Thin clients that map provider behavior to application-level results.
- Explicit request IDs/idempotency keys.
- Circuit breakers/backoff where project-approved.
- Database migrations tested separately from ORM assumptions.
- Repository/port interfaces where they preserve architecture.
- Integration tests with controlled containers/fakes.

## Avoid

- Infinite retries.
- Retrying non-idempotent operations without protection.
- SQL string concatenation.
- Treating HTTP 200 as business success without validating body semantics.
- Hiding business decisions inside SQL queries or ORM hooks.
- Making domain correctness depend on a live external service in unit tests.

## Almost never do

- Perform legal, financial, audit, or external submission workflows without idempotency and failure-path tests.
- Run database migrations without rollback/compatibility review.
- Let provider SDK models become domain models.

## Python hardening

- Many HTTP clients have no default timeout or surprising timeout semantics. Set them explicitly.
- ORM lazy loading can hide database I/O in unexpected places.
- Transactions must define boundaries, isolation assumptions, retries, and rollback behavior.

---

# 25. Security Baseline

## Recommendation

Python security must be designed from the first line of code.

Dynamic language features, rich standard-library APIs, packaging complexity, and serialization tools create specific risks.

## Always do

- Treat all external input as untrusted.
- Validate and encode at boundaries.
- Avoid unsafe deserialization.
- Avoid shell injection.
- Avoid SQL injection.
- Avoid path traversal.
- Avoid leaking secrets and personal data in logs/errors.
- Use cryptographic libraries correctly.
- Use `secrets` for security tokens, not `random`.
- Use TLS verification by default.
- Run security tooling where configured.
- Document security exceptions.

## Prefer

- Parameterized SQL/ORM query parameters.
- `subprocess.run([...], shell=False, timeout=...)` with explicit arguments.
- `pathlib` plus safe path normalization for filesystem operations.
- Established crypto libraries and high-level primitives.
- Secret managers/environment injection through project-approved config.
- Security tests for authz/authn, validation, and sensitive data exposure.
- OWASP guidance for web applications and APIs.

## Avoid

- `eval`, `exec`, dynamic imports from untrusted input, and template execution.
- `pickle`, `marshal`, and unsafe YAML for untrusted data.
- `shell=True` with interpolated strings.
- Disabling TLS verification.
- Logging tokens, passwords, private keys, raw legal/health/personnel payloads, or certificate material.
- Hardcoded credentials.
- Weak hashes for password storage.
- Homegrown cryptography.

## Almost never do

- Use dynamic code execution in business applications.
- Disable certificate verification to make tests or integration pass.
- Store secrets in source files, fixtures, screenshots, notebooks, or logs.
- Accept Bandit/Semgrep/security findings in critical code without review.

## Python hardening

- The standard library explicitly documents security considerations for multiple modules.
- `assert` is not security validation.
- Security-sensitive code must be reviewed for failure modes, not just happy paths.
- Redaction utilities must be tested.
- Authorization must live in a reliable application/domain boundary, not only in UI or middleware decoration.

---

# 26. Supply Chain, Vulnerabilities, Licenses, and Provenance

## Recommendation

Python’s package ecosystem is powerful and risky. Dependency decisions are security decisions.

## Always do

- Review new dependencies before adding them.
- Run vulnerability scanning when dependencies change or when configured.
- Keep dependency versions intentional.
- Keep lock files updated according to project policy.
- Review license compatibility.
- Avoid unmaintained packages in critical paths.
- Avoid typosquatting and dependency-confusion risks.
- Document private index policy without exposing credentials.

## Prefer

- pip-audit, Safety, OSV, Snyk, Dependabot, Renovate, or project-approved scanners.
- SBOM generation for deployable artifacts where required.
- Hash-checked installs for high-assurance environments.
- Trusted publishing/provenance features where applicable.
- Minimal dependency graph.
- Regular small dependency upgrades rather than rare massive upgrades.
- Explicit constraints files when needed.

## Avoid

- `pip install package` based on a blog snippet without review.
- Dependencies with unclear ownership, no releases, no license, or suspicious names.
- Dependency additions for trivial one-line helpers.
- Ignoring transitive vulnerabilities.
- Blind upgrades across major versions.
- Private index fallback behavior that can pull public packages unexpectedly.

## Almost never do

- Disable vulnerability scanning to complete a phase.
- Accept a critical CVE without compensating controls and documented risk owner.
- Publish packages manually from a developer machine when CI provenance is required.

## Python hardening

- Python dependency specifiers can permit vulnerable versions unintentionally.
- Lock files help reproducibility but are not automatically secure.
- Transitive dependencies must be understood for critical systems.
- Build backends and build-time dependencies are part of the supply chain.

---

# 27. Configuration and Secrets

## Recommendation

Configuration must be explicit, validated, typed, and separated from secrets.

## Always do

- Validate configuration at startup.
- Fail fast on missing required configuration.
- Keep secrets out of source code.
- Keep secrets out of logs and error messages.
- Distinguish environment-specific settings from business constants.
- Document required environment variables.
- Test configuration loading and validation.
- Avoid reading environment variables throughout domain code.

## Prefer

- A single configuration module at the composition root.
- Typed settings objects.
- Secret manager integration where available.
- Explicit default values only for safe non-production settings.
- Redacted `repr`/logging for secret-bearing types.
- Separate config for tests, local dev, CI, staging, and production.

## Avoid

- Import-time config loading deep in modules.
- Silent fallback to insecure defaults.
- `.env` files committed with real secrets.
- Passing secrets through CLI arguments that appear in process listings.
- Printing full settings objects.
- Using configuration as a hidden global dependency in domain logic.

## Almost never do

- Hardcode credentials, API keys, private keys, certificates, tokens, or passwords.
- Default production security features to disabled.
- Let tests depend on developer-specific environment variables without fixtures.

## Python hardening

- Environment variables are strings; parse and validate booleans, durations, sizes, URLs, and lists explicitly.
- Secret-bearing dataclasses/Pydantic models need redacted representations.
- Configuration validation should happen before workers start serving traffic.

---

# 28. Logging, Observability, and Auditability

## Recommendation

Logs are operational evidence, not decoration.

For services, workers, integrations, and legal/audit workflows, structured logging and tracing are strongly preferred.

## Always do

- Use the project-approved logging/tracing system.
- Use module-level loggers, not ad hoc root logger usage in libraries.
- Include useful context.
- Avoid logging sensitive data.
- Log failures at the layer with actionable context.
- Avoid duplicate noisy logging.
- Make background task failures observable.
- Keep audit trails separate from ordinary logs when audit is required.

## Prefer

- Structured logs for services and workers.
- Correlation/request IDs where available.
- Stable event names.
- Domain identifiers instead of raw payloads.
- Redaction utilities.
- Clear log levels.
- Metrics/traces for important workflows.
- Audit records for legal/security/business decisions.

## Avoid

- `print` in production code.
- Logging whole request/response bodies by default.
- Logging tokens, passwords, private keys, certificate material, raw legal/personnel/health data, or full provider payloads.
- Logging inside tight loops without rate control.
- Vague messages such as “failed”.
- Configuring root logging inside reusable libraries.

## Almost never do

- Use logs as the only audit trail.
- Hide failures because they were logged.
- Let async/thread/process worker failures disappear.
- Add `__repr__`/`__str__` methods for secret-bearing types without redaction.

## Python hardening

- The Python logging cookbook contains many useful patterns, but logging configuration still must be project-owned.
- Libraries should not surprise applications by changing global logging behavior.
- Structured logging should preserve machine-readable context without leaking sensitive data.

---

# 29. Testing Strategy

## Recommendation

Tests must prove behavior, not implementation trivia.

Python’s dynamic runtime makes automated tests especially important because many mistakes are discovered only by executing code paths.

## Always do

- Write automated tests for meaningful behavior.
- Test happy paths and failure paths.
- Test boundary cases.
- Test `None`, empty, invalid, malformed, and extreme inputs where relevant.
- Test mappers and boundary conversions.
- Test error semantics.
- Keep tests deterministic.
- Avoid relying on test order.
- Avoid real network calls in unit tests.
- Avoid real time in deterministic tests.
- Ensure tests fail for the intended reason.

## Prefer

- pytest with strict markers/config where project-approved.
- Unit tests for pure domain behavior.
- Integration tests for persistence, messaging, external clients, and packaging boundaries.
- Contract tests for external APIs and serialized payloads.
- Golden tests for stable generated output.
- Property-based tests for parsers, validators, numeric rules, and state machines.
- Mutation testing for critical business rules.
- Coverage with branch coverage for meaningful signal.

## Avoid

- Tests that only assert mocks were called.
- Excessive monkeypatching that tests implementation details.
- Sleeping in tests.
- Test pollution through global state.
- Fixtures that hide too much behavior.
- Broad snapshots that are hard to review.
- Network-dependent unit tests.
- Passing tests with warnings ignored.

## Almost never do

- Claim completion without tests for business logic.
- Rely only on manual testing for critical workflows.
- Skip failure-path tests for legal, financial, audit, security, persistence, or integration code.
- Let flaky tests remain unexplained.

## Python hardening

- Dynamic typing means unexecuted branches can hide simple runtime errors.
- Coverage percentage alone is not proof of quality.
- Branch coverage is often more useful than line coverage for business rules.
- Warnings can indicate future failures; treat new warnings as signal.

---

# 30. Test Isolation, Fixtures, and Determinism

## Recommendation

Tests must be isolated, reproducible, and clear.

## Always do

- Isolate filesystem, environment, time, random, database, network, and global state.
- Use temporary directories/files for tests.
- Use fixed seeds where randomness matters.
- Freeze or inject time.
- Reset monkeypatches and environment changes.
- Keep fixtures focused and readable.
- Avoid test interdependence.
- Mark slow/integration tests explicitly.
- Document skipped tests with reasons.

## Prefer

- `tmp_path`, `monkeypatch`, and project-approved fixture patterns.
- Factory functions/builders for test data.
- Minimal realistic fixtures.
- Fake clocks, fake clients, and in-memory adapters for unit tests.
- Containers or controlled services for integration tests.
- Explicit pytest markers for `unit`, `integration`, `contract`, `slow`, and `e2e` where useful.

## Avoid

- Hidden real environment dependencies.
- Tests that require a developer’s machine state.
- Using production credentials or endpoints in tests.
- Large fixture files no one understands.
- Test order dependencies.
- Global monkeypatching outside fixture scope.

## Almost never do

- Run destructive tests against production-like resources without safeguards.
- Make tests pass only when run from an IDE.
- Leave skipped tests without a tracked reason.

## Python hardening

- pytest fixtures are powerful; poorly designed fixtures become invisible architecture.
- Monkeypatching can hide bad design. Prefer dependency injection where it improves production code.
- `pytest -q` passing locally is weaker than a clean environment/CI-equivalent run.

---

# 31. Coverage, Property Testing, Fuzzing, and Mutation Testing

## Recommendation

Use stronger testing techniques where ordinary examples are insufficient.

## Always do

- Measure coverage where project policy requires it.
- Include branch coverage for non-trivial business rules.
- Treat coverage gaps in critical code as risk.
- Use property-based tests for parsers, validators, transformations, numeric rules, and state machines when valuable.
- Document why critical code lacks stronger testing.

## Prefer

- coverage.py with branch coverage.
- Hypothesis for property-based tests.
- Golden tests for stable output.
- Mutation testing for critical rule engines.
- Fuzz-style tests for untrusted input parsers.
- Differential tests when replacing implementations.

## Avoid

- Chasing coverage by testing trivial getters.
- Ignoring untested error branches.
- Snapshots that approve broken output.
- Property tests with too narrow strategies.
- Mutation score claims without reviewing equivalent mutants.

## Almost never do

- Use high line coverage as the only quality signal.
- Omit boundary/failure tests for critical legal, financial, audit, or security logic.
- Accept parsing/validation code without malformed input tests.

## Python hardening

- Coverage must be measured on the same code paths that production uses.
- Excluding lines from coverage must be narrow and justified.
- Property-based tests are only as good as their strategies and invariants.

## Default coverage thresholds

Coverage is necessary but not sufficient. Mutation testing is stronger evidence for critical business rules. Use these defaults; document any shortfall in `PHASE-RESULT.md`.

|Area|Line Coverage|Branch Coverage|Mutation Score|
|---|---|---|---|
|Domain / business rules|>= 90%|>= 85%|>= 80%|
|Critical legal/financial/audit/security rules|>= 95%|>= 90%|>= 85%|
|Application services|>= 85%|>= 80%|>= 75%|
|Infrastructure adapters|>= 70%|>= 60%|When practical|
|API/route handlers|>= 70%|>= 60%|Usually not required|
|Generated code|Exclude only with reason|Exclude only with reason|Exclude only with reason|

---

# 31b. Complexity Limits

## Recommendation

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
|Public symbols per module|<= 10|<= 15|

Exceeding a maximum requires a documented justification in `PHASE-RESULT.md`, not silent acceptance. Generated code may be excluded only with an explicit reason. Tools such as `ruff` (mccabe), `radon`, or `xenon` can enforce these.

---

# 32. Framework Boundaries: FastAPI, Django, Flask, Celery, CLIs, and Jobs

## Recommendation

Frameworks are delivery mechanisms, not the architecture.

## Always do

- Keep framework-specific code at boundaries.
- Keep business rules in domain/application layers.
- Keep route/view/task/command functions thin.
- Validate input at framework boundaries.
- Map framework schemas/models to domain/application types.
- Test framework integration separately from pure business logic.
- Avoid framework global state leaking into domain code.

## Prefer

- FastAPI/Pydantic schemas as transport models, not domain models by default.
- Django ORM models as persistence models, not domain models by default, unless the architecture explicitly accepts active record.
- Celery/RQ/worker tasks as orchestration entrypoints, not business rule containers.
- CLI commands that parse arguments, call application services, and format output.
- Dependency injection/composition roots for wiring.

## Avoid

- Business logic in decorators, middleware, signal handlers, model `save`, route functions, template filters, or task functions.
- Domain code importing web framework request/response classes.
- ORM lazy loading hidden in domain behavior.
- Validation only in a framework layer when background jobs can bypass it.
- Using framework test clients as the only test coverage for business rules.

## Almost never do

- Let framework-generated structure dictate architecture.
- Depend on live web servers for unit tests.
- Hide authorization only in route decorators when application services can be called elsewhere.

## Python hardening

- Framework convenience often hides control flow. Make business rules explicit.
- Signals/hooks/middleware can be hard to test and audit.
- Background jobs need idempotency, retry, timeout, and observability rules.

---

# 33. Metaprogramming, Reflection, Decorators, and Monkeypatching

## Recommendation

Python’s dynamic features must be rare, clear, tested, and justified.

## Always do

- Prefer explicit code before metaprogramming.
- Keep decorators transparent and documented.
- Preserve function metadata with `functools.wraps`.
- Keep monkeypatching out of production unless there is a documented compatibility reason.
- Test decorated behavior and undecorated assumptions.
- Avoid dynamic attribute access in domain logic unless necessary.
- Avoid reflection that hides business rules.

## Prefer

- Simple functions/classes over clever descriptors/metaclasses.
- Registries populated explicitly rather than through import side effects.
- Decorators for cross-cutting concerns only when behavior is clear.
- Protocols/interfaces rather than dynamic duck typing when contracts matter.
- Code generation only for stable external contracts and deterministic outputs.

## Avoid

- Metaclasses for ordinary business logic.
- `getattr`/`setattr` based on untrusted input.
- Dynamic imports from untrusted input.
- Runtime monkeypatching of third-party libraries as normal architecture.
- Decorators that change return types invisibly.
- Hidden retries, transactions, authz, or audit behavior inside obscure decorators.

## Almost never do

- Use `eval` or `exec` for application behavior.
- Hide legal, financial, audit, or security rules in metaprogramming.
- Use monkeypatching to avoid designing a boundary.

## Python hardening

- Dynamic code is hard for type checkers, linters, readers, and security tools.
- Decorators can break introspection, dependency injection, and documentation if metadata is not preserved.
- Metaprogramming requires stronger tests because static tools see less.

---

# 34. C Extensions, Native Code, `ctypes`, `cffi`, and Unsafe Boundaries

## Recommendation

Native boundaries are high-risk integration code.

They must be isolated behind safe Python APIs.

## Always do

- Keep native bindings outside domain logic.
- Validate inputs and outputs across the boundary.
- Document ownership and lifetime rules.
- Document thread-safety assumptions.
- Handle null pointers and error codes safely.
- Preserve error information.
- Test success and failure paths.
- Verify platform and wheel compatibility.
- Document build/deployment requirements.

## Prefer

- Pure Python alternatives when practical.
- Well-maintained packages with audited native internals when necessary.
- Small adapter modules around native calls.
- Wheels for supported platforms.
- Integration tests on supported OS/architecture combinations.
- Fuzz/property tests for parsers or memory-sensitive boundaries.

## Avoid

- Raw `ctypes` calls scattered through application code.
- Passing unvalidated buffers to native code.
- Assuming C strings are valid UTF-8.
- Ignoring foreign error codes.
- Mixing allocation/deallocation ownership.
- Letting foreign pointers or handles escape into domain code.

## Almost never do

- Add native dependencies casually to a portable service.
- Use native code in legal/business/security-critical paths without strong review.
- Publish packages with native code without testing wheels/sdists.

## Python hardening

- Native code changes packaging, deployment, security posture, and platform support.
- Memory safety assumptions must be documented and tested.
- Many Python tools cannot inspect native internals deeply.

---

# 35. Performance, Memory, and Scalability

## Recommendation

Performance work must be measured, not guessed.

Python performance bugs often come from unnecessary I/O, repeated parsing, N+1 database queries, accidental O(n²) loops, giant intermediate lists, inefficient serialization, and blocking calls in async contexts.

## Always do

- Establish correctness before optimization.
- Measure performance-sensitive changes.
- Document benchmarks/profiles in `PHASE-RESULT.md` when performance is part of the phase.
- Test large inputs where size matters.
- Avoid unbounded memory growth.
- Avoid hidden N+1 queries.
- Set limits for external input sizes.

## Prefer

- Profiling with `cProfile`, py-spy, scalene, or project-approved tools.
- Benchmarks with stable inputs.
- Streaming for large files/payloads.
- Pagination for large result sets.
- Database-level bulk operations where appropriate and tested.
- Caching only with invalidation, bounds, and observability.
- Algorithmic improvements before native extensions.

## Avoid

- Micro-optimizing without measurement.
- Converting generators to lists unnecessarily.
- Global unbounded caches.
- Loading entire files into memory by default.
- N+1 query patterns hidden behind ORM relationships.
- Blocking calls in event loops.

## Almost never do

- Add native dependencies for performance without profiling evidence.
- Sacrifice correctness or security for speed without documented approval.
- Treat a fast local test as production scalability evidence.

## Python hardening

- Python’s expressiveness can hide expensive operations.
- A correct asymptotic design often matters more than micro-optimization.
- Benchmarks must run in a controlled environment and compare before/after behavior.

---

# 36. Documentation and Public API Quality

## Recommendation

Documentation must explain contracts, behavior, and operational use. It must not compensate for unclear code.

## Always do

- Document public modules, classes, functions, exceptions, and CLI behavior where appropriate.
- Keep README/API docs consistent with actual behavior.
- Document configuration, environment variables, and deployment assumptions.
- Document error semantics for public APIs.
- Document type and runtime compatibility.
- Keep examples tested when possible.
- Update docs when behavior changes.

## Prefer

- Clear docstrings following project style.
- Type hints plus concise docstrings for behavior and constraints.
- Sphinx, MkDocs, pdoc, or project-approved documentation tools.
- Doctests only when they are valuable and maintained.
- Changelogs for public packages.
- API compatibility notes for breaking changes.

## Avoid

- Docstrings that restate obvious implementation.
- Outdated examples.
- Documentation that promises behavior not tested.
- Public APIs with unclear exceptions, `None` behavior, or mutability.
- Hiding important contracts only in comments.

## Almost never do

- Ship a public library without documenting supported Python versions and API stability.
- Change public behavior without migration notes.
- Treat generated docs as a substitute for reviewed contracts.

## Python hardening

- Type hints communicate shape; docs communicate semantics.
- Public API docs must mention side effects, error behavior, concurrency safety, and resource ownership when relevant.

---

# 37. Data Science, Notebooks, and ML-Oriented Python

## Recommendation

Notebook and data-science code must still meet engineering standards when it affects production, decisions, reports, audits, or reproducibility.

## Always do

- Separate exploratory notebooks from production modules.
- Move reusable logic into tested Python packages.
- Pin/lock environments for reproducible analyses.
- Record data versions and preprocessing assumptions.
- Avoid hidden notebook state as evidence.
- Test feature engineering and transformation logic.
- Validate schemas and units.
- Document randomness and seeds.

## Prefer

- Parameterized scripts/pipelines for repeatable work.
- Deterministic notebooks for reporting only.
- Data validation tools where project-approved.
- Small sample fixtures for tests.
- Model cards, experiment tracking, and lineage where required.

## Avoid

- Production logic only in notebooks.
- Relying on cell execution order.
- Hardcoded local paths.
- Silent type coercion in pandas transformations.
- Ignoring missing values.
- Training/serving skew.
- Unversioned datasets.

## Almost never do

- Use notebook output as the only proof of correctness.
- Deploy model/data transformations without tests.
- Make legal, financial, health, or safety decisions from unreproducible notebooks.

## Python hardening

- Notebooks preserve state that may not exist in a clean run.
- DataFrame operations can silently coerce types and introduce missing values.
- Randomness, data versions, and environment versions are part of reproducibility.

---

# 38. Generated Code and Templates

## Recommendation

Generated Python must be deterministic, reviewable, and tested.

## Always do

- Prefer ordinary Python before code generation.
- Keep generated code deterministic.
- Mark generated files clearly.
- Document generation commands.
- Commit generated code only according to project policy.
- Test generated behavior.
- Avoid hiding business rules in generated code.
- Verify generated files are compatible with formatting, linting, and typing policy or explicitly excluded.

## Prefer

- Generation for external schemas, clients, protocol bindings, or repetitive DTOs when necessary.
- Golden tests for generated payloads.
- Deterministic ordering and stable output.
- Separate generated packages from domain logic.
- Review generated public APIs before accepting them as stable.

## Avoid

- Generators that depend on timestamps, local paths, network state, or nondeterministic map ordering.
- Hand-editing generated files.
- Generated code that imports from scratch paths.
- Generated mocks replacing behavior tests.
- Huge unreviewable diffs.

## Almost never do

- Hide legal, financial, security, or audit rules in templates.
- Generate dynamic code that static tools cannot inspect without stronger tests.
- Add a generator casually to avoid writing clear code.

## Python hardening

- Generated code still runs in production and can contain bugs.
- Regeneration should be reproducible and diffable.
- Generated clients must still validate provider behavior and map errors safely.

---

# 39. CI, Pre-Commit, and Local Developer Workflow

## Recommendation

Quality gates must be easy to run locally and enforced in CI.

## Always do

- Keep CI-equivalent commands documented.
- Keep pre-commit hooks aligned with CI.
- Avoid local-only commands that CI cannot reproduce.
- Keep tool versions pinned or controlled where project policy requires it.
- Fail CI on new formatting, linting, typing, test, build, or security failures according to project policy.
- Make slow/integration/security jobs explicit.

## Prefer

- `make`, `just`, `tox`, `nox`, `uv`, or documented scripts as stable command surfaces.
- Fast local checks before slower full gates.
- CI matrix for supported Python versions and platforms.
- Separate jobs for formatting/linting, typing, tests, packaging, and security.
- Caching that does not hide dependency drift.

## Avoid

- CI commands that differ silently from local commands.
- Non-deterministic dependency resolution in CI.
- Skipping tests because they are slow without a tracked plan.
- Overly broad CI permissions.
- Uploading secrets in logs or artifacts.

## Almost never do

- Merge code that only passes on a developer’s machine.
- Let CI install from untrusted indexes without policy.
- Treat pre-commit success as a substitute for full CI gates.

## Python hardening

- Python tooling stacks can drift quickly. Tool versions and command surfaces must be explicit.
- CI should install from clean environments to catch missing metadata, imports, and package data.

---

# 40. Review Checklist for Python Code

Use this checklist before claiming completion.

## Correctness

- Does the code implement the planned behavior?
- Are edge cases tested?
- Are failure paths tested?
- Are public contracts stable and documented?
- Are boundary mappers tested?

## Typing

- Are public APIs typed?
- Is `Any` avoided or justified?
- Are `cast` and `type: ignore` rare, narrow, and explained?
- Did the configured type checker run?

## Architecture

- Are dependencies pointing in the intended direction?
- Is domain logic free from framework/infrastructure concerns?
- Are imports clean and cycle-free?
- Are import-time side effects avoided?

## Runtime safety

- Is `None` handled deliberately?
- Are resources closed?
- Are timeouts set?
- Are async tasks supervised?
- Are threads/processes bounded and observable?

## Security

- Is untrusted input validated?
- Is deserialization safe?
- Are shell/SQL/path injection risks avoided?
- Are secrets redacted and externalized?
- Did dependency/security tools run where applicable?

## Packaging and environment

- Is `pyproject.toml` correct?
- Are lock files updated intentionally?
- Does the package build if packaging changed?
- Does the code run in a clean environment?

## Maintainability

- Are names precise?
- Is complexity controlled?
- Are docs updated?
- Are tests readable?
- Are dependencies justified?

---

# 41. Quality Score Guidance

A quality score must be evidence-based and is reported on a 0-100 scale.

|Score|Meaning|
|---|---|
|91-100|Implementation complete. Tests cover happy paths, failure paths, boundaries, and critical edge cases. Formatting, lint, typing, tests, packaging, and security checks pass. Architecture preserved. Dependencies minimal and justified. Runtime deterministic and observable. `PHASE-RESULT.md` contains exact command evidence and residual risk.|
|76-90|Implementation complete and most gates pass. Minor documented residual risk. No critical security, correctness, packaging, or architecture concerns. Missing checks justified by concrete blockers.|
|61-75|Implementation works for main paths. Some tests or gates incomplete. Residual risk meaningful but understood. Not production-complete without follow-up.|
|41-60|Code exists but evidence is weak. Failure paths, typing, security, or packaging under-tested. Architecture may be drifting. Significant refactor or verification remains.|
|0-40|Prototype-level. May import or pass a narrow happy-path test but lacks engineering evidence. Must not be considered complete.|

## Score caps

Apply these caps unless there is a documented and justified exception. The score must not exceed:

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

## 100/100 requirement

A phase may score 100 only if all applicable commands pass, tests are meaningful, critical paths are covered, complexity is within limits, architecture is preserved, no known quality gaps remain, no unexplained skipped gates exist, and `PHASE-RESULT.md` contains evidence.

## Python hardening

- Do not award high scores to code with untyped critical paths, broad `Any`, skipped tests, import-time side effects, unsafe deserialization, unmanaged async tasks, or undocumented dependency changes.
- Do not award high scores to code that only passes in a dirty local environment.

---

# 42. Python-Specific Anti-Patterns That Fail the Gate

The following patterns require removal, refactor, or documented exception:

- `dict[str, Any]` flowing through domain logic
- untyped public APIs in critical code
- `Any` as the default escape hatch
- broad `# type: ignore` or `# noqa`
- `except: pass`
- broad `except Exception` without boundary reason
- `assert` for input validation, authorization, or security
- mutable default arguments
- import-time network/database/filesystem side effects
- `eval` or `exec` for application behavior
- unsafe YAML or pickle on untrusted input
- `shell=True` with interpolated strings
- missing HTTP/database/subprocess timeouts
- orphaned async tasks
- blocking calls inside event loops
- hidden global mutable state
- framework route/view/task functions containing business rules
- ORM/API/provider models reused as domain models without review
- tests that only prove mocks were called
- reliance on local environment, notebook state, or global site-packages
- dependency additions without metadata, lock, test, and security review

---

# 43. `PHASE-RESULT.md` Template

Every completed phase must create `PHASE-RESULT.md`.

```markdown
# PHASE-RESULT.md

## Summary

- Planned change:
- Completed change:
- Repository root:
- Python version:
- Dependency manager:
- Runtime/deployment assumptions:

## Files changed

- `path/to/file.py` — reason

## Commands run

- `python -VV`
- `...`

## Commands passed

- `...`

## Commands failed

- `command`
- Reason:
- Impact:
- Required fix:

## Commands not run

- `command`
- Reason:
- Impact:
- Required follow-up:

## Tests added or changed

- `tests/...` — behavior covered

## Type-checking evidence

- Tool:
- Command:
- Result:
- Suppressions added:
- Remaining typed gaps:

## Dependency and packaging evidence

- Dependency changes:
- Lock-file changes:
- Build metadata changes:
- Vulnerability/license checks:

## Security evidence

- Input validation:
- Secrets/logging review:
- Deserialization/subprocess/path/SQL review:
- Security tools:

## Architecture evidence

- Boundaries preserved:
- New imports reviewed:
- Framework/infrastructure leakage:

## Residual risk

Plain-language explanation of what remains risky.

## Quality score

Score:
Evidence supporting score:
Why not higher:
```

---

# 44. Final Implementation LLM Rule

The implementation LLM must leave the repository in a state where another engineer can reproduce the evidence from a clean checkout.

The implementation LLM must not use Python’s flexibility to hide uncertainty.

When unsure, prefer:

- explicit types
- explicit validation
- explicit errors
- explicit boundaries
- explicit tests
- explicit command evidence
- explicit residual-risk documentation

Python rewards clarity. High-quality Python should read simply because the design work already happened.

---

# 45. Reference URLs

These are starting points. Use the current version of each reference when applying this gate.

- Python documentation: https://docs.python.org/3/
- Python security considerations: https://docs.python.org/3/library/security_warnings.html
- Python typing documentation: https://docs.python.org/3/library/typing.html
- Python asyncio tasks and structured concurrency: https://docs.python.org/3/library/asyncio-task.html
- Python logging cookbook: https://docs.python.org/3/howto/logging-cookbook.html
- PEP 8: https://peps.python.org/pep-0008/
- PEP 257: https://peps.python.org/pep-0257/
- Python Packaging User Guide: https://packaging.python.org/
- Writing `pyproject.toml`: https://packaging.python.org/en/latest/guides/writing-pyproject-toml/
- Dependency specifiers: https://packaging.python.org/specifications/dependency-specifiers/
- pip secure installs: https://pip.pypa.io/en/stable/topics/secure-installs/
- mypy documentation: https://mypy.readthedocs.io/
- Pyright documentation: https://microsoft.github.io/pyright/
- Ruff documentation: https://docs.astral.sh/ruff/
- pytest documentation: https://docs.pytest.org/
- coverage.py documentation: https://coverage.readthedocs.io/
- Hypothesis documentation: https://hypothesis.readthedocs.io/
- pip-audit: https://pypi.org/project/pip-audit/
- Bandit documentation: https://bandit.readthedocs.io/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
