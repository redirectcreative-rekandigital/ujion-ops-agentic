# 08 — Penampil Log & Kustomisasi Kantor & Avatar 3D

## 1. Penampil Log (Log Viewer)

### Halaman Log

`src/app/(dashboard)/logs/page.tsx`

Tata letak: bilah filter di atas, tabel log di bawah, aliran aktivitas real-time di sidebar kanan.

### Bilah Filter

| Filter | Tipe | Pilihan |
|---|---|---|
| Agent | Dropdown | Semua / per agent |
| Level | Pilih banyak | info, peringatan, error, debug, alat |
| Rentang tanggal | Date picker | dari - sampai |
| Sesi | Dropdown | Semua / sesi tertentu |
| Cari | Input teks | Pencarian teks penuh pada pesan |

### Tabel Log

| Waktu | Level | Agent | Sesi | Pesan | Detail |

- Waktu: format (YYYY-MM-DD HH:mm:ss)
- Level: lencana berwarna (info=biru, peringatan=kuning, error=merah, debug=abu-abu, alat=hijau)
- Agent: nama + avatar kecil
- Sesi: tautan ke penampil sesi (klik → lihat riwayat pesan)
- Pesan: dipotong, klik untuk luaskan
- Detail: JSON, klik untuk luaskan

Contoh isi tabel log:

| Waktu | Level | Agent | Sesi | Pesan | Detail |
|---|---|---|---|---|---|
| 2026-10-06 22:45:12 | info | Joko | abc123 | Sesi dimulai: buat kampanye IG 2 minggu | — |
| 2026-10-06 22:45:15 | alat | Joko | abc123 | Delegasi tugas ke budi-konten | `{"agent":"budi-konten"}` |
| 2026-10-06 22:45:18 | info | Budi | def456 | Menulis caption Instagram | `{"file":"marketing/konten/caption-ig.md"}` |
| 2026-10-06 22:45:20 | info | Sari | ghi789 | Menganalisis kata kunci SEO | `{"keywords":12}` |
| 2026-10-06 22:46:03 | error | Joko | abc123 | MCP google-sheets waktu habis | `{"timeout":5000}` |

### Aliran Aktivitas Real-time

Sidebar kanan menampilkan log real-time via SSE (Server-Sent Events).

```
┌──────────────────────────────────────┐
│ AKTIVITAS REAL-TIME                  │
│                                      │
│ ● 22:45:12  Joko memulai sesi        │
│   abc123 — kampanye IG 2 minggu      │
│                                      │
│ ● 22:45:15  Joko mendelegasikan      │
│   tugas ke Budi                      │
│                                      │
│ ● 22:45:18  Budi sedang menulis      │
│   caption-ig.md                      │
│                                      │
│ ● 22:45:20  Sari menganalisis        │
│   12 kata kunci SEO                  │
│                                      │
│ ● 22:46:03  Error: MCP google-       │
│   sheets waktu habis (5 detik)       │
└──────────────────────────────────────┘
```

### Integrasi SSE

`src/lib/opencode/client.ts` — koneksi ke opencode serve untuk menerima event real-time:

```typescript
import { parseEventSource } from "eventsource-parser";

const OPENCODE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || "";

function authHeader(): string {
  return "Basic " + Buffer.from(`opencode:${OPENCODE_PASSWORD}`).toString("base64");
}

// Terima event real-time dari opencode serve (SSE stream)
// Setiap event berisi: type, sessionID, agent, level, message
// Event diteruskan ke callback onEvent untuk diproses
export async function getEvents(
  onEvent: (event: string, data: any) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${OPENCODE_URL}/event`, {
    headers: { Authorization: authHeader() },
    signal,
  });

  if (!res.body) throw new Error("Tidak ada body respons");

  const parser = parseEventSource((event) => {
    if (event.event === "message" || !event.event) {
      try {
        const data = JSON.parse(event.data);
        onEvent(data.type || "event", data);
      } catch {
        onEvent("raw", event.data);
      }
    }
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value, { stream: true }));
  }
}
```

### Hook SSE untuk Komponen React

`src/hooks/use-logs.ts` — hook untuk berlangganan event real-time dan menyimpannya ke database:

```typescript
"use client";
import { useEffect, useState, useRef } from "react";
import { getEvents } from "@/lib/opencode/client";

