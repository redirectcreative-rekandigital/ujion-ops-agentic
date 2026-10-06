# 02 — Database Schema (SQLite + Drizzle ORM)

## Setup Drizzle

### drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_PATH || "./data/ujion.db",
  },
});
```

### src/lib/db/index.ts

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DB_PATH || "./data/ujion.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
```

## Schema Lengkap

### src/lib/db/schema.ts

```typescript
import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================================
// AGENTS
// ============================================================
export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),           // joko-manager, budi-konten, dll
  display_name: text("display_name").notNull(),      // Joko, Budi, dll
  description: text("description").notNull(),
  mode: text("mode", { enum: ["primary", "subagent", "all"] }).notNull().default("subagent"),
  model_id: integer("model_id").references(() => models.id),
  prompt: text("prompt").notNull().default(""),      // system prompt (markdown body)
  permissions: text("permissions").notNull().default("{}"), // JSON string
  color: text("color").notNull().default("#4A90D9"),
  avatar_url: text("avatar_url"),                    // path ke avatar image
  avatar_3d: text("avatar_3d"),                      // 3D model config (JSON)
  temperature: real("temperature").default(0.3),
  steps: integer("steps"),                           // max agent steps
  hidden: integer("hidden", { mode: "boolean" }).default(false),
  task_permissions: text("task_permissions").default("{}"), // JSON: which subagents can be invoked
  is_active: integer("is_active", { mode: "boolean" }).default(true),
  sort_order: integer("sort_order").default(0),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// SKILLS
// ============================================================
export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),             // audit-keamanan, kalender-konten
  description: text("description").notNull(),
  content: text("content").notNull().default(""),     // SKILL.md body (markdown)
  license: text("license"),
  metadata: text("metadata").default("{}"),           // JSON
  compatibility: text("compatibility").default("opencode"),
  is_active: integer("is_active", { mode: "boolean" }).default(true),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Agent-Skill mapping (many-to-many)
export const agentSkills = sqliteTable("agent_skills", {
  agent_id: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  skill_id: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
});

// ============================================================
// TASKS
// ============================================================
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task_id: text("task_id").notNull().unique(),        // U-01, U-02, dll
  title: text("title").notNull(),
  description: text("description").default(""),
  agent_id: integer("agent_id").references(() => agents.id),
  status: text("status", {
    enum: ["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"]
  }).notNull().default("Belum"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  dependencies: text("dependencies").default("[]"),  // JSON array of task_ids
  output_path: text("output_path"),                   // path file keluaran
  output_format: text("output_format"),
  kanal: text("kanal"),                               // IG, TikTok, WA, dll
  jadwal: text("jadwal"),                             // deadline/schedule
  hasil: text("hasil"),                               // result summary
  schedule_cron: text("schedule_cron"),               // untuk scheduled tasks
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// APPROVALS
// ============================================================
export const approvals = sqliteTable("approvals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task_id: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["pending", "approved", "rejected"]
  }).notNull().default("pending"),
  reviewer_note: text("reviewer_note"),
  decided_at: text("decided_at"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// API KEYS (Encrypted)
// ============================================================
export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull(),               // openai, deepseek, qwen, dll
  label: text("label").notNull(),                     // "OpenAI Production", "DeepSeek Test"
  key_encrypted: text("key_encrypted").notNull(),     // AES-256-GCM encrypted
  key_iv: text("key_iv").notNull(),                   // IV untuk decrypt
  key_masked: text("key_masked").notNull(),           // "sk-...xxxx" untuk display
  is_active: integer("is_active", { mode: "boolean" }).default(true),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// MODELS
// ============================================================
export const models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull(),               // openai, deepseek, zen, qwen, dll
  model_id: text("model_id").notNull(),               // gpt-4o, deepseek-chat, dll
  display_name: text("display_name").notNull(),        // "GPT-4o", "DeepSeek Chat"
  context_window: integer("context_window"),           // token limit
  cost_per_1k_input: real("cost_per_1k_input"),        // USD per 1K input tokens
  cost_per_1k_output: real("cost_per_1k_output"),      // USD per 1K output tokens
  is_default: integer("is_default", { mode: "boolean" }).default(false),
  capabilities: text("capabilities").default("[]"),   // JSON: ["vision", "tool_use", ...]
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// MCP SERVERS
// ============================================================
export const mcpServers = sqliteTable("mcp_servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),              // google-sheets, meta-ads, sentry
  display_name: text("display_name").notNull(),
  type: text("type", { enum: ["local", "remote"] }).notNull(),
  command: text("command"),                           // JSON array: ["npx", "-y", "..."]
  url: text("url"),                                   // untuk remote type
  headers: text("headers").default("{}"),             // JSON untuk remote
  environment: text("environment").default("{}"),     // JSON env vars
  oauth_config: text("oauth_config"),                 // JSON OAuth config
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  timeout: integer("timeout").default(5000),
  description: text("description"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Agent-MCP mapping (which agents can use which MCP)
export const agentMcp = sqliteTable("agent_mcp", {
  agent_id: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  mcp_server_id: integer("mcp_server_id").notNull().references(() => mcpServers.id, { onDelete: "cascade" }),
});

// ============================================================
// LOGS
// ============================================================
export const logs = sqliteTable("logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  session_id: text("session_id"),                     // opencode session ID
  agent_id: integer("agent_id").references(() => agents.id),
  level: text("level", { enum: ["info", "warn", "error", "debug", "tool" ] }).notNull().default("info"),
  message: text("message").notNull(),
  extra: text("extra").default("{}"),                 // JSON additional data
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// KANTOR CONFIG
// ============================================================
export const kantorConfig = sqliteTable("kantor_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),                // "title", "theme", "names", "settings"
  value: text("value").notNull(),                     // JSON value
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// SETTINGS (dashboard settings)
// ============================================================
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// INBOX (kiriman bebas pemilik)
// ============================================================
export const inbox = sqliteTable("inbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  source: text("source").default("manual"),           // manual, link, forwarded
  status: text("status", { enum: ["Belum dipilah", "Dipilah", "Diteruskan"] }).default("Belum dipilah"),
  category: text("category"),                         // setelah dipilah oleh Joko
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
```

