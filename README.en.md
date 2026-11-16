# Huawei Product Slides

**An Agent Skill for Huawei-branded bilingual HTML→PPT decks.** You supply content; the agent picks a deck archetype, organizes chapters, picks layouts, generates Chinese/English pages, wires light motion, runs layout checks, and builds deliverables — including **editable PPTX** when asked.

Skill **1.5.6** · canvas runtime **1.5.6** · see [CHANGELOG.md](CHANGELOG.md)

Built for product briefings, weekly/status reports, architecture design reviews, project milestone decks, workshops, comparisons, packaging, customer cases, and live demos.

[Live demo: cover + blank](https://huawei-product-slides-demo.leonguo08.workers.dev/) · [Thank-you preview](demo/thank-you-preview.png) · [Changelog](CHANGELOG.md) · [中文 README](README.md)

## What you get

| Deliverable | How you use it |
| --- | --- |
| Interactive HTML deck | Browser presentation with navigation, TOC, language toggle, fullscreen |
| Offline single-file HTML | Images/CSS/JS inlined — save and open anywhere |
| PDF | One-command Chinese, English, or both — static 16:9 pages |
| Editable PPTX | `deck.json` → PowerPoint-friendly `.pptx` (left Huawei-red accent + speaker notes) |
| Editable project source | Content, components, styles, and deploy config stay separate |
| Hosted demo site | Cloudflare Workers or Sites ESM Worker with optional PIN gate |

## Features

- **Brand & layout** — Huawei logo, white stage, red accent `#c7000b`, 16:9 canvas, shared header/footer; Yunshan / Jinsha / mountain covers.
- **Layout kit** — cover, cards, metrics, architecture, comparison, **tree**, **formula**, **split**, **panels**, **before-after**, **scrollable tables**, workflow, image, pricing, scenarios, timeline, callouts, **agenda**, **quote**, **tabs**, custom, closing; optional **summary / tag / focus**.
- **Bilingual** — one-click ZH/EN, English typography sheet, remembered preference, bilingual TOC/controls.
- **Multi-purpose archetypes** — optional `deck.kind` (`product-briefing` / `status-report` / `design-review` / `project-report` / `workshop`) plus `meta.purpose`; see starters below.
- **Presenter tools** — keyboard/touch nav, fullscreen, chapter jump, thumbnail TOC, position memory, **presenter notes** (`N` / `?presenter=1`), **laser** (`L`), **marker/eraser** (`P`/`D`/`E`, `⇧E` clears slide), **numbering marks** (`B`, click to stamp 1/2/3…), **hover tool rail** (right edge; parallel to keys), **shortcut cheat sheet** (`?`), **named sales cuts** (`?cut=cio`).
- **Slide hide** — TOC “hide slides” saved per project in the current browser; navigation skips hidden pages.
- **Motion** — direction-aware page enter/exit (soft clip + micro-scale + restrained red-rule flash); workflow auto-highlight with pause/replay/show-all; stops off-slide; instant / undecorated for `prefers-reduced-motion`, print, and thumbnails.
- **Access control** — server PIN + signed cookie for hosted decks.
- **Exports** — CLI for offline HTML, PDF, and **editable PPTX** without rewriting scripts.
- **QA** — bilingual overflow checks, contact sheets, PIN/deploy tests.

The base skill does **not** embed product-specific API consoles. Deploy needs your platform credentials.

## Install

Clone into an agent skills directory and keep the relative layout:

```sh
git clone https://github.com/euthopia/hw-ppt-skill.git ~/.agents/skills/huawei-product-slides
```

Or install under the project’s `.agents/skills/huawei-product-slides/`. Reload the session and confirm `$huawei-product-slides` is visible.

## Use the skill

Give the agent content in plain language:

> Use $huawei-product-slides to brief enterprise customers on Product X: positioning, three advantages, architecture, plans, and one case. Bilingual. Yunshan cover.

Ask for layout tweaks, motion, images, PPTX/PDF export, or deploy as needed. The agent fills `deck.json`, builds, and runs checks.

## Create a project manually

Needs Node.js 20+ and Python 3. Core generate/build needs no npm install.

```sh
python3 scripts/init.py /path/to/my-product-deck \
  --id my-product-deck \
  --title 'Product X briefing' \
  --title-en 'Product X briefing' \
  --starter blank

# Other archetypes:
#   --starter status-report | design-review | project-report | workshop

cd /path/to/my-product-deck
npm run build
npm test
```

| Starter | Contents |
| --- | --- |
| `--starter blank` | Product briefing arc: cover → agenda → tree → value cards → formula → split matrix → panels → next → thank-you (`kind: product-briefing`) |
| `--starter status-report` | Weekly/status: agenda → metrics → timeline → risks → actions → thank-you |
| `--starter design-review` | Design review: context → architecture → before/after → options → opens → thank-you |
| `--starter project-report` | Project stage: metrics → milestones → delivery → risks → actions → thank-you |
| `--starter workshop` | Workshop: agenda → outcomes → flow → role tabs → prompt → thank-you |
| `--starter examples` | Template component sample (layouts + workflow) |

Layout guidance by archetype: [`assets/recipes/deck-archetypes/README.md`](assets/recipes/deck-archetypes/README.md).

Edit `content/deck.json` (schema: `assets/template/schemas/deck.schema.json`). Custom pages use `content/*.html`. See [content & components](references/content-and-components.md).

Preview:

```sh
python3 -m http.server 8798 --bind 127.0.0.1
```

Open `http://127.0.0.1:8798/index.html`.

## Hide slides for this meeting

1. Open the TOC → **Hide slides**.
2. Check pages to skip → **Save**.
3. Restore with uncheck + save, or **Restore all**.

Settings persist in this browser only, keyed by project id. Stable slide ids survive renames/reorders. For shareable cuts, put named presets in `deck.json` `cuts` and open `?cut=cio`.

## Build & publish

| Command | Output |
| --- | --- |
| `npm run build` | Multi-file preview site |
| `npm run build:offline` | `dist/offline/presentation.html` |
| `npm run build:cloudflare` | Worker public assets |
| `npm run deploy:cloudflare` | Deploy current project |
| `npm run test:browser` | Screenshots / visual QA (Playwright) |

Cloudflare needs platform auth and `ACCESS_PIN`. Details: [deployment](references/deployment.md), [validation](references/validation.md).

## Export (only when the user asks)

```sh
npm run export:html                 # offline HTML
npm run export:pdf -- --lang zh     # Chinese PDF
npm run export:pdf -- --lang en     # English PDF
npm run export:pptx -- --lang zh    # editable PowerPoint (first-class option)
npm run export -- --lang both       # HTML + ZH/EN PDF (not PPTX by default)
```

**Editable PPTX for stakeholders who need to revise in Office:**

```sh
pip install python-pptx
npm run export:pptx -- --lang zh
```

Builds from `deck.json` with a left Huawei-red rail, titles/subtitles/eyebrows, native tables, and speaker notes. Interactive stage + marker ink stay HTML-only.

Optional `--slides "1,3-5,thank-you"` and `--output-dir DIR`. Named sales cuts: `--cut cio` applies cut first, then `--slides`. PDF needs Playwright once. Optional generate-time schema checks: `pip install jsonschema`.

## Upgrade an existing deck

```sh
python3 /path/to/hw-ppt-skill/scripts/sync_runtime.py /path/to/my-product-deck
cd /path/to/my-product-deck && npm run build
```

`sync_runtime.py` copies the template runtime, stamps `runtimeVersion`, and prints CHANGELOG / breaking notes for the bump.

## Repo layout

Bundled overseas sales samples: `examples/codearts-agent-intl/`, `examples/maas-token-intl/` (`npm run build` to preview).

```text
hw-ppt-skill/
├── SKILL.md               Agent workflow
├── README.md              Chinese guide
├── README.en.md           English guide
├── CHANGELOG.md           Skill / runtime version notes
├── references/            Design, content, deploy, validation
├── scripts/               init, demo build, audit, runtime sync
├── examples/              Full sample decks (CodeArts, MaaS, …)
├── assets/
│   ├── template/          Full presentation project template (runtime 1.5.6)
│   ├── starters/          blank · status-report · design-review ·
│   │                      project-report · workshop · thank-you
│   └── recipes/           Optional interactive refs + deck-archetypes guide
└── demo/                  Offline demos
```

## Positioning

Not a Gamma clone. This is an **agent-authored Huawei briefing runtime**: brand-locked, bilingual, demoable, deployable, sales-tailorable — with Office export when stakeholders demand editable slides.
