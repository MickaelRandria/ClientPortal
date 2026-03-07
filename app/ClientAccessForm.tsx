"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function ClientAccessForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slug = code.trim();
    if (!slug) return;
    router.push(`/p/${slug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap justify-center">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Votre code d'accès (ex : abc12345)"
        className="text-sm outline-none rounded-[14px] px-4 py-3 w-64"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(0,0,0,0.08)",
          color: "var(--ds-text-primary)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.04)",
        }}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="btn-mint flex items-center gap-2"
        style={{ padding: "12px 20px", fontSize: "13px", opacity: code.trim() ? 1 : 0.5 }}
      >
        Accéder à mon espace
        <ArrowRight size={14} strokeWidth={2} />
      </button>
    </form>
  );
}
