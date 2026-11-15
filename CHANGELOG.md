# Changelog

All notable changes to the Huawei HTML→PPT deck runtime are documented here.
Format follows a lightweight Keep-a-Changelog style. HTML remains the system of record; PPTX is Office interop.

## 1.5.0 — 2026-11-15

### Added

- **Multi-purpose archetypes**: optional `deck.kind` (`product-briefing` | `status-report` | `design-review` | `project-report` | `workshop`) and `meta.purpose`; layout guidance in `assets/recipes/deck-archetypes/README.md`.
- Starters: `assets/starters/status-report.json`, `assets/starters/design-review.json`; `init.py --starter status-report|design-review`.
- **Presenter marker pen**: freehand ink on the scaled 16:9 stage (`P`/`D`), Huawei red + black (`C`), width (`[`/`]`), eraser (`E`), clear slide (`⇧E`), `Esc` exits tool; per-slide ink (optional `presenterInk.clearOnLeave`); hidden in print/export/thumbnails.
- Extends existing laser (`L`); cheat sheet + i18n updated; `js/presenter-ink.js` seam + tests.
- PPTX export: eyebrow titles, indented bullets, deck `kind` stamp on cover; READMEs/SKILL document `npm run export:pptx` as a first-class option.

### Changed

- Skill/AGENTS/glossary repositioned from briefing-only to Huawei HTML→PPT multi-purpose decks (Approach B unchanged: no React/Slidev).
- Runtime pin **1.5.0**.

## 1.4.0 — 2026-11-15

### Changed

- UX cluster depth (VARIANCE 3 / MOTION 3 / DENSITY 6): shared `--border-accent` / `--border-warm` / `--measure-quote` / `--motion-y-enter` / `--min-card` tokens; table kit stays the red-rail grammar source of truth.
- Cover: white paper stage, left red rail on copy, red eyebrow, solid red-rule (no glow), bilingual subtitle/tagline stack via `cover-bilingual`.
- Closing: tighter grid, tokenized greeting line, smaller logo, EN caption rail, three-beat fade enter.
- Agenda: vertical spine + active rail presence + flatter time chips; Workflow: current/done tiers + line connectors; Before/after: contrast theater; Tabs: selected inset rail (matches scenarios) + panel top rail.
- Callouts/cards/metrics hierarchy (accent elevation only); Layers denser enterprise map; Comparison column tension; Quote paper + attribution strip; Timeline aligned to `--table-scroll-max` / table hover grammar.
- Chrome: header/footer density, controls/progress without lavender drift, TOC current rail, presenter notes left rail; EN parallels in `english.css`.
- CodeArts `deck-intl.css` thinned further (template owns agenda cue); runtime pin **1.4.0**.

## 1.3.2 — 2026-11-15

### Changed

- Slide transitions: direction-aware enter (opacity + subtle translate) via `#deck[data-nav-dir]`; print / thumbnail / `prefers-reduced-motion` stay instant.
- Default kit chrome densified (DENSITY 6): tokenized type scale, red accent rhythm, surfaces for cards / callouts / metrics / layers / comparison / table / timeline / agenda / quote / workflow / tabs / before-after / cover / closing.
- Scrollable table redesign: branded sticky header (red rail + soft edge), thin Huawei scrollbar, density tokens for ZH/EN, restrained row enter; thumbnail/print keep overflow visible and non-sticky.
- Deep template polish (ZH-first + EN parallel): CJK-safe tracking/line-height defaults; Latin uppercase/negative tracking only under `.english-deck`; tokenized layers/quote/closing/image/nav; pricing/scenarios aligned to kit chrome; footer red rail; cover/agenda/tabs/BA/workflow density rhythm.
- Local kit enters delayed after page motion so workflow / tabs / before-after do not fight page transitions.
- CodeArts `deck-intl.css` thinned to intl-only tweaks; shared look inherits template defaults.

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
