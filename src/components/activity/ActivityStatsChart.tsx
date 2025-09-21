
import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Clock, Zap } from 'lucide-react';

interface Position {
  lat: number;
  lng: number;
  timestamp?: number;
}

interface ActivityStatsChartProps {
  route: Position[];
  stats: {
    distance: number;
    duration: number;
    averageSpeed: number;
    calories: number;
  };
}

const ActivityStatsChart: React.FC<ActivityStatsChartProps> = ({ route, stats }) => {
  // Enhanced distance calculation (same as in useActivityTracking)
  const calculateDistance = (pos1: Position, pos2: Position): number => {
    // Check for minimal movement first (drift filter)
    const latDiff = Math.abs(pos2.lat - pos1.lat);
    const lngDiff = Math.abs(pos2.lng - pos1.lng);
    const minMovement = 0.00005; // ~5-8 meters
    
    if (latDiff < minMovement && lngDiff < minMovement) {
      return 0; // Ignore GPS drift
    }

    // Use Google Maps if available
    if (typeof window !== 'undefined' && window.google?.maps?.geometry?.spherical) {
      try {
        const lat1 = new window.google.maps.LatLng(pos1.lat, pos1.lng);
        const lat2 = new window.google.maps.LatLng(pos2.lat, pos2.lng);
        return window.google.maps.geometry.spherical.computeDistanceBetween(lat1, lat2) / 1000; // km
      } catch (error) {
        console.warn('Google Maps geometry failed, using Haversine');
      }
    }
    
    // Haversine fallback
    const R = 6371; // Earth radius in km
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(pos2.lat - pos1.lat);
    const dLon = toRad(pos2.lng - pos1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // km
  };

  // Calculate advanced statistics
  const calculateAdvancedStats = () => {
    if (route.length < 2) return { maxSpeed: 0, pace: 0, splits: [], speedData: [] };

    let maxSpeed = 0;
    const splits = [];
    const speedData = [];
    let currentDistance = 0;
    let splitDistance = 0; // Track distance within current split
    let splitStartTime = route[0]?.timestamp || Date.now();

    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      
      if (!prev.timestamp || !curr.timestamp) continue;

      const segmentDistance = calculateDistance(prev, curr);
      
      // Calculate instantaneous speed
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000 / 3600; // hours
      const instantSpeed = timeDiff > 0 ? segmentDistance / timeDiff : 0;
      
      // Filter out unrealistic speeds for max calculation
      if (instantSpeed <= 40) { // km/h max realistic speed
        maxSpeed = Math.max(maxSpeed, instantSpeed);
        speedData.push(instantSpeed);
      }

      currentDistance += segmentDistance;
      splitDistance += segmentDistance;

      // Create split every km
      if (splitDistance >= 1) {
        const splitTime = (curr.timestamp - splitStartTime) / 1000 / 60; // minutes
        const splitPace = splitTime; // min/km
        splits.push({
          km: Math.floor(currentDistance),
          time: splitTime,
          pace: splitPace
        });
        splitDistance = splitDistance - 1; // Keep remainder for next split
        splitStartTime = curr.timestamp;
      }
    }

    const averagePace = stats.duration > 0 && stats.distance > 0 ? stats.duration / stats.distance : 0; // min/km
    return { maxSpeed, pace: averagePace, splits, speedData };
  };

  const advancedStats = calculateAdvancedStats();

  const formatPace = (pace: number): string => {
    if (!pace || pace <= 0) return "--'--";
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Enhanced main statistics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-card border border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium text-card-foreground">Vel. Máxima</div>
              <div className="text-lg font-bold text-primary">{advancedStats.maxSpeed.toFixed(1)} km/h</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 bg-card border border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium text-card-foreground">Ritmo Médio</div>
              <div className="text-lg font-bold text-primary">{formatPace(advancedStats.pace)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Improved speed visualization */}
      {advancedStats.speedData.length > 5 && (
        <Card className="p-4 bg-card border border-border">
          <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Velocidade ao Longo do Percurso
          </h3>
          <div className="h-16 flex items-end gap-1">
            {advancedStats.speedData.slice(0, 20).map((speed, i) => { // Show first 20 data points
              const normalizedHeight = Math.min((speed / advancedStats.maxSpeed) * 100, 100);
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-primary to-primary/60 rounded-t-sm"
                  style={{ height: `${Math.max(normalizedHeight, 5)}%` }}
                  title={`${speed.toFixed(1)} km/h`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Início</span>
            <span>Fim</span>
          </div>
        </Card>
      )}

      {/* Accurate splits per kilometer */}
      {advancedStats.splits.length > 0 && (
        <Card className="p-4 bg-card border border-border">
          <h3 className="text-sm font-medium text-card-foreground mb-3">Splits por KM</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {advancedStats.splits.map((split, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">KM {split.km}</span>
                <span className="font-medium text-card-foreground">{formatPace(split.pace)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Additional statistics */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 text-center bg-card border border-border">
          <div className="text-lg font-bold text-primary">{route.length}</div>
          <div className="text-xs text-muted-foreground">Pontos GPS</div>
        </Card>
        <Card className="p-2 text-center bg-card border border-border">
          <div className="text-lg font-bold text-primary">{stats.calories}</div>
          <div className="text-xs text-muted-foreground">Calorias</div>
        </Card>
        <Card className="p-2 text-center bg-card border border-border">
          <div className="text-lg font-bold text-primary">{stats.averageSpeed.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Vel. Média</div>
        </Card>
      </div>
    </div>
  );
};

export default ActivityStatsChart;
