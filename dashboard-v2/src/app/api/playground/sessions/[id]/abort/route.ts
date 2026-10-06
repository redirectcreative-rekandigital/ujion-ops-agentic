import { NextRequest, NextResponse } from "next/server";
import { abortSession } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await abortSession(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return serveError(e);
  }
}
