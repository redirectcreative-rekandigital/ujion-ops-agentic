import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, mcpServers, agentMcp } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

// GET: semua MCP + id yang diizinkan untuk agent ini
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const a = await db.select().from(agents).where(eq(agents.id, Number(id)));
  if (a.length === 0) return NextResponse.json({ error: "agent tidak ditemukan" }, { status: 404 });

  const all = await db.select().from(mcpServers);
  const assigned = await db.select().from(agentMcp).where(eq(agentMcp.agent_id, Number(id)));
  return NextResponse.json({
    servers: all,
    assigned_ids: assigned.map((r) => r.mcp_server_id),
  });
}

// PUT: ganti daftar MCP agent { mcp_ids: number[] }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = z.object({ mcp_ids: z.array(z.number().int()) }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "mcp_ids harus array number" }, { status: 400 });
  }
  const a = await db.select().from(agents).where(eq(agents.id, Number(id)));
  if (a.length === 0) return NextResponse.json({ error: "agent tidak ditemukan" }, { status: 404 });

  if (parsed.data.mcp_ids.length > 0) {
    const existing = await db
      .select()
      .from(mcpServers)
      .where(inArray(mcpServers.id, parsed.data.mcp_ids));
    if (existing.length !== parsed.data.mcp_ids.length) {
      return NextResponse.json({ error: "ada mcp id tidak dikenal" }, { status: 400 });
    }
  }

  await db.delete(agentMcp).where(eq(agentMcp.agent_id, Number(id)));
  for (const mid of parsed.data.mcp_ids) {
    await db.insert(agentMcp).values({ agent_id: Number(id), mcp_server_id: mid });
  }
  // Tool enable per-agent di-generate ke opencode.json
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json({ success: true, assigned_ids: parsed.data.mcp_ids });
}
