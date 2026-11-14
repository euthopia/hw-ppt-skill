"""Audit distributable source for stale presentation facts, secrets, and claim hygiene."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
errors = []
warnings = []
skip = {'.git', 'node_modules', '.wrangler', 'dist', 'qa', '__pycache__', '.scratch'}

for path in root.rglob('*'):
    rel = path.relative_to(root)
    if not path.is_file() or set(rel.parts) & skip or rel.parts[0] in {'scripts', 'tests'}:
        continue
    if path.name.startswith(('.env', '.dev.vars')):
        errors.append(str(rel) + ': credential file')
    if path.suffix not in {'.js', '.mjs', '.html', '.json', '.css', '.md', '.svg'}:
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    if re.search(r'ChatBI|DeepSeek|GLM-\d|chatbi-demo|MAAS_DATA|checkedAt|original-translations', text, re.I):
        errors.append(str(rel) + ': previous product content')
    if re.search(r'\b(?:peak|offPeak|longInput)\s*:', text):
        errors.append(str(rel) + ': previous pricing payload')

# Claims lint: product decks with metrics/pricing/table should keep content-sources.md
for deck_path in root.rglob('content/deck.json'):
    if set(deck_path.relative_to(root).parts) & skip:
        continue
    try:
        deck = json.loads(deck_path.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        errors.append(str(deck_path.relative_to(root)) + ': invalid JSON')
        continue
    claim_types = {'metrics', 'pricing', 'table'}
    has_claims = any(slide.get('type') in claim_types for slide in deck.get('slides', []))
    sources = deck_path.parent.parent / 'docs' / 'content-sources.md'
    if has_claims and not sources.is_file():
        warnings.append(
            str(deck_path.relative_to(root))
            + ': metrics/pricing/table present but docs/content-sources.md is missing'
        )

assert not errors, '\n'.join(errors)
if warnings:
    print('Source audit warnings:\n' + '\n'.join(warnings))
else:
    print('Source audit passed: no previous product data or credential files')
