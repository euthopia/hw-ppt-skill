"""Copy canonical scene controller into the recipes tree. Load only one at runtime."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
src = root / 'assets/template/js/scenes.js'
dst = root / 'assets/recipes/scene-controller.js'
text = src.read_text(encoding='utf-8')
dst.write_text(text, encoding='utf-8', newline='\n')
print(f'Synced {src.relative_to(root)} → {dst.relative_to(root)}')
