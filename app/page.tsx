import Link from "next/link";
import { FileText, Upload, MessageSquare, Zap } from "lucide-react";
import ClientAccessForm from "./ClientAccessForm";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: "var(--ds-bg)" }}
    >
      {/* ── Ambient circles ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "-100px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52,211,153,0.13) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "-140px",
            width: "460px",
            height: "460px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "20%",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 px-6 py-4"
        style={{
          background: "rgba(244,245,247,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #34D399, #06B6D4)",
                boxShadow: "0 0 0 1px rgba(52,211,153,0.3), 0 4px 12px rgba(52,211,153,0.25)",
              }}
            >
              <Zap size={15} strokeWidth={2} className="text-white" />
            </div>
            <span
              className="font-extrabold text-base"
              style={{ color: "var(--ds-text-primary)", letterSpacing: "-0.03em" }}
            >
              ClientPortal
            </span>
          </div>

          <Link
            href="/login"
            className="btn-glass text-xs"
            style={{ padding: "7px 14px", fontSize: "12px", color: "var(--ds-text-tertiary)" }}
          >
            Espace admin
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative max-w-4xl mx-auto w-full px-6 pt-20 pb-16 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
          style={{
            background: "var(--ds-mint-bg)",
            border: "1px solid rgba(52,211,153,0.2)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--ds-mint)" }}
          />
          <span
            className="text-[11px] font-bold"
            style={{ color: "var(--ds-mint-text)", letterSpacing: "0.04em" }}
          >
            Votre espace dédié
          </span>
        </div>

        <h1
          className="font-extrabold leading-[1.1] mb-6 text-balance"
          style={{
            fontSize: "clamp(34px, 5.5vw, 56px)",
            letterSpacing: "-0.04em",
            color: "var(--ds-text-primary)",
          }}
        >
          Bienvenue sur votre{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #34D399 20%, #06B6D4 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            espace projet
          </span>
        </h1>

        <p
          className="text-lg leading-relaxed max-w-xl mx-auto mb-10 text-balance"
          style={{ color: "var(--ds-text-secondary)" }}
        >
          Déposez vos fichiers, partagez votre brief et échangez avec notre équipe —
          tout au même endroit, en toute simplicité.
        </p>

        <ClientAccessForm />
      </section>

      {/* ── Comment ça marche ── */}
      <section className="relative max-w-4xl mx-auto w-full px-6 pb-16">
        <p
          className="text-center text-[11px] font-bold uppercase mb-8"
          style={{ color: "var(--ds-text-tertiary)", letterSpacing: "0.1em" }}
        >
          Comment ça marche
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Étape 1 */}
          <div
            className="relative rounded-[28px] p-7 flex flex-col gap-4 overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
            }}
          >
            {/* Numéro décoratif */}
            <span
              className="absolute top-4 right-5 font-extrabold select-none"
              style={{
                fontSize: "72px",
                lineHeight: 1,
                color: "#34D399",
                opacity: 0.12,
                letterSpacing: "-0.04em",
              }}
            >
              1
            </span>

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "var(--ds-mint-bg)" }}
            >
              <FileText size={20} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
            </div>

            <div>
              <h3
                className="font-bold mb-2"
                style={{ color: "var(--ds-text-primary)", fontSize: "16px", letterSpacing: "-0.02em" }}
              >
                Remplissez votre brief
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-secondary)" }}>
                Décrivez votre projet, votre cible, le ton souhaité et les livrables attendus
                via le formulaire guidé — ça ne prend que quelques minutes.
              </p>
            </div>
          </div>

          {/* Étape 2 */}
          <div
            className="relative rounded-[28px] p-7 flex flex-col gap-4 overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
            }}
          >
            <span
              className="absolute top-4 right-5 font-extrabold select-none"
              style={{
                fontSize: "72px",
                lineHeight: 1,
                color: "#34D399",
                opacity: 0.12,
                letterSpacing: "-0.04em",
              }}
            >
              2
            </span>

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(6,182,212,0.12))",
              }}
            >
              <Upload size={20} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
            </div>

            <div>
              <h3
                className="font-bold mb-2"
                style={{ color: "var(--ds-text-primary)", fontSize: "16px", letterSpacing: "-0.02em" }}
              >
                Déposez vos fichiers
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-secondary)" }}>
                Charte graphique, assets visuels, contenus texte — glissez-déposez tout
                ce dont nous avons besoin, organisé par catégorie.
              </p>
            </div>
          </div>

          {/* Étape 3 */}
          <div
            className="relative rounded-[28px] p-7 flex flex-col gap-4 overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
            }}
          >
            <span
              className="absolute top-4 right-5 font-extrabold select-none"
              style={{
                fontSize: "72px",
                lineHeight: 1,
                color: "#34D399",
                opacity: 0.12,
                letterSpacing: "-0.04em",
              }}
            >
              3
            </span>

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,0.10)" }}
            >
              <MessageSquare size={20} strokeWidth={1.8} style={{ color: "var(--ds-blue-text)" }} />
            </div>

            <div>
              <h3
                className="font-bold mb-2"
                style={{ color: "var(--ds-text-primary)", fontSize: "16px", letterSpacing: "-0.02em" }}
              >
                Échangeons ensemble
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-secondary)" }}>
                Un chat intégré pour poser vos questions, partager vos retours et
                suivre l&apos;avancement en temps réel — sans aller-retour par email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Réassurance ── */}
      <section className="relative max-w-4xl mx-auto w-full px-6 pb-20">
        <div
          className="rounded-[28px] px-8 py-7"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xl">🔒</span>
              <p className="text-sm font-bold" style={{ color: "var(--ds-text-primary)" }}>
                Vos fichiers sont sécurisés
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-tertiary)" }}>
                Stockage chiffré, accès privé via votre lien unique
              </p>
            </div>
            <div
              className="flex flex-col items-center gap-1.5 sm:border-x"
              style={{ borderColor: "rgba(0,0,0,0.06)" }}
            >
              <span className="text-xl">⚡</span>
              <p className="text-sm font-bold" style={{ color: "var(--ds-text-primary)" }}>
                Réponse sous 24h
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-tertiary)" }}>
                Notre équipe s&apos;engage à vous répondre rapidement
              </p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xl">🎯</span>
              <p className="text-sm font-bold" style={{ color: "var(--ds-text-primary)" }}>
                Un interlocuteur dédié
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-tertiary)" }}>
                Une seule personne suit votre projet de A à Z
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto px-6 py-6 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
        <p className="text-xs" style={{ color: "var(--ds-text-tertiary)" }}>
          © {new Date().getFullYear()} ClientPortal — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
