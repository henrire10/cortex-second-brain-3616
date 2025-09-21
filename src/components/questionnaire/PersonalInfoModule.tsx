
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Ruler, Scale, Calendar, Heart, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface PersonalInfoModuleProps {
  data: {
    idade: number;
    genero: string;
    altura_cm: number;
    peso_kg: number;
    nivel_atividade_diaria: string;
  };
  onUpdateData: (data: any) => void;
  currentStep: number;
}

export const PersonalInfoModule: React.FC<PersonalInfoModuleProps> = ({
  data,
  onUpdateData,
  currentStep
}) => {
  const calculateBMI = () => {
    if (data.altura_cm && data.peso_kg) {
      const heightInMeters = data.altura_cm / 100;
      return (data.peso_kg / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { 
      category: 'Abaixo do peso', 
      color: 'bg-blue-100 text-blue-800', 
      status: 'Atenção',
      icon: AlertTriangle,
      message: 'Seu IMC está abaixo do ideal. Consulte um profissional para avaliar sua nutrição.',
      healthLevel: 'baixo'
    };
    if (bmi < 25) return { 
      category: 'Peso normal', 
      color: 'bg-green-100 text-green-800', 
      status: 'Excelente',
      icon: CheckCircle,
      message: 'Parabéns! Seu IMC está na faixa ideal para a saúde.',
      healthLevel: 'excelente'
    };
    if (bmi < 30) return { 
      category: 'Sobrepeso', 
      color: 'bg-yellow-100 text-yellow-800', 
      status: 'Cuidado',
      icon: AlertTriangle,
      message: 'Seu IMC indica sobrepeso. Um plano personalizado pode ajudar você!',
      healthLevel: 'moderado'
    };
    return { 
      category: 'Obesidade', 
      color: 'bg-red-100 text-red-800', 
      status: 'Atenção',
      icon: AlertTriangle,
      message: 'Recomendamos consultar um profissional de saúde. Nosso treino vai te apoiar!',
      healthLevel: 'alto'
    };
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Sua Idade</h2>
        <p className="text-gray-600">Vamos começar conhecendo você melhor</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <User className="w-5 h-5" />
            Quantos anos você tem?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="age">Idade</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="age"
                type="number"
                value={data.idade || ''}
                onChange={(e) => onUpdateData({ idade: parseInt(e.target.value) || 0 })}
                placeholder="25"
                className="pl-10 mt-1 text-center text-lg"
                min="16"
                max="80"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Entre 16 e 80 anos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ruler className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Dados Físicos</h2>
        <p className="text-gray-600">Suas medidas para personalizar seu treino</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Gênero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={data.genero}
              onChange={(e) => onUpdateData({ genero: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Selecione</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Altura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={data.altura_cm || ''}
                onChange={(e) => onUpdateData({ altura_cm: parseInt(e.target.value) || 0 })}
                placeholder="170"
                className="pl-10"
                min="120"
                max="250"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Em centímetros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Scale className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                step="0.1"
                value={data.peso_kg || ''}
                onChange={(e) => onUpdateData({ peso_kg: parseFloat(e.target.value) || 0 })}
                placeholder="70"
                className="pl-10"
                min="30"
                max="300"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Em quilos</p>
          </CardContent>
        </Card>

        {bmi && bmiInfo && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Seu IMC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-purple-600">{bmi}</div>
                <div className="flex items-center justify-center gap-2">
                  <Badge className={bmiInfo.color}>
                    {bmiInfo.category}
                  </Badge>
                  <bmiInfo.icon className={`w-4 h-4 ${
                    bmiInfo.healthLevel === 'excelente' ? 'text-green-600' :
                    bmiInfo.healthLevel === 'moderado' ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {bmiInfo.message}
                </p>
                {bmiInfo.healthLevel === 'excelente' && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      🎉 Continue mantendo seus hábitos saudáveis!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Nível de Atividade</h2>
        <p className="text-gray-600">Como é sua rotina diária de atividades?</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[
              {
                value: 'sedentario',
                title: 'Sedentário',
                description: 'Pouco ou nenhum exercício, trabalho de escritório',
                icon: '🪑'
              },
              {
                value: 'leve',
                title: 'Levemente Ativo',
                description: 'Exercício leve 1-3 dias por semana',
                icon: '🚶‍♀️'
              },
              {
                value: 'moderado',
                title: 'Moderadamente Ativo',
                description: 'Exercício moderado 3-5 dias por semana',
                icon: '🏃‍♀️'
              },
              {
                value: 'ativo',
                title: 'Muito Ativo',
                description: 'Exercício intenso 6-7 dias por semana',
                icon: '💪'
              },
              {
                value: 'extremamente_ativo',
                title: 'Extremamente Ativo',
                description: 'Exercício muito intenso, trabalho físico',
                icon: '🏋️‍♀️'
              }
            ].map((option) => (
              <div
                key={option.value}
                onClick={() => onUpdateData({ nivel_atividade_diaria: option.value })}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  data.nivel_atividade_diaria === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {data.nivel_atividade_diaria === option.value && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (currentStep) {
    case 1:
      return renderStep1();
    case 2:
      return renderStep2();
    case 3:
      return renderStep3();
    default:
      return renderStep1();
  }
};

export default PersonalInfoModule;
