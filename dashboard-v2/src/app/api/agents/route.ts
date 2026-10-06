import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, models } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const agentSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "name harus lowercase-hyphen"),
  display_name: z.string().min(1),
  description: z.string().min(1),
  mode: z.enum(["primary", "subagent", "all"]).default("subagent"),
  model_id: z.number().int().nullable().optional(),
  prompt: z.string().default(""),
  permissions: z.string().default("{}"),
  color: z.string().default("#4A90D9"),
  avatar_url: z.string().nullable().optional(),
  avatar_3d: z.string().nullable().optional(),
  temperature: z.number().min(0).max(1).nullable().optional(),
  steps: z.number().int().positive().nullable().optional(),
  hidden: z.boolean().default(false),
  task_permissions: z.string().default("{}"),
  is_active: z.boolean().default(true),
});

export async function GET() {
  const rows = await db
    .select({
      agent: agents,
      model_provider: models.provider,
      model_name: models.model_id,
      model_display: models.display_name,
    })
    .from(agents)
    .leftJoin(models, eq(agents.model_id, models.id));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const parsed = agentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.select().from(agents).where(eq(agents.name, data.name));
  if (existing.length > 0) {
    return NextResponse.json({ error: "name sudah dipakai" }, { status: 409 });
  }

  if (data.model_id) {
    const m = await db.select().from(models).where(eq(models.id, data.model_id));
    if (m.length === 0) {
      return NextResponse.json({ error: "model_id tidak dikenal" }, { status: 400 });
    }
  }

  const [created] = await db.insert(agents).values(data).returning();
  const { syncAgents, syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncAgents();
  await syncOpencodeJson();
  return NextResponse.json(created, { status: 201 });
}
