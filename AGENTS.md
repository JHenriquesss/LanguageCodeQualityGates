# Agent instructions

This repo holds per-language code quality gates under `languages/`. When working on a project,
select the folder matching the language and follow its `AGENTS.md`.

For each language folder:
- `gate.yml` — machine-readable: commands, thresholds, risk tiers, score caps. Parse this.
- `CORE.md` — always-load human summary (MUST gate, tiers, caps, tables).
- `REFERENCE.md` — full detail, opened on demand only.
- `configs/` — runnable lint/format/coverage/CI that enforce the gate.

Plan with the risk-tier selector, implement against MUST NOT, review by running the gate commands
and applying the score caps. Front-load CORE.md; lazy-load REFERENCE.md.
