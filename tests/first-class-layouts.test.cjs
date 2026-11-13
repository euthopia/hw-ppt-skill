const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

test('pricing and scenarios layouts emit mount points and asset-manifest entries', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-layouts-'));
  try {
    fs.cpSync(path.join('assets', 'template'), tmp, {
      recursive: true,
      filter: (p) => !p.includes(`${path.sep}dist`) && !p.includes(`${path.sep}node_modules`),
    });
    const deck = {
      id: 'layout-check',
      runtimeVersion: '1.1.0',
      title: { zh: '布局检查', en: 'Layout check' },
      cuts: { cio: { hidden: ['price'], label: { zh: 'CIO精简', en: 'CIO cut' } } },
      slides: [
        { type: 'cover', id: 'cover', title: { zh: '封面', en: 'Cover' }, background: '云山' },
        {
          type: 'pricing',
          id: 'price',
          title: { zh: '套餐', en: 'Plans' },
          rows: [{ name: 'A', input: '1', output: '2' }],
          labels: { name: { zh: '名称', en: 'Name' }, input: { zh: '输入', en: 'Input' }, output: { zh: '输出', en: 'Output' } },
        },
        {
          type: 'scenarios',
          id: 'scene',
          title: { zh: '场景', en: 'Scenarios' },
          scenarios: [
            { id: 'one', label: { zh: '场景一', en: 'One' }, body: { zh: '说明一', en: 'Body one' } },
            { id: 'two', label: { zh: '场景二', en: 'Two' }, body: { zh: '说明二', en: 'Body two' } },
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
    assert.match(html, /data-pricing-root/);
    assert.match(html, /recipe-scenarios/);
    assert.match(html, /pricing-table\.js/);
    assert.match(html, /scenario-switcher\.js/);
    assert.match(html, /recipes\.css/);
    const config = fs.readFileSync(path.join(tmp, 'js', 'config.js'), 'utf8');
    assert.match(config, /"cuts"/);
    assert.match(config, /"cio"/);
    const manifest = JSON.parse(fs.readFileSync(path.join(tmp, 'asset-manifest.json'), 'utf8'));
    assert.ok(manifest.js.includes('js/pricing-boot.js'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('custom fragments reject script tags', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-custom-'));
  try {
    fs.cpSync(path.join('assets', 'template'), tmp, {
      recursive: true,
      filter: (p) => !p.includes(`${path.sep}dist`) && !p.includes(`${path.sep}node_modules`),
    });
    fs.writeFileSync(path.join(tmp, 'content', 'bad.html'), '<div><script>alert(1)</script></div>');
    const deck = {
      id: 'custom-check',
      title: { zh: '自定义', en: 'Custom' },
      slides: [
        { type: 'cover', id: 'cover', title: { zh: '封面', en: 'Cover' } },
        { type: 'custom', id: 'bad', title: { zh: '坏片段', en: 'Bad' }, fragment: 'content/bad.html' },
      ],
    };
    fs.writeFileSync(path.join(tmp, 'content', 'deck.json'), JSON.stringify(deck));
    const result = spawnSync(process.execPath, ['tools/python-cmd.cjs', 'tools/render.py'], {
      cwd: tmp,
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(String(result.stderr) + String(result.stdout), /script/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
