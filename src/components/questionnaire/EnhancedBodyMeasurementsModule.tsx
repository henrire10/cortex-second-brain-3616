import React, { useState, useEffect } from 'react';
import { Ruler, Info, Activity, Calculator, Target, Check } from 'lucide-react';
import { RealisticBodySilhouette } from './RealisticBodySilhouette';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface EnhancedBodyMeasurements {
  // Medidas básicas
  peso: number;
  altura: number;
  
  // Medidas circunferenciais
  medidas_peito: number;
  medidas_barriga: number;
  medidas_quadril: number;
  medidas_pescoco: number;
  
  // Membros superiores
  medidas_biceps_direito: number;
  medidas_biceps_esquerdo: number;
  medidas_antebraco_direito: number;
  medidas_antebraco_esquerdo: number;
  
  // Membros inferiores
  medidas_coxa_direita: number;
  medidas_coxa_esquerda: number;
  medidas_panturrilha_direita: number;
  medidas_panturrilha_esquerda: number;
}

interface EnhancedBodyMeasurementsModuleProps {
  onSaveMeasurements: (measurements: EnhancedBodyMeasurements & { bodyFat?: number }) => void;
  initialData?: Partial<EnhancedBodyMeasurements>;
  userGender?: 'masculino' | 'feminino';
}

