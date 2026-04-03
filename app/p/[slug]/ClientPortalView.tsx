"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import {
  FileText, FolderOpen, MessageSquare, Send, Plus, X,
  Edit2, Calendar, Package, Zap,
} from "lucide-react";
import FilesTab, { type UploadRecord } from "./FilesTab";
import Chat, { type Message } from "@/components/Chat";

/* ── Constants ───────────────────────────────────────────────────── */

const STATUS_BADGE = {
  active:    { label: "Projet Actif",   bg: "var(--ds-mint-bg)",     color: "var(--ds-mint-text)" },
  draft:     { label: "En préparation", bg: "rgba(255,255,255,0.05)", color: "var(--ds-text-secondary)" },
  completed: { label: "Projet Terminé", bg: "var(--ds-blue-bg)",      color: "var(--ds-blue-text)" },
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

const ACTIVITY_LABELS: Record<string, { label: string; icon: string; adminAction?: boolean }> = {
  brief_submitted: { label: "Brief envoyé",                  icon: "📋" },
  brief_reviewed:  { label: "Retours de l'équipe",           icon: "💬", adminAction: true },
  brief_approved:  { label: "Brief validé par l'équipe ✅",  icon: "✅", adminAction: true },
  files_uploaded:  { label: "Fichiers déposés",              icon: "📁" },
  comment_added:   { label: "Commentaire ajouté",            icon: "💬", adminAction: true },
  status_changed:  { label: "Statut du projet mis à jour",   icon: "🔄", adminAction: true },
  new_request:     { label: "Nouvelle demande envoyée",      icon: "✨" },
};

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
  section: string;
  comment: string;
  status: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  actor_type: string;
  created_at: string;
  details?: string;
}

