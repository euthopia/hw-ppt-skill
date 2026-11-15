# Glossary

| Term | Meaning | Avoid |
|------|---------|--------|
| **Deck** | A Huawei presentation defined by `content/deck.json` and generated into `index.html` (briefing, status, design review, …) | "slide deck app", "PPT-only project" |
| **Deck kind** | Optional `deck.kind` archetype (`product-briefing`, `status-report`, `design-review`, `project-report`, `workshop`) | hardcoding one narrative for every request |
| **Slide** | One `section.slide` page with a `type` (cover, cards, metrics, …) | "page" in schema (use `section` for chapter grouping) |
| **Layout** | The render function for a slide `type` (HTML shape + constraints) | "template" (reserved for the skill template tree) |
| **Layout registry** | Map of `type` → layout render function used by the generator | giant `if/elif` in `body()` |
| **Recipe** | Optional interactive fragment/controller (pricing, scene flow, scenario switch) loaded beside the stage | "plugin" (prefer recipe until ESM runtime) |
| **Scene controller** | Workflow step highlighter (`data-flow-step` / play-replay-all) | "animation engine" |
| **Runtime** | Browser JS that drives navigation, overview, i18n, scenes, presenter ink after generate | "framework" |
| **Runtime version** | Semver pin of the template runtime contract a deck was generated against | "skill version" alone (skill may ship multiple runtime pins later) |
| **Starter** | Seed `deck.json` under `assets/starters/` copied by init | "blank HTML" |
| **Briefing arc** | Cover → value → capability → proof/close narrative shape for sales | random demo collage |
| **Sales cut** | Named subset of slides for a persona/duration (P1+) | "hidden slides" (visibility is presenter-local) |
| **Presenter ink** | Laser pointer + marker/eraser overlays on the scaled 16:9 stage | embedding drawings into PPTX export |
| **Generator** | `tools/render.py` — pure Python, no third-party deps | "build bundler" (that's offline/cloudflare build) |
| **PPTX export** | Editable Office interop from `deck.json` (`npm run export:pptx`); HTML remains SoR | treating PPTX as the authoring source |
