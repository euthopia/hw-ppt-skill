# Changelog

All notable changes to the Huawei product briefing runtime are documented here.
Format follows a lightweight Keep-a-Changelog style. HTML remains the system of record; PPTX is Office interop.

## 1.3.1 — 2026-11-14

### Added

- Layout: first-class `before-after` (static Before → After panels; schema + CSS + PPTX + tests). Complements `comparison` and interactive `tabs`.

### Skipped (intentional)

- GitHub Issues migration blocked until euthopia publish auth is safe (see `AGENTS.md`).

## 1.3.0 — 2026-11-14

### Added

- Named-cut export: `node tools/export.cjs --cut <id>` resolves `deck.cuts` hidden ids; composes with `--slides` (cut first).
- Generate-time `deck.schema.json` validation via optional `jsonschema` (`pip install jsonschema`); soft-dep with install hint when missing.
- Layouts: `agenda`, `quote` (proof), and first-class interactive `tabs` (JS recipe + aria tablist).
- Presenter laser pointer (`L`) and elapsed timer in presenter chrome; cheat sheet updated.
- `cover` / `closing` registered through the LAYOUTS registry (full-slide shells).
- Chinese README Upgrade section mirroring `sync_runtime.py` instructions.
- `sync_runtime.py` surfaces CHANGELOG / breaking notes when upgrading a deck pin.

### Changed

- Richer PPTX: native Office tables for `table` type; stronger cover/closing composition; red accent and notes retained.
- a11y: dialog focus return, aria on controls/cheat-sheet; new motion respects `prefers-reduced-motion`.
- ADR-0001 / ADR-0002 status text updated for shipped presenter/cuts/sync story.

### Breaking notes

- Decks that relied on unknown top-level `deck.json` keys will fail generate when `jsonschema` is installed (schema `additionalProperties: false`).
- Export `--cut` that hides every slide, or references an unknown cut id, fails instead of exporting the full deck.

### Skipped (intentional)

- `before-after` layout was deferred in 1.3.0 (shipped in 1.3.1).
- GitHub Issues migration blocked until euthopia publish auth is safe (see `AGENTS.md`).

## 1.2.1 — 2026-11-14

### Fixed / polished

- PPTX red accent rail; cut unknown-id generate failure tests; presenter `?` help + `N` in first-run hint; thumbnail/print overflow for timeline/callouts/tables; Windows export python-cmd path.

## 1.2.0 — 2026-11-14

### Added

- Timeline + callouts layouts; editable PPTX export; presenter notes; named sales cuts (`?cut=`).
