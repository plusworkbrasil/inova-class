import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(token)) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'GET') {
      // Fetch student data by token
      const { data, error } = await supabase
        .from('selected_students')
        .select('id, full_name, email, cpf, phone, shift, status, token_expires_at, token_used_at')
        .eq('invite_token', token)
        .single()

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Token não encontrado ou inválido' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (data.token_used_at) {
        return new Response(JSON.stringify({ error: 'Este link já foi utilizado' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Este link expirou. Solicite um novo convite.' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (data.status === 'confirmed' || data.status === 'enrolled') {
        return new Response(JSON.stringify({ error: 'Inscrição já confirmada anteriormente' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        cpf: data.cpf,
        phone: data.phone,
        shift: data.shift,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { confirmed_shift } = body

      if (!confirmed_shift || !['manha', 'tarde', 'noite'].includes(confirmed_shift)) {
        return new Response(JSON.stringify({ error: 'Turno inválido. Escolha: manhã, tarde ou noite' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Re-validate token
      const { data, error } = await supabase
        .from('selected_students')
        .select('id, status, token_expires_at, token_used_at')
        .eq('invite_token', token)
        .single()

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Token não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (data.token_used_at) {
        return new Response(JSON.stringify({ error: 'Este link já foi utilizado' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Este link expirou' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Update status to confirmed
      const { error: updateError } = await supabase
        .from('selected_students')
        .update({
          status: 'confirmed',
          confirmed_shift,
          confirmed_at: new Date().toISOString(),
          token_used_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Erro ao confirmar inscrição' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, message: 'Inscrição confirmada com sucesso!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
