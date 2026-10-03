// Lists the app's source files that nothing reaches: starting from index.ts, follow every import
// (and require / dynamic import) and report the files under src/ that were never followed.
//
//   node scripts/dead-code.mjs            # print the unreachable files
//   node scripts/dead-code.mjs --check    # same, and exit 1 if there are any (for CI)
//
// Platform files (foo.native.ts, foo.web.ts, foo.ios.ts, foo.android.ts) count as reached when foo is.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'index.ts');
const CODE = ['.ts', '.tsx', '.js', '.jsx'];
const PLATFORM = ['', '.native', '.web', '.ios', '.android'];

function candidates(base) {
  const out = [];
  for (const p of PLATFORM) for (const e of CODE) out.push(base + p + e);
  for (const p of PLATFORM) for (const e of CODE) out.push(path.join(base, 'index' + p + e));
  out.push(base); // json, images...
  return out;
}

function resolveImport(from, spec) {
  if (!spec.startsWith('.')) return []; // packages
  const base = path.resolve(path.dirname(from), spec);
  return candidates(base).filter((f) => existsSync(f) && statSync(f).isFile());
}

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g;

const seen = new Set();
const queue = [entry];
while (queue.length) {
  const file = queue.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  if (!CODE.includes(path.extname(file))) continue;
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    for (const f of resolveImport(file, spec)) queue.push(f);
  }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (CODE.includes(path.extname(full))) out.push(full);
  }
  return out;
}

const all = walk(path.join(root, 'src'));
const dead = all.filter((f) => !seen.has(f)).map((f) => path.relative(root, f).replaceAll('\\', '/')).sort();
const lines = (f) => readFileSync(path.join(root, f), 'utf8').split('\n').length;

for (const f of dead) console.log(`${String(lines(f)).padStart(6)}  ${f}`);
console.log(`\n${dead.length} unreachable file(s), ${dead.reduce((n, f) => n + lines(f), 0)} lines, of ${all.length} files under src/`);
if (process.argv.includes('--check') && dead.length) process.exit(1);
