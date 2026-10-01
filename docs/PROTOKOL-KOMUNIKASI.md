# Protokol Komunikasi

## 1. Template brief (Joko -> agent)
```
TUJUAN & KONTEKS : <satu paragraf>
INPUT            : <path file / data dari pemilik>
KELUARAN         : <apa> -> <path tujuan> (format)
BATASAN          : ikuti CLAUDE.md; baca marketing/basis/ dan tugas/KEPUTUSAN.md
KRITERIA SELESAI : <daftar singkat>
```

## 2. Format laporan (agent -> Joko)
Isi tugas, lalu tiga blok wajib:
```
KEBUTUHAN
- BUTUH: <apa> | ALASAN: <kenapa> | FORMAT: <jawaban termudah> | MENGHAMBAT: <bagian tugas>
SERAH-TERIMA
- UNTUK: <agent> | FILE: <path> | ISI: <satu kalimat>
TEMUAN BARU
- <jenis>: <ringkas> | SUMBER: <url/file>
```

## 3. Pemilahan kiriman bebas
| Kiriman | Dicatat di | Diteruskan ke |
|---|---|---|
| Akun/situs kompetitor | `marketing/basis/kompetitor.md` | Freelancer Riset, Sari |
| Tren/format viral | `marketing/basis/trend.md` | Budi, Agus |
| Ekspor iklan/insight/pendaftaran | `tugas/INBOX.md` (path) | Sari |
| Error/log/laporan masalah | `tugas/INBOX.md` | Rina |
| Pertanyaan/keluhan guru | `marketing/basis/audiens.md` | Budi, Rina |
| Ide mentah | `marketing/basis/ide.md` | tidak diteruskan sebelum disetujui |
| Keputusan/aturan baru | `tugas/KEPUTUSAN.md` | semua agent |
Bila ambigu, Joko bertanya satu pertanyaan pendek. Konfirmasi: "Saya catat sebagai X, kirim ke Y. Benar?"

## 4. Skema berkas bersama (jangan ubah nama kolom; dashboard bergantung padanya)
| Berkas | Kolom tabel |
|---|---|
| `tugas/BOARD.md` (bagian Aktif) | ID, Tugas, Agent, Bergantung pada, Keluaran, Status |
| `tugas/KEBUTUHAN.md` | ID, Dari agent, Yang dibutuhkan, Alasan, Format yang cocok, Menghambat tugas, Status |
| `tugas/ANTRIAN-PERSETUJUAN.md` | ID, Barang, File, Kanal/tujuan, Jadwal usulan, Status (...), Hasil setelah tayang |
| `tugas/KEPUTUSAN.md` | Tanggal, Keputusan, Alasan singkat |
| `tugas/INBOX.md` | Daftar poin di bagian "Belum dipilah" |
Bagian "Untuk pemilik (kode / tindakan manual)" di BOARD berupa daftar poin.

## 5. Nilai status yang diizinkan
- Tugas: Belum, Jalan, Menunggu persetujuan, Selesai, Terblokir
- Kebutuhan: Terbuka, Terjawab
- Persetujuan: Menunggu, Disetujui, Ditolak, Sudah dieksekusi

## 6. Alur persetujuan
Draf siap -> baris baru di `ANTRIAN-PERSETUJUAN` (Menunggu) -> pemilik menyetujui (dashboard atau chat) -> pemilik mengeksekusi sendiri -> status "Sudah dieksekusi" -> pemilik memberi hasil -> Joko meneruskan ke Sari.

## 7. Aturan penyelesaian konflik
Hasil agent yang bertentangan tidak dipilih diam-diam; Joko menyajikan perbedaannya sebagai keputusan pemilik, lalu mencatat hasilnya di `KEPUTUSAN.md`.

## 8. Konvensi path
Semua path `tugas/`, `marketing/`, `maintenance/` relatif terhadap root `ujion-ops`. Repo aplikasi dirujuk sebagai `../ujion-tka-apps` (hanya-baca).
