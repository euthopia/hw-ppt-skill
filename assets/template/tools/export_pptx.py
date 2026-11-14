"""Build an editable PPTX from content/deck.json (Office interop; HTML remains SoR)."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RED = (199, 0, 11)
INK = (34, 35, 38)
MUTED = (119, 123, 130)


def pick(value, lang: str) -> str:
    if isinstance(value, dict):
        return str(value.get(lang) or value.get('zh') or value.get('en') or '')
    if value is None:
        return ''
    return str(value)


def require_pptx():
    try:
        from pptx import Presentation
        from pptx.dml.color import RGBColor
        from pptx.util import Inches, Pt
        return Presentation, RGBColor, Inches, Pt
    except ImportError as exc:
        raise SystemExit(
            'PPTX export needs python-pptx. Install with: pip install python-pptx'
        ) from exc


def set_run(run, text: str, *, size, bold=False, color=INK):
    from pptx.dml.color import RGBColor
    run.text = text
    run.font.size = size
    run.font.bold = bold
    run.font.name = 'Microsoft YaHei'
    if isinstance(color, tuple):
        run.font.color.rgb = RGBColor(*color)
    else:
        run.font.color.rgb = color


def add_title(slide, title: str, subtitle: str, RGBColor, Pt, Inches):
    box = slide.shapes.add_textbox(Inches(0.6), Inches(0.35), Inches(12.0), Inches(1.15))
    tf = box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    run = p.add_run()
    set_run(run, title, size=Pt(28), bold=True, color=RGBColor(*INK))
    if subtitle:
        p2 = tf.add_paragraph()
        run2 = p2.add_run()
        set_run(run2, subtitle, size=Pt(14), color=RGBColor(*MUTED))


def add_bullets(slide, lines, RGBColor, Pt, Inches, top=1.65):
    box = slide.shapes.add_textbox(Inches(0.7), Inches(top), Inches(12.0), Inches(5.3))
    tf = box.text_frame
    tf.word_wrap = True
    first = True
    for line in lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.level = 0
        run = p.add_run()
        set_run(run, line, size=Pt(16), color=RGBColor(*INK))


def slide_lines(slide: dict, lang: str) -> list[str]:
    kind = slide.get('type')
    lines: list[str] = []
    if kind == 'cover':
        if slide.get('eyebrow'):
            lines.append(pick(slide['eyebrow'], lang))
        if slide.get('tagline'):
            lines.append(pick(slide['tagline'], lang))
        return lines
    if kind == 'cards':
        for i, card in enumerate(slide.get('cards') or [], 1):
            lines.append(f'{i:02}. {pick(card.get("title"), lang)} — {pick(card.get("body"), lang)}')
    elif kind == 'metrics':
        for m in slide.get('metrics') or []:
            chunk = f'{pick(m.get("value"), lang)} · {pick(m.get("label"), lang)}'
            body = pick(m.get('body'), lang)
            lines.append(f'{chunk} — {body}' if body else chunk)
    elif kind == 'architecture':
        for layer in slide.get('layers') or []:
            items = ', '.join(pick(x, lang) for x in layer.get('items') or [])
            lines.append(f'{pick(layer.get("label"), lang)}: {items}')
    elif kind == 'comparison':
        for col in slide.get('columns') or []:
            lines.append(f'{pick(col.get("title"), lang)} — {pick(col.get("summary"), lang)}')
            for b in col.get('bullets') or []:
                lines.append(f'  • {pick(b, lang)}')
    elif kind == 'table':
        headers = [pick(h, lang) for h in slide.get('headers') or []]
        if headers:
            lines.append(' | '.join(headers))
        for row in slide.get('rows') or []:
            lines.append(' | '.join(pick(c, lang) for c in row))
        if slide.get('note'):
            lines.append(pick(slide['note'], lang))
    elif kind == 'timeline':
        for ev in slide.get('events') or []:
            chunk = f'{pick(ev.get("when"), lang)} · {pick(ev.get("title"), lang)}'
            body = pick(ev.get('body'), lang)
            lines.append(f'{chunk} — {body}' if body else chunk)
    elif kind == 'callouts':
        for item in slide.get('items') or []:
            tone = item.get('tone') or 'info'
            lines.append(f'[{tone}] {pick(item.get("title"), lang)} — {pick(item.get("body"), lang)}')
    elif kind == 'workflow':
        for i, step in enumerate(slide.get('steps') or [], 1):
            lines.append(f'{i:02}. {pick(step.get("title"), lang)} — {pick(step.get("body"), lang)}')
        if slide.get('result'):
            lines.append(pick(slide['result'], lang))
    elif kind == 'image':
        lines.append(pick(slide.get('caption'), lang))
        if slide.get('body'):
            lines.append(pick(slide['body'], lang))
    elif kind == 'pricing':
        for row in slide.get('rows') or []:
            lines.append(
                f'{pick(row.get("name"), lang)} · in {pick(row.get("input"), lang)} / '
                f'cache {pick(row.get("cacheInput"), lang)} / out {pick(row.get("output"), lang)}'
            )
    elif kind == 'scenarios':
        for sc in slide.get('scenarios') or []:
            lines.append(f'{pick(sc.get("label"), lang)} — {pick(sc.get("body"), lang)}')
    elif kind == 'closing':
        thanks = slide.get('thanks') or {}
        vision = slide.get('vision') or {}
        lines.append(pick(thanks, lang) or pick(thanks, 'en'))
        lines.append(pick(vision, lang))
    elif kind == 'custom':
        lines.append(f'Custom fragment: {slide.get("fragment", "")}')
    else:
        lines.append(f'(Unhandled layout: {kind})')
    return [ln for ln in lines if ln and str(ln).strip()]


def build(deck: dict, lang: str, output: Path):
    Presentation, RGBColor, Inches, Pt = require_pptx()
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]
    for slide in deck.get('slides') or []:
        s = prs.slides.add_slide(blank)
        title = pick(slide.get('title'), lang) or pick(deck.get('title'), lang)
        subtitle = pick(slide.get('subtitle'), lang)
        add_title(s, title, subtitle, RGBColor, Pt, Inches)
        lines = slide_lines(slide, lang)
        if lines:
            add_bullets(s, lines, RGBColor, Pt, Inches)
        notes = pick(slide.get('notes'), lang)
        if notes:
            s.notes_slide.notes_text_frame.text = notes
    output.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(output))
    print(f'Exported: {output}')


def main(argv=None):
    parser = argparse.ArgumentParser(description='Export deck.json to editable PPTX')
    parser.add_argument('--lang', choices=('zh', 'en'), default='zh')
    parser.add_argument('--output', required=True)
    parser.add_argument('--deck', default=str(ROOT / 'content' / 'deck.json'))
    args = parser.parse_args(argv)
    deck = json.loads(Path(args.deck).read_text(encoding='utf-8'))
    build(deck, args.lang, Path(args.output))


if __name__ == '__main__':
    main()
