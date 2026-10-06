"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { McpForm } from "@/components/mcp/mcp-form";
import { Plus } from "lucide-react";

interface McpServer {
  id: number;
  name: string;
  display_name: string;
  type: string;
  command: string | null;
  url: string | null;
  enabled: boolean | null;
}

export default function McpPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/mcp");
    if (res.ok) setServers(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(id: number, enabled: boolean) {
    await fetch(`/api/mcp/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    load();
  }

  async function test(id: number) {
    setTesting(id);
    try {
      const res = await fetch(`/api/mcp/${id}/test`, { method: "POST" });
      const data = await res.json();
      setResults((r) => ({
        ...r,
        [id]: data.reachable ? "connected ✓" : `gagal: ${data.error || "unknown"}`,
      }));
    } catch {
      setResults((r) => ({ ...r, [id]: "gagal: network error" }));
    } finally {
      setTesting(null);
    }
  }

  async function remove(id: number) {
    if (!confirm("Hapus MCP server ini?")) return;
    await fetch(`/api/mcp/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="MCP"
        description={`${servers.length} server. Kredensial via {env:} di opencode.json (10).`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Tambah MCP
                </Button>
              }
            />
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Tambah MCP server</DialogTitle></DialogHeader>
              <McpForm onSaved={() => { setOpen(false); load(); }} />
            </DialogContent>
          </Dialog>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Command/URL</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>Test</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <span className="font-mono text-xs font-bold">{s.name}</span>
                <p className="text-xs text-muted-foreground">{s.display_name}</p>
              </TableCell>
              <TableCell><Badge variant="secondary">{s.type}</Badge></TableCell>
              <TableCell className="font-mono text-[11px] max-w-60 truncate">
                {s.type === "local" ? s.command : s.url}
              </TableCell>
              <TableCell>
                <Switch checked={!!s.enabled} onCheckedChange={(c) => toggle(s.id, c === true)} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={testing === s.id} onClick={() => test(s.id)}>
                    {testing === s.id ? "..." : "Test"}
                  </Button>
                  {results[s.id] && <span className="text-xs text-muted-foreground">{results[s.id]}</span>}
                </div>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>
                  Hapus
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {servers.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada MCP server. Tambah dari preset.</p>
      )}
    </div>
  );
}
