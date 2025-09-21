import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  profile_data: any;
  profile_completed: boolean;
  questionnaire_completed: boolean;
  profile_status: 'iniciando_questionario' | 'questionario_concluido' | 'gerando_treino' | 'falha_na_geracao' | 'treino_gerado';
  created_at: string;
  updated_at: string;
  subscription_status?: 'free' | 'trial' | 'active' | 'past_due' | 'cancelled';
  subscription_ends_at?: string;
  plan_id?: string;
  // Basic info
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  // Goals and experience
  fitnessGoal?: string;
  experienceLevel?: string;
  // Workout preferences
  workoutDaysPerWeek?: number;
  sessionDuration?: number;
  activityLevel?: string;
  exercisePreferences?: string;
  exerciseRestrictions?: string;
  medicalConditions?: string;
  // Health and wellness
  waterConsumption?: string;
  sleepQuality?: number;
  averageSleepHours?: number;
  stressLevel?: number;
  // Dietary preferences
  dietaryRestrictions?: string[];
  favoriteFoods?: string[];
  dislikedFoods?: string[];
  allergies?: string;
  otherRestrictions?: string;
  // Profile picture
  profile_picture_url?: string;
  // Workout streak
  current_workout_streak?: number;
  last_workout_date?: string;
  // Points system
  points?: number;
}

