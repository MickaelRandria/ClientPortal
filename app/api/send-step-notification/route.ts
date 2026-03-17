import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type NotifyRole = "admin" | "client";

const NOTIFICATIONS: Record<
  string,
  {
    notifyRole: NotifyRole;
    subject: (clientName: string) => string;
    bodyText: (clientName: string, url: string) => string;
    ctaLabel: string;
  }
> = {
  brief_submitted: {
    notifyRole: "admin",
    subject: (n) => `📋 Brief reçu — ${n}`,
    bodyText: (n) =>
      `Le client <strong>${n}</strong> a soumis son brief. Consultez-le et apportez vos retours.`,
    ctaLabel: "Voir le brief",
  },
  brief_reviewed: {
    notifyRole: "client",
    subject: (n) => `✅ Retour sur votre brief — ${n}`,
    bodyText: () =>
      `L'équipe a examiné votre brief et a laissé des commentaires. Consultez les retours.`,
    ctaLabel: "Voir les retours",
  },
  brief_approved: {
    notifyRole: "client",
    subject: (n) => `🎉 Brief validé — ${n}`,
    bodyText: () => `Votre brief a été validé ! La production peut commencer.`,
    ctaLabel: "Voir mon espace",
  },
  files_uploaded: {
    notifyRole: "admin",
    subject: (n) => `📁 Fichiers reçus — ${n}`,
    bodyText: (n) =>
      `Le client <strong>${n}</strong> a déposé de nouveaux fichiers.`,
    ctaLabel: "Voir les fichiers",
  },
  comment_added: {
    notifyRole: "client",
    subject: (n) => `💬 Nouveau commentaire — ${n}`,
    bodyText: () => `L'équipe a ajouté un commentaire sur votre brief.`,
    ctaLabel: "Voir le commentaire",
  },
  status_changed: {
    notifyRole: "client",
    subject: (n) => `📌 Mise à jour projet — ${n}`,
    bodyText: () => `Le statut de votre projet a été mis à jour.`,
    ctaLabel: "Voir mon espace",
  },
  new_request: {
    notifyRole: "admin",
    subject: (n) => `🆕 Nouvelle demande — ${n}`,
    bodyText: (n) =>
      `Le client <strong>${n}</strong> souhaite collaborer sur un nouveau contenu.`,
    ctaLabel: "Voir la demande",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { projectId, actorType, action, details } = await request.json();

    const notif = NOTIFICATIONS[action];
    if (!notif) return NextResponse.json({ skipped: "unknown_action" });

    const supabase = createServerClient();

    const { data: project } = await supabase
      .from("projects")
      .select("id, client_name, client_email, slug, admin_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Anti-spam: skip if same action was already logged in the last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("action", action)
      .gte("created_at", fiveMinAgo);

    // Insert activity log entry
    await supabase.from("activity_log").insert({
      project_id: projectId,
      actor_type: actorType,
      action,
      details: details ?? null,
    });

    if ((count ?? 0) > 0) {
      return NextResponse.json({ skipped: "rate_limited" });
    }

    // Determine recipient email
    let recipientEmail: string | null = null;
    let ctaUrl = "";

    if (notif.notifyRole === "client") {
      recipientEmail = project.client_email;
      ctaUrl = `${APP_URL}/p/${project.slug}`;
    } else {
      const { data: adminUser } =
        await supabase.auth.admin.getUserById(project.admin_id);
      recipientEmail = adminUser?.user?.email ?? null;
      ctaUrl = `${APP_URL}/dashboard/${project.id}`;
    }

    if (!recipientEmail) {
      return NextResponse.json({ skipped: "no_email" });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ skipped: "no_resend_key" });
    }

    const subject = notif.subject(project.client_name);
    const bodyText = notif.bodyText(project.client_name, ctaUrl);

    const { error } = await resend.emails.send({
      from: "Client Portal <onboarding@resend.dev>",
      to: recipientEmail,
      subject,
      html: buildEmailHtml({ bodyText, ctaLabel: notif.ctaLabel, ctaUrl }),
    });

    if (error) {
      console.error("send-step-notification error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-step-notification error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildEmailHtml({
  bodyText,
  ctaLabel,
  ctaUrl,
}: {
  bodyText: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <tr><td align="center" style="padding-bottom:28px;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#34D399,#06B6D4);display:inline-block;"></div>
            <span style="font-size:18px;font-weight:800;color:#111827;letter-spacing:-0.04em;">Client Portal</span>
          </div>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.05);">
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">${bodyText}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${ctaUrl}" style="display:inline-block;background:#34D399;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;letter-spacing:-0.01em;">
                ${ctaLabel} →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
            Cet email a été envoyé automatiquement.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
