import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGpsTracker } from '@/hooks/useGpsTracker';
import { useIsMobile } from '@/hooks/use-mobile';
import { Play, Square, MapPin, Pause, Crosshair, ArrowLeft } from 'lucide-react';
import { loadGoogleMaps } from '@/config/maps';
import ActivitySummaryModal from '@/components/activity/ActivitySummaryModal';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useNavigate } from 'react-router-dom';

const SUBTLE_GRAYSCALE_STYLE = [{
  featureType: "administrative",
  elementType: "all",
  stylers: [{
    saturation: "-100"
  }]
}, {
  featureType: "administrative.province",
  elementType: "all",
  stylers: [{
    visibility: "off"
  }]
}, {
  featureType: "landscape",
  elementType: "all",
  stylers: [{
    saturation: -100
  }, {
    lightness: 65
  }, {
    visibility: "on"
  }]
}, {
  featureType: "poi",
  elementType: "all",
  stylers: [{
    saturation: -100
  }, {
    lightness: "50"
  }, {
    visibility: "simplified"
  }]
}, {
  featureType: "road",
  elementType: "all",
  stylers: [{
    saturation: "-100"
  }]
}, {
  featureType: "road.highway",
  elementType: "all",
  stylers: [{
    visibility: "simplified"
  }]
}, {
  featureType: "road.arterial",
  elementType: "all",
  stylers: [{
    lightness: "30"
  }]
}, {
  featureType: "road.local",
  elementType: "all",
  stylers: [{
    lightness: "40"
  }]
}];

