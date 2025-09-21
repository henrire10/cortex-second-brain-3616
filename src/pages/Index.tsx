
import React from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { PricingSection } from '@/components/PricingSection';
import { useSearchParams } from 'react-router-dom';

const Index = () => {
  const [searchParams] = useSearchParams();
  const showPricing = searchParams.get('pricing') === 'true';

  if (showPricing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PricingSection />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">
        <HeroSection />
      </main>
    </div>
  );
};

export default Index;
