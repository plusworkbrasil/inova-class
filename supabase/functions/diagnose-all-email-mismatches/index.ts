import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se o usuário tem permissão (admin ou secretary)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData) {
      throw new Error('Unable to verify user role');
    }

    if (roleData.role !== 'admin' && roleData.role !== 'secretary') {
      throw new Error('Only admins and secretaries can run diagnostics');
    }

    console.log('Starting email mismatch diagnostic...');

    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .order('name');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles to check`);

    const mismatches = [];
    const matches = [];
    const errors = [];

    // Verificar cada perfil
    for (const profile of profiles || []) {
      try {
        const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(
          profile.id
        );

        if (authError) {
          console.error(`Error fetching auth user for ${profile.id}:`, authError);
          errors.push({
            userId: profile.id,
            name: profile.name,
            profileEmail: profile.email,
            error: authError.message
          });
          continue;
        }

        if (!authUserData.user) {
          errors.push({
            userId: profile.id,
            name: profile.name,
            profileEmail: profile.email,
            error: 'Auth user not found'
          });
          continue;
        }

        // Comparar emails
        if (authUserData.user.email !== profile.email) {
          console.log(`Mismatch found: ${profile.name} - Profile: ${profile.email}, Auth: ${authUserData.user.email}`);
          mismatches.push({
            userId: profile.id,
            name: profile.name,
            profileEmail: profile.email,
            authEmail: authUserData.user.email
          });
        } else {
          matches.push({
            userId: profile.id,
            name: profile.name,
            email: profile.email
          });
        }
      } catch (err) {
        console.error(`Error processing user ${profile.id}:`, err);
        errors.push({
          userId: profile.id,
          name: profile.name,
          profileEmail: profile.email,
          error: err.message
        });
      }
    }

    console.log(`Diagnostic complete: ${mismatches.length} mismatches, ${matches.length} matches, ${errors.length} errors`);

    // Registrar a operação no audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'DIAGNOSE_EMAIL_MISMATCHES',
      table_name: 'profiles',
      record_id: null,
      accessed_fields: ['email']
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: profiles?.length || 0,
          mismatches: mismatches.length,
          matches: matches.length,
          errors: errors.length
        },
        mismatches,
        errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in diagnose-all-email-mismatches function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
