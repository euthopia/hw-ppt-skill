/* Seam: cut validation + PPTX accent/notes + thumbnail CSS polish. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

function copyTemplate(dest) {
  fs.cpSync(path.join('assets', 'template'), dest, {
    recursive: true,
    filter: (p) => !p.includes(`${path.sep}node_modules`) && !p.includes(`${path.sep}dist`) && !p.includes(`${path.sep}.wrangler`),
  });
}

function runRender(cwd) {
  return spawnSync(process.execPath, [path.join('tools', 'python-cmd.cjs'), path.join('tools', 'render.py')], {
    cwd,
    encoding: 'utf8',
  });
}

test('cuts that reference unknown slide ids fail at generate time', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-cut-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'cut-reject-deck',
      title: { zh: '切片校验', en: 'Cut check' },
      cuts: { bad: { hidden: ['does-not-exist'] } },
      slides: [
        { type: 'cover', id: 'cover', title: { zh: '封面', en: 'Cover' }, background: '云山' },
      ],
    };
    fs.writeFileSync(path.join(tmp, 'content', 'deck.json'), JSON.stringify(deck, null, 2));
    const result = runRender(tmp);
    assert.notEqual(result.status, 0, 'unknown cut slide id must fail');
    assert.match(String(result.stderr || result.stdout), /unknown slide id|does-not-exist/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('thumbnail and print CSS keep timeline and callouts overflow visible', () => {
  const css = fs.readFileSync(path.join('assets', 'template', 'css', 'components.css'), 'utf8');
  assert.match(css, /\.thumbnail-preview\s+\.kit-timeline[\s\S]*overflow:\s*visible/);
  assert.match(css, /\.thumbnail-preview\s+\.kit-callouts|thumbnail-preview[\s\S]*kit-callout/);
  assert.match(css, /@media print[\s\S]*\.kit-timeline[\s\S]*overflow:\s*visible/);
});

function pythonPptxAvailable() {
  const probe = spawnSync(process.execPath, ['assets/template/tools/python-cmd.cjs', '-c', 'import pptx'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return probe.status === 0;
}

test('pptx export draws a red accent and preserves presenter notes', { skip: !pythonPptxAvailable() }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-pptx-polish-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'pptx-polish-deck',
      title: { zh: '导出检查', en: 'Export check' },
      slides: [
        {
          type: 'cover',
          id: 'cover',
          title: { zh: '封面', en: 'Cover' },
          background: '云山',
          notes: { zh: '开场强调信任', en: 'Open on trust' },
        },
        {
          type: 'metrics',
          id: 'kpi',
          title: { zh: '指标', en: 'Metrics' },
          notes: { zh: '强调单位', en: 'Stress units' },
          metrics: [
            { value: '99.9%', label: { zh: '可用性', en: 'Availability' }, body: { zh: '月度', en: 'Monthly' } },
            { value: '3x', label: { zh: '效率', en: 'Efficiency' }, body: { zh: '试点', en: 'Pilot' } },
          ],
        },
      ],
    };
    fs.writeFileSync(path.join(tmp, 'content', 'deck.json'), JSON.stringify(deck, null, 2));
    const out = path.join(tmp, 'out.pptx');
    const result = spawnSync(
      process.execPath,
      ['tools/python-cmd.cjs', 'tools/export_pptx.py', '--lang', 'zh', '--output', out, '--deck', 'content/deck.json'],
      { cwd: tmp, encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(out));
    const py = [
      'from pptx import Presentation',
      'from pptx.util import Emu',
      'prs=Presentation(' + JSON.stringify(out) + ')',
      'assert len(prs.slides)>=2',
      'shapes=list(prs.slides[0].shapes)',
      'assert any(getattr(s,"width",0) and s.width<=Emu(91440) for s in shapes), "expected thin accent bar"',
      'notes=prs.slides[0].notes_slide.notes_text_frame.text',
      'assert "开场强调信任" in notes',
      'print("ok")',
    ].join(';');
    const inspect = spawnSync(process.execPath, ['tools/python-cmd.cjs', '-c', py], {
      cwd: tmp,
      encoding: 'utf8',
    });
    assert.equal(inspect.status, 0, inspect.stderr || inspect.stdout);
    assert.match(inspect.stdout || '', /ok/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('presenter runtime documents N and optional ? cheat-sheet', () => {
  const app = fs.readFileSync(path.join('assets', 'template', 'js', 'app.js'), 'utf8');
  assert.match(app, /presenter-hint|快捷键/);
  assert.match(app, /['"]N['"]|toLowerCase\(\) === ['"]n['"]/);
  assert.match(app, /event\.key === ['"]\?['"]|event\.key === ['"]\?['"]|key === '\?'/);
  assert.match(app, /shortcuts|cheat|快捷键对照|keyboard-help/);
});
