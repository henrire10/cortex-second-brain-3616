
import React from 'react';
import { QuestionnaireData } from '@/pages/ProfileSetup';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface WorkoutModuleProps {
  data: QuestionnaireData;
  onUpdateData: (data: Partial<QuestionnaireData>) => void;
  currentStep: number;
}

export const WorkoutModule: React.FC<WorkoutModuleProps> = ({
  data,
  onUpdateData,
  currentStep
}) => {
  const handleEquipmentToggle = (equipment: string) => {
    const current = data.disponibilidade_equipamentos || [];
    const updated = current.includes(equipment)
      ? current.filter(item => item !== equipment)
      : [...current, equipment];
    onUpdateData({ disponibilidade_equipamentos: updated });
  };

  if (currentStep === 1) {
    const experienceLevels = [
      {
        value: 'experiencia_iniciante',
        title: 'Iniciante',
        desc: 'Nunca treinei ou faz muito tempo que parei',
        detail: 'Preciso aprender os básicos',
        icon: '🌱',
        bg: 'from-green-100 to-emerald-100'
      },
      {
        value: 'experiencia_intermediario',
        title: 'Intermediário',
        desc: 'Já treino há algum tempo',
        detail: 'Conheço os principais exercícios, busco evoluir',
        icon: '🌿',
        bg: 'from-blue-100 to-cyan-100'
      },
      {
        value: 'experiencia_avancado',
        title: 'Avançado',
        desc: 'Treino consistentemente há anos',
        detail: 'Domino técnicas e busco otimização máxima',
        icon: '🌳',
        bg: 'from-purple-100 to-indigo-100'
      }
    ];

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-3xl md:text-4xl">🏋️</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 px-4">
            E na academia, qual o seu nível de experiência?
          </h2>
          <p className="text-gray-600 px-4">Vamos calibrar seus treinos</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 px-4 md:px-0">
          {experienceLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => onUpdateData({ nivel_experiencia_treino: level.value })}
              className={`p-4 md:p-8 text-left border-2 rounded-2xl transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                data.nivel_experiencia_treino === level.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${level.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl md:text-2xl">{level.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg md:text-xl">{level.title}</div>
                  <div className="text-gray-600 mt-1 text-sm md:text-base">{level.desc}</div>
                  <div className="text-xs md:text-sm text-gray-500 mt-1 italic">{level.detail}</div>
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
      <div className="space-y-6 md:space-y-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-3xl md:text-4xl">📅</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 px-4">
            Pensando na sua rotina ideal
          </h2>
          <p className="text-gray-600 px-4">Como seria seu treino perfeito?</p>
        </div>

        <div className="space-y-6 md:space-y-8 px-4 md:px-0">
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-700">
              📊 Quantos dias por semana você REALMENTE pode/quer treinar?
            </label>
            <div className="px-2 md:px-4">
              <Slider
                value={[data.dias_por_semana_treino]}
                onValueChange={([value]) => onUpdateData({ dias_por_semana_treino: value })}
                max={7}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>1 dia</span>
                <span className="font-semibold text-purple-600">
                  {data.dias_por_semana_treino} {data.dias_por_semana_treino === 1 ? 'dia' : 'dias'}
                </span>
                <span>7 dias</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-700">
              ⏰ Quanto tempo para cada sessão de treino?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: 30, label: '30 min', icon: '⚡' },
                { value: 45, label: '45 min', icon: '🏃' },
                { value: 60, label: '60 min', icon: '⏰' },
                { value: 75, label: '75 min', icon: '🕐' },
                { value: 90, label: '90 min', icon: '⏳' },
                { value: 120, label: '90+ min', icon: '⏰' }
              ].map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => onUpdateData({ duracao_sessao_treino_minutos: duration.value })}
                  className={`p-3 md:p-4 border-2 rounded-xl transition-all ${
                    data.duracao_sessao_treino_minutos === duration.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-xl md:text-2xl mb-1">{duration.icon}</div>
                  <div className="font-semibold text-sm md:text-base">{duration.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    const equipmentOptions = [
      {
        value: 'equip_basico',
        title: 'Equipamentos Básicos',
        desc: 'Halteres, barras, anilhas, bancos',
        icon: '🏋️‍♂️'
      },
      {
        value: 'equip_maquinas_articuladas',
        title: 'Máquinas Articuladas',
        desc: 'Para todos os grupos musculares',
        icon: '🤖'
      },
      {
        value: 'equip_cardio_variado',
        title: 'Equipamentos de Cardio',
        desc: 'Esteiras, elípticos, bicicletas',
        icon: '🏃‍♀️'
      },
      {
        value: 'equip_peso_livre_completo',
        title: 'Área Completa de Peso Livre',
        desc: 'Gaiolas de agachamento, plataformas',
        icon: '🏗️'
      },
      {
        value: 'equip_funcional',
        title: 'Acessórios Funcionais',
        desc: 'Kettlebells, TRX, bolas, elásticos',
        icon: '🎯'
      },
      {
        value: 'sem_acesso_academia',
        title: 'Sem Academia',
        desc: 'Foco em peso corporal/casa',
        icon: '🏠'
      }
    ];

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-3xl md:text-4xl">🏋️</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 px-4">
            Sua academia é bem equipada?
          </h2>
          <p className="text-gray-600 px-4">Selecione todos os equipamentos disponíveis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 px-4 md:px-0">
          {equipmentOptions.map((equipment) => (
            <div
              key={equipment.value}
              className={`p-4 md:p-6 border-2 rounded-2xl transition-all cursor-pointer hover:shadow-lg ${
                data.disponibilidade_equipamentos?.includes(equipment.value)
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
              onClick={() => handleEquipmentToggle(equipment.value)}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <Checkbox
                  checked={data.disponibilidade_equipamentos?.includes(equipment.value) || false}
                />
                <span className="text-2xl md:text-3xl flex-shrink-0">{equipment.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base md:text-lg">{equipment.title}</div>
                  <div className="text-gray-600 text-sm md:text-base">{equipment.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-3xl md:text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 px-4">
            Preferências e Limitações
          </h2>
          <p className="text-gray-600 px-4">Para treinos seguros e adequados</p>
        </div>

        <div className="space-y-4 md:space-y-6 px-4 md:px-0">
          <div className="space-y-3">
            <label className="block text-base md:text-lg font-semibold text-gray-700">
              ❤️ Exercícios que você AMA e gostaria de incluir:
            </label>
            <textarea
              value={data.preferencias_exercicios || ''}
              onChange={(e) => onUpdateData({ preferencias_exercicios: e.target.value })}
              placeholder="Ex: agachamento, supino, deadlift, corrida..."
              className="w-full p-3 md:p-4 border border-gray-300 rounded-xl h-20 md:h-24 resize-none text-sm md:text-base"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-base md:text-lg font-semibold text-gray-700">
              💔 Exercícios que prefere evitar (se possível):
            </label>
            <textarea
              value={data.restricoes_exercicios || ''}
              onChange={(e) => onUpdateData({ restricoes_exercicios: e.target.value })}
              placeholder="Ex: burpees, mountain climbers..."
              className="w-full p-3 md:p-4 border border-gray-300 rounded-xl h-20 md:h-24 resize-none text-sm md:text-base"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-base md:text-lg font-semibold text-gray-700">
              🏥 Lesões, dores ou limitações importantes:
            </label>
            <textarea
              value={data.condicoes_medicas_limitantes || ''}
              onChange={(e) => onUpdateData({ condicoes_medicas_limitantes: e.target.value })}
              placeholder="Ex: dor no joelho ao agachar, ombro recém-operado..."
              className="w-full p-3 md:p-4 border border-gray-300 rounded-xl h-20 md:h-24 resize-none text-sm md:text-base"
            />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 md:p-6 rounded-xl border-l-4 border-yellow-400 mx-4 md:mx-0">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Importante:</strong> Sempre consulte um médico antes de iniciar qualquer programa de exercícios, especialmente se você tem problemas de saúde.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
