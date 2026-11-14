# ADR-0002: Runtime version and template sync

## Status

Accepted (sync CLI shipped in 1.2.x; breaking-notes surfacing + CHANGELOG discipline in 1.3.0)

## Context

`scripts/init.py` copytrees the template into each project. Skill fixes do not flow back into forked decks. Authors need a pin they can compare when upgrading.

## Decision

1. Every deck may declare `runtimeVersion` (semver string). Generator defaults to the template's current pin when absent and always emits it on `window.DeckConfig.runtimeVersion`.
2. Template pin lives in one place: `assets/template/package.json` `version` / `deckRuntime` (and mirrored default in the generator).
3. **Sync story (shipped):**
   - **Pin**: deck records the runtime it was generated for
   - **Detect**: compare deck `runtimeVersion` to skill template version
   - **Upgrade**: `scripts/sync_runtime.py` copies changed runtime files while preserving `content/deck.json` and local assets; stamps the new pin; prints CHANGELOG / breaking notes for versions between old and new; authors re-run `npm run build`
4. Scene controller: **one canonical source** at `assets/template/js/scenes.js`; `assets/recipes/scene-controller.js` is a synced copy for recipe docs (never load both).

## Consequences

- Upgrade path is CLI + CHANGELOG, not tribal knowledge
- Breaking schema changes surface at generate time when `jsonschema` is installed
