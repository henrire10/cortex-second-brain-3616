
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { action } = await req.json()

      if (action === 'initialize_achievements') {
        console.log('🏆 Inicializando conquistas...')
        
        const newAchievements = [
          { name: 'Primeira Vitória', description: 'Complete seu primeiro treino', icon_url: '🌟', points_reward: 100 },
          { name: 'Consistente', description: 'Complete treinos por 7 dias seguidos', icon_url: '🔥', points_reward: 200 },
          { name: 'Guerreiro', description: 'Complete 10 treinos', icon_url: '⚔️', points_reward: 300 },
          { name: 'Dedicação Total', description: 'Complete 3 treinos em um só dia', icon_url: '🔥', points_reward: 300 },
          { name: 'Noturno', description: 'Complete um treino após as 22h', icon_url: '🌙', points_reward: 150 },
          { name: 'Força Suprema', description: 'Complete 20 exercícios de força em uma semana', icon_url: '💪', points_reward: 250 },
          { name: 'Cardio Master', description: 'Complete 15 exercícios de cardio em uma semana', icon_url: '❤️', points_reward: 250 },
          { name: 'Flexibilidade Zen', description: 'Complete 10 exercícios de flexibilidade em uma semana', icon_url: '🧘', points_reward: 200 },
          { name: 'Explorador', description: 'Experimente 5 tipos diferentes de exercícios', icon_url: '🗺️', points_reward: 200 },
          { name: 'Persistente', description: 'Complete treinos por 14 dias seguidos', icon_url: '⚡', points_reward: 500 },
          { name: 'Máquina de Pontos', description: 'Acumule 1000 pontos', icon_url: '🎯', points_reward: 100 },
          { name: 'Elite dos Pontos', description: 'Acumule 5000 pontos', icon_url: '🌟', points_reward: 300 },
          { name: 'Lenda dos Pontos', description: 'Acumule 10000 pontos', icon_url: '✨', points_reward: 500 },
          { name: 'Velocista', description: 'Complete um treino em menos de 15 minutos', icon_url: '⚡', points_reward: 150 },
          { name: 'Resistência', description: 'Complete um treino de mais de 60 minutos', icon_url: '🏋️', points_reward: 300 },
          { name: 'Social', description: 'Complete 5 treinos no mesmo dia que outro usuário', icon_url: '👥', points_reward: 250 },
          { name: 'Maratonista', description: 'Complete 200 treinos no total', icon_url: '🏃‍♀️', points_reward: 1500 },
          { name: 'Campeão', description: 'Complete 500 treinos no total', icon_url: '👑', points_reward: 3000 },
          { name: 'Revolucionário', description: 'Complete treinos por 60 dias seguidos', icon_url: '🚀', points_reward: 2000 },
          { name: 'Invencível', description: 'Complete treinos por 100 dias seguidos', icon_url: '⭐', points_reward: 5000 },
          { name: 'Variado', description: 'Use 10 exercícios diferentes em uma semana', icon_url: '🎪', points_reward: 200 },
          { name: 'Disciplinado', description: 'Complete treinos sempre no mesmo horário por 7 dias', icon_url: '⏰', points_reward: 300 },
          { name: 'Motivador', description: 'Complete treinos por 21 dias seguidos', icon_url: '💯', points_reward: 750 },
          { name: 'Guerreiro Plus', description: 'Complete treinos durante 5 fins de semana seguidos', icon_url: '⚔️', points_reward: 400 },
          { name: 'Especialista', description: 'Complete 25 treinos do mesmo tipo', icon_url: '🎓', points_reward: 350 },
          { name: 'Versátil', description: 'Complete pelo menos 1 treino de cada tipo disponível', icon_url: '🌈', points_reward: 400 },
          { name: 'Super Saiyan', description: 'Complete um treino com 100% de precisão', icon_url: '⚡', points_reward: 500 },
          { name: 'Ninja da Madrugada', description: 'Complete 5 treinos entre 5h e 6h da manhã', icon_url: '🥷', points_reward: 600 }
        ]

        // Verificar conquistas existentes
        const { data: existingAchievements } = await supabaseClient
          .from('achievements')
          .select('name')

        const existingNames = existingAchievements?.map(a => a.name) || []
        const achievementsToAdd = newAchievements.filter(
          achievement => !existingNames.includes(achievement.name)
        )

        console.log(`🎯 Conquistas a adicionar: ${achievementsToAdd.length} de ${newAchievements.length}`)

        if (achievementsToAdd.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Todas as conquistas já existem (sem duplicatas)',
              total: newAchievements.length,
              added: 0
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        }

        // Inserir conquistas usando service role (bypass RLS)
        const { data, error } = await supabaseClient
          .from('achievements')
          .insert(achievementsToAdd)
          .select()

        if (error) {
          console.error('❌ Erro ao inserir conquistas:', error)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error.message,
              details: error
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          )
        }

        console.log(`✅ ${data?.length || 0} conquistas adicionadas com sucesso! Duplicatas removidas.`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `${data?.length || 0} conquistas únicas adicionadas com sucesso`,
            total: newAchievements.length,
            added: data?.length || 0,
            achievements: data
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método não suportado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
