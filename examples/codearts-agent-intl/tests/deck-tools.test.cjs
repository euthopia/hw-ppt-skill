/* Seam: DeckTools registry + rail presence / tool activate. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = (() => {
  try { return require('jsdom'); } catch { return { JSDOM: null }; }
})();

const src = path.join(__dirname, '..', 'js', 'deck-tools.js');
assert.ok(fs.existsSync(src), 'deck-tools.js must exist');

function loadDeckTools(globalExtras) {
  const ctx = Object.assign({ console }, globalExtras || {});
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(src, 'utf8'), ctx);
  return ctx;
}

beforeEach(() => {
  // fresh module each test via reload
});

test('registry lists defaults and accepts custom tools', () => {
  const ctx = loadDeckTools();
  ctx.DeckTools.clearRegistry();
  ctx.DeckTools.registerDefaults();
  // Map through String() so vm-realm primitives compare cleanly under deepStrictEqual.
  const ids = ctx.DeckTools.list().map((t) => String(t.id));
  assert.equal(ids.slice(0, 5).join(','), 'laser,pen,eraser,clear,color');
  assert.ok(ids.includes('more'));
  ctx.DeckTools.register({
    id: 'spotlight',
    order: 85,
    label: '聚光灯',
    title: '聚光灯',
    icon: 'plus',
    invoke: () => {},
  });
  const after = ctx.DeckTools.list().map((t) => String(t.id));
  assert.ok(after.includes('spotlight'));
  assert.ok(after.indexOf('spotlight') < after.indexOf('more'));
});

test('invoke activates laser via applyMode context', () => {
  const ctx = loadDeckTools();
  ctx.DeckTools.clearRegistry();
  ctx.DeckTools.registerDefaults();
  let mode = 'off';
  const api = {
    mode,
    applyMode: (next) => { mode = next; api.mode = next; },
  };
  const laser = ctx.DeckTools.list().find((t) => t.id === 'laser');
  assert.equal(laser.active(api), false);
  laser.invoke(api);
  assert.equal(mode, 'laser');
  api.mode = mode;
  assert.equal(laser.active(api), true);
  laser.invoke(api);
  assert.equal(mode, 'off');
});

test('rail mounts in document and tool click fires invoke', () => {
  if (!JSDOM) {
    // jsdom is optional; assert source contracts instead
    const body = fs.readFileSync(src, 'utf8');
    assert.match(body, /function mount/);
    assert.match(body, /deck-tool-rail/);
    assert.match(body, /registerDefaults/);
    return;
  }
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  const ctx = loadDeckTools({
    document: dom.window.document,
    window: dom.window,
  });
  ctx.DeckTools.clearRegistry();
  ctx.DeckTools.registerDefaults();
  let mode = 'off';
  const rail = ctx.DeckTools.mount({
    document: dom.window.document,
    host: dom.window.document.body,
    getContext: () => ({
      mode,
      applyMode: (next) => { mode = next; },
      isDrawing: false,
    }),
  });
  assert.ok(rail);
  assert.ok(dom.window.document.getElementById('deck-tool-rail'));
  const laserBtn = dom.window.document.querySelector('[data-tool-id="laser"]');
  assert.ok(laserBtn);
  laserBtn.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  assert.equal(mode, 'laser');
  rail.refresh();
  assert.ok(dom.window.document.querySelector('[data-tool-id="laser"].is-active'));
  rail.destroy();
});

test('app and render wire deck-tools before app.js', () => {
  const render = fs.readFileSync(path.join(__dirname, '..', 'tools', 'render.py'), 'utf8');
  assert.match(render, /deck-tools\.js/);
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert.match(app, /DeckTools/);
  assert.match(app, /toolRail/);
  // Rail clicks share applyToolMode with keyboard L/P/E so body.laser-on / ink-pen / ink-eraser stay in sync.
  assert.match(app, /applyMode:\s*\(mode\)\s*=>\s*applyToolMode\(mode\)/);
  assert.match(app, /classList\.toggle\('laser-on'/);
  assert.match(app, /classList\.toggle\('ink-pen'/);
  assert.match(app, /classList\.toggle\('ink-eraser'/);
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
  assert.match(css, /\.deck-tool-rail/);
  assert.match(css, /@media print[\s\S]*deck-tool-rail/);
});
