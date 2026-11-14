/* Seam: P1/P2 pack — schema validate, sync_runtime, agenda/quote/tabs, cut export help. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'assets', 'template');
const PYTHON = path.join(TEMPLATE, 'tools', 'python-cmd.cjs');

function copyTemplate(dest) {
  fs.cpSync(TEMPLATE, dest, {
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

function jsonschemaAvailable() {
  const probe = spawnSync(process.execPath, [PYTHON, '-c', 'import jsonschema'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return probe.status === 0;
}

test('export CLI documents --cut', () => {
  const help = execFileSync(process.execPath, [path.join(TEMPLATE, 'tools', 'export.cjs'), '--help'], {
    encoding: 'utf8',
  });
  assert.match(help, /--cut/);
});

test('sync_runtime dry-run stamps version and surfaces changelog notes', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-sync-'));
  try {
    copyTemplate(tmp);
    const deckPath = path.join(tmp, 'content', 'deck.json');
    const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
    deck.runtimeVersion = '1.2.1';
    fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2));
    const result = spawnSync(
      process.execPath,
      [PYTHON, path.join(ROOT, 'scripts', 'sync_runtime.py'), tmp, '--dry-run'],
      { encoding: 'utf8', cwd: ROOT }
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const out = String(result.stdout || '');
    assert.match(out, /Would sync|runtime/i);
    assert.match(out, /1\.3\.0|CHANGELOG|breaking|notes/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('schema validation rejects unknown top-level keys when jsonschema is installed', {
  skip: !jsonschemaAvailable(),
}, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-schema-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'schema-bad',
      title: { zh: '坏', en: 'Bad' },
      notARealField: true,
      slides: [{ type: 'cover', id: 'cover', title: { zh: '封面', en: 'Cover' }, background: '云山' }],
    };
    fs.writeFileSync(path.join(tmp, 'content', 'deck.json'), JSON.stringify(deck, null, 2));
    const result = runRender(tmp);
    assert.notEqual(result.status, 0);
    assert.match(String(result.stderr || result.stdout), /schema|additional|notARealField|jsonschema/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('agenda quote and tabs layouts render branded markup', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-aqt-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'aqt-check',
      title: { zh: '版式', en: 'Layouts' },
      slides: [
        { type: 'cover', id: 'cover', title: { zh: '封面', en: 'Cover' }, background: '云山' },
        {
          type: 'agenda',
          id: 'agenda',
          title: { zh: '议程', en: 'Agenda' },
          items: [
            { label: { zh: '价值', en: 'Value' }, time: { zh: '5分钟', en: '5 min' } },
            { label: { zh: '能力', en: 'Capability' }, time: { zh: '10分钟', en: '10 min' } },
            { label: { zh: '证明', en: 'Proof' } },
          ],
        },
        {
          type: 'quote',
          id: 'quote',
          title: { zh: '客户证言', en: 'Voice' },
          quote: { zh: '稳定可靠。', en: 'Stable and reliable.' },
          attribution: { zh: '某 CIO', en: 'A CIO' },
          role: { zh: '金融客户', en: 'Finance customer' },
        },
        {
          type: 'tabs',
          id: 'tabs',
          title: { zh: '对照', en: 'Compare' },
          tabs: [
            {
              id: 'a',
              label: { zh: '方案A', en: 'Plan A' },
              body: { zh: '说明A', en: 'Body A' },
              bullets: [{ zh: '点一', en: 'One' }],
            },
            {
              id: 'b',
              label: { zh: '方案B', en: 'Plan B' },
              body: { zh: '说明B', en: 'Body B' },
            },
          ],
        },
        {
          type: 'closing',
          id: 'thanks',
          title: { zh: '致谢', en: 'Thanks' },
          thanks: { zh: '', en: 'Thank You' },
          vision: {
            zh: '把数字世界带入每个人、每个家庭、\n每个组织，构建万物互联的智能世界。',
            en: 'Bring digital to every person, home and organization\nfor a fully connected, intelligent world.',
          },
        },
      ],
    };
    fs.writeFileSync(path.join(tmp, 'content', 'deck.json'), JSON.stringify(deck, null, 2));
    const result = runRender(tmp);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const html = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(tmp, 'css', 'components.css'), 'utf8');
    assert.match(html, /class="kit-agenda"/);
    assert.match(html, /class="kit-quote"/);
    assert.match(html, /class="kit-tabs"|recipe-tabs|data-tabs-root/);
    assert.match(html, /tabs\.js/);
    assert.match(css, /kit-agenda/);
    assert.match(css, /kit-quote/);
    const renderSrc = fs.readFileSync(path.join(tmp, 'tools', 'render.py'), 'utf8');
    assert.match(renderSrc, /register_full_slide\(\s*['"]cover['"]/);
    assert.match(renderSrc, /register_full_slide\(\s*['"]closing['"]/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('presenter chrome documents laser and timer shortcuts', () => {
  const app = fs.readFileSync(path.join(TEMPLATE, 'js', 'app.js'), 'utf8');
  assert.match(app, /laser|激光/i);
  assert.match(app, /timer|计时|elapsed/i);
  assert.match(app, /prefers-reduced-motion|reducedMotion|matchMedia/);
});
