import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logs, agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const LEVELS = ["info", "warn", "error", "debug", "tool"] as const;

const logSchema = z.object({
  session_id: z.string().nullable().optional(),
  agent_name: z.string().nullable().optional(),
  level: z.enum(LEVELS).default("info"),
  message: z.string().min(1),
  extra: z.string().default("{}"),
});

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const agent = q.get("agent");
  const level = q.get("level"); // koma: info,error
  const session = q.get("session");
  const search = q.get("search");
  const from = q.get("from"); // YYYY-MM-DD
  const to = q.get("to");
  const limit = Math.min(Number(q.get("limit") || "100"), 500);

  let rows = await db
    .select({ log: logs, agent_name: agents.display_name })
    .from(logs)
    .leftJoin(agents, eq(logs.agent_id, agents.id))
    .orderBy(desc(logs.id))
    .limit(limit);

  if (agent && agent !== "all") {
    rows = rows.filter(
      (r) => r.agent_name === agent || String(r.log.agent_id) === agent
    );
  }
  if (level) {
    const lvls = level.split(",");
    rows = rows.filter((r) => lvls.includes(r.log.level));
  }
  if (session) rows = rows.filter((r) => r.log.session_id === session);
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((r) => r.log.message.toLowerCase().includes(s));
  }
  if (from) rows = rows.filter((r) => (r.log.timestamp || "") >= from);
  if (to) rows = rows.filter((r) => (r.log.timestamp || "") <= to + " 23:59:59");

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const parsed = logSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "message wajib diisi" }, { status: 400 });
  }
  const d = parsed.data;

  let agent_id: number | null = null;
  if (d.agent_name) {
    const a = await db.select().from(agents).where(eq(agents.display_name, d.agent_name));
    agent_id = a[0]?.id ?? null;
  }

  const [created] = await db
    .insert(logs)
    .values({
      session_id: d.session_id,
      agent_id,
      level: d.level,
      message: d.message,
      extra: d.extra,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
