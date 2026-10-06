import { NextRequest, NextResponse } from "next/server";
import { executeCommand } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const command = String(body.command || "").trim();
    if (!command) return NextResponse.json({ error: "command wajib" }, { status: 400 });
    const result = await executeCommand(id, command, String(body.arguments || ""));
    return NextResponse.json(result);
  } catch (e) {
    return serveError(e);
  }
}
