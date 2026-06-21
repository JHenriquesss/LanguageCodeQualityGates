# Language Code Quality Gates

Per-language, domain-neutral quality gates for software development. Each gate helps an LLM (or
engineer) **plan** what a change needs and **review/score** the result against measurable evidence.

Each language lives in its own self-contained folder under [`languages/`](languages/). **Download
only the folder for the language you are using** — it has the full gate (summary, reference,
machine-readable manifest, and enforceable configs).

## Languages

| Language | Folder |
|---|---|
| Rust | [`languages/rust/`](languages/rust/) |
| Go | [`languages/go/`](languages/go/) |
| TypeScript | [`languages/typescript/`](languages/typescript/) |
| Python | [`languages/python/`](languages/python/) |
| C# / .NET | [`languages/csharp/`](languages/csharp/) |
| Java | [`languages/java/`](languages/java/) |
| Ruby | [`languages/ruby/`](languages/ruby/) |
| C | [`languages/c/`](languages/c/) |
| C++ | [`languages/cpp/`](languages/cpp/) |
| PHP | [`languages/php/`](languages/php/) |
| Elixir | [`languages/elixir/`](languages/elixir/) |
| JavaScript | [`languages/javascript/`](languages/javascript/) |

## What's in each folder

| File | Purpose |
|---|---|
| `CORE.md` | **Always load.** ~1 page: the MUST gate, MUST NOT, risk-tier scope selector, score model + caps, coverage and complexity tables. Self-contained. |
| `REFERENCE.md` | The full gate document: rationale and per-topic depth. Opened only when a check trips or a topic is in scope. |
| `gate.yml` | Machine-readable manifest (commands, thresholds, risk tiers, score caps) for an LLM or CI to parse. |
| `configs/` | Runnable lint/format/coverage/complexity configs + a CI workflow that enforce the gate on a machine. |
| `README.md` | The folder's own quick start. |

## How an LLM should use these

1. **Plan.** Load the language `CORE.md`. Use the *Scope by risk tier* selector to classify the
   change (low / medium / high / critical). Emit the plan's check-list: which MUST items and extra
   tests apply, and explicitly note anything intentionally excluded and why.
2. **Implement.** Follow MUST NOT. When the change touches a topic (async, SQL, serialization,
   money/time, public API, unsafe), open that section of `REFERENCE.md`.
3. **Review / score.** Walk the `CORE.md` MUST list. **Run the commands** from `gate.yml` /
   `configs/` and read the tool output — do not judge quality by reading code alone. Apply the score
   caps, write `PHASE-RESULT.md` with command evidence and residual risk, and report 0-100.

Two principles:
- **Front-load the CORE, lazy-load the REFERENCE** — never swallow the full document per task.
- **Enforcement is mechanical** — tools decide what they can see; LLM judgment is reserved for what
  they can't: architecture, audit, business correctness.

## Notes

- Gates are domain-neutral and work for any code in the language — from a throwaway script (low
  tier, light checks) to a payment path (critical tier, full gate).
- Numbers in `CORE.md` and `gate.yml` (coverage %, complexity limits, score caps) match `REFERENCE.md`.
- `configs/` files are templates: copy into the target repo, adjust versions/paths, wire the CI workflow.
