#!/usr/bin/env node
// PreToolUse guard untuk agent rina-maintenance (deny-by-default).
// Hanya perintah baca-saja yang diizinkan; sisanya exit 2 (diblokir Claude Code).
// Pakai: hook frontmatter rina-maintenance.md -> matcher "Bash".
import { readFileSync } from 'node:fs';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch { process.exit(0); }

let cmd = '';
try { cmd = JSON.parse(raw)?.tool_input?.command ?? ''; } catch { process.exit(0); }
if (!cmd.trim()) process.exit(0);

const DENY = [
  [/\.\.\/ujion-tka-apps\/(\.|.*\/\.env)|(^|[\s"'`])\.env(\.|[\s"'`]|$)/i, 'file .env/rahasia dilarang dibaca'],
  [/\$\(|`/, 'command substitution dilarang'],
  [/>>?/, 'redirection penulisan file dilarang'],
  [/\b(rm|mv|cp|chmod|chown|kill|pkill)\b/, 'perintah modifikasi filesystem/proses dilarang'],
  [/\bgit\b[^|;&]*\b(commit|push|add|checkout|reset|rebase|merge|clean|stash)\b/, 'git tulis dilarang'],
  [/\b(migrate|db:seed|db:wipe|queue:work|queue:restart|cache:clear|storage:link|route:cache)\b/, 'perintah artisan yang mengubah data/proses dilarang'],
  [/\b(curl|wget|nc|netcat|ssh|scp|rsync|php\s+-S|npm\s+publish)\b/, 'akses jaringan/eksekusi layanan dilarang'],
  [/\btest\b|\bphpunit\b|\bpest\b/, 'menjalankan test (sentuh DB nyata) dilarang'],
];

const ALLOW = [
  /^git\s+(-C\s+(\.\.\/ujion-tka-apps|\.)\s+)?(log|status|ls-files|diff|show|branch|remote\s+-v)\b/,
  /^(grep|rg|ack|ag)\b/,
  /^(tail|head|wc|ls|find|file|stat|du|df|pwd|date|which|echo)\b/,
  /^cat\s+(\S*\/)?(storage\/logs\/|.*\.log)/,
  /^php\s+(\S*\/)?artisan\s+route:list\b/,
  /^composer\s+audit\b/,
  /^npm\s+audit\b/,
  /^node\s+(\S*\/)?tools\/pindai\.mjs\b/,
];

const block = (why) => { console.error(`DIBLOKIR rina-bash-guard: ${why}. Perintah: ${cmd}`); process.exit(2); };

for (const [re, why] of DENY) if (re.test(cmd)) block(why);

// Tiap segmen pipeline/&&/; harus cocok dengan allowlist
const segments = cmd.split(/\s*(?:\|\||&&|;|\|)\s*/).map(s => s.trim()).filter(Boolean);
if (segments.length === 0) block('perintah kosong');
for (const seg of segments) {
  if (!ALLOW.some(re => re.test(seg))) block('perintah di luar daftar baca-saja (lihat rina-maintenance.md)');
}
process.exit(0);
