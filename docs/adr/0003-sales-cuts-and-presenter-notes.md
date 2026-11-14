# ADR 0003 — Sales cuts and presenter notes

## Status

Accepted

## Context

SE teams share one master deck URL but need CIO vs partner page sets. Presenters also need private cues without showing them on the customer stage.

## Decision

1. **Named cuts** live in `deck.json` as `cuts.<name>.hidden` (stable slide ids). Shared URLs use `?cut=<name>`; cut wins over localStorage hide for that session load.
2. **Presenter notes** are optional bilingual `notes` on each slide. The generator stamps `data-notes` on the section. Notes appear only in presenter mode (`?presenter=1` or shortcut `N`), never in print/PDF thumbnails by default.

## Consequences

- Cuts are declarative and shareable; browser hide remains for ad-hoc local edits.
- Notes stay out of customer-facing chrome unless presenter mode is enabled.
