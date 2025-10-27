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
    
    // Create admin client
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
      throw new Error('Only admins can reset student passwords');
    }

    console.log('Admin verification successful');

    // Get all student user_ids
    const { data: studentRoles, error: studentsError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    const studentIds = studentRoles?.map(r => r.user_id) || [];
    console.log(`Found ${studentIds.length} students to reset`);

    const newPassword = 'J@V3mTech';
    const results = {
      total: studentIds.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Reset password for each student
    for (const studentId of studentIds) {
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          studentId,
          { password: newPassword }
        );

        if (updateError) {
          results.failed++;
          results.errors.push(`Failed for user ${studentId}: ${updateError.message}`);
          console.error(`Failed to reset password for ${studentId}:`, updateError);
        } else {
          results.success++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Exception for user ${studentId}: ${err.message}`);
        console.error(`Exception resetting password for ${studentId}:`, err);
      }
    }

    console.log(`Password reset complete: ${results.success} success, ${results.failed} failed`);

    // Log the operation in audit_logs
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'BATCH_PASSWORD_RESET',
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
    console.error('Error in batch-reset-student-passwords:', error);
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
