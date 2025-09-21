
import React, { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/config/maps';
import { Button } from '@/components/ui/button';
import { Map, Satellite, Navigation } from 'lucide-react';

interface Position {
  lat: number;
  lng: number;
  timestamp?: number;
}

interface ActivityMapViewProps {
  route: Position[];
  stats: {
    distance: number;
    duration: number;
    averageSpeed: number;
    calories: number;
  };
  isActive?: boolean;
}

const ActivityMapView: React.FC<ActivityMapViewProps> = ({ route, stats, isActive = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routePolyline = useRef<any>(null);
  const startMarker = useRef<any>(null);
  const endMarker = useRef<any>(null);
  const [mapType, setMapType] = React.useState<'roadmap' | 'satellite'>('roadmap');

  useEffect(() => {
    let cancelled = false;
    
    const initMap = async () => {
      if (!mapRef.current || !isActive) return;
      
      if (!window.google?.maps) {
        try { 
          await loadGoogleMaps(); 
        } catch { 
          return;
        }
      }
      if (!window.google?.maps || cancelled) return;

      const center = route.length 
        ? { lat: route[Math.floor(route.length / 2)].lat, lng: route[Math.floor(route.length / 2)].lng }
        : { lat: -23.5505, lng: -46.6333 };

      // Create map only if it doesn't exist
      if (!mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center,
          mapTypeId: mapType === 'satellite' 
            ? window.google.maps.MapTypeId.SATELLITE 
            : window.google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: true,
          zoomControl: true,
          styles: mapType === 'roadmap' ? [
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              stylers: [{ visibility: 'off' }]
            }
          ] : undefined
        });
      } else {
        // Update existing map type
        mapInstance.current.setMapTypeId(
          mapType === 'satellite' 
            ? window.google.maps.MapTypeId.SATELLITE 
            : window.google.maps.MapTypeId.ROADMAP
        );
      }

      // Clear existing route elements
      if (routePolyline.current) {
        routePolyline.current.setMap(null);
        routePolyline.current = null;
      }
      if (startMarker.current) {
        startMarker.current.setMap(null);
        startMarker.current = null;
      }
      if (endMarker.current) {
        endMarker.current.setMap(null);
        endMarker.current = null;
      }

      if (route.length > 1) {
        const path = route.map((p) => ({ lat: p.lat, lng: p.lng }));
        
        // Create new polyline with full route
        routePolyline.current = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#7c3aed',
          strokeOpacity: 0.8,
          strokeWeight: 4,
        });
        routePolyline.current.setMap(mapInstance.current);

        // Start marker
        startMarker.current = new window.google.maps.Marker({
          position: route[0],
          map: mapInstance.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
          },
        });

        // End marker
        endMarker.current = new window.google.maps.Marker({
          position: route[route.length - 1],
          map: mapInstance.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
          },
        });

        // Fit bounds to show complete route
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        mapInstance.current.fitBounds(bounds);
        
        // Add padding for better visualization
        setTimeout(() => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.panToBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
          }
        }, 100);
      } else if (route.length === 1) {
        // Single point - just center on it
        mapInstance.current.setCenter(route[0]);
        mapInstance.current.setZoom(16);
      }
    };

    if (isActive) {
      initMap();
    }
    
    return () => {
      cancelled = true;
    };
  }, [route, mapType, isActive]);

  // Trigger map resize when becoming active
  useEffect(() => {
    if (isActive && mapInstance.current && window.google?.maps) {
      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance.current, 'resize');
        if (route.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          route.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
          mapInstance.current.fitBounds(bounds);
        }
      }, 100);
    }
  }, [isActive, route]);

  const toggleMapType = () => {
    setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap');
  };

  const centerOnRoute = () => {
    if (mapInstance.current && route.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      route.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstance.current.fitBounds(bounds);
    }
  };

  return (
    <div className="relative">
      {/* Map controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleMapType}
          className="bg-background/80 backdrop-blur-sm border shadow-sm"
        >
          {mapType === 'roadmap' ? <Satellite className="h-4 w-4" /> : <Map className="h-4 w-4" />}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={centerOnRoute}
          className="bg-background/80 backdrop-blur-sm border shadow-sm"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Marker legend */}
      {route.length > 1 && (
        <div className="absolute bottom-2 left-2 z-10 bg-background/90 backdrop-blur-sm rounded-md p-2 border shadow-sm">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
              <span className="text-foreground">Início</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              <span className="text-foreground">Fim</span>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} className="h-64 w-full rounded-md border" />
      
      {/* Route info */}
      {route.length > 1 && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Trajeto de {stats.distance.toFixed(2)} km • {route.length} pontos registrados
        </div>
      )}
    </div>
  );
};

export default ActivityMapView;
