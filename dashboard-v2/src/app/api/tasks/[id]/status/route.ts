import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { canTransition, transitionError, ensurePendingApproval } from "@/lib/task-workflow";

const statusSchema = z.object({
  status: z.enum(["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"]),
});

// PATCH status saja (untuk Kanban drag-drop).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "status tidak valid" }, { status: 400 });
  }

  const rows = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  const task = rows[0];
  if (!task) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  if (!canTransition(task.status, parsed.data.status)) {
    return NextResponse.json({ error: transitionError(task.status, parsed.data.status) }, { status: 400 });
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .where(eq(tasks.id, Number(id)))
    .returning();

  if (parsed.data.status === "Menunggu persetujuan") {
    await ensurePendingApproval(db, updated.id);
  }
  const { syncMarkdownFiles } = await import("@/lib/opencode/config-sync");
  await syncMarkdownFiles();
  return NextResponse.json(updated);
}