export const EnhancedBodyMeasurementsModule: React.FC<EnhancedBodyMeasurementsModuleProps> = ({
  onSaveMeasurements,
  initialData = {},
  userGender = 'masculino'
}) => {
  const { addPoints, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(2);
  const [measurements, setMeasurements] = useState<EnhancedBodyMeasurements>({
    peso: initialData.peso || profile?.weight || 0,
    altura: initialData.altura || profile?.height || 0,
    medidas_peito: initialData.medidas_peito || 0,
    medidas_barriga: initialData.medidas_barriga || 0,
    medidas_quadril: initialData.medidas_quadril || 0,
    medidas_pescoco: initialData.medidas_pescoco || 0,
    medidas_biceps_direito: initialData.medidas_biceps_direito || 0,
    medidas_biceps_esquerdo: initialData.medidas_biceps_esquerdo || 0,
    medidas_antebraco_direito: initialData.medidas_antebraco_direito || 0,
    medidas_antebraco_esquerdo: initialData.medidas_antebraco_esquerdo || 0,
    medidas_coxa_direita: initialData.medidas_coxa_direita || 0,
    medidas_coxa_esquerda: initialData.medidas_coxa_esquerda || 0,
    medidas_panturrilha_direita: initialData.medidas_panturrilha_direita || 0,
    medidas_panturrilha_esquerda: initialData.medidas_panturrilha_esquerda || 0
  });

  // Pre-fill data from profile if available
  useEffect(() => {
    if (profile && !initialData.peso && !initialData.altura && measurements.peso === 0 && measurements.altura === 0) {
      setMeasurements(prev => ({
        ...prev,
        peso: profile.weight || prev.peso,
        altura: profile.height || prev.altura
      }));
    }
  }, [profile?.weight, profile?.height, initialData.peso, initialData.altura]);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleMeasurementChange = (field: keyof EnhancedBodyMeasurements, value: string) => {
    const numValue = parseFloat(value) || 0;
    console.log(`🔍 AUDITORIA - Alterando ${field}: "${value}" → ${numValue} (tipo: ${typeof numValue})`);
    
    if (field === 'medidas_pescoco') {
      console.log("🚨 AUDITORIA - PESCOÇO ALTERADO!");
      console.log("🔍 AUDITORIA - Valor original:", value);
      console.log("🔍 AUDITORIA - Valor convertido:", numValue);
      console.log("🔍 AUDITORIA - É zero?", numValue === 0);
      console.log("🔍 AUDITORIA - É maior que zero?", numValue > 0);
    }
    
    setMeasurements(prev => {
      const newMeasurements = { ...prev, [field]: numValue };
      if (field === 'medidas_pescoco') {
        console.log("🔍 AUDITORIA - Estado após alteração do pescoço:", newMeasurements.medidas_pescoco);
      }
      return newMeasurements;
    });
  };

  const handleFieldFocus = (field: string) => {
    setFocusedField(field);
    const el = document.getElementById(field) as HTMLInputElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      requestAnimationFrame(() => {
        try {
          (el as any).focus({ preventScroll: true });
        } catch {
          el.focus();
        }
        if (typeof (el as any).select === 'function') {
          (el as any).select();
        }
      });
    }
    setTimeout(() => setFocusedField(null), 3000);
  };

  // Cálculo de gordura corporal usando fórmula da Marinha Americana
  const calculateBodyFat = () => {
    const { altura, medidas_barriga, medidas_pescoco, medidas_quadril } = measurements;
    
    console.log("🧮 AUDITORIA - Cálculo de gordura corporal no componente:");
    console.log("🔍 AUDITORIA - Altura:", altura);
    console.log("🔍 AUDITORIA - Barriga:", medidas_barriga);
    console.log("🔍 AUDITORIA - Pescoço:", medidas_pescoco);
    console.log("🔍 AUDITORIA - Quadril:", medidas_quadril);
    
    if (!altura || !medidas_barriga || !medidas_pescoco) {
      console.log("❌ AUDITORIA - Dados insuficientes para cálculo interno");
      return 0;
    }
    
    if (userGender === 'masculino') {
      const bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(medidas_barriga - medidas_pescoco) + 0.15456 * Math.log10(altura)) - 450;
      console.log("🧮 AUDITORIA - Resultado do cálculo masculino:", bodyFat);
      return Math.max(0, Math.min(50, bodyFat));
    } else {
      if (!medidas_quadril) {
        console.log("❌ AUDITORIA - Quadril necessário para mulheres");
        return 0;
      }
      const bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(medidas_barriga + medidas_quadril - medidas_pescoco) + 0.22100 * Math.log10(altura)) - 450;
      console.log("🧮 AUDITORIA - Resultado do cálculo feminino:", bodyFat);
      return Math.max(0, Math.min(50, bodyFat));
    }
  };

  const bodyFat = calculateBodyFat();

  const handleSubmit = () => {
    console.log("📤 AUDITORIA - Enviando dados do questionário:");
    console.log("🔍 AUDITORIA - Estado completo das medições:", measurements);
    console.log("🚨 AUDITORIA - Valor específico do pescoço antes do envio:", measurements.medidas_pescoco);
    console.log("🔍 AUDITORIA - Tipo do pescoço:", typeof measurements.medidas_pescoco);
    
    const measurementData = {
      ...measurements,
      bodyFat: bodyFat > 0 ? bodyFat : undefined
    };
    
    console.log("📦 AUDITORIA - Dados finais sendo enviados:", measurementData);
    console.log("🚨 AUDITORIA - Pescoço nos dados finais:", measurementData.medidas_pescoco);
    
    onSaveMeasurements(measurementData);
    addPoints(25);
    
    toast({
      title: "Medidas Registradas! 📏",
      description: `Você ganhou 25 pontos! Continue acompanhando sua evolução!`,
    });
  };

  const renderInput = (
    id: keyof EnhancedBodyMeasurements,
    label: string,
    placeholder: string,
    value: number,
    unit: string = 'cm'
  ) => (
    <div className="relative">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.1"
          min="0"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => handleMeasurementChange(id, e.target.value)}
          className={`mt-1 pr-12 transition-all duration-200 ${
            focusedField === id 
              ? 'border-purple-400 ring-2 ring-purple-400 ring-opacity-50 shadow-lg' 
              : 'border-purple-200 focus:border-purple-400 focus:ring-purple-400'
          }`}
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">{unit}</span>
      </div>
      {value > 0 && (
        <div className="absolute right-12 top-8 text-green-500 animate-fade-in">
          ✓
        </div>
      )}
    </div>
  );

  const steps = [
    {
      id: 2,
      title: 'Mapa Antropométrico',
      description: 'Medidas circunferenciais detalhadas',
      icon: <Ruler className="w-5 h-5" />
    },
    {
      id: 3,
      title: 'Análise Final',
      description: 'Revisão e cálculos automáticos',
      icon: <Calculator className="w-5 h-5" />
    }
  ];

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-2 md:p-4 overflow-visible overscroll-contain scrollbar-hide">
      <div className="h-full min-h-0 max-w-6xl mx-auto overflow-visible">
        {/* Header com progresso */}
        <div className="text-center mb-4 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl mb-4 md:mb-6">
            <Ruler className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-4">
            Análise Corporal Completa 📏
          </h1>
          <p className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto px-4">
            Registre suas medidas corporais com precisão e acompanhe sua evolução
          </p>

          {/* Barra de progresso por steps - Mobile Optimized */}
          <div className="flex justify-center mt-6 md:mt-8 mb-4 md:mb-8">
            <div className="flex md:hidden flex-col space-y-2 w-full max-w-xs">
              {/* Mobile: Vertical Progress */}
              {steps.map((step, index) => (
                <div key={step.id} className={`flex items-center space-x-3 p-2 rounded-lg ${
                  currentStep >= step.id ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.id 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    {step.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-purple-700' : 'text-gray-500'
                    }`}>{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop: Horizontal Progress */}
            <div className="hidden md:flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${
                    currentStep >= step.id ? 'text-purple-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= step.id 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs opacity-75">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-purple-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo principal baseado no step */}
        <Card className="backdrop-blur-sm bg-white/80 shadow-2xl border-0 overflow-hidden scrollbar-hide">
          <CardContent className="p-4 md:p-8 overflow-visible scrollbar-hide">
            {currentStep === 2 && (
              <div className="space-y-4 md:space-y-8">
                <div className="text-center mb-4 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Mapa Antropométrico</h2>
                  <p className="text-gray-600 text-sm md:text-base px-4">
                    {isMobile ? 'Toque nos pontos da figura para focar no campo correspondente' : 'Clique nos pontos da figura para focar no campo correspondente'}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 md:p-4 shadow-sm mb-4 md:mb-8">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-semibold text-blue-800 mb-1 text-sm md:text-base">Como usar o mapa:</h4>
                      <ul className="text-blue-700 text-xs md:text-sm space-y-1">
                        <li className="hidden md:block">• Clique nos pontos da figura anatômica</li>
                        <li className="hidden md:block">• O campo correspondente será destacado automaticamente</li>
                        <li>• Use fita métrica flexível em centímetros</li>
                        <li>• Medidas opcionais - pode pular se não tiver equipamento</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                  {/* Figura anatômica */}
                  <div className="flex justify-center items-start">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-200/50">
                      <RealisticBodySilhouette
                        focusedField={focusedField}
                        onFieldFocus={handleFieldFocus}
                      />
                      <div className="text-center mt-4">
                        <p className="text-sm text-gray-500 italic">
                          Figura anatômica para localização das medidas
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Campos de entrada */}
                  <div className="space-y-4 md:space-y-6 lg:col-span-1">
                    {/* Tronco */}
                    <Card className="overflow-hidden border-purple-100 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2 md:pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
                        <CardTitle className="text-base md:text-lg text-purple-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Tronco
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                        {renderInput('medidas_peito', 'Peito', 'Ex: 95.5', measurements.medidas_peito)}
                        {renderInput('medidas_barriga', 'Barriga - Umbigo', 'Ex: 80.0', measurements.medidas_barriga)}
                        {renderInput('medidas_quadril', 'Quadril', 'Ex: 90.0', measurements.medidas_quadril)}
                        {renderInput('medidas_pescoco', 'Pescoço', 'Ex: 35.0', measurements.medidas_pescoco)}
                      </CardContent>
                    </Card>

                    {/* Braços */}
                    <Card className="overflow-hidden border-purple-100 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2 md:pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
                        <CardTitle className="text-base md:text-lg text-purple-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Braços
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          {renderInput('medidas_biceps_direito', 'Bíceps Direito', 'Ex: 30.0', measurements.medidas_biceps_direito)}
                          {renderInput('medidas_biceps_esquerdo', 'Bíceps Esquerdo', 'Ex: 30.0', measurements.medidas_biceps_esquerdo)}
                          {renderInput('medidas_antebraco_direito', 'Antebraço Direito', 'Ex: 25.0', measurements.medidas_antebraco_direito)}
                          {renderInput('medidas_antebraco_esquerdo', 'Antebraço Esquerdo', 'Ex: 25.0', measurements.medidas_antebraco_esquerdo)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pernas */}
                    <Card className="overflow-hidden border-purple-100 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2 md:pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
                        <CardTitle className="text-base md:text-lg text-purple-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Pernas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          {renderInput('medidas_coxa_direita', 'Coxa Direita', 'Ex: 55.0', measurements.medidas_coxa_direita)}
                          {renderInput('medidas_coxa_esquerda', 'Coxa Esquerda', 'Ex: 55.0', measurements.medidas_coxa_esquerda)}
                          {renderInput('medidas_panturrilha_direita', 'Panturrilha Direita', 'Ex: 35.0', measurements.medidas_panturrilha_direita)}
                          {renderInput('medidas_panturrilha_esquerda', 'Panturrilha Esquerda', 'Ex: 35.0', measurements.medidas_panturrilha_esquerda)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-center mt-6 md:mt-8">
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 md:px-6 py-3 order-1 sm:order-2"
                  >
                    Revisar e Finalizar
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 md:space-y-8">
                <div className="text-center mb-4 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Análise Final</h2>
                  <p className="text-gray-600 text-sm md:text-base px-4">Revise suas medidas e veja os cálculos automáticos</p>
                </div>

                {/* Resumo das medidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Dados básicos */}
                  <Card className="border-purple-100">
                    <CardHeader className="pb-2 md:pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle className="text-base md:text-lg text-purple-700">Dados Básicos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base">Peso:</span>
                        <Badge variant="secondary">{measurements.peso}kg</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base">Altura:</span>
                        <Badge variant="secondary">{measurements.altura}cm</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cálculo automático de gordura corporal */}
                  {bodyFat > 0 && (
                    <Card className="border-orange-100">
                      <CardHeader className="pb-2 md:pb-3 bg-gradient-to-r from-orange-50 to-red-50">
                        <CardTitle className="text-base md:text-lg text-orange-700 flex items-center gap-2">
                          <Calculator className="w-4 h-4 md:w-5 md:h-5" />
                          Análise Automática
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm md:text-base">% Gordura Corporal:</span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {bodyFat.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Calculado pela fórmula da Marinha Americana
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Resumo das medidas registradas */}
                  <Card className="border-green-100">
                    <CardHeader className="pb-2 md:pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardTitle className="text-base md:text-lg text-green-700">Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base">Medidas registradas:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {Object.values(measurements).filter(v => v > 0).length}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ✅ Dados prontos para análise
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-6 mb-4 md:mb-8">
                    <Activity className="w-10 h-10 md:w-12 md:h-12 text-green-600 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-bold text-green-800 mb-2">Tudo Pronto!</h3>
                    <p className="text-green-700 text-sm md:text-base">
                      Suas medidas serão salvas e você ganhará 25 pontos pela dedicação.
                      Continue acompanhando sua evolução!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 md:px-6 py-3 order-2 sm:order-1"
                    >
                      Voltar para Editar
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 md:px-8 py-3 order-1 sm:order-2"
                    >
                      Salvar Medidas Completas
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
