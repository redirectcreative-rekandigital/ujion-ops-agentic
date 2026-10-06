"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export interface LogRow {
  log: {
    id: number;
    session_id: string | null;
    level: string;
    message: string;
    extra: string | null;
    timestamp: string | null;
  };
  agent_name: string | null;
}

const LEVEL_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  info: "default",
  tool: "secondary",
  warn: "outline",
  error: "destructive",
  debug: "outline",
};

export function LogTable({ rows }: { rows: LogRow[] }) {
  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Sesi</TableHead>
          <TableHead>Pesan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.log.id}>
            <TableCell className="text-xs whitespace-nowrap">
              {r.log.timestamp ? r.log.timestamp.slice(0, 19).replace("T", " ") : "-"}
            </TableCell>
            <TableCell>
              <Badge variant={LEVEL_VARIANT[r.log.level] || "secondary"}>{r.log.level}</Badge>
            </TableCell>
            <TableCell>{r.agent_name ?? "-"}</TableCell>
            <TableCell className="font-mono text-xs">
              {r.log.session_id ? (
                <Link href={`/logs/${r.log.session_id}`} className="text-primary hover:underline">
                  {r.log.session_id.slice(0, 8)}
                </Link>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="max-w-md truncate" title={r.log.message}>
              {r.log.message}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
