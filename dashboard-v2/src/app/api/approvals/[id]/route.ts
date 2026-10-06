import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, tasks, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const decisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewer_note: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(approvals).where(eq(approvals.id, Number(id)));
  const approval = rows[0];
  if (!approval) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  const t = await db.select().from(tasks).where(eq(tasks.id, approval.task_id));
  const task = t[0] ?? null;
  let agent = null;
  if (task?.agent_id) {
    const a = await db.select().from(agents).where(eq(agents.id, task.agent_id));
    agent = a[0] ?? null;
  }
  return NextResponse.json({ ...approval, task, agent });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "status harus approved/rejected" }, { status: 400 });
  }

  const rows = await db.select().from(approvals).where(eq(approvals.id, Number(id)));
  const approval = rows[0];
  if (!approval) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  if (approval.status !== "pending") {
    return NextResponse.json({ error: "approval sudah diputuskan" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const [updated] = await db
    .update(approvals)
    .set({
      status: parsed.data.status,
      reviewer_note: parsed.data.reviewer_note || null,
      decided_at: now,
    })
    .where(eq(approvals.id, Number(id)))
    .returning();

  // approved → task Selesai; rejected → task Terblokir
  await db
    .update(tasks)
    .set({
      status: parsed.data.status === "approved" ? "Selesai" : "Terblokir",
      updated_at: now,
    })
    .where(eq(tasks.id, approval.task_id));

  // Sync tugas/BOARD.md
  const { syncMarkdownFiles } = await import("@/lib/opencode/config-sync");
  await syncMarkdownFiles();
  return NextResponse.json(updated);
}
