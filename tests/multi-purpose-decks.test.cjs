/* Seam: multi-purpose archetypes + presenter ink wiring + PPTX docs. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

test('starters exist for status-report and design-review with deck.kind', () => {
  for (const name of ['status-report', 'design-review']) {
    const deck = JSON.parse(read('assets', 'starters', `${name}.json`));
    assert.equal(deck.kind, name);
    assert.ok(Array.isArray(deck.slides) && deck.slides.length >= 4);
  }
  const blank = JSON.parse(read('assets', 'starters', 'blank.json'));
  assert.equal(blank.kind, 'product-briefing');
});

test('schema allows kind, meta.purpose, presenterInk', () => {
  const schema = JSON.parse(read('assets', 'template', 'schemas', 'deck.schema.json'));
  assert.ok(schema.properties.kind);
  assert.ok(schema.properties.meta);
  assert.ok(schema.properties.presenterInk);
});

test('init.py exposes multi-purpose starters', () => {
  const init = read('scripts', 'init.py');
  assert.match(init, /status-report/);
  assert.match(init, /design-review/);
});

test('runtime wires presenter-ink before app and sync copies it', () => {
  const render = read('assets', 'template', 'tools', 'render.py');
  assert.match(render, /presenter-ink\.js/);
  assert.match(render, /deck-tools\.js/);
  const sync = read('scripts', 'sync_runtime.py');
  assert.match(sync, /presenter-ink\.js/);
  assert.match(sync, /deck-tools\.js/);
  const app = read('assets', 'template', 'js', 'app.js');
  assert.match(app, /PresenterInk/);
  assert.match(app, /DeckTools/);
  assert.match(app, /马克笔|togglePen|setMode/);
});

test('docs advertise editable PPTX export', () => {
  assert.match(read('SKILL.md'), /export:pptx/);
  assert.match(read('README.md'), /export:pptx/);
  assert.match(read('README.en.md'), /export:pptx/);
  assert.match(read('assets', 'template', 'tools', 'export_pptx.py'), /python-pptx/);
});
