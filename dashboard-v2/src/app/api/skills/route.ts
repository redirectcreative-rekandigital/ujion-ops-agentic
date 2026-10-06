import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const skillSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "name harus kebab-case").max(64),
  description: z.string().min(1).max(1024),
  content: z.string().default(""),
  license: z.string().nullable().optional(),
  compatibility: z.string().default("opencode"),
  metadata: z.string().default("{}"),
});

export async function GET() {
  const rows = await db.select().from(skills);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const parsed = skillSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  try {
    JSON.parse(parsed.data.metadata);
  } catch {
    return NextResponse.json({ error: "metadata harus JSON valid" }, { status: 400 });
  }

  const existing = await db.select().from(skills).where(eq(skills.name, parsed.data.name));
  if (existing.length > 0) {
    return NextResponse.json({ error: "name sudah dipakai" }, { status: 409 });
  }

  const [created] = await db.insert(skills).values(parsed.data).returning();
  const { syncSkills } = await import("@/lib/opencode/config-sync");
  await syncSkills();
  return NextResponse.json(created, { status: 201 });
}
