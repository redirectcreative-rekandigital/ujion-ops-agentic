import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, tasks, agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "pending";
  let rows = await db
    .select({
      approval: approvals,
      task: tasks,
      agent_name: agents.display_name,
    })
    .from(approvals)
    .leftJoin(tasks, eq(approvals.task_id, tasks.id))
    .leftJoin(agents, eq(tasks.agent_id, agents.id))
    .orderBy(desc(approvals.created_at));

  if (status !== "all") {
    rows = rows.filter((r) => r.approval.status === status);
  }
  return NextResponse.json(rows);
}
