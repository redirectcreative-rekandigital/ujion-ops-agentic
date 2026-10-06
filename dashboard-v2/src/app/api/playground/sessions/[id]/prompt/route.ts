import { NextRequest, NextResponse } from "next/server";
import { sendMessageAsync, abortSession, getSessionDiff, executeCommand } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

// POST async: kirim lalu kembali 202; respons dibaca via polling GET messages.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const text = String(body.text || "").trim();
    if (!text) return NextResponse.json({ error: "text wajib diisi" }, { status: 400 });
    await sendMessageAsync(id, { parts: [{ type: "text", text }] });
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (e) {
    return serveError(e);
  }
}
