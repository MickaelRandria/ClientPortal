"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import { FileText, FolderOpen, MessageSquare, Send, Plus, X } from "lucide-react";
import FilesTab, { type UploadRecord } from "./FilesTab";
import Chat, { type Message } from "@/components/Chat";

/* ── Constants ───────────────────────────────────────────────────── */

const STATUS_BADGE = {
  active:    { label: "Projet Actif",   bg: "var(--ds-mint-bg)",           color: "var(--ds-mint-text)" },
  draft:     { label: "En préparation", bg: "rgba(255,255,255,0.05)",       color: "var(--ds-text-secondary)" },
  completed: { label: "Projet Terminé", bg: "var(--ds-blue-bg)",            color: "var(--ds-blue-text)" },
} as const;

const BRIEF_STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: "Brouillon",                      bg: "rgba(156,163,175,0.12)", color: "#9CA3AF" },
  submitted: { label: "Envoyé · En attente de retour",  bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
  reviewed:  { label: "Retours reçus · À modifier",     bg: "rgba(59,130,246,0.12)",  color: "#3B82F6" },
  approved:  { label: "Brief validé ✅",                 bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
};

const FORMAT_OPTIONS = [
  "16:9 (Paysage)",
  "9:16 (Vertical/Stories)",
  "4:3 (Standard)",
  "1:1 (Carré)",
  "Autre (préciser dans les notes)",
];

const NAV_ITEMS = [
  { id: "brief",    label: "Brief",    emoji: "📋" },
  { id: "fichiers", label: "Fichiers", emoji: "📁" },
  { id: "messages", label: "Messages", emoji: "💬" },
  { id: "demande",  label: "Demande",  emoji: "✨" },
];

/* ── Types ───────────────────────────────────────────────────────── */

interface Project {
  id: string;
  client_name: string;
  slug: string;
  status: "draft" | "active" | "completed";
  ai_summary: Record<string, unknown> | null;
}

interface Brief {
  objectif?: string;
  cible?: string;
  ton_souhaite?: string;
  livrables_attendus?: string;
  deadline?: string;
  notes_libres?: string;
  format_souhaite?: string;
  dialogues?: string;
  brief_status?: string;
}

interface BriefComment {
  brief_field: string;
  content: string;
  field_status: string;
}

interface Props {
  project: Project;
  initialBrief: Brief | null;
  initialUploads: UploadRecord[];
  initialMessages: Message[];
}

/* ── Main Component ──────────────────────────────────────────────── */

export default function ClientPortalView({
  project,
  initialBrief,
  initialUploads,
  initialMessages,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [briefComments, setBriefComments] = useState<Record<string, BriefComment>>({});
  const [briefStatus, setBriefStatus] = useState(initialBrief?.brief_status ?? "draft");
  const [showNewRequest, setShowNewRequest] = useState(false);

  const [form, setForm] = useState({
    objectif:           initialBrief?.objectif ?? "",
    cible:              initialBrief?.cible ?? "",
    ton_souhaite:       initialBrief?.ton_souhaite ?? "",
    livrables_attendus: initialBrief?.livrables_attendus ?? "",
    deadline:           initialBrief?.deadline ?? "",
    notes_libres:       initialBrief?.notes_libres ?? "",
    format_souhaite:    initialBrief?.format_souhaite ?? "",
    dialogues:          initialBrief?.dialogues ?? "",
  });

  // Load admin comments
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("brief_comments")
      .select("brief_field, content, field_status")
      .eq("project_id", project.id)
      .then(({ data }) => {
        if (data) {
          const byField: Record<string, BriefComment> = {};
          for (const c of data) byField[c.brief_field] = c;
          setBriefComments(byField);
        }
      });
  }, [project.id]);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("briefs").upsert(
      {
        project_id:         project.id,
        objectif:           form.objectif || null,
        cible:              form.cible || null,
        ton_souhaite:       form.ton_souhaite || null,
        livrables_attendus: form.livrables_attendus || null,
        deadline:           form.deadline || null,
        notes_libres:       form.notes_libres || null,
        format_souhaite:    form.format_souhaite || null,
        dialogues:          form.dialogues || null,
        brief_status:       "submitted",
      },
      { onConflict: "project_id" }
    );
    setSaving(false);
    if (error) {
      toast.error(`Erreur : ${error.message}`);
    } else {
      setBriefStatus("submitted");
      toast.success("Brief envoyé ! L'équipe va l'examiner.");
      logActivity({ projectId: project.id, actorType: "client", action: "brief_submitted" });
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const projectBadge = STATUS_BADGE[project.status] ?? STATUS_BADGE.active;
  const bsStyle = BRIEF_STATUS_STYLE[briefStatus] ?? BRIEF_STATUS_STYLE.draft;

  return (
    <div className="min-h-screen" style={{ background: "var(--ds-bg)" }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b px-6 py-4 bg-[#09040F]/90 backdrop-blur-2xl border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="transition-transform hover:scale-105 shrink-0">
              <img src="/logo-koko.png" alt="Koko Prod" className="h-7 object-contain" />
            </Link>
            <div className="w-px h-5 bg-white/10 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-extrabold text-base leading-none text-[var(--ds-text-primary)] tracking-tight truncate">
                {project.client_name}
              </h1>
              <p className="text-[10px] font-bold uppercase text-[var(--ds-text-tertiary)] tracking-widest mt-0.5">
                Portail Client
              </p>
            </div>
          </div>
          <div
            className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/5"
            style={{ background: projectBadge.bg, color: projectBadge.color }}
          >
            {projectBadge.label}
          </div>
        </div>
      </header>

      {/* ── QUICK NAV ── */}
      <nav className="sticky top-[65px] z-20 border-b px-6 py-2 bg-[#09040F]/80 backdrop-blur-xl border-white/5">
        <div className="max-w-3xl mx-auto flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all hover:bg-white/10 text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
            >
              <span>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-12">

        {/* ─── SECTION 1 — BRIEF ─── */}
        <section id="brief" style={{ scrollMarginTop: "125px" }}>
          <SectionHeader icon={<FileText size={18} />} title="Brief du projet" />

          {/* Brief status pill */}
          <div className="mb-5">
            <span
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold"
              style={{ background: bsStyle.bg, color: bsStyle.color }}
            >
              {bsStyle.label}
            </span>
          </div>

          <div
            className="rounded-[24px] p-7 sm:p-9 flex flex-col gap-7"
            style={{
              background: "var(--ds-surface)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--ds-border)",
              boxShadow: "var(--ds-shadow-soft)",
            }}
          >
            {/* Vision */}
            <Field label="Votre vision / Quelle est votre idée ?">
              <Textarea
                placeholder="Décrivez votre idée de contenu, ce que vous imaginez, l'ambiance souhaitée..."
                className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[120px] resize-none"
                value={form.objectif}
                onChange={(e) => handleChange("objectif", e.target.value)}
              />
              <AdminComment comment={briefComments["objectif"]} />
            </Field>

            {/* Cible + Ton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Cible visée">
                <Textarea
                  placeholder="À qui s'adresse ce projet ?"
                  className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[80px] resize-none"
                  value={form.cible}
                  onChange={(e) => handleChange("cible", e.target.value)}
                />
                <AdminComment comment={briefComments["cible"]} />
              </Field>
              <Field label="Ton souhaité">
                <Textarea
                  placeholder="Ex : Pro, créatif, institutionnel..."
                  className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[80px] resize-none"
                  value={form.ton_souhaite}
                  onChange={(e) => handleChange("ton_souhaite", e.target.value)}
                />
                <AdminComment comment={briefComments["ton_souhaite"]} />
              </Field>
            </div>

            {/* Format + Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Format souhaité">
                <div className="relative">
                  <select
                    className="w-full rounded-full bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[var(--ds-mint)]/30 h-11 px-4 pr-10 text-sm transition-all appearance-none cursor-pointer"
                    style={{
                      color: form.format_souhaite ? "var(--ds-text-primary)" : "var(--ds-text-tertiary)",
                    }}
                    value={form.format_souhaite}
                    onChange={(e) => handleChange("format_souhaite", e.target.value)}
                  >
                    <option value="" style={{ background: "#1a0f2e", color: "#9ca3af" }}>
                      Sélectionner un format…
                    </option>
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} style={{ background: "#1a0f2e", color: "#f3f4f6" }}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)]">
                    ▾
                  </div>
                </div>
                <AdminComment comment={briefComments["format_souhaite"]} />
              </Field>
              <Field label="Deadline">
                <Input
                  type="date"
                  className="rounded-full bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 h-11 transition-all"
                  value={form.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                />
              </Field>
            </div>

            {/* Livrables */}
            <Field label="Livrables attendus">
              <Textarea
                placeholder="Ex : 1 vidéo 60s, 3 formats stories, 1 version statique..."
                className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[80px] resize-none"
                value={form.livrables_attendus}
                onChange={(e) => handleChange("livrables_attendus", e.target.value)}
              />
              <AdminComment comment={briefComments["livrables_attendus"]} />
            </Field>

            {/* Dialogues */}
            <Field label="Texte, dialogues ou voix off">
              <Textarea
                placeholder="Écrivez ici vos dialogues, voix off, scripts ou le texte à intégrer au contenu..."
                className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[150px] resize-none"
                value={form.dialogues}
                onChange={(e) => handleChange("dialogues", e.target.value)}
              />
              <p className="text-[11px] mt-1.5" style={{ color: "var(--ds-text-tertiary)" }}>
                Vous pouvez aussi déposer un fichier texte dans la section fichiers ci-dessous.
              </p>
              <AdminComment comment={briefComments["dialogues"]} />
            </Field>

            {/* Notes */}
            <Field label="Notes & informations libres">
              <Textarea
                placeholder="Toute autre information pertinente..."
                className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[80px] resize-none"
                value={form.notes_libres}
                onChange={(e) => handleChange("notes_libres", e.target.value)}
              />
              <AdminComment comment={briefComments["notes_libres"]} />
            </Field>

            {/* Save button */}
            <button
              className="btn-mint w-full h-12 flex items-center justify-center gap-2 text-sm font-bold"
              onClick={handleSave}
              disabled={saving}
            >
              <Send size={17} strokeWidth={2.2} />
              {saving ? "Envoi en cours…" : "Enregistrer le brief"}
            </button>
          </div>
        </section>

        {/* ─── SECTION 2 — FICHIERS ─── */}
        <section id="fichiers" style={{ scrollMarginTop: "125px" }}>
          <SectionHeader icon={<FolderOpen size={18} />} title="Vos fichiers" />
          <FilesTab projectId={project.id} initialFiles={initialUploads} />
        </section>

        {/* ─── SECTION 3 — MESSAGES ─── */}
        <section id="messages" style={{ scrollMarginTop: "125px" }}>
          <SectionHeader icon={<MessageSquare size={18} />} title="Échanges avec l'équipe" />
          <Chat
            projectId={project.id}
            senderType="client"
            senderName={project.client_name}
            initialMessages={initialMessages}
          />
        </section>

        {/* ─── SECTION 4 — NOUVELLE DEMANDE ─── */}
        <section id="demande" style={{ scrollMarginTop: "125px" }}>
          <div
            className="rounded-[20px] px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <h3 className="font-bold text-[var(--ds-text-primary)] mb-1">
                Envie de collaborer sur un autre contenu ?
              </h3>
              <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                Faites une nouvelle demande et nous créerons un espace dédié.
              </p>
            </div>
            <button
              onClick={() => setShowNewRequest(true)}
              className="shrink-0 h-10 px-5 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wide transition-all border border-white/8 bg-white/5 hover:bg-white/10"
              style={{ color: "var(--ds-text-secondary)" }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Nouvelle demande
            </button>
          </div>
        </section>

        <div className="h-4" />
      </main>

      {/* ── MODAL NOUVELLE DEMANDE ── */}
      {showNewRequest && (
        <NewRequestModal
          projectId={project.id}
          clientName={project.client_name}
          onClose={() => setShowNewRequest(false)}
        />
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" }}
      >
        {icon}
      </div>
      <h2 className="font-extrabold text-xl tracking-tight" style={{ color: "var(--ds-text-primary)" }}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-xs font-bold uppercase"
        style={{ color: "var(--ds-text-secondary)", letterSpacing: "0.06em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function AdminComment({ comment }: { comment?: BriefComment }) {
  if (!comment?.content) return null;

  const styles = {
    approved: { bg: "rgba(16,185,129,0.08)",  border: "#10B981", label: "✅ Validé par l'équipe", color: "#10B981" },
    rejected: { bg: "rgba(239,68,68,0.08)",   border: "#EF4444", label: "❌ À modifier",           color: "#EF4444" },
    pending:  { bg: "rgba(139,92,246,0.08)",  border: "#8B5CF6", label: "💬 Retour de l'équipe",   color: "#8B5CF6" },
  } as const;

  const s = styles[comment.field_status as keyof typeof styles] ?? styles.pending;

  return (
    <div
      className="mt-1 p-3 rounded-xl border-l-[3px]"
      style={{ background: s.bg, borderLeftColor: s.border }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: s.color }}>
        {s.label}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-secondary)" }}>
        {comment.content}
      </p>
    </div>
  );
}

// Declared as interface for the BriefComment type used locally
interface BriefComment {
  brief_field: string;
  content: string;
  field_status: string;
}

function NewRequestModal({
  projectId,
  clientName,
  onClose,
}: {
  projectId: string;
  clientName: string;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!description.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("project_requests").insert({
      project_id: projectId,
      client_name: clientName,
      description: description.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Erreur lors de l'envoi.");
    } else {
      toast.success("Demande envoyée !");
      logActivity({
        projectId,
        actorType: "client",
        action: "new_request",
        details: description.trim(),
      });
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-[24px] p-8 flex flex-col gap-6"
        style={{
          background: "var(--ds-surface)",
          border: "1px solid var(--ds-border)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-extrabold text-lg" style={{ color: "var(--ds-text-primary)" }}>
              Nouvelle demande
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--ds-text-secondary)" }}>
              Décrivez brièvement votre idée.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={16} strokeWidth={2} style={{ color: "var(--ds-text-secondary)" }} />
          </button>
        </div>

        <Textarea
          placeholder="Décrivez brièvement votre idée…"
          className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[120px] resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim() || sending}
            className="flex-1 btn-mint h-11 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={16} strokeWidth={2.2} />
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
