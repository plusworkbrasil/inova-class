import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Validate caller
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Only admins can delete users
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) {
      throw new Error('Could not verify user permissions')
    }

    if (callerProfile.role !== 'admin') {
      throw new Error('Access denied: Only admins can delete users')
    }

    const { userId } = await req.json()
    if (!userId) throw new Error('Missing userId')

    if (userId === user.id) {
      throw new Error('You cannot delete your own account')
    }

    // Delete from auth
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (delError) throw delError

    // Clean up profile row (if any remains)
    const { error: profileDelError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileDelError) {
      // Log but do not fail the whole request
      console.warn('Profile cleanup error:', profileDelError.message)
    }

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in delete-user function:', error)
    let status = 400
    const message = (error as Error).message || 'Unknown error'
    if (message.includes('Access denied') || message.includes('Invalid or expired token')) {
      status = 403
    }
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})