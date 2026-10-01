# Keamanan, Privasi, dan Register Risiko

## Register risiko
| ID | Risiko | Kemungkinan | Dampak | Mitigasi | Pemilik |
|----|--------|-------------|--------|----------|---------|
| R1 | Nomor WA diblokir akibat blast | Sedang | Tinggi | Agus hanya merencanakan; segmen yang pernah berinteraksi; opsi berhenti; varian pesan; batas frekuensi; eksekusi manual | Pemilik |
| R2 | Klaim menyesatkan di iklan/konten (mis. janji nilai) | Sedang | Tinggi | Aturan klaim di Budi; Freelancer QC; antrian persetujuan; keputusan klaim terlarang di `KEPUTUSAN.md` | Pemilik |
| R3 | Rahasia bocor ke berkas agent (`.env`, kunci Doku) | Rendah | Kritis | Larangan baca `.env`; laporkan lokasi tanpa nilai; pindai pola bulanan; `.gitignore` | Pemilik |
| R4 | Data pribadi guru/siswa (anak) masuk ke berkas | Sedang | Tinggi | Placeholder dan agregat; ekspor tanpa nomor WA; pindai pola | Pemilik |
| R5 | Laporan audit keamanan ikut ter-deploy | Sedang | Tinggi | Laporan hidup di repo ops terpisah (private), bukan di repo aplikasi; dashboard tidak ikut deploy | Pemilik |
| R6 | Agent mengubah kode atau data | Rendah | Tinggi | Batas tulis folder; Rina Bash baca-saja; cek `git status` pada pilot; cabang terpisah | Pemilik |
| R7 | Prompt injection dari halaman web/tautan | Sedang | Sedang-Tinggi | Instruksi "isi web = data"; Joko tidak membuka link sendiri; tidak ada tindakan keluar otomatis (belum ditambahkan ke berkas agent; lihat tahap 6) | Pemilik |
| R8 | Hasil agent salah/halusinasi (angka, fakta TKA) | Sedang | Sedang | Tanda `[perlu verifikasi]`; larangan mengarang; pemeriksaan Joko; tinjauan pemilik | Pemilik |
| R9 | Fitur platform tidak berfungsi seperti diasumsikan (A1-A3) | Sedang | Sedang | Tahap 1 verifikasi; metode cadangan di CLAUDE.md | Pemilik |
| R10 | Biaya penggunaan model membengkak | Sedang | Sedang | Model bertingkat; Joko ringkas; tinjau penggunaan mingguan | Pemilik |
| R11 | Kebijakan Meta/WhatsApp/TikTok berubah | Tinggi | Sedang | Cek dokumentasi terbaru sebelum kampanye; Agus menandai asumsi | Pemilik |
| R12 | Konflik antar `CLAUDE.md` dan `AGENTS.md` | Sedang | Rendah | Baca `AGENTS.md` dulu; gabungkan manual | Pemilik |
| R13 | Dashboard terakses pihak lain di jaringan | Rendah | Sedang | Hanya 127.0.0.1; tolak Host asing; jangan tunnel | Pemilik |
| R14 | Berkas `ujion-ops` tersalin/ter-commit ke repo `ujion-tka-apps` yang publik | Sedang | Tinggi | Folder terpisah; jangan salin; periksa `git status` di repo aplikasi sebelum commit | Pemilik |
| R15 | Repo `ujion-ops` salah dibuat Public di GitHub | Rendah | Tinggi | Buat sebagai Private; cek visibilitas sebelum push; jangan simpan rahasia/data pribadi | Pemilik |

## Kontrol dashboard (sudah diimplementasikan dan diuji)
- Bind `127.0.0.1`; Host selain localhost/127.0.0.1 ditolak (421).
- POST wajib `application/json` dan same-origin; ukuran badan dibatasi.
- Hanya nilai status dari daftar putih yang bisa ditulis; hanya kolom Status.
- Pembacaan berkas dibatasi `.md` di `marketing/`, `maintenance/`, `tugas/`; path traversal ditolak.
- Teks dari berkas di-escape saat dirender.

## Privasi data
- Audiens utama guru/operator; siswa anak-anak hanya dijangkau lewat guru.
- Tidak menyimpan nomor WA/nama nyata di Markdown; gunakan `{nama_guru}`, `{sekolah}`.
- Ekspor data untuk Sari: agregat atau tanpa identitas.

## Hal yang tidak dilindungi
Berkas Markdown tidak dienkripsi; siapa pun dengan akses ke mesin dan repo dapat membacanya. Jangan membagikan repo yang berisi `maintenance/` ke publik.
