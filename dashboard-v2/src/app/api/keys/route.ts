import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { encrypt, maskKey } from "@/lib/crypto";
import { z } from "zod";

const keySchema = z.object({
  provider: z.enum(["openai", "deepseek", "qwen", "mistral", "groq", "together"]),
  label: z.string().min(1),
  api_key: z.string().min(8),
});

// GET: list keys (masked, TIDAK PERNAH full key)
export async function GET() {
  const rows = await db.select({
    id: apiKeys.id,
    provider: apiKeys.provider,
    label: apiKeys.label,
    key_masked: apiKeys.key_masked,
    is_active: apiKeys.is_active,
    created_at: apiKeys.created_at,
  }).from(apiKeys);
  return NextResponse.json(rows);
}

// POST: add key (encrypt AES-256-GCM, simpan masked untuk display)
export async function POST(request: NextRequest) {
  const parsed = keySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid" }, { status: 400 });
  }
  const { provider, label, api_key } = parsed.data;
  const { encrypted, iv } = encrypt(api_key);
  const [created] = await db.insert(apiKeys).values({
    provider,
    label,
    key_encrypted: encrypted,
    key_iv: iv,
    key_masked: maskKey(api_key),
  }).returning();
  // Inject ke opencode.json via decrypt saat sync
  const { syncOpencodeJson } = await import("@/lib/opencode/config-sync");
  await syncOpencodeJson();
  return NextResponse.json({
    id: created.id,
    provider: created.provider,
    label: created.label,
    key_masked: created.key_masked,
  }, { status: 201 });
}
