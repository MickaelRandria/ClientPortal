"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Lock, 
  MessageSquare, 
  Smartphone, 
  Save, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

interface Profile {
  full_name: string;
  whatsapp_template: string;
  welcome_email_subject: string;
  welcome_email_body: string;
}

export default function SettingsView({ initialProfile, userEmail }: { initialProfile: Profile | null, userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: initialProfile?.full_name || "",
    whatsapp_template: initialProfile?.whatsapp_template || "Bonjour ${name} 👋\n\nVotre espace projet est prêt ! Vous pouvez y déposer votre brief, vos fichiers et votre charte graphique.\n\n👉 Accédez à votre espace : ${link}\n\nN'hésitez pas si vous avez des questions !",
    welcome_email_subject: initialProfile?.welcome_email_subject || "🎉 Votre espace projet est prêt — ${clientName}",
    welcome_email_body: initialProfile?.welcome_email_body || "",
  });

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      toast.success("Réglages enregistrés !");
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col p-8 gap-8 max-w-[1200px] mx-auto w-full">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ds-text-primary)]">
          Réglages
        </h1>
        <p className="text-[var(--ds-text-secondary)] mt-1">
          Personnalisez vos outils et gérez votre compte.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column - Profile */}
        <div className="md:col-span-5 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-[var(--ds-text-primary)]">Compte</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-[var(--ds-text-tertiary)]">
                  Nom complet
                </Label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)]" />
                  <Input 
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="pl-10 !rounded-xl bg-white/5 border-white/5 focus:border-purple-500/50"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="space-y-1.5 opacity-60">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[var(--ds-text-tertiary)]">
                  Email (Non modifiable)
                </Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ds-text-tertiary)]" />
                  <Input 
                    id="email"
                    value={userEmail}
                    disabled
                    className="pl-10 !rounded-xl bg-white/5 border-white/5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-red-500/10">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Lock size={20} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-[var(--ds-text-primary)]">Sécurité</h2>
              </div>
              <p className="text-sm text-[var(--ds-text-secondary)] mb-4">
                Pour modifier votre mot de passe, un email de réinitialisation vous sera envoyé.
              </p>
              <button 
                className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/5 transition-colors"
                onClick={() => toast.info("Fonctionnalité bientôt disponible")}
              >
                Réinitialiser le mot de passe
              </button>
          </div>
        </div>

        {/* Right Column - Templates */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <MessageSquare size={20} className="text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-[var(--ds-text-primary)]">Email de bienvenue</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email_subject" className="text-xs font-bold uppercase tracking-wider text-[var(--ds-text-tertiary)]">
                  Sujet de l'email
                </Label>
                <Input 
                  id="email_subject"
                  value={profile.welcome_email_subject}
                  onChange={(e) => setProfile({ ...profile, welcome_email_subject: e.target.value })}
                  className="!rounded-xl bg-white/5 border-white/5 focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email_body" className="text-xs font-bold uppercase tracking-wider text-[var(--ds-text-tertiary)]">
                  Message (Body HTML)
                </Label>
                <Textarea 
                  id="email_body"
                  value={profile.welcome_email_body}
                  onChange={(e) => setProfile({ ...profile, welcome_email_body: e.target.value })}
                  className="min-h-[200px] !rounded-xl bg-white/5 border-white/5 focus:border-purple-500/50 text-sm leading-relaxed"
                  placeholder="Laissez vide pour utiliser le template par défaut..."
                />
                <p className="text-[10px] text-[var(--ds-text-tertiary)] px-1">
                  Variables disponibles : {"${clientName}"}, {"${portalUrl}"}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Smartphone size={20} className="text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-[var(--ds-text-primary)]">Message WhatsApp</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wa_template" className="text-xs font-bold uppercase tracking-wider text-[var(--ds-text-tertiary)]">
                  Template du message
                </Label>
                <Textarea 
                  id="wa_template"
                  value={profile.whatsapp_template}
                  onChange={(e) => setProfile({ ...profile, whatsapp_template: e.target.value })}
                  className="min-h-[120px] !rounded-xl bg-white/5 border-white/5 focus:border-purple-500/50 text-sm"
                />
                <p className="text-[10px] text-[var(--ds-text-tertiary)] px-1">
                  Variables disponibles : {"${name}"}, {"${link}"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              disabled={loading}
              onClick={handleSave}
              className="btn-mint !px-8 flex items-center gap-2 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="transition-transform group-hover:scale-110" />}
              <span className="font-bold">Enregistrer les modifications</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
