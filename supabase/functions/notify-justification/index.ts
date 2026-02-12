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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } =
      await supabaseClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { declaration_id, student_name } = await req.json();

    if (!declaration_id || !student_name) {
      return new Response(
        JSON.stringify({ error: "declaration_id and student_name required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all users with admin, coordinator, or tutor roles
    const { data: targetUsers, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "coordinator", "tutor"]);

    if (rolesError) {
      console.error("Error fetching target users:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch target users" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!targetUsers || targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No target users found", notified: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Deduplicate user IDs
    const uniqueUserIds = [...new Set(targetUsers.map((u) => u.user_id))];

    // Create notifications for each target user
    const notifications = uniqueUserIds.map((userId) => ({
      user_id: userId,
      title: "Nova Justificativa de Falta",
      message: `O aluno ${student_name} enviou uma justificativa de falta para análise.`,
      type: "justification_pending",
      reference_id: declaration_id,
      reference_type: "declaration",
    }));

    const { error: insertError } = await supabaseAdmin
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Error inserting notifications:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create notifications" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Notifications created",
        notified: uniqueUserIds.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
