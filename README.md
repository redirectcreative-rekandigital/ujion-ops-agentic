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
| `dashboard/` | dashboard lokal: `server.mjs`, `index.html`, `uji.mjs`, `contoh/` |
| `docs/` | dokumentasi rujukan |

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
