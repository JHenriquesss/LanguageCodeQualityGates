# PHP Code Quality Gate

Self-contained quality gate for PHP. Download **this folder** to use it on a PHP project — it has everything.

## Files
- `CORE.md` — **always load this.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables.
- `REFERENCE.md` — the full document. Open a specific section only when a check trips or that topic is in scope.
- `gate.yml` — machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse deterministically.
- `configs/` — PHPStan (`phpstan.neon`), PHP-CS-Fixer (`.php-cs-fixer.dist.php`), PHPMD complexity (`phpmd.xml`), PHPUnit (`phpunit.xml.dist`), and a CI workflow that **enforce** the gate. Copy into your repo and adjust paths/version.
- `AGENTS.md` — instructions that tell an agent to load CORE.md, parse gate.yml, plan by risk tier, and review by running the gate.

## How an LLM (or engineer) uses it
1. **Plan** — read `CORE.md`; classify the change by risk tier (low/medium/high/critical); list which MUST items and extra tests apply, and note anything intentionally excluded and why. Untrusted-input and auth changes are never low tier.
2. **Implement** — follow MUST NOT. Declare `strict_types=1`, use `===`, validate input and escape output at boundaries, use prepared statements, never use `@`. When the change touches a topic (static analysis/types, type juggling, serialization, security/injection, persistence, Composer), open that section of `REFERENCE.md`.
3. **Review / score** — run the commands from `gate.yml` / `configs/`: `php -l`, PHPStan/Psalm at the project level, the formatter, tests with coverage, `composer audit`. Apply the score caps, write `PHASE-RESULT.md` with evidence, report 0-100.

Front-load `CORE.md`; lazy-load `REFERENCE.md`. The linter, static analyzer, and tests enforce what they can see; reserve judgment for architecture, audit, and business correctness.
