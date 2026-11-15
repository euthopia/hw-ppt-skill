# CodeArts Agent — international briefing (example)

7-slide Huawei Cloud sales briefing for overseas audiences. Runtime **1.5.0**. English is primary; Chinese is bilingual-ready.

**Design read:** B2B Huawei sales briefing for international engineering / platform / procurement buyers. Trust-first language. Dials: VARIANCE **3** / MOTION **3** / DENSITY **6**. Accent `#c7000b` on white stage.

## Slides

1. **cover** — CodeArts Agent positioning for international buyers  
2. **agenda** — briefing map (value → how → contrast → lenses → action)  
3. **value** (`callouts`) — what keeps buyers in the room (path, flow, boundaries)  
4. **workflow** — intent → plan → generate/refine → review/handoff  
5. **contrast** (`before-after`) — fragmented delivery → agent-assisted loop  
6. **buyer-tabs** (`tabs`) — Engineering lead / Platform / Governance talk tracks  
7. **thank-you** (`closing`) — canonical Huawei Thank You + bilingual vision close  

Named cut: `?cut=exec` hides **agenda**, **workflow**, and **buyer-tabs** (keeps cover → value → contrast → thank-you).

## Example-local CSS

Shared chrome, motion, and density live in template `css/` (synced via `sync_runtime.py`). `css/deck-intl.css` is thin intl-only tweaks (cover wash, EN chapter labels, agenda cue) loaded last when present.

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
