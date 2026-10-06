# 10 — opencode Integration & Config Sync

## 1. opencode HTTP Client

### src/lib/opencode/client.ts

```typescript
const OPENCODE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || "";

function authHeader(): Record<string, string> {
  if (!OPENCODE_PASSWORD) return {};
  const credentials = Buffer.from(`opencode:${OPENCODE_PASSWORD}`).toString("base64");
  return { Authorization: `Basic ${credentials}` };
}

async function opencodeFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${OPENCODE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeader(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`opencode API error: ${res.status} ${res.statusText}`);
  }
  return res;
}

// === Health ===
export async function getHealth() {
  const res = await opencodeFetch("/global/health");
  return res.json();
}

// === Sessions ===
export async function listSessions() {
  const res = await opencodeFetch("/session");
  return res.json();
}

export async function createSession(data: { parentID?: string; title?: string }) {
  const res = await opencodeFetch("/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getSession(id: string) {
  const res = await opencodeFetch(`/session/${id}`);
  return res.json();
}

export async function deleteSession(id: string) {
  await opencodeFetch(`/session/${id}`, { method: "DELETE" });
}

export async function getSessionMessages(id: string) {
  const res = await opencodeFetch(`/session/${id}/message`);
  return res.json();
}

export async function sendMessage(id: string, body: any) {
  const res = await opencodeFetch(`/session/${id}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendMessageAsync(id: string, body: any) {
  await opencodeFetch(`/session/${id}/prompt_async`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function abortSession(id: string) {
  await opencodeFetch(`/session/${id}/abort`, { method: "POST" });
}

export async function getSessionTodo(id: string) {
  const res = await opencodeFetch(`/session/${id}/todo`);
  return res.json();
}

// === Config ===
export async function getConfig() {
  const res = await opencodeFetch("/config");
  return res.json();
}

export async function patchConfig(patch: any) {
  const res = await opencodeFetch("/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

// === Agents ===
export async function listAgents() {
  const res = await opencodeFetch("/agent");
  return res.json();
}

// === MCP ===
export async function getMcpStatus() {
  const res = await opencodeFetch("/mcp");
  return res.json();
}

export async function addMcpServer(name: string, config: any) {
  const res = await opencodeFetch("/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, config }),
  });
  return res.json();
}

// === Providers ===
export async function listProviders() {
  const res = await opencodeFetch("/provider");
  return res.json();
}

export async function setProviderAuth(providerId: string, credentials: any) {
  await opencodeFetch(`/auth/${providerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

// === Commands ===
export async function listCommands() {
  const res = await opencodeFetch("/command");
  return res.json();
}

// === Session Commands ===
export async function executeCommand(sessionId: string, command: string, args: string) {
  const res = await opencodeFetch(`/session/${sessionId}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, arguments: args }),
  });
  return res.json();
}
```

## 2. Config Sync: DB → .opencode/

### src/lib/opencode/config-sync.ts

```typescript
import { db } from "@/lib/db";
import { agents, skills, mcpServers, apiKeys, models, kantorConfig, settings } from "@/lib/db/schema";
import { decrypt } from "@/lib/crypto";
import fs from "node:fs";
import path from "node:path";

const WORKSPACE = process.env.WORKSPACE_PATH || "../";
const OPENCODE_DIR = path.join(WORKSPACE, ".opencode");

export async function syncAll(): Promise<void> {
  await syncAgents();
  await syncSkills();
  await syncOpencodeJson();
  await syncKantorConfig();
  await syncMarkdownFiles();
}

// === Generate .opencode/agents/*.md ===
export async function syncAgents(): Promise<void> {
  const agentsDir = path.join(OPENCODE_DIR, "agents");
  fs.mkdirSync(agentsDir, { recursive: true });

  const allAgents = await db.select().from(agents);

  for (const agent of allAgents) {
    const model = agent.model_id
      ? await db.select().from(models).where(eq(models.id, agent.model_id)).get()
      : null;

    const modelStr = model ? `${model.provider}/${model.model_id}` : undefined;

    const frontmatter: Record<string, any> = {
      description: agent.description,
      mode: agent.mode,
    };

    if (modelStr) frontmatter.model = modelStr;
    if (agent.temperature !== null) frontmatter.temperature = agent.temperature;
    if (agent.steps) frontmatter.steps = agent.steps;
    if (agent.color) frontmatter.color = agent.color;
    if (agent.hidden) frontmatter.hidden = true;

    // Parse permissions
    const perms = JSON.parse(agent.permissions || "{}");
    if (Object.keys(perms).length > 0) {
      frontmatter.permission = perms;
    }

    // Parse task permissions
    const taskPerms = JSON.parse(agent.task_permissions || "{}");
    if (Object.keys(taskPerms).length > 0) {
      if (!frontmatter.permission) frontmatter.permission = {};
      frontmatter.permission.task = taskPerms;
    }

    // Build markdown
    const yaml = Object.entries(frontmatter)
      .map(([k, v]) => {
        if (typeof v === "object") {
          const nested = Object.entries(v)
            .map(([nk, nv]) => {
              if (typeof nv === "object") {
                const subNested = Object.entries(nv)
                  .map(([snk, snv]) => `      ${snk}: ${JSON.stringify(snv)}`)
                  .join("\n");
                return `      ${nk}:\n${subNested}`;
              }
              return `    ${nk}: ${typeof nv === "string" ? `"${nv}"` : nv}`;
            })
            .join("\n");
          return `${k}:\n${nested}`;
        }
        return `${k}: ${typeof v === "string" ? `"${v}"` : v}`;
      })
      .join("\n");

    const markdown = `---\n${yaml}\n---\n\n${agent.prompt}`;
    fs.writeFileSync(path.join(agentsDir, `${agent.name}.md`), markdown, "utf8");
  }

  // Clean up deleted agents
  const existingFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith(".md"));
  const activeNames = new Set(allAgents.map(a => `${a.name}.md`));
  for (const file of existingFiles) {
    if (!activeNames.has(file)) {
      fs.unlinkSync(path.join(agentsDir, file));
    }
  }
}

