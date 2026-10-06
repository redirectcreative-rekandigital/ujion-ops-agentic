---
name: cek-kualitas
description: "Checklist proofread & pemeriksaan draf soal untuk Freelancer QC — daftar temuan lokasi->masalah->usulan plus verdict Layak/Perlu revisi. Pakai untuk semua pemeriksaan naskah atau draf soal."
compatibility: opencode
---

# Cek Kualitas (QC)

Berkas yang diperiksa diberikan lewat brief Joko. Baca `marketing/basis/` dan `tugas/KEPUTUSAN.md` bila relevan. Jangan menulis ulang total — hanya temuan + verdict.

## Checklist naskah/konten

- [ ] Ejaan & tata bahasa Indonesia benar
- [ ] Tanpa klaim dilarang: "pasti lulus", hasil dijamin, angka/testimoni karangan
- [ ] Tidak menyebut fitur yang tidak ada di `../ujion-tka-apps/README.md` (baca saja)
- [ ] Fakta TKA resmi punya sumber atau ditandai `[perlu verifikasi]`
- [ ] Tidak ada data pribadi nyata (nomor WA, nama siswa/guru) — hanya placeholder `{nama_guru}`, `{sekolah}`
- [ ] Sesuai kanal & `marketing/brand-brief.md` bila ada (nada, panjang, CTA)
- [ ] Blast WA: <= ~600 karakter, satu ajakan, ada opsi berhenti

## Checklist draf soal

- [ ] Kunci jawaban **tepat satu** dan benar
- [ ] Pilihan pengecoh masuk akal dan setara panjangnya
- [ ] Tingkat kesulitan sesuai jenjang (SD/SMP/SMA)
- [ ] Rumus/KaTeX valid; gambar tidak rusak/alt kosong
- [ ] Pembahasan konsisten dengan kunci
- [ ] Ditandai "perlu ditinjau guru/ahli mapel sebelum diunggah"

## Format keluaran

1. **Temuan:** `lokasi (paragraf/soal no.) -> masalah -> usulan perbaikan singkat`
2. **Verdict:** `Layak` atau `Perlu revisi` (alasan satu kalimat)
3. Simpan di `marketing/` atau `maintenance/` sesuai asal materi: `qc-TANGGAL-namafile.md`
4. Akhiri blok KEBUTUHAN / SERAH-TERIMA / TEMUAN BARU.