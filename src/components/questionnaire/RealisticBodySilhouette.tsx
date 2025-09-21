import React from 'react';
interface RealisticBodySilhouetteProps {
  focusedField: string | null;
  onFieldFocus: (field: string) => void;
}

// Centralized coordinate mapping for precise anatomical positioning
const DEFAULT_MEASUREMENT_POINTS = {
  medidas_pescoco: {
    top: 15.26990754548166,
    left: 49.7737556561086
  },
  medidas_peito: {
    top: 23.722892079587577,
    left: 50.2262443438914
  },
  medidas_barriga: {
    top: 35.72067657960888,
    left: 49.321266968325794
  },
  medidas_quadril: {
    top: 43.08295343189468,
    left: 49.7737556561086
  },
  medidas_biceps_direito: {
    top: 26.99501512504793,
    left: 31.221719457013574
  },
  medidas_biceps_esquerdo: {
    top: 27.26769204550296,
    left: 68.32579185520362
  },
  medidas_antebraco_direito: {
    top: 34.35729197733373,
    left: 24.43438914027149
  },
  medidas_antebraco_esquerdo: {
    top: 35.44799965915385,
    left: 76.92307692307693
  },
  medidas_coxa_direita: {
    top: 53.17199948873077,
    left: 41.17647058823529
  },
  medidas_coxa_esquerda: {
    top: 53.17199948873077,
    left: 57.466063348416284
  },
  medidas_panturrilha_direita: {
    top: 70.07796855694261,
    left: 42.98642533936652
  },
  medidas_panturrilha_esquerda: {
    top: 70.07796855694261,
    left: 55.203619909502265
  }
};

