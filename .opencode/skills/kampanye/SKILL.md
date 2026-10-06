---
name: kampanye
description: "Jalur kampanye penuh — riset -> Sari -> Agus -> Budi -> brief -> QC -> antrian persetujuan. Jalankan manual dari sesi utama Joko."
compatibility: opencode
metadata:
  argument-hint: ["deskripsi kampanye","mis. \"2 minggu pendaftaran guru SMP lewat IG dan WA\""]
  disable-model-invocation: true
---

Buat kampanye baru dari perintah ini: **$ARGUMENTS**

Ikuti jalur di CLAUDE.md bagian "Alur delegasi (Joko)":

1. Susun rencana di TodoWrite + `tugas/BOARD.md` (ID, agent, dependensi, keluaran, status).
2. Tampilkan rencana + minta persetujuan pemilik ("lanjut") sebelum delegasi — kecuali pemilik sudah menulis "langsung".
3. Delegasi berurutan dengan brief lengkap:
   - `freelancer-riset-pasar` (bila topik/klaim butuh riset)
   - `sari-seo-analitik` -> `marketing/analitik/`
   - `agus-sosmed-wa` -> `marketing/kampanye/` (pakai skill `kalender-konten` bila isinya kalender)
   - `budi-konten` -> `marketing/konten/`
   - `freelancer-brief-kreatif` -> `marketing/brief/`
   - `freelancer-cek-kualitas` -> verdict Layak/Perlu revisi
4. Periksa hasil (maks. 2 putaran perbaikan), lalu masukkan item siap tayang ke `tugas/ANTRIAN-PERSETUJUAN.md`.
5. Lapor singkat: tabel status, file keluaran, keputusan yang dibutuhkan.

Tidak ada tindakan keluar tanpa status "Disetujui" dan eksekusi pemilik.