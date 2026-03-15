"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Target, Users, Mic2, Package, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AISummary {
  objectif?: string;
  cible?: string;
  ton?: string;
  livrables_attendus?: string;
  deadline?: string | null;
  points_attention?: string[];
  resume_echanges?: string;
}

function SummaryField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="rounded-2xl p-4 space-y-2 bg-white/5 border border-white/5">
      <div className="flex items-center gap-2">
        <span className="text-[var(--ds-mint-text)]">{icon}</span>
        <p className="text-[11px] font-bold uppercase text-[var(--ds-text-tertiary)] tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-sm border-0 bg-transparent leading-relaxed text-[var(--ds-text-primary)]">
        {value}
      </p>
    </div>
  );
}

export default function AISummaryTab({ 
  projectId, 
  initialSummary, 
  readOnly = false 
}: { 
  projectId: string; 
  initialSummary: AISummary | null;
  readOnly?: boolean;
}) {
  const [summary, setSummary] = useState<AISummary | null>(initialSummary);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    if (readOnly) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      toast.success("Résumé généré !");
    } catch {
      toast.error("Erreur lors de la génération.");
    } finally {
      setGenerating(false);
    }
  }

  if (!summary) {
    return (
      <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--ds-mint-bg)] text-[var(--ds-mint-text)]">
          <Sparkles size={28} strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-bold text-lg text-[var(--ds-text-primary)] tracking-tight">
            Aucun résumé généré
          </p>
          <p className="text-sm mt-1 max-w-sm text-[var(--ds-text-secondary)]">
            Gemini va analyser le brief et les échanges pour produire une synthèse du projet.
          </p>
        </div>
        {!readOnly && (
          <button
            className="btn-mint flex items-center gap-2"
            onClick={generate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
            ) : (
              <Sparkles size={16} strokeWidth={1.8} />
            )}
            {generating ? "Analyse en cours…" : "Générer le résumé AI"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--ds-mint-bg)] text-[var(--ds-mint-text)] shrink-0">
            <Sparkles size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-bold text-[var(--ds-text-primary)] tracking-tight">
              Résumé AI
            </p>
            <p className="text-xs text-[var(--ds-text-tertiary)]">
              Synthèse intelligente
            </p>
          </div>
        </div>
        {!readOnly && (
          <button
            className="btn-glass !rounded-full !px-4 !py-2 text-[11px]"
            onClick={generate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 size={13} strokeWidth={1.8} className="animate-spin" />
            ) : (
              <RefreshCw size={13} strokeWidth={1.8} />
            )}
            {generating ? "..." : "Regénérer"}
          </button>
        )}
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 gap-3">
        <SummaryField icon={<Target size={14} strokeWidth={1.8} />} label="Objectif" value={summary.objectif} />
        <SummaryField icon={<Users size={14} strokeWidth={1.8} />} label="Cible" value={summary.cible} />
        <SummaryField icon={<Mic2 size={14} strokeWidth={1.8} />} label="Ton" value={summary.ton} />
        <SummaryField icon={<Package size={14} strokeWidth={1.8} />} label="Livrables attendus" value={summary.livrables_attendus} />
        {summary.deadline && (
          <SummaryField icon={<Calendar size={14} strokeWidth={1.8} />} label="Deadline" value={summary.deadline} />
        )}
      </div>

      {/* Points d'attention */}
      {summary.points_attention && summary.points_attention.length > 0 && (
        <div className="rounded-[2rem] p-5 space-y-3 bg-[var(--ds-yellow-bg)] border border-[var(--ds-yellow)]/20 shadow-[0_0_20px_rgba(251,191,36,0.05)]">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} strokeWidth={1.8} className="text-[var(--ds-yellow-text)]" />
            <p className="text-[11px] font-bold uppercase text-[var(--ds-yellow-text)] tracking-wider">
              Points d&apos;attention
            </p>
          </div>
          <ul className="space-y-1.5">
            {summary.points_attention.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--ds-yellow-text)]">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--ds-yellow-text)] shadow-[0_0_8px_var(--ds-yellow-text)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
