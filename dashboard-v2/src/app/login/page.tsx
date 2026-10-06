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
      <Card className="w-[min(360px,92vw)] shadow-2xl">
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
