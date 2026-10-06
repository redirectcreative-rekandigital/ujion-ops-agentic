# 06 — Task CRUD & Approval Queue

## 1. Task Board (Kanban)

### Halaman Tasks

`src/app/(dashboard)/tasks/page.tsx`

Layout: toggle antara **Board view** (Kanban) dan **List view** (tabel).

### Kanban Board

5 kolom berdasarkan status:

```
┌─────────┬──────────┬───────────────┬──────────┬───────────┐
│ Belum   │ Jalan    │ Menunggu      │ Selesai  │ Terblokir │
│         │          │ persetujuan   │          │           │
├─────────┼──────────┼───────────────┼──────────┼───────────┤
│ [card]  │ [card]   │ [card]        │ [card]   │ [card]    │
│ [card]  │ [card]   │               │ [card]   │           │
│ [card]  │          │               │          │           │
└─────────┴──────────┴───────────────┴──────────┴───────────┘
```

Setiap task card menampilkan:
- Task ID (U-01)
- Title
- Agent avatar/name (assigned)
- Priority badge (low/medium/high/critical)
- Deadline (jika ada)
- Dependencies indicator (jika ada)

**Drag & drop** antar kolom untuk ubah status. Saat drop:
- `PATCH /api/tasks/[id]` dengan status baru
- Jika status → "Menunggu persetujuan": buat entry di `approvals` table

### List View

Tabel dengan kolom:

| ID | Title | Agent | Status | Priority | Deadline | Dependencies | Actions |

- Filter by status, agent, priority
- Search by title/ID
- Sort by created_at, priority, deadline
- Pagination

### Task Card Component

```typescript
// src/components/tasks/task-card.tsx
// Props: task object
// Display: ID, title, agent avatar+name, priority badge, deadline
// Draggable (untuk Kanban)
// Click → ke /tasks/[id] (detail page)
```

### Task Form (Create/Edit)

`src/components/tasks/task-form.tsx`

Fields:

| Field | Type | Keterangan |
|---|---|---|
| task_id | Auto-generate | U-XX, sequential berdasarkan max ID |
| title | Input text | Judul tugas |
| description | Textarea | Detail tugas |
| agent_id | Select | Pilih agent (dari DB) |
| status | Select | Belum / Jalan / Menunggu persetujuan / Selesai / Terblokir |
| priority | Select | low / medium / high / critical |
| dependencies | Multi-select | Task IDs yang harus selesai dulu |
| output_path | Input text | Path file keluaran (misal: marketing/konten/caption-ig.md) |
| output_format | Input text | Format yang diminta |
| kanal | Input text | IG, TikTok, Facebook, WA |
| jadwal | Date picker | Deadline |
| hasil | Textarea | Result summary (diisi setelah selesai) |

### Task Detail Page

`src/app/(dashboard)/tasks/[id]/page.tsx`

Menampilkan:
- Task info lengkap (semua fields)
- Assigned agent info (avatar, model, status)
- Dependencies tree (jika ada)
- Approval history (jika pernah masuk approval queue)
- Output file preview (jika output_path ada, baca file content)
- Status timeline (kapan berubah status)

### API Routes

`src/app/api/tasks/route.ts`:
```typescript
// GET: list tasks (support filter: status, agent_id, priority, search)
// POST: create task
//   - auto-generate task_id (U-XX)
//   - simpan ke DB
//   - sync ke tugas/BOARD.md
```

`src/app/api/tasks/[id]/route.ts`:
```typescript
// GET: task detail (dengan agent info, dependencies, approvals)
// PUT: update task
//   - update DB
//   - jika status berubah → sync tugas/BOARD.md
//   - jika status → "Menunggu persetujuan" → create approval entry
// DELETE: hapus task
```

`src/app/api/tasks/[id]/status/route.ts`:
```typescript
// PATCH: update status only (untuk Kanban drag-drop)
//   - validasi status transition
//   - update DB
//   - sync BOARD.md
//   - create approval jika perlu
```

## 2. Approval Queue

### Halaman Approvals

`src/app/(dashboard)/approvals/page.tsx`

Tabel approval:

| Task ID | Title | Agent | Requested At | Status | Actions |

Filter:
- `pending` (default view)
- `approved`
- `rejected`
- `all`

### Approval Actions

Setiap pending approval punya 2 tombol:

**Approve:**
- `PUT /api/approvals/[id]` dengan `status: "approved"`
- Update task status → `Selesai` (atau `Jalan` jika masih ada kerja lanjutan)
- Sync ke BOARD.md
- Optional: trigger opencode run untuk eksekusi task

**Reject:**
- `PUT /api/approvals/[id]` dengan `status: "rejected"`, `reviewer_note: "..."`
- Update task status → `Terblokir`
- Sync ke BOARD.md

### Approval Detail

Klik approval → modal atau expand row:
- Task description
- Agent yang meminta
- Output file (jika ada, preview content)
- Reviewer note input
- Approve/Reject buttons

### API Routes

`src/app/api/approvals/route.ts`:
```typescript
// GET: list approvals (filter by status)
```

`src/app/api/approvals/[id]/route.ts`:
```typescript
// GET: approval detail (dengan task & agent info)
// PUT: approve/reject
//   body: { status: "approved" | "rejected", reviewer_note?: string }
//   - update approval di DB
//   - update task status di DB
//   - sync BOARD.md
```

## 3. Sync ke tugas/BOARD.md

Setiap perubahan task/approval trigger sync ke `tugas/BOARD.md`.

Format BOARD.md (dipertahankan dari format lama):

```markdown
# BOARD TUGAS

## Pemilik
- [ ] U-01: Buat kampanye IG 2 minggu — Agent: Agus — Status: Selesai

## Tim
| ID | Tugas | Agent | Dependensi | Keluaran | Kanal | Jadwal | Status | Hasil |
|---|---|---|---|---|---|---|---|---|
| U-01 | Buat kampanye IG | agus-sosmed-wa | - | marketing/kampanye/ig-2minggu.md | IG | 2024-10-15 | Selesai | Draft siap |
| U-02 | Caption 5 post | budi-konten | U-01 | marketing/konten/caption-ig.md | IG | 2024-10-20 | Jalan | - |
```

Sync function ada di `src/lib/opencode/markdown-sync.ts` (lihat `10-OPENCODE-SYNC.md`).

## 4. Status Workflow

```
Belum → Jalan → Menunggu persetujuan → Selesai
                ↓                        ↑
            Terblokir ←── rejected ──────┘
                ↓
            (revisi → Jalan lagi)
```

Validasi transition:
- `Belum` → `Jalan` ✓
- `Belum` → `Terblokir` ✓ (jika dependency gagal)
- `Jalan` → `Menunggu persetujuan` ✓
- `Jalan` → `Selesai` ✓ (auto-approve untuk task kecil)
- `Menunggu persetujuan` → `Selesai` (approved) ✓
- `Menunggu persetujuan` → `Terblokir` (rejected) ✓
- `Terblokir` → `Jalan` ✓ (revisi)
- `Selesai` → `Jalan` ✗ (tidak bisa, buat task baru)

## 5. Inbox (Kiriman Bebas)

`src/app/(dashboard)/inbox/page.tsx` (atau di dashboard utama):

- Form input: paste link, teks, ide → simpan ke `inbox` table
- List kiriman dengan status (Belum dipilah / Dipilah / Diteruskan)
- "Pilah" → set category → forward ke agent via task

API: `src/app/api/inbox/route.ts` (GET list, POST add)
