"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export const MCP_PRESETS = [
  { name: "google-sheets", display: "Google Sheets", type: "local", command: '["npx", "-y", "@modelcontextprotocol/server-google-sheets"]', url: "" },
  { name: "github", display: "GitHub", type: "local", command: '["npx", "-y", "@modelcontextprotocol/server-github"]', url: "" },
  { name: "filesystem", display: "Filesystem", type: "local", command: '["npx", "-y", "@modelcontextprotocol/server-filesystem", "/workspace"]', url: "" },
  { name: "brave-search", display: "Brave Search", type: "local", command: '["npx", "-y", "@modelcontextprotocol/server-brave-search"]', url: "" },
  { name: "sqlite", display: "SQLite", type: "local", command: '["npx", "-y", "@modelcontextprotocol/server-sqlite"]', url: "" },
  { name: "sentry", display: "Sentry", type: "remote", command: "", url: "https://mcp.sentry.dev/mcp" },
  { name: "context7", display: "Context7", type: "remote", command: "", url: "https://mcp.context7.com/mcp" },
  { name: "meta-ads", display: "Meta Ads [perlu verifikasi]", type: "remote", command: "", url: "" },
];

export function McpForm({ onSaved }: { onSaved: () => void }) {
  const [type, setType] = useState<"local" | "remote">("local");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [command, setCommand] = useState('["npx", "-y", ""]');
  const [url, setUrl] = useState("");
  const [environment, setEnvironment] = useState("{}");
  const [headers, setHeaders] = useState("{}");
  const [timeout, setTimeout] = useState("5000");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function applyPreset(p: (typeof MCP_PRESETS)[number]) {
    setName(p.name);
    setDisplayName(p.display);
    setType(p.type as "local" | "remote");
    if (p.command) setCommand(p.command);
    setUrl(p.url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          display_name: displayName,
          type,
          command: type === "local" ? command : null,
          url: type === "remote" ? url : null,
          headers,
          environment,
          enabled,
          timeout: Number(timeout) || 5000,
          description: description || null,
        }),
      });
      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menambah");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Preset (opsional — kredensial diisi manual)</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {MCP_PRESETS.map((p) => (
            <Button key={p.name} type="button" size="sm" variant="outline" onClick={() => applyPreset(p)}>
              {p.display}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="mcp-name">name</Label>
          <Input id="mcp-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="google-sheets" />
        </div>
        <div>
          <Label htmlFor="mcp-display">display_name</Label>
          <Input id="mcp-display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Google Sheets" />
        </div>
        <div>
          <Label>type</Label>
          <Select value={type} onValueChange={(v) => setType((v ?? "local") as "local" | "remote")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="local">local</SelectItem>
              <SelectItem value="remote">remote</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {type === "local" ? (
        <div>
          <Label htmlFor="mcp-cmd">command (JSON array)</Label>
          <Input id="mcp-cmd" value={command} onChange={(e) => setCommand(e.target.value)} className="font-mono text-xs" required />
        </div>
      ) : (
        <div>
          <Label htmlFor="mcp-url">url</Label>
          <Input id="mcp-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="mcp-env">environment (JSON)</Label>
          <Input id="mcp-env" value={environment} onChange={(e) => setEnvironment(e.target.value)} className="font-mono text-xs" />
        </div>
        <div>
          <Label htmlFor="mcp-headers">headers (JSON, remote)</Label>
          <Input id="mcp-headers" value={headers} onChange={(e) => setHeaders(e.target.value)} className="font-mono text-xs" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="mcp-timeout">timeout (ms)</Label>
          <Input id="mcp-timeout" type="number" value={timeout} onChange={(e) => setTimeout(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm mt-5">
          <Switch checked={enabled} onCheckedChange={(c) => setEnabled(c === true)} />
          enabled
        </label>
      </div>
      <div>
        <Label htmlFor="mcp-desc">description</Label>
        <Textarea id="mcp-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
      </Button>
    </form>
  );
}
