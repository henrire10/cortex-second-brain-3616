-- Create a function to generate workouts for a specific user
CREATE OR REPLACE FUNCTION create_workouts_for_user(
  p_user_email TEXT,
  p_days INTEGER DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_record RECORD;
  plan_record RECORD;
  workout_counter INTEGER := 0;
  current_date_loop DATE;
  current_day_of_week INTEGER;
  workout_schedule INTEGER[];
  workout_index INTEGER;
  selected_workout JSONB;
  workout_content TEXT;
  existing_workout RECORD;
  day_counter INTEGER := 0;
BEGIN
  -- Get user data
  SELECT id, name INTO user_record
  FROM profiles
  WHERE email = p_user_email;
  
  IF user_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found with email: ' || p_user_email
    );
  END IF;
  
  -- Get approved workout plan
  SELECT * INTO plan_record
  FROM workout_plans_approval
  WHERE user_id = user_record.id
    AND status = 'approved'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF plan_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No approved workout plan found for user'
    );
  END IF;
  
  -- Extract workout days
  IF plan_record.plan_data IS NULL OR 
     NOT (plan_record.plan_data ? 'workoutDays') OR 
     jsonb_array_length(plan_record.plan_data->'workoutDays') = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No workout days found in plan'
    );
  END IF;
  
  -- Define workout schedule (Monday=1, Wednesday=3, Friday=5)  
  workout_schedule := ARRAY[1, 3, 5];
  
  -- Log start
  INSERT INTO system_logs (log_level, message) 
  VALUES ('INFO', 'Creating workouts for user: ' || user_record.name || ' (' || p_user_email || ') for ' || p_days || ' days');
  
  -- Generate workouts for the next X days
  WHILE day_counter < p_days LOOP
    current_date_loop := CURRENT_DATE + day_counter;
    current_day_of_week := EXTRACT(DOW FROM current_date_loop);
    
    -- Skip Sunday (0) and only create workouts on scheduled days
    IF current_day_of_week = 0 OR NOT (current_day_of_week = ANY(workout_schedule)) THEN
      day_counter := day_counter + 1;
      CONTINUE;
    END IF;
    
    -- Get the workout index based on day of week
    workout_index := array_position(workout_schedule, current_day_of_week);
    
    IF workout_index IS NULL OR workout_index > jsonb_array_length(plan_record.plan_data->'workoutDays') THEN
      day_counter := day_counter + 1;
      CONTINUE;
    END IF;
    
    -- Get the specific workout
    selected_workout := plan_record.plan_data->'workoutDays'->(workout_index - 1);
    
    IF selected_workout IS NULL THEN
      day_counter := day_counter + 1;
      CONTINUE;
    END IF;
    
    -- Check if workout already exists for this date
    SELECT * INTO existing_workout
    FROM daily_workouts
    WHERE user_id = user_record.id 
      AND workout_date = current_date_loop;
    
    IF existing_workout IS NOT NULL THEN
      day_counter := day_counter + 1;
      CONTINUE;
    END IF;
    
    -- Build workout content
    workout_content := '';
    FOR i IN 0..(jsonb_array_length(selected_workout->'exercises') - 1) LOOP
      workout_content := workout_content || 
        (i + 1) || '️⃣ ' || 
        (selected_workout->'exercises'->i->>'name') || ': ' ||
        (selected_workout->'exercises'->i->>'sets') || 'x' ||
        (selected_workout->'exercises'->i->>'reps');
      
      IF selected_workout->'exercises'->i->>'weight' IS NOT NULL AND 
         selected_workout->'exercises'->i->>'weight' != 'Peso corporal' THEN
        workout_content := workout_content || ' (' || (selected_workout->'exercises'->i->>'weight') || ')';
      END IF;
      
      IF selected_workout->'exercises'->i->>'rest' IS NOT NULL THEN
        workout_content := workout_content || ' - Descanso: ' || (selected_workout->'exercises'->i->>'rest');
      END IF;
      
      workout_content := workout_content || E'\n';
    END LOOP;
    
    -- Insert the workout
    INSERT INTO daily_workouts (
      user_id,
      workout_date,
      workout_title,
      workout_content,
      status,
      approval_status,
      approved_by,
      approved_at,
      plan_id,
      trainer_payout,
      user_completion_payment
    ) VALUES (
      user_record.id,
      current_date_loop,
      selected_workout->>'title',
      workout_content,
      'sent',
      'approved',
      plan_record.trainer_id,
      now(),
      plan_record.id,
      5.00,
      0
    );
    
    workout_counter := workout_counter + 1;
    day_counter := day_counter + 1;
  END LOOP;
  
  -- Log success
  INSERT INTO system_logs (log_level, message) 
  VALUES ('SUCCESS', '✅ Created ' || workout_counter || ' workouts for user: ' || user_record.name || ' (' || p_user_email || ')');
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully created workouts',
    'user_name', user_record.name,
    'workouts_created', workout_counter,
    'plan_id', plan_record.id
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO system_logs (log_level, message) 
  VALUES ('ERROR', '❌ Error creating workouts for ' || p_user_email || ': ' || SQLERRM);
  
  RETURN json_build_object(
    'success', false,
    'message', 'Error creating workouts: ' || SQLERRM
  );
END;
$function$;