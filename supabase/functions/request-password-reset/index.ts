import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Find profile by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, phone, name")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (profileError || !profile) {
      // Generic message for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({ success: true, message: "Se o email estiver cadastrado, você receberá um link via WhatsApp." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has phone
    if (!profile.phone) {
      return new Response(
        JSON.stringify({ success: false, noPhone: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Format phone number
    let phone = profile.phone.replace(/\D/g, "");
    if (phone.length === 11 || phone.length === 10) {
      phone = "55" + phone;
    }
    if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    // Send WhatsApp via WaSender API
    const resetLink = `https://inovaclass.online/reset-password/${token}`;
    const message = `Olá ${profile.name || ""}!\n\nVocê solicitou a redefinição de senha do InovaClass.\n\nClique no link abaixo para criar uma nova senha:\n${resetLink}\n\nEste link expira em 1 hora.\n\nSe você não solicitou, ignore esta mensagem.`;

    const wasenderApiKey = Deno.env.get("WASENDER_API_KEY");
    if (!wasenderApiKey) {
      console.error("WASENDER_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de WhatsApp não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const waResponse = await fetch("https://app.wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${wasenderApiKey}`,
      },
      body: JSON.stringify({
        to: phone,
        text: message,
      }),
    });

    if (!waResponse.ok) {
      const waError = await waResponse.text();
      console.error("WaSender error:", waError);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar mensagem via WhatsApp" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
