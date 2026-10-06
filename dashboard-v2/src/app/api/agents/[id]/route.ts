import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, models } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const agentUpdateSchema = z.object({
  display_name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  mode: z.enum(["primary", "subagent", "all"]).optional(),
  model_id: z.number().int().nullable().optional(),
  prompt: z.string().optional(),
  permissions: z.string().optional(),
  color: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_3d: z.string().nullable().optional(),
  temperature: z.number().min(0).max(1).nullable().optional(),
  steps: z.number().int().positive().nullable().optional(),
  hidden: z.boolean().optional(),
  task_permissions: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(agents).where(eq(agents.id, Number(id)));
  const agent = rows[0];
  if (!agent) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  let model = null;
  if (agent.model_id) {
    const m = await db.select().from(models).where(eq(models.id, agent.model_id));
    model = m[0] ?? null;
  }
  return NextResponse.json({ ...agent, model });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = agentUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  if (parsed.data.model_id) {
    const m = await db.select().from(models).where(eq(models.id, parsed.data.model_id));
    if (m.length === 0) {
      return NextResponse.json({ error: "model_id tidak dikenal" }, { status: 400 });
    }
  }
  const [updated] = await db
    .update(agents)
    .set({ ...parsed.data, updated_at: new Date().toISOString() })
    .where(eq(agents.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncAgents, syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncAgents();
  await syncOpencodeJson();
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [deleted] = await db.delete(agents).where(eq(agents.id, Number(id))).returning();
  if (!deleted) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncAgents, syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncAgents();
  await syncOpencodeJson();
  return NextResponse.json({ success: true });
}
