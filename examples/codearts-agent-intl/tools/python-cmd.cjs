#!/usr/bin/env node
/** Resolve a working Python 3 binary on Windows/macOS/Linux, then run args. */
const { spawnSync } = require('node:child_process');

function resolvePython() {
  if (process.env.PYTHON_EXECUTABLE) return [process.env.PYTHON_EXECUTABLE, []];
  const candidates = [
    ['py', ['-3']],
    ['python3', []],
    ['python', []],
  ];
  for (const [cmd, prefix] of candidates) {
    const probe = spawnSync(cmd, [...prefix, '-c', 'import sys; assert sys.version_info >= (3, 9)'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    if (probe.status === 0) return [cmd, prefix];
  }
  throw new Error(
    'Python 3.9+ is required. Install Python or set PYTHON_EXECUTABLE to your interpreter.'
  );
}

const [cmd, prefix] = resolvePython();
const args = [...prefix, ...process.argv.slice(2)];
const result = spawnSync(cmd, args, { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
