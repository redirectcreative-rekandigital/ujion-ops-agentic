import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { tasks, agents, approvals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";

function readOutputFile(outputPath: string | null): string | null {
  if (!outputPath || !outputPath.endsWith(".md")) return null;
  if (outputPath.includes("..")) return null;
  const workspace = process.env.UJION_OPS_PATH || process.env.WORKSPACE_PATH || "../";
  const full = path.resolve(workspace, outputPath);
  const allowed = ["tugas", "marketing", "maintenance"].map((d) =>
    path.resolve(workspace, d)
  );
  if (!allowed.some((d) => full.startsWith(d + path.sep))) return null;
  try {
    return fs.readFileSync(/*turbopackIgnore: true*/ full, "utf8").slice(0, 4000);
  } catch {
    return null;
  }
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  const task = rows[0];
  if (!task) notFound();

  let agent = null;
  if (task.agent_id) {
    const a = await db.select().from(agents).where(eq(agents.id, task.agent_id));
    agent = a[0] ?? null;
  }
  const history = await db
    .select()
    .from(approvals)
    .where(eq(approvals.task_id, task.id))
    .orderBy(desc(approvals.created_at));

  let deps: string[] = [];
  try {
    deps = task.dependencies ? JSON.parse(task.dependencies) : [];
  } catch {
    deps = [];
  }
  const outputPreview = readOutputFile(task.output_path);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`${task.task_id}: ${task.title}`}
        description={task.description || undefined}
        action={
          <Button
            variant="outline"
            className="gap-2"
            render={
              <Link href={`/tasks/${task.id}/edit`}>
                <Pencil className="w-4 h-4" /> Edit
              </Link>
            }
          />
        }
      />
      <Card>
        <CardHeader><CardTitle>Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{task.status}</Badge>
            {task.priority && <Badge variant="outline">{task.priority}</Badge>}
            {agent && <Badge variant="outline">👤 {agent.display_name}</Badge>}
          </div>
          <p><span className="text-muted-foreground">Dependensi:</span> {deps.join(", ") || "-"}</p>
          <p><span className="text-muted-foreground">Keluaran:</span> {task.output_path || "-"} {task.output_format ? `(${task.output_format})` : ""}</p>
          <p><span className="text-muted-foreground">Kanal:</span> {task.kanal || "-"} · <span className="text-muted-foreground">Jadwal:</span> {task.jadwal || "-"}</p>
          {task.schedule_cron && <p><span className="text-muted-foreground">Cron:</span> <span className="font-mono">{task.schedule_cron}</span></p>}
          {task.hasil && <p><span className="text-muted-foreground">Hasil:</span> {task.hasil}</p>}
        </CardContent>
      </Card>
      {outputPreview !== null && (
        <Card>
          <CardHeader><CardTitle>Preview keluaran ({task.output_path})</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap font-mono">{outputPreview}</pre>
          </CardContent>
        </Card>
      )}
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Riwayat approval</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {history.map((h) => (
              <p key={h.id}>
                <Badge variant="secondary">{h.status}</Badge>{" "}
                <span className="text-muted-foreground">{h.decided_at || h.created_at}</span>
                {h.reviewer_note && <span> — {h.reviewer_note}</span>}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
