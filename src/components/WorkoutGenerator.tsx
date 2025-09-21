
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Zap, User, Target, Clock, MapPin, Ruler, Weight, Calendar, Star, Sparkles, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WorkoutGeneratorProps {
  profile: any;
  isGeneratingWorkout: boolean;
  generationProgress: number;
  onGenerateWorkout: () => void;
  hasWorkout?: boolean;
  onRegenerateWorkout?: () => void;
}

export const WorkoutGenerator: React.FC<WorkoutGeneratorProps> = ({
  profile,
  isGeneratingWorkout,
  generationProgress,
  onGenerateWorkout,
  hasWorkout = false,
  onRegenerateWorkout
}) => {
  const isMobile = useIsMobile();

  // Função unificada para gerar/regenerar treino
  const handleGenerateWorkout = () => {
    if (hasWorkout && onRegenerateWorkout) {
      onRegenerateWorkout();
    } else {
      onGenerateWorkout();
    }
  };

  // Se já tem treino e não está gerando, mostrar apenas o botão de regenerar
  if (hasWorkout && !isGeneratingWorkout) {
    return (
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Seu Treino Personalizado ✨
            </h3>
            <p className="text-gray-600 text-sm">
              Treino criado por IA baseado no seu perfil único
            </p>
          </div>
          
          <Button
            onClick={handleGenerateWorkout}
            variant="outline"
            className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Gerar Novo Treino
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600 rounded-3xl shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative p-6 text-white">
          {/* Header with sparkle animation */}
          <div className="text-center mb-6">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg transform rotate-6 animate-pulse"></div>
              <div className="relative bg-white/30 rounded-2xl backdrop-blur-sm flex items-center justify-center w-full h-full shadow-xl">
                <Dumbbell className="w-10 h-10 text-white" />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              ✨ Treino Personalizado IA
            </h2>
            
            <p className="text-white/90 text-sm font-medium">
              Seu plano perfeito criado por inteligência artificial
            </p>
          </div>

          {/* Modern Profile Summary */}
          {profile && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Seu Perfil</h3>
                  <p className="text-white/80 text-xs">Dados para personalização</p>
                </div>
              </div>
              
              {/* Profile Stats with modern cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 font-medium">Objetivo</p>
                      <p className="font-bold text-white text-sm truncate">{profile.fitnessGoal || 'Não definido'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 font-medium">Nível</p>
                      <p className="font-bold text-white text-sm truncate">{profile.experienceLevel || 'Não definido'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 font-medium">Idade</p>
                      <p className="font-bold text-white text-sm truncate">{profile.age || 'N/A'} anos</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Ruler className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 font-medium">Físico</p>
                      <p className="font-bold text-white text-sm truncate">
                        {profile.height}cm, {profile.weight}kg
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Equipment badges with modern style */}
              {profile.workoutPreferences && profile.workoutPreferences.length > 0 && (
                <div className="pt-3 border-t border-white/20">
                  <p className="text-sm text-white/80 mb-2 font-medium flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Equipamentos disponíveis:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.workoutPreferences.slice(0, 2).map((equipment: string, index: number) => (
                      <Badge key={index} className="bg-white/20 text-white border-white/30 text-xs px-3 py-1 font-medium">
                        {equipment}
                      </Badge>
                    ))}
                    {profile.workoutPreferences.length > 2 && (
                      <Badge className="bg-white/10 text-white/80 border-white/20 text-xs px-3 py-1">
                        +{profile.workoutPreferences.length - 2} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation State with modern animations */}
          {isGeneratingWorkout ? (
            <div className="text-center space-y-5">
              <div className="relative">
                <div className="w-24 h-24 mx-auto relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">
                  🧠 IA Criando Seu Treino...
                </h3>
                <p className="text-white/90 text-sm px-2 leading-relaxed">
                  Nossa inteligência artificial está analisando seu perfil e criando exercícios de academia personalizados para você
                </p>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <Progress value={generationProgress} className="w-full h-3 mb-3 bg-white/20" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">
                      {Math.round(generationProgress)}% concluído
                    </span>
                    <span className="text-xs text-white/80 font-medium">
                      Quase pronto! ✨
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-5">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">
                  🚀 Pronto para começar?
                </h3>
                <p className="text-white/90 text-sm px-2 leading-relaxed">
                  Nossa IA analisará seu perfil completo e criará um plano de treino semanal 
                  personalizado com exercícios de academia, séries, repetições e dicas exclusivas.
                </p>
              </div>
              
              <Button
                onClick={handleGenerateWorkout}
                className="relative group bg-white text-purple-600 hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl px-8 py-4 text-base font-bold rounded-2xl w-full border-2 border-white/30"
                size="lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="relative">
                    <Zap className="w-6 h-6 group-hover:animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>
                  <span>{hasWorkout ? 'Gerar Novo Treino IA' : 'Gerar Meu Treino IA'}</span>
                </div>
                
                {/* Enhanced shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              </Button>
              
              {/* Modern feature highlights */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-white mb-1 text-xs">100% Personalizado</p>
                  <p className="text-xs text-white/80">Baseado no seu perfil único</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-300 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-white mb-1 text-xs">Academia Completa</p>
                  <p className="text-xs text-white/80">Exercícios e equipamentos</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-white mb-1 text-xs">IA Avançada</p>
                  <p className="text-xs text-white/80">Criado por inteligência artificial</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl border border-purple-100 shadow-xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {hasWorkout ? 'Gerar Novo Treino' : 'Gerar Treino Personalizado'}
          </h2>
          
          <p className="text-gray-600 text-lg">
            Treino sob medida baseado no seu perfil único
          </p>
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/50 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-800">Seu Perfil</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Objetivo</p>
                  <p className="font-semibold text-gray-800 text-sm">{profile.fitnessGoal || 'Não definido'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experiência</p>
                  <p className="font-semibold text-gray-800 text-sm">{profile.experienceLevel || 'Não definido'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Idade</p>
                  <p className="font-semibold text-gray-800 text-sm">{profile.age || 'N/A'} anos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Físico</p>
                  <p className="font-semibold text-gray-800 text-sm">
                    {profile.height}cm, {profile.weight}kg
                  </p>
                </div>
              </div>
            </div>
            
            {/* Equipment badges */}
            {profile.workoutPreferences && profile.workoutPreferences.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Equipamentos disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.workoutPreferences.slice(0, 3).map((equipment: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                      {equipment}
                    </Badge>
                  ))}
                  {profile.workoutPreferences.length > 3 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      +{profile.workoutPreferences.length - 3} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generation State */}
        {isGeneratingWorkout ? (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <Zap className="w-8 h-8 text-purple-600 animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">
                🧠 IA Trabalhando...
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Nossa inteligência artificial está analisando seu perfil e criando o treino perfeito para você
              </p>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
                <Progress value={generationProgress} className="w-full h-3 mb-3" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-600">
                    {Math.round(generationProgress)}% concluído
                  </span>
                  <span className="text-xs text-gray-500">
                    Quase pronto...
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">
                Pronto para começar?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Nossa IA analisará seu perfil completo e criará um plano de treino semanal 
                personalizado com exercícios, séries, repetições e dicas exclusivas.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleGenerateWorkout}
                className="relative group bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl px-8 py-4 text-lg rounded-2xl"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 group-hover:animate-pulse" />
                  <span className="font-semibold">
                    {hasWorkout ? 'Gerar Novo Treino' : 'Gerar Meu Treino'}
                  </span>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              </Button>
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Personalizado</p>
                <p className="text-sm text-gray-600">100% baseado no seu perfil</p>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Dumbbell className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Completo</p>
                <p className="text-sm text-gray-600">Exercícios, séries e dicas</p>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Inteligente</p>
                <p className="text-sm text-gray-600">Criado por IA avançada</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
