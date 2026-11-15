# ADR-0001: Approach B — Huawei HTML→PPT deck runtime

## Status

Accepted (2026-11-14); amended 2026-11-15 for multi-purpose archetypes (runtime ≥ 1.5.0).

## Context

The skill ships a vanilla 16:9 HTML stage generated from `deck.json`. Full React/Slidev rewrite (Approach C) would break agent-skill simplicity and the bilingual DOM model. Pure "evolve in place" (Approach A) under-invests in delivery features. Authors need more than product sales briefings (status, design review, workshops) without forking the kit.

## Decision

Evolve toward a **multi-purpose Huawei deck runtime** (Approach B):

- Keep `deck.json` + vanilla stage + agent skill packaging
- Optional `deck.kind` / `meta.purpose` for archetypes; shared layout kit
- JSON Schema, layout registry, runtime versioning + sync story
- Presenter mode, sales cuts, laser + marker ink, named-cut export (see ADR-0003; ink ≥ 1.5.0)
- Editable PPTX export is first-class Office interop; **HTML remains SoR**

## Consequences

- Generator stays free of hard third-party Python deps (`jsonschema` / `python-pptx` are optional soft-deps)
- Forked decks need an upgrade path keyed by `runtimeVersion` (`scripts/sync_runtime.py`)
- New report kinds prefer starters + layout guidance over new frameworks
