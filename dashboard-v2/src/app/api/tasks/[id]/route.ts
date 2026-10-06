import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, agents, approvals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { canTransition, transitionError, ensurePendingApproval } from "@/lib/task-workflow";
import { refreshTaskSchedule } from "@/lib/scheduler";

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  agent_id: z.number().int().nullable().optional(),
  status: z.enum(["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  dependencies: z.string().optional(),
  output_path: z.string().nullable().optional(),
  output_format: z.string().nullable().optional(),
  kanal: z.string().nullable().optional(),
  jadwal: z.string().nullable().optional(),
  hasil: z.string().nullable().optional(),
  schedule_cron: z.string().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  const task = rows[0];
  if (!task) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  let agent = null;
  if (task.agent_id) {
    const a = await db.select().from(agents).where(eq(agents.id, task.agent_id));
    agent = a[0] ?? null;
  }
  const history = await db
    .select()
    .from(approvals)
    .where(eq(approvals.task_id, task.id))
    .orderBy(desc(approvals.created_at));

  return NextResponse.json({ ...task, agent, approvals: history });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = taskUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }

  const rows = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  const task = rows[0];
  if (!task) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  if (parsed.data.status && !canTransition(task.status, parsed.data.status)) {
    return NextResponse.json({ error: transitionError(task.status, parsed.data.status) }, { status: 400 });
  }

  const [updated] = await db
    .update(tasks)
    .set({ ...parsed.data, updated_at: new Date().toISOString() })
    .where(eq(tasks.id, Number(id)))
    .returning();

  if (parsed.data.status === "Menunggu persetujuan") {
    await ensurePendingApproval(db, updated.id);
  }
  if (parsed.data.schedule_cron !== undefined) {
    await refreshTaskSchedule(updated.id);
  }
  const { syncMarkdownFiles } = await import("@/lib/opencode/config-sync");
  await syncMarkdownFiles();
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, Number(id))).returning();
  if (!deleted) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncMarkdownFiles } = await import("@/lib/opencode/config-sync");
  await syncMarkdownFiles();
  return NextResponse.json({ success: true });
}
