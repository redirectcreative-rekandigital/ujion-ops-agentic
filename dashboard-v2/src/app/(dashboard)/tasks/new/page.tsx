import { PageHeader } from "@/components/shared/page-header";
import { TaskForm } from "@/components/tasks/task-form";

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buat Task" description="ID U-XX otomatis" />
      <TaskForm />
    </div>
  );
}
