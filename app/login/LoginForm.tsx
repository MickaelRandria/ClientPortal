"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import GlassCard from "@/components/GlassCard";
import { Loader2, Lock, Mail } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "var(--ds-bg)" }}
    >
      <GlassCard
        static
        className="p-10 w-full max-w-md"
        style={{ borderRadius: "28px" }}
      >
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-7 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #34D399, #06B6D4)",
            boxShadow:
              "0 0 0 1px rgba(52,211,153,0.2), 0 4px 16px rgba(52,211,153,0.25)",
          }}
        >
          <span
            className="text-white font-extrabold text-lg select-none"
            style={{ letterSpacing: "-0.04em" }}
          >
            CP
          </span>
        </div>

        <h1
          className="text-3xl font-extrabold text-center mb-1"
          style={{ color: "var(--ds-text-primary)", letterSpacing: "-0.04em" }}
        >
          Connexion admin
        </h1>
        <p
          className="text-sm text-center mb-8"
          style={{ color: "var(--ds-text-secondary)" }}
        >
          Accès réservé à l&apos;équipe
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold uppercase" style={{ letterSpacing: "0.06em", color: "var(--ds-text-secondary)" }}>
              Email
            </Label>
            <div className="relative">
              <Mail
                size={15}
                strokeWidth={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--ds-text-tertiary)" }}
              />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                style={{ borderRadius: "14px" }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold uppercase" style={{ letterSpacing: "0.06em", color: "var(--ds-text-secondary)" }}>
              Mot de passe
            </Label>
            <div className="relative">
              <Lock
                size={15}
                strokeWidth={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--ds-text-tertiary)" }}
              />
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                style={{ borderRadius: "14px" }}
              />
            </div>
          </div>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-bold"
              style={{
                background: "var(--ds-red-bg)",
                color: "var(--ds-red-text)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-mint w-full flex items-center justify-center gap-2 mt-2"
            style={{ padding: "12px 20px" }}
          >
            {loading && <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />}
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </GlassCard>
    </main>
  );
}
