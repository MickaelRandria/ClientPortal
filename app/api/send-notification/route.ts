import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Anti-spam: one email per project per 5 minutes
const lastSent = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

function buildChatHtml(opts: {
  senderName: string;
  messageContent: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  const { senderName, messageContent, ctaLabel, ctaUrl } = opts;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#34D399,#06B6D4);display:inline-block;"></div>
            <span style="font-size:18px;font-weight:800;color:#111827;letter-spacing:-0.04em;">Client Portal</span>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.05);">

          <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.04em;">
            Nouveau message de ${senderName}
          </h1>

          <!-- Quote block -->
          <div style="background:#F4F5F7;border-left:4px solid #34D399;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${messageContent}</p>
          </div>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${ctaUrl}" style="display:inline-block;background:#34D399;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;letter-spacing:-0.01em;">
                ${ctaLabel}
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
            Cet email a été envoyé automatiquement.<br>
            Répondez directement depuis votre espace pour continuer la conversation.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, senderType, senderName, messageContent } = await request.json();

    // Anti-spam check
    const now = Date.now();
    const last = lastSent.get(projectId);
    if (last && now - last < COOLDOWN_MS) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const supabase = createServerClient();

    const { data: project } = await supabase
      .from("projects")
      .select("client_name, client_email, slug, admin_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let to: string | null = null;
    let subject: string;
    let html: string;

    if (senderType === "client") {
      // Email to admin
      const { data: adminUser } = await supabase.auth.admin.getUserById(project.admin_id);
      to = adminUser?.user?.email ?? null;

      subject = `💬 Nouveau message — Projet ${project.client_name}`;
      html = buildChatHtml({
        senderName,
        messageContent,
        ctaLabel: "Voir la conversation",
        ctaUrl: `${APP_URL}/dashboard/${projectId}?tab=messages`,
      });
    } else {
      // Email to client
      to = project.client_email ?? null;

      subject = "💬 Nouveau message sur votre projet";
      html = buildChatHtml({
        senderName,
        messageContent,
        ctaLabel: "Répondre",
        ctaUrl: `${APP_URL}/p/${project.slug}`,
      });
    }

    if (!to) {
      return NextResponse.json({ skipped: true, reason: "no email" }, { status: 200 });
    }

    const { error } = await resend.emails.send({
      from: "Client Portal <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("send-notification error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record send time for anti-spam
    lastSent.set(projectId, now);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-notification error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
