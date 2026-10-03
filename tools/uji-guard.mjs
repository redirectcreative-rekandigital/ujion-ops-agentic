// Uji otomatis hook PreToolUse `.claude/hooks/rina-bash-guard.mjs`.
// Pakai: node tools/uji-guard.mjs   (exit 0 = semua lulus)
// Dibuat dari hasil audit 2026-10-03: skenario bypass lama wajib exit 2, perintah baca-saja wajib exit 0.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const guard = path.join(root, '.claude', 'hooks', 'rina-bash-guard.mjs');

// [harus, nama, perintah]  harus = 'blok' | 'lolos'
const kasus = [
  ['blok', 'find -delete', 'find . -delete'],
  ['blok', 'find -exec cat', 'find ../ujion-tka-apps -exec cat {} \;'],
  ['blok', 'find -exec rm', 'find . -name "*.log" -exec rm {} \;'],
  ['blok', 'perintah multi-baris', 'ls\nfind . -delete'],
  ['blok', 'latar &', 'ls & find . -delete'],
  ['blok', '&& ke rm', 'ls && rm -rf x'],
  ['blok', 'grep ke root repo aplikasi', 'grep -rn "" ../ujion-tka-apps'],
  ['blok', 'grep ke root repo (pakai /)', 'grep -rn "" ../ujion-tka-apps/'],
  ['blok', 'git show (cetak diff)', 'git -C ../ujion-tka-apps show HEAD'],
  ['blok', 'git show .env', 'git -C ../ujion-tka-apps show HEAD:.env'],
  ['blok', 'git log -p', 'git -C ../ujion-tka-apps log -p'],
  ['blok', 'git log --patch', 'git -C ../ujion-tka-apps log --patch'],
  ['blok', 'git show -U1', 'git -C ../ujion-tka-apps show -U1 HEAD'],
  ['blok', 'git log -S', 'git -C ../ujion-tka-apps log -S search'],
  ['blok', 'git diff --no-index', 'git -C ../ujion-tka-apps diff --no-index a b'],
  ['blok', 'git add', 'git -C ../ujion-tka-apps add .'],
  ['blok', 'git -C folder asing', 'git -C /etc status'],
  ['blok', 'cat .env', 'cat ../ujion-tka-apps/.env'],
  ['blok', 'head .env', 'head ../ujion-tka-apps/.env'],
  ['blok', 'cat .env varian', 'cat ../ujion-tka-apps/.env.production'],
  ['blok', 'cat .env.example lewat Bash', 'cat ../ujion-tka-apps/.env.example'],
  ['blok', 'cat traversal setelah storage/logs', 'cat ../ujion-tka-apps/storage/logs/../../config/app.php'],
  ['blok', 'cat .env di baris kedua', 'ls\ncat ../ujion-tka-apps/.env'],
  ['blok', 'grep naik ke folder induk', 'grep -rn APP_KEY ..'],
  ['blok', 'grep ke rumah', 'grep -rn secret ~/ujion-tka-apps'],
  ['blok', 'grep root lalu ls', 'grep -rn "" ../ujion-tka-apps && ls'],
  ['blok', 'input hook rusak (bukan JSON)', null],
  ['blok', 'perintah di luar allowlist', 'NOT_A_JSON'],
  ['blok', 'perintah kosong', ''],
  ['blok', 'curl', 'curl http://x'],
  ['blok', 'migrate', 'php ../ujion-tka-apps/artisan migrate'],
  ['blok', 'npm test', 'npm test'],
  ['blok', 'baca token coolify', 'head ~/.coolify_token'],
  ['blok', 'stat kunci ssh', 'stat ~/.ssh/id_rsa'],
  ['blok', 'php sembarang', 'php maintenance/artisan route:list'],
  ['blok', 'tee (tulis file)', 'ls | tee /tmp/x'],
  ['blok', 'find di dalam pipe', 'ls | find . -delete'],
  ['blok', 'node -e', 'node -e "console.log(1)"'],
  ['blok', 'bash -c', 'bash -c "cat ../ujion-tka-apps/.env"'],
  ['blok', 'git -C ~', 'git -C ~/ show HEAD'],
  ['lolos', 'git log', 'git -C ../ujion-tka-apps log -3'],
  ['lolos', 'git status', 'git -C ../ujion-tka-apps status --short'],
  ['lolos', 'git diff', 'git -C ../ujion-tka-apps diff'],
  ['lolos', 'git show <rev>:<path>', 'git -C ../ujion-tka-apps show HEAD:README.md'],
  ['lolos', 'git branch', 'git -C ../ujion-tka-apps branch'],
  ['lolos', 'git remote -v', 'git -C ../ujion-tka-apps remote -v'],
  ['lolos', 'git ls-files', 'git ls-files'],
  ['lolos', 'git -C . log', 'git -C . log -1'],
  ['lolos', 'grep ke subfolder aplikasi', 'grep -rn "route" ../ujion-tka-apps/routes'],
  ['lolos', 'grep ke folder docker aplikasi', 'grep -rn "fastcgi" ../ujion-tka-apps/docker'],
  ['lolos', 'grep di repo ops', 'grep -rn "deny" .'],
  ['lolos', 'grep pola berisi /', 'grep -rn "App/Http" .claude'],
  ['lolos', 'grep isi .env.example', 'grep -rn "APP_DEBUG" ../ujion-tka-apps/.env.example'],
  ['lolos', 'cat log aplikasi', 'cat ../ujion-tka-apps/storage/logs/laravel.log'],
  ['lolos', 'cat log lokal', 'cat laravel.log'],
  ['lolos', 'tail log', 'tail -n 50 ../ujion-tka-apps/storage/logs/laravel.log'],
  ['lolos', 'head log', 'head -50 storage/logs/app.log'],
  ['lolos', 'wc log', 'wc -l ../ujion-tka-apps/storage/logs/laravel.log'],
  ['lolos', 'ls', 'ls -la'],
  ['lolos', 'stat + du', 'stat laravel.log && du -sh .'],
  ['lolos', 'du folder aplikasi', 'du -sh ../ujion-tka-apps/storage'],
  ['lolos', 'artisan route:list', 'php ../ujion-tka-apps/artisan route:list'],
  ['lolos', 'composer audit', 'composer audit --working-dir=../ujion-tka-apps'],
  ['lolos', 'npm audit', 'npm audit --prefix ../ujion-tka-apps'],
  ['lolos', 'pemindai rahasia', 'node tools/pindai.mjs'],
  ['lolos', 'pipeline baca', 'ls | grep x | wc -l'],
  ['lolos', '&& baca', 'pwd && ls'],
  ['lolos', 'echo', 'echo selesai'],
];

const jalankan = (cmd) => {
  const payload = cmd === null ? 'ini bukan json{{' : JSON.stringify({ tool_input: { command: cmd } });
  const r = spawnSync(process.execPath, [guard], { input: payload, encoding: 'utf8' });
  return r.status;
};

let gagal = 0;
const hasil = [];
for (const [harus, nama, cmd] of kasus) {
  const kode = jalankan(cmd);
  const ok = harus === 'blok' ? kode === 2 : kode === 0;
  if (!ok) gagal++;
  hasil.push([ok ? 'LULUS' : 'GAGAL', harus, kode, nama]);
}
for (const [st, harus, kode, nama] of hasil) {
  if (st === 'GAGAL') console.log(`${st}  harus ${harus} (exit ${kode})  ${nama}`);
}
console.log(`${hasil.length - gagal}/${hasil.length} lulus${gagal ? ` — ${gagal} GAGAL` : ''}`);
process.exit(gagal ? 1 : 0);
