import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Tidak ada edit key — kalau salah, delete & add baru.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [deleted] = await db.delete(apiKeys).where(eq(apiKeys.id, Number(id))).returning();
  if (!deleted) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json({ success: true });
}
