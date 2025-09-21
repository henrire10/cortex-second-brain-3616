
import React from 'react';
import { QuestionnaireData } from '@/pages/ProfileSetup';
import { Slider } from '@/components/ui/slider';

interface LifestyleModuleProps {
  data: QuestionnaireData;
  onUpdateData: (data: Partial<QuestionnaireData>) => void;
  currentStep: number;
}

export const LifestyleModule: React.FC<LifestyleModuleProps> = ({
  data,
  onUpdateData,
  currentStep
}) => {
  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">😴</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Como anda seu sono?
          </h2>
          <p className="text-gray-600">O sono é fundamental para seus resultados</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-700">
              😴 Quantas horas você dorme por noite (em média)?
            </label>
            <div className="px-4">
              <Slider
                value={[data.media_horas_sono]}
                onValueChange={([value]) => onUpdateData({ media_horas_sono: value })}
                max={12}
                min={4}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>4h</span>
                <span className="font-semibold text-purple-600">
                  {data.media_horas_sono}h por noite
                </span>
                <span>12h</span>
              </div>
            </div>
            <div className="text-center">
              <span className={`text-sm px-3 py-1 rounded-full ${
                data.media_horas_sono >= 7 && data.media_horas_sono <= 9 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {data.media_horas_sono >= 7 && data.media_horas_sono <= 9 
                  ? '✅ Ideal para recuperação' 
                  : '⚠️ Considere melhorar seu sono'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-700">
              🌙 Como você avalia a qualidade do seu sono?
            </label>
            <div className="px-4">
              <Slider
                value={[data.qualidade_sono_percebida]}
                onValueChange={([value]) => onUpdateData({ qualidade_sono_percebida: value })}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>😫 Péssimo</span>
                <span className="font-semibold text-purple-600">
                  {['', '😫 Péssimo', '😴 Ruim', '😐 Regular', '😊 Bom', '😴 Excelente'][data.qualidade_sono_percebida]}
                </span>
                <span>😴 Excelente</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Por que o sono é importante?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Recuperação muscular e crescimento</li>
              <li>• Regulação hormonal (testosterona, cortisol)</li>
              <li>• Melhora do desempenho nos treinos</li>
              <li>• Controle do apetite e peso</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">😰</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Nível de estresse no dia a dia
          </h2>
          <p className="text-gray-600">O estresse afeta diretamente seus resultados</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-700">
              😰 Como você classifica seu nível de estresse atual?
            </label>
            <div className="px-4">
              <Slider
                value={[data.nivel_estresse_percebido]}
                onValueChange={([value]) => onUpdateData({ nivel_estresse_percebido: value })}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>😌 Muito baixo</span>
                <span className="font-semibold text-purple-600">
                  {['', '😌 Muito baixo', '😐 Baixo', '😟 Moderado', '😰 Alto', '😵 Muito alto'][data.nivel_estresse_percebido]}
                </span>
                <span>😵 Muito alto</span>
              </div>
            </div>
            
            {data.nivel_estresse_percebido >= 4 && (
              <div className="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-400">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Atenção:</strong> Níveis altos de estresse podem afetar seus resultados. 
                  Incluiremos exercícios que ajudam a reduzir o estresse no seu plano.
                </p>
              </div>
            )}
          </div>

          <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-400">
            <h3 className="font-semibold text-green-800 mb-2">🧘‍♂️ Como o exercício ajuda com o estresse:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Libera endorfinas (hormônios do bem-estar)</li>
              <li>• Reduz cortisol (hormônio do estresse)</li>
              <li>• Melhora a qualidade do sono</li>
              <li>• Aumenta a autoestima e confiança</li>
              <li>• Proporciona momento de desconexão</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }


  return null;
};
