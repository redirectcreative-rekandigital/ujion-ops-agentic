import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { db } from "@/lib/db";
import { agents, skills, models, tasks, kantorConfig, settings, agentSkills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Migrasi .claude/ (Claude Code) → DB dashboard (sumber opencode v2).
// Aman diulang: memakai onConflictDoNothing / cek eksistensi.
// TIDAK menyentuh .claude/ (rename ke backup tetap manual oleh pemilik).
// Jalankan: npx tsx src/lib/db/migrate-from-claude.ts

const WORKSPACE = process.env.WORKSPACE_PATH || "..";
const CLAUDE_DIR = path.join(WORKSPACE, ".claude");
const OLD_AGENTS = path.join(CLAUDE_DIR, "agents");
const OLD_SKILLS = path.join(CLAUDE_DIR, "skills");

interface ClaudeAgentFrontmatter {
  name?: string;
  description?: string;
  tools?: string;
  model?: string;
  skills?: string[];
  initialPrompt?: string;
  memory?: string;
  hooks?: unknown;
}

// Identitas tim (disamakan dashboard lama + 08-LOGS-KANTOR)
const KNOWN: Record<string, { display: string; color: string; avatar: string }> = {
  "joko-manager": { display: "Joko", color: "#4A90D9", avatar: "🧑‍💼" },
  "budi-konten": { display: "Budi", color: "#FF6B6B", avatar: "✍️" },
  "sari-seo-analitik": { display: "Sari", color: "#4ECDC4", avatar: "📈" },
  "agus-sosmed-wa": { display: "Agus", color: "#FFE66D", avatar: "📣" },
  "rina-maintenance": { display: "Rina", color: "#95E1D3", avatar: "🛡️" },
  "freelancer-riset-pasar": { display: "Freelancer Riset", color: "#6B7280", avatar: "🔎" },
  "freelancer-brief-kreatif": { display: "Freelancer Brief", color: "#6B7280", avatar: "🎨" },
  "freelancer-cek-kualitas": { display: "Freelancer QC", color: "#6B7280", avatar: "✅" },
};

function splitFrontmatter(raw: string): { front: Record<string, unknown>; body: string } | null {
  const content = raw.replace(/\r\n/g, "\n");
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { front: (yaml.load(match[1]) as Record<string, unknown>) || {}, body: match[2].trim() };
}

function toTitleCase(name: string): string {
  return name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function migrateSkills(): Promise<void> {
  if (!fs.existsSync(OLD_SKILLS)) {
    console.log("  .claude/skills/ tidak ada, lewati.");
    return;
  }
  const dirs = fs.readdirSync(OLD_SKILLS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const skillFile = path.join(OLD_SKILLS, dir, "SKILL.md");
    if (!fs.existsSync(skillFile)) continue;
    const parsed = splitFrontmatter(fs.readFileSync(skillFile, "utf8"));
    if (!parsed) continue;

    const { front, body } = parsed;
    const name = String(front.name || dir);
    const isCommand =
      "argument-hint" in front || "disable-model-invocation" in front || body.includes("$ARGUMENTS");

    const nestedMeta =
      front.metadata && typeof front.metadata === "object"
        ? (front.metadata as Record<string, unknown>)
        : {};
    const metadata: Record<string, unknown> = { ...nestedMeta };
    for (const [k, v] of Object.entries(front)) {
      if (!["name", "description", "license", "compatibility", "metadata"].includes(k)) {
        metadata[k] = v;
      }
    }
    if (isCommand) metadata.command = true;

    await db.insert(skills).values({
      name,
      description: String(front.description || ""),
      content: body,
      license: front.license ? String(front.license) : null,
      compatibility: String(front.compatibility || "opencode"),
      metadata: JSON.stringify(metadata),
      is_active: true,
    }).onConflictDoNothing();
    console.log(`  skill: ${name}${isCommand ? " [command]" : ""}`);
  }
}

export async function migrateAgents(): Promise<void> {
  if (!fs.existsSync(OLD_AGENTS)) {
    console.log("  .claude/agents/ tidak ada, lewati.");
    return;
  }
  const files = fs.readdirSync(OLD_AGENTS).filter((f) => f.endsWith(".md"));
  const allModels = await db.select().from(models);
  const allSkills = await db.select().from(skills);
  const skillByName = new Map(allSkills.map((s) => [s.name, s.id]));

  const modelMap: Record<string, { provider: string; model_id: string }> = {
    opus: { provider: "openai", model_id: "gpt-4o" },
    sonnet: { provider: "openai", model_id: "gpt-4o-mini" },
    haiku: { provider: "openai", model_id: "gpt-4o-mini" },
  };

  for (const file of files) {
    const parsed = splitFrontmatter(fs.readFileSync(path.join(OLD_AGENTS, file), "utf8"));
    if (!parsed) continue;
    const front = parsed.front as ClaudeAgentFrontmatter;
    let body = parsed.body;
    const name = front.name || file.replace(/\.md$/, "");
    const known = KNOWN[name];

    // tools → permissions
    const tools = front.tools || "";
    const permissions: Record<string, unknown> = {};
    if (tools.includes("Read")) permissions.read = "allow";
    if (tools.includes("Grep")) permissions.grep = "allow";
    if (tools.includes("Glob")) permissions.glob = "allow";
    if (tools.includes("Write") || tools.includes("Edit")) permissions.edit = "allow";
    if (tools.includes("TodoWrite")) permissions.todowrite = "allow";
    if (/webfetch/i.test(tools)) permissions.webfetch = "allow";
    if (/websearch/i.test(tools)) permissions.websearch = "allow";
    if (tools.includes("Bash")) permissions.bash = "allow";

    const taskMatch = tools.match(/Task\(([^)]+)\)/);
    const taskPerms: Record<string, string> = {};
    if (taskMatch) {
      taskPerms["*"] = "deny";
      for (const sub of taskMatch[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        taskPerms[sub] = "allow";
      }
    }

    // Rina: hook deny-by-default → bash deny (doc 12 literal).
    // Write→edit allow (laporan ke maintenance/); batas path ../ujion-tka-apps
    // butuh aturan path-scoped opencode.json — follow-up verifikasi VPS.
    if (name === "rina-maintenance") {
      permissions.bash = "deny";
    }

    if (front.initialPrompt) {
      body += `\n\n---\n\n## Initial prompt (dari Claude Code)\n\n${front.initialPrompt}`;
    }

    const mapped = front.model ? modelMap[front.model] : undefined;
    const modelRow = mapped
      ? allModels.find((m) => m.provider === mapped.provider && m.model_id === mapped.model_id)
      : undefined;

    const [row] = await db.insert(agents).values({
      name,
      display_name: known?.display || toTitleCase(name),
      description: front.description || "",
      mode: name === "joko-manager" ? "primary" : "subagent",
      model_id: modelRow?.id ?? null,
      prompt: body,
      permissions: JSON.stringify(permissions),
      color: known?.color || "#6B7280",
      avatar_url: known?.avatar || null,
      temperature: 0.3,
      steps: name === "joko-manager" ? 50 : 30,
      hidden: false,
      task_permissions: JSON.stringify(taskPerms),
      is_active: true,
    }).onConflictDoNothing().returning();

    const agentId =
      row?.id ?? (await db.select().from(agents).where(eq(agents.name, name)))[0]?.id;
    if (agentId && Array.isArray(front.skills)) {
      for (const s of front.skills) {
        const sid = skillByName.get(s);
        if (sid) {
          await db.insert(agentSkills).values({ agent_id: agentId, skill_id: sid }).onConflictDoNothing();
        } else {
          console.log(`  peringatan: skill '${s}' utk ${name} tidak ditemukan, dilewati.`);
        }
      }
    }
    console.log(`  agent: ${name} (model: ${modelRow ? `${mapped!.provider}/${mapped!.model_id}` : "-"})`);
  }
}

export async function migrateKantor(): Promise<void> {
  const kantorFile = path.join(CLAUDE_DIR, "kantor-agent.json");
  if (!fs.existsSync(kantorFile)) {
    console.log("  kantor-agent.json tidak ada, lewati.");
    return;
  }
  const data = JSON.parse(fs.readFileSync(kantorFile, "utf8")) as Record<string, unknown>;
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(data)) {
    await db.insert(kantorConfig)
      .values({ key, value: JSON.stringify(value), updated_at: now })
      .onConflictDoNothing();
  }
  console.log(`  kantor: ${Object.keys(data).join(", ")}`);
}

export async function migrateSettings(): Promise<void> {
  const settingsFile = path.join(CLAUDE_DIR, "settings.json");
  if (!fs.existsSync(settingsFile)) {
    console.log("  settings.json tidak ada, lewati.");
    return;
  }
  // Tidak ada rahasia di settings.json (hanya agent + permissions deny).
  // Simpan default_agent; aturan deny path diteruskan sebagai catatan (lihat laporan).
  const data = JSON.parse(fs.readFileSync(settingsFile, "utf8")) as { agent?: string };
  if (data.agent) {
    const now = new Date().toISOString();
    await db.insert(settings)
      .values({ key: "default_agent", value: data.agent, updated_at: now })
      .onConflictDoNothing();
    console.log(`  settings: default_agent=${data.agent}`);
  }
}

export async function migrateTasksFromBoard(): Promise<void> {
  const boardFile = path.join(WORKSPACE, "tugas", "BOARD.md");
  if (!fs.existsSync(boardFile)) {
    console.log("  tugas/BOARD.md tidak ada, lewati.");
    return;
  }
  const md = fs.readFileSync(boardFile, "utf8").replace(/\r\n/g, "\n");
  const allAgents = await db.select().from(agents);
  const agentByName = new Map<string, number>();
  for (const a of allAgents) {
    agentByName.set(a.name.toLowerCase(), a.id);
    agentByName.set(a.display_name.toLowerCase(), a.id);
  }

  const rowRe = /^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/;
  let count = 0;
  for (const line of md.split("\n")) {
    const m = line.match(rowRe);
    if (!m) continue;
    const [, id, tugas, agent, dep, keluaran, status] = m.map((s) => s.trim());
    if (!/^U-\d+$/.test(id)) continue;
    if (!["Belum", "Selesai"].includes(status)) continue;
    const agentKey = agent.toLowerCase();
    const deps = dep === "-" ? [] : dep.split(",").map((s) => s.trim()).filter(Boolean);
    await db.insert(tasks).values({
      task_id: id,
      title: tugas,
      agent_id: agentByName.get(agentKey) ?? null,
      status: status as "Belum" | "Selesai",
      dependencies: JSON.stringify(deps),
      output_path: keluaran === "-" ? null : keluaran,
    }).onConflictDoNothing();
    count++;
  }
  console.log(`  tasks: ${count} baris dari BOARD.md`);
}

export async function runMigration(): Promise<void> {
  console.log("Migrasi .claude/ → DB (workspace: " + WORKSPACE + ")");
  console.log("[1/5] skills..."); await migrateSkills();
  console.log("[2/5] agents..."); await migrateAgents();
  console.log("[3/5] kantor..."); await migrateKantor();
  console.log("[4/5] settings..."); await migrateSettings();
  console.log("[5/5] tasks BOARD.md..."); await migrateTasksFromBoard();
  console.log("Selesai. Lanjut: POST /api/sync (scope all) → verifikasi .opencode/.");
}

const isMain = process.argv[1]?.endsWith("migrate-from-claude.ts");
if (isMain) {
  runMigration().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
