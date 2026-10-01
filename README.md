# ujion-ops — Tim Agent Ujion TKA

> **PRIVATE.** Isinya strategi kampanye, laporan audit, dan kebutuhan internal. Jangan disalin ke repo aplikasi `ujion-tka-apps` (publik). Jangan simpan rahasia (`.env`, kunci Doku) atau nomor WA/nama siswa di sini.

Tim agent **Claude Code** untuk digital marketing dan pemeliharaan website **Ujion TKA** (Laravel 12, repo aplikasi `ujion-tka-apps`). Pemilik hanya bicara ke satu manajer, **Joko**; Joko menyusun to-do, mendelegasikan ke 7 agent spesialis, menagih kebutuhan mereka, dan melapor. Semua keluaran berupa draf di repo ini — tindakan ke publik (posting, blast, iklan) baru boleh dilakukan setelah status **Disetujui** di antrian.

**Tim:** Joko (manajer) · Budi (konten) · Sari (SEO & analitik) · Agus (sosmed & WA) · Rina (pemeliharaan, read-only) · 3 freelancer (riset, brief, QC).

Dokumen: [`PRD.md`](PRD.md) produk · [`PASANG.md`](PASANG.md) pemasangan · [`CLAUDE.md`](CLAUDE.md) aturan tim · [`docs/`](docs/) arsitektur, spesifikasi agent, protokol, rencana tahap, keamanan, pengujian.

## Struktur
| Path | Isi |
|---|---|
| `.claude/agents/` | 8 definisi agent + `settings.json` (Joko sebagai sesi utama) |
| `tugas/` | BOARD, KEBUTUHAN, KEPUTUSAN, ANTRIAN-PERSETUJUAN, INBOX |
| `marketing/` | `basis/` (kompetitor, tren, audiens, ide) + output: `konten/`, `analitik/`, `kampanye/`, `riset/`, `brief/` |
| `maintenance/` | laporan audit keamanan, log, draf konten admin |
| `dashboard/` | dashboard lokal: `server.mjs`, `index.html`, `uji.mjs`, `contoh/` |
| `docs/` | dokumentasi rujukan |

## Menjalankan
Prasyarat: **Node >= 18**, **Claude Code**, dan **bash** (Windows: jalankan di WSL). Letakkan `ujion-ops` sejajar dengan `ujion-tka-apps`.

```bash
./mulai.sh                              # Claude Code + Joko (izin baca ../ujion-tka-apps)
./dashboard.sh                           # dashboard -> http://127.0.0.1:8790
node dashboard/server.mjs dashboard/contoh   # lihat dashboard dengan data contoh
node dashboard/uji.mjs                   # uji otomatis (21 pemeriksaan, harus 21/21)
```
Bila `Permission denied`: `bash mulai.sh`.

Di dalam Claude Code: ketik `/agents` (harus muncul 8 agent), lalu bicara ke Joko, misalnya:
- "Buat kampanye 2 minggu pendaftaran guru SMP lewat Instagram dan WA."
- "Audit keamanan modul pembayaran Doku."
- "Catat link ini: ..." (kiriman bebas — Joko yang memilah)

## Aturan singkat
1. Agent **tidak menyentuh kode** — `../ujion-tka-apps` hanya-baca; tulisan hanya di `tugas/`, `marketing/`, `maintenance/`.
2. **Tidak ada tindakan keluar** (kirim WA, posting, ubah iklan) tanpa status "Disetujui" dan eksekusi manual pemilik.
3. **Tidak ada rahasia/data pribadi** di berkas agent; pakai placeholder dan data agregat.
4. Angka/testimoni/fitur tidak boleh dikarang; tandai `[perlu verifikasi]`.
5. Hanya Joko yang mengedit `marketing/basis/` dan `tugas/`.

Detail lengkap: [`CLAUDE.md`](CLAUDE.md) dan [`docs/KEAMANAN-RISIKO.md`](docs/KEAMANAN-RISIKO.md).
