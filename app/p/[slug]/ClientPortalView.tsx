"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { FileText, FolderOpen, MessageSquare, Save } from "lucide-react";
import FilesTab, { type UploadRecord } from "./FilesTab";
import AISummaryTab from "@/components/AISummaryTab";
import Chat, { type Message } from "@/components/Chat";

const STATUS_BADGE = {
  active:    { label: "Projet Actif",    bg: "var(--ds-mint-bg)",  color: "var(--ds-mint-text)" },
  draft:     { label: "En préparation",  bg: "rgba(0,0,0,0.05)",   color: "var(--ds-text-secondary)" },
  completed: { label: "Projet Terminé",  bg: "var(--ds-blue-bg)",  color: "var(--ds-blue-text)" },
} as const;

interface Project {
  id: string;
  client_name: string;
  slug: string;
  status: "draft" | "active" | "completed";
  ai_summary: Record<string, unknown> | null;
}

interface Brief {
  id?: string;
  project_id?: string;
  objectif?: string;
  cible?: string;
  ton_souhaite?: string;
  livrables_attendus?: string;
  deadline?: string;
  notes_libres?: string;
}

interface Props {
  project: Project;
  initialBrief: Brief | null;
  initialUploads: UploadRecord[];
  initialMessages: Message[];
}

export default function ClientPortalView({ project, initialBrief, initialUploads, initialMessages }: Props) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    objectif: initialBrief?.objectif ?? "",
    cible: initialBrief?.cible ?? "",
    ton_souhaite: initialBrief?.ton_souhaite ?? "",
    livrables_attendus: initialBrief?.livrables_attendus ?? "",
    deadline: initialBrief?.deadline ?? "",
    notes_libres: initialBrief?.notes_libres ?? "",
  });

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("briefs")
      .upsert({
        project_id: project.id,
        objectif: form.objectif || null,
        cible: form.cible || null,
        ton_souhaite: form.ton_souhaite || null,
        livrables_attendus: form.livrables_attendus || null,
        deadline: form.deadline || null,
        notes_libres: form.notes_libres || null,
      }, { onConflict: "project_id" });

    setSaving(false);

    if (error) {
      toast.error(`Erreur : ${error.message}`);
    } else {
      toast.success("Brief enregistré !");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b px-8 py-5 bg-white/80 backdrop-blur-2xl border-[var(--ds-border-subtle)]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center font-bold text-white text-base bg-gradient-to-br from-[#34D399] to-[#06B6D4] shadow-md shadow-emerald-200/50">
              {project.client_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase text-[var(--ds-text-tertiary)] tracking-widest leading-none mb-1.5">
                Portail Client
              </p>
              <h1 className="font-extrabold text-xl leading-none text-[var(--ds-text-primary)] tracking-tighter">
                {project.client_name}
              </h1>
            </div>
          </div>
          
          {(() => {
            const badge = STATUS_BADGE[project.status] ?? STATUS_BADGE.active;
            return (
              <div
                className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </div>
            );
          })()}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Main Area (Tabs) - 8/12 */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs defaultValue="brief" orientation="vertical" className="w-full items-start gap-8">
              {/* Vertical Sidebar Tabs */}
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
                    <div className="mb-10">
                      <h2 className="text-2xl font-extrabold text-[var(--ds-text-primary)] tracking-tight mb-2">
                        Brief du projet
                      </h2>
                      <p className="text-sm text-[var(--ds-text-secondary)]">
                        Partagez vos objectifs pour nous aider à créer un résultat exceptionnel.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      <Field label="Objectif du projet">
                        <Textarea
                          placeholder="Quel est l'objectif principal de ce projet ?"
                          className="rounded-[1.5rem] bg-black/[0.02] border-black/5 focus:bg-white transition-all text-sm min-h-[100px]"
                          value={form.objectif}
                          onChange={(e) => handleChange("objectif", e.target.value)}
                        />
                      </Field>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Field label="Cible visée">
                          <Textarea
                            placeholder="À qui s'adresse ce projet ?"
                            className="rounded-[1.5rem] bg-black/[0.02] border-black/5 focus:bg-white transition-all text-sm min-h-[100px]"
                            value={form.cible}
                            onChange={(e) => handleChange("cible", e.target.value)}
                          />
                        </Field>

                        <Field label="Ton souhaité">
                          <Textarea
                            placeholder="Ex : Pro, créatif, institutionnel..."
                            className="rounded-[1.5rem] bg-black/[0.02] border-black/5 focus:bg-white transition-all text-sm min-h-[100px]"
                            value={form.ton_souhaite}
                            onChange={(e) => handleChange("ton_souhaite", e.target.value)}
                          />
                        </Field>
                      </div>

                      <Field label="Livrables attendus">
                        <Textarea
                          placeholder="Ex : Logo, Site Web, Identité visuelle..."
                          className="rounded-[1.5rem] bg-black/[0.02] border-black/5 focus:bg-white transition-all text-sm"
                          value={form.livrables_attendus}
                          onChange={(e) => handleChange("livrables_attendus", e.target.value)}
                        />
                      </Field>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <Field label="Echéance souhaitée (Deadline)">
                          <Input
                            type="date"
                            className="rounded-full bg-black/[0.02] border-black/5 focus:bg-white h-12 transition-all"
                            value={form.deadline}
                            onChange={(e) => handleChange("deadline", e.target.value)}
                          />
                        </Field>
                        <div className="flex justify-end">
                          <button
                            className="btn-mint w-full md:w-auto h-12 px-10 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            <Save size={18} strokeWidth={2.2} />
                            {saving ? "Sauvegarde..." : "Enregistrer le brief"}
                          </button>
                        </div>
                      </div>

                      <Field label="Notes & informations libres">
                        <Textarea
                          placeholder="Toute autre information pertinente..."
                          className="rounded-[2rem] bg-black/[0.02] border-black/5 focus:bg-white transition-all text-sm min-h-[120px]"
                          value={form.notes_libres}
                          onChange={(e) => handleChange("notes_libres", e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                </TabsContent>

                {/* FICHIERS CONTENT */}
                <TabsContent value="fichiers" className="mt-0 outline-none" keepMounted>
                  <FilesTab projectId={project.id} initialFiles={initialUploads} />
                </TabsContent>

                {/* MESSAGES CONTENT */}
                <TabsContent value="messages" className="mt-0 outline-none" keepMounted>
                  <Chat
                    projectId={project.id}
                    senderType="client"
                    senderName={project.client_name}
                    initialMessages={initialMessages}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar Area (AI Summary) - 4/12 */}
          <div className="col-span-12 lg:col-span-4 sticky top-[108px] self-start">
            <AISummaryTab 
              projectId={project.id} 
              initialSummary={project.ai_summary} 
              readOnly={true} 
            />
          </div>
        </div>
      </main>
    </div>

  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label
        className="block text-xs font-bold uppercase"
        style={{ color: "var(--ds-text-secondary)", letterSpacing: "0.06em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
