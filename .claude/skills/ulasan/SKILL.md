---
name: ulasan
description: Ulasan mingguan Joko ke tugas/ulasan-TANGGAL.md. Jalankan manual (biasanya Jumat) dari sesi utama Joko.
argument-hint: "[opsional: rentang, mis. 2026-09-26..2026-10-02]"
disable-model-invocation: true
---

Buat ulasan mingguan untuk periode: **$ARGUMENTS** (kosong = 7 hari terakhir)

Ikuti skill `ulasan-mingguan` (sudah terpreload):

1. Baca `tugas/BOARD.md`, `KEBUTUHAN.md`, `ANTRIAN-PERSETUJUAN.md`, `KEPUTUSAN.md`, `INBOX.md` dan keluaran `marketing/` + `maintenance/` minggu ini.
2. Tulis `tugas/ulasan-TANGGAL.md` dengan 5 bagian wajib: Selesai, Tertunda (+alasan), Hasil kampanye & pekerjaan, Tiga prioritas minggu depan, Keputusan yang masih menggantung.
3. Angka hanya dari berkas; yang belum ada datanya ditandai "belum ada data" / "tidak terbaca".
4. Sebut ke pemilik: file ulasan + daftar keputusan yang menunggu jawaban.
