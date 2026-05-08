import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_DEFAULT = "InovaClass <no-reply@inovaclass.online>";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function buildEmailHtml(name: string, resetLink: string): string {
  const safeName = (name || "").replace(/[<>&"']/g, "");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>Redefinição de senha</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <tr><td style="padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
          <h1 style="margin:0;font-size:22px;color:#0f172a;">InovaClass</h1>
        </td></tr>
        <tr><td style="padding:24px 0 8px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Olá${safeName ? `, ${safeName}` : ""}!</h2>
          <p style="margin:0 0 16px;line-height:1.5;font-size:14px;color:#374151;">
            Recebemos uma solicitação para redefinir a senha da sua conta no InovaClass.
            Clique no botão abaixo para criar uma nova senha:
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-weight:600;font-size:14px;">
              Redefinir minha senha
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">
            Ou copie e cole este link no navegador:<br/>
            <a href="${resetLink}" style="color:#2563eb;word-break:break-all;">${resetLink}</a>
          </p>
          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
            Este link expira em <strong>1 hora</strong>. Se você não solicitou, ignore este e-mail.
          </p>
        </td></tr>
        <tr><td style="padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
          © ${new Date().getFullYear()} InovaClass — inovaclass.online
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmailViaResend(params: {
  to: string;
  subject: string;
  html: string;
  userId: string;
  supabaseAdmin: ReturnType<typeof createClient>;
}): Promise<boolean> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!lovableKey || !resendKey) {
    console.error("Resend not configured (missing LOVABLE_API_KEY or RESEND_API_KEY)");
    return false;
  }

  let status: "sent" | "failed" = "failed";
  let errorMessage: string | null = null;

  try {
    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: FROM_DEFAULT,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (resp.ok) {
      status = "sent";
    } else {
      errorMessage = await resp.text();
      console.error("Resend error:", errorMessage);
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Resend exception:", errorMessage);
  }

  try {
    await params.supabaseAdmin.from("email_send_log").insert({
      recipient_email: params.to,
      subject: params.subject,
      template_type: "other",
      reference_id: params.userId,
      status,
      error_message: errorMessage,
      sent_by: params.userId,
    });
  } catch (logErr) {
    console.error("Failed to log email send:", logErr);
  }

  return status === "sent";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, phone, name, email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    const genericResponse = () => new Response(
      JSON.stringify({
        success: true,
        message: "Se o email estiver cadastrado, você receberá um link via WhatsApp e/ou e-mail.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    if (profileError || !profile) {
      return genericResponse();
    }

    // Rate limiting: max 3 requests per email in 1 hour
    const { count } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("used", false)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (count && count >= 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Muitas solicitações. Tente novamente em 1 hora." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { error: insertError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        user_id: profile.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting token:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro interno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = `https://inovaclass.online/reset-password/${token}`;
    const message = `Olá ${profile.name || ""}!\n\nVocê solicitou a redefinição de senha do InovaClass.\n\nClique no link abaixo para criar uma nova senha:\n${resetLink}\n\nEste link expira em 1 hora.\n\nSe você não solicitou, ignore esta mensagem.`;

    let whatsappSent = false;
    let emailSent = false;

    // 1) Try WhatsApp first
    if (profile.phone) {
      let phone = profile.phone.replace(/\D/g, "");
      if (phone.length === 11 || phone.length === 10) {
        phone = "55" + phone;
      }
      if (!phone.startsWith("+")) {
        phone = "+" + phone;
      }

      const wasenderApiKey = Deno.env.get("WASENDER_API_KEY");
      if (wasenderApiKey) {
        try {
          const waResponse = await fetch("https://app.wasenderapi.com/api/send-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${wasenderApiKey}`,
            },
            body: JSON.stringify({ to: phone, text: message }),
          });
          if (waResponse.ok) {
            whatsappSent = true;
          } else {
            const waError = await waResponse.text();
            console.error("WaSender error:", waError);
          }
        } catch (e) {
          console.error("WaSender exception:", e);
        }
      } else {
        console.error("WASENDER_API_KEY not configured");
      }
    }

    // 2) Fallback to e-mail when WhatsApp didn't go out
    if (!whatsappSent && profile.email) {
      emailSent = await sendEmailViaResend({
        to: profile.email,
        subject: "Redefinição de senha - InovaClass",
        html: buildEmailHtml(profile.name || "", resetLink),
        userId: profile.id,
        supabaseAdmin,
      });
    }

    if (!whatsappSent && !emailSent) {
      return new Response(
        JSON.stringify({ error: "Não foi possível enviar o link de redefinição. Tente novamente mais tarde." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        channel: whatsappSent ? "whatsapp" : "email",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
