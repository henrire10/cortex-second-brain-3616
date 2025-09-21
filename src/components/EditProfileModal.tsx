import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, Dumbbell, Target, Clock, Heart, Activity, Utensils, CheckCircle, X } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    user,
    profile,
    refreshProfile
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    fitness_goal: '',
    experience_level: '',
    workout_days_per_week: '',
    session_duration: '',
    activity_level: '',
    exercise_preferences: '',
    exercise_restrictions: '',
    medical_conditions: '',
    water_consumption: '',
    sleep_quality: '',
    average_sleep_hours: '',
    stress_level: '',
    dietary_restrictions: [] as string[],
    favorite_foods: [] as string[],
    disliked_foods: [] as string[],
    allergies: '',
    other_restrictions: ''
  });
  useEffect(() => {
    if (profile && isOpen) {
      console.log('🔍 EDIT PROFILE: Loading profile data for editing:', {
        name: profile.name,
        experienceLevel: profile.experienceLevel,
        fitnessGoal: profile.fitnessGoal,
        allFields: Object.keys(profile).length
      });

      // Helper function to map fitness goal values
      const mapFitnessGoal = (goal: string | null) => {
        if (!goal) return '';
        console.log('🎯 EDIT PROFILE: Original fitness goal value:', goal);

        // Map common variations to expected values
        const goalMapping: {
          [key: string]: string;
        } = {
          'perder_peso': 'perder_peso',
          'perda_peso': 'perder_peso',
          'emagrecimento': 'perder_peso',
          'perder peso': 'perder_peso',
          'ganhar_massa': 'ganhar_massa',
          'ganho_massa': 'ganhar_massa',
          'hipertrofia': 'ganhar_massa',
          'ganhar massa muscular': 'ganhar_massa',
          'melhorar_condicionamento': 'melhorar_condicionamento',
          'condicionamento': 'melhorar_condicionamento',
          'cardio': 'melhorar_condicionamento',
          'melhorar condicionamento': 'melhorar_condicionamento',
          'tonificar': 'tonificar',
          'tonificacao': 'tonificar',
          'definicao': 'tonificar',
          'tonificar o corpo': 'tonificar',
          'manter_forma': 'manter_forma',
          'manutencao': 'manter_forma',
          'manter a forma': 'manter_forma',
          'reabilitacao': 'reabilitacao',
          'reabilitação': 'reabilitacao'
        };
        const mappedGoal = goalMapping[goal.toLowerCase()] || goal.toLowerCase();
        console.log('🎯 EDIT PROFILE: Mapped fitness goal:', mappedGoal);
        return mappedGoal;
      };

      // Access profile data using camelCase property names from the Profile interface
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        height: profile.height?.toString() || '',
        weight: profile.weight?.toString() || '',
        fitness_goal: mapFitnessGoal(profile.fitnessGoal),
        experience_level: profile.experienceLevel || '',
        workout_days_per_week: profile.workoutDaysPerWeek?.toString() || '',
        session_duration: profile.sessionDuration?.toString() || '',
        activity_level: profile.activityLevel || '',
        exercise_preferences: profile.exercisePreferences || '',
        exercise_restrictions: profile.exerciseRestrictions || '',
        medical_conditions: profile.medicalConditions || '',
        water_consumption: profile.waterConsumption || '',
        sleep_quality: profile.sleepQuality?.toString() || '',
        average_sleep_hours: profile.averageSleepHours?.toString() || '',
        stress_level: profile.stressLevel?.toString() || '',
        dietary_restrictions: profile.dietaryRestrictions || [],
        favorite_foods: profile.favoriteFoods || [],
        disliked_foods: profile.dislikedFoods || [],
        allergies: profile.allergies || '',
        other_restrictions: profile.otherRestrictions || ''
      });
      console.log('✅ EDIT PROFILE: Form data loaded with fitness_goal:', mapFitnessGoal(profile.fitnessGoal));
    }
  }, [profile, isOpen]);

  // Debounced close function to prevent double clicks
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    console.log('🔄 EDIT PROFILE: Closing modal');
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 100);
  }, [isClosing, onClose]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('💾 EDIT PROFILE: Saving profile data:', {
        userId: user?.id,
        experienceLevel: formData.experience_level,
        allFormData: Object.keys(formData).length
      });
      const {
        error
      } = await supabase.from('profiles').update({
        name: formData.name,
        age: parseInt(formData.age) || null,
        gender: formData.gender || null,
        height: parseFloat(formData.height) || null,
        weight: parseFloat(formData.weight) || null,
        fitness_goal: formData.fitness_goal || null,
        experience_level: formData.experience_level || null,
        workout_days_per_week: parseInt(formData.workout_days_per_week) || null,
        session_duration: parseInt(formData.session_duration) || null,
        activity_level: formData.activity_level || null,
        exercise_preferences: formData.exercise_preferences || null,
        exercise_restrictions: formData.exercise_restrictions || null,
        medical_conditions: formData.medical_conditions || null,
        water_consumption: formData.water_consumption || null,
        sleep_quality: parseInt(formData.sleep_quality) || null,
        average_sleep_hours: parseFloat(formData.average_sleep_hours) || null,
        stress_level: parseInt(formData.stress_level) || null,
        dietary_restrictions: formData.dietary_restrictions,
        favorite_foods: formData.favorite_foods,
        disliked_foods: formData.disliked_foods,
        allergies: formData.allergies || null,
        other_restrictions: formData.other_restrictions || null,
        updated_at: new Date().toISOString()
      }).eq('id', user?.id);
      if (error) {
        console.error('❌ EDIT PROFILE: Error saving profile:', error);
        throw error;
      }
      console.log('✅ EDIT PROFILE: Profile saved successfully');
      await refreshProfile();
      toast({
        title: "Perfil Atualizado! ✅",
        description: "Suas informações foram salvas com sucesso.",
        duration: 3000
      });

      // Fechar modal após salvar com sucesso
      onClose();
    } catch (error: any) {
      console.error('❌ EDIT PROFILE: Error updating profile:', error);
      toast({
        title: "Erro ao Atualizar Perfil",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  const handleArrayChange = (field: 'dietary_restrictions' | 'favorite_foods' | 'disliked_foods', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter(item => item !== value)
    }));
  };

  // Calcula progresso do preenchimento
  const calculateProgress = () => {
    const totalFields = 20;
    const filledFields = Object.values(formData).filter(value => Array.isArray(value) ? value.length > 0 : value !== '').length;
    return Math.round(filledFields / totalFields * 100);
  };
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none overflow-hidden p-0 bg-gradient-to-br from-background via-background/95 to-primary/5">
        {/* Header com gradiente e progresso */}
        <div className="relative bg-gradient-to-r from-primary via-primary/90 to-secondary p-2 text-primary-foreground">
          <button onClick={handleClose} disabled={isClosing} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
          
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center gap-3 font-bold text-center text-xl">
              <div className="p-3 bg-white/20 rounded-2xl">
                <User className="w-8 h-8" />
              </div>
              Editar Perfil Completo
            </DialogTitle>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm opacity-90">
                <span>Progresso do perfil</span>
                <span>{calculateProgress()}% completo</span>
              </div>
              <Progress value={calculateProgress()} className="h-2 bg-white/20" />
            </div>
          </DialogHeader>
        </div>

        {/* Container com scroll personalizado */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-hide h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Layout responsivo com grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
              
              {/* Card 1: Informações Básicas */}
              <Card className="bg-white/70 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-700 group-hover:text-blue-800 transition-colors">
                    <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seção de foto de perfil */}
                  <div className="flex justify-center pb-4 border-b border-blue-100">
                    <AvatarUpload currentAvatarUrl={profile?.profile_picture_url} onAvatarChange={() => refreshProfile()} size="lg" />
                  </div>
                  
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome Completo</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))} placeholder="Seu nome completo" required className="mt-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="age" className="text-sm font-medium text-gray-700">Idade</Label>
                      <Input id="age" type="number" value={formData.age} onChange={e => setFormData(prev => ({
                      ...prev,
                      age: e.target.value
                    }))} placeholder="Idade" min="18" max="100" className="mt-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400" />
                    </div>
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gênero</Label>
                      <Select value={formData.gender} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      gender: value
                    }))}>
                        <SelectTrigger className="mt-1 border-gray-200 focus:border-blue-400">
                          <SelectValue placeholder="Gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="nao_binario">Não Binário</SelectItem>
                          <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="height" className="text-sm font-medium text-gray-700">Altura (cm)</Label>
                      <Input id="height" type="number" value={formData.height} onChange={e => setFormData(prev => ({
                      ...prev,
                      height: e.target.value
                    }))} placeholder="Altura" min="100" max="250" className="mt-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400" />
                    </div>
                    <div>
                      <Label htmlFor="weight" className="text-sm font-medium text-gray-700">Peso (kg)</Label>
                      <Input id="weight" type="number" value={formData.weight} onChange={e => setFormData(prev => ({
                      ...prev,
                      weight: e.target.value
                    }))} placeholder="Peso" min="30" max="300" step="0.1" className="mt-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Objetivos e Experiência */}
              <Card className="bg-white/70 backdrop-blur-sm border-2 border-green-100 hover:border-green-200 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-green-700 group-hover:text-green-800 transition-colors">
                    <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                      <Target className="w-5 h-5" />
                    </div>
                    Objetivos e Experiência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fitness_goal" className="text-sm font-medium text-gray-700">Objetivo Principal</Label>
                    <Select value={formData.fitness_goal} onValueChange={value => setFormData(prev => ({
                    ...prev,
                    fitness_goal: value
                  }))}>
                      <SelectTrigger className="mt-1 border-gray-200 focus:border-green-400">
                        <SelectValue placeholder="Selecione seu objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perder_peso">🔥 Perder Peso</SelectItem>
                        <SelectItem value="ganhar_massa">💪 Ganhar Massa Muscular</SelectItem>
                        <SelectItem value="melhorar_condicionamento">🏃 Melhorar Condicionamento</SelectItem>
                        <SelectItem value="tonificar">✨ Tonificar o Corpo</SelectItem>
                        <SelectItem value="manter_forma">⚖️ Manter a Forma</SelectItem>
                        <SelectItem value="reabilitacao">🩺 Reabilitação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="experience_level" className="text-sm font-medium text-gray-700">Nível de Experiência</Label>
                    <Select value={formData.experience_level} onValueChange={value => {
                    console.log('🔄 EDIT PROFILE: Experience level changed to:', value);
                    setFormData(prev => ({
                      ...prev,
                      experience_level: value
                    }));
                  }}>
                      <SelectTrigger className="mt-1 border-gray-200 focus:border-green-400">
                        <SelectValue placeholder="Selecione seu nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">🌱 Iniciante</SelectItem>
                        <SelectItem value="intermediario">📈 Intermediário</SelectItem>
                        <SelectItem value="avancado">🚀 Avançado</SelectItem>
                        <SelectItem value="experiente">🏆 Experiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Preferências de Treino */}
              <Card className="bg-white/70 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 group xl:col-span-1 lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-purple-700 group-hover:text-purple-800 transition-colors">
                    <div className="p-2 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    Preferências de Treino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="workout_days_per_week" className="text-sm font-medium text-gray-700">Dias por Semana</Label>
                      <Select value={formData.workout_days_per_week} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      workout_days_per_week: value
                    }))}>
                        <SelectTrigger className="mt-1 border-gray-200 focus:border-purple-400">
                          <SelectValue placeholder="Frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">📅 2 dias</SelectItem>
                          <SelectItem value="3">📅 3 dias</SelectItem>
                          <SelectItem value="4">📅 4 dias</SelectItem>
                          <SelectItem value="5">📅 5 dias</SelectItem>
                          <SelectItem value="6">📅 6 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="session_duration" className="text-sm font-medium text-gray-700">Duração (min)</Label>
                      <Select value={formData.session_duration} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      session_duration: value
                    }))}>
                        <SelectTrigger className="mt-1 border-gray-200 focus:border-purple-400">
                          <SelectValue placeholder="Tempo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">⏱️ 30 min</SelectItem>
                          <SelectItem value="45">⏱️ 45 min</SelectItem>
                          <SelectItem value="60">⏱️ 60 min</SelectItem>
                          <SelectItem value="90">⏱️ 90 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="activity_level" className="text-sm font-medium text-gray-700">Atividade Diária</Label>
                      <Select value={formData.activity_level} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      activity_level: value
                    }))}>
                        <SelectTrigger className="mt-1 border-gray-200 focus:border-purple-400">
                          <SelectValue placeholder="Nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentario">😴 Sedentário</SelectItem>
                          <SelectItem value="leve">🚶 Leve</SelectItem>
                          <SelectItem value="moderado">🏃 Moderado</SelectItem>
                          <SelectItem value="ativo">💪 Ativo</SelectItem>
                          <SelectItem value="muito_ativo">🔥 Muito Ativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="exercise_preferences" className="text-sm font-medium text-gray-700">Preferências de Exercícios</Label>
                      <Textarea id="exercise_preferences" value={formData.exercise_preferences} onChange={e => setFormData(prev => ({
                      ...prev,
                      exercise_preferences: e.target.value
                    }))} placeholder="Ex: Prefiro exercícios funcionais, gosto de crossfit..." rows={2} className="mt-1 border-gray-200 focus:border-purple-400 resize-none" />
                    </div>
                    
                    <div>
                      <Label htmlFor="exercise_restrictions" className="text-sm font-medium text-gray-700">Restrições de Exercícios</Label>
                      <Textarea id="exercise_restrictions" value={formData.exercise_restrictions} onChange={e => setFormData(prev => ({
                      ...prev,
                      exercise_restrictions: e.target.value
                    }))} placeholder="Ex: Evitar exercícios de alto impacto, problemas no joelho..." rows={2} className="mt-1 border-gray-200 focus:border-purple-400 resize-none" />
                    </div>
                    
                    <div>
                      <Label htmlFor="medical_conditions" className="text-sm font-medium text-gray-700">Condições Médicas</Label>
                      <Textarea id="medical_conditions" value={formData.medical_conditions} onChange={e => setFormData(prev => ({
                      ...prev,
                      medical_conditions: e.target.value
                    }))} placeholder="Ex: Hipertensão, diabetes, lesões anteriores..." rows={2} className="mt-1 border-gray-200 focus:border-purple-400 resize-none" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Saúde e Bem-estar */}
              <Card className="bg-white/70 backdrop-blur-sm border-2 border-red-100 hover:border-red-200 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-red-700 group-hover:text-red-800 transition-colors">
                    <div className="p-2 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                      <Heart className="w-5 h-5" />
                    </div>
                    Saúde e Bem-estar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="water_consumption" className="text-sm font-medium text-gray-700">Consumo de Água</Label>
                      <Select value={formData.water_consumption} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      water_consumption: value
                    }))}>
                        <SelectTrigger className="mt-1 border-gray-200 focus:border-red-400">
                          <SelectValue placeholder="Consumo diário" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="menos_1_litro">💧 Menos de 1L</SelectItem>
                          <SelectItem value="1_2_litros">💧💧 1-2 litros</SelectItem>
                          <SelectItem value="2_3_litros">💧💧💧 2-3 litros</SelectItem>
                          <SelectItem value="mais_3_litros">💧💧💧💧 Mais de 3L</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sleep_quality" className="text-sm font-medium text-gray-700">Qualidade do Sono</Label>
                      <Select value={formData.sleep_quality} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      sleep_quality: value
                    }))}>
                        <SelectTrigger className="mt-1 border-gray-200 focus:border-red-400">
                          <SelectValue placeholder="Avalie seu sono" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">😴 1 - Muito Ruim</SelectItem>
                          <SelectItem value="2">😪 2 - Ruim</SelectItem>
                          <SelectItem value="3">😐 3 - Regular</SelectItem>
                          <SelectItem value="4">😊 4 - Bom</SelectItem>
                          <SelectItem value="5">😍 5 - Excelente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="average_sleep_hours" className="text-sm font-medium text-gray-700">Horas de Sono</Label>
                      <Input id="average_sleep_hours" type="number" value={formData.average_sleep_hours} onChange={e => setFormData(prev => ({
                      ...prev,
                      average_sleep_hours: e.target.value
                    }))} placeholder="Ex: 7.5" min="4" max="12" step="0.5" className="mt-1 border-gray-200 focus:border-red-400 focus:ring-red-400" />
                    </div>
                    <div>
                      <Label htmlFor="stress_level" className="text-sm font-medium text-gray-700">Nível de Estresse</Label>
                      <Select value={formData.stress_level} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      stress_level: value
                    }))}>
                        <SelectTrigger className="mt-1 border-gray-200 focus:border-red-400">
                          <SelectValue placeholder="Nível atual" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">😌 1 - Muito Baixo</SelectItem>
                          <SelectItem value="2">🙂 2 - Baixo</SelectItem>
                          <SelectItem value="3">😐 3 - Moderado</SelectItem>
                          <SelectItem value="4">😰 4 - Alto</SelectItem>
                          <SelectItem value="5">😫 5 - Muito Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 5: Preferências Alimentares */}
              <Card className="bg-white/70 backdrop-blur-sm border-2 border-orange-100 hover:border-orange-200 transition-all duration-300 group xl:col-span-1 lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-orange-700 group-hover:text-orange-800 transition-colors">
                    <div className="p-2 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                      <Utensils className="w-5 h-5" />
                    </div>
                    Preferências Alimentares
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Restrições Alimentares</Label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {[{
                      value: 'vegetariano',
                      label: '🥗 Vegetariano',
                      emoji: '🥗'
                    }, {
                      value: 'vegano',
                      label: '🌱 Vegano',
                      emoji: '🌱'
                    }, {
                      value: 'sem_gluten',
                      label: '🚫 Sem Glúten',
                      emoji: '🚫'
                    }, {
                      value: 'sem_lactose',
                      label: '🥛 Sem Lactose',
                      emoji: '🥛'
                    }, {
                      value: 'low_carb',
                      label: '🥩 Low Carb',
                      emoji: '🥩'
                    }, {
                      value: 'sem_acucar',
                      label: '🍯 Sem Açúcar',
                      emoji: '🍯'
                    }].map(restriction => <div key={restriction.value} className="flex items-center space-x-2 p-2 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                          <Checkbox id={restriction.value} checked={formData.dietary_restrictions.includes(restriction.value)} onCheckedChange={checked => handleArrayChange('dietary_restrictions', restriction.value, checked as boolean)} className="border-orange-300 data-[state=checked]:bg-orange-500" />
                          <Label htmlFor={restriction.value} className="text-sm cursor-pointer">
                            {restriction.label}
                          </Label>
                        </div>)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="allergies" className="text-sm font-medium text-gray-700">Alergias Alimentares</Label>
                      <Textarea id="allergies" value={formData.allergies} onChange={e => setFormData(prev => ({
                      ...prev,
                      allergies: e.target.value
                    }))} placeholder="Ex: Amendoim, frutos do mar, soja..." rows={2} className="mt-1 border-gray-200 focus:border-orange-400 resize-none" />
                    </div>

                    <div>
                      <Label htmlFor="other_restrictions" className="text-sm font-medium text-gray-700">Outras Restrições</Label>
                      <Textarea id="other_restrictions" value={formData.other_restrictions} onChange={e => setFormData(prev => ({
                      ...prev,
                      other_restrictions: e.target.value
                    }))} placeholder="Ex: Intolerância a certos alimentos, preferências pessoais..." rows={2} className="mt-1 border-gray-200 focus:border-orange-400 resize-none" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer com botões */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-6 z-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Progresso salvo automaticamente</span>
                </div>
                
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-8 shadow-lg hover:shadow-xl transition-all duration-300">
                    {loading ? <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </div> : <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Salvar Alterações
                      </div>}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>;
};