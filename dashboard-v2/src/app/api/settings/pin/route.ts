import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const pinSchema = z.object({
  old_pin: z.string().length(6),
  new_pin: z.string().regex(/^[0-9]{6}$/, "PIN baru harus 6 digit angka"),
});

export async function POST(request: NextRequest) {
  const parsed = pinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }

  let current = process.env.DASHBOARD_PIN || "245100";
  const rows = await db.select().from(settings).where(eq(settings.key, "pin"));
  const dbPin = rows[0];
  if (dbPin) current = dbPin.value;

  if (parsed.data.old_pin !== current) {
    return NextResponse.json({ error: "PIN lama salah" }, { status: 401 });
  }

  const now = new Date().toISOString();
  await db
    .insert(settings)
    .values({ key: "pin", value: parsed.data.new_pin, updated_at: now })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: parsed.data.new_pin, updated_at: now },
    });

  return NextResponse.json({ success: true });
}
