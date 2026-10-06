"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [importing, setImporting] = useState(false);

  async function changePin(e: React.FormEvent) {
    e.preventDefault();
    if (newPin !== confirmPin) {
      toast.error("Konfirmasi PIN tidak sama");
      return;
    }
    const res = await fetch("/api/settings/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ old_pin: oldPin, new_pin: newPin }),
    });
    if (res.ok) {
      toast.success("PIN berhasil diubah");
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal mengubah PIN");
    }
  }

  async function importDb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Ganti database dengan file ini? DB lama di-backup otomatis (.bak-TIMESTAMP).")) {
      e.target.value = "";
      return;
    }
    setImporting(true);
    try {
      const form = new FormData();
      form.set("db", file);
      const res = await fetch("/api/settings/import", { method: "POST", body: form });
      if (res.ok) toast.success("Database diganti. Muat ulang halaman.");
      else {
        const data = await res.json();
        toast.error(data.error || "Gagal import");
      }
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="PIN, tema, opencode, backup." />

      <Card>
        <CardHeader><CardTitle>Ubah PIN</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePin} className="space-y-3">
            <div>
              <Label htmlFor="pin-old">PIN lama</Label>
              <Input id="pin-old" type="password" inputMode="numeric" maxLength={6} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pin-new">PIN baru (6 digit)</Label>
                <Input id="pin-new" type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} required />
              </div>
              <div>
                <Label htmlFor="pin-confirm">Konfirmasi PIN baru</Label>
                <Input id="pin-confirm" type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} required />
              </div>
            </div>
            <Button type="submit">Ubah PIN</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tema</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          {(["dark", "light", "system"] as const).map((t) => (
            <Button key={t} variant={theme === t ? "default" : "outline"} onClick={() => setTheme(t)}>
              {t}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>opencode serve</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Status koneksi terlihat di badge header. Pasang permanen di VPS:</p>
          <p className="font-mono text-xs">dashboard-v2/deploy/pasang-opencode-serve.sh</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Backup database</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
          <Button variant="outline" onClick={() => { window.location.href = "/api/settings/export"; }}>
            Export (unduh .db)
          </Button>
          <div>
            <Label htmlFor="import-db" className="sr-only">Import database</Label>
            <Input id="import-db" type="file" accept=".db" onChange={importDb} disabled={importing} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tentang</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ujion TKA Dashboard v2.0 · Next.js 16 · SQLite + Drizzle · opencode v2
        </CardContent>
      </Card>
    </div>
  );
}
