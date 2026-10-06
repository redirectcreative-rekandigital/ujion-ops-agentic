"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";

export interface ChatPart {
  type?: string;
  text?: string;
  tool?: string;
  [k: string]: unknown;
}

export interface ChatMessage {
  role?: string;
  parts?: ChatPart[];
  [k: string]: unknown;
}

function ToolCallViewer({ part }: { part: ChatPart }) {
  return (
    <details className="rounded border bg-muted/50 p-2 text-xs">
      <summary className="cursor-pointer font-mono">
        🔧 {String(part.tool || part.type)}
      </summary>
      <pre className="whitespace-pre-wrap font-mono mt-1 max-h-48 overflow-y-auto">
        {JSON.stringify(part, null, 2)}
      </pre>
    </details>
  );
}

export function ChatInterface({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Belum ada pesan. Ketik pesan di bawah atau coba <span className="font-mono">/clear</span>.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {messages.map((m, i) => {
        const mine = m.role === "user";
        const parts = m.parts || [];
        return (
          <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <Card className={`max-w-[85%] ${mine ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="p-3 text-sm space-y-2">
                {parts.map((p, j) => {
                  if (p.type === "tool_call" || p.tool) {
                    return <ToolCallViewer key={j} part={p} />;
                  }
                  if (p.type === "reasoning") {
                    return (
                      <p key={j} className="italic opacity-70 text-xs">
                        {String(p.text || "")}
                      </p>
                    );
                  }
                  if (p.type === "error") {
                    return (
                      <p key={j} className="text-destructive text-xs font-mono">
                        {String(p.text || "error")}
                      </p>
                    );
                  }
                  if (p.type === "text" || p.text) {
                    return (
                      <div key={j} className="[&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:text-xs prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {String(p.text || "")}
                        </ReactMarkdown>
                      </div>
                    );
                  }
                  if (p.type === "file") {
                    return (
                      <details key={j} className="text-xs">
                        <summary className="cursor-pointer">📄 file change</summary>
                        <pre className="whitespace-pre-wrap font-mono mt-1 max-h-48 overflow-y-auto">
                          {JSON.stringify(p, null, 2).slice(0, 2000)}
                        </pre>
                      </details>
                    );
                  }
                  return null;
                })}
                {parts.length === 0 && (
                  <p className="whitespace-pre-wrap">{JSON.stringify(m).slice(0, 300)}</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
