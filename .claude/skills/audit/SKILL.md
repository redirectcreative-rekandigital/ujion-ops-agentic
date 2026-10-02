---
name: audit
description: Minta audit keamanan (atau audit log) ke Rina. Jalankan manual dari sesi utama Joko.
argument-hint: [cakupan, mis. "modul pembayaran Doku" atau "log terbaru 7 hari"]
disable-model-invocation: true
---

Minta audit ke Rina untuk topik: **$ARGUMENTS**

1. Pastikan repo aplikasi `../ujion-tka-apps` terbaca; bila tidak, lapor ke pemilik dan berhenti.
2. Delegasi ke `rina-maintenance` dengan brief:
   - Cakupan: $ARGUMENTS (audit keamanan penuh bila kosong)
   - Keluaran: `maintenance/audit-TANGGAL.md` (atau `log-TANGGAL.md`)
   - Wajib ikut skill `audit-keamanan` (checklist modul) dan format temuan `file:baris`
   - Batasan: read-only, `.env`/rahasia dilaporkan lokasi saja, hook Bash aktif
3. Periksa hasil: setiap temuan punya tingkat + lokasi; tidak ada nilai rahasia yang tersalin.
4. Masukkan temuan kritis ke `tugas/BOARD.md` sebagai item "Untuk pemilik (kode)" — pemilik yang memperbaiki kode.
5. Jadwalkan verifikasi ulang lewat audit berikutnya.

Lapor dengan ringkasan 5 baris + tabel temuan terurut prioritas.
