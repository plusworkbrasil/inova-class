export const MAINTENANCE_BYPASS_EMAILS = [
  'jasprintbrasil@gmail.com',
  'pluswork.com.br@gmail.com',
];

export const canBypassMaintenance = (email?: string | null): boolean =>
  !!email && MAINTENANCE_BYPASS_EMAILS.includes(email.trim().toLowerCase());
