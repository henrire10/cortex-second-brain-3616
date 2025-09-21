import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

interface ActivityStats {
  distance: number;
  duration: number;
  currentSpeed: number;
  averageSpeed: number;
  calories: number;
}

interface ActivityResult {
  distance: number;
  duration: number;
  currentSpeed: number;
  averageSpeed: number;
  calories: number;
  id: string;
}

export const useGpsTracker = (userId: string | undefined) => {
  // Core tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [route, setRoute] = useState<Position[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    distance: 0,
    duration: 0,
    currentSpeed: 0,
    averageSpeed: 0,
    calories: 0
  });

  // Activity settings
  const [activityType, setActivityType] = useState<'corrida' | 'caminhada'>('corrida');
  const [isPaused, setIsPaused] = useState(false);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(true);
  
  // Timing state
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  
  // Speed smoothing (optimized)
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [lowSpeedTicks, setLowSpeedTicks] = useState(0);
  
  // Advanced speed smoothing constants
  const SPEED_HISTORY_SIZE = 7; // Optimal window size
  const SPEED_WEIGHTS = [0.3, 0.25, 0.2, 0.15, 0.1]; // Recent points have more weight

  // GPS watch
  const [watchId, setWatchId] = useState<number | null>(null);

  // Calculate distance between two positions
  const calculateDistance = useCallback((pos1: Position, pos2: Position): number => {
    // Relaxed drift filter - ignore minimal movements (FIXED - from 3m to 5m)
    const latDiff = Math.abs(pos2.lat - pos1.lat);
    const lngDiff = Math.abs(pos2.lng - pos1.lng);
    const minMovement = 0.00005; // ~5 meters (was 3 meters)
    
    if (latDiff < minMovement && lngDiff < minMovement) {
      return 0;
    }

    // Use Google Maps if available, otherwise Haversine
    if (window.google?.maps?.geometry?.spherical) {
      try {
        const lat1 = new window.google.maps.LatLng(pos1.lat, pos1.lng);
        const lat2 = new window.google.maps.LatLng(pos2.lat, pos2.lng);
        return window.google.maps.geometry.spherical.computeDistanceBetween(lat1, lat2) / 1000; // km
      } catch (error) {
        console.warn('Google Maps geometry failed, using Haversine:', error);
      }
    }
    
    // Haversine fallback
    const R = 6371; // Earth radius in km
    const toRad = (value: number) => (value * Math.PI) / 180;
    
    const dLat = toRad(pos2.lat - pos1.lat);
    const dLng = toRad(pos2.lng - pos1.lng);
    const lat1Rad = toRad(pos1.lat);
    const lat2Rad = toRad(pos2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // km
  }, []);

  // Calculate calories (simplified)
  const calculateCalories = useCallback((distance: number): number => {
    return Math.round(distance * 60); // ~60 calories per km
  }, []);

  // Advanced speed smoothing function
  const smoothSpeed = useCallback((rawSpeed: number): number => {
    // Activity-specific speed limits (more realistic)
    const maxSpeed = activityType === 'corrida' ? 25 : 8; // km/h
    const minSpeed = 0.1; // km/h (to avoid zero division)
    
    // Filter out implausible speeds
    if (rawSpeed < minSpeed || rawSpeed > maxSpeed) {
      console.log(`🚫 Speed filtered: ${rawSpeed.toFixed(2)} km/h (outside ${minSpeed}-${maxSpeed} range)`);
      return 0;
    }
    
    return rawSpeed;
  }, [activityType]);

  // Calculate weighted moving average
  const calculateWeightedAverage = useCallback((speeds: number[]): number => {
    if (speeds.length === 0) return 0;
    if (speeds.length === 1) return speeds[0];
    
    // Use weights for recent points (most recent has highest weight)
    const weights = SPEED_WEIGHTS.slice(0, speeds.length);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let weightedSum = 0;
    for (let i = 0; i < speeds.length; i++) {
      weightedSum += speeds[speeds.length - 1 - i] * weights[i];
    }
    
    return weightedSum / totalWeight;
  }, []);

  // Update stats when route or timing changes (FIXED - removed circular dependencies)
  useEffect(() => {
    if (!isTracking || !startTime) return;

    const now = Date.now();
    
    // Calculate active duration (FIXED - better pause handling)
    let activeMs = now - startTime.getTime() - pausedMs;
    if (isPaused && pauseStartTime) {
      activeMs -= (now - pauseStartTime.getTime());
    }
    const duration = Math.max(activeMs, 1000) / 1000 / 60; // minutes (min 1 second to avoid division by zero)

    // Calculate total distance
    let totalDistance = 0;
    if (route.length >= 2) {
      for (let i = 1; i < route.length; i++) {
        totalDistance += calculateDistance(route[i - 1], route[i]);
      }
    }

    // Calculate current speed (OPTIMIZED - advanced smoothing)
    let currentSpeed = 0;
    if (route.length >= 2 && !isPaused) {
      const lastTwo = route.slice(-2);
      const timeDiff = (lastTwo[1].timestamp - lastTwo[0].timestamp) / 1000; // seconds
      const distanceDiff = calculateDistance(lastTwo[0], lastTwo[1]);
      
      if (timeDiff > 0.5 && distanceDiff > 0) { // At least 0.5 second of data
        const rawSpeed = (distanceDiff / timeDiff) * 3600; // km/h
        const filteredSpeed = smoothSpeed(rawSpeed);
        
        if (filteredSpeed > 0) {
          // Advanced moving average with optimal window size
          setSpeedHistory(prev => {
            const newSpeedHistory = [...prev, filteredSpeed].slice(-SPEED_HISTORY_SIZE);
            const smoothedSpeed = calculateWeightedAverage(newSpeedHistory);
            currentSpeed = smoothedSpeed;
            
            // Debug logging
            console.log(`⚡ Speed: Raw=${rawSpeed.toFixed(2)}, Filtered=${filteredSpeed.toFixed(2)}, Smoothed=${smoothedSpeed.toFixed(2)} km/h`);
            
            return newSpeedHistory;
          });
        }
      }
    }

    // Calculate average speed (FIXED - correct formula)
    const averageSpeed = totalDistance > 0 && duration > 0 ? (totalDistance / (duration / 60)) : 0; // km/h

    // Calculate calories
    const calories = calculateCalories(totalDistance);

    // Update stats (FIXED - use calculated values)
    setStats(prev => ({
      distance: totalDistance,
      duration,
      currentSpeed: Math.max(0, currentSpeed || prev.currentSpeed),
      averageSpeed,
      calories
    }));

  }, [route.length, isTracking, startTime, pausedMs, isPaused, pauseStartTime, activityType, calculateDistance, calculateCalories, smoothSpeed, calculateWeightedAverage]);

  // Separate effect for auto-pause logic (FIXED - avoid conflicts)
  useEffect(() => {
    if (!autoPauseEnabled || !isTracking || route.length < 2) return;

    const pauseThreshold = activityType === 'corrida' ? 2.0 : 1.0; // km/h (relaxed)
    const resumeThreshold = activityType === 'corrida' ? 3.5 : 2.0; // km/h
    
    // Auto-pause logic
    if (!isPaused && stats.currentSpeed < pauseThreshold && stats.currentSpeed > 0) {
      setLowSpeedTicks(prev => {
        const newTicks = prev + 1;
        if (newTicks >= 4) { // 4 consecutive low speed readings (more stable)
          setIsPaused(true);
          setPauseStartTime(new Date());
          setLowSpeedTicks(0);
          toast({ title: 'Pausa automática', description: 'Velocidade baixa detectada.' });
        }
        return newTicks;
      });
    } else if (stats.currentSpeed > resumeThreshold) {
      setLowSpeedTicks(0);
    }

    // Auto-resume logic
    if (isPaused && stats.currentSpeed > resumeThreshold) {
      const now = new Date();
      if (pauseStartTime) {
        setPausedMs(prev => prev + (now.getTime() - pauseStartTime.getTime()));
      }
      setPauseStartTime(null);
      setIsPaused(false);
      setLowSpeedTicks(0);
      toast({ title: 'Retomado', description: 'Movimento detectado.' });
    }

  }, [stats.currentSpeed, autoPauseEnabled, isTracking, isPaused, pauseStartTime, activityType]);

  // GPS position tracking effect
  useEffect(() => {
    if (!isTracking || isPaused) return;

    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const pos: Position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
        };

        console.log('📍 New GPS position:', {
          lat: pos.lat.toFixed(6),
          lng: pos.lng.toFixed(6),
          accuracy: pos.accuracy
        });

        setCurrentPosition(pos);
        
        // GPS filters (FIXED - much more permissive for urban environments)
        const shouldAddToRoute = () => {
          // Very relaxed accuracy filter for urban/indoor environments
          const maxAccuracy = activityType === 'corrida' ? 1500 : 2000; // Much more permissive
          if (pos.accuracy !== undefined && pos.accuracy > maxAccuracy) {
            console.log('⏭️ Ignored due to very low accuracy:', pos.accuracy);
            return false;
          }
          
          // Check for implausible speed and distance if we have previous points
          if (route.length > 0) {
            const last = route[route.length - 1];
            const timeDiff = (pos.timestamp - last.timestamp) / 1000; // seconds
            const dist = calculateDistance(last, pos); // km
            
            // Skip if too close in time (< 0.5 second) - more permissive
            if (timeDiff < 0.5) {
              console.log('⏭️ Ignored due to time too close:', timeDiff);
              return false;
            }
            
            // Very relaxed speed filter - 80 km/h (even for cars on highways)
            const speed = (dist / timeDiff) * 3600; // km/h
            if (speed > 80) {
              console.log('⏭️ Ignored due to implausible speed:', speed.toFixed(1), 'km/h');
              return false;
            }
          }
          
          return true;
        };

        if (shouldAddToRoute()) {
          setRoute(prev => [...prev, pos]);
        }
      },
      (error) => {
        console.error('GPS tracking error:', error);
        toast({
          title: 'Erro no GPS',
          description: 'Problema ao rastrear sua posição.',
          variant: 'destructive',
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 2000 // Reduced from 3000 to 2000ms for fresher data
      }
    );

    setWatchId(newWatchId);

    return () => {
      if (newWatchId) {
        navigator.geolocation.clearWatch(newWatchId);
      }
    };
  }, [isTracking, isPaused, activityType, calculateDistance]); // FIXED - removed route dependency to prevent loops

  // Check location permission
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'GPS não suportado',
        description: 'Seu dispositivo não suporta localização GPS.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      const hasPermission = permission.state === 'granted';
      setHasLocationPermission(hasPermission);
      return hasPermission;
    } catch (error) {
      console.log('Error checking permission:', error);
      return false;
    }
  }, []);

  // Request location permission
  const requestLocationPermission = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: Position = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          setCurrentPosition(pos);
          setHasLocationPermission(true);
          resolve(true);
        },
        (error) => {
          console.error('Location error:', error);
          toast({
            title: 'Erro de localização',
            description: 'Não foi possível obter sua localização atual.',
            variant: 'destructive',
          });
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
    });
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!userId) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para rastrear suas atividades.',
        variant: 'destructive',
      });
      return false;
    }

    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return false;
    }

    console.log('🚀 Starting GPS tracking...');
    
    // Reset all state
    const now = new Date();
    setIsTracking(true);
    setStartTime(now);
    setRoute([]);
    setIsPaused(false);
    setPausedMs(0);
    setPauseStartTime(null);
    setLowSpeedTicks(0);
    setSpeedHistory([]);
    setStats({
      distance: 0,
      duration: 0,
      currentSpeed: 0,
      averageSpeed: 0,
      calories: 0
    });

    toast({
      title: 'Rastreamento iniciado',
      description: 'Sua atividade está sendo rastreada!',
    });

    return true;
  }, [userId, hasLocationPermission, requestLocationPermission]);

  // Toggle pause
  const togglePause = useCallback(() => {
    if (!isTracking) return;
    
    if (isPaused) {
      // Resume
      const now = new Date();
      if (pauseStartTime) {
        setPausedMs(prev => prev + (now.getTime() - pauseStartTime.getTime()));
      }
      setPauseStartTime(null);
      setIsPaused(false);
      setLowSpeedTicks(0);
      toast({ title: 'Rastreamento retomado' });
    } else {
      // Pause
      setIsPaused(true);
      setPauseStartTime(new Date());
      toast({ title: 'Rastreamento pausado' });
    }
  }, [isTracking, isPaused, pauseStartTime]);

  // Stop tracking
  const stopTracking = useCallback(async (): Promise<ActivityResult | null> => {
    if (!isTracking || !startTime || !userId) return null;

    console.log('🛑 Stopping GPS tracking...');

    // Clear GPS watch
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    // Final pause duration if stopped while paused
    let finalPausedMs = pausedMs;
    if (isPaused && pauseStartTime) {
      const endTime = new Date();
      finalPausedMs += (endTime.getTime() - pauseStartTime.getTime());
    }

    // Calculate final stats
    const endTime = new Date();
    const activeMs = endTime.getTime() - startTime.getTime() - finalPausedMs;
    const duration = Math.max(activeMs, 0) / 1000 / 60; // minutes

    let totalDistance = 0;
    if (route.length >= 2) {
      for (let i = 1; i < route.length; i++) {
        totalDistance += calculateDistance(route[i - 1], route[i]);
      }
    }

    const averageSpeed = duration > 0 ? (totalDistance / duration) * 60 : 0; // km/h
    const calories = calculateCalories(totalDistance);

    const finalStats = {
      distance: totalDistance,
      duration,
      currentSpeed: stats.currentSpeed,
      averageSpeed,
      calories,
    };

    try {
      const routeData = route.map(pos => ({
        lat: pos.lat,
        lng: pos.lng,
        timestamp: pos.timestamp
      }));

      const { data, error } = await supabase
        .from('outdoor_activities')
        .insert({
          user_id: userId,
          type: activityType,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          distance_km: finalStats.distance,
          duration_minutes: Math.round(finalStats.duration),
          avg_speed_kmh: finalStats.averageSpeed,
          calories_burned: finalStats.calories,
          route_path: routeData as any
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Atividade salva',
        description: `${activityType} de ${finalStats.distance.toFixed(2)}km concluída!`,
      });

      // Reset state
      setIsTracking(false);
      setStartTime(null);
      
      return { ...finalStats, id: data.id };
      
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar sua atividade.',
        variant: 'destructive',
      });
      return null;
    }
  }, [isTracking, startTime, userId, watchId, pausedMs, isPaused, pauseStartTime, route, stats.currentSpeed, calculateDistance, calculateCalories, activityType]);

  // Initialize permission check
  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  return {
    // State
    isTracking,
    hasLocationPermission,
    currentPosition,
    route,
    stats,
    startTime,
    activityType,
    isPaused,
    autoPauseEnabled,
    
    // Actions
    startTracking,
    stopTracking,
    togglePause,
    requestLocationPermission,
    setActivityType,
    setAutoPauseEnabled,
  };
};