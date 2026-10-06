import cron, { ScheduledTask } from "node-cron";
import { db } from "@/lib/db";
import { tasks, agents, logs } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { createSession, sendMessageAsync } from "@/lib/opencode/client";

const scheduledJobs = new Map<number, ScheduledTask>();
let initialized = false;

async function writeLog(
  agentId: number | null,
  sessionId: string | null,
  level: "info" | "error",
  message: string
) {
  try {
    await db.insert(logs).values({
      session_id: sessionId,
      agent_id: agentId,
      level,
      message,
    });
  } catch {
    // Jangan jatuhkan scheduler gara-gara log gagal
  }
}

export async function executeScheduledTask(taskDbId: number): Promise<{ ok: boolean; detail: string }> {
  const rows = await db.select().from(tasks).where(eq(tasks.id, taskDbId));
  const task = rows[0];
  if (!task) return { ok: false, detail: "task tidak ditemukan" };
  if (!task.agent_id) return { ok: false, detail: "task belum punya agent" };

  const a = await db.select().from(agents).where(eq(agents.id, task.agent_id));
  const agent = a[0];
  if (!agent) return { ok: false, detail: "agent tidak ditemukan" };

  try {
    const session = await createSession({ title: task.title });
    const sessionId: string =
      (session as { id?: string }).id || (session as { sessionID?: string }).sessionID || "";
    const message =
      `Jalankan tugas: ${task.title}\n\nDeskripsi: ${task.description || "-"}\n\n` +
      `Output: ${task.output_path || "sesuai konteks"}`;
    await sendMessageAsync(sessionId, { parts: [{ type: "text", text: message }] });
    await writeLog(agent.id, sessionId || null, "info", `Scheduled task dijalankan: ${task.title}`);
    return { ok: true, detail: `session ${sessionId}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    await writeLog(agent.id, null, "error", `Scheduled task gagal (${task.title}): ${msg}`);
    return { ok: false, detail: msg };
  }
}

function nextRun(job: ScheduledTask): string | null {
  try {
    const fn = (job as unknown as { nextDate?: () => unknown }).nextDate;
    if (typeof fn !== "function") return null;
    const d = fn.call(job) as { toISO?: () => string; toISOString?: () => string } | null;
    if (!d) return null;
    if (typeof d.toISO === "function") return d.toISO();
    if (typeof d.toISOString === "function") return d.toISOString();
    return String(d);
  } catch {
    return null;
  }
}

export async function initScheduler(): Promise<{ jobs: number }> {
  if (initialized) return { jobs: scheduledJobs.size };
  initialized = true;

  const scheduled = await db.select().from(tasks).where(isNotNull(tasks.schedule_cron));
  for (const task of scheduled) {
    if (!task.schedule_cron || !cron.validate(task.schedule_cron)) continue;
    if (scheduledJobs.has(task.id)) continue;
    const job = cron.schedule(task.schedule_cron, () => {
      executeScheduledTask(task.id);
    });
    scheduledJobs.set(task.id, job);
  }

  console.log(`[scheduler] aktif: ${scheduledJobs.size} job`);
  return { jobs: scheduledJobs.size };
}

// Dipanggil tiap ada perubahan schedule_cron di task (agar tanpa restart).
export async function refreshTaskSchedule(taskDbId: number): Promise<void> {
  scheduledJobs.get(taskDbId)?.stop();
  scheduledJobs.delete(taskDbId);
  const rows = await db.select().from(tasks).where(eq(tasks.id, taskDbId));
  const task = rows[0];
  if (task?.schedule_cron && cron.validate(task.schedule_cron)) {
    scheduledJobs.set(
      task.id,
      cron.schedule(task.schedule_cron, () => {
        executeScheduledTask(task.id);
      })
    );
  }
}

export async function listScheduled() {
  await initScheduler();
  const scheduled = await db.select().from(tasks).where(isNotNull(tasks.schedule_cron));
  return scheduled.map((t) => ({
    id: t.id,
    task_id: t.task_id,
    title: t.title,
    schedule_cron: t.schedule_cron,
    running: scheduledJobs.has(t.id),
    next_run: scheduledJobs.has(t.id) ? nextRun(scheduledJobs.get(t.id)!) : null,
  }));
}

export function pauseScheduled(taskDbId: number): boolean {
  const job = scheduledJobs.get(taskDbId);
  if (!job) return false;
  job.stop();
  scheduledJobs.delete(taskDbId);
  return true;
}
