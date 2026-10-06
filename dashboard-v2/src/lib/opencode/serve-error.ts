import { NextResponse } from "next/server";

export function serveError(e: unknown) {
  return NextResponse.json(
    {
      error: e instanceof Error ? e.message : "opencode serve tidak terjangkau",
      hint: "Jalankan opencode serve di VPS (deploy/pasang-opencode-serve.sh)",
    },
    { status: 502 }
  );
}
