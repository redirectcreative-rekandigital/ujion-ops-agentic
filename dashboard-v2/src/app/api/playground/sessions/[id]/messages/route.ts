import { NextRequest, NextResponse } from "next/server";
import { getSessionMessages, sendMessage } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    return NextResponse.json(await getSessionMessages(id));
  } catch (e) {
    return serveError(e);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const text = String(body.text || "").trim();
    if (!text) return NextResponse.json({ error: "text wajib diisi" }, { status: 400 });
    const result = await sendMessage(id, { parts: [{ type: "text", text }] });
    return NextResponse.json(result);
  } catch (e) {
    return serveError(e);
  }
}
