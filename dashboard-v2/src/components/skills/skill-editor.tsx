"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { SkillPreview } from "./skill-preview";

export interface SkillFormData {
  id?: number;
  name: string;
  description: string;
  content: string;
  license: string;
  compatibility: string;
  metadata: string;
}

const EMPTY: SkillFormData = {
  name: "",
  description: "",
  content: "",
  license: "",
  compatibility: "opencode",
  metadata: "{}",
};

export function SkillEditor({ initial }: { initial?: Partial<SkillFormData> & { id?: number } }) {
  const router = useRouter();
  const [form, setForm] = useState<SkillFormData>({ ...EMPTY, ...initial } as SkillFormData);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial?.id;

  function set<K extends keyof SkillFormData>(k: K, v: SkillFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      license: form.license || null,
    };
    try {
      const res = await fetch(isEdit ? `/api/skills/${initial!.id}` : "/api/skills", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/skills");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
        <div>
          <Label htmlFor="s-name">name (kebab-case)</Label>
          <Input
            id="s-name"
            value={form.name}
            disabled={isEdit}
            onChange={(e) => set("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="audit-keamanan"
            required
          />
        </div>
        <div>
          <Label htmlFor="s-compat">compatibility</Label>
          <Input id="s-compat" value={form.compatibility} onChange={(e) => set("compatibility", e.target.value)} />
        </div>
      </div>
      <div className="max-w-3xl">
        <Label htmlFor="s-desc">description (1-1024 chars)</Label>
        <Textarea id="s-desc" value={form.description} onChange={(e) => set("description", e.target.value)} required rows={2} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="s-content">content (markdown, tanpa frontmatter)</Label>
            <Textarea
              id="s-content"
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={20}
              className="font-mono text-xs"
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const s = el.selectionStart ?? 0;
                  const v = el.value;
                  const nv = v.slice(0, s) + "  " + v.slice(el.selectionEnd ?? s);
                  set("content", nv);
                  requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
                }
              }}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="s-lic">license (opsional)</Label>
              <Input id="s-lic" value={form.license} onChange={(e) => set("license", e.target.value)} placeholder="MIT" />
            </div>
            <div>
              <Label htmlFor="s-meta">metadata (JSON)</Label>
              <Input id="s-meta" value={form.metadata} onChange={(e) => set("metadata", e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        </div>
        <div>
          <Label>Live preview</Label>
          <div className="mt-1">
            <SkillPreview content={form.content} name={form.name} />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Simpan" : "Buat skill"}
      </Button>
    </form>
  );
}
