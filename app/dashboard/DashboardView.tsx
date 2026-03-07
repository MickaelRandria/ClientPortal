"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { FileBox, MessageSquare, Plus, Search, Filter, LogOut } from "lucide-react";
import NewProjectModal from "@/components/NewProjectModal";
import GlassElement from "@/components/GlassElement";

/* ── Types ───────────────────────────────────────────────────────── */

export interface ProjectWithStats {
  id: string;
  client_name: string;
  client_email: string | null;
  slug: string;
  status: "draft" | "active" | "completed";
  created_at: string;
  uploadsCount: number;
  unreadCount: number;
  lastMessage: { content: string; created_at: string } | null;
}

/* ── Status config ───────────────────────────────────────────────── */

const STATUS_CONFIG = {
  active: { label: "Actif", bg: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" },
  draft: { label: "Brouillon", bg: "rgba(0,0,0,0.05)", color: "var(--ds-text-secondary)" },
  completed: { label: "Terminé", bg: "var(--ds-blue-bg)", color: "var(--ds-blue-text)" },
} as const;

/* ── Helpers ─────────────────────────────────────────────────────── */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(str: string, max = 72) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/* ── ProjectCard ─────────────────────────────────────────────────── */

function ProjectCard({ project }: { project: ProjectWithStats }) {
  const router = useRouter();
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;

  return (
    <div
      onClick={() => router.push(`/dashboard/${project.id}`)}
      className="glass-card p-6 flex flex-col gap-4 cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-white text-sm"
            style={{
              background: "linear-gradient(135deg, #34D399, #06B6D4)",
              boxShadow: "0 0 0 1px rgba(52,211,153,0.2), 0 2px 8px rgba(52,211,153,0.2)",
            }}
          >
            {project.client_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p
              className="font-bold truncate"
              style={{ color: "var(--ds-text-primary)", letterSpacing: "-0.02em" }}
            >
              {project.client_name}
            </p>
            {project.client_email && (
              <p
                className="text-xs truncate"
                style={{ color: "var(--ds-text-tertiary)" }}
              >
                {project.client_email}
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase"
          style={{
            letterSpacing: "0.06em",
            background: status.bg,
            color: status.color,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3">
        <StatPill
          icon={<FileBox size={13} strokeWidth={1.8} />}
          value={project.uploadsCount}
          label="fichier"
        />
        <StatPill
          icon={<MessageSquare size={13} strokeWidth={1.8} />}
          value={project.unreadCount}
          label="non lu"
          accent={project.unreadCount > 0}
        />
      </div>

      {/* Last message */}
      {project.lastMessage ? (
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}
        >
          <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-secondary)" }}>
            {truncate(project.lastMessage.content)}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: "rgba(0,0,0,0.02)" }}
        >
          <p className="text-xs italic" style={{ color: "var(--ds-text-tertiary)" }}>
            Aucun message
          </p>
        </div>
      )}

      {/* Date */}
      <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
        Créé le {formatDate(project.created_at)}
      </p>
    </div>
  );
}

function StatPill({
  icon,
  value,
  label,
  accent = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent?: boolean;
}) {
  const bg = accent ? "var(--ds-red-bg)" : "rgba(0,0,0,0.04)";
  const color = accent ? "var(--ds-red-text)" : "var(--ds-text-secondary)";
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ background: bg }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-xs font-bold" style={{ color }}>
        {value} {label}{value > 1 ? "s" : ""}
      </span>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="rounded-[28px] p-16 flex flex-col items-center justify-center text-center gap-5"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--ds-mint-bg)" }}
      >
        <FileBox size={24} strokeWidth={1.5} style={{ color: "var(--ds-mint-text)" }} />
      </div>
      <div>
        <p
          className="font-bold text-lg"
          style={{ color: "var(--ds-text-primary)", letterSpacing: "-0.02em" }}
        >
          Aucun projet pour l'instant
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--ds-text-secondary)" }}>
          Créez votre premier projet client pour commencer.
        </p>
      </div>
      <button className="btn-mint flex items-center gap-2" onClick={onNew}>
        <Plus size={15} strokeWidth={2} />
        Nouveau projet
      </button>
    </div>
  );
}

