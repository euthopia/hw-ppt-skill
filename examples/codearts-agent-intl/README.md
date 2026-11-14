# CodeArts Agent — international briefing (example)

7-slide Huawei Cloud sales briefing for overseas audiences. Runtime **1.3.1**. English is primary; Chinese is bilingual-ready.

## Slides

1. **cover** — CodeArts Agent positioning for international buyers  
2. **agenda** — tight sales arc (value → how → contrast → lenses → action)  
3. **value** (`cards`) — why buyers care (delivery path, engineering flow, enterprise posture)  
4. **workflow** — intent → plan → generate/refine → review/handoff  
5. **contrast** (`before-after`) — fragmented delivery → agent-assisted loop  
6. **buyer-tabs** (`tabs`) — Engineering lead / Platform / Governance conversation lenses  
7. **thank-you** (`closing`) — Huawei vision close  

Named cut: `?cut=exec` hides **agenda**, **workflow**, and **buyer-tabs** (keeps cover → value → contrast → thank-you).

## Open locally

```sh
cd examples/codearts-agent-intl
npm run build
npx --yes serve -l 4173 .
# or: python -m http.server 4173
```

Then open `http://127.0.0.1:4173/` (switch language with **EN**; presenter: `?presenter=1`; exec cut: `?cut=exec`).

## Notes

- No unverifiable prices/SLAs — confirm region claims with product marketing before customer use.
- Buyer-tab commercial / compliance items are marked `[Placeholder]`.
- Generated from this skill’s template via `scripts/init.py --starter blank`.
