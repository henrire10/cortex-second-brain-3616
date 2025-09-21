
import React from 'react';

export const FeaturesSection = () => {
  return (
    <section id="sobre" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Por que escolher BiaFitness?
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Tecnologia de ponta para resultados reais
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">IA Personalizada</h3>
            <p className="text-slate-600">
              Nossa inteligência artificial analisa seu perfil e cria treinos únicos para seus objetivos específicos.
            </p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">App Moderno</h3>
            <p className="text-slate-600">
              Interface intuitiva e design moderno para uma experiência de uso excepcional.
            </p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Resultados Comprovados</h3>
            <p className="text-slate-600">
              Metodologia cientificamente comprovada para maximizar seus resultados fitness.
            </p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Acompanhamento Total</h3>
            <p className="text-slate-600">
              Dashboard completo com métricas, progresso e estatísticas detalhadas.
            </p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Gamificação</h3>
            <p className="text-slate-600">
              Sistema de pontos, conquistas e recompensas para manter sua motivação sempre alta.
            </p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">Suporte 24/7</h3>
            <p className="text-slate-600">
              Equipe especializada pronta para ajudar você a alcançar seus objetivos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
