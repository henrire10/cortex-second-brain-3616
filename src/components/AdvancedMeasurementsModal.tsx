
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ruler, Plus, TrendingUp, Calendar, Target, Activity, Scale, Zap } from 'lucide-react';

interface Measurement {
  date: string;
  weight: number;
  bodyFat: number;
  muscle: number;
  waist: number;
  chest: number;
  arms: number;
  thighs: number;
}

interface AdvancedMeasurementsModalProps {
  measurements: Measurement[];
  onAddMeasurement: (measurement: Omit<Measurement, 'date'>) => void;
}

export const AdvancedMeasurementsModal: React.FC<AdvancedMeasurementsModalProps> = ({
  measurements,
  onAddMeasurement
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newMeasurement, setNewMeasurement] = useState({
    weight: 0,
    bodyFat: 0,
    muscle: 0,
    waist: 0,
    chest: 0,
    arms: 0,
    thighs: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMeasurement(newMeasurement);
    setNewMeasurement({
      weight: 0,
      bodyFat: 0,
      muscle: 0,
      waist: 0,
      chest: 0,
      arms: 0,
      thighs: 0
    });
    setIsAddingNew(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getLatestMeasurement = () => {
    if (measurements.length === 0) return null;
    return measurements[measurements.length - 1];
  };

  const getPreviousMeasurement = () => {
    if (measurements.length < 2) return null;
    return measurements[measurements.length - 2];
  };

  const calculateProgress = (current: number, previous: number, isLower = false) => {
    if (!previous || previous === 0) return 0;
    const change = ((current - previous) / previous) * 100;
    return isLower ? -change : change;
  };

  const getProgressColor = (progress: number, isLower = false) => {
    if (isLower) {
      return progress > 0 ? 'text-green-600' : 'text-red-600';
    }
    return progress > 0 ? 'text-green-600' : 'text-red-600';
  };

  const latestMeasurement = getLatestMeasurement();
  const previousMeasurement = getPreviousMeasurement();

  const renderProgressCard = (title: string, value: number, unit: string, icon: React.ReactNode, isLower = false) => {
    const previous = previousMeasurement ? (previousMeasurement as any)[title.toLowerCase().replace(' ', '')] || 0 : 0;
    const progress = calculateProgress(value, previous, isLower);
    const progressColor = getProgressColor(progress, isLower);

    return (
      <Card className="border-2 border-gray-100 hover:border-purple-200 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {icon}
              <span className="text-sm font-medium text-gray-600">{title}</span>
            </div>
            {previous > 0 && (
              <Badge variant={progress > 0 ? "default" : "secondary"} className="text-xs">
                {progress > 0 ? '+' : ''}{progress.toFixed(1)}%
              </Badge>
            )}
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-gray-800">{value}</span>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
          {previous > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Anterior: {previous}{unit}</span>
                <span className={progressColor}>
                  {progress > 0 ? '↗' : '↘'} {Math.abs(progress).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(Math.abs(progress), 100)} 
                className="h-1"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-purple-100 hover:border-purple-300">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Ruler className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Análise Corporal</h3>
              <p className="text-gray-600 text-sm mb-3">Medidas e evolução detalhada</p>
              {latestMeasurement && (
                <div className="space-y-2">
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {latestMeasurement.weight}kg
                    </Badge>
                    {latestMeasurement.bodyFat > 0 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {latestMeasurement.bodyFat}% gordura
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Última medição: {formatDate(latestMeasurement.date)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Ruler className="w-5 h-5 text-white" />
            </div>
            Análise Corporal Avançada
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Medidas Atuais</h3>
              <Button 
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Medida
              </Button>
            </div>

            {latestMeasurement ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderProgressCard('Peso', latestMeasurement.weight, 'kg', <Scale className="w-4 h-4 text-blue-600" />)}
                {latestMeasurement.bodyFat > 0 && renderProgressCard('Gordura', latestMeasurement.bodyFat, '%', <Activity className="w-4 h-4 text-orange-600" />, true)}
                {latestMeasurement.muscle > 0 && renderProgressCard('Músculo', latestMeasurement.muscle, '%', <Zap className="w-4 h-4 text-green-600" />)}
                {latestMeasurement.waist > 0 && renderProgressCard('Cintura', latestMeasurement.waist, 'cm', <Target className="w-4 h-4 text-purple-600" />, true)}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <Ruler className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhuma medida registrada
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Comece adicionando suas primeiras medidas corporais
                  </p>
                  <Button 
                    onClick={() => setIsAddingNew(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Medida
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Add New Measurement Form */}
            {isAddingNew && (
              <Card className="border-2 border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="text-lg">Adicionar Nova Medida</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peso (kg) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasurement.weight || ''}
                          onChange={(e) => setNewMeasurement({
                            ...newMeasurement,
                            weight: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          % Gordura
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasurement.bodyFat || ''}
                          onChange={(e) => setNewMeasurement({
                            ...newMeasurement,
                            bodyFat: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          % Músculo
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasurement.muscle || ''}
                          onChange={(e) => setNewMeasurement({
                            ...newMeasurement,
                            muscle: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cintura (cm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasurement.waist || ''}
                          onChange={(e) => setNewMeasurement({
                            ...newMeasurement,
                            waist: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peito (cm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasurement.chest || ''}
                          onChange={(e) => setNewMeasurement({
                            ...newMeasurement,
                            chest: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Braços (cm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasurement.arms || ''}
                          onChange={(e) => setNewMeasurement({
                            ...newMeasurement,
                            arms: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Coxas (cm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasurement.thighs || ''}
                          onChange={(e) => setNewMeasurement({
                            ...newMeasurement,
                            thighs: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingNew(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500">
                        Salvar Medida
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Análise de Progresso</h3>
              <p className="text-gray-600 mb-6">Evolução das suas medidas ao longo do tempo</p>
            </div>

            {measurements.length >= 2 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress charts would go here */}
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Gráficos em desenvolvimento</h4>
                    <p className="text-sm text-gray-600">
                      Continue adicionando medidas para ver gráficos detalhados da sua evolução
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Dados insuficientes para análise
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Adicione pelo menos 2 medições para ver o progresso
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {measurements.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhuma medida no histórico
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Comece adicionando suas primeiras medidas corporais
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {measurements.slice().reverse().map((measurement, index) => (
                  <Card key={index} className="border-2 border-gray-100 hover:border-purple-200 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          {formatDate(measurement.date)}
                        </CardTitle>
                        {index === 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            Mais recente
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Peso:</span>
                          <span className="font-bold text-blue-600">{measurement.weight}kg</span>
                        </div>
                        {measurement.bodyFat > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">% Gordura:</span>
                            <span className="font-bold text-orange-600">{measurement.bodyFat}%</span>
                          </div>
                        )}
                        {measurement.muscle > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">% Músculo:</span>
                            <span className="font-bold text-green-600">{measurement.muscle}%</span>
                          </div>
                        )}
                        {measurement.waist > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Cintura:</span>
                            <span className="font-bold text-purple-600">{measurement.waist}cm</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