/* ── DashboardView ───────────────────────────────────────────────── */

export default function DashboardView({
  projects,
  adminId,
}: {
  projects: ProjectWithStats[];
  adminId: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<ProjectWithStats[]>(projects);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleProjectCreated(newProject: ProjectWithStats) {
    setLocalProjects((prev) => [newProject, ...prev]);
  }

  return (
    <div className="flex flex-col p-8 gap-8 max-w-[1600px] mx-auto w-full">
      {/* Top Header - Airy & Simple */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ds-text-primary)]">
            Tableau de bord
          </h1>
          <p className="text-[var(--ds-text-secondary)] mt-1">
            Gérez vos projets et collaborations clients.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)] group-focus-within:text-[var(--ds-mint-text)] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="pl-10 pr-4 py-2.5 rounded-full bg-white border border-[var(--ds-border-subtle)] focus:border-[var(--ds-mint)] outline-none w-64 transition-all text-sm"
            />
          </div>
          <button className="p-3 rounded-full bg-white border border-[var(--ds-border-subtle)] hover:bg-[var(--ds-surface-hover)] transition-colors">
            <Filter size={18} className="text-[var(--ds-text-secondary)]" />
          </button>
          <button
            onClick={handleLogout}
            className="p-3 rounded-full bg-white border border-[var(--ds-border-subtle)] hover:bg-[var(--ds-surface-hover)] transition-colors"
            title="Déconnexion"
          >
            <LogOut size={18} className="text-[var(--ds-text-secondary)]" />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-mint flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="font-bold">Nouveau projet</span>
          </button>
        </div>
      </header>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-12 grid-rows-[auto_auto] gap-6">
        {/* Focus / IA Area (Large Bento Item) */}
        <div className="col-span-12 lg:col-span-8 glass-card p-10 flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10 max-w-md">
            <span className="badge badge-mint mb-4">Focus IA</span>
            <h2 className="text-4xl font-extrabold tracking-tighter text-[var(--ds-text-primary)] leading-[1.1] mb-4">
              Prêt à lancer <br /> un nouveau projet ?
            </h2>
            <p className="text-lg text-[var(--ds-text-secondary)] mb-8 leading-relaxed">
              Utilisez notre assistant pour configurer <br /> votre espace client en quelques secondes.
            </p>
            <button className="btn-mint !px-8 !py-4 text-base" onClick={() => setModalOpen(true)}>
              Démarrer le brief
            </button>
          </div>
          
          <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700">
            <GlassElement className="w-[400px] h-[400px]" />
          </div>
        </div>

        {/* Stats Summary Bento Item */}
        <div className="col-span-12 lg:col-span-4 glass-card p-8 flex flex-col justify-between">
          <div>
            <span className="badge badge-yellow mb-4">Aperçu</span>
            <h3 className="text-xl font-bold text-[var(--ds-text-primary)]">Statistiques</h3>
          </div>
          <div className="flex flex-col gap-6 mt-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-[var(--ds-text-secondary)]">Projets actifs</p>
                <p className="text-4xl font-extrabold text-[var(--ds-text-primary)]">{localProjects.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="w-16 h-1 bg-[var(--ds-mint)] rounded-full mb-2" />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-[var(--ds-text-secondary)]">Messages non lus</p>
                <p className="text-4xl font-extrabold text-[var(--ds-text-primary)]">{localProjects.reduce((acc, p) => acc + p.unreadCount, 0)}</p>
              </div>
              <div className="w-16 h-1 bg-[var(--ds-yellow)] rounded-full mb-2" />
            </div>
          </div>
        </div>

        {/* Project Grid Bento Items */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {localProjects.length === 0 ? (
            <div className="col-span-full">
              <EmptyState onNew={() => setModalOpen(true)} />
            </div>
          ) : (
            localProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </div>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        adminId={adminId}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