export function useLiveLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    abortRef.current = new AbortController();

    // Berlangganan event dari opencode serve
    // Setiap event:
    //   1. Disimpan ke database via API POST /api/logs
    //   2. Ditambahkan ke aliran aktivitas real-time di UI
    getEvents((type, data) => {
      setConnected(true);

      // Simpan log ke database
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: data.sessionID,
          agent_name: data.agent,
          level: data.level || "info",
          message: data.message || type,
          extra: JSON.stringify(data),
        }),
      });

      // Tambahkan ke aliran aktivitas (maks 100 entri terbaru)
      setLogs((prev) => [...prev.slice(-99), { type, data, timestamp: new Date() }]);
    }, abortRef.current.signal).catch(() => setConnected(false));

    return () => abortRef.current?.abort();
  }, []);

  return { logs, connected };
}
```

### Penampil Sesi (Session Viewer)

Modal atau halaman `/logs/[sessionId]`:

- Ambil riwayat pesan dari opencode: `GET /session/:id/message`
- Tampilkan gaya chat: pesan pengguna (kanan), pesan asisten (kiri)
- Panggilan alat (tool calls) ditampilkan sebagai blok yang bisa dilipat
- Blok kode dengan penyorotan sintaks

Contoh tampilan penampil sesi:

```
┌─ Sesi: abc123 — Joko — 2026-10-06 22:45 ──────────────┐
│                                                        │
│                    Anda: Buat kampanye IG 2 minggu   │
│                                                        │
│  Joko: Baik, saya akan menyusun rencana kampanye.    │
│  Pertama, saya butuh data audiens dari Sari.          │
│                                                        │
│  ┌─ PANGGILAN ALAT ─────────────────────────────┐    │
│  │ task({ agent: "sari-seo-analitik", ... })     │    │
│  │ Tujuan: Analisis audiens IG untuk TKA         │    │
│  │ Hasil: ✓ Berhasil (3.2 detik)                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  Joko: Sari telah memberikan data audiens.            │
│  Sekarang saya delegasikan pembuatan konten ke Budi.  │
│                                                        │
│                    Anda: Lanjutkan                    │
│                                                        │
│  Joko: Rencana kampanye siap. Menunggu persetujuan.   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### API Routes untuk Log

`src/app/api/logs/route.ts`:
```typescript
// GET: daftar log (dengan filter: agent, level, rentang tanggal, pencarian, pagination)
// POST: tambah entri log (dari subscriber SSE)
//   - body: { session_id, agent_name, level, message, extra }
//   - simpan ke tabel logs
//   - return { success: true }
```

`src/app/api/logs/[sessionId]/route.ts`:
```typescript
// GET: detail sesi dengan riwayat pesan
//   - proxy ke opencode: GET /session/:id/message
//   - format respons untuk penampil chat
//   - return: { session, messages }
```

## 2. Kantor Customization

### Halaman Kantor

`src/app/(dashboard)/kantor/page.tsx`

3 tab:
1. **Tim** — edit nama tim, ketua, anggota
2. **Avatar 3D** — pilih avatar 3D per agent
3. **Tema** — tema kantor, warna, layout

### Tab: Tim

Form:
- Title: "Ujion TKA" (nama kantor)
- Ketua: nama (default: Joko)
- Anggota tim: list editable (add/remove/rename)

Simpan ke `kantorConfig` table:
```json
{
  "title": "Ujion TKA",
  "names": {
    "ketua": "Joko",
    "team": ["Budi", "Sari", "Agus", "Rina"]
  },
  "autostart": false
}
```

### Tab: Avatar 3D

Per agent, pilih avatar 3D:

| Agent | Avatar 3D | Color |
|---|---|---|
| Joko | Businessman | #4A90D9 |
| Budi | Creative | #FF6B6B |
| Sari | Analyst | #4ECDC4 |
| Agus | Marketer | #FFE66D |
| Rina | Engineer | #95E1D3 |

Avatar 3D options (preset):
- Businessman, Businesswoman
- Creative (with headset)
- Analyst (with glasses)
- Developer (with laptop)
- Manager (with suit)
- Custom upload (.glb / .gltf)

Setiap avatar juga punya:
- Color (hex picker)
- Accessories (glasses, headset, hat, dll)
- Scale (0.5 - 2.0)

### Tab: Tema

- Kantor theme: default, modern, classic, minimalist
- Color palette: primary, secondary, accent
- Background: office, loft, studio
- Lighting: bright, warm, cool

### Generate kantor-agent.json

Sync ke `.claude/kantor-agent.json` (atau `.opencode/plugins/kantor-agent/config.json`):

```json
{
  "title": "Ujion TKA",
  "names": {
    "ketua": "Joko",
    "team": ["Budi", "Sari", "Agus", "Rina"]
  },
  "autostart": false,
  "agents": {
    "joko-manager": {
      "avatar": "businessman",
      "color": "#4A90D9",
      "accessories": ["glasses"],
      "scale": 1.0
    },
    "budi-konten": {
      "avatar": "creative",
      "color": "#FF6B6B",
      "accessories": ["headset"],
      "scale": 1.0
    }
  },
  "theme": {
    "palette": "modern",
    "background": "office",
    "lighting": "bright"
  }
}
```

**Catatan:** Format kantor-agent.json mungkin berbeda dari plugin aktual. Programmer AI perlu cek dokumentasi plugin `humaedihume/kantor-agent` di GitHub untuk format yang benar. Field `agents` dengan avatar 3D config adalah extension baru yang perlu di-support oleh plugin atau dashboard sendiri.

### API Routes

`src/app/api/kantor/route.ts`:
```typescript
// GET: kantor config (dari kantorConfig table)
// PUT: update kantor config
//   - update DB
//   - generate kantor-agent.json
```

## 3. Settings Page

`src/app/(dashboard)/settings/page.tsx`

Sections:
1. **PIN** — change PIN (input old PIN, new PIN, confirm)
2. **Theme** — dark/light toggle
3. **opencode** — server URL, password, connection status
4. **Backup** — export DB, import DB
5. **About** — version, tech stack

### PIN Change

```typescript
// POST /api/settings/pin
// body: { old_pin, new_pin }
//   - verify old_pin
//   - update settings table key="pin"
//   - return success
```

### Export/Import DB

```typescript
// GET /api/settings/export → download ujion.db
// POST /api/settings/import → upload & replace ujion.db (dengan konfirmasi)
```
