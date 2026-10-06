# ujion-ops — Tim Agent Ujion TKA

> **PRIVATE.** Isinya strategi kampanye, laporan audit, dan kebutuhan internal. Jangan disalin ke repo aplikasi `ujion-tka-apps` (publik). Jangan simpan rahasia (`.env`, kunci Doku) atau nomor WA/nama siswa di sini.

Tim agent **Claude Code** untuk digital marketing dan pemeliharaan website **Ujion TKA** (Laravel 12, repo aplikasi `ujion-tka-apps`). Pemilik hanya bicara ke satu manajer, **Joko**; Joko menyusun to-do, mendelegasikan ke 7 agent spesialis, menagih kebutuhan mereka, dan melapor. Semua keluaran berupa draf di repo ini — tindakan ke publik (posting, blast, iklan) baru boleh dilakukan setelah status **Disetujui** di antrian.

**Tim:** Joko (manajer) · Budi (konten) · Sari (SEO & analitik) · Agus (sosmed & WA) · Rina (pemeliharaan, read-only) · 3 freelancer (riset, brief, QC).

Dokumen: [`PRD.md`](PRD.md) produk · [`PASANG.md`](PASANG.md) pemasangan · [`CLAUDE.md`](CLAUDE.md) aturan tim · [`docs/`](docs/) arsitektur, spesifikasi agent, protokol, rencana tahap, keamanan, pengujian.

## Struktur
| Path | Isi |
|---|---|
| `.claude/agents/` | 8 definisi agent |
| `.claude/settings.json` | sesi utama Joko + permission `deny` baca/tulis repo aplikasi (anchor `//**/ujion-tka-apps/**` dan `//**/.env`; `.env.example` tetap boleh dibaca) |
| `.claude/skills/` | 5 skill terpreload (`audit-keamanan`, `pindai-rahasia`, `kalender-konten`, `cek-kualitas`, `ulasan-mingguan`) + 3 slash command (`/kampanye`, `/audit`, `/ulasan`) |
| `.claude/hooks/` | `rina-bash-guard.mjs` — hook PreToolUse, Bash Rina deny-by-default (baca-saja) |
| `tools/` | `pindai.mjs` — pemindai pola rahasia/data pribadi (bulanan) · `uji-guard.mjs` — uji 68 skenario hook Rina |
| `tugas/` | BOARD, KEBUTUHAN, KEPUTUSAN, ANTRIAN-PERSETUJUAN, INBOX |
| `marketing/` | `basis/` (kompetitor, tren, audiens, ide) + output: `konten/`, `analitik/`, `kampanye/`, `riset/`, `brief/` |
| `maintenance/` | laporan audit keamanan, log, draf konten admin |
| `dashboard/` | dashboard lokal v1: `server.mjs`, `index.html`, `uji.mjs`, `contoh/` (tetap utuh) |
| `dashboard-v2/` | dashboard v2 (Next.js 16 + SQLite + opencode): 12 tahap selesai, spesifikasi di `dashboard/docs/00-OVERVIEW.md` s.d. `12-MIGRATION.md` |
| `.opencode/` + `opencode.json` | config opencode v2 ter-generate dari DB (8 agents, 8 skills, 3 commands); JANGAN edit manual |
| `docker-compose.yml` | deploy Coolify (container Next.js; opencode serve via systemd host) |
| `dashboard-v2/deploy/` | `pasang-opencode-serve.sh`, unit systemd, `coolify-env.example`, panduan VPS |
| `docs/` | dokumentasi rujukan |

## Dashboard v2 (selesai 12/12 tahap, Next 16)

Control plane penuh pengganti dashboard v1 read-only. DB SQLite (`dashboard-v2/data/`, gitignored) adalah source of truth; file `.opencode/`, `opencode.json`, `tugas/*.md` di-generate via `POST /api/sync` atau otomatis tiap mutasi.

