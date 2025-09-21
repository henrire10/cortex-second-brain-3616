
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { calculateBodyFat, calculateMuscleMass, classifyBodyFat, getRequiredMeasurements, type BodyFatMeasurements } from '@/utils/bodyFatCalculator';
import { EnhancedBodyMeasurementsModule } from '@/components/questionnaire/EnhancedBodyMeasurementsModule';
import { 
  Ruler, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  CheckCircle,
  Star,
  Calculator,
  Info,
  Activity,
  Target,
  Droplets,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface Measurement {
  id: string;
  date: string;
  weight: number;
  height: number;
  bodyFat: number;
  muscle: number;
  waist: number;
  chest: number;
  arms: number;
  thighs: number;
  neck?: number;
  hips?: number;
  forearms?: number;
  calves?: number;
  waistNarrowest?: number;
  abdomen?: number;
  notes?: string;
}

interface MobileAdvancedBodyMeasurementsProps {
  measurements: Measurement[];
  onAddMeasurement: (measurement: Omit<Measurement, 'date' | 'id'>) => void;
}

export const MobileAdvancedBodyMeasurements: React.FC<MobileAdvancedBodyMeasurementsProps> = ({
  measurements,
  onAddMeasurement
}) => {
  const { user, addPoints, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMetrics, setSelectedMetrics] = useState(['weight', 'bodyFat']);
  const [newMeasurement, setNewMeasurement] = useState({
    weight: 0,
    height: 0,
    bodyFat: 0,
    muscle: 0,
    waist: 0,
    chest: 0,
    arms: 0,
    thighs: 0,
    neck: 0,
    hips: 0,
    forearms: 0,
    calves: 0,
    waistNarrowest: 0,
    abdomen: 0,
    notes: ''
  });

  // Detectar gênero do usuário para cálculos
  const userGender = profile?.gender || 'masculino';

  // Campos do questionário agora incluídos
  const measurementTypes = [
    { key: 'weight', label: 'Peso', unit: 'kg', icon: '⚖️', guide: 'Meça em jejum, sem roupas', category: 'basic', required: true, color: '#8884d8' },
    { key: 'height', label: 'Altura', unit: 'cm', icon: '📏', guide: 'Meça descalço, encostado na parede', category: 'basic', required: true, color: '#82ca9d' },
    { key: 'bodyFat', label: '% Gordura', unit: '%', icon: '📊', guide: 'Calculado automaticamente', category: 'calculated', color: '#ff7300' },
    { key: 'muscle', label: 'Massa Muscular', unit: 'kg', icon: '💪', guide: 'Calculado automaticamente', category: 'calculated', color: '#ff0000' },
    { key: 'neck', label: 'Pescoço', unit: 'cm', icon: '🎯', guide: 'Abaixo do pomo de adão (homens)', category: 'circumference', required: true, color: '#00ff00' },
    { key: 'chest', label: 'Peito', unit: 'cm', icon: '📐', guide: 'Na altura dos mamilos', category: 'circumference', color: '#0088fe' },
    { key: 'waist', label: 'Cintura (Umbigo)', unit: 'cm', icon: '📏', guide: 'Na altura do umbigo', category: 'circumference', required: userGender === 'feminino', color: '#00c49f' },
    { key: 'waistNarrowest', label: 'Cintura (Estreita)', unit: 'cm', icon: '📐', guide: 'Na parte mais estreita', category: 'circumference', color: '#ffbb28' },
    { key: 'abdomen', label: 'Abdômen', unit: 'cm', icon: '🎯', guide: 'Maior circunferência abdominal', category: 'circumference', required: userGender === 'masculino', color: '#ff8042' },
    { key: 'hips', label: 'Quadril', unit: 'cm', icon: '📏', guide: 'Na parte mais larga dos quadris', category: 'circumference', required: userGender === 'feminino', color: '#8dd1e1' },
    { key: 'arms', label: 'Braços', unit: 'cm', icon: '💪', guide: 'Bíceps contraído, maior medida', category: 'limbs', color: '#d084d0' },
    { key: 'forearms', label: 'Antebraços', unit: 'cm', icon: '💪', guide: 'Maior circunferência', category: 'limbs', color: '#87d068' },
    { key: 'thighs', label: 'Coxas', unit: 'cm', icon: '🦵', guide: 'Parte superior, maior medida', category: 'limbs', color: '#ffc658' },
    { key: 'calves', label: 'Panturrilhas', unit: 'cm', icon: '🦵', guide: 'Maior circunferência', category: 'limbs', color: '#8889dd' }
  ];

  // Campos obrigatórios baseados no gênero
  const requiredFields = getRequiredMeasurements(userGender);

  // Calcular gordura corporal automaticamente
  const calculateAutoBodyFat = () => {
    if (newMeasurement.weight && newMeasurement.height && newMeasurement.neck) {
      const measurements: BodyFatMeasurements = {
        gender: userGender as 'masculino' | 'feminino' | 'outro',
        height: newMeasurement.height,
        weight: newMeasurement.weight,
        neck: newMeasurement.neck,
        waist: newMeasurement.waist,
        hips: newMeasurement.hips,
        abdomen: newMeasurement.abdomen
      };

      const bodyFat = calculateBodyFat(measurements);
      if (bodyFat !== null) {
        const muscle = calculateMuscleMass(newMeasurement.weight, bodyFat);
        setNewMeasurement(prev => ({
          ...prev,
          bodyFat,
          muscle
        }));
      }
    }
  };

  // Recalcular quando medidas essenciais mudarem
  useEffect(() => {
    calculateAutoBodyFat();
  }, [newMeasurement.weight, newMeasurement.height, newMeasurement.neck, newMeasurement.waist, newMeasurement.hips, newMeasurement.abdomen, userGender]);

  const getLatestMeasurement = () => {
    if (measurements.length === 0) return null;
    const latest = measurements[measurements.length - 1];
    
    // Calcular gordura corporal se não estiver presente
    if (!latest.bodyFat && latest.weight && latest.height && latest.neck) {
      const measurements: BodyFatMeasurements = {
        gender: userGender as 'masculino' | 'feminino' | 'outro',
        height: latest.height,
        weight: latest.weight,
        neck: latest.neck,
        waist: latest.waist,
        hips: latest.hips,
        abdomen: latest.abdomen
      };

      const bodyFat = calculateBodyFat(measurements);
      if (bodyFat !== null) {
        const muscle = calculateMuscleMass(latest.weight, bodyFat);
        return { ...latest, bodyFat, muscle };
      }
    }
    
    return latest;
  };

  const getProgress = (type: string) => {
    if (measurements.length < 2) return null;
    
    const latest = getLatestMeasurement();
    const previous = measurements[measurements.length - 2];
    
    const latestValue = latest?.[type as keyof Measurement] as number;
    const previousValue = previous[type as keyof Measurement] as number;
    
    if (!latestValue || !previousValue) return null;
    
    const change = latestValue - previousValue;
    const percentChange = ((change / previousValue) * 100);
    
    return {
      change,
      percentChange,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const getMeasurementChartData = () => {
    return measurements.map((m, index) => {
      // Calcular gordura corporal se não estiver presente
      let bodyFat = m.bodyFat;
      let muscle = m.muscle;
      
      if (!bodyFat && m.weight && m.height && m.neck) {
        const measurements: BodyFatMeasurements = {
          gender: userGender as 'masculino' | 'feminino' | 'outro',
          height: m.height,
          weight: m.weight,
          neck: m.neck,
          waist: m.waist,
          hips: m.hips,
          abdomen: m.abdomen
        };

        const calculatedBodyFat = calculateBodyFat(measurements);
        if (calculatedBodyFat !== null) {
          bodyFat = calculatedBodyFat;
          muscle = calculateMuscleMass(m.weight, bodyFat);
        }
      }

      return {
        date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        weight: m.weight,
        bodyFat,
        muscle,
        waist: m.waist,
        chest: m.chest,
        arms: m.arms,
        thighs: m.thighs,
        neck: m.neck,
        hips: m.hips,
        forearms: m.forearms,
        calves: m.calves,
        index
      };
    }).filter(item => item.weight > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calcular gordura corporal final antes de salvar
    calculateAutoBodyFat();
    
    const measurementData = {
      ...newMeasurement,
      id: Date.now().toString()
    };
    
    onAddMeasurement(measurementData);
    
    // Reset form
    setNewMeasurement({
      weight: 0,
      height: 0,
      bodyFat: 0,
      muscle: 0,
      waist: 0,
      chest: 0,
      arms: 0,
      thighs: 0,
      neck: 0,
      hips: 0,
      forearms: 0,
      calves: 0,
      waistNarrowest: 0,
      abdomen: 0,
      notes: ''
    });
    
    // Award points
    if (addPoints) {
      addPoints(25);
    }
    
    const bodyFatInfo = newMeasurement.bodyFat > 0 ? classifyBodyFat(newMeasurement.bodyFat, userGender) : null;
    
    toast({
      title: "Medidas Registradas! 📏",
      description: bodyFatInfo 
        ? `Gordura corporal: ${newMeasurement.bodyFat.toFixed(1)}% (${bodyFatInfo.category}). +25 pontos!`
        : `Medidas salvas com sucesso! +25 pontos!`,
    });
    
    setActiveTab('dashboard');
  };

  const latestMeasurement = getLatestMeasurement();
  const bodyFatInfo = latestMeasurement?.bodyFat ? classifyBodyFat(latestMeasurement.bodyFat, userGender) : null;

  if (measurements.length === 0) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Ruler className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Análise Corporal Avançada
          </h2>
          <p className="text-muted-foreground mb-6">
            Acompanhe sua evolução com precisão científica
          </p>
        </div>

        <Card className="border-2 border-dashed border-border">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              Comece sua jornada de transformação
            </h3>
            <p className="text-muted-foreground mb-6">
              Registre suas primeiras medidas corporais e acompanhe sua evolução com gráficos avançados.
            </p>
            <Button 
              onClick={() => navigate('/measurements')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Registrar Primeira Medida
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced Measurements Module for Mobile */}
        {activeTab === 'add' && (
          <div className="h-full min-h-0 overflow-visible bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
            <EnhancedBodyMeasurementsModule 
              onSaveMeasurements={(data) => {
                const measurementData = {
                  weight: data.peso || 0,
                  height: data.altura || 0,
                  bodyFat: data.bodyFat || 0,
                  muscle: 0, // Will be calculated
                  waist: data.medidas_barriga || 0,
                  chest: data.medidas_peito || 0,
                  arms: Math.max(data.medidas_biceps_direito || 0, data.medidas_biceps_esquerdo || 0),
                  thighs: Math.max(data.medidas_coxa_direita || 0, data.medidas_coxa_esquerda || 0),
                  neck: data.medidas_pescoco || 0,
                  hips: data.medidas_quadril || 0,
                  forearms: Math.max(data.medidas_antebraco_direito || 0, data.medidas_antebraco_esquerdo || 0),
                  calves: Math.max(data.medidas_panturrilha_direita || 0, data.medidas_panturrilha_esquerda || 0),
                  waistNarrowest: 0,
                  abdomen: 0,
                  notes: ''
                };
                
                onAddMeasurement(measurementData);
                
                // Award points
                if (addPoints) {
                  addPoints(25);
                }
                
                const bodyFatInfo = data.bodyFat > 0 ? classifyBodyFat(data.bodyFat, userGender) : null;
                
                toast({
                  title: "Medidas Registradas! 📏",
                  description: bodyFatInfo 
                    ? `Gordura corporal: ${data.bodyFat.toFixed(1)}% (${bodyFatInfo.category}). +25 pontos!`
                    : `Medidas salvas com sucesso! +25 pontos!`,
                });
                
                setActiveTab('dashboard');
              }}
              userGender={userGender as 'masculino' | 'feminino'}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
            <BarChart3 className="w-3 h-3" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-1 text-xs">
            <Plus className="w-3 h-3" />
            Adicionar
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" />
            Análise
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Resumo Principal Expandido */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Última Medição Completa</h3>
                  <p className="text-sm text-muted-foreground">
                    {latestMeasurement && new Date(latestMeasurement.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-muted-foreground">{measurements.length} registros</span>
                </div>
              </div>
              
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">⚖️</span>
                    {getProgress('weight') && (
                      <div className={`p-1 rounded-full ${
                        getProgress('weight')?.trend === 'up' ? 'bg-blue-100' : 
                        getProgress('weight')?.trend === 'down' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {getProgress('weight')?.trend === 'up' ? (
                          <TrendingUp className="w-2 h-2 text-blue-600" />
                        ) : getProgress('weight')?.trend === 'down' ? (
                          <TrendingDown className="w-2 h-2 text-green-600" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Peso</div>
                  <div className="text-lg font-bold text-foreground">
                    {latestMeasurement?.weight || 0}kg
                  </div>
                  {getProgress('weight') && (
                    <div className="text-xs text-muted-foreground">
                      {getProgress('weight')!.change > 0 ? '+' : ''}{getProgress('weight')!.change.toFixed(1)}kg
                    </div>
                  )}
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">📏</span>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Altura</div>
                  <div className="text-lg font-bold text-foreground">
                    {latestMeasurement?.height || 0}cm
                  </div>
                </div>

                {latestMeasurement?.bodyFat && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">📊</span>
                      {getProgress('bodyFat') && (
                        <div className={`p-1 rounded-full ${
                          getProgress('bodyFat')?.trend === 'down' ? 'bg-green-100' : 
                          getProgress('bodyFat')?.trend === 'up' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {getProgress('bodyFat')?.trend === 'down' ? (
                            <TrendingDown className="w-2 h-2 text-green-600" />
                          ) : getProgress('bodyFat')?.trend === 'up' ? (
                            <TrendingUp className="w-2 h-2 text-red-600" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">% Gordura</div>
                    <div className="text-lg font-bold text-foreground">
                      {latestMeasurement.bodyFat.toFixed(1)}%
                    </div>
                    {getProgress('bodyFat') && (
                      <div className="text-xs text-muted-foreground">
                        {getProgress('bodyFat')!.change > 0 ? '+' : ''}{getProgress('bodyFat')!.change.toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}

                {latestMeasurement?.muscle && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">💪</span>
                      {getProgress('muscle') && (
                        <div className={`p-1 rounded-full ${
                          getProgress('muscle')?.trend === 'up' ? 'bg-green-100' : 
                          getProgress('muscle')?.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {getProgress('muscle')?.trend === 'up' ? (
                            <TrendingUp className="w-2 h-2 text-green-600" />
                          ) : getProgress('muscle')?.trend === 'down' ? (
                            <TrendingDown className="w-2 h-2 text-red-600" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Massa Muscular</div>
                    <div className="text-lg font-bold text-foreground">
                      {latestMeasurement.muscle.toFixed(1)}kg
                    </div>
                    {getProgress('muscle') && (
                      <div className="text-xs text-muted-foreground">
                        {getProgress('muscle')!.change > 0 ? '+' : ''}{getProgress('muscle')!.change.toFixed(1)}kg
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Composição Corporal */}
              {bodyFatInfo && (
                <div className="p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-foreground">Composição Corporal</h4>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`${bodyFatInfo.color} border-current`}>
                      {bodyFatInfo.category}
                    </Badge>
                    <span className="text-sm font-medium">{latestMeasurement?.bodyFat?.toFixed(1)}% de gordura</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{bodyFatInfo.description}</p>
                </div>
              )}

              {/* Circunferências Principais */}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Principais Circunferências</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['chest', 'waist', 'arms', 'thighs'].map((type) => {
                    const measurement = measurementTypes.find(t => t.key === type);
                    const value = latestMeasurement?.[type as keyof Measurement] as number;
                    const progress = getProgress(type);
                    
                    if (!value || !measurement) return null;
                    
                    return (
                      <div key={type} className="p-2 bg-muted/30 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs">{measurement.icon}</span>
                          {progress && (
                            <div className={`w-3 h-3 rounded-full ${
                              progress.trend === 'up' ? 'bg-blue-500' : 
                              progress.trend === 'down' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          )}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">{measurement.label}</div>
                        <div className="text-sm font-bold">{value}{measurement.unit}</div>
                        {progress && (
                          <div className="text-xs text-muted-foreground">
                            {progress.change > 0 ? '+' : ''}{progress.change.toFixed(1)}{measurement.unit}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Evolução Completa</CardTitle>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {['weight', 'bodyFat', 'muscle', 'waist', 'chest', 'arms'].map((metric) => {
                    const type = measurementTypes.find(t => t.key === metric);
                    if (!type) return null;
                    
                    return (
                      <Button
                        key={metric}
                        variant={selectedMetrics.includes(metric) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedMetrics(prev => 
                            prev.includes(metric) 
                              ? prev.filter(m => m !== metric)
                              : [...prev, metric]
                          );
                        }}
                        className="text-xs h-8"
                      >
                        <span className="mr-1">{type.icon}</span>
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Selecione até 4 métricas para comparar
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMeasurementChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        const type = measurementTypes.find(t => t.key === name);
                        return [
                          `${value}${type?.unit || ''}`,
                          type?.label || name
                        ];
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    {selectedMetrics.slice(0, 4).map((metric) => {
                      const type = measurementTypes.find(t => t.key === metric);
                      if (!type) return null;
                      
                      return (
                        <Line 
                          key={metric}
                          type="monotone" 
                          dataKey={metric}
                          stroke={type.color}
                          strokeWidth={2}
                          dot={{ fill: type.color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: type.color, strokeWidth: 2 }}
                          name={type.label}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Tab - Enhanced Module */}
        <TabsContent value="add" className="space-y-0 p-0">
          <div className="h-full min-h-0 overflow-visible bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 -m-4">
            <EnhancedBodyMeasurementsModule 
              onSaveMeasurements={(data) => {
                const measurementData = {
                  weight: data.peso || 0,
                  height: data.altura || 0,
                  bodyFat: data.bodyFat || 0,
                  muscle: 0, // Will be calculated
                  waist: data.medidas_barriga || 0,
                  chest: data.medidas_peito || 0,
                  arms: Math.max(data.medidas_biceps_direito || 0, data.medidas_biceps_esquerdo || 0),
                  thighs: Math.max(data.medidas_coxa_direita || 0, data.medidas_coxa_esquerda || 0),
                  neck: data.medidas_pescoco || 0,
                  hips: data.medidas_quadril || 0,
                  forearms: Math.max(data.medidas_antebraco_direito || 0, data.medidas_antebraco_esquerdo || 0),
                  calves: Math.max(data.medidas_panturrilha_direita || 0, data.medidas_panturrilha_esquerda || 0),
                  waistNarrowest: 0,
                  abdomen: 0,
                  notes: ''
                };
                
                onAddMeasurement(measurementData);
                
                // Award points
                if (addPoints) {
                  addPoints(25);
                }
                
                const bodyFatInfo = data.bodyFat > 0 ? classifyBodyFat(data.bodyFat, userGender) : null;
                
                toast({
                  title: "Medidas Registradas! 📏",
                  description: bodyFatInfo 
                    ? `Gordura corporal: ${data.bodyFat.toFixed(1)}% (${bodyFatInfo.category}). +25 pontos!`
                    : `Medidas salvas com sucesso! +25 pontos!`,
                });
                
                setActiveTab('dashboard');
              }}
              userGender={userGender as 'masculino' | 'feminino'}
            />
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Análise Avançada
              </h3>
              <p className="text-muted-foreground mb-6">
                Recursos de análise avançada estão sendo desenvolvidos. Em breve você terá acesso a insights detalhados sobre sua evolução.
              </p>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Em Desenvolvimento
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
