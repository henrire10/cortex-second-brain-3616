
import React from 'react';
import { QuestionnaireData } from '@/pages/ProfileSetup';

interface ObjectivesModuleProps {
  data: QuestionnaireData;
  onUpdateData: (data: Partial<QuestionnaireData>) => void;
  currentStep: number;
}

export const ObjectivesModule: React.FC<ObjectivesModuleProps> = ({
  data,
  onUpdateData,
  currentStep
}) => {
  if (currentStep === 1) {
    const goals = [
      {
        value: 'Perder peso',
        title: 'Perder Peso',
        desc: 'Eliminar gordura corporal e melhorar definição',
        detail: 'Foco em exercícios cardiovasculares e dieta hipocalórica',
        icon: '🔥',
        bg: 'from-red-100 to-orange-100'
      },
      {
        value: 'Ganhar massa muscular',
        title: 'Ganhar Massa Muscular',
        desc: 'Aumentar músculos e melhorar força',
        detail: 'Foco em hipertrofia e dieta hipercalórica',
        icon: '💪',
        bg: 'from-blue-100 to-cyan-100'
      },
      {
        value: 'Melhorar condicionamento',
        title: 'Melhorar Condicionamento',
        desc: 'Aumentar resistência e capacidade física',
        detail: 'Foco em exercícios aeróbicos e funcionais',
        icon: '🏃‍♂️',
        bg: 'from-green-100 to-emerald-100'
      },
      {
        value: 'Tonificar corpo',
        title: 'Tonificar o Corpo',
        desc: 'Definir músculos sem ganho excessivo de massa',
        detail: 'Equilíbrio entre cardio e musculação',
        icon: '✨',
        bg: 'from-purple-100 to-pink-100'
      },
      {
        value: 'Reabilitacao',
        title: 'Reabilitação',
        desc: 'Recuperar de lesões ou melhorar mobilidade',
        detail: 'Exercícios terapêuticos e funcionais',
        icon: '🏥',
        bg: 'from-gray-100 to-slate-100'
      },
      {
        value: 'Manter forma fisica',
        title: 'Manter Forma Física',
        desc: 'Preservar condição física atual',
        detail: 'Exercícios de manutenção e prevenção',
        icon: '⚖️',
        bg: 'from-yellow-100 to-amber-100'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Qual é o seu principal objetivo?
          </h2>
          <p className="text-gray-600">Escolha sua meta principal para criar o plano ideal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <button
              key={goal.value}
              onClick={() => onUpdateData({ meta_principal_usuario: goal.value })}
              className={`p-6 text-left border-2 rounded-2xl transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                data.meta_principal_usuario === goal.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${goal.bg} flex items-center justify-center`}>
                  <span className="text-2xl">{goal.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{goal.title}</div>
                  <div className="text-gray-600 text-sm mt-1">{goal.desc}</div>
                  <div className="text-xs text-gray-500 mt-1 italic">{goal.detail}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">📝</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Conte-nos mais sobre seu objetivo
          </h2>
          <p className="text-gray-600">Detalhe sua meta para um plano mais personalizado</p>
        </div>

        <div className="space-y-6">
          <div className="bg-purple-50 p-6 rounded-2xl border-l-4 border-purple-400">
            <h3 className="font-semibold text-purple-800 mb-2">
              Objetivo escolhido: {data.meta_principal_usuario}
            </h3>
            <p className="text-purple-700 text-sm">
              Agora nos diga mais especificamente o que você quer alcançar
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-700">
              📋 Descreva seu objetivo específico:
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Exemplo: "Quero perder 10kg em 6 meses", "Ganhar 5kg de massa muscular", 
              "Conseguir correr 5km sem parar", etc.
            </p>
            <textarea
              value={data.meta_especifica_texto || ''}
              onChange={(e) => onUpdateData({ meta_especifica_texto: e.target.value })}
              placeholder="Digite aqui seu objetivo específico..."
              className="w-full p-4 border border-gray-300 rounded-xl h-32 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              required
            />
            <div className="text-right">
              <span className={`text-xs ${(data.meta_especifica_texto?.length || 0) >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                {data.meta_especifica_texto?.length || 0}/10 mínimo
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800">
              <strong>💡 Dica:</strong> Objetivos específicos e mensuráveis nos ajudam a criar um plano mais eficaz!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    const commitmentLevels = [
      {
        value: 'baixo',
        title: 'Casual',
        desc: 'Quando tenho tempo e vontade',
        detail: 'Flexibilidade máxima, sem pressão',
        icon: '😌',
        color: 'blue'
      },
      {
        value: 'moderado',
        title: 'Comprometido',
        desc: 'Sério sobre os resultados',
        detail: 'Consistência na maioria dos dias',
        icon: '💪',
        color: 'green'
      },
      {
        value: 'alto',
        title: 'Dedicado Total',
        desc: 'Foco máximo nos objetivos',
        detail: 'Disciplina e consistência diária',
        icon: '🔥',
        color: 'red'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">⚡</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Qual é o seu nível de comprometimento?
          </h2>
          <p className="text-gray-600">Isso nos ajuda a calibrar a intensidade do seu plano</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {commitmentLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => onUpdateData({ nivel_comprometimento_objetivo: level.value })}
              className={`p-6 text-left border-2 rounded-2xl transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                data.nivel_comprometimento_objetivo === level.value
                  ? `border-${level.color}-500 bg-${level.color}-50 text-${level.color}-700 shadow-lg`
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="text-4xl">{level.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-xl">{level.title}</div>
                  <div className="text-gray-600 mt-1">{level.desc}</div>
                  <div className="text-sm text-gray-500 mt-1 italic">{level.detail}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-400">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Importante:</strong> Seja honesto sobre seu comprometimento. 
            Um plano realista que você segue é melhor que um plano perfeito que você abandona!
          </p>
        </div>
      </div>
    );
  }

  return null;
};
