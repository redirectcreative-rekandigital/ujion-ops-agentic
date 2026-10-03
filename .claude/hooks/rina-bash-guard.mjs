#!/usr/bin/env node
// PreToolUse guard untuk agent rina-maintenance (deny-by-default, fail-closed).
// Hanya perintah baca-saja yang diizinkan; sisanya exit 2 (diblokir Claude Code).
// Pakai: hook frontmatter rina-maintenance.md -> matcher "Bash".
//
// Audit 2026-10-03 — celah yang ditutup:
//   * find -delete / -exec     -> find tidak lagi di allowlist + deny khusus
//   * perintah multi-baris     -> segmen dipisah juga di newline
//   * latar "cmd & cmd2"       -> segmen dipisah juga di & tunggal
//   * grep -r ke root repo     -> tool pencarian dilarang menunjuk root/di luar workspace
//   * git show <rev> (diff)    -> hanya git show <rev>:<path>; flag patch log diblokir
//   * cat dengan traversal     -> path log harus satu segmen, tanpa ".." setelah anchor
//   * input hook rusak         -> dulu lolos (exit 0), sekarang diblokir (fail-closed)
//   * .env.example             -> diizinkan (butir checklist audit APP_DEBUG/APP_ENV)
import { readFileSync } from 'node:fs';

let cmd = '';
const block = (why) => {
  console.error(`DIBLOKIR rina-bash-guard: ${why}. Perintah: ${cmd || '(kosong)'}`);
  process.exit(2);
};

try { cmd = String(JSON.parse(readFileSync(0, 'utf8'))?.tool_input?.command ?? ''); }
catch { block('input hook tidak terbaca atau bukan JSON valid'); }
if (!cmd.trim()) block('perintah kosong');

const DENY = [
  // .env dan semua varian; KECUALI .env.example (template, dibutuhkan checklist audit)
  [/(?<![A-Za-z0-9_])\.env(?!\.example(?:$|[\s"'`|;&)]))/i, 'file .env (varian selain .env.example) dilarang dibaca'],
  [/\$\(|`/, 'command substitution dilarang'],
  [/>>?/, 'redirection penulisan file dilarang'],
  [/\b(rm|mv|cp|chmod|chown|kill|pkill|tee|ln|truncate|dd)\b/, 'perintah modifikasi filesystem/proses dilarang'],
  [/\bgit\b[^|;&]*\b(commit|push|add|checkout|reset|rebase|merge|clean|stash|restore|switch|cherry-pick|revert)\b/, 'git tulis dilarang'],
  [/\b(migrate|db:seed|db:wipe|queue:work|queue:restart|cache:clear|storage:link|route:cache)\b/, 'perintah artisan yang mengubah data/proses dilarang'],
  [/\b(curl|wget|nc|netcat|ssh|scp|rsync|telnet|ftp|npx|php\s+-S|npm\s+publish)\b/, 'akses jaringan/eksekusi layanan dilarang'],
  [/\btest\b|\bphpunit\b|\bpest\b/, 'menjalankan test (sentuh DB nyata) dilarang'],
  [/\bfind\b[^|;&]*\s-(?:delete|exec|execdir|ok|okdir|fls|fprint|fprintf)\b/, 'find -exec/-delete dilarang'],
  [/\b(?:grep|rg|ack|ag)\b[^|;&]*[\s"'`]\.\.\/ujion-tka-apps\/?(?=[\s"'`]|$)/, 'pencarian ke root repo aplikasi dilarang (bisa memuat .env); arahkan ke subfolder'],
  [/~\/(?:\.ssh\b|\.aws\b|\.gnupg\b|\.netrc\b|\.npmrc\b|\.pgpass\b)|\b(?:id_rsa|id_ed25519|\.coolify_token)\b/, 'berkas kredensial dilarang dibaca'],
];

const isLog = (p) => /\/storage\/logs\/[^/]+$/.test(p) || /(^|\/)[^/]+\.log$/.test(p);

// git: subcommand baca-saja, tanpa flag yang mencetak isi file, -C hanya ke repo app / repo ops
const gitOk = (seg) => {
  const m = seg.match(/^git\s+(?:-C\s+(\S+)\s+)?(\S+)(?:\s+(.*))?$/);
  if (!m) return false;
  const [, dir, sub, rest = ''] = m;
  if (dir !== undefined && dir !== '.' && dir !== '../ujion-tka-apps') return false;
  if (/(?:^|\s)(?:-p\b|--patch\b|--unified(?:=\d+)?|-U\d+|-S\b|-G\b|-w\b|-W\b|--word-diff\b|--raw\b|--no-index\b)/.test(rest)) return false;
  if (sub === 'show') return /^git\s+(?:-C\s+\S+\s+)?show\s+[^\s-][^:]*:\S+/.test(seg);
  if (sub === 'branch') return !/(?:^|\s)-[dDmMf]/.test(rest);
  if (sub === 'remote') return /^\s*(?:-v|--verbose)\s*$/.test(rest);
  return ['log', 'status', 'ls-files', 'diff'].includes(sub);
};

// tool pencarian: path hanya di dalam repo ops, atau subfolder repo aplikasi (bukan root / di luar)
const searchOk = (seg) => {
  const paths = seg.split(/\s+/).slice(1)
    .filter(a => /^(?:\.{1,2}\/|~\/|\/)/.test(a) || /^\.{1,2}$/.test(a))
    .map(a => a.replace(/\/+$/, ''));
  return paths.every((p) => {
    if (p === '.' || p === './') return true;
    if (p.startsWith('../ujion-tka-apps/')) return !p.slice(18).includes('..');
    return !p.startsWith('..') && !p.startsWith('~') && !p.startsWith('/');
  });
};

const catOk = (seg) => {
  const m = seg.match(/^cat\s+(?:-[A-Za-z]+\s+)?(\S+)$/);
  return !!m && isLog(m[1]);
};

const allowSeg = (seg) => {
  if (/^(?:grep|rg|ack|ag)\b/.test(seg)) return searchOk(seg);
  if (/^(?:tail|head)\b/.test(seg)) return isLog(seg.split(/\s+/).pop());
  if (/^(?:ls|wc|file|stat|du|df|pwd|date|which|echo)\b/.test(seg)) return true;
  if (/^cat\b/.test(seg)) return catOk(seg);
  if (/^git\b/.test(seg)) return gitOk(seg);
  if (/^php\s+\.\.\/ujion-tka-apps\/artisan\s+route:list\b/.test(seg)) return true;
  if (/^composer\s+audit\b/.test(seg) || /^npm\s+audit\b/.test(seg)) return true;
  if (/^node\s+(?:\.\/)?tools\/pindai\.mjs\b/.test(seg)) return true;
  return false;
};

for (const [re, why] of DENY) if (re.test(cmd)) block(why);

// Tiap segmen (pipeline, &&, ;, &, atau baris baru) wajib lolos allowlist
const segments = cmd.split(/\s*(?:\|\||&&|;|&|\|)\s*|\r?\n+/).map(s => s.trim()).filter(Boolean);
if (segments.length === 0) block('perintah kosong');
for (const seg of segments) {
  if (!allowSeg(seg)) block('perintah di luar daftar baca-saja (lihat rina-maintenance.md)');
}
process.exit(0);
