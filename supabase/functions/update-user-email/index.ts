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
      throw new Error('Only admins and secretaries can update user emails');
    }

    // Obter os dados da requisição
    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      throw new Error('Missing userId or newEmail');
    }

    console.log(`Updating email for user ${userId} to ${newEmail}`);

    // Atualizar email no auth.users usando Admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (updateError) {
      console.error('Error updating auth email:', updateError);
      throw updateError;
    }

    console.log('Auth email updated successfully:', updatedUser.user.email);

    // Registrar a operação no audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'UPDATE_USER_EMAIL',
      table_name: 'auth.users',
      record_id: userId,
      accessed_fields: ['email']
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email updated successfully in auth.users',
        newEmail: updatedUser.user.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in update-user-email function:', error);
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
