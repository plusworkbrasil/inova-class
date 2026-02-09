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
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    const { data: callerRole, error: roleError } = await supabaseAdmin
      .rpc('get_user_role', { user_id: user.id })

    if (roleError || !callerRole) {
      throw new Error('Could not verify user permissions')
    }

    if (!['admin', 'secretary'].includes(callerRole)) {
      throw new Error('Access denied: Only admins and secretaries can create users')
    }

    const { userData, password } = await req.json()

    const allowedRoles = ['student', 'instructor', 'teacher', 'secretary']
    if (callerRole !== 'admin') {
      allowedRoles.splice(allowedRoles.indexOf('secretary'), 1)
    }

    if (!allowedRoles.includes(userData.role)) {
      throw new Error(`Access denied: Cannot create user with role '${userData.role}'`)
    }

    const userPassword = password || 'Trocar@123'
    const isTemporaryPassword = !password

    console.log(`Creating user: ${userData.email} with role: ${userData.role}`)

    // === STEP 1: Check if email already exists in auth ===
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    // Search by email specifically
    const { data: emailSearch } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle()

    if (emailSearch) {
      // User exists in profiles - check if they have a role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', emailSearch.id)
        .maybeSingle()

      if (existingRole) {
        throw new Error(`Usuário já existe com este email (${userData.email}) e role '${existingRole.role}'`)
      }

      // User exists but has NO role - recover by inserting the missing role
      console.log(`Recovery: User ${userData.email} exists without role. Inserting role: ${userData.role}`)
      
      const { error: recoveryRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: emailSearch.id,
          role: userData.role,
          granted_by: user.id
        })

      if (recoveryRoleError) {
        throw new Error(`Failed to recover user role: ${recoveryRoleError.message}`)
      }

      // Also update profile fields if provided
      const profileUpdates = buildProfileData(userData, emailSearch.id)
      if (Object.keys(profileUpdates).length > 1) { // more than just id
        await supabaseAdmin
          .from('profiles')
          .update(profileUpdates)
          .eq('id', emailSearch.id)

        console.log(`Recovery: Updated profile for ${userData.email}`)
      }

      const { data: recoveredProfile } = await supabaseAdmin
        .from('profiles')
        .select()
        .eq('id', emailSearch.id)
        .single()

      console.log(`Recovery successful for user: ${userData.email}`)

      return new Response(
        JSON.stringify({
          user: { id: emailSearch.id, email: userData.email },
          profile: recoveredProfile,
          message: 'Usuário recuperado: role inserido com sucesso.',
          recovered: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // === STEP 2: Create new user in auth ===
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userPassword,
      email_confirm: true,
      user_metadata: { name: userData.name, role: userData.role }
    })

    if (authError) {
      throw authError
    }

    // === STEP 3: Update profile ===
    const profileData = buildProfileData(userData, authUser.user.id)
    profileData.must_change_password = true

    await new Promise(resolve => setTimeout(resolve, 100))

    const { data: profile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
    }

    // === STEP 4: Insert role (with rollback on failure) ===
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: userData.role,
        granted_by: user.id
      })

    if (roleInsertError) {
      console.error('Role insert error, performing rollback:', roleInsertError)
      
      // ROLLBACK: delete the auth user to prevent orphans
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      throw new Error(`Falha ao atribuir role. Usuário não foi criado (rollback executado). Erro: ${roleInsertError.message}`)
    }

    console.log(`Successfully created user: ${userData.email}`)

    const responseData: any = {
      user: authUser.user,
      profile,
      message: 'User created successfully. User must change password on first login.'
    }

    if (isTemporaryPassword) {
      responseData.temporaryPassword = userPassword
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})

/** Build profile data object from userData input */
function buildProfileData(userData: any, userId: string): any {
  const profileData: any = {
    id: userId,
    name: userData.name,
    email: userData.email
  }

  const optionalFields = [
    'phone', 'cep', 'street', 'number', 'complement', 'neighborhood',
    'city', 'state', 'cpf', 'full_name', 'photo', 'parent_name',
    'escolaridade', 'student_id', 'class_id', 'instructor_subjects',
    'enrollment_number', 'birth_date'
  ]

  for (const field of optionalFields) {
    if (userData[field]) profileData[field] = userData[field]
  }

  return profileData
}
