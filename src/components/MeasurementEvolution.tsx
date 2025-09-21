import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Scale, Ruler, Percent, Heart, Download, Trash2, Info, Zap, Target } from 'lucide-react';
import { MeasurementGoalsPanel } from './MeasurementGoalsPanel';
import { ConfirmDialog } from './ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  calculateBMI, 
  calculateWHtR, 
  calculateWHR, 
  calculateFatMass, 
  calculateLeanMass,
  classifyBMI,
  classifyWHtR,
  classifyBodyFat,
  generateInsights
} from '@/utils/bodyComposition';
import { 
  calculateBodyFat, 
  canCalculateBodyFat 
} from '@/utils/bodyFatCalculator';

interface MeasurementEvolutionProps {
  measurements: any[];
  loading: boolean;
  userProfile?: any;
}

export const MeasurementEvolution: React.FC<MeasurementEvolutionProps> = ({ measurements, loading, userProfile }) => {
  const { user } = useAuth();
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedMetrics, setSelectedMetrics] = useState(['weight', 'bodyFat', 'waist']);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; measurementId?: string }>({ isOpen: false });

  // Function to get body fat for a measurement (stored or calculated)
  const getBodyFatForMeasurement = (measurement: any): { value: number | null; isEstimated: boolean } => {
    console.log('🔍 DEBUG: Calculando gordura corporal para medição:', measurement.id);
    
    // If body fat is already stored, use it
    if (measurement.body_fat) {
      console.log('✅ Gordura corporal já armazenada:', measurement.body_fat);
      return { value: measurement.body_fat, isEstimated: false };
    }

    console.log('📊 Tentando calcular gordura corporal automaticamente...');
    
    // Try to calculate if we have enough data
    const gender = userProfile?.gender || 'masculino';
    const height = measurement.height || userProfile?.height || 170;
    
    console.log('📋 Dados disponíveis para cálculo:');
    console.log('- Gênero:', gender);
    console.log('- Altura:', height, 'cm');
    console.log('- Peso:', measurement.weight, 'kg');
    console.log('- Pescoço:', measurement.neck, 'cm');
    console.log('- Cintura (navel):', measurement.waist_navel, 'cm');
    console.log('- Quadril:', measurement.hips, 'cm');

    const bodyFatMeasurements = {
      gender: gender,
      height: height,
      weight: measurement.weight || 0,
      neck: measurement.neck || userProfile?.profile_data?.medidas_pescoco, // ✅ FALLBACK: use questionnaire neck data if available
      waist: measurement.waist_navel,
      hips: measurement.hips,
      abdomen: measurement.waist_navel // Use waist as abdomen for US Navy formula
    };

    console.log('🧮 Verificando se pode calcular com dados:', bodyFatMeasurements);
    
    const canCalculate = canCalculateBodyFat(bodyFatMeasurements);
    console.log('❓ Pode calcular gordura corporal?', canCalculate);

    if (canCalculate) {
      console.log('🎯 Executando cálculo da gordura corporal...');
      const calculated = calculateBodyFat(bodyFatMeasurements);
      console.log('📈 Resultado do cálculo:', calculated);
      
      if (calculated !== null) {
        console.log('✅ Gordura corporal calculada com sucesso:', calculated.toFixed(1), '%');
        return { value: calculated, isEstimated: true };
      } else {
        console.log('❌ Cálculo retornou null');
      }
    } else {
      console.log('❌ Dados insuficientes para cálculo');
      
      // Debug: check what's missing
      if (gender === 'feminino') {
        console.log('👩 Fórmula feminina requer: pescoço, cintura e quadril');
        console.log('- Pescoço presente:', !!measurement.neck);
        console.log('- Cintura presente:', !!measurement.waist_navel);
        console.log('- Quadril presente:', !!measurement.hips);
      } else {
        console.log('👨 Fórmula masculina requer: pescoço e cintura');
        console.log('- Pescoço presente:', !!measurement.neck);
        console.log('- Cintura presente:', !!measurement.waist_navel);
      }
    }

    console.log('🚫 Não foi possível calcular gordura corporal');
    return { value: null, isEstimated: false };
  };

  const availableMetrics = [
    { key: 'weight', label: 'Peso', unit: 'kg', color: 'hsl(var(--primary))' },
    { key: 'bodyFat', label: 'Gordura %', unit: '%', color: 'hsl(var(--destructive))', isPercentage: true },
    { key: 'waist', label: 'Cintura', unit: 'cm', color: 'hsl(var(--warning))' },
    { key: 'chest', label: 'Peito', unit: 'cm', color: 'hsl(var(--success))' },
    { key: 'rightArm', label: 'Bíceps D', unit: 'cm', color: 'hsl(var(--chart-1))' },
    { key: 'rightThigh', label: 'Coxa D', unit: 'cm', color: 'hsl(var(--chart-2))' }
  ];

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
              <CardContent className="p-3">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <MeasurementGoalsPanel measurements={measurements} />
        <Card className="border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft">
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 w-16 h-16 mx-auto flex items-center justify-center">
                <Scale className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Nenhuma medição encontrada</h3>
                <p className="text-muted-foreground">Registre sua primeira medição na aba "Registrar" para começar a acompanhar sua evolução.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter measurements by period
  const getFilteredMeasurements = () => {
    if (periodFilter === 'all') return measurements;
    
    const days = periodFilter === '30' ? 30 : periodFilter === '60' ? 60 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return measurements.filter(m => new Date(m.date) >= cutoffDate);
  };

  const filteredMeasurements = getFilteredMeasurements();

  // Prepare chart data with automatic body fat calculation
  const chartData = filteredMeasurements
    .slice(0, 20)
    .reverse()
    .map((measurement) => {
      const bodyFatData = getBodyFatForMeasurement(measurement);
      
      return {
        date: new Date(measurement.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        weight: measurement.weight,
        bodyFat: bodyFatData.value,
        waist: measurement.waist_navel,
        chest: measurement.chest,
        rightArm: measurement.right_arm_flexed,
        rightThigh: measurement.right_thigh_proximal,
      };
    });

  // Calculate stats
  const latest = measurements[0];
  const previous = measurements[1];
  
  console.log('📊 DEBUG: Medição mais recente:', {
    id: latest?.id,
    peso: latest?.weight,
    altura: latest?.height || userProfile?.height,
    pescoco: latest?.neck,
    cintura: latest?.waist_navel,
    quadril: latest?.hips,
    genero: userProfile?.gender
  });
  
  const getChange = (current: number | null, prev: number | null) => {
    if (!current || !prev) return null;
    return current - prev;
  };

  const getTrendIcon = (change: number | null, isGoodWhenLower: boolean = false) => {
    if (!change) return <Minus className="w-3 h-3 text-muted-foreground" />;
    const isPositive = change > 0;
    const isGood = isGoodWhenLower ? !isPositive : isPositive;
    
    return isPositive 
      ? <TrendingUp className={`w-3 h-3 ${isGood ? 'text-success' : 'text-destructive'}`} />
      : <TrendingDown className={`w-3 h-3 ${isGood ? 'text-success' : 'text-destructive'}`} />;
  };

  // Body composition calculations for latest measurement
  const height = latest?.height || userProfile?.height || 170;
  const weight = latest?.weight;
  const waist = latest?.waist_navel;
  const hips = latest?.hips;
  const neck = latest?.neck;
  const gender = userProfile?.gender;

  // Get body fat for latest and previous measurements
  const latestBodyFatData = getBodyFatForMeasurement(latest);
  const previousBodyFatData = previous ? getBodyFatForMeasurement(previous) : { value: null, isEstimated: false };
  
  const displayBodyFat = latestBodyFatData.value;
  const isEstimated = latestBodyFatData.isEstimated;

  const bmi = weight && height ? calculateBMI(weight, height) : null;
  const whtr = waist && height ? calculateWHtR(waist, height) : null;
  const whr = waist && hips ? calculateWHR(waist, hips) : null;
  const fatMass = weight && displayBodyFat !== null ? calculateFatMass(weight, displayBodyFat) : null;
  const leanMass = weight && displayBodyFat !== null ? calculateLeanMass(weight, displayBodyFat) : null;

  const bmiClassification = bmi ? classifyBMI(bmi) : null;
  const whtrClassification = whtr ? classifyWHtR(whtr, gender) : null;
  const bodyFatClassification = displayBodyFat ? classifyBodyFat(displayBodyFat, gender) : null;

  // Changes (including calculated body fat)
  const weightChange = getChange(latest?.weight, previous?.weight);
  const waistChange = getChange(latest?.waist_navel, previous?.waist_navel);
  const bodyFatChange = getChange(latestBodyFatData.value, previousBodyFatData.value);
  const chestChange = getChange(latest?.chest, previous?.chest);
  const armChange = getChange(latest?.right_arm_flexed, previous?.right_arm_flexed);

  // Insights
  const insights = generateInsights(measurements, gender);

  const handleDeleteMeasurement = async (measurementId: string) => {
    try {
      const { error } = await supabase
        .from('body_measurements')
        .delete()
        .eq('id', measurementId);
      
      if (error) throw error;
      
      toast({ title: 'Medição excluída', description: 'Medição removida com sucesso.' });
      // Force parent to refresh measurements
      window.location.reload();
    } catch (error) {
      console.error('Error deleting measurement:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir medição.', variant: 'destructive' });
    }
  };

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricKey)) {
        return prev.filter(k => k !== metricKey);
      } else {
        return [...prev, metricKey];
      }
    });
  };

  const exportChart = async () => {
    try {
      // In a real implementation, you'd use html2canvas or similar
      toast({ 
        title: 'Exportar', 
        description: 'Funcionalidade de exportação será implementada em breve!' 
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modern KPI Cards with Mobile-First Design */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* BMI - Enhanced Mobile Card */}
        <div className="group">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <CardContent className="p-3 md:p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Scale className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => toast({
                          title: "IMC - Índice de Massa Corporal",
                          description: "Relação entre peso e altura² (kg/m²). Faixas: <18.5 baixo peso, 18.5-24.9 normal, 25-29.9 sobrepeso, ≥30 obesidade. Importante indicador de saúde geral.",
                          duration: 5000
                        })}
                      >
                        <Info className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clique para saber mais</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">IMC</p>
                <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {bmi ? bmi.toFixed(1) : '—'}
                </p>
                {bmiClassification && (
                  <Badge 
                    className="text-xs font-medium border-0 shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${bmiClassification.bgColor}, ${bmiClassification.bgColor}90)`,
                      color: bmiClassification.color
                    }}
                  >
                    {bmiClassification.category}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Body Fat % - Modern Design */}
        <div className="group">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
            <CardContent className="p-3 md:p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <Percent className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(bodyFatChange, true)}
                   <TooltipProvider>
                     <UITooltip>
                       <TooltipTrigger asChild>
                         <div 
                           className="p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                           onClick={() => toast({
                             title: "% Gordura Corporal",
                             description: "Percentual de gordura em relação ao peso total. Faixas saudáveis: homens 10-20%, mulheres 16-24%. Calculado pela fórmula da Marinha Americana usando medidas de pescoço, cintura e quadril.",
                             duration: 5000
                           })}
                         >
                           <Info className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground" />
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Clique para saber mais</p>
                       </TooltipContent>
                     </UITooltip>
                   </TooltipProvider>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">% Gordura</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {displayBodyFat ? `${displayBodyFat.toFixed(1)}%` : '—'}
                  </p>
                  {isEstimated && (
                    <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/5">
                      Est.
                    </Badge>
                  )}
                </div>
                {bodyFatClassification ? (
                  <Badge 
                    className="text-xs font-medium border-0 shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${bodyFatClassification.bgColor}, ${bodyFatClassification.bgColor}90)`,
                      color: bodyFatClassification.color
                    }}
                  >
                    {bodyFatClassification.category}
                  </Badge>
                ) : !displayBodyFat && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Adicione:
                    </p>
                    <div className="text-xs text-warning space-y-0.5">
                      {!neck && <div>• Pescoço</div>}
                      {!waist && <div>• Cintura</div>}
                      {gender === 'feminino' && !hips && <div>• Quadril</div>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fat Mass */}
        <div className="group">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-transparent" />
            <CardContent className="p-3 md:p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-warning/10 border border-warning/20">
                  <Target className="w-3 h-3 md:w-4 md:h-4 text-warning" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Massa Gorda</p>
                <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {fatMass !== null ? `${fatMass.toFixed(1)}kg` : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lean Mass */}
        <div className="group">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent" />
            <CardContent className="p-3 md:p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-success/10 border border-success/20">
                  <Zap className="w-3 h-3 md:w-4 md:h-4 text-success" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Massa Magra</p>
                <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {leanMass !== null ? `${leanMass.toFixed(1)}kg` : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WHtR */}
        <div className="group">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent" />
            <CardContent className="p-3 md:p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-secondary/10 border border-secondary/20">
                  <Ruler className="w-3 h-3 md:w-4 md:h-4 text-secondary" />
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => toast({
                          title: "WHtR - Razão Cintura/Altura",
                          description: "Medida que relaciona a circunferência da cintura com a altura. Valores ideais: homens <0.50, mulheres <0.45. Importante indicador de risco cardiovascular e distribuição de gordura abdominal.",
                          duration: 5000
                        })}
                      >
                        <Info className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clique para saber mais</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">WHtR</p>
                <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {whtr ? whtr.toFixed(2) : '—'}
                </p>
                {whtrClassification && (
                  <Badge 
                    className="text-xs font-medium border-0 shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${whtrClassification.bgColor}, ${whtrClassification.bgColor}90)`,
                      color: whtrClassification.color
                    }}
                  >
                    {whtrClassification.category}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WHR */}
        <div className="group">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
            <CardContent className="p-3 md:p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <Heart className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => toast({
                          title: "WHR - Razão Cintura/Quadril",
                          description: "Medida que relaciona a circunferência da cintura com a do quadril. Valores de risco: homens >0.90, mulheres >0.85. Indicador importante de distribuição de gordura e risco cardiovascular.",
                          duration: 5000
                        })}
                      >
                        <Info className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clique para saber mais</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">WHR</p>
                <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {whr ? whr.toFixed(2) : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Circumferences Section - Modern Mobile Design */}
      <Card className="border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Variações das Circunferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Peso', current: latest?.weight, change: weightChange, unit: 'kg', isGoodWhenLower: true, color: 'primary' },
              { label: 'Cintura', current: latest?.waist_navel, change: waistChange, unit: 'cm', isGoodWhenLower: true, color: 'warning' },
              { label: 'Peito', current: latest?.chest, change: chestChange, unit: 'cm', isGoodWhenLower: false, color: 'success' },
              { label: 'Bíceps D', current: latest?.right_arm_flexed, change: armChange, unit: 'cm', isGoodWhenLower: false, color: 'secondary' },
              { label: 'Quadril', current: latest?.hips, change: getChange(latest?.hips, previous?.hips), unit: 'cm', isGoodWhenLower: true, color: 'destructive' }
            ].map(({ label, current, change, unit, isGoodWhenLower, color }) => (
              <div key={label} className="group">
                <div className="p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/30 border border-border/50 hover:border-border transition-all duration-200">
                  <div className="text-center space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {current ? `${current}${unit}` : '—'}
                    </p>
                    {change && (
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(change, isGoodWhenLower)}
                        <span className={`text-sm font-medium ${change > 0 ? (isGoodWhenLower ? 'text-destructive' : 'text-success') : (isGoodWhenLower ? 'text-success' : 'text-destructive')}`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}{unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Chart */}
      {chartData.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Evolução das Medidas
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Period Filter */}
                <div className="flex rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm">
                  {[
                    { key: 'all', label: 'Tudo' },
                    { key: '30', label: '30d' },
                    { key: '60', label: '60d' },
                    { key: '90', label: '90d' }
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={periodFilter === key ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-none first:rounded-l-lg last:rounded-r-lg text-xs"
                      onClick={() => setPeriodFilter(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={exportChart} className="bg-background/50 backdrop-blur-sm border-border/50">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
            
            {/* Metric Toggles */}
            <div className="flex flex-wrap gap-2 mt-4">
              {availableMetrics.map(({ key, label, color }) => (
                <Button
                  key={key}
                  variant={selectedMetrics.includes(key) ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs bg-background/50 backdrop-blur-sm border-border/50"
                  onClick={() => toggleMetric(key)}
                  style={selectedMetrics.includes(key) ? { backgroundColor: color, borderColor: color, color: 'white' } : {}}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} className="bg-gradient-to-br from-background/30 to-background/10 backdrop-blur-sm rounded-lg p-4">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  {selectedMetrics.some(m => availableMetrics.find(am => am.key === m)?.isPercentage) && (
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                  )}
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                  {availableMetrics
                    .filter(metric => selectedMetrics.includes(metric.key))
                    .map(({ key, label, color, unit, isPercentage }) => (
                      <Line
                        key={key}
                        yAxisId={isPercentage ? "right" : "left"}
                        type="monotone"
                        dataKey={key}
                        stroke={color}
                        strokeWidth={3}
                        name={`${label} (${unit})`}
                        connectNulls={false}
                        dot={{ fill: color, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: color, strokeWidth: 3, fill: 'white' }}
                      />
                    ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-background/50 to-background/30 border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurement Goals Panel */}
      <MeasurementGoalsPanel measurements={measurements} />

      {/* Recent Measurements with Actions */}
      <Card className="border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Últimas Medições
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {measurements.slice(0, 8).map((measurement, index) => {
              const bodyFatData = getBodyFatForMeasurement(measurement);
              
              return (
                <div key={measurement.id} className="group">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-background/50 to-background/30 border border-border/50 hover:border-border transition-all duration-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{new Date(measurement.date).toLocaleDateString('pt-BR')}</p>
                        {index === 0 && (
                          <Badge className="text-xs bg-gradient-to-r from-primary to-primary/80 text-white border-0">
                            Mais recente
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        {measurement.weight && <span>Peso: {measurement.weight} kg</span>}
                        {measurement.waist_navel && <span>Cintura: {measurement.waist_navel} cm</span>}
                        {bodyFatData.value && (
                          <span>
                            Gordura: {bodyFatData.value.toFixed(1)}%
                            {bodyFatData.isEstimated && <sup className="text-xs ml-1">*</sup>}
                          </span>
                        )}
                        {measurement.chest && <span>Peito: {measurement.chest} cm</span>}
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteConfirm({ isOpen: true, measurementId: measurement.id })}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-background/30 to-background/10 border border-border/30">
            <p className="text-xs text-muted-foreground">
              * Valores estimados usando a fórmula da Marinha Americana
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onOpenChange={(open) => setDeleteConfirm({ isOpen: open })}
        onConfirm={() => deleteConfirm.measurementId && handleDeleteMeasurement(deleteConfirm.measurementId)}
        title="Excluir Medição"
        description="Tem certeza que deseja excluir esta medição? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="destructive"
      />
    </div>
  );
};