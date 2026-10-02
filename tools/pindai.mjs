#!/usr/bin/env node
// Pindai rahasia/data pribadi di berkas repo ops (marketing/, maintenance/,
// tugas/, .claude/, docs/, *.md akar). Baca-saja; keluaran daftar temuan.
// Pakai: node tools/pindai.mjs   (exit 1 bila ada temuan)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dashboard', 'tools']);
const SCAN_ROOTS = ['marketing', 'maintenance', 'tugas', '.claude', 'docs'];
const EXT = /\.(md|json|mjs|sh|txt|yml|yaml)$/i;

const PATTERNS = [
  ['nomor-WA', /\b62[89]\d{8,10}\b|\b08[12]\d{7,10}\b/],
  ['APP_KEY', /base64:[A-Za-z0-9+/=]{20,}/],
  ['kunci-Doku', /\b(doku[_-]?)?(key|secret)\b["'\s:=]{1,4}[A-Za-z0-9]{20,}/i],
  ['token-GitHub', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|github_pat_[A-Za-z0-9_]{22,}/],
  ['API-key-umum', /\bsk-[A-Za-z0-9_-]{20,}\b|\bAKIA[0-9A-Z]{16}\b|\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['kredensial', /\b(password|passwd|secret|token|api[_-]?key)\b["'\s]*[:=]\s*["']?[^\s"'|<>{]{8,}/i],
];

const mask = (s) => (s.length <= 8 ? s.slice(0, 2) + '***' : s.slice(0, 4) + '***' + s.slice(-2));

function files(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) files(p, out);
    else if (EXT.test(e)) out.push(p);
  }
  return out;
}

function scan(p) {
  const hits = [];
  const rel = path.relative(root, p).split(path.sep).join('/');
  const lines = readFileSync(p, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [label, re] of PATTERNS) {
      const m = line.match(re);
      if (m) hits.push(`${rel}:${i + 1} | ${label} | ${mask(m[0])}`);
    }
  });
  return hits;
}

let targets = files(root).filter((p) => {
  const rel = path.relative(root, p);
  if (path.dirname(rel) === '.') return /\.(md|txt)$/i.test(rel); // berkas akar: md/txt saja
  return SCAN_ROOTS.some((d) => rel === d || rel.startsWith(d + path.sep));
});

const findings = targets.flatMap(scan).filter((f) => !f.includes('tools/pindai.mjs'));
if (findings.length) {
  console.log(`Ditemukan ${findings.length} kecocokan di ${targets.length} berkas:\n`);
  for (const f of findings) console.log('  ' + f);
  console.log('\nPeriksa satu per satu: nyata (hapus/ganti + rotasi kunci) atau placeholder (abaikan).');
  process.exit(1);
}
console.log(`Bersih: 0 temuan dari ${targets.length} berkas.`);
