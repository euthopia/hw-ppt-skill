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


def add_accent_bar(slide, RGBColor, Inches):
    """Thin left Huawei-red rail — brand signal without card chrome."""
    from pptx.enum.shapes import MSO_SHAPE
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0),
        Inches(0),
        Inches(0.08),
        Inches(7.5),
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = RGBColor(*RED)
    line = bar.line
    line.fill.background()


def add_title(slide, title: str, subtitle: str, RGBColor, Pt, Inches, *, cover=False):
    top = Inches(2.4) if cover else Inches(0.35)
    size = Pt(40) if cover else Pt(28)
    box = slide.shapes.add_textbox(Inches(0.7), top, Inches(12.0), Inches(1.4 if cover else 1.15))
    tf = box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    run = p.add_run()
    set_run(run, title, size=size, bold=True, color=RGBColor(*INK))
    if subtitle:
        p2 = tf.add_paragraph()
        run2 = p2.add_run()
        set_run(run2, subtitle, size=Pt(16 if cover else 14), color=RGBColor(*MUTED))


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


def add_native_table(slide, headers, rows, RGBColor, Inches, Pt):
    cols = max(1, len(headers))
    row_count = 1 + len(rows)
    table_shape = slide.shapes.add_table(
        row_count, cols, Inches(0.7), Inches(1.7), Inches(12.0), Inches(min(5.2, 0.42 * row_count + 0.6))
    )
    table = table_shape.table
    for c, header in enumerate(headers):
        cell = table.cell(0, c)
        cell.text = header
        for paragraph in cell.text_frame.paragraphs:
            for run in paragraph.runs:
                set_run(run, run.text, size=Pt(13), bold=True, color=RGBColor(*INK))
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(243, 244, 246)
    for r, row in enumerate(rows, start=1):
        for c in range(cols):
            value = row[c] if c < len(row) else ''
            cell = table.cell(r, c)
            cell.text = value
            for paragraph in cell.text_frame.paragraphs:
                for run in paragraph.runs:
                    set_run(run, run.text, size=Pt(12), bold=(c == 0), color=RGBColor(*INK))


def add_cover_slide(s, slide, deck, lang, RGBColor, Pt, Inches):
    from pptx.enum.shapes import MSO_SHAPE
    rule = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(2.15), Inches(0.9), Inches(0.08))
    rule.fill.solid()
    rule.fill.fore_color.rgb = RGBColor(*RED)
    rule.line.fill.background()
    title = pick(slide.get('title'), lang) or pick(deck.get('title'), lang)
    subtitle = pick(slide.get('subtitle'), lang)
    tagline = pick(slide.get('tagline'), lang) or pick(deck.get('brandLabel'), lang) or 'HUAWEI CLOUD'
    eyebrow = pick(slide.get('eyebrow'), lang) or 'PRODUCT BRIEFING'
    add_title(s, title, subtitle, RGBColor, Pt, Inches, cover=True)
    box = s.shapes.add_textbox(Inches(0.7), Inches(4.5), Inches(12.0), Inches(1.2))
    tf = box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    run = p.add_run()
    set_run(run, eyebrow, size=Pt(14), bold=True, color=RGBColor(*RED))
    p2 = tf.add_paragraph()
    run2 = p2.add_run()
    set_run(run2, tagline, size=Pt(18), color=RGBColor(*MUTED))


def add_closing_slide(s, slide, lang, RGBColor, Pt, Inches):
    from pptx.enum.shapes import MSO_SHAPE
    thanks = slide.get('thanks') or {}
    vision = slide.get('vision') or {}
    title = pick(thanks, lang) or pick(thanks, 'en') or 'Thank You'
    vision_text = pick(vision, lang)
    left = s.shapes.add_textbox(Inches(0.7), Inches(2.2), Inches(5.5), Inches(2.5))
    tf = left.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    run = p.add_run()
    set_run(run, title, size=Pt(44), bold=True, color=RGBColor(*INK))
    if vision_text:
        right = s.shapes.add_textbox(Inches(6.8), Inches(2.0), Inches(5.8), Inches(3.5))
        rtf = right.text_frame
        rtf.word_wrap = True
        rtf.clear()
        p = rtf.paragraphs[0]
        run = p.add_run()
        set_run(run, vision_text.replace('\\n', '\n'), size=Pt(16), color=RGBColor(*MUTED))
    accent = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.5), Inches(2.1), Inches(0.06), Inches(3.2))
    accent.fill.solid()
    accent.fill.fore_color.rgb = RGBColor(*RED)
    accent.line.fill.background()


def slide_lines(slide: dict, lang: str) -> list[str]:
    kind = slide.get('type')
    lines: list[str] = []
    if kind == 'cover':
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
    elif kind == 'agenda':
        for i, item in enumerate(slide.get('items') or [], 1):
            label = pick(item.get('label'), lang)
            when = pick(item.get('time'), lang)
            lines.append(f'{i:02}. {label}' + (f' · {when}' if when else ''))
    elif kind == 'quote':
        lines.append(f'“{pick(slide.get("quote"), lang)}”')
        attr = pick(slide.get('attribution'), lang)
        role = pick(slide.get('role'), lang)
        if attr:
            lines.append('— ' + attr + (f' · {role}' if role else ''))
    elif kind == 'tabs':
        for tab in slide.get('tabs') or []:
            lines.append(f'{pick(tab.get("label"), lang)} — {pick(tab.get("body"), lang)}')
            for b in tab.get('bullets') or []:
                lines.append(f'  • {pick(b, lang)}')
    elif kind == 'before-after':
        for side, default in (('before', 'Before'), ('after', 'After')):
            panel = slide.get(side) or {}
            label = pick(panel.get('label'), lang) or default
            lines.append(f'{label}: {pick(panel.get("title"), lang)}')
            if panel.get('body'):
                lines.append(pick(panel['body'], lang))
            for b in panel.get('bullets') or []:
                lines.append(f'  • {pick(b, lang)}')
    elif kind == 'closing':
        return lines
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
        add_accent_bar(s, RGBColor, Inches)
        kind = slide.get('type')
        if kind == 'cover':
            add_cover_slide(s, slide, deck, lang, RGBColor, Pt, Inches)
        elif kind == 'closing':
            add_closing_slide(s, slide, lang, RGBColor, Pt, Inches)
        else:
            title = pick(slide.get('title'), lang) or pick(deck.get('title'), lang)
            subtitle = pick(slide.get('subtitle'), lang)
            add_title(s, title, subtitle, RGBColor, Pt, Inches, cover=False)
            if kind == 'table':
                headers = [pick(h, lang) for h in slide.get('headers') or []]
                rows = [[pick(c, lang) for c in row] for row in (slide.get('rows') or [])]
                if headers:
                    add_native_table(s, headers, rows, RGBColor, Inches, Pt)
                note_lines = slide_lines(slide, lang)
                if note_lines:
                    add_bullets(s, note_lines, RGBColor, Pt, Inches, top=6.4)
            else:
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
