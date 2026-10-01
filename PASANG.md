# Pemasangan

## Susunan folder
```
~/proyek/
  ujion-tka-apps/   <- aplikasi Laravel Anda (tidak diubah)
  ujion-ops/        <- paket ini (jadikan repo GitHub PRIVATE)
```

## Langkah
1. Ekstrak `ujion-ops.zip` ke `~/proyek/ujion-ops`.
2. `cd ujion-ops && git init`, buat repo **Private** di GitHub, lalu hubungkan. Cek visibilitas sebelum push.
3. Isi `marketing/brand-brief.md` dan `marketing/basis/kompetitor.md`.
4. Jalankan `./mulai.sh`. Di dalam Claude Code ketik `/agents` (harus ada 8 agent).
5. Di terminal lain: `./dashboard.sh`, buka http://127.0.0.1:8790. Untuk melihat data contoh: `node dashboard/server.mjs dashboard/contoh`.
6. Opsional, kantor 3D: pasang plugin Kantor Agent (`/plugin marketplace add humaedihume/kantor-agent`, `/plugin install kantor-agent@kantor-agent`, `/reload-plugins`), lalu `/kantor-agent:kantor-agent` dari folder `ujion-ops`.
7. Ikuti `docs/RENCANA-TAHAP.md` dan centang `docs/PENGUJIAN.md`.

## Catatan
- Windows: jalankan Claude Code dan Kantor Agent di WSL (butuh bash). Skrip `.sh` memerlukan bash.
- Bila `--agent` / `--add-dir` / aturan `permissions` tidak dikenali versi Claude Code Anda, jalankan `claude` biasa, sesuaikan `.claude/settings.json` dengan dokumentasi versi Anda, atau ketik: "Berperanlah sebagai joko-manager sesuai CLAUDE.md".
- Contoh perintah (semua ke Joko): "Buat kampanye 2 minggu pendaftaran guru SMP lewat Instagram dan WA." / "Audit keamanan modul pembayaran Doku." / "Analisis log terbaru dan error blast WA."
