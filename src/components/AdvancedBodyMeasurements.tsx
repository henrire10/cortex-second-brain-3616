
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Ruler, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  Camera,
  BarChart3,
  Award,
  Zap,
  Eye,
  Settings,
  CheckCircle,
  AlertCircle,
  Star,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { EnhancedBodyMeasurementsModule } from './questionnaire/EnhancedBodyMeasurementsModule';
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
  notes?: string;
}

interface MeasurementGoal {
  id: string;
  type: string;
  target: number;
  current: number;
  deadline: string;
  achieved: boolean;
}

interface AdvancedBodyMeasurementsProps {
  measurements: Measurement[];
  onAddMeasurement: (measurement: Omit<Measurement, 'date' | 'id'>) => void;
}

export const AdvancedBodyMeasurements: React.FC<AdvancedBodyMeasurementsProps> = ({
  measurements,
  onAddMeasurement
}) => {
  const { user, points, addPoints } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('weight');
  const [goals, setGoals] = useState<MeasurementGoal[]>([]);
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
    notes: ''
  });

  const measurementTypes = [
    { key: 'weight', label: 'Peso', unit: 'kg', icon: '⚖️', guide: 'Meça em jejum, sem roupas' },
    { key: 'height', label: 'Altura', unit: 'cm', icon: '📏', guide: 'Meça descalço, encostado na parede' },
    { key: 'bodyFat', label: '% Gordura', unit: '%', icon: '📊', guide: 'Use bioimpedância ou adipômetro' },
    { key: 'muscle', label: '% Músculo', unit: '%', icon: '💪', guide: 'Medida por bioimpedância' },
    { key: 'waist', label: 'Cintura', unit: 'cm', icon: '📏', guide: 'Na parte mais estreita do abdômen' },
    { key: 'chest', label: 'Peito', unit: 'cm', icon: '📐', guide: 'Na altura dos mamilos' },
    { key: 'arms', label: 'Braços', unit: 'cm', icon: '💪', guide: 'Bíceps contraído, ponto mais largo' },
    { key: 'thighs', label: 'Coxas', unit: 'cm', icon: '🦵', guide: 'Ponto mais largo da coxa' },
    { key: 'neck', label: 'Pescoço', unit: 'cm', icon: '📏', guide: 'Logo abaixo do pomo de adão' },
    { key: 'hips', label: 'Quadril', unit: 'cm', icon: '📐', guide: 'Ponto mais largo do quadril' },
    { key: 'forearms', label: 'Antebraços', unit: 'cm', icon: '💪', guide: 'Ponto mais largo do antebraço' },
    { key: 'calves', label: 'Panturrilhas', unit: 'cm', icon: '🦵', guide: 'Ponto mais largo da panturrilha' }
  ];

  useEffect(() => {
    if (user) {
      const savedGoals = localStorage.getItem(`biafitness_measurement_goals_${user.id}`);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    }
  }, [user]);

  const getLatestMeasurement = () => {
    if (measurements.length === 0) return null;
    return measurements[measurements.length - 1];
  };

  const getProgress = (type: string) => {
    if (measurements.length < 2) return null;
    
    const latest = measurements[measurements.length - 1];
    const previous = measurements[measurements.length - 2];
    
    const latestValue = latest[type as keyof Measurement] as number;
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

  const getMeasurementChartData = (type: string) => {
    return measurements.map((m, index) => ({
      date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: m[type as keyof Measurement] as number,
      index
    })).filter(item => item.value > 0);
  };

  const getRadarData = () => {
    const latest = getLatestMeasurement();
    if (!latest) return [];

    return [
      { measurement: 'Peso', value: latest.weight || 0, fullMark: 100 },
      { measurement: 'Músculo', value: latest.muscle || 0, fullMark: 50 },
      { measurement: 'Gordura', value: latest.bodyFat || 0, fullMark: 30 },
      { measurement: 'Braços', value: latest.arms || 0, fullMark: 50 },
      { measurement: 'Peito', value: latest.chest || 0, fullMark: 120 },
      { measurement: 'Cintura', value: latest.waist || 0, fullMark: 100 }
    ];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
      notes: ''
    });
    
    // Award points
    addPoints(25);
    
    toast({
      title: "Medidas Registradas! 📏",
      description: `Você ganhou 25 pontos! Continue acompanhando sua evolução!`,
    });
    
    setActiveTab('dashboard');
  };

  const addGoal = (type: string, target: number, deadline: string) => {
    const newGoal: MeasurementGoal = {
      id: Date.now().toString(),
      type,
      target,
      current: getLatestMeasurement()?.[type as keyof Measurement] as number || 0,
      deadline,
      achieved: false
    };
    
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    
    if (user) {
      localStorage.setItem(`biafitness_measurement_goals_${user.id}`, JSON.stringify(updatedGoals));
    }
  };

  const latestMeasurement = getLatestMeasurement();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Ruler className="w-10 h-10 text-white" />
              </div>
              {latestMeasurement && (
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1">
                  Atualizado
                </Badge>
              )}
            </div>
            
            <h3 className="font-bold text-xl text-gray-800 mb-3">Análise Corporal Avançada</h3>
            <p className="text-gray-600 text-sm mb-6">
              Acompanhe sua evolução com precisão científica
            </p>
            
            {latestMeasurement ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">{latestMeasurement.weight}kg</div>
                    <div className="text-xs text-gray-500">Peso atual</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
                    <div className="text-2xl font-bold text-pink-600">{latestMeasurement.waist}cm</div>
                    <div className="text-xs text-gray-500">Cintura</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Última medição: {new Date(latestMeasurement.date).toLocaleDateString('pt-BR')}
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-600">{measurements.length} registros</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Comece sua jornada</div>
                  <div className="text-sm text-gray-500">Registre suas primeiras medidas</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 scrollbar-hide overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <div>Análise Corporal Avançada</div>
                <p className="text-purple-100 text-base font-normal mt-1">
                  Sua evolução física em detalhes
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-100">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Plus className="w-4 h-4" />
                Adicionar
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4" />
                Análise
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Target className="w-4 h-4" />
                Metas
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {measurements.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Ruler className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-4">
                      Comece sua jornada de transformação
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      Registre suas primeiras medidas corporais e acompanhe sua evolução com gráficos avançados e análises detalhadas.
                    </p>
                    <Button 
                      onClick={() => navigate('/measurements')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Registrar Primeira Medida
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Resumo Geral */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {measurementTypes.slice(0, 4).map((type) => {
                        const progress = getProgress(type.key);
                        const latestValue = latestMeasurement?.[type.key as keyof Measurement] as number;
                        
                        return (
                          <Card key={type.key} className="border-2 border-gray-100 hover:border-purple-200 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{type.icon}</span>
                                {progress && (
                                  <div className={`p-1 rounded-full ${
                                    progress.trend === 'up' ? 'bg-green-100' : 
                                    progress.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                                  }`}>
                                    {progress.trend === 'up' ? (
                                      <TrendingUp className="w-3 h-3 text-green-600" />
                                    ) : progress.trend === 'down' ? (
                                      <TrendingDown className="w-3 h-3 text-red-600" />
                                    ) : (
                                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-600 mb-1">{type.label}</div>
                              <div className="text-xl font-bold text-gray-800">
                                {latestValue || 0}{type.unit}
                              </div>
                              {progress && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {progress.change > 0 ? '+' : ''}{progress.change.toFixed(1)}{type.unit}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Gráfico Principal */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Evolução das Medidas
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          {measurementTypes.slice(0, 6).map((type) => (
                            <Button
                              key={type.key}
                              variant={selectedMeasurement === type.key ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedMeasurement(type.key)}
                              className="text-xs"
                            >
                              {type.label}
                            </Button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getMeasurementChartData(selectedMeasurement)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip 
                                formatter={(value) => [
                                  `${value}${measurementTypes.find(t => t.key === selectedMeasurement)?.unit}`,
                                  measurementTypes.find(t => t.key === selectedMeasurement)?.label
                                ]}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#8B5CF6" 
                                strokeWidth={3}
                                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                                activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Gráfico Radar */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Perfil Corporal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={getRadarData()}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="measurement" tick={{ fontSize: 12 }} />
                              <PolarRadiusAxis domain={[0, 'dataMax']} tick={false} />
                              <Radar
                                name="Medidas"
                                dataKey="value"
                                stroke="#8B5CF6"
                                fill="#8B5CF6"
                                fillOpacity={0.2}
                                strokeWidth={2}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Estatísticas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Conquistas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-semibold text-green-800">Consistência</div>
                            <div className="text-sm text-green-600">{measurements.length} registros</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-semibold text-blue-800">Acompanhamento</div>
                            <div className="text-sm text-blue-600">
                              {Math.ceil((Date.now() - new Date(measurements[0]?.date || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} dias
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Enhanced Measurements Form */}
            <TabsContent value="add" className="space-y-6">
              <div className="relative -m-6 -mt-12">
                <EnhancedBodyMeasurementsModule
                  onSaveMeasurements={(measurementData) => {
                    // Convert enhanced measurements to standard format
                    const standardMeasurement = {
                      weight: measurementData.peso,
                      height: measurementData.altura,
                      bodyFat: measurementData.bodyFat || 0,
                      muscle: 0, // Not included in enhanced version
                      waist: measurementData.medidas_barriga,
                      chest: measurementData.medidas_peito,
                      arms: (measurementData.medidas_biceps_direito + measurementData.medidas_biceps_esquerdo) / 2,
                      thighs: (measurementData.medidas_coxa_direita + measurementData.medidas_coxa_esquerda) / 2,
                      neck: measurementData.medidas_pescoco,
                      hips: measurementData.medidas_quadril,
                      forearms: (measurementData.medidas_antebraco_direito + measurementData.medidas_antebraco_esquerdo) / 2,
                      calves: (measurementData.medidas_panturrilha_direita + measurementData.medidas_panturrilha_esquerda) / 2,
                      notes: ''
                    };
                    
                    onAddMeasurement(standardMeasurement);
                    setActiveTab('dashboard');
                  }}
                  userGender={user?.user_metadata?.genero || 'masculino'}
                />
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  Análise Avançada em Desenvolvimento
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Estamos preparando análises ainda mais detalhadas da sua evolução corporal, incluindo comparações temporais e insights personalizados.
                </p>
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  Sistema de Metas em Breve
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Em breve você poderá definir metas específicas para cada medida corporal e acompanhar seu progresso em direção aos objetivos.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
