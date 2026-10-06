import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, skills, agentSkills } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

// GET: semua skill + id yang terpasang di agent ini
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const a = await db.select().from(agents).where(eq(agents.id, Number(id)));
  if (a.length === 0) return NextResponse.json({ error: "agent tidak ditemukan" }, { status: 404 });

  const all = await db.select().from(skills);
  const assigned = await db.select().from(agentSkills).where(eq(agentSkills.agent_id, Number(id)));
  return NextResponse.json({
    skills: all,
    assigned_ids: assigned.map((r) => r.skill_id),
  });
}

// PUT: ganti daftar skill agent { skill_ids: number[] }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = z.object({ skill_ids: z.array(z.number().int()) }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "skill_ids harus array number" }, { status: 400 });
  }
  const a = await db.select().from(agents).where(eq(agents.id, Number(id)));
  if (a.length === 0) return NextResponse.json({ error: "agent tidak ditemukan" }, { status: 404 });

  if (parsed.data.skill_ids.length > 0) {
    const existing = await db
      .select()
      .from(skills)
      .where(inArray(skills.id, parsed.data.skill_ids));
    if (existing.length !== parsed.data.skill_ids.length) {
      return NextResponse.json({ error: "ada skill_id tidak dikenal" }, { status: 400 });
    }
  }

  await db.delete(agentSkills).where(eq(agentSkills.agent_id, Number(id)));
  for (const sid of parsed.data.skill_ids) {
    await db.insert(agentSkills).values({ agent_id: Number(id), skill_id: sid });
  }
  return NextResponse.json({ success: true, assigned_ids: parsed.data.skill_ids });
}
