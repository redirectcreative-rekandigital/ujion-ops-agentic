# 05 — Agent Editor & Model Registry & API Key Vault

## 1. Agent Editor

### Halaman Agent List

`src/app/(dashboard)/agents/page.tsx` — grid card semua agent.

Setiap card menampilkan:
- Avatar (image atau icon + color)
- Nama agent (display_name)
- Mode badge (primary/subagent)
- Model yang dipakai
- Status (active/inactive)
- Tombol Edit & Delete

### Halaman Create/Edit Agent

`src/app/(dashboard)/agents/new/page.tsx`
`src/app/(dashboard)/agents/[id]/edit/page.tsx`

Form fields:

| Field | Type | Keterangan |
|---|---|---|
| name | Input text | ID unik (huruf kecil, hyphen). Contoh: `joko-manager` |
| display_name | Input text | Nama tampilan. Contoh: `Joko` |
| description | Textarea | Deskripsi singkat |
| mode | Select | `primary` / `subagent` / `all` |
| model_id | Select | Pilih dari model registry |
| prompt | Textarea (markdown) | System prompt agent |
| permissions | Permission Editor | Matrix permission (lihat bawah) |
| color | Color picker | Hex color untuk UI |
| avatar_url | File upload / URL | Avatar image |
| avatar_3d | JSON editor | 3D avatar config untuk kantor-agent |
| temperature | Slider | 0.0 - 1.0 |
| steps | Number input | Max agent steps (kosong = unlimited) |
| hidden | Switch | Hide dari autocomplete |
| task_permissions | Multi-select | Subagent mana yang bisa dipanggil |

### Permission Editor

Matrix permission dengan toggle per tool:

```
┌─────────────────┬──────┬──────┬──────┐
│ Tool            │ Allow│ Ask  │ Deny │
├─────────────────┼──────┼──────┼──────┤
│ edit            │  ○   │  ●   │  ○   │
│ bash            │  ○   │  ○   │  ●   │
│ read            │  ●   │  ○   │  ○   │
│ glob            │  ●   │  ○   │  ○   │
│ grep            │  ●   │  ○   │  ○   │
│ todowrite       │  ●   │  ○   │  ○   │
│ task            │  ○   │  ○   │  ●   │  → expand untuk subagent list
│ skill           │  ●   │  ○   │  ○   │
│ webfetch        │  ●   │  ○   │  ○   │
│ websearch       │  ●   │  ○   │  ○   │
│ external_directory│ ○  │  ●   │  ○   │
└─────────────────┴──────┴──────┴──────┘
```

Saat `task` diset allow/ask, tampilkan subagent selector:
- List semua agent dengan `mode: subagent`
- Multi-select mana yang boleh dipanggil
- Generate `task_permissions` JSON: `{ "*": "deny", "budi-konten": "allow", "sari-*": "allow" }`

### API Routes

`src/app/api/agents/route.ts`:
```typescript
// GET: list semua agent (dengan model & skills joined)
// POST: create agent baru
//   - validasi name unik
//   - simpan ke DB
//   - trigger sync: generate .opencode/agents/<name>.md
```

`src/app/api/agents/[id]/route.ts`:
```typescript
// GET: detail agent (dengan permissions parsed, model info, skills)
// PUT: update agent
//   - update DB
//   - trigger sync
// DELETE: hapus agent
//   - hapus dari DB
//   - hapus file .opencode/agents/<name>.md
```

### Agent Card Component

```typescript
// src/components/agents/agent-card.tsx
// Tampilkan: avatar, nama, mode badge, model, status, edit/delete buttons
// Click card → ke halaman detail
```

### Agent Form Component

```typescript
// src/components/agents/agent-form.tsx
// Form dengan semua fields di atas
// Validasi: name unik, name format (lowercase-hyphen), description required
// Submit → POST /api/agents atau PUT /api/agents/[id]
```

## 2. Model Registry

### Halaman Models

`src/app/(dashboard)/models/page.tsx`

Tabel model dengan kolom:

| Provider | Model ID | Display Name | Context Window | Cost/1K In | Cost/1K Out | Default | Capabilities |

Fitur:
- Add model (form: provider, model_id, display_name, context_window, costs, capabilities)
- Edit model
- Set default model (radio button, satu default per provider)
- Delete model
- Filter by provider

### Seed Models (sudah ada di 02-DATABASE.md)

