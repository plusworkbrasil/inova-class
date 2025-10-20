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
    console.log('[confirm-user-email] Function invoked');
    
    // Initialize Supabase client with service role key
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[confirm-user-email] No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header', step: 'auth_header_check' }),
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
      console.error('[confirm-user-email] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization', step: 'user_auth', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[confirm-user-email] Authenticated user: ${user.id} (${user.email})`);

    // Check if user has admin or secretary role using user_roles table
    const { data: userRole, error: roleError } = await supabaseServiceRole
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log(`[confirm-user-email] User role query result:`, { userRole, roleError: roleError?.message });

    if (roleError || !userRole || !['admin', 'secretary'].includes(userRole.role)) {
      console.error('[confirm-user-email] Permission denied for user:', user.id, 'Role:', userRole?.role);
      return new Response(
        JSON.stringify({ 
          error: 'Access denied: insufficient permissions', 
          step: 'permission_check',
          userId: user.id,
          foundRole: userRole?.role || 'none'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[confirm-user-email] Permission granted for user: ${user.id} with role: ${userRole.role}`);

    const { userId, email, bulkConfirm }: ConfirmEmailRequest = await req.json();
    console.log(`[confirm-user-email] Request params:`, { userId, email, bulkConfirm });

    if (bulkConfirm) {
      console.log('[confirm-user-email] Starting bulk confirmation');
      
      // Confirm all unconfirmed student emails
      const { data: unconfirmedUsers, error: fetchError } = await supabaseServiceRole.auth.admin.listUsers();
      
      if (fetchError) {
        console.error('[confirm-user-email] Failed to fetch users:', fetchError.message);
        throw fetchError;
      }

      console.log(`[confirm-user-email] Found ${unconfirmedUsers.users.length} total users`);
      const unconfirmedCount = unconfirmedUsers.users.filter(u => !u.email_confirmed_at).length;
      console.log(`[confirm-user-email] ${unconfirmedCount} users need confirmation`);

      const confirmResults = [];
      for (const authUser of unconfirmedUsers.users) {
        if (!authUser.email_confirmed_at) {
          try {
            console.log(`[confirm-user-email] Confirming email for user: ${authUser.id} (${authUser.email})`);
            
            const { error: confirmError } = await supabaseServiceRole.auth.admin.updateUserById(
              authUser.id,
              { email_confirm: true }
            );
            
            if (confirmError) {
              console.error(`[confirm-user-email] Failed to confirm ${authUser.email}:`, confirmError.message);
            } else {
              console.log(`[confirm-user-email] Successfully confirmed ${authUser.email}`);
            }
            
            confirmResults.push({
              userId: authUser.id,
              email: authUser.email,
              success: !confirmError,
              error: confirmError?.message
            });
          } catch (err) {
            console.error(`[confirm-user-email] Exception confirming ${authUser.email}:`, err.message);
            confirmResults.push({
              userId: authUser.id,
              email: authUser.email,
              success: false,
              error: err.message
            });
          }
        }
      }

      const successCount = confirmResults.filter(r => r.success).length;
      console.log(`[confirm-user-email] Bulk confirmation complete: ${successCount}/${confirmResults.length} successful`);

      return new Response(
        JSON.stringify({ 
          message: 'Bulk confirmation completed',
          results: confirmResults,
          summary: {
            total: confirmResults.length,
            successful: successCount,
            failed: confirmResults.length - successCount
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single user confirmation
    console.log('[confirm-user-email] Processing single user confirmation');
    let targetUserId = userId;
    
    if (!targetUserId && email) {
      console.log(`[confirm-user-email] Looking up user by email: ${email}`);
      
      // Find user by email
      const { data: users, error: findError } = await supabaseServiceRole.auth.admin.listUsers();
      if (findError) {
        console.error('[confirm-user-email] Failed to list users:', findError.message);
        throw findError;
      }
      
      const targetUser = users.users.find(u => u.email === email);
      if (!targetUser) {
        console.error(`[confirm-user-email] User not found with email: ${email}`);
        return new Response(
          JSON.stringify({ error: 'User not found', step: 'user_lookup', email }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = targetUser.id;
      console.log(`[confirm-user-email] Found user: ${targetUserId}`);
    }

    if (!targetUserId) {
      console.error('[confirm-user-email] No user ID or email provided');
      return new Response(
        JSON.stringify({ error: 'User ID or email required', step: 'input_validation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Confirm the user's email
    console.log(`[confirm-user-email] Confirming email for user: ${targetUserId}`);
    const { error: confirmError } = await supabaseServiceRole.auth.admin.updateUserById(
      targetUserId,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error(`[confirm-user-email] Failed to confirm email:`, confirmError.message);
      throw confirmError;
    }

    console.log(`[confirm-user-email] Email confirmed successfully for user: ${targetUserId}`);

    return new Response(
      JSON.stringify({ 
        message: 'Email confirmed successfully',
        userId: targetUserId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[confirm-user-email] Unhandled error:', error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        step: 'exception_handler',
        type: error.name || 'UnknownError'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);