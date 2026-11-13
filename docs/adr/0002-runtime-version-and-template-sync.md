# ADR-0002: Runtime version and template sync

## Status

Accepted (design for P0; upgrade CLI is P1)

## Context

`scripts/init.py` copytrees the template into each project. Skill fixes do not flow back into forked decks. Authors need a pin they can compare when upgrading.

## Decision

1. Every deck may declare `runtimeVersion` (semver string). Generator defaults to the template's current pin when absent and always emits it on `window.DeckConfig.runtimeVersion`.
2. Template pin lives in one place: `assets/template/package.json` `version` (and mirrored default in the generator).
3. **Sync story (P0 design / P1 CLI):**
   - **Pin**: deck records the runtime it was generated for
   - **Detect**: compare deck `runtimeVersion` to skill template version
   - **Upgrade**: copy changed runtime files (`js/*`, `css/*`, `content/shell.html`) while preserving `content/deck.json` and local assets; re-run generator; surface breaking schema changes via schema + release notes
4. Scene controller: **one canonical source** at `assets/template/js/scenes.js`; `assets/recipes/scene-controller.js` is a synced copy for recipe docs (never load both).

## Consequences

- P0 only adds the field + docs + sync script for the scene controller
- P1 adds `scripts/upgrade_runtime.py` (or similar) and changelog discipline
