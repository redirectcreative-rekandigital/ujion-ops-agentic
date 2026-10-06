"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

interface MsgPart {
  type?: string;
  text?: string;
  tool?: string;
  [k: string]: unknown;
}

interface Message {
  role?: string;
  parts?: MsgPart[];
  [k: string]: unknown;
}

export default function SessionViewerPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(async (p) => {
      setSessionId(p.sessionId);
      const res = await fetch(`/api/logs/${p.sessionId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.messages) ? data.messages : data.messages?.messages;
        setMessages(Array.isArray(list) ? list : []);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal memuat sesi");
      }
    });
  }, [params]);

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader title={`Sesi ${sessionId.slice(0, 8)}`} description={sessionId} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {messages === null && !error && (
        <p className="text-sm text-muted-foreground">Memuat riwayat pesan...</p>
      )}
      {messages?.map((m, i) => {
        const mine = m.role === "user";
        return (
          <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <Card className={`max-w-[80%] ${mine ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="p-3 text-sm space-y-1">
                {(m.parts || []).map((p, j) => {
                  if (p.type === "tool_call" || p.tool) {
                    return (
                      <details key={j} className="text-xs opacity-90">
                        <summary className="cursor-pointer">
                          🔧 {String(p.tool || p.type)}
                        </summary>
                        <pre className="whitespace-pre-wrap font-mono mt-1">
                          {JSON.stringify(p, null, 2).slice(0, 1000)}
                        </pre>
                      </details>
                    );
                  }
                  return <p key={j} className="whitespace-pre-wrap">{String(p.text ?? p.type ?? "")}</p>;
                })}
                {(!m.parts || m.parts.length === 0) && (
                  <p className="whitespace-pre-wrap">{JSON.stringify(m).slice(0, 500)}</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