Provider yang didukung:
- `openai` — gpt-4o, gpt-4o-mini, o1, o3-mini
- `deepseek` — deepseek-chat, deepseek-reasoner
- `qwen` — qwen-max, qwen-plus
- `mistral` — mistral-large, mistral-small
- `groq` — llama-3.3-70b, llama-3.1-8b
- `together` — meta-llama/Llama-3.3-70B-Instruct-Turbo

### API Routes

`src/app/api/models/route.ts`:
```typescript
// GET: list semua model
// POST: add model baru
```

`src/app/api/models/[id]/route.ts`:
```typescript
// PUT: update model (termasuk set is_default)
// DELETE: hapus model
```

## 3. API Key Vault

### Encryption

`src/lib/crypto.ts`:

```typescript
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const MASTER_KEY = process.env.MASTER_KEY || "";

if (!MASTER_KEY || MASTER_KEY.length < 64) {
  throw new Error("MASTER_KEY must be set (64+ hex chars). Generate: openssl rand -hex 32");
}

const key = Buffer.from(MASTER_KEY, "hex");

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted + authTag.toString("hex"),
    iv: iv.toString("hex"),
  };
}

export function decrypt(encrypted: string, iv: string): string {
  const ivBuf = Buffer.from(iv, "hex");
  const data = Buffer.from(encrypted, "hex");
  const authTag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}
```

### Halaman API Keys

`src/app/(dashboard)/keys/page.tsx`

Tabel API key:

| Provider | Label | Key (masked) | Status | Created | Actions |

- Key ditampilkan sebagai `sk-...xxxx` (masked, tidak pernah full)
- Add key form:
  - Provider (select: openai, deepseek, qwen, mistral, groq, together)
  - Label (text: "OpenAI Production", "DeepSeek Test")
  - API Key (password input)
- Delete key (dengan konfirmasi)
- **Tidak ada edit key** — kalau salah, delete & add baru

### API Routes

`src/app/api/keys/route.ts`:
```typescript
// GET: list keys (masked, tidak return full key)
// POST: add key
//   - encrypt key dengan AES-256-GCM
//   - simpan key_encrypted + key_iv + key_masked ke DB
//   - set env var untuk opencode (atau generate opencode.json dengan {env:VAR})
```

`src/app/api/keys/[id]/route.ts`:
```typescript
// DELETE: hapus key
//   - hapus dari DB
//   - hapus env var jika perlu
```

### Sinkronisasi ke opencode

API keys disimpan encrypted di DB. Saat generate `opencode.json`, keys di-decrypt dan di-inject sebagai `{env:VAR_NAME}` substitution. Atau:

**Opsi A (recommended):** Set env vars saat container start
- Dashboard baca semua active keys dari DB
- Decrypt setiap key
- Set sebagai environment variable: `OPENAI_API_KEY=sk-...`, `DEEPSEEK_API_KEY=...`
- opencode.json menggunakan `{env:OPENAI_API_KEY}`

**Opsi B:** Generate file secrets
- Decrypt keys → write ke `/data/secrets/openai-key`, `/data/secrets/deepseek-key`
- opencode.json menggunakan `{file:/data/secrets/openai-key}`

### Keamanan

- Key TIDAK PERNAH dikembalikan full ke frontend (hanya masked)
- Key TIDAK PERNAH di-log
- Master key di `.env.local` (gitignored)
- Di production (Coolify), master key di set sebagai Docker env var
- Key di DB encrypted dengan AES-256-GCM (authenticated encryption)

## 4. Avatar Picker

### 2D Avatar (untuk dashboard UI)

`src/components/agents/avatar-picker.tsx`:

```typescript
// Pilihan avatar:
// 1. Preset icons (lucide-react): User, Bot, Brain, etc.
// 2. Upload image (file input → simpan ke public/avatars/)
// 3. URL eksternal
// 4. Generate dengan initials + color
```

### 3D Avatar (untuk kantor-agent plugin)

`avatar_3d` field di DB (JSON):

```json
{
  "model": "preset businessman",
  "color": "#4A90D9",
  "accessories": ["glasses"],
  "scale": 1.0
}
```

3D avatar config disinkronkan ke `kantor-agent.json` (lihat `08-LOGS-KANTOR.md`).

## 5. Model Select Component

`src/components/agents/model-select.tsx`:

```typescript
// Dropdown yang menampilkan model dari DB
// Group by provider
// Show: display_name, context_window, cost
// Search/filter
```
