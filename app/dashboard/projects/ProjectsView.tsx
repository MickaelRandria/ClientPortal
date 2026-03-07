"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileBox, MessageSquare, Plus } from "lucide-react";
import NewProjectModal from "@/components/NewProjectModal";
import type { ProjectWithStats } from "@/app/dashboard/DashboardView";

const STATUS_CONFIG = {
  active:    { label: "Actif",      bg: "var(--ds-mint-bg)",    color: "var(--ds-mint-text)" },
  draft:     { label: "Brouillon",  bg: "rgba(0,0,0,0.05)",     color: "var(--ds-text-secondary)" },
  completed: { label: "Terminé",    bg: "var(--ds-blue-bg)",    color: "var(--ds-blue-text)" },
} as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function truncate(str: string, max = 72) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function ProjectCard({ project }: { project: ProjectWithStats }) {
  const router = useRouter();
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;

  return (
    <div
      onClick={() => router.push(`/dashboard/${project.id}`)}
      className="glass-card p-6 flex flex-col gap-4 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #34D399, #06B6D4)" }}
          >
            {project.client_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate" style={{ color: "var(--ds-text-primary)" }}>
              {project.client_name}
            </p>
            {project.client_email && (
              <p className="text-xs truncate" style={{ color: "var(--ds-text-tertiary)" }}>
                {project.client_email}
              </p>
            )}
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase"
          style={{ letterSpacing: "0.06em", background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: "rgba(0,0,0,0.04)" }}
        >
          <FileBox size={13} strokeWidth={1.8} style={{ color: "var(--ds-text-secondary)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--ds-text-secondary)" }}>
            {project.uploadsCount} fichier{project.uploadsCount > 1 ? "s" : ""}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: project.unreadCount > 0 ? "var(--ds-red-bg)" : "rgba(0,0,0,0.04)" }}
        >
          <MessageSquare
            size={13}
            strokeWidth={1.8}
            style={{ color: project.unreadCount > 0 ? "var(--ds-red-text)" : "var(--ds-text-secondary)" }}
          />
          <span
            className="text-xs font-bold"
            style={{ color: project.unreadCount > 0 ? "var(--ds-red-text)" : "var(--ds-text-secondary)" }}
          >
            {project.unreadCount} non lu{project.unreadCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

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
        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(0,0,0,0.02)" }}>
          <p className="text-xs italic" style={{ color: "var(--ds-text-tertiary)" }}>
            Aucun message
          </p>
        </div>
      )}

      <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
        Créé le {formatDate(project.created_at)}
      </p>
    </div>
  );
}

export default function ProjectsView({
  projects,
  adminId,
}: {
  projects: ProjectWithStats[];
  adminId: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<ProjectWithStats[]>(projects);

  function handleProjectCreated(newProject: ProjectWithStats) {
    setLocalProjects((prev) => [newProject, ...prev]);
  }

  return (
    <div className="flex flex-col p-8 gap-8 max-w-[1600px] mx-auto w-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ds-text-primary)]">
            Projets
          </h1>
          <p className="text-[var(--ds-text-secondary)] mt-1">
            {localProjects.length} projet{localProjects.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-mint flex items-center gap-2">
          <Plus size={18} strokeWidth={2.5} />
          <span className="font-bold">Nouveau projet</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {localProjects.length === 0 ? (
          <div className="col-span-full glass-card p-16 flex flex-col items-center justify-center text-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--ds-mint-bg)" }}
            >
              <FileBox size={24} strokeWidth={1.5} style={{ color: "var(--ds-mint-text)" }} />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: "var(--ds-text-primary)" }}>
                Aucun projet pour l'instant
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--ds-text-secondary)" }}>
                Créez votre premier projet client pour commencer.
              </p>
            </div>
            <button className="btn-mint flex items-center gap-2" onClick={() => setModalOpen(true)}>
              <Plus size={15} strokeWidth={2} />
              Nouveau projet
            </button>
          </div>
        ) : (
          localProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
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
