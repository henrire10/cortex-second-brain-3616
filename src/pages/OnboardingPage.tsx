import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FreemiumWorkoutCard } from '@/components/FreemiumWorkoutCard';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    fitnessGoal: '',
    experienceLevel: '',
    workoutDaysPerWeek: '3',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile?.questionnaire_completed) {
      navigate('/dashboard');
    }
  }, [user, profile, navigate]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      setIsGeneratingWorkout(true);

      const mockWorkout = {
        title: "Treino Personalizado - Semana 1",
        exercises: [
          {
            name: "Agachamento Livre",
            sets: "3",
            reps: "12-15",
            rest: "60s",
            weight: "Peso corporal"
          },
          {
            name: "Flexão de Braço",
            sets: "3", 
            reps: "8-12",
            rest: "45s",
            weight: "Peso corporal"
          },
          {
            name: "Prancha Abdominal",
            sets: "3",
            reps: "30s",
            rest: "30s",
            weight: "Peso corporal"
          },
          {
            name: "Polichinelo", 
            sets: "3",
            reps: "20",
            rest: "45s",
            weight: "Peso corporal"
          },
          {
            name: "Mountain Climbers",
            sets: "3",
            reps: "15 cada perna",
            rest: "60s", 
            weight: "Peso corporal"
          }
        ]
      };

      setTimeout(() => {
        setGeneratedWorkout(mockWorkout);
        setIsGeneratingWorkout(false);
        toast({
          title: "Treino Gerado!",
          description: "Seu primeiro treino personalizado está pronto!"
        });
        startCountdown();
      }, 3000);

    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar treino. Tente novamente.",
        variant: "destructive"
      });
      setIsGeneratingWorkout(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/?pricing=true');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipToPlans = () => {
    navigate('/?pricing=true');
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / 4) * 100;

  if (isGeneratingWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Gerando seu treino personalizado...
            </h3>
            <p className="text-gray-600">
              Nossa IA está criando o treino perfeito para você com base nas suas informações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (generatedWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Treino Gerado com Sucesso!</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Seu Primeiro Treino Personalizado
            </h2>
            <p className="text-gray-600 mb-4">
              Aqui está uma prévia do que você pode fazer. Para ver o treino completo, considere assinar nosso plano premium.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800 font-medium mb-2">
                Redirecionando para os planos em {countdown} segundos...
              </p>
              <Button 
                variant="outline"
                size="sm"
                onClick={skipToPlans}
                className="text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                Ver Planos Agora
              </Button>
            </div>
          </div>

          <FreemiumWorkoutCard 
            workout={generatedWorkout} 
            isPremium={false} 
          />

          <div className="mt-6 text-center">
            <Button 
              onClick={() => navigate('/?pricing=true')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 mb-4"
            >
              Ver Planos Premium
            </Button>
            <div>
              <Button 
                variant="link" 
                onClick={() => navigate('/dashboard')}
                className="text-gray-600"
              >
                Continuar com versão gratuita
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Vamos começar!</h2>
              <p className="text-gray-600">Conte-nos sobre você para criar seu treino personalizado</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="25"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Medidas corporais</h2>
              <p className="text-gray-600">Para calcular seu treino ideal</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  placeholder="170"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="70"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Seu objetivo</h2>
              <p className="text-gray-600">O que você quer alcançar?</p>
            </div>
            <div className="space-y-3">
              {[
                'Perder peso',
                'Ganhar massa muscular',
                'Melhorar condicionamento',
                'Tonificar corpo'
              ].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setFormData({...formData, fitnessGoal: goal})}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    formData.fitnessGoal === goal
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Experiência</h2>
              <p className="text-gray-600">Qual seu nível de experiência com exercícios?</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'iniciante', label: 'Iniciante' },
                { value: 'intermediario', label: 'Intermediário' },
                { value: 'avancado', label: 'Avançado' }
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setFormData({...formData, experienceLevel: level.value})}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    formData.experienceLevel === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.age && formData.gender;
      case 1:
        return formData.height && formData.weight;
      case 2:
        return formData.fitnessGoal;
      case 3:
        return formData.experienceLevel;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Configuração Inicial
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Passo {currentStep + 1} de 4
            </p>
          </div>
          
          <div className="w-10" />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step */}
        <Card>
          <CardContent className="p-6">
            {renderStep()}
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === 3 ? 'Gerar Treino' : 'Próximo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;