"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TaskBoard } from "@/components/tasks/task-board";
import type { TaskItem } from "@/components/tasks/task-card";
import { Plus } from "lucide-react";

interface InboxItem {
  id: number;
  content: string;
  source: string | null;
  status: string | null;
  category: string | null;
}

export default function TasksPage() {
  const [items, setItems] = useState<TaskItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [newInbox, setNewInbox] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (res.ok) setItems(await res.json());
  }, [search, statusFilter]);

  const loadInbox = useCallback(async () => {
    const res = await fetch("/api/inbox");
    if (res.ok) setInbox(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  async function addInbox(e: React.FormEvent) {
    e.preventDefault();
    if (!newInbox.trim()) return;
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newInbox.trim() }),
    });
    if (res.ok) {
      setNewInbox("");
      loadInbox();
    }
  }

  async function pilah(id: number, status: string) {
    await fetch("/api/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadInbox();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${items.length} task`}
        action={
          <Button
            className="gap-2"
            render={
              <Link href="/tasks/new">
                <Plus className="w-4 h-4" /> Buat task
              </Link>
            }
          />
        }
      />
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="inbox">Inbox ({inbox.filter((i) => i.status === "Belum dipilah").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="space-y-4">
          <TaskBoard items={items} onMoved={load} />
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label htmlFor="q">Cari</Label>
              <Input id="q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="U-01 / judul..." />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {["Belum", "Jalan", "Menunggu persetujuan", "Selesai", "Terblokir"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.task.id}>
                  <TableCell className="font-mono font-bold text-primary">
                    <Link href={`/tasks/${i.task.id}`}>{i.task.task_id}</Link>
                  </TableCell>
                  <TableCell>{i.task.title}</TableCell>
                  <TableCell>{i.agent_name ?? "-"}</TableCell>
                  <TableCell><Badge variant="secondary">{i.task.status}</Badge></TableCell>
                  <TableCell>{i.task.priority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </TabsContent>
        <TabsContent value="inbox" className="space-y-4">
          <form onSubmit={addInbox} className="flex gap-2">
            <Textarea
              value={newInbox}
              onChange={(e) => setNewInbox(e.target.value)}
              placeholder="Paste link, tren, ide... (kiriman bebas ke Joko)"
              rows={2}
              className="flex-1"
            />
            <Button type="submit">Kirim</Button>
          </form>
          <div className="space-y-2">
            {inbox.map((m) => (
              <div key={m.id} className="rounded-lg border p-3 space-y-1">
                <p className="text-sm">{m.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{m.status}</Badge>
                  {m.category && <span>· {m.category}</span>}
                  {m.status === "Belum dipilah" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => pilah(m.id, "Dipilah")}>
                        Pilah
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => pilah(m.id, "Diteruskan")}>
                        Teruskan ke agent
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {inbox.length === 0 && (
              <p className="text-sm text-muted-foreground">Inbox kosong. Kirim apa saja ke Joko.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
