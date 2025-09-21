import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Target, BarChart3, Trophy, ArrowRight, Shield } from 'lucide-react';

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return <section className="h-full min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Mobile-optimized animated background */}
      
      
      <div className="flex-1 h-full min-h-0 flex flex-col justify-between px-4 py-2 sm:py-6 relative z-10">
        {/* Main content card - mobile optimized to fit viewport */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-5 sm:p-8 mx-2 max-w-md mx-auto w-full">
            {/* Brand and tagline */}
            <div className="text-center mb-5 sm:mb-7">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/lovable-uploads/b98a2f79-9b0f-4589-ac12-2776e4b0e245.png" alt="BetzaFit Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  BetzaFit
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Treinos personalizados por IA para transformar seu corpo
              </p>
            </div>

            {/* Professional validation badge */}
            <div className="mb-5 sm:mb-6 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 text-sm">Validado por Personal Trainers</h3>
                  <p className="text-xs text-green-600">Treinos revisados por profissionais certificados</p>
                </div>
              </div>
            </div>

            {/* Compact features - mobile focused */}
            <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-7">
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Treinos Personalizados</h3>
                  <p className="text-xs sm:text-sm text-slate-600">IA cria treinos únicos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Progresso Detalhado</h3>
                  <p className="text-xs sm:text-sm text-slate-600">Acompanhe sua evolução</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Sistema de Pontos</h3>
                  <p className="text-xs sm:text-sm text-slate-600">Conquistas e motivação</p>
                </div>
              </div>
            </div>

            {/* Action buttons - mobile optimized */}
            <div className="space-y-3">
              {user ? <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-4 text-sm sm:text-base font-semibold hover:opacity-90 transition-all duration-300 shadow-lg" onClick={() => navigate('/dashboard')}>
                  Acessar Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button> : <>
                  
                  
                </>}
            </div>
          </div>
        </div>

        {/* Bottom stats - mobile compact and fixed at bottom */}
        <div className="flex-shrink-0 mt-3 sm:mt-6 px-4">
          <div className="flex justify-center items-center space-x-4 sm:space-x-6 text-xs text-slate-500 bg-white/60 backdrop-blur-sm rounded-xl py-2 sm:py-3 px-3 sm:px-4 mx-auto max-w-xs">
            <div className="text-center">
              <div className="font-semibold text-slate-700 text-sm">1000+</div>
              <div className="text-xs">Usuários</div>
            </div>
            <div className="w-px h-6 bg-slate-300"></div>
            <div className="text-center">
              <div className="font-semibold text-slate-700 text-sm">50k+</div>
              <div className="text-xs">Treinos</div>
            </div>
            <div className="w-px h-6 bg-slate-300"></div>
            <div className="text-center">
              <div className="font-semibold text-slate-700 text-sm">98%</div>
              <div className="text-xs">Satisfação</div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};