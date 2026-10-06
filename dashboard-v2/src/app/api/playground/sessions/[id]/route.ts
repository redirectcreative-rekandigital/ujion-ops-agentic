import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return serveError(e);
  }
}
