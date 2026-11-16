/* Seam: stages / zones / lanes / stack-board + pricing.families (runtime 1.5.8). */
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

test('schema allows stages zones lanes stack-board and pricing families', () => {
  const schema = fs.readFileSync(path.join(TEMPLATE, 'schemas', 'deck.schema.json'), 'utf8');
  for (const t of ['stages', 'zones', 'lanes', 'stack-board']) {
    assert.match(schema, new RegExp(`"const":\\s*"${t}"`));
  }
  assert.match(schema, /"families"/);
  assert.match(schema, /zoneBlock/);
});

test('new layouts and pricing families render branded markup', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-158-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'absorb-check',
      runtimeVersion: '1.5.8',
      title: bilingual('吸收检查', 'Absorb check'),
      slides: [
        { type: 'cover', id: 'cover', title: bilingual('封面', 'Cover'), background: '云山' },
        {
          type: 'stages',
          id: 'stages',
          title: bilingual('阶段', 'Stages'),
          stages: [
            {
              scope: bilingual('范围甲', 'Scope A'),
              title: bilingual('阶段甲', 'Stage A'),
              body: bilingual('说明甲', 'Body A'),
              value: bilingual('价值甲', 'Value A'),
              examples: [bilingual('例一', 'Ex one')],
            },
            {
              title: bilingual('阶段乙', 'Stage B'),
              body: bilingual('说明乙', 'Body B'),
              focus: true,
            },
          ],
          foundation: bilingual('底座说明', 'Foundation body'),
          foundationLabel: 'FOUNDATION',
        },
        {
          type: 'zones',
          id: 'zones',
          title: bilingual('双区', 'Zones'),
          left: {
            kicker: bilingual('左区', 'Left zone'),
            title: bilingual('训练侧', 'Train side'),
            body: bilingual('左说明', 'Left body'),
            tags: [bilingual('标签', 'Tag')],
          },
          right: {
            kicker: bilingual('右区', 'Right zone'),
            title: bilingual('推理侧', 'Infer side'),
            items: [{ title: bilingual('节点', 'Node'), body: bilingual('节点说明', 'Node body') }],
          },
          bridge: { label: bilingual('桥接', 'Bridge'), caption: bilingual('说明', 'Caption') },
          checks: [bilingual('检查一', 'Check one'), bilingual('检查二', 'Check two')],
        },
        {
          type: 'lanes',
          id: 'lanes',
          title: bilingual('双车道', 'Lanes'),
          task: {
            label: bilingual('任务', 'Task'),
            title: bilingual('共享任务', 'Shared task'),
            body: bilingual('任务说明', 'Task body'),
          },
          lanes: [
            { title: bilingual('车道甲', 'Lane A'), body: bilingual('甲说明', 'A body') },
            {
              title: bilingual('车道乙', 'Lane B'),
              body: bilingual('乙说明', 'B body'),
              focus: true,
              tag: bilingual('荐', 'Pick'),
            },
          ],
        },
        {
          type: 'stack-board',
          id: 'stack',
          title: bilingual('主栈', 'Stack'),
          lead: bilingual('产品', 'Product'),
          leadBody: bilingual('主栈说明', 'Lead body'),
          layers: [
            { label: bilingual('应用', 'App'), items: [bilingual('模块甲', 'Module A')] },
            {
              label: bilingual('能力', 'Capability'),
              items: [{ title: bilingual('编排', 'Orch'), body: bilingual('编排说明', 'Orch body') }],
            },
          ],
          values: [
            { title: bilingual('价值甲', 'Value A'), body: bilingual('价值说明甲', 'Value body A'), focus: true },
            { title: bilingual('价值乙', 'Value B'), body: bilingual('价值说明乙', 'Value body B') },
          ],
        },
        {
          type: 'pricing',
          id: 'cards',
          title: bilingual('卡片价', 'Card pricing'),
          labels: {
            input: bilingual('输入', 'Input'),
            output: bilingual('输出', 'Output'),
          },
          families: [
            {
              label: bilingual('系列', 'Family'),
              cards: [
                {
                  name: bilingual('方案甲', 'Plan A'),
                  tag: bilingual('新', 'New'),
                  focus: true,
                  body: bilingual('定位甲', 'Position A'),
                  input: 'TBC',
                  output: 'TBC',
                },
              ],
            },
          ],
          note: bilingual('以项目口径为准', 'Follow project terms'),
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
    assert.match(html, /class="kit-stages"/);
    assert.match(html, /kit-stage-foundation/);
    assert.match(html, /class="kit-zones"/);
    assert.match(html, /kit-zone-bridge/);
    assert.match(html, /class="kit-lanes"/);
    assert.match(html, /kit-lane-task/);
    assert.match(html, /class="kit-stack-board"/);
    assert.match(html, /kit-stack-word/);
    assert.match(html, /kit-pricing-cards/);
    assert.match(html, /kit-price-card/);
    assert.ok(!manifest.js.includes('js/pricing-table.js'), 'card pricing should not mount table JS');
    assert.match(css, /\.kit-stages\b/);
    assert.match(css, /\.kit-zones\b/);
    assert.match(css, /\.kit-lanes\b/);
    assert.match(css, /\.kit-stack-board\b/);
    assert.match(css, /\.kit-pricing-cards\b/);
    const pptxSrc = fs.readFileSync(path.join(tmp, 'tools', 'export_pptx.py'), 'utf8');
    assert.match(pptxSrc, /stack-board/);
    assert.match(pptxSrc, /families/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('blank starter pins 1.5.8 and includes absorb layouts', () => {
  const blank = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'starters', 'blank.json'), 'utf8'));
  assert.match(String(blank.runtimeVersion), /^1\.5\.(?:[8-9]|\d{2,})$/);
  const types = new Set(blank.slides.map((s) => s.type));
  for (const t of ['stages', 'zones', 'lanes', 'stack-board']) {
    assert.ok(types.has(t), `blank missing ${t}`);
  }
  assert.ok(blank.slides.some((s) => s.type === 'pricing' && s.families));
});

test('blank init with absorb layouts stays clean', () => {
  const tmp = path.join(os.tmpdir(), `huawei-158-blank-${Date.now()}-${process.pid}`);
  try {
    const init = spawnSync(
      process.execPath,
      [
        path.join(ROOT, 'assets', 'template', 'tools', 'python-cmd.cjs'),
        path.join(ROOT, 'scripts', 'init.py'),
        tmp,
        '--id',
        'blank-158',
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
    assert.match(html, /kit-stages/);
    assert.match(html, /kit-zones/);
    assert.match(html, /kit-lanes/);
    assert.match(html, /kit-stack-board/);
    assert.match(html, /kit-pricing-cards/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
