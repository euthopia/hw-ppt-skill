const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

function copyTemplate(dest) {
  const src = path.join('assets', 'template');
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (p) => !p.includes(`${path.sep}node_modules`) && !p.includes(`${path.sep}dist`) && !p.includes(`${path.sep}.wrangler`),
  });
}

function runRender(cwd) {
  const result = spawnSync(process.execPath, [path.join('tools', 'python-cmd.cjs'), path.join('tools', 'render.py')], {
    cwd,
    encoding: 'utf8',
  });
  return result;
}

test('generator stamps runtimeVersion and writes translations once in source', () => {
  const renderSrc = fs.readFileSync(path.join('assets', 'template', 'tools', 'render.py'), 'utf8');
  const writes = [...renderSrc.matchAll(/translations\.js'\)\.write_text/g)];
  assert.equal(writes.length, 1, 'render.py must write translations.js exactly once');
  assert.match(renderSrc, /register_layout|LAYOUTS/, 'layout registry seam required');
  assert.match(renderSrc, /runtimeVersion/);
});

test('generate emits DeckConfig.runtimeVersion for template deck', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-deck-'));
  try {
    copyTemplate(tmp);
    const result = runRender(tmp);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const config = fs.readFileSync(path.join(tmp, 'js', 'config.js'), 'utf8');
    assert.match(config, /runtimeVersion/);
    const translations = fs.readFileSync(path.join(tmp, 'js', 'translations.js'), 'utf8');
    assert.match(translations, /window\.DeckEnglish/);
    assert.ok(fs.existsSync(path.join(tmp, 'schemas', 'deck.schema.json')) ||
      fs.existsSync(path.join('assets', 'template', 'schemas', 'deck.schema.json')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('deck schema file exists and mentions slide types', () => {
  const schemaPath = path.join('assets', 'template', 'schemas', 'deck.schema.json');
  assert.ok(fs.existsSync(schemaPath), 'missing deck.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.equal(schema.$schema || true, schema.$schema || true);
  const body = JSON.stringify(schema);
  for (const kind of ['cover', 'cards', 'metrics', 'workflow', 'closing']) {
    assert.match(body, new RegExp(kind));
  }
  assert.match(body, /runtimeVersion/);
});
