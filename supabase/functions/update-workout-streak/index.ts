import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { user_id, workout_date } = await req.json()

    console.log(`🔥 Updating workout streak for user: ${user_id}, date: ${workout_date}`)

    if (!user_id || !workout_date) {
      throw new Error('Missing user_id or workout_date')
    }

    // Call the database function to update workout streak
    const { data, error } = await supabase.rpc('update_workout_streak_logic', {
      p_user_id: user_id,
      p_workout_date: workout_date
    })

    if (error) {
      console.error('❌ Error updating workout streak:', error)
      throw error
    }

    console.log('✅ Workout streak updated successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data,
        message: 'Workout streak updated successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})