import { NextRequest, NextResponse } from "next/server";
import { syncAll, type SyncScope } from "@/lib/opencode/config-sync";
import fs from "node:fs";
import path from "node:path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const scope = (body.scope || "all") as SyncScope;
    if (!["all", "config", "markdown"].includes(scope)) {
      return NextResponse.json({ error: "scope: all | config | markdown" }, { status: 400 });
    }
    await syncAll(scope);
    return NextResponse.json({ success: true, message: `Sync ${scope} complete` });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "sync gagal" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const workspace = process.env.WORKSPACE_PATH || "../";
  const agentsDir = path.join(workspace, ".opencode", "agents");
  let agentFiles = 0;
  try {
    agentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md")).length;
  } catch {
    agentFiles = 0;
  }
  return NextResponse.json({
    workspace,
    agentFiles,
    checkedAt: new Date().toISOString(),
  });
}
