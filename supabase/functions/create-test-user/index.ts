import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Admin API key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create the test admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@escola.com',
      password: 'admin123',
      user_metadata: {
        name: 'Administrador'
      },
      email_confirm: true
    })

    if (authError) {
      // If user already exists, try to recover by syncing password and profile
      const alreadyRegistered = typeof authError.message === 'string' && authError.message.toLowerCase().includes('already');

      if (alreadyRegistered) {
        try {
          // Try to find user id from profiles first
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', 'admin@escola.com')
            .maybeSingle();

          let userId = profileRow?.id as string | undefined;

          // If not found, list users and find by email
          if (!userId) {
            const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listErr) throw listErr;
            const found = usersList.users?.find((u: any) => u.email?.toLowerCase() === 'admin@escola.com');
            userId = found?.id;
          }

          if (!userId) {
            console.error('Admin user exists but could not resolve user id.');
            return new Response(
              JSON.stringify({ error: 'Admin user exists but could not resolve user id' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Ensure password and email are confirmed
          const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
            password: 'admin123',
            email_confirm: true,
            user_metadata: { name: 'Administrador' }
          });
          if (updErr) throw updErr;

          // Ensure profile exists and role is admin
          const { error: upsertErr } = await supabase
            .from('profiles')
            .upsert({ id: userId, name: 'Administrador', email: 'admin@escola.com', role: 'admin' }, { onConflict: 'id' });
          if (upsertErr) throw upsertErr;

          // Seed test data
          await supabase.rpc('setup_test_admin');

          return new Response(
            JSON.stringify({ success: true, message: 'Test admin already existed. Password reset and profile synced.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (e: any) {
          console.error('Recovery flow failed:', e);
          return new Response(
            JSON.stringify({ error: e.message || 'Failed to recover existing admin user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
      }

      console.error('Error creating user:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Ensure profile exists and set admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name: 'Administrador',
        email: 'admin@escola.com',
        role: 'admin'
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create test data
    await supabase.rpc('setup_test_admin')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test admin user created successfully',
        user: authData.user 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})