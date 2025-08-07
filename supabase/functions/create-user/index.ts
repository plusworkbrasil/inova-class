import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    // Create a Supabase client with the service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userData } = await req.json()

    // Create user in auth with admin privileges
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: 'senha123', // Senha temporária
      email_confirm: true,
      user_metadata: { name: userData.name }
    })

    if (authError) {
      throw authError
    }

    // Insert profile in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        cep: userData.cep,
        street: userData.street,
        number: userData.number,
        complement: userData.complement,
        neighborhood: userData.neighborhood,
        city: userData.city,
        state: userData.state,
      })
      .select()
      .single()

    if (profileError) {
      throw profileError
    }

    return new Response(
      JSON.stringify({ user: authUser.user, profile }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})