interface Props {
  project: Project;
  initialBrief: Brief | null;
  initialUploads: UploadRecord[];
  initialMessages: Message[];
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* ── Main Component ──────────────────────────────────────────────── */

export default function ClientPortalView({
  project,
  initialBrief,
  initialUploads,
  initialMessages,
}: Props) {
  const initialStatus = initialBrief?.brief_status ?? "draft";

  const [saving, setSaving] = useState(false);
  const [briefComments, setBriefComments] = useState<Record<string, BriefComment>>({});
  const [briefStatus, setBriefStatus] = useState(initialStatus);
  const [showNewRequest, setShowNewRequest] = useState(false);
  // Show form only if never submitted, or when user explicitly clicks "Modifier"
  const [briefEditMode, setBriefEditMode] = useState(initialStatus === "draft");
  // Admin-set production info (realtime-updated)
  const [adminDeadline, setAdminDeadline] = useState(initialBrief?.deadline ?? null);
  const [adminLivrables, setAdminLivrables] = useState(initialBrief?.livrables_attendus ?? null);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

  const [form, setForm] = useState({
    objectif:        initialBrief?.objectif ?? "",
    cible:           initialBrief?.cible ?? "",
    ton_souhaite:    initialBrief?.ton_souhaite ?? "",
    notes_libres:    initialBrief?.notes_libres ?? "",
    format_souhaite: initialBrief?.format_souhaite ?? "",
    dialogues:       initialBrief?.dialogues ?? "",
  });

  // Load admin comments
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("brief_comments")
      .select("section, comment, status")
      .eq("project_id", project.id)
      .then(({ data }) => {
        if (data) {
          const byField: Record<string, BriefComment> = {};
          for (const c of data) byField[c.section] = c;
          setBriefComments(byField);
        }
      });
  }, [project.id]);

  // Realtime: brief updates (brief_status, deadline, livrables)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`client-brief:${project.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "briefs", filter: `project_id=eq.${project.id}` },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const u = payload.new as Brief;
            if (u.brief_status) setBriefStatus(u.brief_status);
            setAdminDeadline(u.deadline ?? null);
            setAdminLivrables(u.livrables_attendus ?? null);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [project.id]);

  // Realtime: admin comments
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`client-comments:${project.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brief_comments", filter: `project_id=eq.${project.id}` },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const c = payload.new as BriefComment;
            setBriefComments((prev) => ({ ...prev, [c.section]: c }));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [project.id]);

  // Load activity log
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("activity_log")
      .select("id, action, actor_type, created_at, details")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setActivityLog(data); });
  }, [project.id]);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("briefs").upsert(
      {
        project_id:      project.id,
        objectif:        form.objectif || null,
        cible:           form.cible || null,
        ton_souhaite:    form.ton_souhaite || null,
        notes_libres:    form.notes_libres || null,
        format_souhaite: form.format_souhaite || null,
        dialogues:       form.dialogues || null,
        brief_status:    "submitted",
      },
      { onConflict: "project_id" }
    );
    setSaving(false);
    if (error) {
      toast.error(`Erreur : ${error.message}`);
    } else {
      setBriefStatus("submitted");
      setBriefEditMode(false);
      toast.success("Brief envoyé ! L'équipe va l'examiner.");
      logActivity({ projectId: project.id, actorType: "client", action: "brief_submitted" });
      // Refresh activity
      const supabase2 = createClient();
      supabase2
        .from("activity_log")
        .select("id, action, actor_type, created_at, details")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }) => { if (data) setActivityLog(data); });
    }
  }

  const projectBadge = STATUS_BADGE[project.status] ?? STATUS_BADGE.active;

  return (
    <div className="min-h-screen" style={{ background: "var(--ds-bg)" }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b px-4 md:px-6 py-3 md:py-4 bg-[#09040F]/90 backdrop-blur-2xl border-white/5">
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

      {/* ── Main Content ── */}
      <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-12 gap-4 md:gap-8 items-start">
          <div className="col-span-12 lg:col-span-8">
            <div className="w-full flex flex-col gap-12">
              {/* ─── SECTION 1 — BRIEF ─── */}
              <section id="brief">
                <SectionHeader icon={<FileText size={18} />} title="Brief du projet" />

          {briefEditMode ? (
            /* ── FORM MODE ── */
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
              {briefStatus !== "draft" && (
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold"
                    style={{ background: BRIEF_STATUS_STYLE[briefStatus]?.bg, color: BRIEF_STATUS_STYLE[briefStatus]?.color }}
                  >
                    {BRIEF_STATUS_STYLE[briefStatus]?.label}
                  </span>
                  <button
                    onClick={() => setBriefEditMode(false)}
                    className="text-xs font-bold text-[var(--ds-text-tertiary)] hover:text-[var(--ds-text-primary)] transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              )}

              <Field label="Votre vision / Quelle est votre idée ?">
                <Textarea
                  placeholder="Décrivez votre idée de contenu, ce que vous imaginez, l'ambiance souhaitée..."
                  className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[120px] resize-none"
                  value={form.objectif}
                  onChange={(e) => handleChange("objectif", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Cible visée">
                  <Textarea
                    placeholder="À qui s'adresse ce projet ?"
                    className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[80px] resize-none"
                    value={form.cible}
                    onChange={(e) => handleChange("cible", e.target.value)}
                  />
                </Field>
                <Field label="Ton souhaité">
                  <Textarea
                    placeholder="Ex : Pro, créatif, institutionnel..."
                    className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[80px] resize-none"
                    value={form.ton_souhaite}
                    onChange={(e) => handleChange("ton_souhaite", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Format souhaité">
                <div className="relative">
                  <select
                    className="w-full rounded-full bg-white/[0.03] border border-white/5 focus:outline-none focus:border-[var(--ds-mint)]/30 h-11 px-4 pr-10 text-sm transition-all appearance-none cursor-pointer"
                    style={{ color: form.format_souhaite ? "var(--ds-text-primary)" : "var(--ds-text-tertiary)" }}
                    value={form.format_souhaite}
                    onChange={(e) => handleChange("format_souhaite", e.target.value)}
                  >
                    <option value="" style={{ background: "#1a0f2e", color: "#9ca3af" }}>Sélectionner un format…</option>
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} style={{ background: "#1a0f2e", color: "#f3f4f6" }}>{opt}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)]">▾</div>
                </div>
              </Field>

              <Field label="Texte, dialogues ou voix off">
                <Textarea
                  placeholder="Écrivez ici vos dialogues, voix off, scripts ou le texte à intégrer au contenu..."
                  className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[150px] resize-none"
                  value={form.dialogues}
                  onChange={(e) => handleChange("dialogues", e.target.value)}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--ds-text-tertiary)" }}>
                  Vous pouvez aussi déposer un fichier texte dans la section fichiers ci-dessous.
                </p>
              </Field>

              <Field label="Notes & informations libres">
                <Textarea
                  placeholder="Toute autre information pertinente..."
                  className="rounded-[1.25rem] bg-white/[0.03] border-white/5 focus:bg-white/5 focus:border-[var(--ds-mint)]/30 transition-all text-sm min-h-[80px] resize-none"
                  value={form.notes_libres}
                  onChange={(e) => handleChange("notes_libres", e.target.value)}
                />
              </Field>

              <button
                className="btn-mint w-full h-12 flex items-center justify-center gap-2 text-sm font-bold"
                onClick={handleSave}
                disabled={saving}
              >
                <Send size={17} strokeWidth={2.2} />
                {saving ? "Envoi en cours…" : "Enregistrer le brief"}
              </button>
            </div>
          ) : (
            /* ── RECAP MODE ── */
            <BriefRecap
              form={form}
              briefStatus={briefStatus}
              briefComments={briefComments}
              adminDeadline={adminDeadline}
              adminLivrables={adminLivrables}
              onEdit={() => setBriefEditMode(true)}
            />
          )}

              </section>

              {/* ─── SECTION 2 — FICHIERS ─── */}
              <section id="fichiers">
                <SectionHeader icon={<FolderOpen size={18} />} title="Vos fichiers" />
                <FilesTab projectId={project.id} initialFiles={initialUploads} />
              </section>

              {/* ─── SECTION 3 — MESSAGES ─── */}
              <section id="messages">
                <SectionHeader icon={<MessageSquare size={18} />} title="Échanges avec l'équipe" />
                <Chat
                  projectId={project.id}
                  senderType="client"
                  senderName={project.client_name}
                  initialMessages={initialMessages}
                />
              </section>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-[108px] self-start space-y-6">
            {/* Activity feed */}
            {activityLog.length > 0 && (
              <ClientActivityFeed entries={activityLog} />
            )}
            
            {/* Demande */}
            <div
              className="rounded-[20px] px-7 py-6 flex flex-col gap-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <h3 className="font-bold text-[var(--ds-text-primary)] mb-1">Envie de collaborer sur un autre contenu ?</h3>
                <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                  Faites une nouvelle demande et nous créerons un espace dédié.
                </p>
              </div>
              <button
                onClick={() => setShowNewRequest(true)}
                className="w-full h-10 px-5 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all border border-white/8 bg-white/5 hover:bg-white/10"
                style={{ color: "var(--ds-text-secondary)" }}
              >
                <Plus size={15} strokeWidth={2.5} />
                Nouvelle demande
              </button>
            </div>
          </div>
        </div>
      </main>

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

/* ── BriefRecap ──────────────────────────────────────────────────── */

function BriefRecap({
  form,
  briefStatus,
  briefComments,
  adminDeadline,
  adminLivrables,
  onEdit,
}: {
  form: Record<string, string>;
  briefStatus: string;
  briefComments: Record<string, BriefComment>;
  adminDeadline: string | null;
  adminLivrables: string | null;
  onEdit: () => void;
}) {
  const bsStyle = BRIEF_STATUS_STYLE[briefStatus] ?? BRIEF_STATUS_STYLE.draft;

  const FIELDS: { key: string; label: string; wide?: boolean }[] = [
    { key: "objectif",        label: "Vision / Idée",               wide: true },
    { key: "cible",           label: "Cible visée" },
    { key: "ton_souhaite",    label: "Ton souhaité" },
    { key: "format_souhaite", label: "Format souhaité" },
    { key: "dialogues",       label: "Texte / Dialogues / Voix off", wide: true },
    { key: "notes_libres",    label: "Notes libres",                 wide: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Status + edit button */}
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold"
          style={{ background: bsStyle.bg, color: bsStyle.color }}
        >
          {bsStyle.label}
        </span>
        {briefStatus !== "approved" && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-bold transition-all bg-white/5 hover:bg-white/10 border border-white/5"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            <Edit2 size={12} strokeWidth={2.5} />
            {briefStatus === "reviewed" ? "Modifier mon brief" : "Modifier"}
          </button>
        )}
      </div>

      {/* Production info (admin-set) */}
      {(adminDeadline || adminLivrables) && (
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)" }}
        >
          <div className="flex items-center gap-2">
            <Package size={14} strokeWidth={2} style={{ color: "var(--ds-mint-text)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ds-mint-text)" }}>
              Informations de production · définies par votre équipe
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {adminDeadline && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ds-mint-bg)" }}>
                  <Calendar size={15} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--ds-text-tertiary)" }}>
                    Date de rendu
                  </p>
                  <p className="text-sm font-bold" style={{ color: "var(--ds-text-primary)" }}>
                    {new Date(adminDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}
            {adminLivrables && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--ds-text-tertiary)" }}>
                  Livrables attendus
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-primary)", whiteSpace: "pre-wrap" }}>
                  {adminLivrables}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brief fields */}
      <div
        className="rounded-[24px] p-7 sm:p-9"
        style={{
          background: "var(--ds-surface)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--ds-border)",
          boxShadow: "var(--ds-shadow-soft)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          {FIELDS.map(({ key, label, wide }) => {
            const value = form[key];
            if (!value) return null;
            return (
              <div key={key} className={wide ? "sm:col-span-2" : ""}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--ds-text-tertiary)" }}>
                  {label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-primary)", whiteSpace: "pre-wrap" }}>
                  {value}
                </p>
                {briefComments[key] && (
                  <AdminComment comment={briefComments[key]} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── ClientActivityFeed ──────────────────────────────────────────── */

function ClientActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={13} strokeWidth={2.2} style={{ color: "var(--ds-mint-text)" }} />
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ds-text-tertiary)" }}>
          Activité récente
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {entries.map((entry) => {
          const meta = ACTIVITY_LABELS[entry.action];
          if (!meta) return null;
          const isAdmin = meta.adminAction || entry.actor_type === "admin";
          return (
            <div key={entry.id} className="flex items-center gap-3 py-1.5">
              <span className="text-base shrink-0">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold" style={{ color: "var(--ds-text-primary)" }}>
                  {meta.label}
                </span>
                <span className="text-xs ml-2" style={{ color: "var(--ds-text-tertiary)" }}>
                  · {isAdmin ? "L'équipe" : "Vous"}
                </span>
              </div>
              <span className="text-[11px] shrink-0" style={{ color: "var(--ds-text-tertiary)" }}>
                {timeAgo(entry.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" }}>
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
      <label className="text-xs font-bold uppercase" style={{ color: "var(--ds-text-secondary)", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function AdminComment({ comment }: { comment?: BriefComment }) {
  if (!comment) return null;

  const styles = {
    approved: { bg: "rgba(16,185,129,0.08)",  border: "#10B981", label: "✅ Validé par l'équipe", color: "#10B981" },
    rejected: { bg: "rgba(239,68,68,0.08)",   border: "#EF4444", label: "❌ À modifier",           color: "#EF4444" },
    comment:  { bg: "rgba(139,92,246,0.08)",  border: "#8B5CF6", label: "💬 Retour de l'équipe",   color: "#8B5CF6" },
  } as const;

  const s = styles[comment.status as keyof typeof styles] ?? styles.comment;
  const hasText = comment.comment && comment.comment !== "-";

  return (
    <div className="mt-2 p-3 rounded-xl border-l-[3px]" style={{ background: s.bg, borderLeftColor: s.border }}>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</p>
      {hasText && (
        <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--ds-text-secondary)" }}>{comment.comment}</p>
      )}
    </div>
  );
}

function NewRequestModal({ projectId, clientName, onClose }: { projectId: string; clientName: string; onClose: () => void }) {
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
      logActivity({ projectId, actorType: "client", action: "new_request", details: description.trim() });
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 sm:p-8 flex flex-col gap-6"
        style={{ background: "var(--ds-surface)", border: "1px solid var(--ds-border)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-extrabold text-lg" style={{ color: "var(--ds-text-primary)" }}>Nouvelle demande</h3>
            <p className="text-sm mt-1" style={{ color: "var(--ds-text-secondary)" }}>Décrivez brièvement votre idée.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
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
          <button onClick={onClose} className="flex-1 h-11 rounded-full text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--ds-text-secondary)" }}>
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
