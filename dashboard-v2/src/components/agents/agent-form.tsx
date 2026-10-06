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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ModelSelect } from "./model-select";
import { PermissionEditor, type PermMap } from "./permission-editor";
import { AvatarPicker, Avatar3DEditor } from "./avatar-picker";

export interface AgentFormData {
  id?: number;
  name: string;
  display_name: string;
  description: string;
  mode: "primary" | "subagent" | "all";
  model_id: number | null;
  prompt: string;
  permissions: string;
  color: string;
  avatar_url: string;
  avatar_3d: string;
  temperature: number;
  steps: string;
  hidden: boolean;
  is_active: boolean;
}

const EMPTY: AgentFormData = {
  name: "",
  display_name: "",
  description: "",
  mode: "subagent",
  model_id: null,
  prompt: "",
  permissions: "{}",
  color: "#4A90D9",
  avatar_url: "",
  avatar_3d: "",
  temperature: 0.3,
  steps: "",
  hidden: false,
  is_active: true,
};

export function AgentForm({ initial }: { initial?: Partial<AgentFormData> }) {
  const router = useRouter();
  const [form, setForm] = useState<AgentFormData>({ ...EMPTY, ...initial });
  const [subagents, setSubagents] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    fetch("/api/agents").then(async (r) => {
      if (!r.ok) return;
      const rows = await r.json();
      setSubagents(
        rows
          .filter((x: { agent: { mode: string; name: string; id: number } }) =>
            x.agent.mode === "subagent" && x.agent.id !== initial?.id)
          .map((x: { agent: { name: string } }) => x.agent.name)
      );
    });
  }, [initial?.id]);

  function set<K extends keyof AgentFormData>(k: K, v: AgentFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  let perms: PermMap = {};
  try {
    perms = form.permissions ? JSON.parse(form.permissions) : {};
  } catch {
    perms = {};
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      avatar_url: form.avatar_url || null,
      avatar_3d: form.avatar_3d || null,
      steps: form.steps === "" ? null : Number(form.steps),
      task_permissions: JSON.stringify(
        typeof perms.task === "object" ? perms.task : {}
      ),
    };
    try {
      const res = await fetch(
        isEdit ? `/api/agents/${initial!.id}` : "/api/agents",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        router.push("/agents");
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
        <CardHeader><CardTitle>Identitas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">name (unik, lowercase-hyphen)</Label>
              <Input
                id="name"
                value={form.name}
                disabled={isEdit}
                onChange={(e) => set("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="budi-konten"
                required
              />
            </div>
            <div>
              <Label htmlFor="display">display_name</Label>
              <Input
                id="display"
                value={form.display_name}
                onChange={(e) => set("display_name", e.target.value)}
                placeholder="Budi"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="desc">description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>mode</Label>
              <Select value={form.mode} onValueChange={(v) => set("mode", v as AgentFormData["mode"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">primary</SelectItem>
                  <SelectItem value="subagent">subagent</SelectItem>
                  <SelectItem value="all">all</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>model</Label>
              <ModelSelect value={form.model_id} onChange={(id) => set("model_id", id)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>System Prompt</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={form.prompt}
            onChange={(e) => set("prompt", e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder="Instruksi sistem agent (markdown)..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Permissions</CardTitle></CardHeader>
        <CardContent>
          <PermissionEditor
            value={perms}
            subagents={subagents}
            onChange={(v) => set("permissions", JSON.stringify(v))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tampilan & Perilaku</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AvatarPicker
            avatarUrl={form.avatar_url}
            color={form.color}
            displayName={form.display_name}
            onAvatarUrl={(v) => set("avatar_url", v)}
            onColor={(v) => set("color", v)}
          />
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="temp">temperature ({form.temperature.toFixed(1)})</Label>
              <input
                id="temp"
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={form.temperature}
                className="w-full"
                onChange={(e) => set("temperature", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="steps">steps (kosong = unlimited)</Label>
              <Input
                id="steps"
                type="number"
                min={1}
                value={form.steps}
                onChange={(e) => set("steps", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.hidden} onCheckedChange={(c) => set("hidden", c === true)} />
                hidden (dari autocomplete)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_active} onCheckedChange={(c) => set("is_active", c === true)} />
                active
              </label>
            </div>
          </div>
          <div>
            <Label>Avatar 3D (kantor-agent)</Label>
            <Avatar3DEditor
              value={form.avatar_3d}
              color={form.color}
              onChange={(v) => set("avatar_3d", v)}
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Simpan" : "Buat agent"}
      </Button>
    </form>
  );
}
