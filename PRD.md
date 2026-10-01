# PRD - Tim Agent Digital Marketing & Pemeliharaan Website Ujion TKA

| | |
|---|---|
| Versi | 0.1 (draf) |
| Tanggal | 1 Oktober 2026 |
| Pemilik | Pemilik produk Ujion TKA (satu orang) |
| Status | Agent dan dashboard sudah dirancang dan dibuat; belum dipasang dan diuji di Claude Code |
| Dokumen pendukung | `docs/ARSITEKTUR.md`, `docs/SPEC-AGENT.md`, `docs/PROTOKOL-KOMUNIKASI.md`, `docs/RENCANA-TAHAP.md`, `docs/KEAMANAN-RISIKO.md`, `docs/PENGUJIAN.md` |

## 1. Ringkasan
Membangun tim agent berbasis Claude Code yang bertindak sebagai asisten pribadi pemilik untuk **digital marketing** dan **pengelolaan serta pemeliharaan website** Ujion TKA. Pemilik hanya berbicara dengan satu manajer (**Joko**). Joko memecah arahan menjadi to-do list, mendelegasikan ke 7 agent spesialis, menagih kebutuhan mereka, dan melapor. Sebuah **dashboard lokal** menampilkan kantor, to-do, kebutuhan, dan antrian persetujuan. Pemrograman aplikasi tetap dikerjakan pemilik sendiri.

## 2. Latar belakang dan masalah
- Ujion TKA (Laravel 12, PHP 8.3, MySQL, Tailwind/Vite) melayani superadmin, guru/operator, dan siswa. Fitur utamanya: registrasi dan aktivasi guru berbayar, bank soal, paket soal TKA, ujian, latihan materi, live chat, blast WhatsApp, dan pembayaran Doku.
- Pemilik mengerjakan sendiri kode, marketing, dan pemeliharaan. Akibatnya konten tidak konsisten, audit keamanan dan pemantauan log jarang dilakukan, dan konteks mudah hilang antar-sesi.
- Pemilik membutuhkan cara bekerja yang terstruktur tanpa menambah orang, dengan kontrol penuh atas semua yang keluar ke publik.

## 3. Sasaran
| ID | Sasaran | Ukuran keberhasilan |
|----|---------|---------------------|
| G1 | Satu pintu komunikasi: pemilik cukup bicara ke Joko | Semua permintaan, kiriman bebas (link, tren, data), dan jawaban kebutuhan lewat Joko |
| G2 | Pekerjaan marketing dan pemeliharaan terdokumentasi sebagai draf dan laporan | Setiap tugas punya berkas keluaran di `marketing/` atau `maintenance/` |
| G3 | Kontrol manusia penuh atas tindakan keluar | Nol posting, blast, atau perubahan data tanpa status "Disetujui" |
| G4 | Pemilik selalu tahu status | Dashboard menampilkan to-do per agent, kebutuhan terbuka, dan antrian persetujuan |
| G5 | Konteks bertahan antar-sesi | Basis pengetahuan dan papan tugas terbaca ulang Joko di awal sesi |

## 4. Bukan sasaran (non-goals)
- Agent tidak menulis atau mengubah kode aplikasi.
- Agent tidak memposting, mengirim WhatsApp, atau mengubah iklan sendiri (auto-post ditunda; lihat tahap 7).
- Tidak ada dukungan Google Ads. Sari hanya menangani SEO organik dan analitik.
- Dashboard tidak dipublikasikan ke internet dan tidak dibuat sebagai bagian dari Laravel.
- Tidak mengoperasikan panel superadmin secara otomatis.

## 5. Pengguna
Satu pengguna: pemilik produk (pengembang, pengelola marketing, dan pemelihara sekaligus). Bahasa kerja: Indonesia. Perangkat: laptop lokal dengan Claude Code, Node >= 18, dan PHP/MySQL yang sudah ada.

## 6. Lingkup produk
| Komponen | Deskripsi | Lokasi |
|---|---|---|
| Joko (manajer) | Sesi utama; to-do, delegasi, penagihan kebutuhan, pemilahan kiriman, laporan | `.claude/agents/joko-manager.md` |
| Tim: Budi, Sari, Agus, Rina | Konten; SEO dan analitik; sosmed dan WA; pemeliharaan (read-only) | `.claude/agents/*.md` |
| Freelancer (3) | Riset pasar, brief kreatif, cek kualitas | `.claude/agents/freelancer-*.md` |
| Protokol komunikasi | Brief, laporan 3 blok, pemilahan kiriman, berkas bersama | `CLAUDE.md`, `docs/PROTOKOL-KOMUNIKASI.md` |
| Basis pengetahuan dan papan | Kompetitor, tren, audiens, ide; BOARD, KEBUTUHAN, KEPUTUSAN, ANTRIAN, INBOX | `marketing/basis/`, `tugas/` |
| Dashboard lokal | Kantor 2D, to-do, kebutuhan, persetujuan, inbox, berkas | `dashboard/` (di repo ops, bukan di Laravel) |
| Kantor Agent (pihak ketiga) | Visual 3D aktivitas nyata dari transkrip Claude Code | plugin `humaedihume/kantor-agent` |

