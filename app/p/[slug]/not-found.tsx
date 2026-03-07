import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "var(--ds-bg)" }}
    >
      <div
        className="rounded-[28px] p-12 text-center max-w-md w-full"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--ds-red-bg)" }}
        >
          <AlertCircle size={26} strokeWidth={1.8} style={{ color: "var(--ds-red-text)" }} />
        </div>
        <h1
          className="font-extrabold mb-2"
          style={{
            color: "var(--ds-text-primary)",
            fontSize: "22px",
            letterSpacing: "-0.04em",
          }}
        >
          Projet introuvable
        </h1>
        <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
          Ce lien ne correspond à aucun projet. Vérifiez l'URL ou contactez votre équipe.
        </p>
      </div>
    </div>
  );
}
