import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a strong random temporary password (>=12 chars, mixed types)
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = upper + lower + digits + symbols;
  const rand = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  let pwd = rand(upper) + rand(lower) + rand(digits) + rand(symbols);
  for (let i = 0; i < 10; i++) pwd += rand(all);
  // Shuffle
  return pwd.split('').sort(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 - 0.5).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) throw new Error('Only admins can reset student passwords');

    const { data: studentRoles, error: studentsError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (studentsError) throw new Error(`Failed to fetch students: ${studentsError.message}`);

    const studentIds = studentRoles?.map(r => r.user_id) || [];

    const credentials: { user_id: string; email: string | null; temp_password: string }[] = [];
    const results = { total: studentIds.length, success: 0, failed: 0, errors: [] as string[] };

    for (const studentId of studentIds) {
      try {
        const tempPassword = generateTempPassword();
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          studentId,
          { password: tempPassword }
        );

        if (updateError) {
          results.failed++;
          results.errors.push(`Failed for user ${studentId}: ${updateError.message}`);
          continue;
        }

        // Force password change on next login
        await supabaseAdmin
          .from('profiles')
          .update({ must_change_password: true } as any)
          .eq('id', studentId);

        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', studentId)
          .maybeSingle();

        credentials.push({ user_id: studentId, email: prof?.email ?? null, temp_password: tempPassword });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Exception for user ${studentId}: ${err.message}`);
      }
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'BATCH_PASSWORD_RESET',
      table_name: 'auth.users',
      record_id: user.id,
      accessed_fields: ['password'],
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Senhas redefinidas: ${results.success} com sucesso, ${results.failed} com falha. Cada aluno recebeu uma senha temporária única.`,
        results,
        credentials, // Admin must distribute these securely; shown only once.
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in batch-reset-student-passwords:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
