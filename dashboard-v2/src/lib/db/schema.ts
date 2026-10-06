import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================================
// AGENTS
// ============================================================
export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  display_name: text("display_name").notNull(),
  description: text("description").notNull(),
  mode: text("mode", { enum: ["primary", "subagent", "all"] }).notNull().default("subagent"),
  model_id: integer("model_id").references(() => models.id),
  prompt: text("prompt").notNull().default(""),
  permissions: text("permissions").notNull().default("{}"),
  color: text("color").notNull().default("#4A90D9"),
  avatar_url: text("avatar_url"),
  avatar_3d: text("avatar_3d"),
  temperature: real("temperature").default(0.3),
  steps: integer("steps"),
  hidden: integer("hidden", { mode: "boolean" }).default(false),
  task_permissions: text("task_permissions").default("{}"),
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
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  content: text("content").notNull().default(""),
  license: text("license"),
  metadata: text("metadata").default("{}"),
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
  task_id: text("task_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").default(""),
  agent_id: integer("agent_id").references(() => agents.id),
  status: text("status", {
    enum: ["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"],
  }).notNull().default("Belum"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  dependencies: text("dependencies").default("[]"),
  output_path: text("output_path"),
  output_format: text("output_format"),
  kanal: text("kanal"),
  jadwal: text("jadwal"),
  hasil: text("hasil"),
  schedule_cron: text("schedule_cron"),
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
    enum: ["pending", "approved", "rejected"],
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
  provider: text("provider").notNull(),
  label: text("label").notNull(),
  key_encrypted: text("key_encrypted").notNull(),
  key_iv: text("key_iv").notNull(),
  key_masked: text("key_masked").notNull(),
  is_active: integer("is_active", { mode: "boolean" }).default(true),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// MODELS
// ============================================================
export const models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull(),
  model_id: text("model_id").notNull(),
  display_name: text("display_name").notNull(),
  context_window: integer("context_window"),
  cost_per_1k_input: real("cost_per_1k_input"),
  cost_per_1k_output: real("cost_per_1k_output"),
  is_default: integer("is_default", { mode: "boolean" }).default(false),
  capabilities: text("capabilities").default("[]"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// MCP SERVERS
// ============================================================
export const mcpServers = sqliteTable("mcp_servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  display_name: text("display_name").notNull(),
  type: text("type", { enum: ["local", "remote"] }).notNull(),
  command: text("command"),
  url: text("url"),
  headers: text("headers").default("{}"),
  environment: text("environment").default("{}"),
  oauth_config: text("oauth_config"),
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
  session_id: text("session_id"),
  agent_id: integer("agent_id").references(() => agents.id),
  level: text("level", { enum: ["info", "warn", "error", "debug", "tool"] }).notNull().default("info"),
  message: text("message").notNull(),
  extra: text("extra").default("{}"),
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================
// KANTOR CONFIG
// ============================================================
export const kantorConfig = sqliteTable("kantor_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
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
  source: text("source").default("manual"),
  status: text("status", { enum: ["Belum dipilah", "Dipilah", "Diteruskan"] }).default("Belum dipilah"),
  category: text("category"),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
