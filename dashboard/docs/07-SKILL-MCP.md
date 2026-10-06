# 07 — Skill Editor & MCP Manager

## 1. Skill Editor

### Halaman Skills

`src/app/(dashboard)/skills/page.tsx`

Grid card semua skill. Setiap card:
- Skill name (kebab-case)
- Description (1-2 baris)
- Compatibility badge
- Active/inactive toggle
- Edit / Delete buttons

### Skill Editor Page

`src/app/(dashboard)/skills/[id]/page.tsx` (edit mode)
`src/app/(dashboard)/skills/new/page.tsx` (create mode)

Layout: **split panel** — editor di kiri, live preview di kanan.

```
┌──────────────────────┬──────────────────────┐
│ EDITOR (markdown)    │ PREVIEW (rendered)   │
│                      │                      │
│ ---                  │ Skill: git-release   │
│ name: git-release    │                      │
│ description: ...     │ ## What I do         │
│ ---                  │ - Draft release...   │
│                      │                      │
│ ## What I do         │ ## When to use me    │
│ - Draft release...   │ Use this when...     │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

### Form Fields

| Field | Type | Keterangan |
|---|---|---|
| name | Input text | Kebab-case, 1-64 chars, match `^[a-z0-9]+(-[a-z0-9]+)*$` |
| description | Textarea | 1-1024 chars |
| content | Markdown editor | Body SKILL.md (tanpa frontmatter, frontmatter auto-generate) |
| license | Input text | Optional (MIT, Apache, dll) |
| compatibility | Input text | Optional (opencode, claude, dll) |
| metadata | JSON editor | Optional key-value pairs |

### Markdown Editor

Gunakan `<textarea>` dengan:
- Tab key untuk indent
- Line numbers
- Syntax highlighting (opsional: CodeMirror atau Monaco)
- Auto-save draft

### Live Preview

Render markdown dengan `react-markdown` + `remark-gfm`:
- Heading, bold, italic, code blocks
- Tables, lists, blockquotes
- Syntax highlighting via `rehype-highlight`

### Frontmatter Auto-Generate

Saat save, generate file `.opencode/skills/<name>/SKILL.md`:

```markdown
---
name: audit-keamanan
description: Checklist audit keamanan website Ujion TKA
license: MIT
compatibility: opencode
metadata:
  audience: rina-maintenance
  workflow: periodic
---

## What I do
(konten dari content field)
```

### Validation

- `name`: harus match `^[a-z0-9]+(-[a-z0-9]+)*$`, unique
- `description`: 1-1024 chars
- `name` harus sama dengan directory name (otomatis dari DB)
- Cek konflik dengan skill name yang sudah ada

### API Routes

`src/app/api/skills/route.ts`:
```typescript
// GET: list skills
// POST: create skill
//   - validasi name format & unique
//   - simpan ke DB
//   - generate .opencode/skills/<name>/SKILL.md
```

`src/app/api/skills/[id]/route.ts`:
```typescript
// GET: skill detail (content + frontmatter)
// PUT: update skill
//   - update DB
//   - regenerate SKILL.md
// DELETE: delete skill
//   - hapus dari DB
//   - hapus directory .opencode/skills/<name>/
```

### Skill-Agent Assignment

Di agent editor, ada section "Skills" yang menampilkan:
- List semua skill (checkbox)
- Skill yang aktif untuk agent ini (checked)
- Simpan ke `agent_skills` junction table

Saat generate agent `.md` file, skill tidak perlu di-list (opencode auto-discover). Tapi untuk UI, tampilkan skill mana yang relevan per agent.

## 2. MCP Manager

### Halaman MCP

`src/app/(dashboard)/mcp/page.tsx`

Tabel MCP servers:

| Name | Type | Command/URL | Status | Enabled | Actions |

Setiap row:
- Status badge: connected / disconnected / error
- Enable/disable toggle
- Edit / Delete buttons
- "Test Connection" button

### Add MCP Server Form

`src/components/mcp/mcp-form.tsx`

Dua mode: **Local** dan **Remote**.

#### Local MCP

| Field | Type | Keterangan |
|---|---|---|
| name | Input text | Nama unik (google-sheets, meta-ads) |
| display_name | Input text | "Google Sheets", "Meta Ads" |
| type | Hidden | "local" |
| command | Array input | ["npx", "-y", "@modelcontextprotocol/server-google-sheets"] |
| environment | Key-value editor | {"GOOGLE_CLIENT_ID": "...", "GOOGLE_CLIENT_SECRET": "..."} |
| timeout | Number | Default 5000ms |
| description | Textarea | Deskripsi MCP |

#### Remote MCP

| Field | Type | Keterangan |
|---|---|---|
| name | Input text | Nama unik |
| display_name | Input text | |
| type | Hidden | "remote" |
| url | Input text | https://mcp.example.com/mcp |
| headers | Key-value editor | {"Authorization": "Bearer xxx"} |
| oauth | JSON editor atau false | OAuth config |
| timeout | Number | Default 5000ms |

### MCP Presets

Tombol "Add from Preset" yang menampilkan list MCP server populer:

| Preset | Type | Command/URL |
|---|---|---|
| Google Sheets | local | `["npx", "-y", "@modelcontextprotocol/server-google-sheets"]` |
| Meta Ads | remote | `https://mcp.meta-ads.example.com/mcp` (placeholder, perlu MCP server aktual) |
| Sentry | remote | `https://mcp.sentry.dev/mcp` |
| Context7 | remote | `https://mcp.context7.com/mcp` |
| Grep (Vercel) | remote | `https://mcp.grep.app` |
| GitHub | local | `["npx", "-y", "@modelcontextprotocol/server-github"]` |
| Filesystem | local | `["npx", "-y", "@modelcontextprotocol/server-filesystem", "/path"]` |
| Brave Search | local | `["npx", "-y", "@modelcontextprotocol/server-brave-search"]` |
| PostgreSQL | local | `["npx", "-y", "@modelcontextprotocol/server-postgres"]` |
| SQLite | local | `["npx", "-y", "@modelcontextprotocol/server-sqlite"]` |

