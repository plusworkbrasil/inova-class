import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUBLISHED_URL = "https://inovaclass.online";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "secretary"])
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { student_ids, custom_message } = await req.json();
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum aluno informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate custom_message if provided
    if (custom_message && typeof custom_message === "string" && !custom_message.includes("{link}")) {
      return new Response(JSON.stringify({ error: "O template deve conter {link}" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
    if (!WASENDER_API_KEY) {
      return new Response(JSON.stringify({ error: "WASENDER_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch students
    const { data: students, error: fetchError } = await adminClient
      .from("selected_students")
      .select("*")
      .in("id", student_ids);

    if (fetchError || !students) {
      return new Response(JSON.stringify({ error: "Erro ao buscar alunos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; name: string; status: string; error?: string }[] = [];

    for (const student of students) {
      try {
        // Generate token if not exists
        let inviteToken = student.invite_token;
        if (!inviteToken) {
          inviteToken = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
          await adminClient
            .from("selected_students")
            .update({
              invite_token: inviteToken,
              token_expires_at: expiresAt,
            })
            .eq("id", student.id);
        }

        // Format phone
        const phone = student.phone.replace(/\D/g, "");
        const phoneWithCountry = phone.startsWith("55") ? phone : `55${phone}`;

        const link = `${PUBLISHED_URL}/confirm-enrollment/${inviteToken}`;
        let message: string;
        if (custom_message && typeof custom_message === "string") {
          message = custom_message
            .replace(/\{nome\}/g, student.full_name)
            .replace(/\{link\}/g, link);
        } else {
          message =
            `Olá ${student.full_name}! 🎓\n\n` +
            `Parabéns! Você foi selecionado(a) para o nosso curso!\n\n` +
            `Para confirmar sua pré-matrícula, acesse o link abaixo e preencha seus dados:\n\n` +
            `${link}\n\n` +
            `⚠️ Este link é pessoal e intransferível. Válido por 48 horas.\n\n` +
            `Equipe Inova Class`;
        }

        // Mark as sending
        await adminClient
          .from("selected_students")
          .update({ whatsapp_status: "sending" })
          .eq("id", student.id);

        // Call WaSenderAPI
        const apiResponse = await fetch("https://www.wasenderapi.com/api/send-message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WASENDER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: phoneWithCountry,
            text: message,
          }),
        });

        const apiData = await apiResponse.json();

        if (apiResponse.ok) {
          await adminClient
            .from("selected_students")
            .update({
              whatsapp_sent_at: new Date().toISOString(),
              whatsapp_message_id: apiData.id || apiData.messageId || null,
              whatsapp_status: "sent",
              status: student.status === "pending" ? "invited" : student.status,
            })
            .eq("id", student.id);

          results.push({ id: student.id, name: student.full_name, status: "sent" });
        } else {
          await adminClient
            .from("selected_students")
            .update({ whatsapp_status: "failed" })
            .eq("id", student.id);

          results.push({
            id: student.id,
            name: student.full_name,
            status: "failed",
            error: apiData.message || "Erro desconhecido",
          });
        }
      } catch (err) {
        await adminClient
          .from("selected_students")
          .update({ whatsapp_status: "failed" })
          .eq("id", student.id);

        results.push({
          id: student.id,
          name: student.full_name,
          status: "failed",
          error: err.message,
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return new Response(
      JSON.stringify({ sent, failed, total: results.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
