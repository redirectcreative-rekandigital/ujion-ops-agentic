"use client";
import { useEffect, useState, useRef } from "react";
import { getEvents } from "@/lib/opencode/client";

export interface LiveLog {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export function useLiveLogs() {
  const [logs, setLogs] = useState<LiveLog[]>([]);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();

    // Berlangganan event dari opencode serve. Setiap event:
    //   1. Disimpan ke database via API POST /api/logs
    //   2. Ditambahkan ke aliran aktivitas real-time di UI (maks 100 terbaru)
    getEvents(
      (type, data) => {
        setConnected(true);

        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: typeof data.sessionID === "string" ? data.sessionID : null,
            agent_name: typeof data.agent === "string" ? data.agent : null,
            level: typeof data.level === "string" ? data.level : "info",
            message: typeof data.message === "string" ? data.message : type,
            extra: JSON.stringify(data),
          }),
        }).catch(() => {});

        setLogs((prev) => [...prev.slice(-99), { type, data, timestamp: new Date() }]);
      },
      abortRef.current.signal
    ).catch(() => setConnected(false));

    return () => abortRef.current?.abort();
  }, []);

  return { logs, connected };
}
