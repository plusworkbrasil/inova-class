-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET 
  confirm_email_change_enabled = false,
  confirm_email_change_host = '',
  enable_signup = true,
  enable_confirmations = false,
  enable_email_autoconfirm = true
WHERE
  id = 'auth.config';