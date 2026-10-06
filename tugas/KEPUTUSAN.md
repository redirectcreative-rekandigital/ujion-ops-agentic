# Catatan Keputusan
Keputusan pemilik yang berlaku untuk seluruh tim (nada bahasa, batas klaim, anggaran, jadwal blast, dll). Semua agent diminta mengikutinya.

| Tanggal | Keputusan | Alasan singkat |
|---------|-----------|----------------|
| 2026-10-01 | Blast WhatsApp maksimal 1x per segmen per minggu | Pengalaman pemilik; kurangi risiko nomor diblokir |
| 2026-10-01 | Data ekspor iklan/pendaftaran BELUM tersedia; Sari tidak boleh mengarang angka dan harus menandai data kosong | Jawaban pemilik (PRD §15) |
| 2026-10-01 | Klaim konten/iklan hanya dari fitur & harga nyata di website (SD Rp79.000, SMP Rp99.000); verifikasi dulu sebelum dipakai | Jawaban pemilik (PRD §15) |
| 2026-10-01 | Auto-post ditunda; semua tayang dilakukan manual setelah status "Disetujui" di antrian | Jawaban pemilik (PRD §15) |
| 2026-10-01 | Kantor Agent 3D dipasang bersama dashboard (bukan ditunda) | Jawaban pemilik (PRD §15) |
| 2026-10-06 | Dashboard v2 dibangun di dashboard-v2/ terpisah; dashboard lama (server.mjs+index.html) tetap utuh | Jawaban pemilik sebelum eksekusi 01-PROJECT-SETUP |
| 2026-10-06 | Pengecualian sekali: agent boleh menulis + run npm di dashboard-v2/ untuk 01-PROJECT-SETUP | Jawaban pemilik sebelum eksekusi |
| 2026-10-06 | Env target VPS langsung (.env.example VPS, next.config standalone, Dockerfile basis); .env.local hanya dummy lokal | Jawaban pemilik sebelum eksekusi |
| 2026-10-06 | create-next-app@latest memasang Next 16.3.8 (dokumen minta 15); dipakai dulu, keputusan tetap-16 vs downgrade-15 menunggu pemilik | Fakta instalasi 2026-10-06; perlu keputusan pemilik |
| 2026-10-06 | Dashboard v2 pakai Next 16.3.8 (tetap 16, tidak downgrade ke 15) | Keputusan pemilik 2026-10-06 |
| 2026-10-06 | Lanjut 02-DATABASE di dashboard-v2/ dengan pengecualian tulis+run yang sama seperti 01 | Perintah pemilik 2026-10-06 |
| 2026-10-06 | Deploy: systemd host TETAP untuk opencode serve; container Coolify hanya Next.js (via host-gateway) | Keputusan pemilik 2026-10-06 |
| 2026-10-07 | Migrasi 12: audit/kampanye/ulasan jadi opencode commands (bukan skills); 5 lainnya tetap skills | Rekomendasi Joko disetujui pemilik 2026-10-07 |
| 2026-10-07 | Rina bash=deny di opencode (hook deny-by-default); Write→edit allow. Batas path ../ujion-tka-apps butuh aturan path-scoped — verifikasi di VPS | Doc 12 literal + follow-up VPS |
| 2026-10-07 | KEBUTUHAN.md tidak di-sync (tak ada tabel DB) — butuh tabel needs bila ingin dikelola dashboard | Gap 10/12, perlu keputusan pemilik |
| 2026-10-07 | Rename .claude/ → backup HANYA manual oleh pemilik setelah verifikasi VPS (opencode debug config + agent list + dashboard hijau) | Prosedur 12-MIGRATION |
| 2026-10-07 | Rollback migrasi: hapus .opencode/ + opencode.json, .claude/ tetap utuh (DB rows dibiarkan, idempoten) | Prosedur 12-MIGRATION |
