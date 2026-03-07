"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Sparkles,
  FileText,
  FolderOpen,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Calendar,
  Target,
  Users,
  Mic2,
  Package,
  AlertCircle,
  MessagesSquare,
  Download,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Paperclip,
  Palette,
  Mail,
  X,
  Trash2,
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
import Chat, { type Message } from "@/components/Chat";
import { cn } from "@/lib/utils";
import AISummaryTab from "@/components/AISummaryTab";

/* ── Types ───────────────────────────────────────────────────────── */

interface Project {
  id: string;
  client_name: string;
  client_email: string | null;
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

/* ── Sub-components ──────────────────────────────────────────────── */

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
    <div className="rounded-2xl p-4 space-y-2 bg-black/5 border border-black/5">
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

function BriefField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase" style={{ color: "var(--ds-text-tertiary)", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-primary)" }}>
        {value}
      </p>
    </div>
  );
}



/* ── AdminFilesTab ───────────────────────────────────────────────── */

function storagePath(fileUrl: string): string {
  return fileUrl.split("/project-files/")[1] ?? "";
}

function AdminFilesTab({ uploads: initialUploads }: { uploads: Upload[] }) {
  const [uploads, setUploads] = useState<Upload[]>(initialUploads);
  const categories = ["charte", "asset", "contenu", "other"];

  async function handleDelete(file: Upload) {
    const supabase = createClient();
    const path = storagePath(file.file_url);

    const { error } = await supabase.storage.from("project-files").remove([path]);
    if (error) {
      toast.error("Erreur lors de la suppression.");
      return;
    }
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
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
          minHeight: "240px",
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
          <FolderOpen size={22} strokeWidth={1.5} style={{ color: "var(--ds-text-tertiary)" }} />
        </div>
        <div>
          <p className="font-bold" style={{ color: "var(--ds-text-primary)" }}>Aucun fichier</p>
          <p className="text-sm mt-1" style={{ color: "var(--ds-text-secondary)" }}>
            Le client n'a pas encore déposé de fichiers.
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
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            {/* Category header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ds-mint-bg)" }}>
                <CatIcon size={15} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
              </div>
              <p className="font-bold text-sm" style={{ color: "var(--ds-text-primary)" }}>
                {config.label}
              </p>
              <span
                className="ml-auto text-[11px] font-bold rounded-full px-2.5 py-1"
                style={{ background: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" }}
              >
                {files.length}
              </span>
            </div>

            {/* Image grid */}
            {files.some((f) => isImage(f.file_type)) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {files.filter((f) => isImage(f.file_type)).map((file) => (
                  <div key={file.id} className="group relative">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div
                        className="rounded-2xl overflow-hidden aspect-square relative"
                        style={{ background: "rgba(0,0,0,0.04)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Download
                            size={18}
                            strokeWidth={1.8}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow"
                          />
                        </div>
                      </div>
                    </a>
                    {/* Delete button on image */}
                    <button
                      onClick={() => handleDelete(file)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(239,68,68,0.9)" }}
                      title="Supprimer"
                    >
                      <X size={11} strokeWidth={2.5} className="text-white" />
                    </button>
                    <p className="text-xs mt-1.5 truncate font-bold" style={{ color: "var(--ds-text-secondary)" }}>
                      {file.file_name}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
                      {formatSize(file.file_size)} · {formatDate(file.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Non-image files as list */}
            {files.filter((f) => !isImage(f.file_type)).map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 group"
                style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", marginBottom: "6px" }}
              >
                <div style={{ color: "var(--ds-text-tertiary)", flexShrink: 0 }}>
                  {fileIcon(file.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--ds-text-primary)" }}>
                    {file.file_name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
                    {formatSize(file.file_size)} · {formatDate(file.created_at)}
                  </p>
                </div>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-mint-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                  title="Télécharger"
                >
                  <Download size={14} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
                </a>
                <button
                  onClick={() => handleDelete(file)}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--ds-red-text)" }}
                  title="Supprimer"
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
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Realtime: sync brief when client saves it
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`brief:${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "briefs",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setBrief(payload.new as Brief);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [project.id]);

  const hasBrief = brief && Object.values(brief).some(Boolean);
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status)!;

  async function handleStatusChange(newStatus: "draft" | "active" | "completed" | null) {
    if (!newStatus) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", project.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut.");
      return;
    }
    setStatus(newStatus);
    toast.success("Statut mis à jour.");
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
      <header className="sticky top-0 z-10 px-8 py-5 border-b bg-white/80 backdrop-blur-2xl border-[var(--ds-border-subtle)]">
        <div className="flex items-center gap-6 max-w-[1600px] mx-auto">
          {/* Back + breadcrumb */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-11 h-11 rounded-[1.25rem] flex items-center justify-center bg-black/5 hover:bg-black/10 transition-all"
              title="Retour au dashboard"
            >
              <ArrowLeft size={18} strokeWidth={2.2} className="text-[var(--ds-text-primary)]" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[var(--ds-text-tertiary)] uppercase tracking-wider">
              <button
                onClick={() => router.push("/dashboard")}
                className="hover:text-[var(--ds-text-primary)] transition-colors"
              >
                Dashboard
              </button>
              <ChevronRight size={14} strokeWidth={2.5} />
              <span className="text-[var(--ds-text-secondary)]">{project.client_name}</span>
            </div>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center shrink-0 font-bold text-white text-base bg-gradient-to-br from-[#34D399] to-[#06B6D4] shadow-md shadow-emerald-200/50">
              {project.client_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-xl leading-none text-[var(--ds-text-primary)] tracking-tighter mb-1 truncate">
                {project.client_name}
              </h1>
              {project.client_email && (
                <p className="text-sm font-medium text-[var(--ds-text-tertiary)] truncate">
                  {project.client_email}
                </p>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger
                className="w-auto h-10 rounded-full border-0 gap-2 px-5 text-[11px] font-extrabold uppercase shrink-0"
                style={{
                  background: currentStatus.bg,
                  color: currentStatus.color,
                  letterSpacing: "0.08em",
                }}
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
                "h-10 px-5 rounded-full flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-all",
                copied ? "bg-[var(--ds-mint)] text-[var(--ds-mint-text)]" : "bg-black/5 text-[var(--ds-text-secondary)] hover:bg-black/10"
              )}
            >
              {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
              {copied ? "Lien Copié" : "Lien Client"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                "h-10 px-5 rounded-full flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-all",
                deleteConfirm
                  ? "bg-red-500 text-white"
                  : "bg-black/5 text-[var(--ds-text-secondary)] hover:bg-red-50 hover:text-red-500"
              )}
            >
              {deleting ? (
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
              ) : (
                <Trash2 size={14} strokeWidth={2.5} />
              )}
              {deleting ? "Suppression…" : deleteConfirm ? "Confirmer ?" : "Supprimer"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Main Area (Tabs) - 8/12 - Expanded */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs defaultValue={defaultTab} orientation="vertical" className="w-full items-start gap-8">
              {/* Tabs List (Vertical Sidebar-style) */}
              <TabsList className="glass-card flex-col p-2 h-auto w-20 shrink-0 gap-2 !bg-white/40 border-white/60">
                {[
                  { value: "brief",    label: "Brief",     icon: <FileText size={20} /> },
                  { value: "fichiers", label: "Fichiers",  icon: <FolderOpen size={20} /> },
                  { value: "messages", label: "Messages",  icon: <MessageSquare size={20} /> },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl w-16 h-16 transition-all data-[state=active]:bg-[var(--ds-mint)] data-[state=active]:text-[var(--ds-mint-text)] data-[state=active]:shadow-lg"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <BriefField label="Objectif du projet" value={brief?.objectif} />
                        <BriefField label="Cible visée" value={brief?.cible} />
                        <BriefField label="Ton souhaité" value={brief?.ton_souhaite} />
                        <BriefField label="Livrables attendus" value={brief?.livrables_attendus} />
                        {brief?.deadline && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase text-[var(--ds-text-tertiary)] tracking-widest">
                              Deadline
                            </p>
                            <div className="flex items-center gap-3 bg-[var(--ds-mint-bg)] w-fit px-4 py-2 rounded-full border border-emerald-100">
                              <Calendar size={15} className="text-[var(--ds-mint-text)]" />
                              <p className="text-sm font-extrabold text-[var(--ds-mint-text)]">
                                {new Date(brief!.deadline!).toLocaleDateString("fr-FR", {
                                  day: "numeric", month: "long", year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <BriefField label="Notes libres" value={brief?.notes_libres} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-[var(--ds-yellow-bg)] text-[var(--ds-yellow-text)]">
                          <FileText size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-extrabold text-lg text-[var(--ds-text-primary)]">
                            Brief non rempli
                          </p>
                          <p className="text-[var(--ds-text-secondary)] mt-2">
                            Le client n'a pas encore complété son brief.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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

          {/* Sidebar Area (AI Summary) - 4/12 - Persistent */}
          <div className="col-span-12 lg:col-span-4 sticky top-[108px] self-start">
            <AISummaryTab projectId={project.id} initialSummary={project.ai_summary} />
          </div>
        </div>
      </main>
    </div>
  );
}
