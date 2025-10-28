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

    console.log(`Password reset requested by user: ${user.id}`);

    // Verify user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Only admins can reset passwords');
    }

    console.log('Admin verification successful');

    // Get emails from request body
    const { emails } = await req.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error('Emails array is required');
    }

    console.log(`Resetting passwords for: ${emails.join(', ')}`);

    const newPassword = 'J@V3mTech';
    const results = {
      total: emails.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Reset password for each email
    for (const email of emails) {
      try {
        // Find user by email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (userError) {
          results.failed++;
          results.errors.push(`Failed to fetch users: ${userError.message}`);
          continue;
        }

        const targetUser = userData.users.find(u => u.email === email);
        
        if (!targetUser) {
          results.failed++;
          results.errors.push(`User not found: ${email}`);
          console.error(`User not found: ${email}`);
          continue;
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUser.id,
          { password: newPassword }
        );

        if (updateError) {
          results.failed++;
          results.errors.push(`Failed for ${email}: ${updateError.message}`);
          console.error(`Failed to reset password for ${email}:`, updateError);
        } else {
          results.success++;
          console.log(`Successfully reset password for ${email}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Exception for ${email}: ${err.message}`);
        console.error(`Exception resetting password for ${email}:`, err);
      }
    }

    console.log(`Password reset complete: ${results.success} success, ${results.failed} failed`);

    // Log the operation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'SPECIFIC_PASSWORD_RESET',
        table_name: 'profiles',
        record_id: user.id,
        accessed_fields: ['password'],
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Senhas redefinidas: ${results.success} com sucesso, ${results.failed} com falha`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in reset-specific-passwords:', error);
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
