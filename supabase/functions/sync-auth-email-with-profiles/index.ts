import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get JWT token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Email sync requested by user: ${user.id}`);

    // Verify user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Only admins can sync emails');
    }

    console.log('Admin verification successful');

    // Get emails from request body
    const { emails } = await req.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error('Emails array is required');
    }

    console.log(`Syncing emails for: ${emails.join(', ')}`);

    const results = {
      total: emails.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Sync email for each provided email
    for (const email of emails) {
      try {
        // Find user in profiles by email
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, name')
          .eq('email', email)
          .single();
        
        if (profileError || !profileData) {
          results.failed++;
          results.errors.push(`Perfil não encontrado: ${email}`);
          console.error(`Profile not found for email: ${email}`);
          continue;
        }

        console.log(`Syncing email for ${profileData.name} (ID: ${profileData.id}): ${profileData.email}`);

        // Update auth.users email to match profiles email
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          profileData.id,
          { email: profileData.email }
        );

        if (updateError) {
          results.failed++;
          results.errors.push(`Falha ao sincronizar ${email}: ${updateError.message}`);
          console.error(`Failed to sync email for ${email}:`, updateError);
        } else {
          results.success++;
          console.log(`Successfully synced email for ${email} (ID: ${profileData.id})`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Exceção para ${email}: ${err.message}`);
        console.error(`Exception syncing email for ${email}:`, err);
      }
    }

    console.log(`Email sync complete: ${results.success} success, ${results.failed} failed`);

    // Log the operation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'SYNC_AUTH_EMAIL',
        table_name: 'profiles',
        record_id: user.id,
        accessed_fields: ['email'],
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sincronizados: ${results.success} com sucesso, ${results.failed} com falha`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in sync-auth-email-with-profiles:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