// === Generate .opencode/skills/<name>/SKILL.md ===
export async function syncSkills(): Promise<void> {
  const skillsDir = path.join(OPENCODE_DIR, "skills");
  fs.mkdirSync(skillsDir, { recursive: true });

  const allSkills = await db.select().from(skills);

  for (const skill of allSkills) {
    const skillDir = path.join(skillsDir, skill.name);
    fs.mkdirSync(skillDir, { recursive: true });

    const frontmatter: string[] = [
      `name: ${skill.name}`,
      `description: ${JSON.stringify(skill.description)}`,
    ];
    if (skill.license) frontmatter.push(`license: ${skill.license}`);
    if (skill.compatibility) frontmatter.push(`compatibility: ${skill.compatibility}`);
    if (skill.metadata && skill.metadata !== "{}") {
      const meta = JSON.parse(skill.metadata);
      frontmatter.push(`metadata:`);
      for (const [k, v] of Object.entries(meta)) {
        frontmatter.push(`  ${k}: ${v}`);
      }
    }

    const markdown = `---\n${frontmatter.join("\n")}\n---\n\n${skill.content}`;
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), markdown, "utf8");
  }

  // Clean up deleted skills
  const existingDirs = fs.readdirSync(skillsDir);
  const activeNames = new Set(allSkills.map(s => s.name));
  for (const dir of existingDirs) {
    if (!activeNames.has(dir)) {
      fs.rmSync(path.join(skillsDir, dir), { recursive: true, force: true });
    }
  }
}

