"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiveLog } from "@/hooks/use-logs";

function describe(l: LiveLog): string {
  const d = l.data;
  if (typeof d.message === "string") return d.message;
  if (typeof d.text === "string") return d.text;
  return l.type;
}

export function ActivityFeed({ logs, connected }: { logs: LiveLog[]; connected: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Aktivitas real-time
          <Badge variant={connected ? "default" : "destructive"}>
            {connected ? "live" : "offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {connected ? "Menunggu event..." : "opencode serve belum terjangkau."}
          </p>
        )}
        {[...logs].reverse().map((l, i) => (
          <div key={`${l.timestamp.getTime()}-${i}`} className="text-xs space-y-0.5">
            <p className="text-muted-foreground">
              {l.timestamp.toLocaleTimeString("id-ID")}
            </p>
            <p className="leading-snug">{describe(l)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
