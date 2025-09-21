import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Dumbbell, Lock } from 'lucide-react';
interface CalendarDayProps {
  day: string;
  date: number;
  isToday: boolean;
  isSelected: boolean;
  isCompleted: boolean;
  isApproved: boolean;
  isRestDay: boolean;
  isPending: boolean;
  exerciseCount: number;
  workout: {
    title: string;
    focus: string;
    duration: string;
    difficulty: string;
    isPreviouslyApproved?: boolean;
  };
  onClick: () => void;
}
export const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  date,
  isToday,
  isSelected,
  isCompleted,
  isApproved,
  isRestDay,
  isPending,
  exerciseCount,
  workout,
  onClick
}) => {
  const isPreviouslyApproved = workout.isPreviouslyApproved || false;
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Médio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Difícil':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  let borderColor = 'border-gray-200';
  let bgColor = 'bg-white';
  if (isSelected) {
    borderColor = 'border-purple-500';
    bgColor = 'bg-gradient-to-b from-purple-100 to-purple-200';
  } else if (isToday) {
    borderColor = 'border-purple-500';
    bgColor = 'bg-gradient-to-b from-purple-50 to-purple-100';
  } else if (isCompleted) {
    borderColor = 'border-green-400';
    bgColor = 'bg-gradient-to-b from-green-50 to-green-100';
  } else if (isApproved && !isRestDay) {
    borderColor = 'border-blue-400';
    bgColor = 'bg-gradient-to-b from-blue-50 to-blue-100';
  } else if (isPending && !isRestDay) {
    borderColor = 'border-orange-400';
    bgColor = 'bg-gradient-to-b from-orange-50 to-orange-100';
  } else if (isRestDay) {
    borderColor = 'border-gray-300';
    bgColor = 'bg-gradient-to-b from-gray-50 to-gray-100';
  } else {
    borderColor = 'border-red-300';
    bgColor = 'bg-gradient-to-b from-red-50 to-red-100';
  }

  // 🔥 FIX: Prevent navigation for rest days - only show cursor pointer for non-rest days
  const handleClick = () => {
    if (isRestDay) {
      // For rest days, we still call onClick but expect the parent to handle it properly
      // without opening any panel or navigation
      onClick();
      return;
    }
    onClick();
  };
  return <div className={`
        relative p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 
        transition-all duration-300 transform 
        ${isPending && !isRestDay ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'} 
        touch-manipulation
        ${borderColor} ${bgColor} 
        ${!isPending || isRestDay ? 'hover:shadow-lg' : ''}
        ${isSelected ? 'ring-4 ring-purple-400 ring-opacity-30 scale-105 shadow-xl' : ''}
      `} onClick={handleClick}>
      {/* Today indicator */}
      {isToday && <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full animate-pulse" />}
      
      {/* Status indicators */}
      {isCompleted && <div className="absolute top-1 right-1 text-xs animate-bounce">✅</div>}
      {!isCompleted && isApproved && !isRestDay && exerciseCount > 0 && <div className="absolute top-1 right-1 text-xs animate-pulse">
          {isPreviouslyApproved ? '🔄' : '💪'}
        </div>}
      {!isCompleted && isPending && !isRestDay && <div className="absolute top-1 right-1 text-xs animate-spin">⏳</div>}
      {!isCompleted && !isApproved && !isPending && !isRestDay && <div className="absolute top-1 right-1 text-xs">🔒</div>}
      
      <div className="text-center space-y-1 sm:space-y-2">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{day}</div>
        
        <div className={`text-sm sm:text-xl font-bold transition-colors duration-200 ${isToday ? 'text-purple-600' : 'text-gray-800'}`}>
          {date}
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          {/* Mobile layout */}
          <div className="sm:hidden text-center">
            <div className="text-lg mb-1 transition-transform duration-200 hover:scale-110">
              {isRestDay ? '😴' : isCompleted ? '✅' : isApproved && exerciseCount > 0 ? isPreviouslyApproved ? '🔄' : '💪' : isPending ? '⏳' : '🔒'}
            </div>
            {!isRestDay && <div className="text-xs text-gray-600 font-medium text-center">
                {isCompleted ? '' : isApproved && exerciseCount > 0 ? isPreviouslyApproved ? 'Pré-aprovado' : `${exerciseCount} ex.` : isPending ? 'Aguardando' : 'Bloqueado'}
              </div>}
          </div>
          
          {/* Desktop layout */}
          <div className="hidden sm:block space-y-1">
            <div className="text-xs font-semibold text-gray-800 truncate leading-tight">
              {workout.title}
            </div>
            
            {!isRestDay && <>
                <div className="text-xs font-medium truncate text-blue-600">
                  {workout.focus}
                </div>
                
                <div className="flex items-center justify-center gap-1 text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{workout.duration}</span>
                </div>
                
                 <div className={`text-xs font-medium transition-colors duration-200 ${isCompleted ? 'text-green-600' : isApproved && exerciseCount > 0 ? isPreviouslyApproved ? 'text-blue-600' : 'text-blue-600' : isPending ? 'text-orange-600' : 'text-red-600'}`}>
                   {isCompleted ? '✅' : isApproved && exerciseCount > 0 ? isPreviouslyApproved ? `${exerciseCount} exercícios 🔄` : `${exerciseCount} exercícios 💪` : isPending ? 'Enviado para aprovação ⏳' : 'Treino bloqueado 🔒'}
                </div>
                
                <Badge variant="outline" className={`text-xs border transition-all duration-200 ${getDifficultyColor(workout.difficulty)}`}>
                  {workout.difficulty}
                </Badge>
              </>}
          </div>
          
          {/* Status icon */}
          <div className="flex justify-center pt-1">
            {isRestDay ? <div className="flex items-center gap-1 text-gray-500 transition-colors duration-200">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium hidden sm:inline">Descanso</span>
              </div> : isCompleted ? <div className="flex items-center gap-1 text-green-600 transition-colors duration-200">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium hidden sm:inline"></span>
              </div> : isApproved && exerciseCount > 0 ? <div className={`flex items-center gap-1 transition-colors duration-200 ${isPreviouslyApproved ? 'text-blue-600' : 'text-blue-600'}`}>
                <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium hidden sm:inline">
                  {isPreviouslyApproved ? 'Pré-aprovado' : 'Disponível'}
                </span>
              </div> : isPending ? <div className="flex items-center gap-1 text-orange-600 transition-colors duration-200">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium hidden sm:inline">Enviado para aprovação</span>
              </div> : <div className="flex items-center gap-1 text-red-600 transition-colors duration-200">
                <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium hidden sm:inline">Bloqueado</span>
              </div>}
          </div>
        </div>
      </div>
    </div>;
};