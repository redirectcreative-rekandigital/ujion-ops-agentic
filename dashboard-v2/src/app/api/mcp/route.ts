import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcpServers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const mcpSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "name harus kebab-case"),
  display_name: z.string().min(1),
  type: z.enum(["local", "remote"]),
  command: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  headers: z.string().default("{}"),
  environment: z.string().default("{}"),
  oauth_config: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  timeout: z.number().int().positive().default(5000),
  description: z.string().nullable().optional(),
});

function validateJsonField(v: string | null | undefined, label: string): string | null {
  if (!v || v === "{}") return null;
  try {
    JSON.parse(v);
    return null;
  } catch {
    return `${label} harus JSON valid`;
  }
}

export async function GET() {
  const rows = await db.select().from(mcpServers);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const parsed = mcpSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  const d = parsed.data;

  if (d.type === "local" && !d.command) {
    return NextResponse.json({ error: "local butuh command (JSON array)" }, { status: 400 });
  }
  if (d.type === "remote" && !d.url) {
    return NextResponse.json({ error: "remote butuh url" }, { status: 400 });
  }
  if (d.command) {
    try {
      const arr = JSON.parse(d.command);
      if (!Array.isArray(arr)) throw new Error();
    } catch {
      return NextResponse.json({ error: "command harus JSON array" }, { status: 400 });
    }
  }
  for (const [v, label] of [[d.headers, "headers"], [d.environment, "environment"]] as const) {
    const err = validateJsonField(v, label);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  const existing = await db.select().from(mcpServers).where(eq(mcpServers.name, d.name));
  if (existing.length > 0) {
    return NextResponse.json({ error: "name sudah dipakai" }, { status: 409 });
  }

  const [created] = await db.insert(mcpServers).values(d).returning();
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json(created, { status: 201 });
}
