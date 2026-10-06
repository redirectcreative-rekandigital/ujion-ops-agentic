"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ApprovalItem {
  approval: {
    id: number;
    status: string;
    reviewer_note: string | null;
    created_at: string | null;
    decided_at: string | null;
  };
  task: {
    id: number;
    task_id: string;
    title: string;
    description: string | null;
    output_path: string | null;
  } | null;
  agent_name: string | null;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/approvals?status=${filter}`);
    if (res.ok) setItems(await res.json());
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: number, status: "approved" | "rejected") {
    const res = await fetch(`/api/approvals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewer_note: notes[id] || undefined }),
    });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error || "Gagal");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Antrian persetujuan. Approve → Selesai, Reject → Terblokir."
      />
      <div className="flex gap-2 items-center">
        <Label>Filter:</Label>
        <Select value={filter} onValueChange={(v) => setFilter(v ?? "pending")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="approved">approved</SelectItem>
            <SelectItem value="rejected">rejected</SelectItem>
            <SelectItem value="all">all</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {items.map((i) => (
          <Card key={i.approval.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{i.approval.status}</Badge>
                {i.task && (
                  <span className="font-mono text-xs font-bold text-primary">{i.task.task_id}</span>
                )}
                <span className="font-medium">{i.task?.title ?? "(task dihapus)"}</span>
                {i.agent_name && <span className="text-xs text-muted-foreground">· {i.agent_name}</span>}
              </div>
              {expanded === i.approval.id && i.task && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{i.task.description || "(tanpa deskripsi)"}</p>
                  {i.task.output_path && (
                    <p className="font-mono text-xs">keluaran: {i.task.output_path}</p>
                  )}
                </div>
              )}
              {i.task && (
                <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === i.approval.id ? null : i.approval.id)}>
                  {expanded === i.approval.id ? "Tutup detail" : "Lihat detail"}
                </Button>
              )}
              {i.approval.status === "pending" && i.task ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    placeholder="Catatan reviewer (opsional)"
                    value={notes[i.approval.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [i.approval.id]: e.target.value })}
                    className="max-w-xs"
                  />
                  <Button size="sm" onClick={() => decide(i.approval.id, "approved")}>
                    Setujui
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => decide(i.approval.id, "rejected")}>
                    Tolak
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {i.approval.decided_at || i.approval.created_at}
                  {i.approval.reviewer_note && ` — ${i.approval.reviewer_note}`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Antrian kosong.</p>
        )}
      </div>
    </div>
  );
}
