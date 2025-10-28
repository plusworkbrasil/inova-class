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

    console.log(`Diagnosis requested by user: ${user.id}`);

    // Verify user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Only admins can access diagnosis');
    }

    console.log('Admin verification successful');

    // Get emails from request body
    const { emails } = await req.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error('Emails array is required');
    }

    console.log(`Diagnosing emails: ${emails.join(', ')}`);

    const results = [];

    // Diagnose each email
    for (const email of emails) {
      try {
        // Find user in profiles by email
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, name')
          .eq('email', email)
          .single();
        
        if (profileError || !profileData) {
          results.push({
            profile_email: email,
            profile_id: null,
            profile_name: null,
            auth_email: null,
            email_confirmed: null,
            last_sign_in_at: null,
            status: 'NOT_FOUND_IN_PROFILES',
            message: 'Email não encontrado na tabela profiles'
          });
          console.log(`Profile not found for: ${email}`);
          continue;
        }

        console.log(`Found profile: ${profileData.id} - ${profileData.name}`);

        // Get auth user data
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(
          profileData.id
        );

        if (authError || !authData.user) {
          results.push({
            profile_email: profileData.email,
            profile_id: profileData.id,
            profile_name: profileData.name,
            auth_email: null,
            email_confirmed: null,
            last_sign_in_at: null,
            status: 'NOT_FOUND_IN_AUTH',
            message: 'Usuário não encontrado no auth.users'
          });
          console.log(`Auth user not found for ID: ${profileData.id}`);
          continue;
        }

        const emailsMatch = authData.user.email === profileData.email;
        
        results.push({
          profile_email: profileData.email,
          profile_id: profileData.id,
          profile_name: profileData.name,
          auth_email: authData.user.email,
          email_confirmed: authData.user.email_confirmed_at ? true : false,
          last_sign_in_at: authData.user.last_sign_in_at,
          status: emailsMatch ? 'SYNCED' : 'MISMATCH',
          message: emailsMatch 
            ? 'Emails sincronizados' 
            : `Email no auth (${authData.user.email}) difere do profiles (${profileData.email})`
        });

        console.log(`Diagnosis complete for ${email}: ${emailsMatch ? 'SYNCED' : 'MISMATCH'}`);

      } catch (err) {
        results.push({
          profile_email: email,
          profile_id: null,
          profile_name: null,
          auth_email: null,
          email_confirmed: null,
          last_sign_in_at: null,
          status: 'ERROR',
          message: `Erro ao diagnosticar: ${err.message}`
        });
        console.error(`Error diagnosing ${email}:`, err);
      }
    }

    // Log the operation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'DIAGNOSE_AUTH',
        table_name: 'profiles',
        record_id: user.id,
        accessed_fields: ['email', 'id'],
      });

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in diagnose-auth-profile-emails:', error);
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
