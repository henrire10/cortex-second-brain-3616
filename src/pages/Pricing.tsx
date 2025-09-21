import React from 'react';
import { Header } from '@/components/Header';
import { PricingSection } from '@/components/PricingSection';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PricingSection />
    </div>
  );
};

export default Pricing;