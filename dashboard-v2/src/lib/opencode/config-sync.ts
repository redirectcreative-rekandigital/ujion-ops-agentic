import { db } from "@/lib/db";
import {
  agents, skills, mcpServers, agentMcp, apiKeys, models,
  tasks, approvals, inbox, kantorConfig,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import fs from "node:fs";
import path from "node:path";

const WORKSPACE = process.env.WORKSPACE_PATH || "../";
const OPENCODE_DIR = path.join(WORKSPACE, ".opencode");

export type SyncScope = "all" | "config" | "markdown";

export async function syncAll(scope: SyncScope = "all"): Promise<void> {
  if (scope === "all" || scope === "config") {
    await syncAgents();
    await syncSkills();
    await syncOpencodeJson();
    await syncKantorConfig();
  }
  if (scope === "all" || scope === "markdown") {
    await syncMarkdownFiles();
  }
}

// === Generate .opencode/agents/*.md ===
export async function syncAgents(): Promise<void> {
  const agentsDir = path.join(OPENCODE_DIR, "agents");
  fs.mkdirSync(agentsDir, { recursive: true });

  const allAgents = await db.select().from(agents);
  const allModels = await db.select().from(models);
  const modelById = new Map(allModels.map((m) => [m.id, m]));

  for (const agent of allAgents) {
    const model = agent.model_id ? modelById.get(agent.model_id) : undefined;
    const modelStr = model ? `${model.provider}/${model.model_id}` : undefined;

    const frontmatter: Record<string, unknown> = {
      description: agent.description,
      mode: agent.mode,
    };

    if (modelStr) frontmatter.model = modelStr;
    if (agent.temperature !== null) frontmatter.temperature = agent.temperature;
    if (agent.steps) frontmatter.steps = agent.steps;
    if (agent.color) frontmatter.color = agent.color;
    if (agent.hidden) frontmatter.hidden = true;

    const perms = JSON.parse(agent.permissions || "{}") as Record<string, unknown>;
    if (Object.keys(perms).length > 0) {
      frontmatter.permission = perms;
    }

    const taskPerms = JSON.parse(agent.task_permissions || "{}") as Record<string, unknown>;
    if (Object.keys(taskPerms).length > 0) {
      if (!frontmatter.permission) frontmatter.permission = {};
      (frontmatter.permission as Record<string, unknown>).task = taskPerms;
    }

    const yaml = Object.entries(frontmatter)
      .map(([k, v]) => {
        if (typeof v === "object" && v !== null) {
          const nested = Object.entries(v as Record<string, unknown>)
            .map(([nk, nv]) => {
              if (typeof nv === "object" && nv !== null) {
                const subNested = Object.entries(nv as Record<string, unknown>)
                  .map(([snk, snv]) => `      ${snk}: ${JSON.stringify(snv)}`)
                  .join("\n");
                return `    ${nk}:\n${subNested}`;
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
  const existingFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
  const activeNames = new Set(allAgents.map((a) => `${a.name}.md`));
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
  const commandsDir = path.join(OPENCODE_DIR, "commands");
  fs.mkdirSync(commandsDir, { recursive: true });
  const managedCommands = new Set<string>();

  for (const skill of allSkills) {
    const skillDir = path.join(skillsDir, skill.name);
    fs.mkdirSync(skillDir, { recursive: true });

    const frontmatter: string[] = [
      `name: ${skill.name}`,
      `description: ${JSON.stringify(skill.description)}`,
    ];
    if (skill.license) frontmatter.push(`license: ${skill.license}`);
    if (skill.compatibility) frontmatter.push(`compatibility: ${skill.compatibility}`);
    let isCommand = false;
    if (skill.metadata && skill.metadata !== "{}") {
      const meta = JSON.parse(skill.metadata) as Record<string, unknown>;
      isCommand = meta.command === true;
      frontmatter.push(`metadata:`);
      for (const [k, v] of Object.entries(meta)) {
        if (k === "command") continue;
        frontmatter.push(`  ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
      }
    }

    const markdown = `---\n${frontmatter.join("\n")}\n---\n\n${skill.content}`;
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), markdown, "utf8");

    // Skill slash-command → juga .opencode/commands/<name>.md
    if (isCommand) {
      const cmdFront = [`description: ${JSON.stringify(skill.description)}`];
      if (skill.metadata && skill.metadata !== "{}") {
        const meta = JSON.parse(skill.metadata) as Record<string, unknown>;
        for (const [k, v] of Object.entries(meta)) {
          if (k === "command") continue;
          if (v !== null && typeof v === "object" && !Array.isArray(v)) {
            cmdFront.push(`${k}:`);
            for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
              cmdFront.push(`  ${sk}: ${JSON.stringify(sv)}`);
            }
          } else {
            cmdFront.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
          }
        }
      }
      fs.writeFileSync(
        path.join(commandsDir, `${skill.name}.md`),
        `---\n${cmdFront.join("\n")}\n---\n\n${skill.content}`,
        "utf8"
      );
      managedCommands.add(`${skill.name}.md`);
    }
  }

  // Clean up deleted skills
  const existingDirs = fs.readdirSync(skillsDir);
  const activeNames = new Set(allSkills.map((s) => s.name));
  for (const dir of existingDirs) {
    if (!activeNames.has(dir)) {
      fs.rmSync(path.join(skillsDir, dir), { recursive: true, force: true });
    }
  }
  // Clean up: hapus file command milik skill yang flag command-nya dicabut.
  // File command buatan manual (nama tak ada di skills) selalu dibiarkan.
  const skillNames = new Set(allSkills.map((s) => s.name));
  for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"))) {
    if (managedCommands.has(file)) continue;
    const name = file.replace(/\.md$/, "");
    if (skillNames.has(name)) {
      fs.unlinkSync(path.join(commandsDir, file));
    }
  }
}

// === Generate opencode.json ===
export async function syncOpencodeJson(): Promise<void> {
  const allMcp = await db.select().from(mcpServers).where(eq(mcpServers.enabled, true));
  const allKeys = await db.select().from(apiKeys).where(eq(apiKeys.is_active, true));
  const allModels = await db.select().from(models);
  const defaultModel = allModels.find((m) => m.is_default) ?? null;
  const assignments = await db.select().from(agentMcp);
  const allAgents = await db.select().from(agents);

  const config: Record<string, unknown> = {
    $schema: "https://opencode.ai/config.json",
  };

  if (defaultModel) {
    config.model = `${defaultModel.provider}/${defaultModel.model_id}`;
  }

  // Providers with API keys (decrypt → {env:} substitution)
  const providers: Record<string, unknown> = {};
  for (const key of allKeys) {
    const decrypted = decrypt(key.key_encrypted, key.key_iv);
    const envVar = `${key.provider.toUpperCase()}_API_KEY`;
    process.env[envVar] = decrypted;
    providers[key.provider] = {
      options: { apiKey: `{env:${envVar}}` },
    };
  }
  if (Object.keys(providers).length > 0) {
    config.provider = providers;
  }

  // MCP servers
  const mcpConfig: Record<string, unknown> = {};
  const assignedServerIds = new Set(assignments.map((a) => a.mcp_server_id));
  const tools: Record<string, boolean> = {};
  const perAgent: Record<string, { tools: Record<string, boolean> }> = {};

  for (const server of allMcp) {
    if (server.type === "local") {
      const entry: Record<string, unknown> = {
        type: "local",
        command: JSON.parse(server.command || "[]"),
        enabled: !!server.enabled,
      };
      if (server.environment && server.environment !== "{}") {
        entry.environment = JSON.parse(server.environment);
      }
      mcpConfig[server.name] = entry;
    } else {
      const entry: Record<string, unknown> = {
        type: "remote",
        url: server.url,
        enabled: !!server.enabled,
      };
      if (server.headers && server.headers !== "{}") {
        entry.headers = JSON.parse(server.headers);
      }
      mcpConfig[server.name] = entry;
    }
    if (server.timeout) {
      (mcpConfig[server.name] as Record<string, unknown>).timeout = server.timeout;
    }

    // Tool enable per-agent (07-SKILL-MCP): disable global, enable per agent terdaftar
    if (assignedServerIds.has(server.id)) {
      tools[`${server.name}_*`] = false;
      for (const a of assignments.filter((x) => x.mcp_server_id === server.id)) {
        const ag = allAgents.find((x) => x.id === a.agent_id);
        if (!ag) continue;
        perAgent[ag.name] ||= { tools: {} };
        perAgent[ag.name].tools[`${server.name}_*`] = true;
      }
    }
  }
  if (Object.keys(mcpConfig).length > 0) {
    config.mcp = mcpConfig;
  }
  if (Object.keys(tools).length > 0) {
    config.tools = tools;
  }
  if (Object.keys(perAgent).length > 0) {
    config.agent = perAgent;
  }

  config.server = { port: 4096, hostname: "0.0.0.0" };
  config.permission = { edit: "ask", bash: "ask" };
  config.instructions = ["AGENTS.md", "CLAUDE.md"];

  fs.writeFileSync(
    path.join(WORKSPACE, "opencode.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );
}

// === Generate kantor-agent.json (path .claude/ untuk kompat plugin) ===
export async function syncKantorConfig(): Promise<void> {
  const configs = await db.select().from(kantorConfig);
  const configObj: Record<string, unknown> = {};

  for (const config of configs) {
    try {
      configObj[config.key] = JSON.parse(config.value);
    } catch {
      configObj[config.key] = config.value;
    }
  }

  const allAgents = await db.select().from(agents);
  const agentsMap: Record<string, unknown> = {};
  for (const agent of allAgents) {
    if (agent.avatar_3d) {
      try {
        agentsMap[agent.name] = {
          ...(JSON.parse(agent.avatar_3d) as Record<string, unknown>),
          color: agent.color,
        };
      } catch {
        agentsMap[agent.name] = { color: agent.color };
      }
    }
  }
  if (Object.keys(agentsMap).length > 0) {
    configObj.agents = agentsMap;
  }

  const configPath = path.join(WORKSPACE, ".claude", "kantor-agent.json");
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(configObj, null, 2), "utf8");
}

// === Sync markdown files (tugas/) ===
export async function syncMarkdownFiles(): Promise<void> {
  await syncBoard();
  await syncQueue();
  await syncInbox();
  // KEBUTUHAN.md: tidak ada tabel DB sumber (gap, follow-up U-13). KEPUTUSAN.md: milik pemilik.
}

async function syncBoard(): Promise<void> {
  const allTasks = await db.select().from(tasks);
  const allAgents = await db.select().from(agents);
  const agentName = new Map(allAgents.map((a) => [a.id, a.name]));
  allTasks.sort((a, b) => a.task_id.localeCompare(b.task_id, undefined, { numeric: true }));

  let md = "# BOARD TUGAS\n\n## Pemilik\n";
  const pemilikTasks = allTasks.filter(
    (t) => t.status === "Menunggu persetujuan" || t.status === "Terblokir"
  );
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
    let deps = "-";
    try {
      const arr = JSON.parse(t.dependencies || "[]") as string[];
      if (arr.length > 0) deps = arr.join(", ");
    } catch {
      deps = t.dependencies || "-";
    }
    const ag = t.agent_id ? agentName.get(t.agent_id) || "-" : "-";
    md += `| ${t.task_id} | ${t.title} | ${ag} | ${deps} | ${t.output_path || "-"} | ${t.kanal || "-"} | ${t.jadwal || "-"} | ${t.status} | ${t.hasil || "-"} |\n`;
  }

  const boardPath = path.join(WORKSPACE, "tugas", "BOARD.md");
  fs.mkdirSync(path.dirname(boardPath), { recursive: true });
  fs.writeFileSync(boardPath, md, "utf8");
}

const APPROVAL_STATUS: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

async function syncQueue(): Promise<void> {
  const allApprovals = await db.select().from(approvals);
  const allTasks = await db.select().from(tasks);
  const taskById = new Map(allTasks.map((t) => [t.id, t]));

  let md =
    "# Antrian Persetujuan\n" +
    "Semua yang siap dieksekusi manusia (posting, blast, iklan, publikasi soal). Tidak ada yang keluar sebelum Anda menandai \"Disetujui\".\n\n" +
    "| ID | Barang | File | Kanal/tujuan | Jadwal usulan | Status (Menunggu / Disetujui / Ditolak / Sudah dieksekusi) | Hasil setelah tayang |\n" +
    "|----|--------|------|--------------|---------------|-------------------------------------------------------------|----------------------|\n";

  if (allApprovals.length === 0) {
    md += "| (kosong) | | | | | | |\n";
  }
  for (const a of allApprovals) {
    const t = taskById.get(a.task_id);
    md += `| A-${a.id} | ${t?.title || "-"} | ${t?.output_path || "-"} | ${t?.kanal || "-"} | ${t?.jadwal || "-"} | ${APPROVAL_STATUS[a.status] || a.status} | ${t?.hasil || "-"} |\n`;
  }

  const queuePath = path.join(WORKSPACE, "tugas", "ANTRIAN-PERSETUJUAN.md");
  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  fs.writeFileSync(queuePath, md, "utf8");
}

async function syncInbox(): Promise<void> {
  const items = await db.select().from(inbox);
  const fresh = items.filter((i) => i.status === "Belum dipilah");
  const done = items.filter((i) => i.status !== "Belum dipilah");

  let md =
    "# Inbox Mentah\n" +
    "Tempat menaruh apa pun tanpa perlu rapi (link, tangkapan layar, catatan, ide). Anda juga bisa langsung mengirim ke Joko lewat chat. Joko memilah, mencatat ke tempat yang benar, lalu mengosongkan bagian \"Belum dipilah\".\n\n" +
    "## Belum dipilah\n";
  md += fresh.length === 0 ? "- (kosong)\n" : fresh.map((i) => `- ${i.content}\n`).join("");
  md += "\n## Sudah dipilah (log singkat)\n";
  md +=
    done.length === 0
      ? "- (kosong)\n"
      : done.map((i) => `- [${i.status}] ${i.content}${i.category ? ` (${i.category})` : ""}\n`).join("");

  const inboxPath = path.join(WORKSPACE, "tugas", "INBOX.md");
  fs.mkdirSync(path.dirname(inboxPath), { recursive: true });
  fs.writeFileSync(inboxPath, md, "utf8");
}
