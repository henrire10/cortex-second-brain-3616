
interface Position {
  lat: number;
  lng: number;
  timestamp?: number;
}

interface ActivityStats {
  distance: number;
  duration: number;
  averageSpeed: number;
  calories: number;
}

export const calculateMaxSpeed = (route: Position[]): number => {
  if (route.length < 2) return 0;
  
  let maxSpeed = 0;
  
  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1];
    const curr = route[i];
    
    if (!prev.timestamp || !curr.timestamp) continue;
    
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
    if (timeDiff <= 0) continue;
    
    const distance = calculateDistance(prev, curr) * 1000; // meters
    const speedMs = distance / timeDiff; // m/s
    const speedKmh = speedMs * 3.6; // km/h
    
    if (speedKmh > maxSpeed && speedKmh < 50) { // Cap at reasonable max speed
      maxSpeed = speedKmh;
    }
  }
  
  return maxSpeed;
};

const calculateDistance = (pos1: Position, pos2: Position): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);
  const lat1Rad = toRad(pos1.lat);
  const lat2Rad = toRad(pos2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // km
};

export const generateStoryImage = async (
  route: Position[],
  stats: ActivityStats,
  activityType: string,
  date: Date
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Instagram Story dimensions - High DPI for better quality
  const dpr = 2; // Device pixel ratio for higher quality
  canvas.width = 1080 * dpr;
  canvas.height = 1920 * dpr;
  canvas.style.width = '1080px';
  canvas.style.height = '1920px';
  ctx.scale(dpr, dpr);

  // Modern gradient background (inspired by logo colors)
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#ff69b4'); // Pink from logo
  gradient.addColorStop(0.4, '#9d4edd'); // Purple
  gradient.addColorStop(1, '#2d1b69'); // Dark purple
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Add subtle overlay pattern for texture
  const overlayGradient = ctx.createRadialGradient(540, 960, 0, 540, 960, 1200);
  overlayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Header section with glassmorphism effect
  const headerHeight = 200;
  const headerGradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
  headerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  headerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  ctx.fillStyle = headerGradient;
  ctx.fillRect(60, 60, 960, headerHeight);
  
  // Header border and shadow
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 960, headerHeight);

  // Modern title with shadow
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillText(activityType.toUpperCase(), 540, 140);

  // Date with modern styling
  ctx.font = '32px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 5;
  ctx.fillText(date.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }), 540, 190);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Map area with modern design
  const mapArea = {
    x: 60,
    y: 300,
    width: 960,
    height: 540
  };

  // Modern map container with glassmorphism
  const mapGradient = ctx.createLinearGradient(0, mapArea.y, 0, mapArea.y + mapArea.height);
  mapGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  mapGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = mapGradient;
  
  // Rounded rectangle for map
  const cornerRadius = 20;
  ctx.beginPath();
  ctx.roundRect(mapArea.x, mapArea.y, mapArea.width, mapArea.height, cornerRadius);
  ctx.fill();
  
  // Map border with glow effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw route if available
  if (route.length > 1) {
    // Calculate bounds
    const lats = route.map(p => p.lat);
    const lngs = route.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding to bounds
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const padding = 0.1;
    
    const bounds = {
      minLat: minLat - latRange * padding,
      maxLat: maxLat + latRange * padding,
      minLng: minLng - lngRange * padding,
      maxLng: maxLng + lngRange * padding
    };

    // Convert GPS coordinates to canvas coordinates
    const pointToCanvas = (lat: number, lng: number) => ({
      x: mapArea.x + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * mapArea.width,
      y: mapArea.y + mapArea.height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * mapArea.height
    });

    // Draw route line with modern gradient
    const routeGradient = ctx.createLinearGradient(mapArea.x, mapArea.y, mapArea.x + mapArea.width, mapArea.y + mapArea.height);
    routeGradient.addColorStop(0, '#00f5ff'); // Cyan
    routeGradient.addColorStop(0.5, '#ff69b4'); // Pink
    routeGradient.addColorStop(1, '#9d4edd'); // Purple
    ctx.strokeStyle = routeGradient;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 105, 180, 0.4)';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    const firstPoint = pointToCanvas(route[0].lat, route[0].lng);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < route.length; i++) {
      const point = pointToCanvas(route[i].lat, route[i].lng);
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    // Reset shadow for markers
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw start marker with modern design
    const startPoint = pointToCanvas(route[0].lat, route[0].lng);
    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner dot for start
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw end marker with modern design
    const endPoint = pointToCanvas(route[route.length - 1].lat, route[route.length - 1].lng);
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner dot for end
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Statistics section with modern cards
  const statsY = mapArea.y + mapArea.height + 60;
  
  // Stats title with modern styling
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText('ESTATÍSTICAS', 540, statsY + 50);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Format time
  const formatTime = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maxSpeed = calculateMaxSpeed(route);

  // Modern stats data with icons and colors
  const statsData = [
    { label: 'DISTÂNCIA', value: `${stats.distance.toFixed(2)} km`, color: '#00f5ff', icon: '📍' },
    { label: 'TEMPO', value: formatTime(stats.duration), color: '#ff69b4', icon: '⏱️' },
    { label: 'VELOCIDADE MÉDIA', value: `${stats.averageSpeed.toFixed(1)} km/h`, color: '#9d4edd', icon: '🏃' },
    { label: 'VELOCIDADE MÁXIMA', value: `${maxSpeed.toFixed(1)} km/h`, color: '#ff1744', icon: '⚡' },
    { label: 'CALORIAS', value: `${stats.calories}`, color: '#00e676', icon: '🔥' }
  ];

  // Draw modern stat cards
  const cardWidth = 420;
  const cardHeight = 140;
  const cardSpacing = 20;
  const cardsPerRow = 2;
  
  statsData.forEach((stat, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    const x = 80 + col * (cardWidth + cardSpacing);
    const y = statsY + 100 + row * (cardHeight + cardSpacing);

    // Skip last card positioning for single card in last row
    if (index === 4) {
      const x = (1080 - cardWidth) / 2; // Center the last card
      const y = statsY + 100 + 2 * (cardHeight + cardSpacing);
      
      // Card background with glassmorphism
      const cardGradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
      cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      ctx.fillStyle = cardGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, cardWidth, cardHeight, 16);
      ctx.fill();
      
      // Card border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Icon
      ctx.font = '36px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(stat.icon, x + 20, y + 50);

      // Stat value
      ctx.fillStyle = stat.color;
      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.fillText(stat.value, x + cardWidth / 2, y + 60);

      // Stat label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.shadowBlur = 2;
      ctx.fillText(stat.label, x + cardWidth / 2, y + 100);
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      return;
    }

    // Card background with glassmorphism
    const cardGradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
    cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = cardGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 16);
    ctx.fill();
    
    // Card border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icon
    ctx.font = '36px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(stat.icon, x + 20, y + 50);

    // Stat value
    ctx.fillStyle = stat.color;
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.fillText(stat.value, x + cardWidth / 2, y + 60);

    // Stat label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    ctx.shadowBlur = 2;
    ctx.fillText(stat.label, x + cardWidth / 2, y + 100);
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  });

  // Modern logo area (bottom right) with glow effect
  try {
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      logo.onload = () => {
        // Calculate logo size (max 150px wide for better visibility)
        const maxLogoWidth = 150;
        const logoAspectRatio = logo.naturalWidth / logo.naturalHeight;
        const logoWidth = Math.min(maxLogoWidth, logo.naturalWidth);
        const logoHeight = logoWidth / logoAspectRatio;
        
        // Position logo in bottom right corner with padding
        const logoX = 1080 - logoWidth - 40;
        const logoY = 1920 - logoHeight - 40;
        
        // Add glow effect to logo
        ctx.shadowColor = 'rgba(255, 105, 180, 0.4)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw logo with high quality
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        resolve();
      };
      
      logo.onerror = () => {
        // Modern fallback text with gradient
        const textGradient = ctx.createLinearGradient(900, 1860, 1040, 1860);
        textGradient.addColorStop(0, '#ff69b4');
        textGradient.addColorStop(1, '#9d4edd');
        ctx.fillStyle = textGradient;
        ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillText('BetzaFit', 1040, 1880);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        resolve();
      };
      
      // Use the new modern logo
      logo.src = '/src/assets/betzafit-modern-logo.png';
    });
  } catch (error) {
    // Modern fallback text with gradient
    const textGradient = ctx.createLinearGradient(900, 1860, 1040, 1860);
    textGradient.addColorStop(0, '#ff69b4');
    textGradient.addColorStop(1, '#9d4edd');
    ctx.fillStyle = textGradient;
    ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillText('BetzaFit', 1040, 1880);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  return canvas.toDataURL('image/png');
};

export const shareToInstagramStories = async (imageDataUrl: string, text: string) => {
  // Convert data URL to blob
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  
  // Try native sharing first (works on mobile)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'story.png', { type: 'image/png' })] })) {
    try {
      await navigator.share({
        files: [new File([blob], 'story.png', { type: 'image/png' })],
        title: 'Minha Atividade - BetzaFit',
        text: text
      });
      return { success: true, method: 'native' };
    } catch (error) {
      console.log('Native share failed, trying fallback:', error);
    }
  }

  // Fallback: download image with instructions
  const link = document.createElement('a');
  link.href = imageDataUrl;
  link.download = `betzafit-story-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { 
    success: true, 
    method: 'download',
    instructions: 'Imagem baixada! Abra o Instagram e adicione a imagem aos seus Stories.'
  };
};
