# MaaS Tokens — international briefing (example)

7-slide Huawei Cloud sales briefing for overseas audiences. Runtime **1.5.1**. English is primary; Chinese is bilingual-ready.

**Design read:** B2B Huawei sales briefing for international platform / procurement / AI engineering buyers. Trust-first language on token metering. Dials: VARIANCE **3** / MOTION **3** / DENSITY **6**. Accent `#c7000b` on white stage.

## Slides

1. **cover** — MaaS Tokens positioning for enterprise AI consumption  
2. **agenda** — briefing map (value → metering loop → units → lenses → action)  
3. **value** (`callouts`) — predictable metering, governance, scale  
4. **workflow** — request → meter tokens → aggregate → bill / settle  
5. **metering-table** (`table`) — illustrative billing-unit structure with `[Placeholder]` rates  
6. **buyer-tabs** (`tabs`) — Platform / Procurement / AI engineering talk tracks  
7. **thank-you** (`closing`) — canonical Huawei Thank You + bilingual vision close  

Named cut: `?cut=exec` hides **agenda**, **workflow**, and **buyer-tabs** (keeps cover → value → metering-table → thank-you).

## Example-local CSS

Shared chrome, motion, and density live in template `css/` (synced via `sync_runtime.py`). `css/deck-intl.css` is thin intl-only tweaks (cover wash, EN chapter labels) loaded last when present.

## Open locally

```sh
cd examples/maas-token-intl
npm run build
npx --yes serve -l 4174 .
# or: python -m http.server 4174
```

Then open `http://127.0.0.1:4174/` (switch language with **EN**; presenter: `?presenter=1`; exec cut: `?cut=exec`).

## Notes

- No unverifiable official Huawei token prices/SLAs — table rates are structural placeholders only.
- Buyer-tab commercial / compliance / catalog items are marked `[Placeholder]`.
- Generated from this skill’s template via `scripts/init.py --starter blank`.
