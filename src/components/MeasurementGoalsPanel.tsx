import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Calendar, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  measurement_type: string;
  target_value: number;
  current_value?: number;
  target_date?: string;
  achieved: boolean;
  achieved_date?: string;
  created_at: string;
}

interface MeasurementGoalsPanelProps {
  measurements: any[];
  onGoalUpdate?: () => void;
}

const MEASUREMENT_TYPES = {
  weight: { label: 'Peso', unit: 'kg' },
  waist_navel: { label: 'Cintura', unit: 'cm' },
  body_fat: { label: 'Gordura Corporal', unit: '%' },
  chest: { label: 'Peito', unit: 'cm' },
  right_arm_flexed: { label: 'Bíceps Direito', unit: 'cm' },
  left_arm_flexed: { label: 'Bíceps Esquerdo', unit: 'cm' },
  right_thigh_proximal: { label: 'Coxa Direita', unit: 'cm' },
  left_thigh_proximal: { label: 'Coxa Esquerda', unit: 'cm' },
  hips: { label: 'Quadril', unit: 'cm' }
};

export const MeasurementGoalsPanel: React.FC<MeasurementGoalsPanelProps> = ({ measurements, onGoalUpdate }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    measurement_type: '',
    target_value: '',
    target_date: ''
  });

  const fetchGoals = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('measurement_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user?.id]);

  const getCurrentValue = (measurementType: string): number | null => {
    if (measurements.length === 0) return null;
    const latest = measurements[0];
    return latest[measurementType] || null;
  };

  const calculateProgress = (goal: Goal): number => {
    const currentValue = getCurrentValue(goal.measurement_type);
    if (!currentValue) return 0;

    // For weight and waist, lower is better (if target < current)
    // For muscle measurements, higher is better
    const isReductionGoal = goal.target_value < (goal.current_value || currentValue);
    
    if (isReductionGoal) {
      const totalChange = (goal.current_value || currentValue) - goal.target_value;
      const currentChange = (goal.current_value || currentValue) - currentValue;
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    } else {
      const totalChange = goal.target_value - (goal.current_value || currentValue);
      const currentChange = currentValue - (goal.current_value || currentValue);
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    }
  };

  const getDaysRemaining = (targetDate?: string): number | null => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.measurement_type || !formData.target_value) return;

    setLoading(true);
    try {
      const currentValue = getCurrentValue(formData.measurement_type);
      
      const goalData = {
        user_id: user.id,
        measurement_type: formData.measurement_type,
        target_value: parseFloat(formData.target_value),
        current_value: currentValue,
        target_date: formData.target_date || null,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('measurement_goals')
          .update(goalData)
          .eq('id', editingGoal.id);
        
        if (error) throw error;
        toast({ title: 'Meta atualizada!', description: 'Sua meta foi atualizada com sucesso.' });
      } else {
        const { error } = await supabase
          .from('measurement_goals')
          .insert([goalData]);
        
        if (error) throw error;
        toast({ title: 'Meta criada!', description: 'Nova meta adicionada com sucesso.' });
      }

      setIsDialogOpen(false);
      setEditingGoal(null);
      setFormData({ measurement_type: '', target_value: '', target_date: '' });
      fetchGoals();
      onGoalUpdate?.();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar meta. Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('measurement_goals')
        .delete()
        .eq('id', goalId);
      
      if (error) throw error;
      
      toast({ title: 'Meta excluída', description: 'Meta removida com sucesso.' });
      fetchGoals();
      onGoalUpdate?.();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir meta.', variant: 'destructive' });
    }
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      measurement_type: goal.measurement_type,
      target_value: goal.target_value.toString(),
      target_date: goal.target_date || ''
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Metas de Medidas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => {
                setEditingGoal(null);
                setFormData({ measurement_type: '', target_value: '', target_date: '' });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="measurement_type">Tipo de Medida</Label>
                  <Select value={formData.measurement_type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, measurement_type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a medida" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MEASUREMENT_TYPES).map(([key, { label, unit }]) => (
                        <SelectItem key={key} value={key}>
                          {label} ({unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="target_value">Valor Alvo</Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.1"
                    value={formData.target_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                    placeholder="Ex: 75.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="target_date">Data Alvo (Opcional)</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Salvando...' : editingGoal ? 'Atualizar' : 'Criar Meta'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma meta definida ainda.</p>
            <p className="text-sm">Crie sua primeira meta para acompanhar seu progresso!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = calculateProgress(goal);
              const currentValue = getCurrentValue(goal.measurement_type);
              const daysRemaining = getDaysRemaining(goal.target_date);
              const measurementInfo = MEASUREMENT_TYPES[goal.measurement_type as keyof typeof MEASUREMENT_TYPES];
              const isAchieved = progress >= 100;

              return (
                <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{measurementInfo?.label}</h4>
                      {isAchieved && (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          Conquistada! 🎉
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(goal)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Atual: {currentValue ? `${currentValue} ${measurementInfo?.unit}` : 'N/A'}
                      </span>
                      <span>
                        Meta: {goal.target_value} {measurementInfo?.unit}
                      </span>
                    </div>
                    
                    <Progress value={progress} className="h-2" />
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{progress.toFixed(1)}% concluído</span>
                      {daysRemaining !== null && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysRemaining > 0 ? (
                            <span>{daysRemaining} dias restantes</span>
                          ) : daysRemaining === 0 ? (
                            <span>Hoje é o dia!</span>
                          ) : (
                            <span className="text-destructive">
                              {Math.abs(daysRemaining)} dias em atraso
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};