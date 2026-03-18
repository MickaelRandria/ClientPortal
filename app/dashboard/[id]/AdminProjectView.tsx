"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  Calendar,
  Download,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Paperclip,
  Palette,
  X,
  Trash2,
  MessageCircle,
  PackageCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import Chat, { type Message } from "@/components/Chat";
import { cn } from "@/lib/utils";
import AISummaryTab from "@/components/AISummaryTab";

/* ── Types ───────────────────────────────────────────────────────── */

interface Project {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  slug: string;
  status: "draft" | "active" | "completed";
  created_at: string;
  ai_summary: AISummary | null;
}

interface AISummary {
  objectif?: string;
  cible?: string;
  ton?: string;
  livrables_attendus?: string;
  deadline?: string | null;
  points_attention?: string[];
  resume_echanges?: string;
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
  id?: string;
  section: string;
  comment: string;
  status: "comment" | "approved" | "rejected";
}

interface Upload {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  category: string;
  created_at: string;
}

interface Props {
  project: Project;
  initialBrief: Brief | null;
  initialUploads: Upload[];
  initialMessages: Message[];
  adminName: string;
  defaultTab?: string;
}

/* ── Constants ───────────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: "draft",     label: "Brouillon",  bg: "rgba(0,0,0,0.05)",  color: "var(--ds-text-secondary)" },
  { value: "active",    label: "Actif",      bg: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" },
  { value: "completed", label: "Terminé",    bg: "var(--ds-blue-bg)", color: "var(--ds-blue-text)" },
] as const;

const BRIEF_STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: "Non soumis",       bg: "rgba(156,163,175,0.12)", color: "#9CA3AF" },
  submitted: { label: "Soumis",           bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
  reviewed:  { label: "Retours envoyés",  bg: "rgba(59,130,246,0.12)",  color: "#3B82F6" },
  approved:  { label: "Brief validé ✓",   bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
};

const BRIEF_DISPLAY_FIELDS: { key: keyof Brief; label: string }[] = [
  { key: "objectif",           label: "Vision / Idée" },
  { key: "cible",              label: "Cible visée" },
  { key: "ton_souhaite",       label: "Ton souhaité" },
  { key: "livrables_attendus", label: "Livrables attendus" },
  { key: "format_souhaite",    label: "Format souhaité" },
  { key: "dialogues",          label: "Texte / Dialogues / Voix off" },
  { key: "notes_libres",       label: "Notes libres" },
];

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.ElementType }> = {
  charte:  { label: "Charte graphique", Icon: Palette },
  asset:   { label: "Assets visuels",   Icon: ImageIcon },
  contenu: { label: "Contenus texte",   Icon: FileText },
  other:   { label: "Autres fichiers",  Icon: Paperclip },
};

/* ── Helpers ─────────────────────────────────────────────────────── */

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function cleanPhone(phone: string): string {
  let p = phone.replace(/[\s\-\(\)\.]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  else if (p.startsWith("0")) p = "33" + p.slice(1);
  return p;
}

function buildWhatsAppUrl(phone: string | null | undefined, name: string, slug: string, template?: string): string {
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`;
  const defaultMsg = `Bonjour ${name} 👋\n\nVotre espace projet est prêt ! Vous pouvez y déposer votre brief, vos fichiers et votre charte graphique.\n\n👉 Accédez à votre espace : ${link}\n\nN'hésitez pas si vous avez des questions !`;
  const msg = template
    ? template.replace("${name}", name).replace("${link}", link)
    : defaultMsg;
  const encoded = encodeURIComponent(msg);
  if (phone && phone.trim()) return `https://wa.me/${cleanPhone(phone)}?text=${encoded}`;
  return `https://wa.me/?text=${encoded}`;
}

function fileIcon(mimeType: string | null) {
  if (!mimeType) return <File size={16} strokeWidth={1.8} />;
  if (mimeType.startsWith("image/")) return <ImageIcon size={16} strokeWidth={1.8} />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return <FileSpreadsheet size={16} strokeWidth={1.8} />;
  return <FileText size={16} strokeWidth={1.8} />;
}

function isImage(mimeType: string | null) {
  return !!mimeType?.startsWith("image/");
}

function storagePath(fileUrl: string): string {
  return fileUrl.split("/project-files/")[1] ?? "";
}

/* ── BriefReviewSection ──────────────────────────────────────────── */

function BriefReviewSection({
  brief,
  projectId,
  briefStatus,
  onBriefStatusChange,
}: {
  brief: Brief;
  projectId: string;
  briefStatus: string;
  onBriefStatusChange: (status: string) => void;
}) {
  const [comments, setComments] = useState<Record<string, BriefComment>>({});
  const [openField, setOpenField] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const [updatingBriefStatus, setUpdatingBriefStatus] = useState(false);

  // Load existing comments
  useEffect(() => {
    fetch(`/api/brief-comments?projectId=${projectId}`)
      .then((res) => res.json())
      .then(({ data }) => {
        if (data) {
          const byField: Record<string, BriefComment> = {};
          const initDrafts: Record<string, string> = {};
          for (const c of data) {
            byField[c.section] = c;
            initDrafts[c.section] = c.comment;
          }
          setComments(byField);
          setDrafts(initDrafts);
        }
      });
  }, [projectId]);

  async function saveComment(fieldKey: string) {
    const content = (drafts[fieldKey] ?? "").trim();
    if (!content) return;
    setSavingField(fieldKey);

    const res = await fetch("/api/brief-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, briefField: fieldKey, content }),
    });
    const result = await res.json();

    setSavingField(null);
    if (!res.ok || result.error) {
      toast.error("Erreur lors de la sauvegarde du commentaire.");
    } else {
      setComments((prev) => ({ ...prev, [fieldKey]: result.data }));
      setOpenField(null);
      toast.success("Commentaire enregistré.");
      logActivity({ projectId, actorType: "admin", action: "comment_added" });
    }
  }

  async function setFieldStatus(fieldKey: string, status: "approved" | "rejected") {
    const res = await fetch("/api/brief-comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, briefField: fieldKey, fieldStatus: status }),
    });
    const result = await res.json();
    if (res.ok && result.data) {
      setComments((prev) => ({ ...prev, [fieldKey]: result.data }));
    }
  }

  async function sendReview() {
    setUpdatingBriefStatus(true);
    await fetch("/api/brief-comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, briefStatus: "reviewed" }),
    });
    onBriefStatusChange("reviewed");
    logActivity({ projectId, actorType: "admin", action: "brief_reviewed" });
    toast.success("Retours envoyés au client.");
    setUpdatingBriefStatus(false);
  }

  async function approveBrief() {
    setUpdatingBriefStatus(true);
    await fetch("/api/brief-comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, briefStatus: "approved" }),
    });
    onBriefStatusChange("approved");
    logActivity({ projectId, actorType: "admin", action: "brief_approved" });
    toast.success("Brief validé !");
    setUpdatingBriefStatus(false);
  }

  const statusBadge = BRIEF_STATUS_BADGE[briefStatus] ?? BRIEF_STATUS_BADGE.draft;

  return (
    <div className="space-y-8">
      {/* Status + action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ background: statusBadge.bg, color: statusBadge.color }}
        >
          {statusBadge.label}
        </div>
        <div className="flex gap-2">
          {briefStatus === "submitted" && (
            <button
              onClick={sendReview}
              disabled={updatingBriefStatus}
              className="h-9 px-4 rounded-full text-xs font-bold uppercase tracking-wide transition-all text-white disabled:opacity-60 flex items-center gap-1.5"
              style={{ background: "#3B82F6" }}
            >
              {updatingBriefStatus ? <Loader2 size={13} className="animate-spin" /> : null}
              Envoyer les retours
            </button>
          )}
          {(briefStatus === "submitted" || briefStatus === "reviewed") && (
            <button
              onClick={approveBrief}
              disabled={updatingBriefStatus}
              className="h-9 px-4 rounded-full text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-60 flex items-center gap-1.5"
              style={{ background: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" }}
            >
              {updatingBriefStatus ? <Loader2 size={13} className="animate-spin" /> : null}
              Valider le brief ✓
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {BRIEF_DISPLAY_FIELDS.map(({ key, label }) => {
          const value = brief[key];
          if (!value) return null;
          const comment = comments[key];
          const isOpen = openField === key;

          return (
            <div key={key} className={cn("space-y-2", key === "objectif" || key === "dialogues" || key === "notes_libres" ? "md:col-span-2" : "")}>
              {/* Label + review buttons */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: "var(--ds-text-tertiary)" }}
                  >
                    {label}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-primary)", whiteSpace: "pre-wrap" }}>
                    {value}
                  </p>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0 pt-5">
                  <button
                    onClick={() => setFieldStatus(key, "approved")}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                      comment?.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/5 text-[var(--ds-text-tertiary)] hover:bg-green-500/10 hover:text-green-400"
                    )}
                    title="Valider cette section"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setFieldStatus(key, "rejected")}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                      comment?.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/5 text-[var(--ds-text-tertiary)] hover:bg-red-500/10 hover:text-red-400"
                    )}
                    title="Marquer à revoir"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => {
                      setOpenField(isOpen ? null : key);
                      if (!isOpen) {
                        setDrafts((prev) => ({ ...prev, [key]: comment?.comment ?? "" }));
                      }
                    }}
                    className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-white/5 text-[var(--ds-text-tertiary)] hover:bg-white/10 transition-all"
                  >
                    <MessageCircle size={11} strokeWidth={2} />
                    {comment?.comment ? "Modifier" : "Commenter"}
                  </button>
                </div>
              </div>

              {/* Existing comment (read mode) */}
              {comment?.comment && comment.comment !== "-" && !isOpen && (
                <div
                  className="p-3 rounded-xl border-l-[3px]"
                  style={{
                    background:
                      comment.status === "approved" ? "rgba(16,185,129,0.06)" :
                      comment.status === "rejected"  ? "rgba(239,68,68,0.06)"  : "rgba(139,92,246,0.06)",
                    borderLeftColor:
                      comment.status === "approved" ? "#10B981" :
                      comment.status === "rejected"  ? "#EF4444" : "#8B5CF6",
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{
                      color:
                        comment.status === "approved" ? "#10B981" :
                        comment.status === "rejected"  ? "#EF4444" : "#8B5CF6",
                    }}
                  >
                    Votre commentaire
                    {comment.status === "approved" && " · Validé ✓"}
                    {comment.status === "rejected" && " · À revoir"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--ds-text-secondary)" }}>
                    {comment.comment}
                  </p>
                </div>
              )}

              {/* Inline comment editor */}
              {isOpen && (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 p-3 text-sm placeholder:text-[var(--ds-text-tertiary)] resize-none focus:outline-none focus:border-[var(--ds-mint)]/40 min-h-[80px] transition-colors"
                    style={{ color: "var(--ds-text-primary)" }}
                    placeholder="Votre commentaire pour cette section..."
                    value={drafts[key] ?? ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setOpenField(null)}
                      className="h-8 px-4 rounded-full text-xs font-bold bg-white/5 text-[var(--ds-text-secondary)] hover:bg-white/10 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => saveComment(key)}
                      disabled={savingField === key}
                      className="h-8 px-4 rounded-full text-xs font-bold text-white transition-all disabled:opacity-60"
                      style={{ background: "var(--ds-mint)" }}
                    >
                      {savingField === key ? "…" : "Enregistrer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Deadline — special display, no comment needed */}
        {brief?.deadline && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase text-[var(--ds-text-tertiary)] tracking-widest">
              Deadline
            </p>
            <div className="flex items-center gap-3 bg-[var(--ds-mint-bg)] w-fit px-4 py-2 rounded-full border border-[var(--ds-mint)]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Calendar size={15} className="text-[var(--ds-mint-text)]" />
              <p className="text-sm font-extrabold text-[var(--ds-mint-text)]">
                {new Date(brief.deadline!).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ProductionCard ──────────────────────────────────────────────── */

function ProductionCard({
  projectId,
  brief,
}: {
  projectId: string;
  brief: Brief | null;
}) {
  const [deadline, setDeadline] = useState(brief?.deadline ?? "");
  const [livrables, setLivrables] = useState(brief?.livrables_attendus ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync when brief loads from realtime
  useEffect(() => {
    setDeadline(brief?.deadline ?? "");
    setLivrables(brief?.livrables_attendus ?? "");
  }, [brief?.deadline, brief?.livrables_attendus]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/briefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, deadline, livrables_attendus: livrables }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Informations de production sauvegardées.");
    } else {
      const { error } = await res.json();
      toast.error(`Erreur : ${error}`);
    }
  }

  return (
    <div
      className="glass-card p-8 mt-6"
      style={{ borderColor: "rgba(139,92,246,0.15)", boxShadow: "0 0 30px rgba(139,92,246,0.05)" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--ds-mint-bg)" }}
        >
          <PackageCheck size={17} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-[var(--ds-text-primary)] leading-none">
            Informations de production
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--ds-text-tertiary)" }}>
            Défini par l'admin · visible par le client
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Deadline */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--ds-text-tertiary)" }}>
            Date de rendu
          </label>
          <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5 border transition-colors"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <Calendar size={15} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)", flexShrink: 0 }} />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: deadline ? "var(--ds-text-primary)" : "var(--ds-text-tertiary)" }}
            />
          </div>
        </div>

        {/* Livrables */}
        <div className="flex flex-col gap-2 sm:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--ds-text-tertiary)" }}>
            Livrables attendus
          </label>
          <textarea
            value={livrables}
            onChange={(e) => setLivrables(e.target.value)}
            placeholder="Ex : 1 vidéo 60s, 3 formats stories, 1 version statique..."
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors border"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.08)",
              color: "var(--ds-text-primary)",
            }}
          />
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 disabled:opacity-60"
          style={{
            background: saved ? "rgba(16,185,129,0.15)" : "var(--ds-mint)",
            color: saved ? "#10B981" : "white",
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} strokeWidth={3} /> : null}
          {saving ? "Sauvegarde…" : saved ? "Sauvegardé ✓" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

/* ── AdminFilesTab ───────────────────────────────────────────────── */

function AdminFilesTab({ uploads: initialUploads }: { uploads: Upload[] }) {
  const [uploads, setUploads] = useState<Upload[]>(initialUploads);
  const categories = ["charte", "asset", "contenu", "other"];

  async function handleDelete(file: Upload) {
    const supabase = createClient();
    const path = storagePath(file.file_url);
    const { error } = await supabase.storage.from("project-files").remove([path]);
    if (error) { toast.error("Erreur lors de la suppression."); return; }
    await supabase.from("uploads").delete().eq("id", file.id);
    setUploads((prev) => prev.filter((u) => u.id !== file.id));
    toast.success("Fichier supprimé.");
  }

  const byCategory = Object.fromEntries(
    categories.map((cat) => [cat, uploads.filter((u) => u.category === cat)])
  );
  const hasFiles = uploads.length > 0;

  if (!hasFiles) {
    return (
      <div
        className="rounded-[28px] p-12 flex flex-col items-center justify-center text-center gap-4"
        style={{
          background: "var(--ds-surface)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--ds-border)",
          boxShadow: "var(--ds-shadow-soft)", minHeight: "240px",
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
          <FolderOpen size={22} strokeWidth={1.5} style={{ color: "var(--ds-text-tertiary)" }} />
        </div>
        <div>
          <p className="font-bold" style={{ color: "var(--ds-text-primary)" }}>Aucun fichier</p>
          <p className="text-sm mt-1" style={{ color: "var(--ds-text-secondary)" }}>
            Le client n&apos;a pas encore déposé de fichiers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const files = byCategory[cat];
        if (!files || files.length === 0) return null;
        const config = CATEGORY_CONFIG[cat];
        const CatIcon = config.Icon;

        return (
          <div
            key={cat}
            className="rounded-[24px] p-5"
            style={{
              background: "var(--ds-surface)", backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--ds-border)",
              boxShadow: "var(--ds-shadow-soft)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ds-mint-bg)" }}>
                <CatIcon size={15} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
              </div>
              <p className="font-bold text-sm" style={{ color: "var(--ds-text-primary)" }}>{config.label}</p>
              <span className="ml-auto text-[11px] font-bold rounded-full px-2.5 py-1" style={{ background: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" }}>
                {files.length}
              </span>
            </div>

            {files.some((f) => isImage(f.file_type)) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {files.filter((f) => isImage(f.file_type)).map((file) => (
                  <div key={file.id} className="group relative">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="rounded-2xl overflow-hidden aspect-square relative" style={{ background: "rgba(255,255,255,0.05)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Download size={18} strokeWidth={1.8} className="opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow" />
                        </div>
                      </div>
                    </a>
                    <button
                      onClick={() => handleDelete(file)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(239,68,68,0.9)" }}
                    >
                      <X size={11} strokeWidth={2.5} className="text-white" />
                    </button>
                    <p className="text-xs mt-1.5 truncate font-bold" style={{ color: "var(--ds-text-secondary)" }}>{file.file_name}</p>
                    <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
                      {formatSize(file.file_size)} · {formatDate(file.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {files.filter((f) => !isImage(f.file_type)).map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 group"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "6px" }}
              >
                <div style={{ color: "var(--ds-text-tertiary)", flexShrink: 0 }}>{fileIcon(file.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--ds-text-primary)" }}>{file.file_name}</p>
                  <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
                    {formatSize(file.file_size)} · {formatDate(file.created_at)}
                  </p>
                </div>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer" download
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-mint-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                >
                  <Download size={14} strokeWidth={1.8} style={{ color: "var(--ds-text-primary)" }} />
                </a>
                <button
                  onClick={() => handleDelete(file)}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--ds-red-text)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-red-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ── AdminProjectView ────────────────────────────────────────────── */

export default function AdminProjectView({
  project,
  initialBrief,
  initialUploads,
  initialMessages,
  adminName,
  defaultTab = "brief",
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(project.status);
  const [copied, setCopied] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(initialBrief);
  const [briefStatus, setBriefStatus] = useState<string>(initialBrief?.brief_status ?? "draft");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [waTemplate, setWaTemplate] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.whatsapp_template) setWaTemplate(data.whatsapp_template);
      })
      .catch(() => {});
  }, []);

  // Realtime: sync brief when client saves it
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`brief:${project.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "briefs", filter: `project_id=eq.${project.id}` },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const updated = payload.new as Brief;
            setBrief(updated);
            setBriefStatus(updated.brief_status ?? "draft");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [project.id]);

  const hasBrief = brief && Object.entries(brief)
    .filter(([k]) => !["id", "project_id", "created_at", "updated_at", "brief_status"].includes(k))
    .some(([, v]) => Boolean(v));

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status)!;

  async function handleStatusChange(newStatus: "draft" | "active" | "completed" | null) {
    if (!newStatus) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", project.id);

    if (error) { toast.error("Erreur lors de la mise à jour du statut."); return; }
    setStatus(newStatus);
    toast.success("Statut mis à jour.");
    logActivity({ projectId: project.id, actorType: "admin", action: "status_changed" });
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/p/${project.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 4000);
      return;
    }
    setDeleting(true);
    const res = await fetch("/api/delete-project", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(`Erreur : ${error}`);
      setDeleting(false);
      setDeleteConfirm(false);
      return;
    }
    toast.success("Projet supprimé.");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 px-8 py-5 border-b bg-[#09040F]/80 backdrop-blur-2xl border-white/5">
        <div className="flex items-center gap-6 max-w-[1600px] mx-auto">
          {/* Back + breadcrumb */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/dashboard" className="transition-transform hover:scale-105 mr-2">
              <img src="/logo-koko.png" alt="Koko Prod" className="h-8 object-contain" />
            </Link>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-11 h-11 rounded-[1.25rem] flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/5"
              title="Retour au dashboard"
            >
              <ArrowLeft size={18} strokeWidth={2.2} className="text-[var(--ds-text-primary)]" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[var(--ds-text-tertiary)] uppercase tracking-wider">
              <button onClick={() => router.push("/dashboard")} className="hover:text-[var(--ds-text-primary)] transition-colors">
                Dashboard
              </button>
              <ChevronRight size={14} strokeWidth={2.5} />
              <span className="text-[var(--ds-text-secondary)]">{project.client_name}</span>
            </div>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center shrink-0 font-bold text-white text-base bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-lg shadow-purple-500/20">
              {project.client_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-xl leading-none text-[var(--ds-text-primary)] tracking-tighter mb-1 truncate">
                {project.client_name}
              </h1>
              {project.client_email && (
                <p className="text-sm font-medium text-[var(--ds-text-tertiary)] truncate">{project.client_email}</p>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger
                className="w-auto h-10 rounded-full border-0 gap-2 px-5 text-[11px] font-extrabold uppercase shrink-0"
                style={{ background: currentStatus.bg, color: currentStatus.color, letterSpacing: "0.08em" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[1.5rem] border-0 shadow-2xl">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold rounded-xl cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={handleCopyLink}
              className={cn(
                "h-10 px-5 rounded-full flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-all border border-white/5",
                copied
                  ? "bg-[var(--ds-mint)] text-[var(--ds-mint-text)] shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  : "bg-white/5 text-[var(--ds-text-secondary)] hover:bg-white/10"
              )}
            >
              {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
              {copied ? "Lien Copié" : "Lien Client"}
            </button>

            <a
              href={buildWhatsAppUrl(project.client_phone, project.client_name, project.slug, waTemplate)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-5 rounded-full flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-colors text-white"
              style={{ background: "#25D366" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1FAD54")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#25D366")}
              title="Envoyer via WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                "h-10 px-5 rounded-full flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-all border border-white/5",
                deleteConfirm
                  ? "bg-red-500 text-white"
                  : "bg-white/5 text-[var(--ds-text-secondary)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
              )}
            >
              {deleting ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2.5} />}
              {deleting ? "Suppression…" : deleteConfirm ? "Confirmer ?" : "Supprimer"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8">
            <Tabs defaultValue={defaultTab} orientation="vertical" className="w-full items-start gap-8">
              <TabsList className="glass-card flex-col p-2 h-auto w-20 shrink-0 gap-2 !bg-white/5 border-white/10">
                {[
                  { value: "brief",    label: "Brief",     icon: <FileText size={20} /> },
                  { value: "fichiers", label: "Fichiers",  icon: <FolderOpen size={20} /> },
                  { value: "messages", label: "Messages",  icon: <MessageSquare size={20} /> },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl w-16 h-16 transition-all data-[state=active]:bg-[var(--ds-mint)] data-[state=active]:text-[var(--ds-mint-text)] data-[state=active]:shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                    title={tab.label}
                  >
                    {tab.icon}
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 min-w-0">
                {/* BRIEF CONTENT */}
                <TabsContent value="brief" className="mt-0 outline-none" keepMounted>
                  <div className="glass-card p-10">
                    <h2 className="text-2xl font-extrabold text-[var(--ds-text-primary)] tracking-tight mb-8">
                      Brief du client
                    </h2>

                    {hasBrief ? (
                      <BriefReviewSection
                        brief={brief!}
                        projectId={project.id}
                        briefStatus={briefStatus}
                        onBriefStatusChange={setBriefStatus}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-[var(--ds-yellow-bg)] text-[var(--ds-yellow-text)]">
                          <FileText size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-extrabold text-lg text-[var(--ds-text-primary)]">Brief non rempli</p>
                          <p className="text-[var(--ds-text-secondary)] mt-2">
                            Le client n&apos;a pas encore complété son brief.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <ProductionCard projectId={project.id} brief={brief} />
                </TabsContent>

                {/* FICHIERS CONTENT */}
                <TabsContent value="fichiers" className="mt-0 outline-none" keepMounted>
                  <AdminFilesTab uploads={initialUploads} />
                </TabsContent>

                {/* MESSAGES CONTENT */}
                <TabsContent value="messages" className="mt-0 outline-none" keepMounted>
                  <Chat
                    projectId={project.id}
                    senderType="admin"
                    senderName={adminName}
                    initialMessages={initialMessages}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar Area (AI Summary) */}
          <div className="col-span-12 lg:col-span-4 sticky top-[108px] self-start">
            <AISummaryTab projectId={project.id} initialSummary={project.ai_summary} />
          </div>
        </div>
      </main>
    </div>
  );
}
