-- Upsert role for personal trainer email provided by user
INSERT INTO public.admin_users (user_id, email, role)
SELECT p.id, p.email, 'personal_trainer'::app_role
FROM public.profiles p
WHERE p.email = 'henrire007@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = now();

-- Optional: Log security event for audit trail
INSERT INTO public.security_audit_logs (user_id, action, table_name, record_id, new_values)
SELECT p.id, 'ROLE_ASSIGN_PERSONAL_TRAINER', 'admin_users', p.id, jsonb_build_object('email', p.email, 'role', 'personal_trainer')
FROM public.profiles p
WHERE p.email = 'henrire007@gmail.com';