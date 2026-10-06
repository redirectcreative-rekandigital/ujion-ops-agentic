import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inbox } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const inboxSchema = z.object({
  content: z.string().min(1),
  source: z.string().default("manual"),
});

const pilahSchema = z.object({
  status: z.enum(["Belum dipilah", "Dipilah", "Diteruskan"]),
  category: z.string().nullable().optional(),
});

export async function GET() {
  const rows = await db.select().from(inbox).orderBy(desc(inbox.created_at));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const parsed = inboxSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "content wajib diisi" }, { status: 400 });
  }
  const [created] = await db.insert(inbox).values(parsed.data).returning();
  const { syncMarkdownFiles } = await import("@/lib/opencode/config-sync");
  await syncMarkdownFiles();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body as { id?: number };
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const parsed = pilahSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: "status tidak valid" }, { status: 400 });
  }
  const [updated] = await db.update(inbox).set(parsed.data).where(eq(inbox.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncMarkdownFiles } = await import("@/lib/opencode/config-sync");
  await syncMarkdownFiles();
  return NextResponse.json(updated);
}
