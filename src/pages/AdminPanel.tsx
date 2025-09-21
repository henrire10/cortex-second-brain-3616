
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Shield, Settings, Users } from 'lucide-react';
import { AutomatedWorkoutManager } from '@/components/AutomatedWorkoutManager';
import { WhatsAppTestManager } from '@/components/WhatsAppTestManager';

interface SystemSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
}

const AdminPanel = () => {
  const { isAdmin, loading } = useAdmin();
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    description: ''
  });

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      const mappedSettings = data?.map(item => ({
        id: item.id,
        setting_key: item.setting_key,
        setting_value: item.setting_value,
        description: item.description || ''
      })) || [];

      setSettings(mappedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações.",
        variant: "destructive"
      });
    }
  };

  const handleAddSetting = async () => {
    if (!newSetting.setting_key || !newSetting.setting_value) {
      toast({
        title: "Erro",
        description: "Chave e valor são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('system_settings')
        .insert({
          setting_key: newSetting.setting_key,
          setting_value: newSetting.setting_value,
          description: newSetting.description
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração adicionada com sucesso!"
      });

      setNewSetting({ setting_key: '', setting_value: '', description: '' });
      fetchSettings();
    } catch (error) {
      console.error('Error adding setting:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar configuração.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('id', settingId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso!"
      });

      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover configuração.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar o painel administrativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs defaultValue="whatsapp" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="whatsapp">WhatsApp System</TabsTrigger>
              <TabsTrigger value="automation">Automação</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="space-y-6">
              <WhatsAppTestManager />
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <AutomatedWorkoutManager />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* System Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configurações do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="setting_key">Chave da Configuração</Label>
                      <Input
                        id="setting_key"
                        value={newSetting.setting_key}
                        onChange={(e) => setNewSetting({ ...newSetting, setting_key: e.target.value })}
                        placeholder="ex: max_users, maintenance_mode"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="setting_value">Valor</Label>
                      <Input
                        id="setting_value"
                        value={newSetting.setting_value}
                        onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.target.value })}
                        placeholder="Valor da configuração"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        value={newSetting.description}
                        onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                        placeholder="Descrição da configuração"
                        rows={3}
                      />
                    </div>
                    
                    <Button onClick={handleAddSetting} className="w-full">
                      Adicionar Configuração
                    </Button>
                  </CardContent>
                </Card>

                {/* Current Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Configurações Atuais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {settings.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Nenhuma configuração encontrada.
                        </p>
                      ) : (
                        settings.map((setting) => (
                          <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{setting.setting_key}</h4>
                              <p className="text-sm text-gray-600">
                                Valor: {JSON.stringify(setting.setting_value)}
                              </p>
                              {setting.description && (
                                <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteSetting(setting.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
