# CodeArts Agent — international briefing (example)

4-slide Huawei Cloud sales briefing for overseas audiences. Runtime **1.3.0**. English is primary; Chinese is bilingual-ready.

## Slides

1. **cover** — CodeArts Agent positioning for international buyers  
2. **value** (`cards`) — why buyers care (delivery path, engineering flow, enterprise posture)  
3. **workflow** — intent → plan → generate/refine → review/handoff  
4. **thank-you** (`closing`) — Huawei vision close  

Named cut: `?cut=exec` hides the workflow slide for a shorter exec pass.

## Open locally

```sh
cd examples/codearts-agent-intl
npm run build
npx --yes serve -l 4173 .
# or: python -m http.server 4173
```

Then open `http://127.0.0.1:4173/` (switch language with **EN**; presenter: `?presenter=1`).

## Notes

- No unverifiable prices/SLAs — confirm region claims with product marketing before customer use.
- Generated from this skill’s template via `scripts/init.py --starter blank`.
