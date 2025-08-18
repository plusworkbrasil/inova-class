import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://gaamkwzexqpzppgpkozy.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a client with user's token to verify authorization
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the current user to verify authentication
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Check if the current user has permission to create users
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) {
      throw new Error('Could not verify user permissions')
    }

    if (!['admin', 'secretary'].includes(callerProfile.role)) {
      throw new Error('Access denied: Only admins and secretaries can create users')
    }

    const { userData } = await req.json()

    // Validate the requested role
    const allowedRoles = ['student', 'instructor', 'secretary']
    if (callerProfile.role !== 'admin') {
      // Secretaries can only create students and instructors
      allowedRoles.pop() // Remove 'secretary' from allowed roles
    }

    if (!allowedRoles.includes(userData.role)) {
      throw new Error(`Access denied: Cannot create user with role '${userData.role}'`)
    }

    // Generate a secure random password
    const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(36))
      .join('')
      .slice(0, 16)

    console.log(`Creating user: ${userData.email} with role: ${userData.role}`)

    // Create user in auth with admin privileges
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { 
        name: userData.name,
        role: userData.role
      }
    })

    if (authError) {
      throw authError
    }

    // Insert profile in profiles table - trigger will handle basic profile creation
    // but we need to update with additional fields
    const profileData: any = {
      id: authUser.user.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    }

    // Add optional fields if provided
    if (userData.phone) profileData.phone = userData.phone
    if (userData.cep) profileData.cep = userData.cep
    if (userData.street) profileData.street = userData.street
    if (userData.number) profileData.number = userData.number
    if (userData.complement) profileData.complement = userData.complement
    if (userData.neighborhood) profileData.neighborhood = userData.neighborhood
    if (userData.city) profileData.city = userData.city
    if (userData.state) profileData.state = userData.state
    if (userData.cpf) profileData.cpf = userData.cpf
    if (userData.full_name) profileData.full_name = userData.full_name
    if (userData.photo) profileData.photo = userData.photo
    if (userData.parent_name) profileData.parent_name = userData.parent_name
    if (userData.escolaridade) profileData.escolaridade = userData.escolaridade
    if (userData.student_id) profileData.student_id = userData.student_id
    if (userData.class_id) profileData.class_id = userData.class_id
    if (userData.instructor_subjects) profileData.instructor_subjects = userData.instructor_subjects

    // Wait a moment for the trigger to create the basic profile
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update the profile with additional fields
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (profileError) {
      console.error('Profile update error:', profileError)
      throw new Error(`Failed to update profile: ${profileError.message}`)
    }

    console.log(`Successfully created user: ${userData.email}`)

    return new Response(
      JSON.stringify({ 
        user: authUser.user, 
        profile,
        message: 'User created successfully. A temporary password has been set - user should reset it on first login.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    
    let status = 400
    if (error.message.includes('Access denied') || error.message.includes('Invalid or expired token')) {
      status = 403
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      },
    )
  }
})