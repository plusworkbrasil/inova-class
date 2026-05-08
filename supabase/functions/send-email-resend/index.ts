// Edge Function: send-email-resend
// Envia e-mails transacionais via Resend através do Connector Gateway da Lovable.
// Registra cada tentativa em public.email_send_log.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

const FROM_DEFAULT = 'InovaClass <no-reply@inovaclass.online>';
const FROM_FALLBACK = 'InovaClass <onboarding@resend.dev>';

interface Attachment {
  filename: string;
  content: string; // base64
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template_type?: 'justification' | 'communication' | 'declaration' | 'other';
  reference_id?: string | null;
  reply_to?: string;
  attachments?: Attachment[];
  use_fallback_from?: boolean; // usar onboarding@resend.dev (modo teste)
}

function isEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!LOVABLE_API_KEY) {
    return jsonError('LOVABLE_API_KEY não configurada', 500);
  }
  if (!RESEND_API_KEY) {
    return jsonError('RESEND_API_KEY não configurada', 500);
  }

  // Autentica chamador
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return jsonError('Não autenticado', 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) {
    return jsonError('Sessão inválida', 401);
  }
  const callerId = userData.user.id;

  // Verifica papel
  const { data: roleData } = await supabase.rpc('get_user_role', {
    user_id: callerId,
  });
  const role = roleData as string | null;
  if (!role || !['admin', 'secretary', 'instructor', 'tutor'].includes(role)) {
    return jsonError('Sem permissão para enviar e-mails', 403);
  }

  // Parse body
  let body: EmailPayload;
  try {
    body = await req.json();
  } catch {
    return jsonError('JSON inválido', 400);
  }

  // Validação
  if (!isEmail(body.to)) return jsonError('Destinatário inválido', 400);
  if (!body.subject || typeof body.subject !== 'string' || body.subject.length > 300) {
    return jsonError('Assunto inválido', 400);
  }
  if (!body.html || typeof body.html !== 'string') {
    return jsonError('Conteúdo HTML obrigatório', 400);
  }
  if (body.attachments) {
    if (!Array.isArray(body.attachments) || body.attachments.length > 5) {
      return jsonError('Anexos inválidos', 400);
    }
    for (const a of body.attachments) {
      if (!a.filename || typeof a.filename !== 'string') {
        return jsonError('Anexo sem filename', 400);
      }
      if (!a.content || typeof a.content !== 'string') {
        return jsonError('Anexo sem content (base64)', 400);
      }
    }
  }

  const from = body.use_fallback_from ? FROM_FALLBACK : FROM_DEFAULT;

  const resendBody: Record<string, unknown> = {
    from,
    to: [body.to],
    subject: body.subject,
    html: body.html,
  };
  if (body.text) resendBody.text = body.text;
  if (body.reply_to) resendBody.reply_to = body.reply_to;
  if (body.attachments && body.attachments.length > 0) {
    resendBody.attachments = body.attachments;
  }

  let status: 'sent' | 'failed' = 'failed';
  let errorMessage: string | null = null;

  try {
    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify(resendBody),
    });

    const respJson = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      errorMessage = `Resend [${resp.status}]: ${JSON.stringify(respJson).slice(0, 500)}`;
      console.error('Resend error:', errorMessage);
    } else {
      status = 'sent';
    }

    // Log (não bloqueia retorno se falhar)
    await supabase.from('email_send_log').insert({
      recipient_email: body.to,
      subject: body.subject,
      template_type: body.template_type || 'other',
      reference_id: body.reference_id || null,
      status,
      error_message: errorMessage,
      sent_by: callerId,
    });

    if (status === 'sent') {
      return new Response(
        JSON.stringify({ success: true, id: respJson?.id || null }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
    return jsonError(errorMessage || 'Falha no envio', 502);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errorMessage = msg;
    console.error('send-email-resend exception:', msg);
    await supabase.from('email_send_log').insert({
      recipient_email: body.to,
      subject: body.subject,
      template_type: body.template_type || 'other',
      reference_id: body.reference_id || null,
      status: 'failed',
      error_message: errorMessage,
      sent_by: callerId,
    });
    return jsonError(msg, 500);
  }
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
