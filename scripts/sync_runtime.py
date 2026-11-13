"""Copy versioned runtime files from the skill template into an existing deck project."""
from pathlib import Path
import argparse, json, shutil

RUNTIME_PATHS = [
    'js/app.js', 'js/navigation.js', 'js/language.js', 'js/scenes.js',
    'js/pricing-table.js', 'js/pricing-boot.js', 'js/scenario-switcher.js',
    'css/styles.css', 'css/components.css', 'css/english.css', 'css/recipes.css',
    'content/shell.html', 'tools/render.py', 'tools/python-cmd.cjs',
    'tools/build.py', 'tools/export.cjs', 'tools/slide-selection.cjs',
    'schemas/deck.schema.json', 'package.json',
]

parser = argparse.ArgumentParser(description='Sync deck runtime from this skill template')
parser.add_argument('project', type=Path, help='Existing generated presentation project')
parser.add_argument('--dry-run', action='store_true')
args = parser.parse_args()

skill = Path(__file__).resolve().parent.parent
template = skill / 'assets/template'
project = args.project.resolve()
if not (project / 'content' / 'deck.json').is_file():
    raise SystemExit('Not a presentation project (missing content/deck.json): ' + str(project))

package = json.loads((template / 'package.json').read_text(encoding='utf-8'))
version = package.get('deckRuntime') or package.get('version') or '0.0.0'
copied = []
for rel in RUNTIME_PATHS:
    src = template / rel
    if not src.is_file():
        continue
    dest = project / rel
    if args.dry_run:
        copied.append(rel)
        continue
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    copied.append(rel)

deck_path = project / 'content' / 'deck.json'
deck = json.loads(deck_path.read_text(encoding='utf-8'))
deck['runtimeVersion'] = version
if not args.dry_run:
    deck_path.write_text(json.dumps(deck, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(('Would sync' if args.dry_run else 'Synced') + f' runtime {version}: {len(copied)} files → {project}')
for rel in copied:
    print(' -', rel)
