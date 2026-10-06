---
name: audit-keamanan
description: "Checklist audit keamanan website Ujion TKA (untuk Rina) — modul yang wajib diperiksa, prioritas temuan, dan format laporan file:baris. Pakai saat tugas audit keamanan penuh atau audit berkala modul tertentu."
compatibility: opencode
---

# Audit Keamanan Ujion TKA

Repo aplikasi `../ujion-tka-apps` HANYA-BACA. Keluaran: `maintenance/audit-TANGGAL.md` di repo ops. Baca `tugas/KEPUTUSAN.md` sebelum mulai.

## Checklist modul (periksa semuanya, tandai "tidak terbaca" bila tidak bisa)

1. **Rahasia & konfigurasi**
   - Kunci/Doku key/APP_KEY di riwayat git atau file ter-track: `git -C ../ujion-tka-apps ls-files` + grep pola (jangan salin nilainya).
   - `APP_DEBUG`, `APP_ENV` di `.env.example` dan dokumen deploy; `URL::forceScheme` aktif untuk produksi.
2. **Otorisasi route per role** (superadmin / guru / siswa): `routes/*.php` + middleware + Policies — route admin tidak boleh terjangkar dari sesi siswa, dst.
3. **Webhook Doku** (`/api/payments/doku/notification`): verifikasi signature, urutan proses status pembayaran, penanganan replay.
4. **Validasi upload**: bukti pembayaran, gambar soal, lampiran — ekstensi, ukuran, MIME, penyimpanan di luar public bila bisa.
5. **Rate limit & autentikasi**: login guru (WA+token), login siswa (token), percobaan ulang, pembekuan sesi.
6. **CSRF & XSS**: form kritikal (login, pembayaran), render soal/KaTeX, konten dari admin yang dirender ke siswa.
7. **Blast WhatsApp**: batas frekuensi, target segmen, log di `whatsapp_logs`, paparan nomor.
8. **Dependensi**: `composer audit --working-dir=../ujion-tka-apps` dan `npm audit --prefix=../ujion-tka-apps`.

## Format temuan (wajib per baris)

`ID | tingkat (kritis/tinggi/sedang/rendah) | lokasi file:baris | bukti singkat | dampak | saran perbaikan konseptual`

- Urutkan berdasarkan tingkat. Jangan tulis patch kode siap tempel kecuali diminta.
- Jangan mengarang temuan; yang tidak bisa diverifikasi ditandai `[perlu verifikasi]`.

## Akhiri laporan

Ringkasan 5 baris di awal; tabel temuan di badan; blok KEBUTUHAN / SERAH-TERIMA / TEMUAN BARU di akhir (format di CLAUDE.md).