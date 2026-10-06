"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChatInterface, type ChatMessage } from "@/components/playground/chat-interface";

interface Session {
  id?: string;
  sessionID?: string;
  title?: string;
}

function sid(s: Session): string {
  return s.id || s.sessionID || "";
}

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<{ id: number; name: string; display_name: string }[]>([]);
  const [agent, setAgent] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agents").then(async (r) => {
      if (!r.ok) return;
      const rows = await r.json();
      setAgents(rows.map((x: { agent: { id: number; name: string; display_name: string } }) => x.agent));
    });
    loadSessions();
  }, []);

  async function loadSessions() {
    const res = await fetch("/api/playground/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : data.sessions || []);
    }
  }

  const loadMessages = useCallback(async (id: string) => {
    if (!id) return;
    const res = await fetch(`/api/playground/sessions/${id}/messages`);
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.messages || [];
      setMessages(Array.isArray(list) ? list : []);
    }
  }, []);

  useEffect(() => {
    loadMessages(sessionId);
  }, [sessionId, loadMessages]);

  async function newSession() {
    setError("");
    const res = await fetch("/api/playground/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: agent ? `playground:${agent}` : "playground" }),
    });
    if (res.ok) {
      const s = await res.json();
      setSessionId(sid(s));
      setMessages([]);
      loadSessions();
    } else {
      const data = await res.json();
      setError(data.error || "Gagal membuat sesi");
    }
  }

  async function handleSlash(cmd: string, args: string): Promise<boolean> {
    if (cmd === "/clear") {
      setMessages([]);
      await newSession();
      return true;
    }
    if (cmd === "/agent") {
      setAgent(args);
      setMessages([]);
      setSessionId("");
      return true;
    }
    if (cmd === "/model") {
      setError("Ganti model via halaman Agents (model per-agent).");
      return true;
    }
    // /skill /compact /share /fork diteruskan ke opencode
    if (!sessionId) return false;
    const map: Record<string, string> = {
      "/skill": "skill",
      "/compact": "compact",
      "/share": "share",
      "/fork": "fork",
    };
    const oc = map[cmd];
    if (!oc) return false;
    const res = await fetch(`/api/playground/sessions/${sessionId}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: oc, arguments: args }),
    });
    if (res.ok) loadMessages(sessionId);
    else {
      const data = await res.json();
      setError(data.error || "Command gagal");
    }
    return true;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setError("");

    if (text.startsWith("/")) {
      const [cmd, ...rest] = text.split(" ");
      setInput("");
      if (await handleSlash(cmd, rest.join(" "))) return;
      setError(`Command tidak dikenal: ${cmd}`);
      return;
    }

    let id = sessionId;
    if (!id) {
      const res = await fetch("/api/playground/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: agent ? `playground:${agent}` : "playground" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal membuat sesi");
        return;
      }
      const s = await res.json();
      id = sid(s);
      setSessionId(id);
      loadSessions();
    }

    setSending(true);
    setInput("");
    // Optimistic: tampilkan pesan user langsung
    setMessages((m) => [...m, { role: "user", parts: [{ type: "text", text }] }]);
    try {
      // Async: respons dibaca via polling agar UI tidak menggantung
      const res = await fetch(`/api/playground/sessions/${id}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: agent ? `[agent: ${agent}] ${text}` : text }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal mengirim");
      } else {
        // Poll 3x dengan jeda untuk respons cepat
        for (let i = 0; i < 3; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          await loadMessages(id);
        }
      }
    } finally {
      setSending(false);
    }
  }

  async function abort() {
    if (!sessionId) return;
    await fetch(`/api/playground/sessions/${sessionId}/abort`, { method: "POST" });
    loadMessages(sessionId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playground"
        description="Uji agent via opencode serve."
        action={
          <Button variant="outline" render={<Link href="/playground/batch">Batch execution</Link>} />
        }
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Config</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Agent</Label>
              <Select value={agent || "none"} onValueChange={(v) => setAgent(v === "none" ? "" : (v ?? ""))}>
                <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">default</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.name}>{a.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Session</Label>
              <Select value={sessionId || "new"} onValueChange={(v) => { setSessionId(v === "new" ? "" : (v ?? "")); setMessages([]); }}>
                <SelectTrigger><SelectValue placeholder="baru" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">baru</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={sid(s)} value={sid(s)}>
                      {(s.title || sid(s)).slice(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={newSession}>Sesi baru</Button>
              <Button size="sm" variant="outline" onClick={abort} disabled={!sessionId}>
                Abort
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Slash: /agent /model /clear /skill /compact /share
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="max-h-[50vh] overflow-y-auto">
              <ChatInterface messages={messages} />
            </div>
            <form onSubmit={send} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan atau /command..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !input.trim()}>
                {sending ? "..." : "Kirim"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
