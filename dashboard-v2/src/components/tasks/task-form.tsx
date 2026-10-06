"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface AgentOpt {
  id: number;
  display_name: string;
}

interface TaskOpt {
  task_id: string;
}

export interface TaskFormData {
  id?: number;
  title: string;
  description: string;
  agent_id: number | null;
  status: string;
  priority: string;
  dependencies: string[];
  output_path: string;
  output_format: string;
  kanal: string;
  jadwal: string;
  hasil: string;
  schedule_cron: string;
}

const EMPTY: TaskFormData = {
  title: "",
  description: "",
  agent_id: null,
  status: "Belum",
  priority: "medium",
  dependencies: [],
  output_path: "",
  output_format: "",
  kanal: "",
  jadwal: "",
  hasil: "",
  schedule_cron: "",
};

export function TaskForm({ initial }: { initial?: Partial<TaskFormData> & { id?: number } }) {
  const router = useRouter();
  const [form, setForm] = useState<TaskFormData>({ ...EMPTY, ...initial } as TaskFormData);
  const [agents, setAgents] = useState<AgentOpt[]>([]);
  const [taskOpts, setTaskOpts] = useState<TaskOpt[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    fetch("/api/agents").then(async (r) => {
      if (r.ok) {
        const rows = await r.json();
        setAgents(rows.map((x: { agent: { id: number; display_name: string } }) => x.agent));
      }
    });
    fetch("/api/tasks").then(async (r) => {
      if (r.ok) {
        const rows = await r.json();
        setTaskOpts(
          rows
            .filter((x: { task: { id: number; task_id: string } }) => x.task.id !== initial?.id)
            .map((x: { task: { task_id: string } }) => ({ task_id: x.task.task_id }))
        );
      }
    });
  }, [initial?.id]);

  function set<K extends keyof TaskFormData>(k: K, v: TaskFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      agent_id: form.agent_id,
      dependencies: JSON.stringify(form.dependencies),
      output_path: form.output_path || null,
      output_format: form.output_format || null,
      kanal: form.kanal || null,
      jadwal: form.jadwal || null,
      hasil: form.hasil || null,
      schedule_cron: form.schedule_cron || null,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/tasks/${initial!.id}` : "/api/tasks",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        router.push("/tasks");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader><CardTitle>Task</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="t-title">title</Label>
            <Input id="t-title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="t-desc">description</Label>
            <Textarea id="t-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>agent</Label>
              <Select
                value={form.agent_id ? String(form.agent_id) : "none"}
                onValueChange={(v) => set("agent_id", v === "none" ? null : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Pilih agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa agent</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v ?? "Belum")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v ?? "medium")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>dependencies (task yang harus selesai dulu)</Label>
            <div className="flex flex-wrap gap-3 mt-1">
              {taskOpts.map((t) => (
                <label key={t.task_id} className="flex items-center gap-1 text-sm font-mono">
                  <Checkbox
                    checked={form.dependencies.includes(t.task_id)}
                    onCheckedChange={(c) =>
                      set(
                        "dependencies",
                        c === true
                          ? [...form.dependencies, t.task_id]
                          : form.dependencies.filter((x) => x !== t.task_id)
                      )
                    }
                  />
                  {t.task_id}
                </label>
              ))}
              {taskOpts.length === 0 && (
                <p className="text-xs text-muted-foreground">Belum ada task lain.</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t-out">output_path</Label>
              <Input id="t-out" value={form.output_path} onChange={(e) => set("output_path", e.target.value)} placeholder="marketing/konten/caption-ig.md" />
            </div>
            <div>
              <Label htmlFor="t-fmt">output_format</Label>
              <Input id="t-fmt" value={form.output_format} onChange={(e) => set("output_format", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="t-kanal">kanal</Label>
              <Input id="t-kanal" value={form.kanal} onChange={(e) => set("kanal", e.target.value)} placeholder="IG, TikTok, WA" />
            </div>
            <div>
              <Label htmlFor="t-jadwal">jadwal (deadline)</Label>
              <Input id="t-jadwal" type="date" value={form.jadwal} onChange={(e) => set("jadwal", e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="t-hasil">hasil (diisi setelah selesai)</Label>
            <Textarea id="t-hasil" value={form.hasil} onChange={(e) => set("hasil", e.target.value)} rows={2} />
          </div>
          <div>
            <Label htmlFor="t-cron">schedule (cron, opsional — cth: 0 9 * * 1 = Senin 09:00)</Label>
            <Input id="t-cron" value={form.schedule_cron} onChange={(e) => set("schedule_cron", e.target.value)} placeholder="0 9 * * 1" />
          </div>
        </CardContent>
      </Card>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Simpan" : "Buat task"}
      </Button>
    </form>
  );
}
