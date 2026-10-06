import { tasks, approvals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { DB } from "@/lib/db";

export type TaskStatus = "Belum" | "Jalan" | "Menunggu persetujuan" | "Selesai" | "Terblokir";

// Transisi valid (06-TASK-APPROVAL §4). Selesai terminal: buat task baru.
const ALLOWED: Record<TaskStatus, TaskStatus[]> = {
  "Belum": ["Jalan", "Terblokir"],
  "Jalan": ["Menunggu persetujuan", "Selesai"],
  "Menunggu persetujuan": ["Selesai", "Terblokir"],
  "Terblokir": ["Jalan"],
  "Selesai": [],
};

export function canTransition(from: string, to: string): boolean {
  if (from === to) return true;
  const allowed = ALLOWED[from as TaskStatus];
  return !!allowed && allowed.includes(to as TaskStatus);
}

export function transitionError(from: string, to: string): string {
  return `Transisi ${from} → ${to} tidak diizinkan`;
}

// Auto-generate task_id U-XX sequential dari max numerik.
export async function nextTaskId(database: DB): Promise<string> {
  const rows = await database.select({ task_id: tasks.task_id }).from(tasks);
  let max = 0;
  for (const r of rows) {
    const m = r.task_id.match(/^U-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `U-${String(max + 1).padStart(2, "0")}`;
}

// Saat task masuk "Menunggu persetujuan": buat approval pending (hindari duplikat).
export async function ensurePendingApproval(database: DB, taskDbId: number): Promise<void> {
  const existing = await database
    .select()
    .from(approvals)
    .where(and(eq(approvals.task_id, taskDbId), eq(approvals.status, "pending")));
  if (existing.length === 0) {
    await database.insert(approvals).values({ task_id: taskDbId, status: "pending" });
  }
}
