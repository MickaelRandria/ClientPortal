import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { clientName, clientEmail, slug } = await request.json();

    if (!clientEmail) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const portalUrl = `${APP_URL}/p/${slug}`;

    const html = `<!DOCTYPE html>
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

          <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.04em;">Bonjour ${clientName} !</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#6B7280;line-height:1.6;">
            Votre espace projet a été créé. Vous pouvez dès maintenant déposer votre brief, vos fichiers et échanger avec notre équipe.
          </p>

          <!-- 3 steps -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr>
              <td style="width:33%;padding:4px;">
                <div style="background:#F0FDF4;border-radius:12px;padding:16px 12px;text-align:center;">
                  <div style="font-size:22px;margin-bottom:6px;">📋</div>
                  <div style="font-size:12px;font-weight:700;color:#065F46;">Remplissez votre brief</div>
                </div>
              </td>
              <td style="width:33%;padding:4px;">
                <div style="background:#F0FDF4;border-radius:12px;padding:16px 12px;text-align:center;">
                  <div style="font-size:22px;margin-bottom:6px;">📁</div>
                  <div style="font-size:12px;font-weight:700;color:#065F46;">Déposez vos fichiers</div>
                </div>
              </td>
              <td style="width:33%;padding:4px;">
                <div style="background:#F0FDF4;border-radius:12px;padding:16px 12px;text-align:center;">
                  <div style="font-size:22px;margin-bottom:6px;">💬</div>
                  <div style="font-size:12px;font-weight:700;color:#065F46;">Échangez avec nous</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${portalUrl}" style="display:inline-block;background:#34D399;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;letter-spacing:-0.01em;">
                Accéder à mon espace →
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
            Cet email a été envoyé automatiquement.<br>
            Si vous avez des questions, répondez directement dans le chat de votre espace.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "Client Portal <onboarding@resend.dev>",
      to: clientEmail,
      subject: `🎉 Votre espace projet est prêt — ${clientName}`,
      html,
    });

    if (error) {
      console.error("send-welcome error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-welcome error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
