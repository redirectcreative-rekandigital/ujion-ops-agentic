import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, agents } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { createSession, sendMessageAsync } from "@/lib/opencode/client";
import { serveError } from "@/lib/opencode/serve-error";

type BatchMode = "sequential" | "parallel" | "chain";

interface BatchResult {
  agent_id: number;
  agent_name: string;
  task_id: string;
  ok: boolean;
  session?: string;
  detail?: string;
}

interface BatchState {
  id: string;
  mode: BatchMode;
  status: "running" | "done";
  results: BatchResult[];
  created_at: string;
}

// In-memory (sesuai keputusan: hilang saat restart, cukup untuk uji).
const batches = new Map<string, BatchState>();

const batchSchema = z.object({
  task_ids: z.array(z.number().int()).min(1),
  agent_ids: z.array(z.number().int()).min(1),
  mode: z.enum(["sequential", "parallel", "chain"]),
});

async function runOne(
  agentId: number,
  agentName: string,
  taskId: string,
  title: string,
  description: string | null,
  outputPath: string | null,
  extraInput?: string
): Promise<BatchResult> {
  try {
    const session = await createSession({ title: `${taskId}: ${title} (${agentName})` });
    const sid: string =
      (session as { id?: string }).id || (session as { sessionID?: string }).sessionID || "";
    const text =
      `Jalankan tugas ${taskId}: ${title}\n\nDeskripsi: ${description || "-"}\n\n` +
      `Output: ${outputPath || "sesuai konteks"}` +
      (extraInput ? `\n\nInput dari agent sebelumnya:\n${extraInput}` : "");
    await sendMessageAsync(sid, { parts: [{ type: "text", text }] });
    return { agent_id: agentId, agent_name: agentName, task_id: taskId, ok: true, session: sid };
  } catch (e) {
    return {
      agent_id: agentId,
      agent_name: agentName,
      task_id: taskId,
      ok: false,
      detail: e instanceof Error ? e.message : "unknown",
    };
  }
}

export async function POST(request: NextRequest) {
  const parsed = batchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "task_ids, agent_ids, mode wajib" }, { status: 400 });
  }
  const { task_ids, agent_ids, mode } = parsed.data;

  const taskRows = await db.select().from(tasks).where(inArray(tasks.id, task_ids));
  const agentRows = await db.select().from(agents).where(inArray(agents.id, agent_ids));
  if (taskRows.length !== task_ids.length) {
    return NextResponse.json({ error: "ada task id tidak dikenal" }, { status: 400 });
  }
  if (agentRows.length !== agent_ids.length) {
    return NextResponse.json({ error: "ada agent id tidak dikenal" }, { status: 400 });
  }

  // Cek koneksi serve dulu agar gagal cepat dengan pesan jelas
  try {
    await createSession({ title: "__healthcheck__" }).then(async (s) => {
      const { deleteSession } = await import("@/lib/opencode/client");
      const sid = (s as { id?: string }).id;
      if (sid) await deleteSession(sid);
    });
  } catch (e) {
    return serveError(e);
  }

  const batchId = `B-${Date.now().toString(36)}`;
  const state: BatchState = {
    id: batchId,
    mode,
    status: "running",
    results: [],
    created_at: new Date().toISOString(),
  };
  batches.set(batchId, state);

  if (mode === "chain") {
    // Chain: task pertama → agent-agent berurutan, output diteruskan sebagai input
    const task = taskRows[0];
    let extra: string | undefined;
    for (const agent of agentRows) {
      const r = await runOne(agent.id, agent.display_name, task.task_id, task.title, task.description, task.output_path, extra);
      state.results.push(r);
      extra = r.ok ? `(agent ${agent.display_name} selesai, session ${r.session})` : `(agent ${agent.display_name} gagal: ${r.detail})`;
    }
  } else if (mode === "sequential") {
    for (const agent of agentRows) {
      for (const task of taskRows) {
        state.results.push(
          await runOne(agent.id, agent.display_name, task.task_id, task.title, task.description, task.output_path)
        );
      }
    }
  } else {
    const all = await Promise.all(
      agentRows.flatMap((agent) =>
        taskRows.map((task) =>
          runOne(agent.id, agent.display_name, task.task_id, task.title, task.description, task.output_path)
        )
      )
    );
    state.results.push(...all);
  }

  state.status = "done";
  return NextResponse.json(state, { status: 201 });
}

export function getBatch(id: string): BatchState | undefined {
  return batches.get(id);
}
