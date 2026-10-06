"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface KeyItem {
  id: number;
  provider: string;
  label: string;
  key_masked: string;
  is_active: boolean | null;
  created_at: string | null;
}

const PROVIDERS = ["openai", "deepseek", "qwen", "mistral", "groq", "together"];

export default function KeysPage() {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/keys");
    if (res.ok) setKeys(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, label, api_key: apiKey }),
    });
    if (res.ok) {
      setOpen(false);
      setLabel("");
      setApiKey("");
      load();
    } else {
      const data = await res.json();
      setError(data.error || "Gagal menambah");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus key ini?")) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Vault terenkripsi (AES-256-GCM). Key tidak pernah ditampilkan penuh."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Tambah key
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader><DialogTitle>Tambah API key</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <Label>provider</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v ?? "openai")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="k-label">label</Label>
                  <Input id="k-label" value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="OpenAI Production" />
                </div>
                <div>
                  <Label htmlFor="k-key">API key</Label>
                  <Input id="k-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required placeholder="sk-..." />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit">Simpan terenkripsi</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Key (masked)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((k) => (
            <TableRow key={k.id}>
              <TableCell><Badge variant="secondary">{k.provider}</Badge></TableCell>
              <TableCell>{k.label}</TableCell>
              <TableCell className="font-mono text-xs">{k.key_masked}</TableCell>
              <TableCell>{k.is_active ? "active" : "inactive"}</TableCell>
              <TableCell>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(k.id)}>
                  Hapus
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      {keys.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada key tersimpan.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Tidak ada edit key — kalau salah, hapus lalu tambah baru.
      </p>
    </div>
  );
}
