# 03 — PIN Authentication

## Cara Kerja

1. User buka dashboard → middleware cek session cookie
2. Tidak ada session → redirect ke `/login`
3. User input PIN (6 digit) → POST `/api/auth/login`
4. PIN cocok → buat JWT, set cookie `ujion_session` (HttpOnly, Secure)
5. Setiap request → middleware verify JWT
6. Logout → hapus cookie → redirect ke `/login`

## PIN Default

```
PIN: 245100
```

PIN disimpan di:
- Env var `DASHBOARD_PIN` (prioritas tertinggi)
- DB `settings` table key=`pin` (bisa diubah via Settings page)

## Implementasi

### src/lib/auth/session.ts

```typescript
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

const SESSION_COOKIE = "ujion_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;  // 7 hari (dalam detik)

export async function createSession(): Promise<string> {
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_DURATION)
    .sign(secret);
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export const sessionCookieName = SESSION_COOKIE;
export const sessionDuration = SESSION_DURATION;
```

### src/middleware.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifySession, sessionCookieName } from "@/lib/auth/session";

const PUBLIC_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // Kalau sudah login dan akses /login, redirect ke dashboard
    const token = request.cookies.get(sessionCookieName)?.value;
    if (token && pathname === "/login") {
      const valid = await verifySession(token);
      if (valid) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow API auth routes
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow static files dan Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const valid = await verifySession(token);
  if (!valid) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(sessionCookieName);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### src/app/api/auth/login/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSession, sessionCookieName, sessionDuration } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pin = String(body.pin || "").trim();

    if (!pin || pin.length !== 6) {
      return NextResponse.json({ error: "PIN harus 6 digit" }, { status: 400 });
    }

    // Get PIN from env or DB
    let validPin = process.env.DASHBOARD_PIN || "245100";
    const dbPin = await db.select().from(settings).where(eq(settings.key, "pin")).get();
    if (dbPin) {
      validPin = dbPin.value;
    }

    if (pin !== validPin) {
      return NextResponse.json({ error: "PIN salah" }, { status: 401 });
    }

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
```

### src/app/api/auth/logout/route.ts

```typescript
import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(sessionCookieName);
  return response;
}
```

### src/app/login/page.tsx

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "PIN salah");
        setPin("");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-[360px] shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Dashboard Ujion</CardTitle>
          <p className="text-sm text-muted-foreground">Masukkan PIN untuk masuk</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em]"
              autoFocus
              disabled={loading}
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || pin.length !== 6}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Layout untuk Login Page

Login page TIDAK menggunakan sidebar/header/footer. Buat separate layout:

### src/app/login/layout.tsx

```typescript
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
```

Dan pastikan root layout (`src/app/layout.tsx`) TIDAK render sidebar untuk route `/login`:

```typescript
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        {/* Layout untuk non-login routes akan di-handle di (dashboard) group */}
        {children}
      </body>
    </html>
  );
}
```

**Penting:** Gunakan **Route Groups** untuk memisahkan layout login dan dashboard:

```
src/app/
├── layout.tsx              # root layout (html, body, theme provider)
├── login/
│   ├── layout.tsx          # bare layout (no sidebar)
│   └── page.tsx
└── (dashboard)/            # route group dengan sidebar+header+footer
    ├── layout.tsx          # dashboard layout
    ├── page.tsx            # / dashboard utama
    ├── tasks/
    ├── agents/
    └── ...
```

### src/app/(dashboard)/layout.tsx

```typescript
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
```

## Logout Button

Di header (`app-header.tsx`), tambah tombol logout:

```typescript
async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  router.push("/login");
  router.refresh();
}
```

## Security Notes

- PIN 6 digit = 1 juta kombinasi. Tambahkan **rate limiting** sederhana:
  - Max 3 percobaan per 5 menit per IP
  - Lock 15 menit setelah 3 gagal
  - Implementasi: simpan di DB `settings` table atau in-memory Map

- JWT secret harus random 64+ karakter di production
- Cookie: `HttpOnly: true`, `Secure: true` (production), `SameSite: "lax"`
- Session duration: 7 hari (bisa diubah di `session.ts`)
