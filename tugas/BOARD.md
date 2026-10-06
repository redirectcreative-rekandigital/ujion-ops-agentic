# BOARD TUGAS

## Pemilik
(kosong)

## Tim
| ID | Tugas | Agent | Dependensi | Keluaran | Kanal | Jadwal | Status | Hasil |
|---|---|---|---|---|---|---|---|---|
| U-01 | Dashboard v2 01-PROJECT-SETUP di dashboard-v2/ (Next.js + shadcn + env VPS-ready, build + /api/health lulus 2026-10-06) | joko-manager | - | dashboard-v2/ | - | - | Selesai | - |
| U-02 | Dashboard v2 02-DATABASE (13 tabel + seed 13 models/4 kantor/3 settings, build lulus 2026-10-06) | joko-manager | U-01 | dashboard-v2/src/lib/db/schema.ts | - | - | Selesai | - |
| U-03 | Dashboard v2 03-AUTH-PIN (JWT session + middleware + login/logout + rate limit, siklus login-200-logout-307 teruji 2026-10-06) + systemd opencode-serve permanen | joko-manager | U-02 | dashboard-v2/src/app/login + middleware | - | - | Selesai | - |
| U-04 | Dashboard v2 04-LAYOUT (12 menu sidebar + header/logout + footer + stats/tasks/agents, adaptasi Next16: proxy.ts + render-prop, build + cek konten lulus 2026-10-06) | joko-manager | U-03 | dashboard-v2/src/components/layout | - | - | Selesai | - |
| U-05 | Dashboard v2 05-AGENT-MODEL (CRUD agent + permission matrix + avatar2D/3D + model registry + AES vault, uji: 201/409/400 + no-leak, build lulus 2026-10-06) | joko-manager | U-04 | dashboard-v2/src/app/(dashboard)/agents | - | - | Selesai | - |
| U-06 | Dashboard v2 06-TASK-APPROVAL (kanban DnD + list/filter + approval queue + inbox pilah + validasi transisi, uji 9 langkah lulus 2026-10-06) | joko-manager | U-05 | dashboard-v2/src/app/(dashboard)/tasks | - | - | Selesai | - |
| U-07 | Dashboard v2 07-SKILL-MCP (editor split preview + validasi kebab-case + MCP preset/toggle/test + assignment per-agent, uji 7 langkah lulus 2026-10-06) | joko-manager | U-06 | dashboard-v2/src/app/(dashboard)/skills | - | - | Selesai | - |
| U-08 | Dashboard v2 08-LOGS-KANTOR (log filter + SSE hook + session viewer + kantor 3 tab + PIN/backup + Toaster + gitignore db, uji 7 langkah lulus 2026-10-06) | joko-manager | U-07 | dashboard-v2/src/app/(dashboard)/logs | - | - | Selesai | - |
| U-09 | Dashboard v2 09-PLAYGROUND (chat slash + scheduler cron in-process/manual + batch 3 mode in-memory, uji 7 langkah graceful-502 lulus 2026-10-06) | joko-manager | U-08 | dashboard-v2/src/app/(dashboard)/playground | - | - | Selesai | - |
| U-10 | Dashboard v2 10-OPENCODE-SYNC (client 20 fn + sync agents/skills/json/kantor/board/antrian/inbox + proxy + auto-trigger, uji temp-ws lulus 2026-10-06) | joko-manager | U-09 | dashboard-v2/src/lib/opencode | - | - | Selesai | - |
| U-11 | Dashboard v2 11-DOCKER-COOLIFY (Dockerfile Next-only + start.sh migrate/seed + compose host-gateway + coolify-env + README, build app + YAML valid 2026-10-06) | joko-manager | U-10 | docker-compose.yml | - | - | Selesai | - |
| U-12 | Dashboard v2 12-MIGRATION (8 agents + 8 skills/3 commands + kantor + 12 tasks terimpor, .opencode/ + opencode.json ter-generate, uji lama 25/25 lulus 2026-10-07) | joko-manager | U-11 | dashboard-v2/src/lib/db/migrate-from-claude.ts | - | - | Selesai | - |
