"use client";

import { useState } from "react";
import { TaskCard, type TaskItem } from "./task-card";

export const COLUMNS = ["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"];

export function TaskBoard({
  items,
  onMoved,
}: {
  items: TaskItem[];
  onMoved: () => void;
}) {
  const [error, setError] = useState("");
  const [over, setOver] = useState<string | null>(null);

  async function handleDrop(status: string, e: React.DragEvent) {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setError("");
    const res = await fetch(`/api/tasks/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      onMoved();
    } else {
      const data = await res.json();
      setError(data.error || "Gagal memindah");
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const list = items.filter((i) => i.task.status === col);
          return (
            <div
              key={col}
              className={`rounded-lg border p-2 min-h-40 ${over === col ? "border-primary bg-primary/5" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOver(col);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => handleDrop(col, e)}
            >
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {col} ({list.length})
              </h4>
              <div className="space-y-2">
                {list.map((item) => (
                  <TaskCard key={item.task.id} item={item} />
                ))}
                {list.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
