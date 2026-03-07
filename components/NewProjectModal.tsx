"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { Check, Copy, Loader2, User, Mail } from "lucide-react";
import { toast } from "sonner";
import type { ProjectWithStats } from "@/app/dashboard/DashboardView";

interface Props {
  open: boolean;
  onClose: () => void;
  adminId: string;
  onCreated: (project: ProjectWithStats) => void;
}

function generateSlug(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

export default function NewProjectModal({ open, onClose, adminId, onCreated }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<ProjectWithStats | null>(null);
  const [copied, setCopied] = useState(false);

  const clientLink = createdProject
    ? `${window.location.origin}/p/${createdProject.slug}`
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Generate a unique slug (retry once if collision)
    let slug = generateSlug();
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) slug = generateSlug();

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        slug,
        admin_id: adminId,
        status: "active",
      })
      .select("id, client_name, client_email, slug, status, created_at")
      .single();

    setLoading(false);

    if (insertError || !project) {
      setError("Erreur lors de la création du projet.");
      return;
    }

    const newProject: ProjectWithStats = {
      ...project,
      uploadsCount: 0,
      unreadCount: 0,
      lastMessage: null,
    };

    setCreatedProject(newProject);
    onCreated(newProject);
    setStep("success");
    toast.success(`Projet "${clientName.trim()}" créé !`);

    // Send welcome email if client email provided (fire-and-forget)
    if (project.client_email) {
      fetch("/api/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          clientName: project.client_name,
          clientEmail: project.client_email,
          slug: project.slug,
        }),
      }).catch(() => {});
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(clientLink);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onClose();
    // Reset after dialog close animation
    setTimeout(() => {
      setStep("form");
      setClientName("");
      setClientEmail("");
      setError(null);
      setCreatedProject(null);
      setCopied(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-md border-white/40 shadow-2xl backdrop-blur-2xl"
        style={{ borderRadius: "var(--radius)", background: "var(--ds-surface)" }}
      >
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle
                className="font-extrabold text-xl"
                style={{ color: "var(--ds-text-primary)", letterSpacing: "-0.04em" }}
              >
                Nouveau projet
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-name"
                  className="text-xs font-bold uppercase"
                  style={{ letterSpacing: "0.06em", color: "var(--ds-text-secondary)" }}
                >
                  Nom du client *
                </Label>
                <div className="relative">
                  <User
                    size={15}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--ds-text-tertiary)" }}
                  />
                  <Input
                    id="modal-name"
                    required
                    placeholder="Acme Corp."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="pl-9"
                    style={{ borderRadius: "100px" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-email"
                  className="text-xs font-bold uppercase"
                  style={{ letterSpacing: "0.06em", color: "var(--ds-text-secondary)" }}
                >
                  Email du client
                </Label>
                <div className="relative">
                  <Mail
                    size={15}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--ds-text-tertiary)" }}
                  />
                  <Input
                    id="modal-email"
                    type="email"
                    placeholder="client@exemple.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="pl-9"
                    style={{ borderRadius: "100px" }}
                  />
                </div>
              </div>

              {error && (
                <div
                  className="rounded-2xl px-4 py-3 text-sm font-bold"
                  style={{ background: "var(--ds-red-bg)", color: "var(--ds-red-text)" }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  className="btn-glass !rounded-full"
                  onClick={handleClose}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-mint flex items-center gap-2"
                >
                  {loading && (
                    <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
                  )}
                  {loading ? "Création…" : "Créer le projet"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle
                className="font-extrabold text-xl"
                style={{ color: "var(--ds-text-primary)", letterSpacing: "-0.04em" }}
              >
                Projet créé ✓
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5 mt-2">
              <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                Le portail client de{" "}
                <strong style={{ color: "var(--ds-text-primary)" }}>
                  {createdProject?.client_name}
                </strong>{" "}
                est prêt. Partagez ce lien avec votre client :
              </p>

              <div
                className="rounded-[24px] p-4 flex items-center gap-3"
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #DCFCE7",
                }}
              >
                <p
                  className="flex-1 text-sm font-bold break-all"
                  style={{ color: "var(--ds-mint-text)" }}
                >
                  {clientLink}
                </p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white border border-[#DCFCE7] hover:bg-white/80"
                  title="Copier le lien"
                >
                  {copied ? (
                    <Check size={16} strokeWidth={2.5} className="text-[var(--ds-mint-text)]" />
                  ) : (
                    <Copy
                      size={16}
                      strokeWidth={2}
                      className="text-[var(--ds-mint-text)]"
                    />
                  )}
                </button>
              </div>

              <button className="btn-mint w-full" onClick={handleClose}>
                Fermer
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
