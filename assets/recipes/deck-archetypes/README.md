# Deck archetypes — layout guidance

Shared layout kit. Choose `deck.kind` (optional) and prefer layouts that fit the report job.

| kind | Starter | Prefer | Use sparingly |
|------|---------|--------|---------------|
| `product-briefing` | `blank` | cover, cards, architecture, comparison, pricing, scenarios, closing | dense tables |
| `status-report` | `status-report` | agenda, metrics, timeline, callouts, table | pricing theater |
| `design-review` | `design-review` | architecture, before-after, comparison, tabs, callouts | sales pricing |
| `project-report` | (compose) | timeline, metrics, table, workflow, callouts | cover splash only |
| `workshop` | (compose) | agenda, tabs, workflow, cards, quote | long comparison walls |

HTML remains the interactive system of record. Export editable Office with:

```sh
npm run export:pptx -- --lang zh
# requires: pip install python-pptx
```