// Measurement lines configuration
const MEASUREMENT_LINES = {
  medidas_peito: {
    top: 23.722892079587577,
    leftOffset: 14,
    rightOffset: 14
  },
  medidas_barriga: {
    top: 35.72067657960888,
    leftOffset: 22,
    rightOffset: 22
  },
  medidas_quadril: {
    top: 43.08295343189468,
    leftOffset: 18,
    rightOffset: 18
  },
  medidas_pescoco: {
    top: 15.26990754548166,
    leftOffset: 30,
    rightOffset: 30
  }
};
const STORAGE_KEY = 'bodyMeasurementPoints';
export const RealisticBodySilhouette: React.FC<RealisticBodySilhouetteProps> = ({
  focusedField,
  onFieldFocus
}) => {
  const [calibrationMode, setCalibrationMode] = React.useState(false);
  const [draggedPoint, setDraggedPoint] = React.useState<string | null>(null);
  const [measurementPoints, setMeasurementPoints] = React.useState(() => {
    // Load saved coordinates from localStorage or use defaults
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved measurement points');
      }
    }
    return DEFAULT_MEASUREMENT_POINTS;
  });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Save coordinates to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(measurementPoints));
  }, [measurementPoints]);
  const handleMouseDown = (fieldKey: string, e: React.MouseEvent) => {
    if (!calibrationMode) {
      onFieldFocus(fieldKey);
      return;
    }
    e.preventDefault();
    setDraggedPoint(fieldKey);
  };
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!draggedPoint || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const imageElement = containerRef.current.querySelector('img');
    if (!imageElement) return;
    const imageRect = imageElement.getBoundingClientRect();

    // Calculate position relative to the image
    const x = (e.clientX - imageRect.left) / imageRect.width * 100;
    const y = (e.clientY - imageRect.top) / imageRect.height * 100;

    // Clamp values to stay within image bounds
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    setMeasurementPoints(prev => ({
      ...prev,
      [draggedPoint]: {
        top: clampedY,
        left: clampedX
      }
    }));
  }, [draggedPoint]);
  const handleMouseUp = React.useCallback(() => {
    setDraggedPoint(null);
  }, []);
  React.useEffect(() => {
    if (draggedPoint) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedPoint, handleMouseMove, handleMouseUp]);
  const resetPoints = () => {
    setMeasurementPoints(DEFAULT_MEASUREMENT_POINTS);
    localStorage.removeItem(STORAGE_KEY);
  };
  const exportJSON = () => {
    const dataStr = JSON.stringify(measurementPoints, null, 2);
    const dataBlob = new Blob([dataStr], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'measurement-points.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  const renderMeasurementPoint = (fieldKey: string, title: string, size: 'small' | 'medium' = 'medium') => {
    const coords = measurementPoints[fieldKey as keyof typeof measurementPoints];
    if (!coords) return null;
    const sizeClass = size === 'small' ? 'w-5 h-5' : 'w-6 h-6';
    const isActive = focusedField === fieldKey;
    const isDragging = draggedPoint === fieldKey;
    return <button key={fieldKey} type="button" title={calibrationMode ? `Arraste para ajustar: ${title}` : title} aria-label={calibrationMode ? `Arraste para ajustar ${title}` : `Focar campo ${title}`} className={`absolute ${sizeClass} ${calibrationMode ? 'bg-red-500 hover:bg-red-600 cursor-move' : 'bg-blue-500 hover:bg-blue-600'} rounded-full transition-all duration-300 hover:scale-125 shadow-lg border-2 border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background ${isDragging ? 'scale-150 z-50' : 'cursor-pointer'}`} style={{
      top: `${coords.top}%`,
      left: `${coords.left}%`,
      transform: 'translate(-50%, -50%)'
    }} onMouseDown={e => handleMouseDown(fieldKey, e)}>
        <div className={`w-full h-full rounded-full ${isActive ? 'animate-pulse bg-blue-400' : ''} ${isDragging ? 'animate-pulse bg-red-400' : ''}`}></div>
        {calibrationMode && <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white px-1 py-0.5 rounded whitespace-nowrap">
            {fieldKey.replace('medidas_', '')}
          </div>}
      </button>;
  };
  const renderMeasurementLine = (fieldKey: string) => {
    const lineConfig = MEASUREMENT_LINES[fieldKey as keyof typeof MEASUREMENT_LINES];
    if (!lineConfig || focusedField !== fieldKey) return null;
    return <div key={`line-${fieldKey}`} className="absolute h-0.5 bg-blue-500 animate-pulse opacity-80" style={{
      top: `${lineConfig.top}%`,
      left: `${lineConfig.leftOffset}%`,
      right: `${lineConfig.rightOffset}%`
    }} />;
  };
  return <div className="relative flex justify-center items-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl p-4">
        {/* Calibration controls - always visible */}
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          <button onClick={() => setCalibrationMode(!calibrationMode)} className={`text-xs px-2 py-1 rounded transition-all ${calibrationMode ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            {calibrationMode ? 'Sair' : 'Ajustar pontos'}
          </button>
          
          {calibrationMode && <>
              <button onClick={resetPoints} className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded border border-yellow-300">
                Reset
              </button>
              <button onClick={exportJSON} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded border border-green-300">
                Export JSON
              </button>
            </>}
        </div>

        {calibrationMode}

        <div className="relative" ref={containerRef}>
          <img src="/lovable-uploads/c1548874-8615-442c-83d4-303302067e4e.png" alt="Mapa Antropométrico" className="w-80 h-auto drop-shadow-lg" draggable={false} />
          
          {/* Interactive measurement points overlay */}
          <div className="absolute inset-0">
            {/* Core measurement points */}
            {renderMeasurementPoint('medidas_peito', 'Peito')}
            {renderMeasurementPoint('medidas_barriga', 'Barriga (Umbigo)')}
            {renderMeasurementPoint('medidas_quadril', 'Quadril')}
            {renderMeasurementPoint('medidas_pescoco', 'Pescoço', 'small')}

            {/* Arm measurements */}
            {renderMeasurementPoint('medidas_biceps_direito', 'Bíceps Direito', 'small')}
            {renderMeasurementPoint('medidas_biceps_esquerdo', 'Bíceps Esquerdo', 'small')}
            {renderMeasurementPoint('medidas_antebraco_direito', 'Antebraço Direito', 'small')}
            {renderMeasurementPoint('medidas_antebraco_esquerdo', 'Antebraço Esquerdo', 'small')}

            {/* Leg measurements */}
            {renderMeasurementPoint('medidas_coxa_direita', 'Coxa Direita', 'small')}
            {renderMeasurementPoint('medidas_coxa_esquerda', 'Coxa Esquerda', 'small')}
            {renderMeasurementPoint('medidas_panturrilha_direita', 'Panturrilha Direita', 'small')}
            {renderMeasurementPoint('medidas_panturrilha_esquerda', 'Panturrilha Esquerda', 'small')}

            {/* Measurement lines when field is focused */}
            {!calibrationMode && renderMeasurementLine('medidas_peito')}
            {!calibrationMode && renderMeasurementLine('medidas_barriga')}
            {!calibrationMode && renderMeasurementLine('medidas_quadril')}
            {!calibrationMode && renderMeasurementLine('medidas_pescoco')}
          </div>

          {/* Floating labels with precise positioning */}
          {!calibrationMode && <div className="absolute inset-0 pointer-events-none">
              {focusedField === 'medidas_peito' && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_peito.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Peito
                  </div>
                </div>}
              {focusedField === 'medidas_barriga' && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_barriga.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Barriga
                  </div>
                </div>}
              {focusedField === 'medidas_quadril' && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_quadril.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Quadril
                  </div>
                </div>}
              {focusedField === 'medidas_pescoco' && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_pescoco.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Pescoço
                  </div>
                </div>}
              {(focusedField === 'medidas_biceps_direito' || focusedField === 'medidas_biceps_esquerdo') && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_biceps_direito.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Bíceps
                  </div>
                </div>}
              {(focusedField === 'medidas_antebraco_direito' || focusedField === 'medidas_antebraco_esquerdo') && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_antebraco_direito.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Antebraço
                  </div>
                </div>}
              {(focusedField === 'medidas_coxa_direita' || focusedField === 'medidas_coxa_esquerda') && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_coxa_direita.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Coxa
                  </div>
                </div>}
              {(focusedField === 'medidas_panturrilha_direita' || focusedField === 'medidas_panturrilha_esquerda') && <div className="absolute transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg animate-fade-in" style={{
            top: `${measurementPoints.medidas_panturrilha_direita.top - 4}%`,
            left: '50%'
          }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Panturrilha
                  </div>
                </div>}
            </div>}
        </div>
      </div>
    </div>;
};
