
import React from 'react';

interface InteractiveBodySilhouetteProps {
  focusedField: string | null;
  onFieldFocus: (field: string) => void;
}

export const InteractiveBodySilhouette: React.FC<InteractiveBodySilhouetteProps> = ({
  focusedField,
  onFieldFocus
}) => {
  return (
    <div className="relative flex justify-center items-center p-8">
      <div className="relative">
        <svg
          width="320"
          height="500"
          viewBox="0 0 320 500"
          className="drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Modern gradients */}
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            
            <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            
            <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            
            <linearGradient id="muscleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Shadow filter */}
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#00000020"/>
            </filter>

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>

          {/* Background circle for depth */}
          <ellipse cx="160" cy="250" rx="140" ry="220" fill="url(#shadowGradient)" opacity="0.1" filter="url(#dropShadow)" />

          {/* Body silhouette with modern design */}
          <g className="body-silhouette" filter="url(#dropShadow)">
            
            {/* Head with more realistic proportions */}
            <ellipse cx="160" cy="50" rx="30" ry="35" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="160" cy="48" rx="25" ry="30" fill="url(#muscleGradient)" opacity="0.8" />
            
            {/* Neck */}
            <rect x="145" y="85" width="30" height="20" rx="15" ry="10" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Shoulders with realistic curve */}
            <ellipse cx="160" cy="125" rx="65" ry="25" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="160" cy="123" rx="60" ry="20" fill="url(#muscleGradient)" opacity="0.6" />
            
            {/* Chest/Torso - more anatomically correct */}
            <ellipse cx="160" cy="180" rx="55" ry="70" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="160" cy="175" rx="50" ry="65" fill="url(#muscleGradient)" opacity="0.7" />
            
            {/* Arms with muscle definition */}
            <g className="arms">
              {/* Left arm (bicep) */}
              <ellipse cx="105" cy="160" rx="18" ry="40" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="107" cy="158" rx="14" ry="35" fill="url(#muscleGradient)" opacity="0.8" />
              
              {/* Right arm (bicep) */}
              <ellipse cx="215" cy="160" rx="18" ry="40" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="213" cy="158" rx="14" ry="35" fill="url(#muscleGradient)" opacity="0.8" />
              
              {/* Left forearm */}
              <ellipse cx="90" cy="225" rx="15" ry="35" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="92" cy="223" rx="12" ry="30" fill="url(#muscleGradient)" opacity="0.8" />
              
              {/* Right forearm */}
              <ellipse cx="230" cy="225" rx="15" ry="35" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="228" cy="223" rx="12" ry="30" fill="url(#muscleGradient)" opacity="0.8" />
            </g>
            
            {/* Waist area */}
            <ellipse cx="160" cy="250" rx="45" ry="25" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="160" cy="248" rx="40" ry="20" fill="url(#muscleGradient)" opacity="0.6" />
            
            {/* Hip area */}
            <ellipse cx="160" cy="290" rx="50" ry="30" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="160" cy="288" rx="45" ry="25" fill="url(#muscleGradient)" opacity="0.7" />
            
            {/* Thighs with muscle definition */}
            <g className="thighs">
              <ellipse cx="135" cy="360" rx="22" ry="50" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="137" cy="358" rx="18" ry="45" fill="url(#muscleGradient)" opacity="0.8" />
              
              <ellipse cx="185" cy="360" rx="22" ry="50" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="183" cy="358" rx="18" ry="45" fill="url(#muscleGradient)" opacity="0.8" />
            </g>
            
            {/* Calves */}
            <g className="calves">
              <ellipse cx="135" cy="435" rx="18" ry="40" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="137" cy="433" rx="15" ry="35" fill="url(#muscleGradient)" opacity="0.8" />
              
              <ellipse cx="185" cy="435" rx="18" ry="40" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="183" cy="433" rx="15" ry="35" fill="url(#muscleGradient)" opacity="0.8" />
            </g>
          </g>

          {/* Interactive measurement hotspots */}
          <g className="measurement-points">
            {/* Chest hotspot */}
            <g 
              className="measurement-hotspot cursor-pointer"
              onClick={() => onFieldFocus('chest')}
            >
              <circle 
                cx="160" 
                cy="160" 
                r="12" 
                fill={focusedField === 'chest' ? 'url(#highlightGradient)' : '#6366f1'} 
                className="transition-all duration-300 hover:scale-125"
                filter="url(#glow)"
              />
              <circle 
                cx="160" 
                cy="160" 
                r="16" 
                fill="none" 
                stroke={focusedField === 'chest' ? '#8b5cf6' : 'transparent'} 
                strokeWidth="2" 
                className="transition-all duration-300"
                opacity="0.7"
              />
              {focusedField === 'chest' && (
                <>
                  <circle cx="160" cy="160" r="24" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="24;32;24" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <line x1="105" y1="160" x2="215" y2="160" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="8,4" opacity="0.8">
                    <animate attributeName="stroke-dashoffset" values="0;12;0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                </>
              )}
            </g>

            {/* Waist hotspot */}
            <g 
              className="measurement-hotspot cursor-pointer"
              onClick={() => onFieldFocus('waist')}
            >
              <circle 
                cx="160" 
                cy="250" 
                r="12" 
                fill={focusedField === 'waist' ? 'url(#highlightGradient)' : '#6366f1'} 
                className="transition-all duration-300 hover:scale-125"
                filter="url(#glow)"
              />
              {focusedField === 'waist' && (
                <>
                  <circle cx="160" cy="250" r="24" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="24;32;24" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <line x1="115" y1="250" x2="205" y2="250" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="8,4" opacity="0.8">
                    <animate attributeName="stroke-dashoffset" values="0;12;0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                </>
              )}
            </g>

            {/* Hip hotspot */}
            <g 
              className="measurement-hotspot cursor-pointer"
              onClick={() => onFieldFocus('hip')}
            >
              <circle 
                cx="160" 
                cy="290" 
                r="12" 
                fill={focusedField === 'hip' ? 'url(#highlightGradient)' : '#6366f1'} 
                className="transition-all duration-300 hover:scale-125"
                filter="url(#glow)"
              />
              {focusedField === 'hip' && (
                <>
                  <circle cx="160" cy="290" r="24" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="24;32;24" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <line x1="110" y1="290" x2="210" y2="290" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="8,4" opacity="0.8">
                    <animate attributeName="stroke-dashoffset" values="0;12;0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                </>
              )}
            </g>

            {/* Bicep hotspots */}
            <circle 
              cx="105" 
              cy="160" 
              r="10" 
              fill={focusedField?.includes('Bicep') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('rightBicep')}
            />
            <circle 
              cx="215" 
              cy="160" 
              r="10" 
              fill={focusedField?.includes('Bicep') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('leftBicep')}
            />

            {/* Forearm hotspots */}
            <circle 
              cx="90" 
              cy="225" 
              r="10" 
              fill={focusedField?.includes('Forearm') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('rightForearm')}
            />
            <circle 
              cx="230" 
              cy="225" 
              r="10" 
              fill={focusedField?.includes('Forearm') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('leftForearm')}
            />

            {/* Thigh hotspots */}
            <circle 
              cx="135" 
              cy="360" 
              r="10" 
              fill={focusedField?.includes('Thigh') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('rightThigh')}
            />
            <circle 
              cx="185" 
              cy="360" 
              r="10" 
              fill={focusedField?.includes('Thigh') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('leftThigh')}
            />

            {/* Calf hotspots */}
            <circle 
              cx="135" 
              cy="435" 
              r="10" 
              fill={focusedField?.includes('Calf') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('rightCalf')}
            />
            <circle 
              cx="185" 
              cy="435" 
              r="10" 
              fill={focusedField?.includes('Calf') ? 'url(#highlightGradient)' : '#6366f1'} 
              className="measurement-hotspot cursor-pointer transition-all duration-300 hover:scale-125" 
              filter="url(#glow)"
              onClick={() => onFieldFocus('leftCalf')}
            />
          </g>
        </svg>

        {/* Floating labels with modern styling */}
        <div className="absolute inset-0 pointer-events-none">
          {focusedField === 'chest' && (
            <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-fade-in border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Peito
              </div>
            </div>
          )}
          {focusedField === 'waist' && (
            <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-fade-in border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Barriga
              </div>
            </div>
          )}
          {focusedField === 'hip' && (
            <div className="absolute top-[56%] left-1/2 transform -translate-x-1/2 -translate-y-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-fade-in border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Quadril
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
