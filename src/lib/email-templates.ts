// Templates HTML de e-mails transacionais (InovaClass)
// Branding: gradiente azul/roxo, fonte system, layout simples mobile-friendly.

const BRAND_NAME = 'InovaClass';
const BRAND_URL = 'https://inovaclass.online';
const PRIMARY = '#2563eb';
const PRIMARY_DARK = '#1e40af';

function shell(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr>
          <td style="background:linear-gradient(135deg,${PRIMARY},${PRIMARY_DARK});padding:24px;text-align:center;">
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:.3px;">${BRAND_NAME}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center;">
            Este é um e-mail automático do sistema ${BRAND_NAME}. Não responda.<br/>
            <a href="${BRAND_URL}" style="color:${PRIMARY};text-decoration:none;">${BRAND_URL}</a> · © ${year}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#111827;">${escapeHtml(
    text,
  )}</p>`;
}

function badge(label: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${color};color:#fff;font-size:12px;font-weight:600;">${escapeHtml(label)}</span>`;
}

function infoBox(rows: Array<{ label: string; value: string }>): string {
  const trs = rows
    .map(
      (r) => `<tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join('');
  return `<table style="width:100%;background:#f9fafb;border-radius:8px;padding:14px;margin:16px 0;border:1px solid #e5e7eb;">${trs}</table>`;
}

// ====== Templates ======

export interface JustificationStatusEmailParams {
  studentName: string;
  status: 'pending' | 'approved' | 'rejected';
  declarationTitle: string;
  absenceDate?: string | null; // YYYY-MM-DD
  observations?: string | null;
}

export function justificationStatusEmail(p: JustificationStatusEmailParams) {
  const subjectMap = {
    pending: 'Recebemos sua justificativa de falta',
    approved: 'Sua justificativa de falta foi aprovada',
    rejected: 'Sua justificativa de falta foi rejeitada',
  } as const;
  const subject = subjectMap[p.status];

  const badgeMap = {
    pending: badge('Pendente', '#f59e0b'),
    approved: badge('Aprovada', '#16a34a'),
    rejected: badge('Rejeitada', '#dc2626'),
  } as const;
  const statusBadge = badgeMap[p.status];

  const messageMap = {
    pending:
      'Recebemos sua solicitação de justificativa de falta e ela está aguardando análise da secretaria. Você será avisado(a) por e-mail e pelo sistema assim que houver uma decisão.',
    approved:
      'Sua solicitação de justificativa de falta foi analisada e aprovada pela secretaria. O registro de frequência já foi atualizado.',
    rejected:
      'Sua solicitação de justificativa de falta foi analisada, mas não pôde ser aprovada. Procure a secretaria para mais informações.',
  } as const;

  const dateBR = p.absenceDate
    ? p.absenceDate.split('-').reverse().join('/')
    : '—';

  const body = `
    <h2 style="margin:0 0 14px;font-size:20px;color:${PRIMARY_DARK};">Olá, ${escapeHtml(p.studentName)}</h2>
    ${paragraph(messageMap[p.status])}
    <div style="margin:16px 0;">${statusBadge}</div>
    ${infoBox([
      { label: 'Documento', value: p.declarationTitle },
      { label: 'Data da falta', value: dateBR },
    ])}
    ${p.observations ? paragraph(`Observações: ${p.observations}`) : ''}
    ${paragraph('Em caso de dúvida, entre em contato com a secretaria.')}
  `;

  return { subject, html: shell(subject, body) };
}

export interface ClassCommunicationEmailParams {
  studentName: string;
  className: string;
  title: string;
  message: string;
  subjectName?: string | null;
}

export function classCommunicationEmail(p: ClassCommunicationEmailParams) {
  const subject = `[${p.className}] ${p.title}`;
  const messageHtml = escapeHtml(p.message)
    .replace(/\n/g, '<br/>');

  const body = `
    <h2 style="margin:0 0 14px;font-size:20px;color:${PRIMARY_DARK};">${escapeHtml(p.title)}</h2>
    ${paragraph(`Olá, ${p.studentName}!`)}
    ${infoBox([
      { label: 'Turma', value: p.className },
      ...(p.subjectName ? [{ label: 'Disciplina', value: p.subjectName }] : []),
    ])}
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-left:4px solid ${PRIMARY};border-radius:8px;padding:14px 16px;margin:14px 0;font-size:15px;line-height:1.6;color:#111827;">
      ${messageHtml}
    </div>
    ${paragraph('Atenciosamente, equipe da escola.')}
  `;

  return { subject, html: shell(subject, body) };
}

export interface DeclarationDeliveryEmailParams {
  studentName: string;
  declarationTitle: string;
}

export function declarationDeliveryEmail(p: DeclarationDeliveryEmailParams) {
  const subject = `Sua declaração: ${p.declarationTitle}`;
  const body = `
    <h2 style="margin:0 0 14px;font-size:20px;color:${PRIMARY_DARK};">Olá, ${escapeHtml(p.studentName)}</h2>
    ${paragraph(
      `Sua declaração de "${p.declarationTitle}" foi emitida e está em anexo neste e-mail (PDF).`,
    )}
    ${paragraph(
      'Caso tenha solicitado para fins externos, basta encaminhar o arquivo. Em caso de dúvidas, procure a secretaria.',
    )}
  `;
  return { subject, html: shell(subject, body) };
}

// Helper: dispara via Edge Function
import { supabase } from '@/integrations/supabase/client';

export async function sendEmailViaResend(params: {
  to: string;
  subject: string;
  html: string;
  template_type?: 'justification' | 'communication' | 'declaration' | 'other';
  reference_id?: string | null;
  attachments?: Array<{ filename: string; content: string }>;
  use_fallback_from?: boolean;
}) {
  return supabase.functions.invoke('send-email-resend', { body: params });
}
