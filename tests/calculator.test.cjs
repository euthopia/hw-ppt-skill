/* Seam: calculator layout — schema, SSR defaults, JS, blank init (runtime 1.5.9). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'assets', 'template');

function bilingual(zh, en) {
  return { zh, en };
}

function copyTemplate(dest) {
  fs.cpSync(TEMPLATE, dest, {
    recursive: true,
    filter: (p) =>
      !p.includes(`${path.sep}node_modules`) &&
      !p.includes(`${path.sep}dist`) &&
      !p.includes(`${path.sep}.wrangler`),
  });
}

test('schema allows calculator', () => {
  const schema = fs.readFileSync(path.join(TEMPLATE, 'schemas', 'deck.schema.json'), 'utf8');
  assert.match(schema, /"const":\s*"calculator"/);
});

test('calculator renders controls results script and default total', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-calc-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'calc-check',
      runtimeVersion: '1.5.9',
      title: bilingual('测算检查', 'Calc check'),
      slides: [
        { type: 'cover', id: 'cover', title: bilingual('封面', 'Cover'), background: '云山' },
        {
          type: 'calculator',
          id: 'calc',
          title: bilingual('成本测算', 'Cost calc'),
          currency: 'USD',
          groups: [
            {
              id: 'plan',
              label: bilingual('测算方案组', 'Calc plan group'),
              options: [
                {
                  id: 'a',
                  label: bilingual('测算甲', 'Calc A'),
                  vars: { base: 100, rate: 10 },
                },
                {
                  id: 'b',
                  label: bilingual('测算乙', 'Calc B'),
                  vars: { base: 200, rate: 20 },
                },
              ],
            },
          ],
          inputs: [
            {
              id: 'qty',
              label: bilingual('测算数量', 'Calc qty'),
              default: 5,
              min: 1,
              max: 100,
              step: 1,
              unit: bilingual('单位量', 'units'),
            },
          ],
          results: [
            {
              id: 'total',
              label: bilingual('测算合计', 'Calc total'),
              expr: 'base + qty * rate',
              format: 'currency',
              focus: true,
            },
          ],
          note: bilingual('教学示意', 'Teaching sketch'),
        },
      ],
    };
    fs.writeFileSync(path.join(tmp, 'content', 'deck.json'), JSON.stringify(deck, null, 2));
    const result = spawnSync(process.execPath, ['tools/python-cmd.cjs', 'tools/render.py'], {
      cwd: tmp,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const html = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(tmp, 'css', 'components.css'), 'utf8');
    const js = fs.readFileSync(path.join(tmp, 'js', 'calculator.js'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmp, 'asset-manifest.json'), 'utf8'));
    assert.match(html, /class="kit-calculator"/);
    assert.match(html, /data-calculator-root/);
    assert.match(html, /data-calc-input="qty"/);
    assert.match(html, /data-calc-result="total"/);
    assert.match(html, /USD 150\.00|150\.00/);
    assert.match(html, /calculator\.js/);
    assert.ok(manifest.js.includes('js/calculator.js'));
    assert.match(css, /\.kit-calculator\b/);
    assert.match(js, /function safeEval\(/);
    assert.doesNotMatch(js, /\beval\(/);
    const pptxSrc = fs.readFileSync(path.join(tmp, 'tools', 'export_pptx.py'), 'utf8');
    assert.match(pptxSrc, /calculator/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('blank starter pins 1.5.9 and includes calculator', () => {
  const blank = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'starters', 'blank.json'), 'utf8'));
  assert.equal(blank.runtimeVersion, '1.5.9');
  assert.ok(blank.slides.some((s) => s.type === 'calculator'));
});

test('blank init with calculator stays clean', () => {
  const tmp = path.join(os.tmpdir(), `huawei-calc-blank-${Date.now()}-${process.pid}`);
  try {
    const init = spawnSync(
      process.execPath,
      [
        path.join(ROOT, 'assets', 'template', 'tools', 'python-cmd.cjs'),
        path.join(ROOT, 'scripts', 'init.py'),
        tmp,
        '--id',
        'blank-calc',
        '--title',
        '产品名称',
        '--title-en',
        'Product name',
        '--starter',
        'blank',
      ],
      { cwd: ROOT, encoding: 'utf8' }
    );
    assert.equal(init.status, 0, init.stderr || init.stdout);
    const html = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    assert.match(html, /kit-calculator/);
    assert.match(html, /calculator\.js/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