| Tahap | Isi | Status |
|---|---|---|
| 01 setup | Next.js 16 (dokumen minta 15, diputuskan tetap 16), shadcn, env VPS-ready, Dockerfile basis | Selesai |
| 02 database | 13 tabel + seed (13 models, kantor, settings) | Selesai |
| 03 auth | PIN + JWT cookie + rate limit; systemd opencode permanen | Selesai |
| 04 layout | Sidebar 12 menu, header (status opencode/logout), dashboard stats | Selesai |
| 05 agent-model | CRUD agent + permission matrix + avatar 2D/3D, model registry, AES key vault | Selesai |
| 06 task-approval | Kanban drag-drop + validasi transisi + approval queue + inbox | Selesai |
| 07 skill-mcp | Editor split-preview, MCP preset/toggle/test, assignment per-agent | Selesai |
| 08 logs-kantor | Log filter + SSE live + session viewer, kantor 3 tab, settings (PIN/backup) | Selesai |
| 09 playground | Chat + slash command, scheduler cron in-process + manual, batch 3 mode | Selesai |
| 10 sync | Client opencode 20 fungsi, sync DB→file, proxy `/api/opencode`, auto-trigger | Selesai |
| 11 docker | Container Next-only (serve tetap systemd host), compose + host-gateway, panduan Coolify | Selesai |
| 12 migrasi | 8 agents + 8 skills (3 jadi commands) + kantor + 12 tasks dari `.claude/`/BOARD; uji lama 25/25 | Selesai |

```bash
cd dashboard-v2 && npm run dev            # dev -> http://localhost:3000 (PIN: 245100)
npx tsx src/lib/db/migrate-from-claude.ts # migrasi ulang (idempoten)
```

Urutan ke VPS: `deploy/pasang-opencode-serve.sh` (systemd) → samakan `OPENCODE_SERVER_PASSWORD` di Coolify → deploy compose → cek badge hijau. Rename `.claude/` manual HANYA setelah `opencode debug config` + `agent list` beres. Gap diketahui: `KEBUTUHAN.md` belum di-sync (butuh tabel `needs`); Rina `bash: deny`; flag auth serve [perlu verifikasi] di VPS.

## Menjalankan
Prasyarat: **Node >= 18**, **Claude Code** (versi yang mendukung frontmatter `skills`/`hooks`), dan **bash** (Windows: jalankan di WSL). Letakkan `ujion-ops` sejajar dengan `ujion-tka-apps`.

```bash
./mulai.sh                              # Claude Code + Joko (izin baca ../ujion-tka-apps)
./dashboard.sh                           # dashboard -> http://127.0.0.1:8790
node dashboard/server.mjs dashboard/contoh   # lihat dashboard dengan data contoh
node dashboard/uji.mjs                   # uji otomatis (25 pemeriksaan, harus 25/25)
node tools/pindai.mjs                    # pindai rahasia (exit 0 = bersih)
node tools/uji-guard.mjs                 # uji hook Rina (68 skenario, exit 0 = bersih)
```
Bila `Permission denied`: `bash mulai.sh`.

Setelah sesi pertama dibuka:
1. **Terima workspace trust** untuk folder `ujion-ops` — tanpa ini hook guard Bash Rina dilewati Claude Code.
2. Ketik `/agents` (harus muncul 8 agent) dan `/skills` (harus ada skill di atas + 3 slash command).
3. Uji cepat: minta Joko "jalankan /ulasan" atau minta Rina audit kecil, lalu pastikan `git status` repo ini hanya berubah di `tugas/`, `marketing/`, `maintenance/`.

Bicara ke Joko, misalnya:
- "Buat kampanye 2 minggu pendaftaran guru SMP lewat Instagram dan WA."
- "Audit keamanan modul pembayaran Doku."
- "Catat link ini: ..." (kiriman bebas — Joko yang memilah)

Atau pakai slash command (manual, tidak dipanggil otomatis): `/kampanye [deskripsi]`, `/audit [cakupan]`, `/ulasan [rentang]`.

## Aturan singkat
1. Agent **tidak menyentuh kode** — `../ujion-tka-apps` hanya-baca; tulisan hanya di `tugas/`, `marketing/`, `maintenance/`.
2. **Tidak ada tindakan keluar** (kirim WA, posting, ubah iklan) tanpa status "Disetujui" dan eksekusi manual pemilik.
3. **Tidak ada rahasia/data pribadi** di berkas agent; pakai placeholder dan data agregat.
4. Angka/testimoni/fitur tidak boleh dikarang; tandai `[perlu verifikasi]`.
5. Hanya Joko yang mengedit `marketing/basis/` dan `tugas/`.

Detail lengkap: [`CLAUDE.md`](CLAUDE.md) dan [`docs/KEAMANAN-RISIKO.md`](docs/KEAMANAN-RISIKO.md).
