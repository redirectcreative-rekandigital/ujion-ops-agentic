import { NextRequest, NextResponse } from "next/server";
import { listSessions, createSession } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

export async function GET() {
  try {
    return NextResponse.json(await listSessions());
  } catch (e) {
    return serveError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = await createSession({
      title: typeof body.title === "string" ? body.title : undefined,
      parentID: typeof body.parentID === "string" ? body.parentID : undefined,
    });
    return NextResponse.json(session, { status: 201 });
  } catch (e) {
    return serveError(e);
  }
}
