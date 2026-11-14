# Agent notes — huawei-product-slides

North star: **Approach B — Sales briefing runtime** (keep `deck.json` + vanilla 16:9 HTML stage + agent skill packaging; evolve schema, layout registry, runtime versioning, recipes). Do **not** rewrite as React/Slidev. Never store GitHub PATs or secrets in the repo.

## Agent skills

### Issue tracker

Local markdown under `.scratch/` (GitHub Issues migration intentionally skipped until euthopia publish auth is safe — P1/P2 pack out of scope). See `docs/agents/issue-tracker.md`.

### Triage labels

Default Matt Pocock roles via `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Engineering workflow

Prefer Matt Pocock skills (`to-spec` → `to-tickets` → `implement` + `tdd` + `code-review`) from the cloned pack at `~/.cursor/skills-src/mattpocock-skills`. Codex `brainstorming` / `writing-plans` may mirror artifacts under `docs/superpowers/` without replacing `.scratch/` as the tracker of record.
