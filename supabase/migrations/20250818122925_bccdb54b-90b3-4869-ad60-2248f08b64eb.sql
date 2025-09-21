-- Função administrativa para deletar usuário por email
CREATE OR REPLACE FUNCTION delete_user_by_email(target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  result_json jsonb;
BEGIN
  -- Encontrar o user_id
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;
  
  -- Log da operação
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'Iniciando exclusão completa do usuário: ' || target_email || ' (ID: ' || target_user_id || ')');
  
  -- Deletar de todas as tabelas relacionadas
  DELETE FROM questionnaire_debug_logs WHERE user_id = target_user_id;
  DELETE FROM workout_logs WHERE user_id = target_user_id;
  DELETE FROM completed_exercises WHERE user_id = target_user_id;
  DELETE FROM user_achievements WHERE user_id = target_user_id;
  DELETE FROM outdoor_activities WHERE user_id = target_user_id;
  DELETE FROM progress_photos WHERE user_id = target_user_id;
  DELETE FROM body_measurements WHERE user_id = target_user_id;
  DELETE FROM measurement_goals WHERE user_id = target_user_id;
  DELETE FROM daily_workouts WHERE user_id = target_user_id;
  DELETE FROM workout_plans_approval WHERE user_id = target_user_id;
  DELETE FROM workout_plans WHERE user_id = target_user_id;
  DELETE FROM whatsapp_messages WHERE user_id = target_user_id;
  DELETE FROM whatsapp_schedule WHERE user_id = target_user_id;
  DELETE FROM user_whatsapp WHERE user_id = target_user_id;
  DELETE FROM push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM subscribers WHERE user_id = target_user_id;
  DELETE FROM admin_users WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
  
  INSERT INTO system_logs (log_level, message) 
  VALUES ('SUCCESS', 'Usuário ' || target_email || ' deletado completamente do sistema');
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Usuário deletado com sucesso',
    'user_id', target_user_id
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO system_logs (log_level, message) 
  VALUES ('ERROR', 'Erro ao deletar usuário ' || target_email || ': ' || SQLERRM);
  
  RETURN json_build_object(
    'success', false, 
    'message', 'Erro ao deletar usuário: ' || SQLERRM
  );
END;
$$;