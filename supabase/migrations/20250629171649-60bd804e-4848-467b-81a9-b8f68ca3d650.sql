
-- Apagar todos os dados dos usuários cadastrados
-- ATENÇÃO: Esta operação é irreversível!

-- 1. Apagar dados relacionados aos usuários
DELETE FROM public.questionnaire_debug_logs;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.user_whatsapp;
DELETE FROM public.whatsapp_schedule;
DELETE FROM public.daily_workouts;
DELETE FROM public.workout_plans;
DELETE FROM public.body_measurements;
DELETE FROM public.measurement_goals;
DELETE FROM public.progress_photos;
DELETE FROM public.subscribers;
DELETE FROM public.admin_users;

-- 2. Apagar perfis dos usuários
DELETE FROM public.profiles;

-- 3. Apagar usuários da tabela de autenticação (isso removerá completamente as contas)
DELETE FROM auth.users;

-- 4. Limpar logs do sistema (opcional - mantenha se quiser histórico)
-- DELETE FROM public.system_logs;

-- Reiniciar sequências se houver alguma
-- (Não há sequências nas tabelas atuais, mas incluído para completude)
