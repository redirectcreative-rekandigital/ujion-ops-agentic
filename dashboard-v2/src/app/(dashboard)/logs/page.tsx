"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LogTable, type LogRow } from "@/components/logs/log-table";
import { ActivityFeed } from "@/components/logs/activity-feed";
import { useLiveLogs } from "@/hooks/use-logs";

const ALL_LEVELS = ["info", "warn", "error", "debug", "tool"];

export default function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [levels, setLevels] = useState<string[]>(ALL_LEVELS);
  const [search, setSearch] = useState("");
  const [session, setSession] = useState("");
  const [agent, setAgent] = useState("all");
  const [agentOpts, setAgentOpts] = useState<string[]>([]);
  const { logs: live, connected } = useLiveLogs();

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (levels.length > 0 && levels.length < ALL_LEVELS.length) {
      params.set("level", levels.join(","));
    }
    if (search) params.set("search", search);
    if (session) params.set("session", session);
    if (agent !== "all") params.set("agent", agent);
    const res = await fetch(`/api/logs?${params.toString()}`);
    if (res.ok) setRows(await res.json());
  }, [levels, search, session, agent]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/agents").then(async (r) => {
      if (!r.ok) return;
      const rows = await r.json();
      setAgentOpts(rows.map((x: { agent: { display_name: string } }) => x.agent.display_name));
    });
  }, []);

  function toggleLevel(lvl: string, checked: boolean) {
    setLevels((prev) =>
      checked ? [...prev, lvl] : prev.filter((x) => x !== lvl)
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Logs" description="Filter di atas, tabel di bawah, live feed di kanan." />
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label htmlFor="log-q">Cari</Label>
              <Input id="log-q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="teks pesan..." />
            </div>
            <div>
              <Label htmlFor="log-s">Sesi</Label>
              <Input id="log-s" value={session} onChange={(e) => setSession(e.target.value)} placeholder="session id..." />
            </div>
            <div>
              <Label>Level</Label>
              <div className="flex gap-2 mt-1">
                {ALL_LEVELS.map((lvl) => (
                  <label key={lvl} className="flex items-center gap-1 text-xs">
                    <Checkbox checked={levels.includes(lvl)} onCheckedChange={(c) => toggleLevel(lvl, c === true)} />
                    {lvl}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Agent</Label>
              <Select value={agent} onValueChange={(v) => setAgent(v ?? "all")}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {agentOpts.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <LogTable rows={rows} />
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada log. Log terisi dari event opencode serve.</p>
          )}
        </div>
        <ActivityFeed logs={live} connected={connected} />
      </div>
    </div>
  );
}
