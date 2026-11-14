/* Seam: before-after layout — schema, HTML/CSS tokens, PPTX lines. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'assets', 'template');

function copyTemplate(dest) {
  fs.cpSync(TEMPLATE, dest, {
    recursive: true,
    filter: (p) => !p.includes(`${path.sep}node_modules`) && !p.includes(`${path.sep}dist`) && !p.includes(`${path.sep}.wrangler`),
  });
}

function bilingual(zh, en) {
  return { zh, en };
}

test('before-after layout renders branded dual panels and CSS tokens', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huawei-ba-'));
  try {
    copyTemplate(tmp);
    const deck = {
      id: 'ba-check',
      title: bilingual('前后对照', 'Before after'),
      slides: [
        { type: 'cover', id: 'cover', title: bilingual('封面', 'Cover'), background: '云山' },
        {
          type: 'before-after',
          id: 'transform',
          title: bilingual('交付前后', 'Delivery shift'),
          before: {
            label: bilingual('之前', 'Before'),
            title: bilingual('碎片工具链', 'Fragmented toolchain'),
            body: bilingual('上下文在工具间丢失。', 'Context is lost across tools.'),
            bullets: [bilingual('多系统切换', 'Tool switching'), bilingual('评审滞后', 'Late review')],
          },
          after: {
            label: bilingual('之后', 'After'),
            title: bilingual('主路径协作', 'In-flow collaboration'),
            body: bilingual('意图到可合并变更更短。', 'Shorter path from intent to merge.'),
            bullets: [bilingual('人类在环', 'Human in the loop')],
          },
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
    const schema = fs.readFileSync(path.join(tmp, 'schemas', 'deck.schema.json'), 'utf8');
    assert.match(html, /class="kit-before-after"/);
    assert.match(html, /data-ba-side="before"/);
    assert.match(html, /data-ba-side="after"/);
    assert.match(html, /碎片工具链|Fragmented toolchain/);
    assert.match(css, /kit-before-after/);
    assert.match(schema, /"const":\s*"before-after"/);
    const pptxSrc = fs.readFileSync(path.join(tmp, 'tools', 'export_pptx.py'), 'utf8');
    assert.match(pptxSrc, /before-after/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
