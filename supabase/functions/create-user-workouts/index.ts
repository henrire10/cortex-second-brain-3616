import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_email, days = 30 } = await req.json();

    if (!user_email) {
      return new Response(
        JSON.stringify({ error: 'User email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating workouts for user: ${user_email} for ${days} days`);

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', user_email)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get approved workout plan
    const { data: planApproval, error: planError } = await supabase
      .from('workout_plans_approval')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (planError || !planApproval) {
      return new Response(
        JSON.stringify({ error: 'No approved workout plan found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const workoutDays = planApproval.plan_data?.workoutDays || [];
    if (workoutDays.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No workout days found in plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define workout schedule (Monday=1, Wednesday=3, Friday=5)
    const workoutSchedule = [1, 3, 5];
    const workoutsToCreate = [];

    // Generate workouts for the next X days
    const currentDate = new Date();
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() + i);
      
      const dayOfWeek = checkDate.getDay();
      
      // Skip Sunday (0) and only create workouts on scheduled days
      if (dayOfWeek === 0 || !workoutSchedule.includes(dayOfWeek)) {
        continue;
      }

      // Get the workout index based on day of week
      const workoutIndex = workoutSchedule.indexOf(dayOfWeek);
      const selectedWorkout = workoutDays[workoutIndex];

      if (!selectedWorkout) {
        continue;
      }

      // Format workout content
      const exercises = selectedWorkout.exercises || [];
      const workoutContent = exercises.map((exercise: any, index: number) => {
        let content = `${index + 1}️⃣ ${exercise.name}: ${exercise.sets}x${exercise.reps}`;
        if (exercise.weight && exercise.weight !== 'Peso corporal') {
          content += ` (${exercise.weight})`;
        }
        if (exercise.rest) {
          content += ` - Descanso: ${exercise.rest}`;
        }
        return content;
      }).join('\n');

      // Check if workout already exists for this date
      const { data: existingWorkout } = await supabase
        .from('daily_workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('workout_date', checkDate.toISOString().split('T')[0])
        .maybeSingle();

      if (!existingWorkout) {
        workoutsToCreate.push({
          user_id: user.id,
          workout_date: checkDate.toISOString().split('T')[0],
          workout_title: selectedWorkout.title,
          workout_content: workoutContent,
          status: 'sent',
          approval_status: 'approved',
          approved_by: planApproval.trainer_id,
          approved_at: new Date().toISOString(),
          plan_id: planApproval.id,
          trainer_payout: 5.00,
          user_completion_payment: 0
        });
      }
    }

    console.log(`Creating ${workoutsToCreate.length} workouts for ${user.name}`);

    // Insert workouts in batches
    let createdCount = 0;
    if (workoutsToCreate.length > 0) {
      const { data, error: insertError } = await supabase
        .from('daily_workouts')
        .insert(workoutsToCreate)
        .select('id, workout_date, workout_title');

      if (insertError) {
        console.error('Error inserting workouts:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create workouts', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      createdCount = data?.length || 0;
    }

    // Log success
    await supabase
      .from('system_logs')
      .insert({
        log_level: 'INFO',
        message: `✅ Created ${createdCount} workouts for user ${user.name} (${user_email}) via admin request`
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${createdCount} workouts for ${user.name}`,
        user_name: user.name,
        workouts_created: createdCount,
        plan_id: planApproval.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});