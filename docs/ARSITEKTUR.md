# Arsitektur

## Gambaran
```
                    Pemilik (Anda)
                         |  chat
                         v
        Sesi utama Claude Code = JOKO (joko-manager)
        |  Task()  |  TodoWrite  |  baca/tulis tugas/ & marketing/basis/
        +----+-----+-----+-----+-----+-----+
             |     |     |     |     |     |
           Budi  Sari  Agus  Rina  Freelancer x3
             \     |     |     /      /
              v    v     v    v      v
   marketing/{konten,analitik,kampanye,riset,brief}   maintenance/
                         |
          dibaca (read-only + ubah kolom Status)
                         v
              Dashboard lokal (ujion-dashboard)  <-- dibuka di browser
   (terpisah)   Kantor Agent 3D  <-- membaca transkrip ~/.claude/projects
```

## Prinsip
- **Joko = sesi utama.** Subagent Claude Code tidak dapat memanggil subagent lain, jadi orkestrasi hanya di sesi utama.
- **Berkas sebagai memori.** Konteks antar-sesi disimpan di Markdown di repo (mudah diaudit dan di-commit), bukan di ingatan model.
- **Subagent tanpa konteks percakapan.** Setiap brief harus lengkap; hasil kembali ke Joko.
- **Dashboard terpisah.** Tidak ikut deploy Laravel; tidak ada route baru di aplikasi.

## Struktur folder
```
~/proyek/
  ujion-tka-apps/            aplikasi Laravel (publik di GitHub) - HANYA-BACA bagi agent
  ujion-ops/                 repo PRIVATE - jalankan Claude Code dari sini
    .claude/agents/*.md      definisi 8 agent
    .claude/settings.json    agent utama, izin folder tambahan, aturan deny
    .claude/kantor-agent.json
    CLAUDE.md                aturan tim
    tugas/                   BOARD, KEBUTUHAN, KEPUTUSAN, ANTRIAN-PERSETUJUAN, INBOX
    marketing/basis/         kompetitor, trend, audiens, ide
    marketing/{konten,analitik,kampanye,riset,brief}/
    maintenance/             audit-*, log-*, konten-*
    docs/  dokumentasi (ARSITEKTUR, SPEC-AGENT, PROTOKOL, RENCANA-TAHAP, KEAMANAN-RISIKO, PENGUJIAN)
    PRD.md PASANG.md        dokumen utama & pemasangan
    dashboard/              server.mjs, index.html, uji.mjs, contoh/
    mulai.sh  dashboard.sh   pintasan
```
Alasan terpisah: repo aplikasi publik dan di-deploy; laporan audit dan strategi tidak boleh ikut. Batas "agent tidak mengubah kode" juga lebih kuat karena kode berada di folder lain.

## Dua tampilan, dua sumber data
| | Dashboard Ujion | Kantor Agent |
|---|---|---|
| Sumber | Markdown di `tugas/`, `marketing/`, `maintenance/` | Transkrip nyata `~/.claude/projects` |
| Menjawab | Apa yang direncanakan, ditunggu, disetujui | Siapa sedang bekerja sekarang |
| Interaksi | Ubah status, buka berkas | Hanya melihat |
| Port bawaan | 8790 | 8788 |

## Alur data
1. Pemilik mengirim sesuatu ke Joko -> dicatat di `INBOX`/`basis`.
2. Joko menulis rencana ke `BOARD` -> mendelegasikan.
3. Agent menulis keluaran ke foldernya dan melapor dengan 3 blok.
4. Joko memperbarui `BOARD`, `KEBUTUHAN`, `ANTRIAN`, `basis`.
5. Dashboard membaca ulang tiap 3 detik; tombol mengubah kolom Status saja.

## Model yang dipakai (dapat diubah di frontmatter)
Joko `opus`; Budi, Sari, Agus, Rina `sonnet`; freelancer `haiku`.
