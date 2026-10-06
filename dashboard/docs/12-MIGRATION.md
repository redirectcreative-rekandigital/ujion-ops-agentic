# 12 — Migrasi .claude/ → .opencode/

## Overview

Migrasi dari format Claude Code (`.claude/`) ke format opencode v2 (`.opencode/` + `opencode.json`).

Perubahan:
- `.claude/agents/*.md` → `.opencode/agents/*.md` (format frontmatter berbeda)
- `.claude/skills/*/SKILL.md` → `.opencode/skills/*/SKILL.md` (format sama)
- `.claude/settings.json` → `opencode.json` (format berbeda)
- `.claude/hooks/*.mjs` → hooks opencode (format berbeda)
- `.claude/kantor-agent.json` → tetap di `.claude/` (untuk kantor-agent plugin compat)

## 1. Migrasi Agent Frontmatter

### Format Lama (Claude Code)

`.claude/agents/joko-manager.md`:
```yaml
---
name: joko-manager
description: Joko, ketua tim & manajer proyek Ujion TKA...
tools: Task(budi-konten, sari-seo-analitik, agus-sosmed-wa, rina-maintenance, freelancer-riset-pasar, freelancer-brief-kreatif, freelancer-cek-kualitas), TodoWrite, Read, Grep, Glob, Write, Edit
model: opus
skills: [ulasan-mingguan, pindai-rahasia]
initialPrompt: "Mulai sesi seperti biasa: baca tugas/BOARD.md..."
---
```

### Format Baru (opencode v2)

`.opencode/agents/joko-manager.md`:
```yaml
---
description: Joko, ketua tim & manajer proyek Ujion TKA...
mode: primary
model: openai/gpt-4o
permission:
  edit: allow
  read: allow
  glob: allow
  grep: allow
  todowrite: allow
  task:
    "*": deny
    "budi-konten": allow
    "sari-seo-analitik": allow
    "agus-sosmed-wa": allow
    "rina-maintenance": allow
    "freelancer-riset-pasar": allow
    "freelancer-brief-kreatif": allow
    "freelancer-cek-kualitas": allow
  skill: allow
  webfetch: allow
temperature: 0.3
steps: 50
color: "#4A90D9"
hidden: false
---
```

### Mapping Table

| Claude Code | opencode v2 | Keterangan |
|---|---|---|
| `name` | (dari filename) | Nama file = nama agent |
| `description` | `description` | Sama |
| `tools: Task(a, b, c)` | `permission.task: {"*": "deny", "a": "allow", ...}` | Lebih granular |
| `tools: TodoWrite` | `permission.todowrite: "allow"` | Direct mapping |
| `tools: Read` | `permission.read: "allow"` | Direct mapping |
| `tools: Grep` | `permission.grep: "allow"` | Direct mapping |
| `tools: Glob` | `permission.glob: "allow"` | Direct mapping |
| `tools: Write` | `permission.edit: "allow"` | Write → edit permission |
| `tools: Edit` | `permission.edit: "allow"` | Combined |
| `model: opus` | `model: openai/gpt-4o` | Provider prefix required |
| `skills: [...]` | (auto-discover) | opencode auto-discover dari `.opencode/skills/` |
| `initialPrompt` | (tidak ada equivalent) | Masukkan ke prompt body atau pakai command |
| — | `mode: primary/subagent` | Baru di opencode |
| — | `temperature` | Baru |
| — | `steps` | Baru |
| — | `color` | Baru |
| — | `hidden` | Baru |

## 2. Migration Script

### src/lib/db/migrate-from-claude.ts

