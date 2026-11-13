# Contributing

This repo is an **Agent Skill** that ships a Huawei-branded bilingual briefing runtime.

## Principles

1. Keep `deck.json` → Python generator → vanilla 16:9 HTML as the system of record.
2. Prefer first-class slide types over `custom` HTML.
3. Do not invent product prices, metrics, or claims in the generic skill.
4. Never commit secrets, PATs, or `.env` files.

## Local checks

```sh
# skill-level
node --test tests/*.test.cjs

# template-level
cd assets/template
npm test
```

On Windows, `npm run generate` uses `tools/python-cmd.cjs` (finds `py` / `python` / `python3`).

## Runtime sync

After upgrading the skill, sync an existing deck project:

```sh
python scripts/sync_runtime.py /path/to/my-deck
cd /path/to/my-deck && npm run build
```

## Scene controller

Canonical file: `assets/template/js/scenes.js`. Keep the recipe copy in sync:

```sh
python scripts/sync_scene_controller.py
```
