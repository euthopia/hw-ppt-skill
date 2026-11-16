/* Seam: compare-board layout — schema, HTML/CSS/JS, PPTX, blank init (runtime 1.5.7). */
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

test('schema allows compare-board', () => {
  const schema = fs.readFileSync(path.join(TEMPLATE, 'schemas', 'deck.schema.json'), 'utf8');
  assert.match(schema, /"const":\s*"compare-board"/);
  assert.match(schema, /"presets"/);
});

test('compare-board renders chips panels script and CSS', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-cb-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'cb-check',
      runtimeVersion: '1.5.7',
      title: bilingual('方案板检查', 'Compare board check'),
      slides: [
        { type: 'cover', id: 'cover', title: bilingual('封面', 'Cover'), background: '云山' },
        {
          type: 'compare-board',
          id: 'plans',
          title: bilingual('方案对照', 'Plan compare'),
          presets: [
            {
              id: 'one',
              label: bilingual('场景一', 'Scenario one'),
              columns: [
                {
                  title: bilingual('方案甲', 'Plan A'),
                  tag: bilingual('主', 'Main'),
                  focus: true,
                  body: bilingual('甲说明', 'Plan A body'),
                  metrics: [{ value: 'TBC', label: bilingual('周期', 'Cycle') }],
                  bullets: [bilingual('要点甲', 'Point A')],
                },
                {
                  title: bilingual('方案乙', 'Plan B'),
                  body: bilingual('乙说明', 'Plan B body'),
                },
              ],
            },
            {
              id: 'two',
              label: bilingual('场景二', 'Scenario two'),
              columns: [
                { title: bilingual('方案甲', 'Plan A'), body: bilingual('场景二甲', 'A under two') },
                {
                  title: bilingual('方案乙', 'Plan B'),
                  focus: true,
                  body: bilingual('场景二乙', 'B under two'),
                },
              ],
            },
          ],
          summary: {
            title: bilingual('选用', 'Rule'),
            body: bilingual('先场景后方案', 'Scenario then plan'),
          },
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
    const manifest = JSON.parse(fs.readFileSync(path.join(tmp, 'asset-manifest.json'), 'utf8'));
    assert.match(html, /class="kit-compare-board"/);
    assert.match(html, /data-compare-choice/);
    assert.match(html, /data-compare-panel/);
    assert.match(html, /kit-cb-column/);
    assert.match(html, /class="kit-summary"/);
    assert.match(html, /compare-board\.js/);
    assert.match(css, /\.kit-compare-board\b/);
    assert.match(css, /\.kit-cb-nav\b/);
    assert.ok(manifest.js.includes('js/compare-board.js'));
    const pptxSrc = fs.readFileSync(path.join(tmp, 'tools', 'export_pptx.py'), 'utf8');
    assert.match(pptxSrc, /compare-board/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('blank starter pins 1.5.7 and includes compare-board', () => {
  const blank = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'starters', 'blank.json'), 'utf8'));
  assert.match(String(blank.runtimeVersion), /^1\.5\.(?:[7-9]|\d{2,})$/);
  assert.ok(blank.slides.some((s) => s.type === 'compare-board'));
});

test('blank starter init with compare-board stays clean', () => {
  const tmp = path.join(os.tmpdir(), `huawei-cb-blank-${Date.now()}-${process.pid}`);
  try {
    const init = spawnSync(
      process.execPath,
      [
        path.join(ROOT, 'assets', 'template', 'tools', 'python-cmd.cjs'),
        path.join(ROOT, 'scripts', 'init.py'),
        tmp,
        '--id',
        'blank-cb',
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
    const deck = JSON.parse(fs.readFileSync(path.join(tmp, 'content', 'deck.json'), 'utf8'));
    assert.match(String(deck.runtimeVersion), /^1\.5\.(?:[7-9]|\d{2,})$/);
    const html = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    assert.match(html, /kit-compare-board/);
    assert.match(html, /compare-board\.js/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
