"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export interface AgentListItem {
  agent: {
    id: number;
    name: string;
    display_name: string;
    description: string;
    mode: string;
    color: string;
    avatar_url: string | null;
    is_active: boolean | null;
  };
  model_provider: string | null;
  model_name: string | null;
  model_display: string | null;
}

export function AgentCard({ item }: { item: AgentListItem }) {
  const router = useRouter();
  const { agent } = item;

  async function handleDelete() {
    if (!confirm(`Hapus agent ${agent.name}?`)) return;
    const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Gagal menghapus");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div
          className="w-10 h-10 rounded-full grid place-items-center text-xl shrink-0"
          style={{ backgroundColor: agent.color + "33", border: `2px solid ${agent.color}` }}
        >
          {agent.avatar_url || agent.display_name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base truncate">{agent.display_name}</CardTitle>
          <p className="text-xs text-muted-foreground font-mono truncate">{agent.name}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{agent.mode}</Badge>
          {item.model_display && <Badge variant="outline">{item.model_display}</Badge>}
          <Badge variant={agent.is_active ? "default" : "destructive"}>
            {agent.is_active ? "active" : "inactive"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            render={<Link href={`/agents/${agent.id}`}>Detail</Link>}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            render={
              <Link href={`/agents/${agent.id}/edit`}>
                <Pencil className="w-3 h-3" /> Edit
              </Link>
            }
          />
          <Button size="sm" variant="destructive" onClick={handleDelete} className="gap-1">
            <Trash2 className="w-3 h-3" /> Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
