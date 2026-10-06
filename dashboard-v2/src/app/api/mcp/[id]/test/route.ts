import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcpServers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const OPENCODE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || "";

// POST: test connection — tanya status MCP ke opencode serve.
// Bila serve belum jalan, return reachable:false (bukan 500) agar UI tetap informatif.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(mcpServers).where(eq(mcpServers.id, Number(id)));
  const server = rows[0];
  if (!server) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  const headers: Record<string, string> = {};
  if (OPENCODE_PASSWORD) {
    headers.Authorization =
      "Basic " + Buffer.from(`opencode:${OPENCODE_PASSWORD}`).toString("base64");
  }

  try {
    const res = await fetch(`${OPENCODE_URL}/mcp`, {
      headers,
      signal: AbortSignal.timeout(server.timeout || 5000),
    });
    if (!res.ok) {
      return NextResponse.json({ reachable: false, error: `opencode HTTP ${res.status}` });
    }
    const data = await res.json();
    const entry = Array.isArray(data)
      ? data.find((m: { name?: string }) => m.name === server.name)
      : data?.[server.name];
    return NextResponse.json({ reachable: true, server: server.name, status: entry ?? "listed" });
  } catch (e) {
    return NextResponse.json({
      reachable: false,
      error: e instanceof Error ? e.message : "opencode serve tidak terjangkau",
      hint: "Jalankan opencode serve di VPS (deploy/pasang-opencode-serve.sh)",
    });
  }
}
