import { NextResponse } from "next/server";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/ujion.db";

// GET: unduh file SQLite (backup manual).
export async function GET() {
  try {
    const buf = fs.readFileSync(/*turbopackIgnore: true*/ DB_PATH);
    return new Response(buf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="ujion-${new Date().toISOString().slice(0, 10)}.db"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "database tidak ditemukan" }, { status: 404 });
  }
}
