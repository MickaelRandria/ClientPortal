"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { Check, Copy, Loader2, User, Mail, Phone } from "lucide-react";
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
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [waTemplate, setWaTemplate] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<ProjectWithStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          if (data.whatsapp_template) setWaTemplate(data.whatsapp_template);
        })
        .catch(() => {});
    }
  }, [open]);

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
        client_phone: clientPhone.trim() || null,
        slug,
        admin_id: adminId,
        status: "active",
      })
      .select("id, client_name, client_email, client_phone, slug, status, created_at")
      .single();

    setLoading(false);

    if (insertError || !project) {
      setError("Erreur lors de la création du projet.");
      return;
    }

    const newProject: ProjectWithStats = {
      ...project,
      client_phone: project.client_phone ?? null,
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

  function cleanPhone(phone: string): string {
    let p = phone.replace(/[\s\-\(\)\.]/g, "");
    if (p.startsWith("+")) p = p.slice(1);
    else if (p.startsWith("0")) p = "33" + p.slice(1);
    return p;
  }

  function buildWhatsAppUrl(phone: string | null | undefined, name: string, link: string, template?: string): string {
    const defaultMsg = `Bonjour ${name} 👋\n\nVotre espace projet est prêt ! Vous pouvez y déposer votre brief, vos fichiers et votre charte graphique.\n\n👉 Accédez à votre espace : ${link}\n\nN'hésitez pas si vous avez des questions !`;
    const msg = template 
      ? template.replace("${name}", name).replace("${link}", link)
      : defaultMsg;
    const encoded = encodeURIComponent(msg);
    if (phone && phone.trim()) return `https://wa.me/${cleanPhone(phone)}?text=${encoded}`;
    return `https://wa.me/?text=${encoded}`;
  }

  async function handleSendEmail() {
    if (!createdProject?.client_email) return;
    setEmailSending(true);
    await fetch("/api/send-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: createdProject.id,
        clientName: createdProject.client_name,
        clientEmail: createdProject.client_email,
        slug: createdProject.slug,
      }),
    }).catch(() => {});
    setEmailSending(false);
    setEmailSent(true);
    toast.success("Email envoyé !");
  }

  function handleClose() {
    onClose();
    // Reset after dialog close animation
    setTimeout(() => {
      setStep("form");
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setError(null);
      setCreatedProject(null);
      setCopied(false);
      setEmailSent(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-md border-white/5 shadow-2xl backdrop-blur-2xl"
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
                    style={{ borderRadius: "100px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
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
                    style={{ borderRadius: "100px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-phone"
                  className="text-xs font-bold uppercase"
                  style={{ letterSpacing: "0.06em", color: "var(--ds-text-secondary)" }}
                >
                  Numéro WhatsApp du client
                </Label>
                <div className="relative">
                  <Phone
                    size={15}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--ds-text-tertiary)" }}
                  />
                  <Input
                    id="modal-phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="pl-9"
                    style={{ borderRadius: "100px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
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
                  background: "var(--ds-mint-bg)",
                  border: "1px solid var(--ds-mint)",
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
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/10 border border-white/10 hover:bg-white/20"
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

              {/* Share actions */}
              <div className="flex gap-3">
                {/* WhatsApp */}
                <a
                  href={buildWhatsAppUrl(
                    createdProject?.client_phone,
                    createdProject?.client_name ?? "",
                    clientLink,
                    waTemplate
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full font-semibold text-sm text-white transition-colors"
                  style={{ background: "#25D366" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1FAD54")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#25D366")}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>

                {/* Email */}
                <button
                  onClick={handleSendEmail}
                  disabled={!createdProject?.client_email || emailSending || emailSent}
                  title={!createdProject?.client_email ? "Email client non renseigné" : undefined}
                  className="flex-1 btn-glass flex items-center justify-center gap-2 h-10 !rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {emailSending ? (
                    <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
                  ) : emailSent ? (
                    <Check size={15} strokeWidth={2.5} />
                  ) : (
                    <Mail size={15} strokeWidth={1.8} />
                  )}
                  {emailSent ? "Envoyé !" : "Email"}
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
