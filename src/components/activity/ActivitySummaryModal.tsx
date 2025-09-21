import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { buildGpxFromPositions, downloadGpx } from '@/utils/gpx';
import { useIsMobile } from '@/hooks/use-mobile';
import ActivityStatsChart from './ActivityStatsChart';
import ActivitySocialShare from './ActivitySocialShare';
import ActivityMapView from './ActivityMapView';
import { Calendar, Clock, MapPin, Download, Star, MessageSquare, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateStoryImage, shareToInstagramStories } from '@/utils/instagramStory';
interface SummaryStats {
  distance: number;
  duration: number; // minutes
  averageSpeed: number; // km/h
  calories: number;
}
interface Position {
  lat: number;
  lng: number;
  timestamp?: number;
}
interface ActivitySummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  confirming?: boolean;
  stats: SummaryStats;
  route: Position[];
}
const ActivitySummaryModal: React.FC<ActivitySummaryModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  confirming,
  stats,
  route
}) => {
  const [activeTab, setActiveTab] = useState('resumo');
  const [savingImage, setSavingImage] = useState(false);
  const isMobile = useIsMobile();

  const handleSaveStory = async () => {
    if (route.length < 2) {
      toast({
        title: "Rota insuficiente",
        description: "É necessário um percurso com pelo menos 2 pontos para gerar a imagem.",
        variant: "destructive"
      });
      return;
    }

    setSavingImage(true);
    
    try {
      toast({
        title: "Gerando imagem...",
        description: "Criando sua imagem personalizada do percurso"
      });

      const imageDataUrl = await generateStoryImage(route, stats, activityType, activityDate);
      
      const result = await shareToInstagramStories(imageDataUrl, `${activityType} - ${activityDate.toLocaleDateString('pt-BR')}`);
      
      if (result.method === 'download') {
        toast({
          title: "Imagem salva!",
          description: result.instructions || "Imagem baixada com sucesso"
        });
      } else {
        toast({
          title: "Compartilhando...",
          description: "Abrindo opções de compartilhamento"
        });
      }
    } catch (error) {
      console.error('Error generating route image:', error);
      toast({
        title: "Erro ao gerar imagem",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setSavingImage(false);
    }
  };
  const formatTime = (minutes: number): string => {
    // Convert minutes to total seconds for accurate calculation
    const totalSeconds = Math.floor(minutes * 60);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const activityDate = new Date();
  const activityType = 'Corrida';
  const addToFavorites = () => {
    toast({
      title: "Adicionado aos favoritos!",
      description: "Esta atividade foi salva nos seus favoritos."
    });
  };
  const addNotes = () => {
    toast({
      title: "Funcionalidade em breve",
      description: "Em breve você poderá adicionar notas às suas atividades."
    });
  };
  if (isMobile) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 w-screen h-[100dvh] max-w-none max-h-none p-0 m-0 border-0 rounded-none bg-background flex flex-col overscroll-contain">
          {/* Mobile Header - Fixed */}
          <div className="flex-shrink-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white" style={{
          paddingTop: 'env(safe-area-inset-top)'
        }}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold truncate">{activityType} Completa</h1>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Calendar className="w-3 h-3" />
                    <span>{activityDate.toLocaleDateString('pt-BR')}</span>
                    <Clock className="w-3 h-3 ml-2" />
                    <span>{activityDate.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20 rounded-full p-2 h-auto ml-2 flex-shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="px-4 pb-4">
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {stats.distance.toFixed(2)} km
              </Badge>
            </div>
          </div>

          {/* Mobile Content - Scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              
              {/* Tab List - Fixed */}
              <div className="flex-shrink-0 px-4 pt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
                  <TabsTrigger value="mapa" className="text-xs">Mapa</TabsTrigger>
                  <TabsTrigger value="analise" className="text-xs">Análise</TabsTrigger>
                  <TabsTrigger value="compartilhar" className="text-xs">Compartilhar</TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                
                <TabsContent value="resumo" className="space-y-4 m-0">
                  {/* Estatísticas principais */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stats.distance.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Distância (km)</div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary-foreground">{formatTime(stats.duration)}</div>
                        <div className="text-sm text-muted-foreground">Tempo</div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent-foreground">{stats.averageSpeed.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Vel. Média (km/h)</div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">{stats.calories}</div>
                        <div className="text-sm text-muted-foreground">Calorias</div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4 bg-card border border-border">
                    <h3 className="font-medium text-card-foreground mb-3">Informações da Atividade</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="font-medium text-card-foreground">{activityType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pontos GPS:</span>
                        <span className="font-medium text-card-foreground">{route.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Início:</span>
                        <span className="font-medium text-card-foreground">
                          {activityDate.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fim:</span>
                        <span className="font-medium text-card-foreground">
                          {new Date(activityDate.getTime() + stats.duration * 60000).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        </span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="mapa" className="m-0 h-full">
                  <div className="h-full min-h-[400px] flex flex-col">
                    <div className="flex-1 min-h-[300px]">
                      <ActivityMapView route={route} stats={stats} isActive={activeTab === 'mapa'} />
                    </div>
                    
                    {/* Save Route Button - Mobile */}
                    <div className="mt-4 px-2">
                      <Button
                        onClick={handleSaveStory}
                        disabled={savingImage || route.length < 2}
                        className="w-full"
                        variant="outline"
                      >
                        {savingImage ? (
                          <Download className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {savingImage ? 'Gerando imagem...' : 'Salvar percurso (imagem)'}
                      </Button>
                      {route.length < 2 && (
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Mínimo 2 pontos necessários
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analise" className="m-0">
                  <ActivityStatsChart route={route} stats={stats} />
                </TabsContent>

                <TabsContent value="compartilhar" className="m-0">
                  <ActivitySocialShare stats={stats} activityType={activityType} date={activityDate} route={route} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Mobile Footer - Fixed */}
          <div className="flex-shrink-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm" style={{
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            <div className="flex flex-wrap gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={addToFavorites} className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favoritar
              </Button>
              
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                não salvar
              </Button>
              <Button onClick={onConfirm} disabled={!!confirming} className="flex-1 bg-primary text-primary-foreground">
                {confirming ? 'Salvando...' : 'Salvar Atividade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-2xl" aria-label="Resumo da Atividade">
        
        {/* Desktop Header */}
        <DialogHeader className="flex-shrink-0 p-4 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle asChild>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {activityType} Completa
                </h1>
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {activityDate.toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {activityDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {stats.distance.toFixed(2)} km
            </Badge>
          </div>
        </DialogHeader>

        {/* Desktop Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            
            <div className="flex-shrink-0 px-4 pt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="mapa">Mapa</TabsTrigger>
                <TabsTrigger value="analise">Análise</TabsTrigger>
                <TabsTrigger value="compartilhar">Compartilhar</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              
              <TabsContent value="resumo" className="space-y-4 m-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.distance.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Distância (km)</div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary-foreground">{formatTime(stats.duration)}</div>
                      <div className="text-sm text-muted-foreground">Tempo</div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-foreground">{stats.averageSpeed.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Vel. Média (km/h)</div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">{stats.calories}</div>
                      <div className="text-sm text-muted-foreground">Calorias</div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 bg-card border border-border">
                  <h3 className="font-medium text-card-foreground mb-3">Informações da Atividade</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="ml-2 font-medium text-card-foreground">{activityType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pontos GPS:</span>
                      <span className="ml-2 font-medium text-card-foreground">{route.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <span className="ml-2 font-medium text-card-foreground">
                        {activityDate.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fim:</span>
                      <span className="ml-2 font-medium text-card-foreground">
                        {new Date(activityDate.getTime() + stats.duration * 60000).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      </span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="mapa" className="m-0 h-full">
                <div className="h-full min-h-[400px] flex flex-col">
                  <div className="flex-1 min-h-[300px]">
                    <ActivityMapView route={route} stats={stats} isActive={activeTab === 'mapa'} />
                  </div>
                  
                  {/* Save Route Button - Desktop */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleSaveStory}
                      disabled={savingImage || route.length < 2}
                      variant="outline"
                    >
                      {savingImage ? (
                        <Download className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {savingImage ? 'Gerando imagem...' : 'Salvar percurso (imagem)'}
                    </Button>
                  </div>
                  {route.length < 2 && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      Mínimo 2 pontos necessários
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analise" className="m-0">
                <ActivityStatsChart route={route} stats={stats} />
              </TabsContent>

              <TabsContent value="compartilhar" className="m-0">
                <ActivitySocialShare stats={stats} activityType={activityType} date={activityDate} route={route} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Desktop Footer */}
        <DialogFooter className="flex-shrink-0 p-4 border-t border-border bg-background flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={addToFavorites} className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favoritar
          </Button>
          <Button variant="outline" size="sm" onClick={addNotes} className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Adicionar Nota
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadGpx('atividade.gpx', buildGpxFromPositions(route))} disabled={route.length < 2} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar GPX
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            não salvar
          </Button>
          <Button onClick={onConfirm} disabled={!!confirming} className="bg-primary text-primary-foreground">
            {confirming ? 'Salvando...' : 'Salvar Atividade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default ActivitySummaryModal;