const Activity: React.FC<{
  onExit?: () => void;
}> = ({ onExit }) => {
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    isTracking,
    hasLocationPermission,
    currentPosition,
    route,
    stats,
    startTracking,
    stopTracking,
    requestLocationPermission,
    activityType,
    isPaused,
    autoPauseEnabled,
    togglePause,
    setActivityType,
    setAutoPauseEnabled
  } = useGpsTracker(user?.id);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routePolyline = useRef<any>(null);
  const currentMarker = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [follow, setFollow] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastKmRef = useRef(0);
  const {
    request: requestWakeLock,
    release: releaseWakeLock
  } = useWakeLock();
  const startXRef = useRef<number | null>(null);
  const swipingRef = useRef(false);
  const swipeTriggeredRef = useRef(false);
  const [finalStats, setFinalStats] = useState(null);
  const [finalRoute, setFinalRoute] = useState<typeof route>([]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadGoogleMaps();
        if (cancelled) return;
        if (mapRef.current && window.google?.maps) {
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 15,
            center: {
              lat: -23.5505,
              lng: -46.6333
            },
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: true,
            styles: SUBTLE_GRAYSCALE_STYLE
          });
          mapInstance.current = map;
          setIsMapLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load Google Maps', err);
        toast({
          title: 'Erro ao carregar o mapa',
          description: 'Verifique sua conexão ou a chave da API do Google Maps.',
          variant: 'destructive'
        });
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentPosition && mapInstance.current && isMapLoaded && window.google?.maps) {
      if (currentMarker.current) {
        currentMarker.current.setMap(null);
      }
      currentMarker.current = new window.google.maps.Marker({
        position: {
          lat: currentPosition.lat,
          lng: currentPosition.lng
        },
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      if (follow) {
        mapInstance.current.setCenter({
          lat: currentPosition.lat,
          lng: currentPosition.lng
        });
      }
    }
  }, [currentPosition, isMapLoaded, follow]);

  useEffect(() => {
    if (route.length < 1 || !mapInstance.current || !isMapLoaded || !window.google?.maps) return;
    if (!routePolyline.current) {
      const initialPath = route.length >= 2 ? route.slice(0, 2).map(p => ({
        lat: p.lat,
        lng: p.lng
      })) : route.map(p => ({
        lat: p.lat,
        lng: p.lng
      }));
      routePolyline.current = new window.google.maps.Polyline({
        path: initialPath,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 1.0,
        strokeWeight: 4
      });
      routePolyline.current.setMap(mapInstance.current);
      return;
    }
    if (route.length >= 2) {
      const last = route[route.length - 1];
      const path = routePolyline.current.getPath();
      path.push(new window.google.maps.LatLng(last.lat, last.lng));
    }
  }, [route, isMapLoaded]);

  const formatTime = (minutes: number): string => {
    // Convert minutes to total seconds for more accurate calculation
    const totalSeconds = Math.floor(minutes * 60);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (speed: number): string => {
    if (speed < 0.1) return '0.0';
    return speed.toFixed(1);
  };

  const formatPace = (speedKmh: number): string => {
    if (!speedKmh || speedKmh <= 0.3) return "—";
    
    const minPerKm = 60 / speedKmh;
    const mins = Math.floor(minPerKm);
    const secs = Math.round((minPerKm - mins) * 60);

    if (minPerKm > 30) return ">30'00"; // Very slow walking
    if (minPerKm < 2) return "<2'00";   // Very fast running
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const haptic = async (type: 'start' | 'pause' | 'resume' | 'stop') => {
    try {
      if (type === 'start') await Haptics.impact({
        style: ImpactStyle.Heavy
      });
      if (type === 'pause') await Haptics.impact({
        style: ImpactStyle.Medium
      });
      if (type === 'resume') await Haptics.impact({
        style: ImpactStyle.Light
      });
      if (type === 'stop') await Haptics.notification({
        type: NotificationType.Success
      });
    } catch (e) {
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  useEffect(() => {
    document.title = 'Atividade de Corrida | BetzaFit';
  }, []);

  useEffect(() => {
    if (isTracking) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isTracking]);

  useEffect(() => {
    if (!audioEnabled) return;
    const km = Math.floor(stats.distance);
    if (km > lastKmRef.current) {
      lastKmRef.current = km;
      try {
        const msg = new SpeechSynthesisUtterance(`Você completou ${km} quilômetros`);
        window.speechSynthesis?.speak(msg);
      } catch {}
    }
  }, [stats.distance, audioEnabled]);

  useEffect(() => {
    localStorage.setItem('activity:isTracking', String(isTracking));
  }, [isTracking]);

  const handleMainAction = async () => {
    if (!hasLocationPermission && !isTracking) return requestLocationPermission();
    if (!isTracking) {
      await haptic('start');
      await startTracking();
      return;
    }
    if (isPaused) {
      await haptic('resume');
    } else {
      await haptic('pause');
    }
    togglePause();
  };

  const handleTerminate = async () => {
    await haptic('stop');
    
    // Capture current stats and route before stopping tracking
    const currentFinalStats = {
      distance: stats.distance,
      duration: stats.duration,
      averageSpeed: stats.averageSpeed,
      calories: stats.calories
    };
    
    setFinalStats(currentFinalStats);
    setFinalRoute([...route]); // Create a snapshot of the current route
    setShowSummary(true);
  };

  const handleRecenter = () => {
    try {
      if (!mapInstance.current || !isMapLoaded || !currentPosition || !window.google?.maps) return;
      const {
        lat,
        lng
      } = currentPosition;
      if (typeof mapInstance.current.panTo === 'function') {
        mapInstance.current.panTo({
          lat,
          lng
        });
      } else {
        mapInstance.current.setCenter({
          lat,
          lng
        });
      }
      const currentZoom = typeof mapInstance.current.getZoom === 'function' ? mapInstance.current.getZoom() : 15;
      if (currentZoom < 16 && typeof mapInstance.current.setZoom === 'function') {
        mapInstance.current.setZoom(16);
      }
      setFollow(true);
    } catch (e) {
      console.error('Failed to recenter map', e);
    }
  };

  const handleExit = (confirmed: boolean = false) => {
    if (isTracking && !confirmed) {
      const ok = window.confirm('Sair da corrida e voltar ao Dashboard?');
      if (!ok) return;
    }
    if (onExit) {
      onExit();
    } else {
      navigate('/dashboard');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    try {
      const x = e.touches[0]?.clientX ?? 0;
      if (x <= 24) {
        startXRef.current = x;
        swipingRef.current = true;
        swipeTriggeredRef.current = false;
      }
    } catch {}
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingRef.current || startXRef.current === null) return;
    const dx = (e.touches[0]?.clientX ?? 0) - startXRef.current;
    if (dx > 80 && !swipeTriggeredRef.current) {
      swipeTriggeredRef.current = true;
      haptic('resume');
      handleExit();
    }
  };

  const handleTouchEnd = () => {
    swipingRef.current = false;
    startXRef.current = null;
    swipeTriggeredRef.current = false;
  };

  return (
    <div 
      className="h-[100dvh] bg-background relative overflow-hidden fixed inset-0 z-50" 
      style={{
        touchAction: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh'
      }} 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
    >
      <div ref={mapRef} className="w-full h-full absolute inset-0" />

      {!onExit && (
        <div className="fixed left-4 z-50" style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}>
          <Button size="icon-lg" variant="native-glass" onClick={() => handleExit()} aria-label="Voltar">
            <ArrowLeft />
          </Button>
        </div>
      )}

      <div className="absolute left-4 right-4 z-10 space-y-2" style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup 
            type="single" 
            value={activityType} 
            onValueChange={v => v && setActivityType(v as 'corrida' | 'caminhada')} 
            className="bg-background/90 backdrop-blur-sm rounded-md p-1"
          >
            <ToggleGroupItem value="corrida" aria-label="Corrida">Corrida</ToggleGroupItem>
            <ToggleGroupItem value="caminhada" aria-label="Caminhada">Caminhada</ToggleGroupItem>
          </ToggleGroup>
          
          <div className="flex items-center gap-2">
            {currentPosition?.accuracy !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Crosshair className="h-3.5 w-3.5" />
                {Math.round(currentPosition.accuracy)} m
              </Badge>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Pausa auto</span>
              <Switch checked={autoPauseEnabled} onCheckedChange={setAutoPauseEnabled} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Seguir</span>
              <Switch checked={follow} onCheckedChange={setFollow} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Áudio</span>
              <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg bg-background/95 backdrop-blur-md shadow-lg border border-border/50 p-3 sm:p-2 text-center">
            <div className="text-base font-semibold tracking-tight text-foreground">{stats.distance.toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground font-medium">km</div>
          </div>
          <div className="rounded-lg bg-background/95 backdrop-blur-md shadow-lg border border-border/50 p-3 sm:p-2 text-center">
            <div className="text-base font-semibold tracking-tight text-foreground">{formatTime(stats.duration)}</div>
            <div className="text-[10px] text-muted-foreground font-medium">tempo</div>
          </div>
          <div className="rounded-lg bg-background/95 backdrop-blur-md shadow-lg border border-border/50 p-3 sm:p-2 text-center">
            <div className="text-base font-semibold tracking-tight text-foreground">
              {formatPace(isTracking ? stats.currentSpeed : stats.averageSpeed)}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">ritmo min/km</div>
          </div>
          <div className="rounded-lg bg-background/95 backdrop-blur-md shadow-lg border border-border/50 p-3 sm:p-2 text-center">
            <div className="text-base font-semibold tracking-tight text-foreground">{formatSpeed(stats.currentSpeed)}</div>
            <div className="text-[10px] text-muted-foreground font-medium">km/h atual</div>
          </div>
        </div>

        {isTracking && (
          <div className="rounded-md bg-background/80 backdrop-blur p-3 sm:p-2 text-center">
            <div className="text-base font-semibold tracking-tight text-primary">{stats.calories}</div>
            <div className="text-[10px] text-muted-foreground">calorias queimadas</div>
          </div>
        )}
      </div>

      <div className="fixed right-4 z-50" style={{ bottom: `calc(env(safe-area-inset-bottom) + ${isMobile ? '120px' : '140px'})` }}>
        <Button size="icon-lg" variant="native-glass" onClick={handleRecenter} aria-label="Recentrar mapa">
          <Crosshair />
        </Button>
      </div>

      <div className="fixed inset-x-4 z-50 space-y-3" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {!hasLocationPermission && !isTracking ? (
          <Button onClick={requestLocationPermission} size={isMobile ? "2xl" : "3xl"} variant="native-primary" className="w-full">
            <MapPin className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
            Permitir Localização
          </Button>
        ) : (
          <>
            <Button 
              onClick={handleMainAction} 
              size={isMobile ? "2xl" : "3xl"} 
              variant={!isTracking ? 'native-success' : isPaused ? 'native-success' : 'warning'} 
              className="w-full"
            >
              {!isTracking || isPaused ? (
                <>
                  <Play className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`} />
                  {isTracking ? 'Continuar' : activityType === 'corrida' ? 'Iniciar Corrida' : 'Iniciar Caminhada'}
                </>
              ) : (
                <>
                  <Pause className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`} />
                  Pausar
                </>
              )}
            </Button>

            {isTracking ? (
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleExit()} size="lg" variant="native-secondary" className="w-full">
                  Voltar
                </Button>
                <Button onClick={handleTerminate} size="lg" variant="native-destructive" className="w-full">
                  <Square className="h-5 w-5" />
                  Terminar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1">
                <Button onClick={() => handleExit(true)} size="lg" variant="native-secondary" className="w-full">
                  Sair
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ActivitySummaryModal 
        open={showSummary} 
        onOpenChange={setShowSummary} 
        stats={finalStats || {
          distance: stats.distance,
          duration: stats.duration,
          averageSpeed: stats.averageSpeed,
          calories: stats.calories
        }} 
        route={finalRoute.length > 0 ? finalRoute : route}
        confirming={saving} 
        onConfirm={async () => {
          setSaving(true);
          const result = await stopTracking();
          setSaving(false);
          setShowSummary(false);
          setFinalStats(null);
          setFinalRoute([]);
          if (result) {
            toast({
              title: 'Atividade Concluída! 🏃‍♂️',
              description: `Distância: ${result.distance.toFixed(2)}km • Tempo: ${Math.round(result.duration)}min`
            });
          }
        }} 
      />
    </div>
  );
};

export default Activity;
