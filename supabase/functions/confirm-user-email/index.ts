import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfirmEmailRequest {
  userId?: string;
  email?: string;
  bulkConfirm?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the calling user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or secretary role
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'secretary'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Access denied: insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, email, bulkConfirm }: ConfirmEmailRequest = await req.json();

    if (bulkConfirm) {
      // Confirm all unconfirmed student emails
      const { data: unconfirmedUsers, error: fetchError } = await supabaseServiceRole.auth.admin.listUsers();
      
      if (fetchError) {
        throw fetchError;
      }

      const confirmResults = [];
      for (const authUser of unconfirmedUsers.users) {
        if (!authUser.email_confirmed_at) {
          try {
            const { error: confirmError } = await supabaseServiceRole.auth.admin.updateUserById(
              authUser.id,
              { email_confirm: true }
            );
            
            confirmResults.push({
              userId: authUser.id,
              email: authUser.email,
              success: !confirmError,
              error: confirmError?.message
            });
          } catch (err) {
            confirmResults.push({
              userId: authUser.id,
              email: authUser.email,
              success: false,
              error: err.message
            });
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          message: 'Bulk confirmation completed',
          results: confirmResults
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single user confirmation
    let targetUserId = userId;
    
    if (!targetUserId && email) {
      // Find user by email
      const { data: users, error: findError } = await supabaseServiceRole.auth.admin.listUsers();
      if (findError) throw findError;
      
      const targetUser = users.users.find(u => u.email === email);
      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'User ID or email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Confirm the user's email
    const { error: confirmError } = await supabaseServiceRole.auth.admin.updateUserById(
      targetUserId,
      { email_confirm: true }
    );

    if (confirmError) {
      throw confirmError;
    }

    console.log(`Email confirmed for user: ${targetUserId}`);

    return new Response(
      JSON.stringify({ 
        message: 'Email confirmed successfully',
        userId: targetUserId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in confirm-user-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);