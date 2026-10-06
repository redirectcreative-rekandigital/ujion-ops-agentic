import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { TaskForm } from "@/components/tasks/task-form";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  const task = rows[0];
  if (!task) notFound();

  let deps: string[] = [];
  try {
    deps = task.dependencies ? JSON.parse(task.dependencies) : [];
  } catch {
    deps = [];
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${task.task_id}`} description={task.title} />
      <TaskForm
        initial={{
          id: task.id,
          title: task.title,
          description: task.description || "",
          agent_id: task.agent_id,
          status: task.status,
          priority: task.priority || "medium",
          dependencies: deps,
          output_path: task.output_path || "",
          output_format: task.output_format || "",
          kanal: task.kanal || "",
          jadwal: task.jadwal || "",
          hasil: task.hasil || "",
          schedule_cron: task.schedule_cron || "",
        }}
      />
    </div>
  );
}
