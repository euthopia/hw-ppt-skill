"""Copy versioned runtime files from the skill template into an existing deck project."""
from pathlib import Path
import argparse, json, re, shutil

RUNTIME_PATHS = [
    'js/app.js', 'js/navigation.js', 'js/presenter-ink.js', 'js/language.js', 'js/scenes.js',
    'js/pricing-table.js', 'js/pricing-boot.js', 'js/scenario-switcher.js', 'js/tabs.js',
    'css/styles.css', 'css/components.css', 'css/english.css', 'css/recipes.css',
    'content/shell.html', 'tools/render.py', 'tools/python-cmd.cjs',
    'tools/build.py', 'tools/export.cjs', 'tools/export_pptx.py', 'tools/slide-selection.cjs',
    'schemas/deck.schema.json', 'package.json',
]

def parse_semver(value):
    match = re.match(r'^(\d+)\.(\d+)\.(\d+)', str(value or ''))
    if not match:
        return None
    return tuple(int(part) for part in match.groups())

def changelog_notes(changelog_path, from_version, to_version):
    """Surface CHANGELOG sections between from_version (exclusive) and to_version (inclusive)."""
    if not changelog_path.is_file():
        return []
    text = changelog_path.read_text(encoding='utf-8')
    blocks = re.split(r'(?m)^##\s+', text)
    notes = []
    start = parse_semver(from_version)
    end = parse_semver(to_version)
    for block in blocks[1:]:
        header, _, body = block.partition('\n')
        ver_match = re.match(r'v?(\d+\.\d+\.\d+)', header.strip())
        if not ver_match:
            continue
        ver = parse_semver(ver_match.group(1))
        if not ver or not end:
            continue
        if ver > end:
            continue
        if start and ver <= start:
            continue
        chunk = body.strip()
        breaking = []
        for line in chunk.splitlines():
            if re.search(r'breaking|BREAKING|破坏|不兼容', line, re.I):
                breaking.append(line.strip())
        notes.append({
            'version': ver_match.group(1),
            'breaking': breaking,
            'excerpt': '\n'.join(chunk.splitlines()[:12]),
        })
    return notes

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
previous = deck.get('runtimeVersion') or '0.0.0'
deck['runtimeVersion'] = version
if not args.dry_run:
    deck_path.write_text(json.dumps(deck, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(('Would sync' if args.dry_run else 'Synced') + f' runtime {version}: {len(copied)} files → {project}')
for rel in copied:
    print(' -', rel)

notes = changelog_notes(skill / 'CHANGELOG.md', previous, version)
if notes:
    print('\nUpgrade notes (see CHANGELOG.md):')
    for entry in notes:
        print(f" ## {entry['version']}")
        if entry['breaking']:
            print(' Breaking notes:')
            for line in entry['breaking']:
                print('  *', line)
        else:
            for line in entry['excerpt'].splitlines()[:6]:
                if line.strip():
                    print(' ', line)
else:
    print('\nNo CHANGELOG notes between', previous, 'and', version, '(see CHANGELOG.md).')