Klik preset → auto-fill form → user tinggal isi credentials.

### Test Connection

```typescript
async function testMcp(serverId: number) {
  // Panggil opencode serve API
  const res = await fetch(`${OPENCODE_URL}/mcp`, {
    headers: { Authorization: `Basic ${btoa("opencode:" + OPENCODE_PASSWORD)}` }
  });
  const status = await res.json();
  // Return status per server
}
```

### Per-Agent MCP Enable

Di agent editor, ada section "MCP Servers":
- List semua MCP server
- Checkbox per server
- Simpan ke `agent_mcp` junction table
- Saat generate `opencode.json`:
  - MCP server tetap di config global
  - Tapi tool di-disable global, enabled per agent:
  ```json
  {
    "tools": { "google-sheets_*": false },
    "agent": {
      "rina-maintenance": {
        "tools": { "google-sheets_*": true }
      }
    }
  }
  ```

### API Routes

`src/app/api/mcp/route.ts`:
```typescript
// GET: list MCP servers
// POST: add MCP server
//   - simpan ke DB
//   - sync ke opencode.json mcp section
```

`src/app/api/mcp/[id]/route.ts`:
```typescript
// GET: MCP detail
// PUT: update MCP (command, url, env, enabled)
//   - update DB
//   - sync opencode.json
// DELETE: delete MCP
//   - hapus dari DB
//   - sync opencode.json
```

`src/app/api/mcp/[id]/test/route.ts`:
```typescript
// POST: test connection
//   - query opencode /mcp endpoint
//   - return status
```

### Sync ke opencode.json

MCP config di-generate ke `opencode.json`:

```json
{
  "mcp": {
    "google-sheets": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-google-sheets"],
      "enabled": true,
      "environment": {
        "GOOGLE_CLIENT_ID": "{env:GOOGLE_CLIENT_ID}",
        "GOOGLE_CLIENT_SECRET": "{env:GOOGLE_CLIENT_SECRET}"
      }
    },
    "sentry": {
      "type": "remote",
      "url": "https://mcp.sentry.dev/mcp",
      "enabled": true,
      "oauth": {}
    }
  }
}
```

Environment variables untuk MCP credentials:
- Disimpan encrypted di `api_keys` table (atau `mcp_servers.environment` encrypted)
- Atau via `{env:VAR_NAME}` substitution dan env var di-set di container

### Keamanan MCP

- MCP credentials (API keys, OAuth secrets) disimpan encrypted di DB
- TIDAK di-include di `opencode.json` secara plaintext
- Gunakan `{env:VAR_NAME}` substitution di opencode.json
- Env vars di-set di container environment (dari DB decrypt → set env)
