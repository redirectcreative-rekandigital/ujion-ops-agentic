import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, models } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";

const modelUpdateSchema = z.object({
  display_name: z.string().min(1).optional(),
  context_window: z.number().int().positive().nullable().optional(),
  cost_per_1k_input: z.number().nonnegative().nullable().optional(),
  cost_per_1k_output: z.number().nonnegative().nullable().optional(),
  is_default: z.boolean().optional(),
  capabilities: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = modelUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }

  const rows = await db.select().from(models).where(eq(models.id, Number(id)));
  const model = rows[0];
  if (!model) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  // Satu default per provider: unset default lain di provider yang sama
  if (parsed.data.is_default) {
    await db
      .update(models)
      .set({ is_default: false })
      .where(and(eq(models.provider, model.provider), ne(models.id, model.id)));
  }

  const [updated] = await db
    .update(models)
    .set(parsed.data)
    .where(eq(models.id, Number(id)))
    .returning();
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const used = await db.select().from(agents).where(eq(agents.model_id, Number(id)));
  if (used.length > 0) {
    return NextResponse.json(
      { error: `dipakai ${used.length} agent, pindahkan dulu` },
      { status: 400 }
    );
  }
  const [deleted] = await db.delete(models).where(eq(models.id, Number(id))).returning();
  if (!deleted) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json({ success: true });
}
