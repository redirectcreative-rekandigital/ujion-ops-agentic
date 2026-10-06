import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || "./data/ujion.db";

// POST: upload & ganti SQLite (dengan konfirmasi di UI).
// Backup otomatis file lama ke <db>.bak-TIMESTAMP sebelum diganti.
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("db");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file db wajib (form field 'db')" }, { status: 400 });
    }
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "file maksimal 100MB" }, { status: 400 });
    }
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const magic = Buffer.from(header).toString("utf8");
    if (!magic.startsWith("SQLite format 3")) {
      return NextResponse.json({ error: "bukan file SQLite valid" }, { status: 400 });
    }

    if (fs.existsSync(/*turbopackIgnore: true*/ DB_PATH)) {
      fs.copyFileSync(/*turbopackIgnore: true*/ DB_PATH, `${DB_PATH}.bak-${Date.now()}`);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(/*turbopackIgnore: true*/ DB_PATH, buf);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal import" },
      { status: 500 }
    );
  }
}
