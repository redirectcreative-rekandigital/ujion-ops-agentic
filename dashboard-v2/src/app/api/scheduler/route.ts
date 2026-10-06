import { NextRequest, NextResponse } from "next/server";
import { listScheduled, executeScheduledTask, pauseScheduled } from "@/lib/scheduler";

// GET: daftar scheduled tasks + next run
export async function GET() {
  try {
    return NextResponse.json(await listScheduled());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal memuat scheduler" },
      { status: 500 }
    );
  }
}

// POST: trigger manual { task_id (db id) }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const taskId = Number(body.task_id);
  if (!taskId) return NextResponse.json({ error: "task_id wajib" }, { status: 400 });
  const result = await executeScheduledTask(taskId);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

// DELETE: pause job (?task_id=)
export async function DELETE(request: NextRequest) {
  const taskId = Number(request.nextUrl.searchParams.get("task_id"));
  if (!taskId) return NextResponse.json({ error: "task_id wajib" }, { status: 400 });
  const paused = pauseScheduled(taskId);
  return NextResponse.json({ success: paused });
}
