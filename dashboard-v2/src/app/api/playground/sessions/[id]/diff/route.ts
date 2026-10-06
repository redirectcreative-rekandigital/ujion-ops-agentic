import { NextRequest, NextResponse } from "next/server";
import { getSessionDiff } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    return NextResponse.json(await getSessionDiff(id));
  } catch (e) {
    return serveError(e);
  }
}
