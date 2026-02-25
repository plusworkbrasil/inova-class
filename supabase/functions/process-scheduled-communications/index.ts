import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch scheduled communications that are due
    const { data: scheduled, error: fetchError } = await adminClient
      .from("class_communications")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching scheduled:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!scheduled || scheduled.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "Nenhum agendamento pendente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
    if (!WASENDER_API_KEY) {
      // Mark all as failed
      const ids = scheduled.map(s => s.id);
      await adminClient
        .from("class_communications")
        .update({ status: "failed" })
        .in("id", ids);
      return new Response(JSON.stringify({ error: "WASENDER_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processedCount = 0;

    for (const comm of scheduled) {
      // Mark as sending
      await adminClient
        .from("class_communications")
        .update({ status: "sending" })
        .eq("id", comm.id);

      // Fetch active students
      const { data: students } = await adminClient
        .from("profiles")
        .select("id, name, phone, email, status")
        .eq("class_id", comm.class_id)
        .eq("status", "active");

      const studentIds = (students || []).map(s => s.id);
      const { data: studentRoles } = await adminClient
        .from("user_roles")
        .select("user_id")
        .in("user_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"])
        .eq("role", "student");

      const validStudentIds = new Set((studentRoles || []).map(r => r.user_id));
      const activeStudents = (students || []).filter(s => validStudentIds.has(s.id));
      const studentsWithPhone = activeStudents.filter(s => s.phone && s.phone.trim().length >= 8);

      const results: { id: string; name: string; status: string; error?: string }[] = [];
      let sentCount = 0;
      let failedCount = 0;

      for (const student of studentsWithPhone) {
        try {
          const phone = student.phone!.replace(/\D/g, "");
          const phoneWithCountry = phone.startsWith("55") ? phone : `55${phone}`;

          const personalizedMessage = comm.message
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
            results.push({ id: student.id, name: student.name, status: "failed", error: apiData.message || "Erro" });
          }
        } catch (err) {
          failedCount++;
          results.push({ id: student.id, name: student.name, status: "failed", error: err.message });
        }
      }

      const finalStatus = failedCount === studentsWithPhone.length && studentsWithPhone.length > 0 ? "failed" : "sent";
      await adminClient
        .from("class_communications")
        .update({
          status: finalStatus,
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
          failed_count: failedCount,
          total_recipients: studentsWithPhone.length,
          send_results: results,
        })
        .eq("id", comm.id);

      // Notify sender
      const studentsWithoutPhone = activeStudents.filter(s => !s.phone || s.phone.trim().length < 8);
      const notifMessage = finalStatus === "sent"
        ? `Comunicado agendado "${comm.title}" enviado: ${sentCount}/${studentsWithPhone.length} entregues.${failedCount > 0 ? ` ${failedCount} falha(s).` : ''}${studentsWithoutPhone.length > 0 ? ` ${studentsWithoutPhone.length} sem telefone.` : ''}`
        : `Comunicado agendado "${comm.title}" falhou para todos os destinatários.`;

      await adminClient.from("notifications").insert({
        user_id: comm.sent_by,
        title: finalStatus === "sent" ? "Comunicado agendado enviado" : "Falha no comunicado agendado",
        message: notifMessage,
        type: finalStatus === "sent" ? "success" : "error",
        reference_id: comm.id,
        reference_type: "class_communication",
      });

      processedCount++;
    }

    return new Response(JSON.stringify({ processed: processedCount, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cron error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
