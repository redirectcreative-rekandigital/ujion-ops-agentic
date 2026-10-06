"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export function AgentSkills({ agentId }: { agentId: number }) {
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [assigned, setAssigned] = useState<number[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}/skills`);
    if (res.ok) {
      const data = await res.json();
      setSkills(data.skills);
      setAssigned(data.assigned_ids);
    }
  }, [agentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(skillId: number, checked: boolean) {
    const next = checked ? [...assigned, skillId] : assigned.filter((x) => x !== skillId);
    setAssigned(next);
    await fetch(`/api/agents/${agentId}/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill_ids: next }),
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Skills ({assigned.length})</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada skill di registry.</p>
        )}
        {skills.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={assigned.includes(s.id)} onCheckedChange={(c) => toggle(s.id, c === true)} />
            <span className="font-mono text-xs">{s.name}</span>
          </label>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          opencode auto-discover skill dari .opencode/skills/; daftar ini untuk dokumentasi per-agent. <Badge variant="outline">sync di 10</Badge>
        </p>
      </CardContent>
    </Card>
  );
}

export function AgentMcp({ agentId }: { agentId: number }) {
  const [servers, setServers] = useState<{ id: number; name: string }[]>([]);
  const [assigned, setAssigned] = useState<number[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}/mcp`);
    if (res.ok) {
      const data = await res.json();
      setServers(data.servers);
      setAssigned(data.assigned_ids);
    }
  }, [agentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(mcpId: number, checked: boolean) {
    const next = checked ? [...assigned, mcpId] : assigned.filter((x) => x !== mcpId);
    setAssigned(next);
    await fetch(`/api/agents/${agentId}/mcp`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mcp_ids: next }),
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>MCP Servers ({assigned.length})</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {servers.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada MCP server.</p>
        )}
        {servers.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={assigned.includes(s.id)} onCheckedChange={(c) => toggle(s.id, c === true)} />
            <span className="font-mono text-xs">{s.name}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
