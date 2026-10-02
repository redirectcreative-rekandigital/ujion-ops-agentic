---
name: pindai-rahasia
description: Pindai berkas repo ops terhadap pola rahasia/data pribadi (nomor WA, APP_KEY, kunci Doku, token). Pakai sebagai tugas bulanan Rina atau bila Joko menutup siklus laporan. Hasil berupa daftar temuan, bukan koreksi otomatis.
---

# Pindai Rahasia di Berkas Agent

## Cakupan

Semua `.md` (kecuali berkas `.git/`) di: `marketing/`, `maintenance/`, `tugas/`, `.claude/agents/`, `.claude/skills/`, dan `docs/`.

## Pola yang dicari

| Pola | Contoh regex (grep -rniE) |
|---|---|
| Nomor WA Indonesia | `62[89][0-9]{7,11}` dan `(\+62|0)8[12][0-9]{7,10}` |
| APP_KEY | `base64:[A-Za-z0-9+/=]{20,}` |
| Kunci Doku / payment | `doku.*(key\|secret)[\"' :=]+[A-Za-z0-9]{16,}` |
| Token GitHub | `ghp_[A-Za-z0-9]{36}` |
| API key umum | `sk-[A-Za-z0-9]{20,}`, `AKIA[0-9A-Z]{16}` |
| Kredensial | `(password\|secret\|token)[\"' :=]+[^ sp\|<]{8,}` |

## Prosedur

1. **Langkah cepat:** jalankan skrip `node tools/pindai.mjs` dari root repo (exit 1 = ada temuan; nilai ditampilkan ter-mask). Fallback manual: grep pola di bawah ke seluruh cakupan (baca-saja; jangan edit otomatis).
2. Kecualikan: contoh di `dashboard/contoh/`, placeholder `{nama_guru}`, dan pola yang jelas bukan rahasia (nomor contoh di dokumentasi).
3. Untuk tiap kecocokan: catat **lokasi file:baris**, jenis pola, dan apakah nilai nyata atau placeholder — **jangan salin nilai penuh** ke laporan.
4. Simpan hasil di `maintenance/pindai-rahasia-TANGGAL.md`: tabel `file:baris | pola | penilaian (nyata/placeholder) | tindakan`.
5. Bila nilai nyata ditemukan: laporkan ke Joko sebagai KEBUTUHAN prioritas, minta pemilik menghapus/mengganti dan mempertimbangkan rotasi kunci.

Batasan yang berlaku: aturan CLAUDE.md (tidak menyalin rahasia, tidak mengubah repo aplikasi).
