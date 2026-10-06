import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { models } from "@/lib/db/schema";
import { z } from "zod";

const modelSchema = z.object({
  provider: z.string().min(1),
  model_id: z.string().min(1),
  display_name: z.string().min(1),
  context_window: z.number().int().positive().nullable().optional(),
  cost_per_1k_input: z.number().nonnegative().nullable().optional(),
  cost_per_1k_output: z.number().nonnegative().nullable().optional(),
  is_default: z.boolean().default(false),
  capabilities: z.string().default("[]"),
});

export async function GET() {
  const rows = await db.select().from(models);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const parsed = modelSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  const [created] = await db.insert(models).values(parsed.data).returning();
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json(created, { status: 201 });
}