## Migration & Seed

### Generate Migration

```bash
npx drizzle-kit generate
npx drizzle-kit push    # atau npx drizzle-kit migrate
```

### Seed Data

Buat `src/lib/db/seed.ts`:

```typescript
import { db } from "./index";
import { agents, skills, models, kantorConfig, settings } from "./schema";

async function seed() {
  // Default models
  const defaultModels = [
    { provider: "openai", model_id: "gpt-4o", display_name: "GPT-4o", context_window: 128000, is_default: true },
    { provider: "openai", model_id: "gpt-4o-mini", display_name: "GPT-4o Mini", context_window: 128000 },
    { provider: "openai", model_id: "o1", display_name: "o1", context_window: 200000 },
    { provider: "openai", model_id: "o3-mini", display_name: "o3-mini", context_window: 200000 },
    { provider: "deepseek", model_id: "deepseek-chat", display_name: "DeepSeek Chat", context_window: 64000 },
    { provider: "deepseek", model_id: "deepseek-reasoner", display_name: "DeepSeek Reasoner", context_window: 64000 },
    { provider: "qwen", model_id: "qwen-max", display_name: "Qwen Max", context_window: 32000 },
    { provider: "qwen", model_id: "qwen-plus", display_name: "Qwen Plus", context_window: 131072 },
    { provider: "mistral", model_id: "mistral-large", display_name: "Mistral Large", context_window: 128000 },
    { provider: "mistral", model_id: "mistral-small", display_name: "Mistral Small", context_window: 32000 },
    { provider: "groq", model_id: "llama-3.3-70b", display_name: "Llama 3.3 70B (Groq)", context_window: 128000 },
    { provider: "groq", model_id: "llama-3.1-8b", display_name: "Llama 3.1 8B (Groq)", context_window: 128000 },
    { provider: "together", model_id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", display_name: "Llama 3.3 70B (Together)", context_window: 128000 },
  ];

  for (const model of defaultModels) {
    await db.insert(models).values(model).onConflictDoNothing();
  }

  // Default kantor config
  const kantorDefaults = [
    { key: "title", value: JSON.stringify("Ujion TKA") },
    { key: "names", value: JSON.stringify({ ketua: "Joko", team: ["Budi", "Sari", "Agus", "Rina"] }) },
    { key: "autostart", value: JSON.stringify(false) },
    { key: "theme", value: JSON.stringify("default") },
  ];

  for (const config of kantorDefaults) {
    await db.insert(kantorConfig).values(config).onConflictDoNothing();
  }

  // Default settings
  await db.insert(settings).values([
    { key: "pin", value: process.env.DASHBOARD_PIN || "245100" },
    { key: "theme", value: "dark" },
    { key: "default_model", value: "1" },  // reference ke models.id
  ]).onConflictDoNothing();

  console.log("Seed complete");
}

seed().catch(console.error);
```

### Import Existing Data

Setelah seed, jalankan migrasi dari file yang ada (lihat `12-MIGRATION.md` untuk detail):
- Import 8 agents dari `.claude/agents/*.md`
- Import 8 skills dari `.claude/skills/*/SKILL.md`
- Import tasks dari `tugas/BOARD.md`

## Verifikasi Database

```bash
# Generate migration
npx drizzle-kit generate

# Push ke SQLite
npx drizzle-kit push

# Jalankan seed
npx tsx src/lib/db/seed.ts

# Verifikasi
sqlite3 data/ujion.db "SELECT count(*) FROM agents;"
sqlite3 data/ujion.db "SELECT count(*) FROM models;"
sqlite3 data/ujion.db "SELECT * FROM kantor_config;"
```