```typescript
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { db } from "@/lib/db";
import { agents, skills } from "@/lib/db/schema";

const CLAUDE_DIR = path.join(process.env.WORKSPACE_PATH || "..", ".claude");
const OLD_AGENTS = path.join(CLAUDE_DIR, "agents");
const OLD_SKILLS = path.join(CLAUDE_DIR, "skills");

interface ClaudeAgentFrontmatter {
  name: string;
  description: string;
  tools?: string;
  model?: string;
  skills?: string[];
  initialPrompt?: string;
}

export async function migrateAgents(): Promise<void> {
  if (!fs.existsSync(OLD_AGENTS)) {
    console.log("No .claude/agents/ directory found, skipping agent migration");
    return;
  }

  const files = fs.readdirSync(OLD_AGENTS).filter(f => f.endsWith(".md"));
  console.log(`Found ${files.length} agents to migrate`);

  for (const file of files) {
    const content = fs.readFileSync(path.join(OLD_AGENTS, file), "utf8");
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;

    const frontmatter = yaml.load(match[1]) as ClaudeAgentFrontmatter;
    const promptBody = match[2].trim();
    const name = frontmatter.name || file.replace(".md", "");

    // Parse tools string
    const tools = frontmatter.tools || "";
    const permissions: Record<string, any> = {};

    // Map tools to permissions
    if (tools.includes("Read")) permissions.read = "allow";
    if (tools.includes("Grep")) permissions.grep = "allow";
    if (tools.includes("Glob")) permissions.glob = "allow";
    if (tools.includes("Write") || tools.includes("Edit")) permissions.edit = "allow";
    if (tools.includes("TodoWrite")) permissions.todowrite = "allow";
    if (tools.includes("webfetch") || tools.includes("WebFetch")) permissions.webfetch = "allow";

    // Parse Task(...) to task permissions
    const taskMatch = tools.match(/Task\(([^)]+)\)/);
    if (taskMatch) {
      const subagents = taskMatch[1].split(",").map(s => s.trim());
      const taskPerms: Record<string, string> = { "*": "deny" };
      for (const sub of subagents) {
        taskPerms[sub] = "allow";
      }
      permissions.task = taskPerms;
    }

    // Determine mode
    const isPrimary = name === "joko-manager";
    const mode = isPrimary ? "primary" : "subagent";

    // Map model
    const modelMap: Record<string, string> = {
      opus: "openai/gpt-4o",
      sonnet: "openai/gpt-4o-mini",
      haiku: "openai/gpt-4o-mini",
    };
    const model = frontmatter.model ? modelMap[frontmatter.model] || "openai/gpt-4o" : "openai/gpt-4o";

    // Insert into DB
    await db.insert(agents).values({
      name,
      display_name: name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      description: frontmatter.description,
      mode,
      prompt: promptBody,
      permissions: JSON.stringify(permissions),
      color: isPrimary ? "#4A90D9" : "#6B7280",
      temperature: 0.3,
      steps: 50,
      hidden: false,
      is_active: true,
    }).onConflictDoNothing();

    console.log(`Migrated agent: ${name}`);
  }
}

export async function migrateSkills(): Promise<void> {
  if (!fs.existsSync(OLD_SKILLS)) {
    console.log("No .claude/skills/ directory found, skipping skill migration");
    return;
  }

  const dirs = fs.readdirSync(OLD_SKILLS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Found ${dirs.length} skills to migrate`);

  for (const dir of dirs) {
    const skillFile = path.join(OLD_SKILLS, dir, "SKILL.md");
    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, "utf8");
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;

    const frontmatter = yaml.load(match[1]) as any;
    const body = match[2].trim();

    await db.insert(skills).values({
      name: frontmatter.name || dir,
      description: frontmatter.description || "",
      content: body,
      license: frontmatter.license,
      compatibility: frontmatter.compatibility || "opencode",
      metadata: JSON.stringify(frontmatter.metadata || {}),
      is_active: true,
    }).onConflictDoNothing();

    console.log(`Migrated skill: ${dir}`);
  }
}

export async function runMigration(): Promise<void> {
  console.log("Starting migration from .claude/ to DB...");
  await migrateAgents();
  await migrateSkills();
  console.log("Migration complete");
  console.log("Run sync to generate .opencode/ files: POST /api/sync");
}

// Run if executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}
```

## 3. Migration Steps (Manual)

Jika programmer AI menjalankan manual:

```bash
# 1. Backup .claude/
cp -r .claude/ .claude-backup/

# 2. Run migration script
npx tsx src/lib/db/migrate-from-claude.ts

# 3. Verify migration
sqlite3 data/ujion.db "SELECT name, mode, description FROM agents;"
sqlite3 data/ujion.db "SELECT name, description FROM skills;"

# 4. Generate .opencode/ files from DB
# Via API:
curl -X POST http://localhost:3000/api/sync

# 5. Verify .opencode/ generated
ls -la .opencode/agents/
ls -la .opencode/skills/
cat opencode.json

# 6. Test opencode baca config
opencode debug config
opencode agent list

