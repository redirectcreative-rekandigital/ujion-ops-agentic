"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface TaskOpt {
  id: number;
  task_id: string;
  title: string;
}

interface AgentOpt {
  id: number;
  display_name: string;
}

interface BatchResult {
  agent_name: string;
  task_id: string;
  ok: boolean;
  session?: string;
  detail?: string;
}

export default function BatchPage() {
  const [tasks, setTasks] = useState<TaskOpt[]>([]);
  const [agents, setAgents] = useState<AgentOpt[]>([]);
  const [taskIds, setTaskIds] = useState<number[]>([]);
  const [agentIds, setAgentIds] = useState<number[]>([]);
  const [mode, setMode] = useState("sequential");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tasks").then(async (r) => {
      if (!r.ok) return;
      const rows = await r.json();
      setTasks(rows.map((x: { task: { id: number; task_id: string; title: string } }) => x.task));
    });
    fetch("/api/agents").then(async (r) => {
      if (!r.ok) return;
      const rows = await r.json();
      setAgents(rows.map((x: { agent: { id: number; display_name: string } }) => x.agent));
    });
  }, []);

  function toggle(list: number[], id: number, set: (v: number[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function start() {
    setError("");
    setResults([]);
    setBatchId("");
    if (taskIds.length === 0 || agentIds.length === 0) {
      setError("Pilih minimal 1 task dan 1 agent");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_ids: taskIds, agent_ids: agentIds, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Batch gagal");
      } else {
        setBatchId(data.id);
        setResults(data.results || []);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Batch Execution" description="Jalankan beberapa agent sekaligus. State in-memory (hilang saat restart)." />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Tasks ({taskIds.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-64 overflow-y-auto">
            {tasks.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={taskIds.includes(t.id)} onCheckedChange={(c) => toggle(taskIds, t.id, setTaskIds)} />
                <span className="font-mono text-xs">{t.task_id}</span> {t.title}
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Agents ({agentIds.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-64 overflow-y-auto">
            {agents.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={agentIds.includes(a.id)} onCheckedChange={(c) => toggle(agentIds, a.id, setAgentIds)} />
                {a.display_name}
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Mode</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Mode eksekusi</Label>
              <Select value={mode} onValueChange={(v) => setMode(v ?? "sequential")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">Sequential</SelectItem>
                  <SelectItem value="parallel">Parallel</SelectItem>
                  <SelectItem value="chain">Chain (task pertama, output diteruskan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={start} disabled={running}>
              {running ? "Berjalan..." : "Start batch"}
            </Button>
          </CardContent>
        </Card>
      </div>
      {batchId && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Hasil {batchId}</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {results.map((r, i) => (
              <p key={i} className="text-sm">
                <Badge variant={r.ok ? "default" : "destructive"}>{r.ok ? "✓" : "✗"}</Badge>{" "}
                {r.agent_name} × {r.task_id}
                <span className="text-muted-foreground text-xs"> {r.session || r.detail || ""}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
