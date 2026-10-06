import { NextRequest, NextResponse } from "next/server";
import { createSession, sessionCookieName, sessionDuration } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Rate limiting sederhana (in-memory, per instance):
// max 3 percobaan gagal per 5 menit per IP, kunci 15 menit setelah itu.
const WINDOW_MS = 5 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_FAIL = 3;

interface Attempt {
  fails: number[];
  lockedUntil: number;
}

const attempts = new Map<string, Attempt>();

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isLocked(ip: string): boolean {
  const a = attempts.get(ip);
  return !!a && Date.now() < a.lockedUntil;
}

function recordFail(ip: string): void {
  const now = Date.now();
  const a = attempts.get(ip) ?? { fails: [], lockedUntil: 0 };
  a.fails = [...a.fails, now].filter((t) => now - t < WINDOW_MS);
  if (a.fails.length >= MAX_FAIL) {
    a.lockedUntil = now + LOCK_MS;
    a.fails = [];
  }
  attempts.set(ip, a);
}

function recordSuccess(ip: string): void {
  attempts.delete(ip);
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    if (isLocked(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi 15 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const pin = String(body.pin || "").trim();

    if (!pin || pin.length !== 6) {
      return NextResponse.json({ error: "PIN harus 6 digit" }, { status: 400 });
    }

    // Get PIN from env or DB (DB menang bila ada, bisa diubah via Settings)
    let validPin = process.env.DASHBOARD_PIN || "245100";
    try {
      const rows = await db.select().from(settings).where(eq(settings.key, "pin"));
      const dbPin = rows[0];
      if (dbPin) {
        validPin = dbPin.value;
      }
    } catch {
      // DB belum siap (mis. migrasi belum jalan) — fallback ke env
    }

    if (pin !== validPin) {
      recordFail(ip);
      return NextResponse.json({ error: "PIN salah" }, { status: 401 });
    }

    recordSuccess(ip);

    // Create session
    const token = await createSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionDuration,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
