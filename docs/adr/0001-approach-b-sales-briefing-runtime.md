# ADR-0001: Approach B — Sales briefing runtime

## Status

Accepted (2026-11-14)

## Context

The skill ships a vanilla 16:9 HTML stage generated from `deck.json`. Full React/Slidev rewrite (Approach C) would break agent-skill simplicity and the bilingual DOM model. Pure "evolve in place" (Approach A) under-invests in sales delivery features.

## Decision

Evolve toward a **sales briefing runtime**:

- Keep `deck.json` + vanilla stage + agent skill packaging
- Add JSON Schema, layout registry, runtime versioning + sync story
- Promote recipes toward first-class types over time
- Presenter mode, sales cuts, named-cut export, and presenter laser/timer are **shipped** (see ADR-0003; runtime ≥ 1.3.0)

## Consequences

- Generator stays free of hard third-party Python deps (`jsonschema` is an optional soft-dep for schema validation)
- Forked decks need an upgrade path keyed by `runtimeVersion` (`scripts/sync_runtime.py`)
- Interactive theater / PPTX remain adjuncts, not the core rewrite
