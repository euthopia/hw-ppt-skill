/* Seam: tree / formula / split / panels + summary / tag / focus (runtime 1.5.6). */
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

test('schema allows tree formula split panels and shared flex fields', () => {
  const schema = fs.readFileSync(path.join(TEMPLATE, 'schemas', 'deck.schema.json'), 'utf8');
  assert.match(schema, /"const":\s*"tree"/);
  assert.match(schema, /"const":\s*"formula"/);
  assert.match(schema, /"const":\s*"split"/);
  assert.match(schema, /"const":\s*"panels"/);
  assert.match(schema, /summaryBlock/);
  assert.match(schema, /"focus"/);
  assert.match(schema, /"tag"/);
});

test('tree formula split panels render branded markup with summary tag focus', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-comp-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'comp-check',
      runtimeVersion: '1.5.6',
      title: bilingual('组成检查', 'Composition check'),
      slides: [
        { type: 'cover', id: 'cover', title: bilingual('封面', 'Cover'), background: '云山' },
        {
          type: 'tree',
          id: 'path-tree',
          title: bilingual('路径', 'Path'),
          root: { title: bilingual('根能力', 'Root capability'), subtitle: bilingual('入口', 'Entry') },
          branches: [
            {
              title: bilingual('分支甲', 'Branch A'),
              subtitle: bilingual('分支甲副题', 'Sub A'),
              detail: bilingual('细节甲', 'Detail A'),
            },
            { title: bilingual('分支乙', 'Branch B'), detail: bilingual('细节乙', 'Detail B') },
          ],
          summary: {
            title: bilingual('一句话', 'One line'),
            body: bilingual('摘要说明', 'Summary body'),
          },
        },
        {
          type: 'formula',
          id: 'compose',
          title: bilingual('组成', 'Formula'),
          parts: [
            { label: bilingual('能力', 'Capability'), body: bilingual('块甲', 'Part A'), tag: bilingual('核', 'Core'), focus: true },
            { label: bilingual('流程', 'Process'), body: bilingual('块乙', 'Part B') },
            { label: bilingual('治理', 'Governance'), body: bilingual('块丙', 'Part C') },
          ],
          items: [
            { title: bilingual('解释一', 'Explain 1'), body: bilingual('公式说明一', 'Body 1') },
            { title: bilingual('解释二', 'Explain 2'), body: bilingual('公式说明二', 'Body 2') },
          ],
        },
        {
          type: 'split',
          id: 'matrix',
          title: bilingual('对照', 'Split'),
          left: {
            title: bilingual('分类', 'Groups'),
            groups: [
              { label: bilingual('组甲', 'Group A'), items: [bilingual('项1', 'Item 1'), bilingual('项2', 'Item 2')] },
              { label: bilingual('组乙', 'Group B'), items: [bilingual('项3', 'Item 3')] },
            ],
          },
          right: {
            headers: [bilingual('维度', 'Dim'), bilingual('甲', 'A'), bilingual('乙', 'B')],
            rows: [
              [bilingual('覆盖', 'Coverage'), '✓', '—'],
              [bilingual('成本', 'Cost'), '—', '✓'],
            ],
          },
        },
        {
          type: 'panels',
          id: 'ops',
          title: bilingual('面板', 'Panels'),
          panels: [
            {
              title: bilingual('面板甲', 'Panel A'),
              body: bilingual('正文甲', 'Body A'),
              tag: bilingual('优', 'P0'),
              focus: true,
              bullets: [bilingual('要点', 'Bullet')],
            },
            { title: bilingual('面板乙', 'Panel B'), body: bilingual('正文乙', 'Body B') },
          ],
        },
        {
          type: 'cards',
          id: 'value',
          title: bilingual('价值', 'Value'),
          cards: [
            {
              title: bilingual('卡片甲', 'Card A'),
              body: bilingual('卡片说明甲', 'Card body A'),
              tag: bilingual('主', 'Main'),
              focus: true,
            },
            { title: bilingual('卡片乙', 'Card B'), body: bilingual('卡片说明乙', 'Card body B') },
          ],
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
    assert.match(html, /class="kit-tree"/);
    assert.match(html, /kit-tree-root/);
    assert.match(html, /class="kit-formula"/);
    assert.match(html, /kit-formula-op/);
    assert.match(html, /class="kit-split"/);
    assert.match(html, /class="kit-panels"/);
    assert.match(html, /class="kit-summary"/);
    assert.match(html, /class="kit-tag"/);
    assert.match(html, /data-focus="true"|data-focus/);
    assert.match(css, /\.kit-tree\b/);
    assert.match(css, /\.kit-formula\b/);
    assert.match(css, /\.kit-split\b/);
    assert.match(css, /\.kit-panels\b/);
    assert.match(css, /\.kit-summary\b/);
    assert.match(css, /\.kit-tag\b/);
    const config = fs.readFileSync(path.join(tmp, 'js', 'config.js'), 'utf8');
    assert.match(config, /"runtimeVersion":\s*"1\.5\.6"/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('blank starter pins 1.5.6 and includes new composition types', () => {
  const blank = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'starters', 'blank.json'), 'utf8'));
  assert.equal(blank.runtimeVersion, '1.5.6');
  const types = new Set(blank.slides.map((s) => s.type));
  for (const t of ['tree', 'formula', 'split', 'panels']) {
    assert.ok(types.has(t), `blank missing type ${t}`);
  }
});

test('blank starter init + generate stays clean', () => {
  const tmp = path.join(os.tmpdir(), `huawei-blank-${Date.now()}-${process.pid}`);
  try {
    const init = spawnSync(
      process.execPath,
      [
        path.join(ROOT, 'assets', 'template', 'tools', 'python-cmd.cjs'),
        path.join(ROOT, 'scripts', 'init.py'),
        tmp,
        '--id',
        'blank-comp',
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
    assert.equal(deck.runtimeVersion, '1.5.6');
    const html = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    assert.match(html, /kit-tree/);
    assert.match(html, /kit-formula/);
    assert.match(html, /kit-split/);
    assert.match(html, /kit-panels/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
