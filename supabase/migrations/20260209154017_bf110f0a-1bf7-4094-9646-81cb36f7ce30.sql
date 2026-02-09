
-- Fix: Insert missing instructor role for vitoria-ts2016@hotmail.com
INSERT INTO user_roles (user_id, role, granted_by)
SELECT 
  '989299bd-5c33-4cc2-a07c-ef214fc77a5e',
  'instructor'::app_role,
  (SELECT id FROM profiles WHERE email = 'pluswork.com.br@gmail.com')
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = '989299bd-5c33-4cc2-a07c-ef214fc77a5e'
);
