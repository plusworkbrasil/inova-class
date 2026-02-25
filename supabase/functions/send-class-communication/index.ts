import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 3001) + 5000); // 5-8 seconds

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.user.id;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check role - admin, secretary, tutor, coordinator
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "secretary", "tutor", "coordinator"])
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { class_id, subject_id, title, message, scheduled_at } = await req.json();

    if (!class_id || !title || !message) {
      return new Response(JSON.stringify({ error: "class_id, title e message são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate message length
    if (message.length > 1000) {
      return new Response(JSON.stringify({ error: "Mensagem excede 1.000 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active students from the class (exclude evaded)
    const { data: students, error: studentsError } = await adminClient
      .from("profiles")
      .select("id, name, phone, email, status")
      .eq("class_id", class_id)
      .eq("status", "active");

    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      return new Response(JSON.stringify({ error: "Erro ao buscar alunos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also check they are actually students via user_roles
    const studentIds = (students || []).map(s => s.id);
    const { data: studentRoles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .in("user_id", studentIds)
      .eq("role", "student");

    const validStudentIds = new Set((studentRoles || []).map(r => r.user_id));
    const activeStudents = (students || []).filter(s => validStudentIds.has(s.id));

    // Check for students without phone
    const studentsWithPhone = activeStudents.filter(s => s.phone && s.phone.trim().length >= 8);
    const studentsWithoutPhone = activeStudents.filter(s => !s.phone || s.phone.trim().length < 8);

    // Create the communication record
    const commRecord = {
      class_id,
      subject_id: subject_id || null,
      title,
      message,
      sent_by: userId,
      status: scheduled_at ? "scheduled" : "sending",
      scheduled_at: scheduled_at || null,
      total_recipients: studentsWithPhone.length,
    };

    const { data: commData, error: commError } = await adminClient
      .from("class_communications")
      .insert(commRecord)
      .select("id")
      .single();

    if (commError) {
      console.error("Error creating communication:", commError);
      return new Response(JSON.stringify({ error: "Erro ao criar comunicado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If scheduled, just return - a cron job would handle it
    if (scheduled_at) {
      return new Response(JSON.stringify({
        success: true,
        communication_id: commData.id,
        status: "scheduled",
        scheduled_at,
        total_recipients: studentsWithPhone.length,
        without_phone: studentsWithoutPhone.map(s => ({ id: s.id, name: s.name })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send immediately
    const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
    if (!WASENDER_API_KEY) {
      await adminClient
        .from("class_communications")
        .update({ status: "failed" })
        .eq("id", commData.id);
      return new Response(JSON.stringify({ error: "WASENDER_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; name: string; status: string; error?: string }[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < studentsWithPhone.length; i++) {
      const student = studentsWithPhone[i];
      try {
        // Add random delay between sends (5-8s) to avoid spam detection
        if (i > 0) await randomDelay();
        const phone = student.phone.replace(/\D/g, "");
        const phoneWithCountry = phone.startsWith("55") ? phone : `55${phone}`;

        // Replace variables in message
        const personalizedMessage = message
          .replace(/\{nome\}/g, student.name)
          .replace(/\{email\}/g, student.email || "");

        const apiResponse = await fetch("https://www.wasenderapi.com/api/send-message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WASENDER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: phoneWithCountry,
            text: personalizedMessage,
          }),
        });

        const apiData = await apiResponse.json();

        if (apiResponse.ok) {
          sentCount++;
          results.push({ id: student.id, name: student.name, status: "sent" });
        } else {
          failedCount++;
          results.push({
            id: student.id,
            name: student.name,
            status: "failed",
            error: apiData.message || "Erro desconhecido",
          });
        }
      } catch (err) {
        failedCount++;
        results.push({
          id: student.id,
          name: student.name,
          status: "failed",
          error: err.message,
        });
      }
    }

    // Update communication record
    const finalStatus = failedCount === studentsWithPhone.length ? "failed" : "sent";
    await adminClient
      .from("class_communications")
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
        send_results: results,
      })
      .eq("id", commData.id);

    // Notify sender about completion
    const notifMessage = finalStatus === "sent"
      ? `Comunicado "${title}" enviado com sucesso: ${sentCount}/${studentsWithPhone.length} entregues.${failedCount > 0 ? ` ${failedCount} falha(s).` : ''}${studentsWithoutPhone.length > 0 ? ` ${studentsWithoutPhone.length} sem telefone.` : ''}`
      : `Comunicado "${title}" falhou para todos os ${studentsWithPhone.length} destinatários.`;

    await adminClient.from("notifications").insert({
      user_id: userId,
      title: finalStatus === "sent" ? "Comunicado enviado" : "Falha no comunicado",
      message: notifMessage,
      type: finalStatus === "sent" ? "success" : "error",
      reference_id: commData.id,
      reference_type: "class_communication",
    });

    return new Response(
      JSON.stringify({
        success: true,
        communication_id: commData.id,
        sent: sentCount,
        failed: failedCount,
        total: studentsWithPhone.length,
        without_phone: studentsWithoutPhone.map(s => ({ id: s.id, name: s.name })),
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
