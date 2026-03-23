"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

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
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0A0A0B 0%, #111827 100%)" }}
    >
      {/* Ambient circles */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "-100px",
          width: "350px", height: "350px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)",
          filter: "blur(50px)",
        }} />
      </div>

      {/* Card */}
      <div
        className="relative w-full"
        style={{
          maxWidth: "420px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "28px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #34D399, #06B6D4)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-koko.png"
              alt="Koko Prod"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
              }}
            />
            <span
              className="text-white font-extrabold text-xl hidden items-center justify-center w-full h-full"
              style={{ letterSpacing: "-0.04em" }}
            >
              K
            </span>
          </div>
          <p className="font-extrabold text-xl text-white" style={{ letterSpacing: "-0.03em" }}>
            Koko Prod
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Connectez-vous à votre espace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={15}
                strokeWidth={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-9 pr-4 text-sm rounded-xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={15}
                strokeWidth={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-9 pr-11 text-sm rounded-xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff size={15} strokeWidth={1.8} />
                  : <Eye size={15} strokeWidth={1.8} />
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] flex items-center justify-center gap-2 font-bold text-white transition-all disabled:opacity-70 mt-2"
            style={{ background: "#34D399", borderRadius: "14px" }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#10B981";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(52,211,153,0.25)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#34D399";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading && <Loader2 size={16} strokeWidth={2} className="animate-spin" />}
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