interface ProfileData {
  age: number;
  gender: 'masculino' | 'feminino' | 'outro';
  fitnessGoal: string;
  experienceLevel: 'iniciante' | 'intermediario' | 'avancado';
  height: number;
  weight: number;
  waist: number;
  hip: number;
  workoutPreferences: string[];
  createdAt: string;
  hasWorkoutPlan: boolean;
  profileCompleted: boolean;
  [key: string]: any;
}

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  isPremium: boolean;
  isFreemium: boolean;
  subscriptionLoading: boolean;
  workoutStats: {
    totalWorkouts: number;
    currentStreak: number;
    weeklyGoal: number;
    completedThisWeek: number;
  };
  points: number;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  updateProfile: (profileData: ProfileData) => Promise<void>;
  updateProfileStatus: (status: 'iniciando_questionario' | 'questionario_concluido' | 'gerando_treino' | 'falha_na_geracao' | 'treino_gerado') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [workoutStats, setWorkoutStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyGoal: 3,
    completedThisWeek: 0,
  });
  const [points, setPoints] = useState(0);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  // Unified subscription checking - now using only local database
  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionData({ subscribed: false, subscription_tier: null, subscription_end: null });
      return;
    }

    try {
      // Get data directly from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_ends_at, plan_id')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const subscribed = data.subscription_status === 'active' || data.subscription_status === 'trial';
        setSubscriptionData({
          subscribed,
          subscription_tier: data.plan_id,
          subscription_end: data.subscription_ends_at
        });
      } else {
        setSubscriptionData({ subscribed: false, subscription_tier: null, subscription_end: null });
      }

    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      setSubscriptionData({ subscribed: false, subscription_tier: null, subscription_end: null });
    }
  };

  const refreshSubscription = async () => {
    await checkSubscription();
  };

  const updateProfileStatus = async (status: 'iniciando_questionario' | 'questionario_concluido' | 'gerando_treino' | 'falha_na_geracao' | 'treino_gerado') => {
    try {
      if (!user?.id) {
        console.error('❌ STATUS: Usuário não encontrado para atualizar status');
        return;
      }

      console.log('🔄 STATUS: Atualizando status do perfil:', {
        userId: user.id,
        oldStatus: profile?.profile_status,
        newStatus: status
      });

      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ STATUS: Erro ao atualizar status:', error);
        throw error;
      }

      console.log('✅ STATUS: Status atualizado com sucesso:', status);
      
      // Atualizar estado local
      if (profile) {
        setProfile({ ...profile, profile_status: status });
      }

      return;
    } catch (error) {
      console.error('❌ STATUS: Erro na atualização do status:', error);
      throw error;
    }
  };

  const checkProfileComplete = (profile: Profile | null) => {
    if (!profile) {
      setIsProfileComplete(false);
      return false;
    }

    const isComplete = profile.profile_status === 'treino_gerado';
    
    console.log('✅ STATUS: Verificação de completude baseada em status:', {
      userId: profile.id,
      profileStatus: profile.profile_status,
      isComplete
    });
    
    setIsProfileComplete(isComplete);
    return isComplete;
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 STATUS: Buscando perfil do usuário:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ STATUS: Erro ao buscar perfil:', error);
        return;
      }

      // Função para converter nível de experiência
      const mapExperienceLevel = (level: string): string => {
        if (level === 'experiencia_iniciante') return 'iniciante';
        if (level === 'experiencia_intermediario') return 'intermediario';
        if (level === 'experiencia_avancado') return 'avancado';
        return level; // retorna o valor original se não for um dos mapeados
      };

      console.log('🔍 Dados brutos do banco:', {
        fitness_goal: data.fitness_goal,
        experience_level: data.experience_level,
        age: data.age,
        gender: data.gender
      });

      const profileData = data.profile_data as any;
      const enhancedProfile: Profile = {
        ...data,
        // Map database snake_case to camelCase for the interface
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        fitnessGoal: data.fitness_goal,
        experienceLevel: mapExperienceLevel(data.experience_level || ''),
        workoutDaysPerWeek: data.workout_days_per_week,
        sessionDuration: data.session_duration,
        activityLevel: data.activity_level,
        exercisePreferences: data.exercise_preferences,
        exerciseRestrictions: data.exercise_restrictions,
        medicalConditions: data.medical_conditions,
        waterConsumption: data.water_consumption,
        sleepQuality: data.sleep_quality,
        averageSleepHours: data.average_sleep_hours,
        stressLevel: data.stress_level,
        dietaryRestrictions: data.dietary_restrictions,
        favoriteFoods: data.favorite_foods,
        dislikedFoods: data.disliked_foods,
        allergies: data.allergies,
        otherRestrictions: data.other_restrictions,
        profile_picture_url: data.profile_picture_url,
        current_workout_streak: data.current_workout_streak,
        last_workout_date: data.last_workout_date,
        subscription_status: (data.subscription_status as 'free' | 'trial' | 'active' | 'past_due' | 'cancelled') || 'free',
        subscription_ends_at: data.subscription_ends_at,
        plan_id: data.plan_id
      };

      console.log('✅ Perfil mapeado final:', {
        fitnessGoal: enhancedProfile.fitnessGoal,
        experienceLevel: enhancedProfile.experienceLevel,
        age: enhancedProfile.age,
        name: enhancedProfile.name
      });

      console.log('✅ STATUS: Perfil carregado com status:', {
        userId: data.id,
        profileStatus: data.profile_status,
        questionnaire: data.questionnaire_completed,
        profileCompleted: data.profile_completed
      });

      setProfile(enhancedProfile);
      checkProfileComplete(enhancedProfile);
      
      // Sync subscription data from profile
      setSubscriptionData({
        subscribed: enhancedProfile.subscription_status === 'active' || enhancedProfile.subscription_status === 'trial',
        subscription_tier: enhancedProfile.plan_id || null,
        subscription_end: enhancedProfile.subscription_ends_at || null
      });
      
      // Atualizar pontos do perfil
      if (data.points !== undefined) {
        setPoints(data.points);
      }
      
    } catch (error) {
      console.error('❌ STATUS: Erro na busca do perfil:', error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
      // Forçar atualização dos pontos também
      const { data: pointsData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();
      
      if (pointsData) {
        console.log('🔄 PONTOS: Atualizando pontos para:', pointsData.points);
        setPoints(pointsData.points);
      }
    }
  };

  const addPoints = async (pointsToAdd: number) => {
    try {
      setPoints(prev => prev + pointsToAdd);
      console.log(`Added ${pointsToAdd} points`);
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const updateProfile = async (profileData: ProfileData) => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          profile_data: profileData as any,
          profile_completed: profileData.profileCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Perfil atualizado com sucesso!",
        description: "Suas informações foram salvas.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔧 STATUS: Auth state change:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsProfileComplete(false);
          setSubscriptionData({ subscribed: false, subscription_tier: null, subscription_end: null });
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh subscription every 5 minutes after user loads
  useEffect(() => {
    if (user) {
      checkSubscription();
      const interval = setInterval(checkSubscription, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsProfileComplete(false);
    setSubscriptionData({ subscribed: false, subscription_tier: null, subscription_end: null });
  };

  const isPremium = subscriptionData?.subscribed || false;
  const isFreemium = !isPremium;
  const subscriptionLoading = isLoading;

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isProfileComplete,
    isPremium,
    isFreemium,
    subscriptionLoading,
    workoutStats,
    points,
    login,
    signup,
    logout,
    refreshProfile,
    refreshSubscription,
    addPoints,
    updateProfile,
    updateProfileStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};