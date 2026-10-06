import { NextRequest, NextResponse } from "next/server";
import { getSessionMessages } from "@/lib/opencode/client";

// GET: riwayat pesan sesi via opencode serve (untuk session viewer).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    const messages = await getSessionMessages(sessionId);
    return NextResponse.json({ session: sessionId, messages });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "opencode serve tidak terjangkau",
        hint: "Jalankan opencode serve di VPS (deploy/pasang-opencode-serve.sh)",
      },
      { status: 502 }
    );
  }
}
