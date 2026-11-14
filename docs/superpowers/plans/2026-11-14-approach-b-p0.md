# Approach B P0 Implementation Plan

> **Status:** Complete (shipped in `94e520a` + follow-ups). Tracker: GitHub `euthopia/hw-ppt-skill`.

**Goal:** Harden the sales briefing core (schema, layout registry seam, scene sync, generator hygiene, XSS/perf, runtime pin, blank arc) without rewriting the stack.

## Tasks

- [x] Overview caption XSS — `textContent` + test
- [x] Thumbnail refresh gated on overview open
- [x] Scene sync script + equality test
- [x] Layout registry + single translations write
- [x] JSON Schema + `runtimeVersion`
- [x] Blank briefing arc starter
- [x] First-class `pricing` / `scenarios` + asset manifest
- [x] Sales cuts (`?cut=`) + presenter notes (`?presenter=1` / `N`)
- [x] Claims lint warnings in `scripts/audit.py`
- [x] Published to https://github.com/euthopia/hw-ppt-skill
