import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nextTaskId, ensurePendingApproval } from "@/lib/task-workflow";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  agent_id: z.number().int().nullable().optional(),
  status: z.enum(["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"]).default("Belum"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dependencies: z.string().default("[]"),
  output_path: z.string().nullable().optional(),
  output_format: z.string().nullable().optional(),
  kanal: z.string().nullable().optional(),
  jadwal: z.string().nullable().optional(),
  hasil: z.string().nullable().optional(),
  schedule_cron: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const status = q.get("status");
  const agentId = q.get("agent_id");
  const priority = q.get("priority");
  const search = q.get("search");

  let rows = await db
    .select({ task: tasks, agent_name: agents.display_name })
    .from(tasks)
    .leftJoin(agents, eq(tasks.agent_id, agents.id));

  if (status) rows = rows.filter((r) => r.task.status === status);
  if (agentId) rows = rows.filter((r) => r.task.agent_id === Number(agentId));
  if (priority) rows = rows.filter((r) => r.task.priority === priority);
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (r) => r.task.title.toLowerCase().includes(s) || r.task.task_id.toLowerCase().includes(s)
    );
  }
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  const data = parsed.data;

  if (data.agent_id) {
    const a = await db.select().from(agents).where(eq(agents.id, data.agent_id));
    if (a.length === 0) {
      return NextResponse.json({ error: "agent_id tidak dikenal" }, { status: 400 });
    }
  }

  const task_id = await nextTaskId(db);
  const [created] = await db.insert(tasks).values({ ...data, task_id }).returning();

  if (created.status === "Menunggu persetujuan") {
    await ensurePendingApproval(db, created.id);
  }
  const { syncMarkdownFiles } = await import("@/lib/opencode/config-sync");
  await syncMarkdownFiles();
  return NextResponse.json(created, { status: 201 });
}
