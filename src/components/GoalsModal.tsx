
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Target, Plus, Trophy, Calendar, Weight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'weight' | 'workout' | 'measurement' | 'custom';
  targetValue: number;
  currentValue: number;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

export const GoalsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'weight' as const,
    targetValue: 0,
    deadline: ''
  });

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetValue || !newGoal.deadline) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: 0,
      deadline: newGoal.deadline,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setGoals([...goals, goal]);
    setNewGoal({
      title: '',
      description: '',
      type: 'weight',
      targetValue: 0,
      deadline: ''
    });

    toast({
      title: "Meta Adicionada! 🎯",
      description: `Meta "${goal.title}" foi criada com sucesso!`,
    });
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Weight className="w-5 h-5" />;
      case 'workout': return <Trophy className="w-5 h-5" />;
      case 'measurement': return <Target className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'weight': return 'Peso';
      case 'workout': return 'Treinos';
      case 'measurement': return 'Medidas';
      case 'custom': return 'Personalizada';
      default: return 'Meta';
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800 mb-2">Definir Metas</h3>
            <p className="text-gray-600 text-sm">Estabeleça novos objetivos</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Suas Metas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de Metas Existentes */}
          {goals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Metas Ativas</h3>
              <div className="grid gap-4">
                {goals.map((goal) => (
                  <Card key={goal.id} className="border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getGoalIcon(goal.type)}
                          <div>
                            <h4 className="font-semibold text-gray-800">{goal.title}</h4>
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-blue-600">
                            {getGoalTypeLabel(goal.type)}
                          </span>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{goal.currentValue} / {goal.targetValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${calculateProgress(goal.currentValue, goal.targetValue)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {Math.round(calculateProgress(goal.currentValue, goal.targetValue))}% concluído
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Formulário para Nova Meta */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Nova Meta
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-title">Título da Meta *</Label>
                <Input
                  id="goal-title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Ex: Perder 5kg"
                />
              </div>
              
              <div>
                <Label htmlFor="goal-type">Tipo de Meta</Label>
                <Select value={newGoal.type} onValueChange={(value: any) => setNewGoal({ ...newGoal, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight">Peso</SelectItem>
                    <SelectItem value="workout">Treinos</SelectItem>
                    <SelectItem value="measurement">Medidas</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="goal-target">Valor Alvo *</Label>
                <Input
                  id="goal-target"
                  type="number"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 70"
                />
              </div>
              
              <div>
                <Label htmlFor="goal-deadline">Data Limite *</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="goal-description">Descrição (opcional)</Label>
              <Textarea
                id="goal-description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Descreva sua meta e como pretende alcançá-la..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleAddGoal} className="gradient-bia text-white">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Meta
              </Button>
            </div>
          </div>

          {goals.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma meta definida</h3>
              <p className="text-gray-500">Crie sua primeira meta para começar a acompanhar seu progresso!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
