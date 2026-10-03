---
name: ulasan-mingguan
description: Struktur ulasan mingguan Joko di tugas/ulasan-TANGGAL.md — selesai, tertunda, hasil kampanye, 3 prioritas, keputusan menggantung. Pakai setiap Jumat atau saat pemilik meminta ulasan.
---

# Ulasan Mingguan (Joko)

File: `tugas/ulasan-TANGGAL.md` (mis. `ulasan-2026-10-02.md`). Sumber: `tugas/BOARD.md`, `KEBUTUHAN.md`, `ANTRIAN-PERSETUJUAN.md`, `KEPUTUSAN.md`, `INBOX.md`, dan keluaran minggu ini di `marketing/` + `maintenance/`.

## Struktur wajib

```markdown
# Ulasan Mingguan — <tanggal>

## 1. Selesai
- <ID tugas>: <hasil satu baris> -> <path file>

## 2. Tertunda
- <ID>: <status> — <alasan: menunggu kebutuhan/menyetujui/blokir>

## 3. Hasil kampanye & pekerjaan minggu ini
- <file keluaran utama + satu baris kesimpulan; bila belum ada data tayang: "belum ada data"]

## 4. Tiga prioritas minggu depan
1. ...
2. ...
3. ...

## 5. Keputusan yang masih menggantung (dari KEBUTUHAN/ANTRIAN)
- <pertanyaan ke pemilik + format jawaban termudah>
```

## Aturan

- Maksimal 1 halaman; angka hanya dari berkas, jangan mengarang — yang belum terbaca ditandai "tidak terbaca".
- prioritas diurutkan dari yang paling menghambat (lihat blok KEBUTUHAN tertua).
- Setelah file ditulis, sebut ke pemilik sebagai bagian dari laporan penutup sesi.
