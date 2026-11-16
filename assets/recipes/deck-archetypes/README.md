# Deck archetypes — layout guidance

Shared layout kit. Choose `deck.kind` (optional) and prefer layouts that fit the report job.

| kind | Starter | Prefer | Use sparingly |
|------|---------|--------|---------------|
| `product-briefing` | `blank` | cover, **tree**, **stages**, **zones**, **stack-board**, **lanes**, **compare-board**, pricing families, cards (+tag/focus), architecture, comparison, scenarios, closing | dense tables without a job |
| `status-report` | `status-report` | agenda, metrics, timeline, callouts, table, **panels** | pricing theater |
| `design-review` | `design-review` | architecture, before-after, comparison, **tree**, tabs, callouts | sales pricing |
| `project-report` | `project-report` | timeline, metrics, table, workflow, callouts, **split** | cover splash only |
| `workshop` | `workshop` | agenda, tabs, workflow, cards, quote, **formula** | long comparison walls |

For briefing density, prefer **stages** (maturity), **zones** (deploy dual-zone), **stack-board** (product stack + values), **lanes** (two methods), **compare-board** (preset plan switches), and **pricing.families** (card grid) over stacking more generic cards. Use slide `summary` and card/callout `tag`/`focus` to elevate one signal without a new layout. Keep numbers pre-authored in `deck.json` — no live math engines in the default kit.

HTML remains the interactive system of record. Export editable Office with:

```sh
npm run export:pptx -- --lang zh
# requires: pip install python-pptx
```