**Lokasi.** Semua komponen berada di repo/folder terpisah **`ujion-ops`** (PRIVATE; repo aplikasi `ujion-tka-apps` berstatus publik). Repo aplikasi hanya dibaca lewat `../ujion-tka-apps`. Claude Code dijalankan dari `ujion-ops` (`./mulai.sh`).

## 7. Kebutuhan fungsional
### Joko
- FR-J1 Membuka sesi dengan ringkasan 5 baris dari BOARD, KEBUTUHAN, ANTRIAN, INBOX.
- FR-J2 Menyusun to-do (TodoWrite dan `tugas/BOARD.md`) dengan ID, agent, dependensi, keluaran, status.
- FR-J3 Meminta persetujuan rencana untuk pekerjaan besar sebelum mendelegasikan.
- FR-J4 Mendelegasikan lewat brief lengkap (agent bawahan tidak melihat percakapan); tugas independen paralel.
- FR-J5 Memeriksa hasil agent (maks. 2 putaran perbaikan) sebelum melapor.
- FR-J6 Menagih blok KEBUTUHAN agent dan menanyakannya ke pemilik dalam satu paket.
- FR-J7 Memilah kiriman bebas pemilik ke tempat dan agent yang tepat, dengan konfirmasi satu baris.
- FR-J8 Menyambung SERAH-TERIMA dan TEMUAN BARU antar-agent; mengangkat hasil bertentangan sebagai keputusan pemilik.
- FR-J9 Mengelola antrian persetujuan dan mengembalikan hasil tayang ke Sari.
- FR-J10 Membuat ulasan mingguan.

### Agent spesialis
- FR-B Budi menghasilkan draf konten dan naskah blast (beberapa varian, opsi berhenti, tanpa klaim berlebihan).
- FR-S Sari menghasilkan audit funnel, rekomendasi SEO (file -> elemen -> usulan), dan tafsir data kampanye tanpa mengarang angka.
- FR-A Agus menghasilkan kalender sosmed, struktur Meta Ads, dan rencana blast WA dengan checklist persetujuan.
- FR-R Rina menghasilkan laporan audit keamanan, analisis log (error, queue, WA), dan draf konten admin/support. Read-only terhadap kode.
- FR-F Freelancer menghasilkan riset bersumber, brief kreatif, dan laporan cek kualitas.
- FR-P Semua agent mengakhiri laporan dengan blok KEBUTUHAN, SERAH-TERIMA, TEMUAN BARU.

### Dashboard
- FR-D1 Menampilkan kantor 2D: agent "Jalan" di meja, selain itu di lounge, freelancer masuk lewat pintu saat aktif.
- FR-D2 Menampilkan kanban to-do, daftar kebutuhan, antrian persetujuan, inbox, berkas hasil.
- FR-D3 Mengubah kolom Status lewat tombol; tidak mengubah kolom lain.
- FR-D4 Menyaring per agent; menyegarkan tiap 3 detik.

## 8. Kebutuhan non-fungsional
- NFR-1 **Keamanan:** dashboard hanya mendengarkan 127.0.0.1, menolak Host asing, POST harus JSON dan same-origin, hanya berkas `.md` di tiga folder yang boleh dibaca.
- NFR-2 **Privasi:** tidak ada nomor WA atau nama siswa nyata di berkas agent; data agregat atau placeholder.
- NFR-3 **Ringan:** dashboard tanpa dependensi, memori puluhan MB; tidak menjalankan proses tambahan di produksi.
- NFR-4 **Dapat diaudit:** semua keluaran berupa berkas teks berversi di folder yang bisa di-commit.
- NFR-5 **Kejujuran data:** tidak ada angka, testimoni, atau fitur karangan; hal tak terverifikasi ditandai `[perlu verifikasi]` atau "tidak terbaca".
- NFR-6 **Biaya terkendali:** Joko memakai model besar, agent rutin memakai model sedang, freelancer model kecil.

## 9. Aturan mutlak (guardrails)
1. Kode aplikasi tidak disentuh agent; penulisan hanya di `tugas/`, `marketing/`, `maintenance/`.
2. `.env`, kunci Doku, `APP_KEY`, dan kredensial akun iklan tidak dibaca atau disalin.
3. Tidak ada tindakan keluar tanpa status "Disetujui" dan eksekusi oleh pemilik.
4. Hanya Joko yang menyunting `marketing/basis/` dan `tugas/`.
5. Subagent tidak memanggil subagent; hanya Joko yang mendelegasikan.
6. Repo aplikasi `ujion-tka-apps` hanya-baca bagi semua agent; repo `ujion-ops` wajib PRIVATE dan tidak ditaruh di dalam repo aplikasi.

## 10. Alur utama
1. **Kampanye:** pemilik -> Joko (rencana, persetujuan) -> riset -> Sari -> Agus -> Budi -> brief -> cek kualitas -> antrian persetujuan -> pemilik mengeksekusi -> hasil ke Sari.
2. **Pemeliharaan:** pemilik/Joko -> Rina (audit atau log) -> laporan temuan -> pemilik memperbaiki kode sendiri -> Rina memverifikasi ulang lewat audit berikutnya.
3. **Kiriman bebas:** pemilik mengirim link/tren/data -> Joko memilah dan mengonfirmasi -> mencatat ke basis -> meneruskan ke agent.

