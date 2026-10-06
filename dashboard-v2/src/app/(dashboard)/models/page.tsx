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
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

interface Model {
  id: number;
  provider: string;
  model_id: string;
  display_name: string;
  context_window: number | null;
  cost_per_1k_input: number | null;
  cost_per_1k_output: number | null;
  is_default: boolean | null;
  capabilities: string | null;
}

const PROVIDERS = ["openai", "deepseek", "qwen", "mistral", "groq", "together"];

const EMPTY = {
  provider: "openai",
  model_id: "",
  display_name: "",
  context_window: "",
};

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/models");
    if (res.ok) setModels(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  const shown = filter === "all" ? models : models.filter((m) => m.provider === filter);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        context_window: form.context_window === "" ? null : Number(form.context_window),
      }),
    });
    if (res.ok) {
      setOpen(false);
      setForm(EMPTY);
      load();
    } else {
      const data = await res.json();
      setError(data.error || "Gagal menambah");
    }
  }

  async function setDefault(id: number) {
    await fetch(`/api/models/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus model ini?")) return;
    const res = await fetch(`/api/models/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Gagal menghapus");
    }
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Models"
        description={`${models.length} model terdaftar`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Tambah model
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader><DialogTitle>Tambah model</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <Label>provider</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v ?? "openai" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="m-id">model_id</Label>
                  <Input id="m-id" value={form.model_id} onChange={(e) => setForm({ ...form, model_id: e.target.value })} required placeholder="gpt-4o" />
                </div>
                <div>
                  <Label htmlFor="m-name">display_name</Label>
                  <Input id="m-name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required placeholder="GPT-4o" />
                </div>
                <div>
                  <Label htmlFor="m-ctx">context_window</Label>
                  <Input id="m-ctx" type="number" value={form.context_window} onChange={(e) => setForm({ ...form, context_window: e.target.value })} placeholder="128000" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="flex gap-2 items-center">
        <Label>Filter provider:</Label>
        <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Model ID</TableHead>
            <TableHead>Display</TableHead>
            <TableHead>Context</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((m) => (
            <TableRow key={m.id}>
              <TableCell><Badge variant="secondary">{m.provider}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{m.model_id}</TableCell>
              <TableCell>{m.display_name}</TableCell>
              <TableCell>{m.context_window?.toLocaleString("id-ID") ?? "-"}</TableCell>
              <TableCell>
                <Switch checked={!!m.is_default} onCheckedChange={() => setDefault(m.id)} />
              </TableCell>
              <TableCell>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>
                  Hapus
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
