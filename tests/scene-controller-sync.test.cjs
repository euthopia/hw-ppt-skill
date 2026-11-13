const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const canonical = path.join('assets', 'template', 'js', 'scenes.js');
const recipeCopy = path.join('assets', 'recipes', 'scene-controller.js');

test('recipe scene-controller matches canonical template scenes.js', () => {
  const a = fs.readFileSync(canonical, 'utf8').replace(/\r\n/g, '\n');
  const b = fs.readFileSync(recipeCopy, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(a, b, 'run: python scripts/sync_scene_controller.py');
});