# 7. Keep .claude/ sebagai backup (jangan hapus dulu)
# Setelah verifikasi semua berjalan, baru rename:
mv .claude/ .claude-old/
```

## 4. Agent Mapping Lengkap (8 Agents)

| Agent | Mode | Model Default | Task Permissions |
|---|---|---|---|
| joko-manager | primary | openai/gpt-4o | budi-konten, sari-seo-analitik, agus-sosmed-wa, rina-maintenance, freelancer-* |
| budi-konten | subagent | openai/gpt-4o-mini | (none) |
| sari-seo-analitik | subagent | openai/gpt-4o-mini | (none) |
| agus-sosmed-wa | subagent | openai/gpt-4o-mini | (none) |
| rina-maintenance | subagent | openai/gpt-4o-mini | (none), bash: deny (read-only) |
| freelancer-riset-pasar | subagent | openai/gpt-4o-mini | (none) |
| freelancer-brief-kreatif | subagent | openai/gpt-4o-mini | (none) |
| freelancer-cek-kualitas | subagent | openai/gpt-4o-mini | (none) |

## 5. Skill Mapping (8 Skills)

| Skill | Directory | Action |
|---|---|---|
| audit-keamanan | .claude/skills/audit-keamanan/ | Migrate to DB → .opencode/skills/audit-keamanan/ |
| audit | .claude/skills/audit/ | Migrate (slash command) |
| cek-kualitas | .claude/skills/cek-kualitas/ | Migrate to DB → .opencode/skills/cek-kualitas/ |
| kalender-konten | .claude/skills/kalender-konten/ | Migrate to DB |
| kampanye | .claude/skills/kampanye/ | Migrate (slash command) |
| pindai-rahasia | .claude/skills/pindai-rahasia/ | Migrate to DB |
| ulasan-mingguan | .claude/skills/ulasan-mingguan/ | Migrate to DB |
| ulasan | .claude/skills/ulasan/ | Migrate (slash command) |

**Catatan:** opencode mendukung slash commands via `.opencode/commands/` directory. Skill yang berfungsi sebagai slash command (audit, kampanye, ulasan) perlu di-migrate sebagai commands, bukan skills.

## 6. Settings Migration

### .claude/settings.json → opencode.json

| Claude Code settings.json | opencode.json |
|---|---|
| `agent: "joko-manager"` | `default_agent: "joko-manager"` |
| `permissions.additionalDirectories` | `permission.external_directory: "allow"` |
| `permissions.deny: ["Edit(../ujion-tka-apps/**)"]` | `permission.edit: { "../ujion-tka-apps/**": "deny" }` |
| `permissions.deny: ["Read(//**/.env)"]` | (handled by .gitignore + env var substitution) |

## 7. Hooks Migration

### .claude/hooks/rina-bash-guard.mjs

Hook ini mencegah Rina menjalankan bash commands. Di opencode, ini di-handle via permission:

```json
{
  "agent": {
    "rina-maintenance": {
      "permission": {
        "bash": "deny"
      }
    }
  }
}
```

Hook tidak perlu di-migrate — opencode permission system sudah handle ini.

## 8. Post-Migration Checklist

- [ ] 8 agents ter-import ke DB
- [ ] 8 skills ter-import ke DB
- [ ] `.opencode/agents/` berisi 8 file .md
- [ ] `.opencode/skills/` berisi 8 direktori dengan SKILL.md
- [ ] `opencode.json` ter-generate dengan benar
- [ ] `kantor-agent.json` ter-generate
- [ ] `tugas/BOARD.md` ter-sync dari DB
- [ ] opencode TUI bisa baca config: `opencode debug config`
- [ ] opencode TUI bisa list agent: `opencode agent list` atau `/agents`
- [ ] Dashboard bisa akses opencode serve: `GET /api/opencode/global/health`
- [ ] Dashboard bisa list agent via opencode: `GET /api/opencode/agent`
- [ ] `.claude/` di-rename ke `.claude-backup/` (jangan hapus)
- [ ] Git commit semua perubahan

## 9. Rollback Plan

Jika migrasi gagal:

```bash
# Restore .claude/
rm -rf .claude/
mv .claude-backup/ .claude/

# Hapus .opencode/
rm -rf .opencode/
rm opencode.json

# Kembali ke Claude Code
claude --agent joko-manager
```

DB tetap utuh — data tidak hilang. Cukup re-generate `.opencode/` setelah fix.
