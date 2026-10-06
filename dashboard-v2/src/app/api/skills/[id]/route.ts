import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, agentSkills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const skillUpdateSchema = z.object({
  description: z.string().min(1).max(1024).optional(),
  content: z.string().optional(),
  license: z.string().nullable().optional(),
  compatibility: z.string().optional(),
  metadata: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(skills).where(eq(skills.id, Number(id)));
  const skill = rows[0];
  if (!skill) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  return NextResponse.json(skill);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = skillUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  if (parsed.data.metadata) {
    try {
      JSON.parse(parsed.data.metadata);
    } catch {
      return NextResponse.json({ error: "metadata harus JSON valid" }, { status: 400 });
    }
  }
  const [updated] = await db
    .update(skills)
    .set({ ...parsed.data, updated_at: new Date().toISOString() })
    .where(eq(skills.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncSkills } = await import("@/lib/opencode/config-sync");
  await syncSkills();
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(agentSkills).where(eq(agentSkills.skill_id, Number(id)));
  const [deleted] = await db.delete(skills).where(eq(skills.id, Number(id))).returning();
  if (!deleted) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncSkills } = await import("@/lib/opencode/config-sync");
  await syncSkills();
  // Hapus sisa file command bila skill yang dihapus bertipe command
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const cmdFile = path.join(process.env.WORKSPACE_PATH || "../", ".opencode", "commands", `${deleted.name}.md`);
    if (fs.existsSync(cmdFile)) fs.unlinkSync(cmdFile);
  } catch {
    // Gagal hapus sisa file: tidak fatal, sync berikutnya membersihkan bila nama tak dipakai
  }
  return NextResponse.json({ success: true });
}
