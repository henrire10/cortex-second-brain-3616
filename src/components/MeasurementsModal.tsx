
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Ruler, Plus, TrendingUp, Calendar } from 'lucide-react';

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

interface MeasurementsModalProps {
  measurements: Measurement[];
  onAddMeasurement: (measurement: Omit<Measurement, 'date'>) => void;
}

export const MeasurementsModal: React.FC<MeasurementsModalProps> = ({
  measurements,
  onAddMeasurement
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
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
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getLatestMeasurement = () => {
    if (measurements.length === 0) return null;
    return measurements[measurements.length - 1];
  };

  const latestMeasurement = getLatestMeasurement();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Ruler className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold text-gray-800 mb-2">Medidas Corporais</h3>
            <p className="text-gray-600 text-sm mb-3">Acompanhe sua evolução</p>
            {latestMeasurement && (
              <div className="space-y-1">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {latestMeasurement.weight}kg
                </Badge>
                <p className="text-xs text-gray-500">
                  Última medição: {formatDate(latestMeasurement.date)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Ruler className="w-6 h-6 text-purple-600" />
            Medidas Corporais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add New Measurement Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Histórico de Medidas</h3>
            <Button 
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Medida
            </Button>
          </div>

          {/* Add New Measurement Form */}
          {isAddingNew && (
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-lg">Adicionar Nova Medida</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Peso (kg)
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
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Salvar Medida
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Measurements History */}
          <div className="space-y-4">
            {measurements.length === 0 ? (
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
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Medida
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {measurements.slice().reverse().map((measurement, index) => (
                  <Card key={index} className="border-2 border-gray-200">
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
                          <span className="font-bold text-purple-600">{measurement.weight}kg</span>
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
                            <span className="font-bold text-blue-600">{measurement.waist}cm</span>
                          </div>
                        )}
                        {measurement.chest > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Peito:</span>
                            <span className="font-bold text-blue-600">{measurement.chest}cm</span>
                          </div>
                        )}
                        {measurement.arms > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Braços:</span>
                            <span className="font-bold text-blue-600">{measurement.arms}cm</span>
                          </div>
                        )}
                        {measurement.thighs > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Coxas:</span>
                            <span className="font-bold text-blue-600">{measurement.thighs}cm</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
