"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface TaskItem {
  task: {
    id: number;
    task_id: string;
    title: string;
    status: string;
    priority: string | null;
    jadwal: string | null;
    dependencies: string | null;
  };
  agent_name: string | null;
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function TaskCard({ item }: { item: TaskItem }) {
  const { task } = item;
  let deps: string[] = [];
  try {
    deps = task.dependencies ? JSON.parse(task.dependencies) : [];
  } catch {
    deps = [];
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(task.id));
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <Link href={`/tasks/${task.id}`}>
        <Card className="hover:border-primary cursor-grab active:cursor-grabbing">
          <CardContent className="p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">{task.task_id}</span>
              {task.priority && (
                <Badge variant={PRIORITY_VARIANT[task.priority] || "secondary"} className="text-[10px]">
                  {task.priority}
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium leading-snug">{task.title}</p>
            <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              {item.agent_name && <span>👤 {item.agent_name}</span>}
              {task.jadwal && <span>📅 {task.jadwal}</span>}
              {deps.length > 0 && <span>⛓ {deps.join(", ")}</span>}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