// === Generate opencode.json ===
export async function syncOpencodeJson(): Promise<void> {
  const allMcp = await db.select().from(mcpServers).where(eq(mcpServers.enabled, true));
  const allKeys = await db.select().from(apiKeys).where(eq(apiKeys.is_active, true));
  const defaultModel = await db.select().from(models).where(eq(models.is_default, true)).get();

  const config: any = {
    "$schema": "https://opencode.ai/config.json",
  };

  // Default model
  if (defaultModel) {
    config.model = `${defaultModel.provider}/${defaultModel.model_id}`;
  }

  // Providers with API keys
  const providers: any = {};
  for (const key of allKeys) {
    const decrypted = decrypt(key.key_encrypted, key.key_iv);
    const envVar = `${key.provider.toUpperCase()}_API_KEY`;
    process.env[envVar] = decrypted;

    providers[key.provider] = {
      options: {
        apiKey: `{env:${envVar}}`,
      },
    };
  }
  if (Object.keys(providers).length > 0) {
    config.provider = providers;
  }

  // MCP servers
  const mcpConfig: any = {};
  for (const server of allMcp) {
    if (server.type === "local") {
      mcpConfig[server.name] = {
        type: "local",
        command: JSON.parse(server.command || "[]"),
        enabled: server.enabled,
      };
      if (server.environment && server.environment !== "{}") {
        mcpConfig[server.name].environment = JSON.parse(server.environment);
      }
    } else {
      mcpConfig[server.name] = {
        type: "remote",
        url: server.url,
        enabled: server.enabled,
      };
      if (server.headers && server.headers !== "{}") {
        mcpConfig[server.name].headers = JSON.parse(server.headers);
      }
    }
    if (server.timeout) {
      mcpConfig[server.name].timeout = server.timeout;
    }
  }
  if (Object.keys(mcpConfig).length > 0) {
    config.mcp = mcpConfig;
  }

  // Server config
  config.server = {
    port: 4096,
    hostname: "0.0.0.0",
  };

  // Permissions (from settings)
  config.permission = {
    edit: "ask",
    bash: "ask",
  };

  // Instructions
  config.instructions = ["AGENTS.md", "CLAUDE.md"];

  fs.writeFileSync(
    path.join(WORKSPACE, "opencode.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );
}

// === Generate kantor-agent.json ===
export async function syncKantorConfig(): Promise<void> {
  const configs = await db.select().from(kantorConfig);
  const configObj: any = {};

  for (const config of configs) {
    configObj[config.key] = JSON.parse(config.value);
  }

  // Add agent avatars
  const allAgents = await db.select().from(agents);
  const agentsMap: any = {};
  for (const agent of allAgents) {
    if (agent.avatar_3d) {
      agentsMap[agent.name] = {
        avatar: agent.avatar_3d,
        color: agent.color,
      };
    }
  }
  if (Object.keys(agentsMap).length > 0) {
    configObj.agents = agentsMap;
  }

  const configPath = path.join(WORKSPACE, ".claude", "kantor-agent.json");
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(configObj, null, 2), "utf8");
}

// === Sync markdown files (tugas, marketing, maintenance) ===
export async function syncMarkdownFiles(): Promise<void> {
  await syncBoard();
  // syncNeeds, syncQueue, syncInbox, syncDecisions (sama pola)
}

async function syncBoard(): Promise<void> {
  const { tasks } = await import("@/lib/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  const allTasks = await db.select().from(tasks).orderBy(asc(tasks.task_id));

  let md = "# BOARD TUGAS\n\n";

  // Pemilik section
  md += "## Pemilik\n";
  const pemilikTasks = allTasks.filter(t => t.status === "Menunggu persetujuan" || t.status === "Terblokir");
  if (pemilikTasks.length === 0) {
    md += "(kosong)\n";
  } else {
    for (const t of pemilikTasks) {
      md += `- [ ] ${t.task_id}: ${t.title} — Status: ${t.status}\n`;
    }
  }

  md += "\n## Tim\n";
  md += "| ID | Tugas | Agent | Dependensi | Keluaran | Kanal | Jadwal | Status | Hasil |\n";
  md += "|---|---|---|---|---|---|---|---|---|\n";

  for (const t of allTasks) {
    const deps = JSON.parse(t.dependencies || "[]").join(", ") || "-";
    md += `| ${t.task_id} | ${t.title} | ${t.agent_id || "-"} | ${deps} | ${t.output_path || "-"} | ${t.kanal || "-"} | ${t.jadwal || "-"} | ${t.status} | ${t.hasil || "-"} |\n`;
  }

  const boardPath = path.join(WORKSPACE, "tugas", "BOARD.md");
  fs.mkdirSync(path.dirname(boardPath), { recursive: true });
  fs.writeFileSync(boardPath, md, "utf8");
}
```

## 3. Sync API

### src/app/api/sync/route.ts

```typescript
import { syncAll } from "@/lib/opencode/config-sync";

export async function POST() {
  try {
    await syncAll();
    return Response.json({ success: true, message: "Sync complete" });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  // Return sync status: last sync time, file counts
  return Response.json({ lastSync: new Date().toISOString() });
}
```

## 4. Auto-Sync Trigger

Setiap kali data di DB berubah (agent, skill, MCP, key, model, task), trigger sync.

Implementasi:
- Setelah setiap POST/PUT/DELETE di API routes, panggil `syncAll()` (atau sync spesifik)
- Atau gunakan trigger/drizzle middleware

```typescript
// Contoh di src/app/api/agents/route.ts
export async function POST(request: Request) {
  // ... create agent di DB ...
  await syncAgents();        // sync agent files only
  await syncOpencodeJson();  // sync opencode.json (jika model/provider berubah)
  return Response.json({ success: true });
}
```

## 5. Startup Sync

Pada aplikasi start, jalankan full sync:

```typescript
// src/lib/init.ts (atau di layout server component)
import { syncAll } from "@/lib/opencode/config-sync";

let initialized = false;

export async function ensureInitialized() {
  if (!initialized) {
    await syncAll();
    initialized = true;
  }
}
```

## 6. opencode API Proxy

### src/app/api/opencode/[...path]/route.ts

Proxy semua request ke opencode serve (untuk frontend direct access):

```typescript
import { NextRequest } from "next/server";

const OPENCODE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || "";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, request.body);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, request.body);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  body?: ReadableStream<Uint8Array> | null
) {
  const path = "/" + pathSegments.join("/");
  const url = new URL(path, OPENCODE_URL);
  url.search = request.nextUrl.search;

  const headers: Record<string, string> = {};
  if (OPENCODE_PASSWORD) {
    headers.Authorization = "Basic " + Buffer.from(`opencode:${OPENCODE_PASSWORD}`).toString("base64");
  }
  if (request.headers.get("content-type")) {
    headers["Content-Type"] = request.headers.get("content-type")!;
  }

  const res = await fetch(url.toString(), {
    method: request.method,
    headers,
    body: body ? body : undefined,
  });

  const data = await res.arrayBuffer();
  return new Response(data, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
    },
  });
}
```

Frontend bisa call `/api/opencode/session` → proxy ke `opencode:4096/session`.
