import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kantorConfig } from "@/lib/db/schema";
import { z } from "zod";

export async function GET() {
  const rows = await db.select().from(kantorConfig);
  const config: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      config[r.key] = JSON.parse(r.value);
    } catch {
      config[r.key] = r.value;
    }
  }
  return NextResponse.json(config);
}

const kantorSchema = z.object({
  title: z.string().min(1).optional(),
  names: z.object({ ketua: z.string(), team: z.array(z.string()) }).optional(),
  autostart: z.boolean().optional(),
  theme: z.string().optional(),
}).catchall(z.unknown());

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const parsed = kantorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "format config salah" }, { status: 400 });
  }

  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(parsed.data)) {
    await db
      .insert(kantorConfig)
      .values({ key, value: JSON.stringify(value), updated_at: now })
      .onConflictDoUpdate({
        target: kantorConfig.key,
        set: { value: JSON.stringify(value), updated_at: now },
      });
  }
  // Generate kantor-agent.json
  const { syncKantorConfig } = await import("@/lib/opencode/config-sync");
  await syncKantorConfig();
  return NextResponse.json({ success: true });
}
