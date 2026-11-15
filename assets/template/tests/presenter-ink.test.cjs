/* Seam: presenter laser + marker ink (mode toggles, deck scale map, per-slide strokes). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = path.join(__dirname, '..', 'js', 'presenter-ink.js');
const ctx = {};
vm.createContext(ctx);
assert.ok(fs.existsSync(src), 'presenter-ink.js must exist');
vm.runInContext(fs.readFileSync(src, 'utf8'), ctx);
assert.ok(ctx.PresenterInk, 'PresenterInk global missing');

test('mapPoint maps client coords into 1600×900 deck space via scaled rect', () => {
  const rect = { left: 100, top: 50, width: 800, height: 450 };
  const origin = ctx.PresenterInk.mapPoint(100, 50, rect);
  assert.equal(origin.x, 0);
  assert.equal(origin.y, 0);
  const corner = ctx.PresenterInk.mapPoint(900, 500, rect);
  assert.equal(corner.x, 1600);
  assert.equal(corner.y, 900);
  const mid = ctx.PresenterInk.mapPoint(500, 275, rect);
  assert.equal(mid.x, 800);
  assert.equal(mid.y, 450);
  assert.equal(ctx.PresenterInk.mapPoint(0, 0, { left: 0, top: 0, width: 0, height: 0 }), null);
});

test('modes are mutually exclusive: laser, pen, eraser, off', () => {
  const ink = ctx.PresenterInk.create({ slideKey: 'a' });
  assert.equal(ink.getMode(), 'off');
  assert.equal(ink.toggleLaser(), 'laser');
  assert.equal(ink.togglePen(), 'pen');
  assert.equal(ink.getMode(), 'pen');
  assert.equal(ink.toggleEraser(), 'eraser');
  assert.equal(ink.toggleLaser(), 'laser');
  assert.equal(ink.exitTool(), 'off');
  assert.equal(ink.togglePen(), 'pen');
  assert.equal(ink.togglePen(), 'off');
});

test('strokes are stored per slide and clearCurrent only wipes the active slide', () => {
  const ink = ctx.PresenterInk.create({ slideKey: 'cover' });
  ink.setMode('pen');
  ink.beginStroke({ x: 10, y: 10 });
  ink.extendStroke({ x: 20, y: 20 });
  ink.endStroke();
  assert.equal(ink.getStrokes('cover').length, 1);
  ink.onSlideChange('values');
  ink.beginStroke({ x: 1, y: 1 });
  ink.endStroke();
  assert.equal(ink.getStrokes('cover').length, 1);
  assert.equal(ink.getStrokes('values').length, 1);
  ink.clearCurrent();
  assert.equal(ink.getStrokes('values').length, 0);
  assert.equal(ink.getStrokes('cover').length, 1);
});

test('clearOnLeave drops previous slide ink when configured', () => {
  const ink = ctx.PresenterInk.create({ slideKey: 'a', clearOnLeave: true });
  ink.setMode('pen');
  ink.beginStroke({ x: 5, y: 5 });
  ink.endStroke();
  ink.onSlideChange('b');
  assert.equal(ink.getStrokes('a').length, 0);
  ink.beginStroke({ x: 2, y: 2 });
  ink.endStroke();
  assert.equal(ink.getStrokes('b').length, 1);
});

test('default keeps ink when leaving a slide', () => {
  const ink = ctx.PresenterInk.create({ slideKey: 'a' });
  ink.setMode('pen');
  ink.beginStroke({ x: 5, y: 5 });
  ink.endStroke();
  ink.onSlideChange('b');
  assert.equal(ink.getStrokes('a').length, 1);
});

test('color cycle and width clamps stay within presenter range', () => {
  const ink = ctx.PresenterInk.create({ slideKey: 'a' });
  assert.equal(ink.getColor(), ctx.PresenterInk.COLORS.red);
  assert.equal(ink.cycleColor(), ctx.PresenterInk.COLORS.black);
  assert.equal(ink.cycleColor(), ctx.PresenterInk.COLORS.red);
  ink.setPenWidth(100);
  assert.ok(ink.getPenWidth() <= 16);
  ink.setPenWidth(0);
  assert.ok(ink.getPenWidth() >= 1.5);
});
