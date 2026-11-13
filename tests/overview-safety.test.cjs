const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appPath = path.join('assets', 'template', 'js', 'app.js');

test('overview captions do not interpolate slide titles via innerHTML', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  assert.equal(
    /innerHTML\s*=\s*`[^`]*\$\{[^}]*dataset\.title/.test(source),
    false,
    'caption must not use innerHTML with dataset.title (XSS)'
  );
  assert.match(source, /thumbnail-caption/);
  assert.match(source, /textContent/);
});

test('render does not unconditionally rebuild overview thumbnails', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  // After P0, render() should gate thumbnail rebuilds on dialog.open (or equivalent).
  assert.match(
    source,
    /function render\([\s\S]*?dialog\.open[\s\S]*?refreshThumbnails|function render\([\s\S]*?refreshThumbnailsIfOpen/,
    'render() should only refresh thumbnails when overview needs them'
  );
});
