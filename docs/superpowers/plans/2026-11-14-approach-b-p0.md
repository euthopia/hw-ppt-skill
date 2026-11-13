# Approach B P0 Implementation Plan

> **For agentic workers:** REQUIRED: Use Matt Pocock `implement` + `tdd` (and/or Codex `executing-plans`). Tracker tickets live in `.scratch/approach-b-p0/issues/`. Steps use checkbox syntax.

**Goal:** Harden the sales briefing core (schema, layout registry seam, scene sync, generator hygiene, XSS/perf, runtime pin, blank arc) without rewriting the stack.

**Architecture:** Keep `deck.json` → Python generator → vanilla runtime. Add registry + schema + version stamp; dedupe scene controller via sync; fix overview caption/refresh.

**Tech Stack:** Python 3 (stdlib-only generator), Node 20 `--test`, vanilla JS, JSON Schema (document + fixture checks)

---

## File map

| Path | Responsibility |
|------|----------------|
| `assets/template/js/app.js` | Overview captions + thumbnail refresh gating |
| `assets/template/js/scenes.js` | Canonical scene controller |
| `assets/recipes/scene-controller.js` | Synced copy for recipes |
| `scripts/sync_scene_controller.py` | Copy canonical → recipe |
| `assets/template/tools/render.py` | Layout registry, single translations write, runtimeVersion |
| `assets/template/schemas/deck.schema.json` | Deck contract |
| `assets/starters/blank.json` | Briefing-arc starter |
| `tests/scene-controller-sync.test.cjs` | Equality seam |
| `tests/p0-generator.test.cjs` / `tests/overview-safety.test.cjs` | Generator + caption seams |
| `docs/adr/0002-*.md` | Sync story |

### Task 1: Overview caption XSS — ticket 01

- [ ] Write failing test forbidding `innerHTML` title interpolation in `app.js`
- [ ] Fix caption to `textContent` elements
- [ ] Re-run test green

### Task 2: Thumbnail refresh — ticket 02

- [ ] Gate `refreshThumbnails` from `render()` when dialog closed
- [ ] Manual/reason check: openOverview still refreshes

### Task 3: Scene sync — ticket 03

- [ ] Add sync script + equality test
- [ ] Run sync; update docs one-liner

### Task 4–5: Generator — tickets 04–05

- [ ] Failing test: generate emits config + single logical contract
- [ ] Remove double write; add layout registry; keep types working

### Task 6–7: Schema + runtimeVersion — tickets 06–07

- [ ] Add schema; stamp `runtimeVersion`; point SKILL/README

### Task 8: Blank arc — ticket 08

- [ ] Rewrite blank starter; validate with generator rules

**Commit:** deferred — user rule requires explicit commit request.
