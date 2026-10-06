"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const THEMES = ["default", "modern", "classic", "minimalist"];
const BACKGROUNDS = ["office", "loft", "studio"];
const LIGHTING = ["bright", "warm", "cool"];

export default function KantorPage() {
  const [title, setTitle] = useState("Ujion TKA");
  const [ketua, setKetua] = useState("Joko");
  const [team, setTeam] = useState<string[]>(["Budi", "Sari", "Agus", "Rina"]);
  const [newMember, setNewMember] = useState("");
  const [autostart, setAutostart] = useState(false);
  const [theme, setTheme] = useState("default");
  const [background, setBackground] = useState("office");
  const [lighting, setLighting] = useState("bright");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/kantor").then(async (r) => {
      if (!r.ok) return;
      const c = await r.json();
      if (typeof c.title === "string") setTitle(c.title);
      if (c.names) {
        if (typeof c.names.ketua === "string") setKetua(c.names.ketua);
        if (Array.isArray(c.names.team)) setTeam(c.names.team);
      }
      if (typeof c.autostart === "boolean") setAutostart(c.autostart);
      if (typeof c.theme === "string") setTheme(c.theme);
      if (typeof c.background === "string") setBackground(c.background);
      if (typeof c.lighting === "string") setLighting(c.lighting);
    });
  }, []);

  async function save() {
    setSaved("");
    const res = await fetch("/api/kantor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        names: { ketua, team },
        autostart,
        theme,
        background,
        lighting,
      }),
    });
    setSaved(res.ok ? "Tersimpan ✓" : "Gagal menyimpan");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kantor"
        description="Kustomisasi tim, avatar 3D (di editor agent), dan tema."
        action={<Button onClick={save}>Simpan</Button>}
      />
      {saved && <p className="text-sm text-muted-foreground">{saved}</p>}
      <Tabs defaultValue="tim">
        <TabsList>
          <TabsTrigger value="tim">Tim</TabsTrigger>
          <TabsTrigger value="avatar">Avatar 3D</TabsTrigger>
          <TabsTrigger value="tema">Tema</TabsTrigger>
        </TabsList>
        <TabsContent value="tim">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>Tim</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="k-title">Nama kantor</Label>
                <Input id="k-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="k-ketua">Ketua</Label>
                <Input id="k-ketua" value={ketua} onChange={(e) => setKetua(e.target.value)} />
              </div>
              <div>
                <Label>Anggota tim</Label>
                <div className="space-y-1 mt-1">
                  {team.map((m) => (
                    <div key={m} className="flex items-center gap-2">
                      <span className="text-sm flex-1">{m}</span>
                      <Button size="sm" variant="outline" onClick={() => setTeam(team.filter((x) => x !== m))}>
                        Hapus
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Nama baru" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newMember.trim() && !team.includes(newMember.trim())) {
                        setTeam([...team, newMember.trim()]);
                        setNewMember("");
                      }
                    }}
                  >
                    Tambah
                  </Button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={autostart} onCheckedChange={(c) => setAutostart(c === true)} />
                autostart
              </label>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="avatar">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>Avatar 3D</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Avatar 3D diatur per-agent di halaman{" "}
                <a href="/agents" className="text-primary hover:underline">Agents → Edit → Avatar 3D</a>.
                Config tersimpan di field <span className="font-mono">avatar_3d</span> dan
                di-generate ke kantor-agent.json saat sync (10).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tema">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>Tema</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Palette</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v ?? "default")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEMES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Background</Label>
                <Select value={background} onValueChange={(v) => setBackground(v ?? "office")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BACKGROUNDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lighting</Label>
                <Select value={lighting} onValueChange={(v) => setLighting(v ?? "bright")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LIGHTING.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
