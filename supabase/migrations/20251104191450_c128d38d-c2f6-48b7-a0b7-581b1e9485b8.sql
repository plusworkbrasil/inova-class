-- Remove role 'secretary' from user secretaria@pluswork.com.br, keeping only 'admin'
-- This is a one-time administrative cleanup
DELETE FROM user_roles 
WHERE user_id = '61befc2a-d6b5-4cf4-9852-57619172cb5d' 
AND role = 'secretary';