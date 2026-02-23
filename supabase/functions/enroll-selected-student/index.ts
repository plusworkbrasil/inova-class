import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token)
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = claimsData.claims.sub as string

  // Use service role for admin operations
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Check caller role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'secretary'])
    .limit(1)

  if (!roleData || roleData.length === 0) {
    return new Response(JSON.stringify({ error: 'Acesso negado. Apenas admin/secretaria.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { selected_student_id, class_id } = await req.json()

    if (!selected_student_id || !class_id) {
      return new Response(JSON.stringify({ error: 'selected_student_id e class_id são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch selected student
    const { data: student, error: fetchError } = await supabase
      .from('selected_students')
      .select('*')
      .eq('id', selected_student_id)
      .single()

    if (fetchError || !student) {
      return new Response(JSON.stringify({ error: 'Aluno selecionado não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (student.status === 'enrolled') {
      return new Response(JSON.stringify({ error: 'Aluno já matriculado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate temporary password
    const tempPassword = `Inova@${Math.random().toString(36).slice(-6)}${Math.floor(Math.random() * 100)}`

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: student.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: student.full_name },
    })

    if (authError) {
      return new Response(JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const newUserId = authUser.user.id

    // Update profile with student data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: student.full_name,
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        cpf: student.cpf,
        class_id: class_id,
        status: 'active',
        enrollment_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // Add student role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: newUserId, role: 'student', granted_by: userId })

    if (roleError) {
      console.error('Role insert error:', roleError)
    }

    // Update selected_students record
    await supabase
      .from('selected_students')
      .update({
        status: 'enrolled',
        enrolled_at: new Date().toISOString(),
        enrolled_user_id: newUserId,
      })
      .eq('id', selected_student_id)

    return new Response(JSON.stringify({
      success: true,
      user_id: newUserId,
      temp_password: tempPassword,
      message: `Aluno ${student.full_name} matriculado com sucesso`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Enroll error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