## 11. Metrik keberhasilan (setelah 4 minggu pemakaian)
- 100% tindakan keluar melewati antrian persetujuan.
- >= 80% tugas selesai tanpa pertanyaan ulang di luar blok KEBUTUHAN.
- Waktu pemilik menyusun satu kampanye 2 minggu berkurang (ukur sendiri: sebelum vs sesudah).
- Audit keamanan penuh dijalankan minimal sekali per bulan dan temuan kritis ditindaklanjuti.
- Nol kebocoran rahasia atau data pribadi ke berkas agent (dicek lewat pencarian pola di akhir tiap bulan).

## 12. Asumsi dan hal yang belum terverifikasi
| # | Asumsi | Status |
|---|--------|--------|
| A1 | `claude --agent joko-manager` / `"agent"` di `settings.json` menjadikan agent sebagai sesi utama | Belum diuji; bergantung versi Claude Code |
| A2 | `Task(nama, ...)` di daftar tools membatasi subagent yang boleh dipanggil | Belum diuji |
| A3 | Berkas agent di `.claude/agents/` terbaca dengan format frontmatter yang dipakai | Belum diuji (`/agents`) |
| A4 | Kantor Agent berjalan pada instalasi pemilik dan membaca transkrip proyek | Belum diuji |
| A5 | Instagram/TikTok/Facebook tidak bisa dibaca otomatis tanpa login | Asumsi; metrik akun ditandai "tidak terbaca" |
| A6 | `AGENTS.md` repo Ujion tidak bertentangan dengan `CLAUDE.md` baru | Tidak relevan lagi bila `ujion-ops` terpisah; tetap baca `AGENTS.md` untuk konteks |
| A7 | `claude --add-dir`, `permissions.additionalDirectories`, dan aturan `deny` pada path `../ujion-tka-apps` berfungsi | Belum diuji; sintaks bergantung versi |

## 13. Status saat ini
| Item | Status |
|---|---|
| 8 berkas agent (Joko, 4 tim, 3 freelancer) | Dibuat; instruksi anti prompt-injection ditambahkan (2026-10-01); belum diuji di Claude Code |
| CLAUDE.md, protokol, berkas papan dan basis | Dibuat; folder output agent (`marketing/{konten,analitik,kampanye,riset,brief}`) dibuat (2026-10-01) |
| Dashboard lokal | Dibuat; uji otomatis `node dashboard/uji.mjs` lulus 21/21 (2026-10-01); tampilan ponsel diperbaiki, cek layar 390 px belum |
| Brand brief, daftar kompetitor, audiens | Kompetitor (3) dan biaya/klaim terisi (2026-10-01); tagline, gaya bahasa, kontak, audiens menunggu pemilik |
| Kantor Agent | Belum dipasang; diputuskan dipasang bersama dashboard (2026-10-01) |
| Auto-post, integrasi data real-time Kantor Agent, halaman superadmin | Di luar rilis ini (tahap 7) |

## 14. Rencana tahapan (ringkas)
Detail, daftar centang, dan kriteria selesai ada di `docs/RENCANA-TAHAP.md`.
0. Persiapan -> 1. Pemasangan dan verifikasi platform -> 2. Kalibrasi brand dan basis -> 3. Pilot Rina -> 4. Pilot kampanye penuh (dry-run) -> 5. Dashboard terpasang -> 6. Operasi dan penguatan -> 7. Perluasan opsional.
**Tuntas** berarti kriteria selesai tahap 0-6 terpenuhi dan seluruh kasus uji prioritas tinggi di `docs/PENGUJIAN.md` lulus.

## 15. Pertanyaan terbuka (jawaban dicatat 1 Oktober 2026)
1. Kompetitor: `tka.onedumind.com`, `tka.edubrand.id`, `aimasukptn.com/tryout-tka` -> terisi di `marketing/basis/kompetitor.md` (harga/akun sosmed menunggu riset).
2. Biaya aktivasi: SD Rp79.000, SMP Rp99.000; klaim iklan/konten hanya dari fitur nyata di website (agent wajib verifikasi) -> `marketing/brand-brief.md`.
3. Data ekspor pendaftaran/iklan: **belum ada** -> Sari tidak mengarang angka (catat di `tugas/KEPUTUSAN.md`).
4. Frekuensi blast WA aman: **1x per segmen per minggu** (`tugas/KEPUTUSAN.md`).
5. Kantor Agent 3D: **pasang sekalian** dengan dashboard (lihat `PASANG.md` langkah 6).
6. Auto-post: **manual dulu**; semua tayang lewat antrian persetujuan.
7. Masih terbuka (diisi pemilik): tagline, gaya bahasa, warna/font, keunggulan, kontak, hashtag di `marketing/brand-brief.md`; isi `marketing/basis/audiens.md`.
