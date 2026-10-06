import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcpServers, agentMcp } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const mcpUpdateSchema = z.object({
  display_name: z.string().min(1).optional(),
  command: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  headers: z.string().optional(),
  environment: z.string().optional(),
  oauth_config: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(mcpServers).where(eq(mcpServers.id, Number(id)));
  const server = rows[0];
  if (!server) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  return NextResponse.json(server);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = mcpUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  const [updated] = await db
    .update(mcpServers)
    .set(parsed.data)
    .where(eq(mcpServers.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(agentMcp).where(eq(agentMcp.mcp_server_id, Number(id)));
  const [deleted] = await db.delete(mcpServers).where(eq(mcpServers.id, Number(id))).returning();
  if (!deleted) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json({ success: true });
}
